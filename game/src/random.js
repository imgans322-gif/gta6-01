// Deterministic seeded RNG (mulberry32) so screenshot scenes and city layout are reproducible.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  return function nextRandom() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function randRange(rng, min, max) { return min + rng() * (max - min); }
export function randInt(rng, min, max) { return Math.floor(randRange(rng, min, max + 1)); }
export function pick(rng, list) { return list[Math.floor(rng() * list.length) % list.length]; }
export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
export function angleLerp(a, b, t) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
