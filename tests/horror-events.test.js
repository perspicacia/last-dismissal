import test from 'node:test';
import assert from 'node:assert/strict';
import { createHorrorEvents } from '../horror-events.js';
import { SchoolAudio } from '../audio.js';

test('presentation events run once per corridor and reset independently', () => {
  const events = createHorrorEvents();
  for (const name of ['key-pickup', 'door-unlock', 'mascot-reveal', 'doll-rise']) {
    assert.equal(events.takeEvent(name), true);
    assert.equal(events.takeEvent(name), false);
  }
  assert.equal(events.takeEvent('unknown'), false);
  events.reset();
  assert.equal(events.takeEvent('mascot-reveal'), true);
  assert.equal(createHorrorEvents().takeEvent('mascot-reveal'), true);
});

test('soft cues use the master output and respect mute/volume', () => {
  const audio = new SchoolAudio();
  const outputs = [], targets = [];
  audio.master = { gain: { setTargetAtTime(...args) { targets.push(args); } } };
  audio.ctx = {
    state: 'running', currentTime: 10,
    createOscillator() {
      return { frequency: {}, connect(destination) { return destination; }, start() {}, stop() {} };
    },
    createGain() {
      return {
        gain: { setValueAtTime() {}, linearRampToValueAtTime(value) { assert.ok(value <= .04); }, exponentialRampToValueAtTime() {} },
        connect(destination) { outputs.push(destination); return this; },
      };
    },
  };
  audio.volume = .2;
  audio.update();
  assert.equal(targets.at(-1)[0], .2);
  audio.muted = true;
  audio.update();
  assert.equal(targets.at(-1)[0], 0);
  for (const name of ['key-pickup', 'door-unlock', 'mascot-reveal', 'doll-rise']) assert.equal(audio.cue(name), true);
  assert.equal(outputs.length, 11);
  assert.ok(outputs.every(output => output === audio.master));
  assert.equal(audio.cue('unknown'), false);
  assert.equal(outputs.length, 11);
});

test('unsupported or suspended audio never blocks presentation events', () => {
  const audio = new SchoolAudio();
  const events = createHorrorEvents();
  assert.equal(events.takeEvent('door-unlock'), true);
  assert.doesNotThrow(() => audio.cue('door-unlock'));
  audio.ctx = { state: 'suspended' };
  assert.doesNotThrow(() => audio.cue('mascot-reveal'));
});

test('restart cancels the ending fade before restoring the ambient bed', async () => {
  const audio = new SchoolAudio();
  const calls = [];
  audio.master = { gain: { cancelScheduledValues(t) { calls.push(['master-cancel', t]); }, value: .5 } };
  audio.ambient = { gain: { cancelScheduledValues(t) { calls.push(['ambient-cancel', t]); }, value: .12 } };
  audio.ctx = { currentTime: 10, async suspend() { calls.push(['suspend']); } };
  await audio.stop();
  assert.equal(audio.master.gain.value, 0);
  assert.equal(audio.ambient.gain.value, .7);
  assert.deepEqual(calls, [['master-cancel', 10], ['ambient-cancel', 10], ['suspend']]);
});
