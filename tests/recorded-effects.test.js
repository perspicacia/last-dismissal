import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {loadRecordedEffects, RECORDED_EFFECTS} from '../recorded-effects.js';
import {SchoolAudio} from '../audio.js';

test('로컬 WAV는 스테레오 PCM이며 종료 전에 잦아들고 피크가 제한된다', async () => {
  for (const [kind, seconds, limit] of [['door-slide', 1.4, .65], ['jumpscare', .88, .85]]) {
    const wav = await readFile(RECORDED_EFFECTS[kind]);
    assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
    assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
    assert.equal(wav.readUInt16LE(20), 1);
    assert.equal(wav.readUInt16LE(22), 2);
    assert.equal(wav.readUInt32LE(24), 48000);
    assert.equal(wav.readUInt16LE(34), 16);
    assert.equal(wav.readUInt32LE(40), seconds * 48000 * 4);
    let peak = 0, energy = 0;
    for (let i = 44; i < wav.length; i += 2) {
      const value = wav.readInt16LE(i) / 32768;
      peak = Math.max(peak, Math.abs(value));
      energy += value * value;
    }
    assert.ok(peak <= limit + .00005);
    assert.ok(energy > 10);
    for (const offset of [44, 46, wav.length - 4, wav.length - 2]) assert.equal(wav.readInt16LE(offset), 0);
  }
});

test('각 파일을 미리 디코딩하고 캐시를 재사용한다', async () => {
  const buffers = new Map(), calls = [];
  const context = {decodeAudioData: async bytes => ({length: bytes.byteLength, duration: .88})};
  const fetcher = async url => {
    calls.push(String(url));
    return {ok: true, arrayBuffer: async () => new ArrayBuffer(8)};
  };
  const result = await loadRecordedEffects(context, buffers, fetcher);
  assert.ok(result.every(item => item.status === 'fulfilled'));
  assert.equal(buffers.size, 2);
  const cached = buffers.get('jumpscare');
  await loadRecordedEffects(context, buffers, fetcher);
  assert.equal(calls.length, 2);
  assert.equal(buffers.get('jumpscare'), cached);
});

test('한 파일이 실패해도 다른 음원은 준비되고 실패한 파일만 다시 읽는다', async () => {
  const buffers = new Map();
  const context = {decodeAudioData: async () => ({length: 800, duration: .1})};
  const failed = await loadRecordedEffects(context, buffers, async url => ({
    ok: String(url).includes('door-creak'), arrayBuffer: async () => new ArrayBuffer(8),
  }));
  assert.deepEqual(failed.map(item => item.status), ['fulfilled', 'rejected']);
  const calls = [];
  await loadRecordedEffects(context, buffers, async url => {
    calls.push(String(url));
    return {ok: true, arrayBuffer: async () => new ArrayBuffer(8)};
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /rabbit-scream\.wav$/);
  assert.equal(buffers.size, 2);
});

test('지원되지 않거나 빈 오디오를 디코딩해도 준비 완료로 저장하지 않는다', async () => {
  for (const decode of [async () => {throw new Error('bad WAV');}, async () => ({length: 0, duration: 0})]) {
    const buffers = new Map();
    const results = await loadRecordedEffects({decodeAudioData: decode}, buffers, async () => ({
      ok: true, arrayBuffer: async () => new ArrayBuffer(8),
    }));
    assert.ok(results.every(item => item.status === 'rejected'));
    assert.equal(buffers.size, 0);
  }
});

function effectAudio() {
  const audio = new SchoolAudio(), sources = [], outputs = [];
  audio.master = {};
  audio.ctx = {
    state: 'running', currentTime: 0, sampleRate: 8000,
    createBuffer: (_, count) => ({getChannelData: () => new Float32Array(count)}),
    createGain: () => ({gain: {}, connect: output => outputs.push(output), disconnect() {}}),
    createBufferSource() {
      const source = {connect() {}, start() {this.started = true;}, stop() {this.stopped = true;}, disconnect() {this.disconnected = true;}};
      sources.push(source);
      return source;
    },
    decodeAudioData: async bytes => ({length: bytes.byteLength, duration: .88}),
  };
  return {audio, sources, outputs};
}

test('녹음 음원은 master·음소거·단발 재생·종료 정리를 유지한다', () => {
  const {audio, sources, outputs} = effectAudio(), cues = [];
  const recording = {length: 7040, duration: .88};
  audio.recordedBuffers.set('jumpscare', recording);
  audio.onEffect = (kind, details) => cues.push([kind, details.source]);
  audio.muted = true;
  assert.equal(audio.jumpscare(), false);
  audio.muted = false;
  assert.equal(audio.jumpscare(), true);
  assert.equal(sources[0].buffer, recording);
  assert.deepEqual(cues, [['jumpscare', 'recording']]);
  assert.ok(outputs.every(output => output === audio.master));
  audio.clearEffects();
  assert.ok(sources[0].stopped && sources[0].disconnected);
  audio.volume = 0;
  assert.equal(audio.jumpscare(), false);
  audio.volume = .5;
  audio.ctx.state = 'suspended';
  assert.equal(audio.jumpscare(), false);
});

test('로딩 중에는 합성음으로 대체하고 늦은 완료가 지난 효과음을 재생하지 않는다', async () => {
  const {audio, sources} = effectAudio();
  let resolveFetch;
  const response = new Promise(resolve => {resolveFetch = resolve;});
  const loading = audio.loadEffectFiles(() => response);
  assert.equal(audio.loadEffectFiles(() => {throw new Error('duplicate load');}), loading);
  assert.equal(audio.jumpscare(), true);
  assert.equal(audio.recordedBuffers.size, 0);
  audio.clearEffects();
  audio.ctx.state = 'suspended';
  resolveFetch({ok: true, arrayBuffer: async () => new ArrayBuffer(8)});
  await loading;
  assert.equal(audio.recordedBuffers.size, 2);
  assert.equal(sources.length, 1);
  assert.equal(audio.effects.size, 0);
  assert.equal(audio.ctx.state, 'suspended');
  audio.ctx.state = 'running';
  assert.equal(audio.jumpscare(), true);
  assert.equal(sources[1].buffer, audio.recordedBuffers.get('jumpscare'));
});
