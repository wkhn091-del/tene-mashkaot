/** Shared timeline math for the hero pour (used by the 3D scene and the SVG poster). */

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Bottle tilt amount (0 upright, 1 fully pouring) across one pour cycle t∈[0,1]. */
export function tiltCurve(t: number): number {
  return smoothstep(0, 0.28, t) * (1 - smoothstep(0.78, 1, t));
}

/** Portion of a pour cycle's liquid that has reached the glass. */
export function fillCurve(t: number): number {
  return smoothstep(0.26, 0.8, t);
}

/** Glass level reached at the end of the pour (0–1 of the bowl). */
export const FILL_MAX = 0.88;

/** When the pour stage puts its copy beside the scene instead of above it (see `stage-side` in globals.css). */
export const STAGE_SIDE_QUERY = '(min-width: 48rem) and (min-aspect-ratio: 4/3)';

/** Share of the scroll spent flying the camera from the doorway to the bar before the pour starts. */
export const INTRO_END = 0.3;

/** Pour-cycle progress (0–1) for a section scroll progress. */
export function pourProgress(scrollT: number): number {
  return clamp01((scrollT - INTRO_END) / (1 - INTRO_END));
}

/** Camera fly-in: the room first, then the bar; the pour starts once the camera has arrived. */
export function pourState(scrollT: number) {
  const p = pourProgress(scrollT);
  const fill = FILL_MAX * fillCurve(p);
  const tilt = tiltCurve(p);
  const pouring = tilt > 0.92 && p > 0.26 && p < 0.8;
  const intro = smoothstep(0, INTRO_END, scrollT);
  return { fill, tilt, pouring, intro };
}
