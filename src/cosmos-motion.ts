export function cometProgress(elapsed: number) {
  const phase = (elapsed + 32) % 42
  return phase < 6 ? phase / 6 : null
}
