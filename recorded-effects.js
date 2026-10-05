// Local recordings replace the door/rabbit synthesis after decoding. Loading
// never schedules playback: an expired cue cannot arrive late after a restart.
export const RECORDED_EFFECTS = Object.freeze({
  'door-slide': new URL('./assets/audio/door-creak.wav', import.meta.url),
  jumpscare: new URL('./assets/audio/rabbit-scream.wav', import.meta.url),
});

export async function loadRecordedEffects(context, buffers, fetcher = globalThis.fetch) {
  return Promise.allSettled(Object.entries(RECORDED_EFFECTS).map(async ([kind, url]) => {
    if (buffers.has(kind)) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetcher(url, {signal: controller.signal});
      if (!response.ok) throw new Error(`Sound file unavailable: ${kind}`);
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      if (!buffer.length || !Number.isFinite(buffer.duration) || buffer.duration <= 0) {
        throw new Error(`Empty sound file: ${kind}`);
      }
      buffers.set(kind, buffer);
    } finally {
      clearTimeout(timeout);
    }
  }));
}
