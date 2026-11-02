import test from 'node:test'
import assert from 'node:assert/strict'
import { travelProgress, wrapMission } from '../src/motion.ts'

test('journey progress clamps overscroll and reverses along the same path', () => {
  assert.equal(travelProgress(-100, 1000), 0)
  assert.equal(travelProgress(0, 1000), 0)
  assert.equal(travelProgress(675, 1000), 0.5)
  assert.equal(travelProgress(1350, 1000), 1)
  assert.equal(travelProgress(2000, 1000), 1)
  assert.deepEqual([1350, 675, 0].map(y => travelProgress(y, 1000)), [1, 0.5, 0])
  assert.equal(travelProgress(1, 0), 1)
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
