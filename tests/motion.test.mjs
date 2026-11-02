import test from 'node:test'
import assert from 'node:assert/strict'
import { travelProgress, wrapMission, fittedProjectedScale, fittedSphereRadius, fittedProjectedPose, remainingEntrance } from '../src/motion.ts'
import { Euler, Vector3 } from 'three'

test('journey progress clamps overscroll and reverses along the same path', () => {
  assert.equal(travelProgress(-100, 1000), 0)
  assert.equal(travelProgress(0, 1000), 0)
  assert.equal(travelProgress(675, 1000), 0.5)
  assert.equal(travelProgress(1350, 1000), 1)
  assert.equal(travelProgress(2000, 1000), 1)
  assert.deepEqual([1350, 675, 0].map(y => travelProgress(y, 1000)), [1, 0.5, 0])
  assert.equal(travelProgress(1, 0), 1)
})

test('projected fitting fills depth-heavy models and contains every rotated bounding-box corner', () => {
  const width = 500, height = 250, unitsPerPixel = 0.01, distance = 10
  const centerX = -2.5, centerY = -1.3
  const corners = []
  const radius = Math.hypot(27.3971, 12.0045, 14.7734) / 2
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    corners.push(new Vector3(x * 27.3971 / 2, y * 12.0045 / 2, z * 14.7734 / 2).divideScalar(radius))
  }
  const rotations = [[.22, -1.12, .12]]
  for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) rotations.push([x, y, x * .4])
  let initialScale
  for (const angles of rotations) {
    const points = corners.map(point => point.clone().applyEuler(new Euler(...angles)))
    const scale = fittedProjectedScale(points, width, height, unitsPerPixel, centerX, centerY, distance)
    initialScale ??= scale
    assert.ok(Number.isFinite(scale) && scale > 0)
    for (const point of points) {
      const depth = distance - point.z * scale
      assert.ok(depth > 0)
      const x = ((centerX + point.x * scale) * distance / depth - centerX) / unitsPerPixel
      const y = ((centerY + point.y * scale) * distance / depth - centerY) / unitsPerPixel
      assert.ok(Math.abs(x) <= width / 2 - 12 + 1e-8, `horizontal overflow at ${angles}`)
      assert.ok(Math.abs(y) <= height / 2 - 12 + 1e-8, `vertical overflow at ${angles}`)
    }
  }
  assert.ok(initialScale > fittedSphereRadius(width, height, unitsPerPixel) * 1.3)
})

test('rapid next/previous choices and gallery wrap stay within their item count', () => {
  for (const count of [3, 9]) {
    assert.equal(wrapMission(-1, count), count - 1)
    assert.equal(wrapMission(count, count), 0)
    assert.equal(wrapMission(-count * 100, count), 0)
    for (let index = -100; index <= 100; index++) {
      const wrapped = wrapMission(index, count)
      assert.ok(wrapped >= 0 && wrapped < count)
      assert.equal(wrapMission(wrapped + 1, count), wrapMission(index + 1, count))
    }
  }
})

test('projected pose centers asymmetric silhouettes and fully uses the available frame', () => {
  const width = 500, height = 250, unitsPerPixel = .01, centerX = -2.5, centerY = -1.3, distance = 10
  const points = []
  for (const x of [-.9, .9]) for (const y of [-.4, .4]) for (const z of [-.5, .5]) points.push(new Vector3(x, y, z))
  for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) {
    const rotated = points.map(point => point.clone().applyEuler(new Euler(x, y, x * .4)))
    const pose = fittedProjectedPose(rotated, width, height, unitsPerPixel, centerX, centerY, distance)
    const projected = rotated.map(point => ({
      x: ((pose.x + point.x * pose.scale) * distance / (distance - point.z * pose.scale) - centerX) / unitsPerPixel,
      y: ((pose.y + point.y * pose.scale) * distance / (distance - point.z * pose.scale) - centerY) / unitsPerPixel,
    }))
    for (const point of projected) {
      assert.ok(Math.abs(point.x) <= width / 2 - 12 + 1e-8)
      assert.ok(Math.abs(point.y) <= height / 2 - 12 + 1e-8)
    }
    const spanX = Math.max(...projected.map(p => p.x)) - Math.min(...projected.map(p => p.x))
    const spanY = Math.max(...projected.map(p => p.y)) - Math.min(...projected.map(p => p.y))
    assert.ok(Math.max(spanX / (width - 24), spanY / (height - 24)) > .9999)
  }
})

test('layout retarget preserves entrance delay and arrival deadline', () => {
  assert.deepEqual(remainingEntrance(1,4,.25), {delay:.75,duration:3})
  assert.deepEqual(remainingEntrance(1,4,2), {delay:0,duration:2})
  assert.deepEqual(remainingEntrance(1,4,5), {delay:0,duration:0})
  assert.deepEqual(remainingEntrance(2,2,2), {delay:0,duration:0})
})
