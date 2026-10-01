// One-shot presentation events, independent of progression and audio support.
// Reset on entering a corridor, starting a game, or restarting.
export function createHorrorEvents() {
  const played = new Set();
  const supported = new Set(['key-pickup', 'door-unlock', 'mascot-reveal']);
  return {
    takeEvent(name) {
      if (!supported.has(name) || played.has(name)) return false;
      played.add(name);
      return true;
    },
    reset() { played.clear(); },
  };
}
