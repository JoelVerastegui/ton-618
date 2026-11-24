// PRNG con semilla (mulberry32): hace reproducibles la textura del disco y el cielo.
export function makeRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 1831565813) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
