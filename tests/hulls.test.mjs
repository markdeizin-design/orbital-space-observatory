import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

test('offline hulls match the shipped GLBs and their unit-sphere normalization', async () => {
  const hulls = JSON.parse(await readFile(new URL('../src/model-hulls.json', import.meta.url), 'utf8'))
  assert.deepEqual(Object.keys(hulls), ['james-webb', 'hubble', 'fermi'])
  for (const [id, hull] of Object.entries(hulls)) {
    const model = await readFile(new URL(`../public/assets/models/${id}.glb`, import.meta.url))
    assert.equal(hull.sourceSha256, createHash('sha256').update(model).digest('hex'), `${id}: regenerate hull after model changes`)
    assert.ok(hull.radius > 0 && hull.center.length === 3 && hull.center.every(Number.isFinite))
    assert.ok(hull.points.length >= 4 && hull.points.length < 500, `${id}: runtime point budget`)
    assert.ok(hull.maximumOutside < 4e-9, `${id}: offline full-vertex containment validation`)
    for (const point of hull.points) {
      assert.ok(point.length === 3 && point.every(Number.isFinite))
      assert.ok(Math.hypot(...point) <= 1.000001, `${id}: normalization no longer matches bounding sphere`)
    }
  }
})
