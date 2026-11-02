import test from 'node:test'
import assert from 'node:assert/strict'
import { cometProgress } from '../src/cosmos-motion.ts'

test('distant comet crosses for six seconds with a long quiet interval', () => {
  assert.equal(cometProgress(0), null)
  assert.equal(cometProgress(9.99), null)
  assert.equal(cometProgress(10), 0)
  assert.equal(cometProgress(13), .5)
  assert.equal(cometProgress(16), null)
  assert.equal(cometProgress(51), null)
  assert.equal(cometProgress(55), .5)
  for (let time=0;time<126;time+=.1) {
    const progress=cometProgress(time)
    assert.ok(progress===null || progress>=0 && progress<1)
  }
})
