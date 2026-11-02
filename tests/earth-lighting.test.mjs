import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'

test('cloud-shadow projection reaches the cloud shell and follows cloud rotation', () => {
  const radius = 1.003, sun = new Vector3(-0.9, 0.5, 0.3).normalize()
  for (const normal of [sun.clone(), new Vector3(0, 0, 1), new Vector3(0, 1, 0)]) {
    const alongSun = normal.dot(sun)
    const distance = -alongSun + Math.sqrt(alongSun ** 2 + radius ** 2 - 1)
    const hit = normal.clone().addScaledVector(sun, distance)
    assert.ok(distance > 0 && distance < 0.02)
    assert.ok(Math.abs(hit.length() - radius) < 1e-12)
  }
  const uv = point => Math.atan2(point.z, -point.x) / (2 * Math.PI)
  const point = new Vector3(-1, 0, 0), angle = 0.35
  const turned = point.clone().applyAxisAngle(new Vector3(0, 1, 0), angle)
  assert.ok(Math.abs(uv(turned) - angle / (2 * Math.PI) - uv(point)) < 1e-12)
})


test('thin atmosphere has a finite limb peak and no hard outer-ring alpha', () => {
  const radius=1.016
  const path=mu=>{
    const hit=1-radius*radius*(1-mu*mu)
    return hit>0 ? radius*mu-Math.sqrt(hit) : 2*radius*mu
  }
  const limb=Math.sqrt(1-1/(radius*radius))
  assert.equal(path(0),0)
  assert.ok(Math.abs(path(1)-(radius-1))<1e-12)
  assert.ok(path(limb)>path(1)*10)
  for(let step=0;step<=1000;step++)assert.ok(Number.isFinite(path(step/1000))&&path(step/1000)>=0)
})
