export function travelProgress(scroll: number, height: number) {
  return Math.min(1, Math.max(0, scroll / Math.max(1, height * 1.35)))
}
export function wrapMission(index: number, count: number) {
  return ((index % count) + count) % count
}

export function fittedSphereRadius(width: number, height: number, unitsPerPixel: number, distance = 10) {
  const projected = Math.max(1, Math.min(width, height) / 2 - 12) * unitsPerPixel
  return projected * distance / Math.hypot(distance, projected)
}

export function fittedProjectedScale(
  points: readonly { x: number; y: number; z: number }[],
  width: number,
  height: number,
  unitsPerPixel: number,
  centerX = 0,
  centerY = 0,
  distance = 10,
) {
  const halfWidth = Math.max(1, width / 2 - 12) * unitsPerPixel
  const halfHeight = Math.max(1, height / 2 - 12) * unitsPerPixel
  let scale = Infinity
  for (const point of points) {
    // Off-axis perspective moves the silhouette as depth changes during rotation.
    const xLimit = Math.abs(distance * point.x + centerX * point.z) + halfWidth * point.z
    const yLimit = Math.abs(distance * point.y + centerY * point.z) + halfHeight * point.z
    if (xLimit > 0) scale = Math.min(scale, halfWidth * distance / xLimit)
    if (yLimit > 0) scale = Math.min(scale, halfHeight * distance / yLimit)
    if (point.z > 0) scale = Math.min(scale, distance * 0.9 / point.z)
  }
  return Number.isFinite(scale) ? scale : 0
}

export function fittedProjectedPose(
  points: readonly { x: number; y: number; z: number }[],
  width: number,
  height: number,
  unitsPerPixel: number,
  centerX = 0,
  centerY = 0,
  distance = 10,
) {
  const halfWidth = Math.max(1, width / 2 - 12) * unitsPerPixel
  const halfHeight = Math.max(1, height / 2 - 12) * unitsPerPixel
  const left = centerX - halfWidth, right = centerX + halfWidth
  const bottom = centerY - halfHeight, top = centerY + halfHeight
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, depthLimit = Infinity
  for (const point of points) {
    minX = Math.min(minX, point.x + left * point.z / distance)
    maxX = Math.max(maxX, point.x + right * point.z / distance)
    minY = Math.min(minY, point.y + bottom * point.z / distance)
    maxY = Math.max(maxY, point.y + top * point.z / distance)
    if (point.z > 0) depthLimit = Math.min(depthLimit, distance * .9 / point.z)
  }
  const scale = Math.min(halfWidth * 2 / (maxX - minX), halfHeight * 2 / (maxY - minY), depthLimit)
  if (!Number.isFinite(scale) || scale <= 0) return { scale: 0, x: centerX, y: centerY }
  // Translate outside the rotation pivot so an asymmetric silhouette stays centered.
  return { scale, x: centerX - scale * (minX + maxX) / 2, y: centerY - scale * (minY + maxY) / 2 }
}

export function remainingEntrance(start: number, end: number, now: number) {
  return { delay: Math.max(0, start-now), duration: Math.max(0, end-Math.max(start,now)) }
}
