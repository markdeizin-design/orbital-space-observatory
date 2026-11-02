import test from 'node:test'
import assert from 'node:assert/strict'
import config from '../vite.config.ts'

test('Pages prefixes asset and link URLs without rewriting route comparisons', () => {
  const code="const route=path.startsWith('/telescopes/'); const id=path.slice('/telescopes/'.length); const model='/assets/models/webb.glb'; const link=<a href={`/telescopes/${id}`}>; const home=<a href=\"/\">; const credits=<a href=\"/credits.txt\">"
  const transformed=config.plugins[0].transform(code,'/src/App.tsx')
  assert.ok(transformed.includes("path.startsWith('/telescopes/')"))
  assert.ok(transformed.includes("path.slice('/telescopes/'.length)"))
  assert.ok(transformed.includes("'/orbital-space-observatory/assets/models/webb.glb'"))
  assert.ok(transformed.includes('href={`/orbital-space-observatory/telescopes/${id}`'))
  assert.ok(transformed.includes('href="/orbital-space-observatory/"'))
  assert.ok(transformed.includes('href="/orbital-space-observatory/credits.txt"'))
})
