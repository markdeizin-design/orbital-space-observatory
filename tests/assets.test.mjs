import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { missions } from '../src/missions.ts'

const publicRoot = new URL('../public/', import.meta.url)
const asset = path => new URL(path.replace(/^\//, ''), publicRoot)

function readGlb(bytes) {
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF')
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.equal(bytes.readUInt32LE(8), bytes.length)
  const jsonLength = bytes.readUInt32LE(12)
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a)
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength))
  const binOffset = 20 + jsonLength
  assert.equal(bytes.readUInt32LE(binOffset + 4), 0x004e4942)
  assert.equal(binOffset + 8 + bytes.readUInt32LE(binOffset), bytes.length)
  return json
}

test('all three optimized NASA models are self-contained and bounded in draw calls', async () => {
  assert.deepEqual(missions.map(m => m.id), ['james-webb', 'hubble', 'fermi'])
  for (const mission of missions) {
    const glb = readGlb(await readFile(asset(mission.model)))
    assert.equal(glb.asset.version, '2.0')
    assert.ok(glb.extensionsUsed.includes('KHR_draco_mesh_compression'))
    assert.ok(glb.buffers.every(buffer => !buffer.uri), `${mission.id}: external buffer`)
    assert.ok((glb.images ?? []).every(image => image.bufferView !== undefined && !image.uri), `${mission.id}: external image`)
    const primitives = glb.meshes.flatMap(mesh => mesh.primitives)
    assert.ok(primitives.length > 0 && primitives.length < 100, `${mission.id}: draw-call budget`)
    assert.ok(primitives.every(p => glb.accessors[p.attributes.POSITION].count > 0))
    assert.ok(primitives.some(p => p.indices !== undefined), `${mission.id}: indexed 3D geometry`)
    for (const view of glb.bufferViews) {
      assert.ok((view.byteOffset ?? 0) + view.byteLength <= glb.buffers[view.buffer].byteLength)
    }
  }
})

test('Draco decoding and Earth maps are local and nonempty', async () => {
  for (const path of [
    '/assets/draco/draco_decoder.wasm', '/assets/draco/draco_wasm_wrapper.js',
    '/assets/draco/draco_decoder.js', '/assets/draco/LICENSE.txt',
    '/assets/earth/day.jpg', '/assets/earth/night.jpg', '/assets/earth/clouds.jpg',
  ]) assert.ok((await stat(asset(path))).size > 0, path)
})

test('model audit matches shipped files and Hubble retains its photographic PBR maps', async () => {
  const report = JSON.parse(await readFile(new URL('../model-report.json', import.meta.url), 'utf8'))
  for (const mission of missions) {
    const bytes = await readFile(asset(mission.model))
    const glb = readGlb(bytes)
    assert.equal(report[mission.id].optimized.bytes, bytes.length, `${mission.id}: stale size audit`)
    assert.equal(report[mission.id].optimized.draws, glb.meshes.reduce((count, mesh) => count + mesh.primitives.length, 0), `${mission.id}: stale draw-call audit`)
  }
  const hubble = readGlb(await readFile(asset('/assets/models/hubble.glb')))
  assert.ok(hubble.materials.some(material => material.normalTexture), 'Hubble foil normal map missing')
  assert.ok(hubble.materials.some(material => material.pbrMetallicRoughness?.baseColorTexture), 'Hubble photo atlas missing')
  assert.match(report.hubble.credit, /VTAD/)
})

test('all gallery and explorer images exist with captions, credits and official sources', async () => {
  const official = host => host === 'nasa.gov' || host.endsWith('.nasa.gov') || host === 'esa.int' || host.endsWith('.esa.int') || host.endsWith('.stsci.edu')
  for (const mission of missions) {
    assert.ok(official(new URL(mission.source).hostname))
    assert.ok(mission.description && mission.construction && mission.science && mission.achievement)
    assert.ok((await stat(asset(mission.image))).size > 1000, mission.image)
    assert.ok(mission.images.length >= 3, mission.id)
    for (const image of mission.images) {
      assert.ok(image.title && image.caption && image.credit && image.kind, image.src)
      assert.ok(official(new URL(image.source).hostname), image.source)
      assert.ok((await stat(asset(image.src))).size > 1000, fileURLToPath(asset(image.src)))
    }
  }
  assert.match(missions[0].location, /L2/)
  assert.ok(missions.slice(1).every(m => /околоземная/.test(m.location)))
})
