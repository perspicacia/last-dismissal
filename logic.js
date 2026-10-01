export const anomalies = ['door', 'board', 'window', 'clock', 'figure'];
export const demoSequence = [null, 'door', 'board', null, 'figure'];
export function newGame(demo = false) { return { demo, tutorial: true, progress: 0, attempts: 0, anomaly: null, previous: null, ended: false }; }
export function nextAnomaly(state, random = Math.random) {
  if (state.demo) return demoSequence[state.progress];
  if (random() < .35) return null;
  const pool = anomalies.filter(a => a !== state.previous);
  return pool[Math.floor(random() * pool.length)];
}
export function choose(state, up, random = Math.random) {
  if (state.ended) return state;
  if (state.tutorial) return { ...state, tutorial: false, anomaly: nextAnomaly(state, random), correct: null };
  const correct = up === Boolean(state.anomaly);
  const progress = correct ? state.progress + 1 : 0;
  const next = { ...state, correct, progress, attempts: state.attempts + 1, previous: state.anomaly, ended: progress === 5 };
  return { ...next, anomaly: next.ended ? null : nextAnomaly(next, random) };
}
