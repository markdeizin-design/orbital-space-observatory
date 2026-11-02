export function travelProgress(scroll: number, height: number) {
  return Math.min(1, Math.max(0, scroll / Math.max(1, height * 1.35)))
}
export function wrapMission(index: number, count: number) {
  return ((index % count) + count) % count
}
