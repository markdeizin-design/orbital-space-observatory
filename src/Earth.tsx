import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Group, Mesh, SRGBColorSpace, Vector3 } from 'three'

type EarthProps = { position?: [number, number, number]; scale?: number; reducedMotion?: boolean }

const vertex = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vUv = uv;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

const surfaceFragment = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D waterMask;
uniform vec3 sunDirection;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float sun = dot(n, sunDirection);
  vec3 day = texture2D(dayMap, vUv).rgb;
  vec3 night = texture2D(nightMap, vUv).rgb;
  float daylight = smoothstep(-0.06, 0.12, sun);
  float ocean = texture2D(waterMask, vUv).r;
  float luminance = dot(day, vec3(0.2126, 0.7152, 0.0722));
  day = mix(day, vec3(luminance), 0.10 * (1.0 - ocean));
  // NASA's base map has uniform near-black deep water; balance its blue for daylight exposure.
  day = mix(day, vec3(0.015, 0.055, 0.13), ocean * 0.88);
  vec3 color = day * (0.009 + max(sun, 0.0));
  float lights = smoothstep(0.02, 0.23, max(night.r, max(night.g, night.b)));
  color += night * lights * (1.0 - daylight) * 0.65;
  vec3 halfDirection = normalize(sunDirection + viewDirection);
  float glint = pow(max(dot(n, halfDirection), 0.0), 28.0);
  color += vec3(0.62, 0.75, 0.88) * glint * ocean * daylight * 0.018;
  float rim = pow(1.0 - max(dot(n, viewDirection), 0.0), 2.8);
  color = mix(color, vec3(0.035, 0.095, 0.18), rim * daylight * 0.18);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const cloudFragment = `
uniform sampler2D cloudMap;
uniform vec3 sunDirection;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  float density = texture2D(cloudMap, vUv).r;
  float sun = dot(normalize(vNormal), sunDirection);
  float light = 0.018 + max(sun, 0.0) * 1.12;
  vec3 color = vec3(0.92, 0.96, 1.0) * light;
  gl_FragColor = vec4(color, smoothstep(0.04, 0.95, density) * 0.94);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const atmosphereFragment = `
uniform vec3 sunDirection;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
void main() {
  vec3 n = normalize(vNormal);
  vec3 eye = normalize(cameraPosition - vPosition);
  float rim = pow(1.0 - max(dot(n, eye), 0.0), 5.5);
  float sun = smoothstep(-0.25, 0.65, dot(n, sunDirection));
  gl_FragColor = vec4(vec3(0.12, 0.35, 0.66), rim * sun * 0.12);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export default function Earth({ position = [0, 0, 0], scale = 1, reducedMotion = false }: EarthProps) {
  const globe = useRef<Group>(null)
  const clouds = useRef<Mesh>(null)
  const gl = useThree(state => state.gl)
  const [compact] = useState(() => window.innerWidth < 700 || gl.capabilities.maxTextureSize < 8192)
  const [day, night, cloud, water] = useTexture([
    compact ? '/assets/earth/day-4k.jpg' : '/assets/earth/day.jpg',
    '/assets/earth/night.jpg',
    compact ? '/assets/earth/clouds-2k.jpg' : '/assets/earth/clouds.jpg',
    '/assets/earth/water-mask.png',
  ])
  const uniforms = useMemo(() => {
    day.colorSpace = night.colorSpace = SRGBColorSpace
    day.anisotropy = cloud.anisotropy = water.anisotropy = 8
    const sunDirection = { value: new Vector3(-0.35, 0.5, 1).normalize() }
    return {
      surface: { dayMap: { value: day }, nightMap: { value: night }, waterMask: { value: water }, sunDirection },
      clouds: { cloudMap: { value: cloud }, sunDirection },
      atmosphere: { sunDirection },
    }
  }, [day, night, cloud, water])

  useFrame((_, delta) => {
    if (reducedMotion) return
    const step = Math.min(delta, 0.05)
    if (globe.current) globe.current.rotation.y += step * 0.008
    if (clouds.current) clouds.current.rotation.y += step * 0.002
  })

  return (
    <group position={position} scale={scale} rotation={[0, 0, 0.09]}>
      <group ref={globe} rotation={[0.12, -2.2, 0]}>
        <mesh>
          <sphereGeometry args={[1, 96, 64]} />
          <shaderMaterial vertexShader={vertex} fragmentShader={surfaceFragment} uniforms={uniforms.surface} />
        </mesh>
        <mesh ref={clouds} scale={1.003}>
          <sphereGeometry args={[1, 96, 64]} />
          <shaderMaterial vertexShader={vertex} fragmentShader={cloudFragment} uniforms={uniforms.clouds} transparent depthWrite={false} />
        </mesh>
      </group>
      <mesh scale={1.012}>
        <sphereGeometry args={[1, 96, 64]} />
        <shaderMaterial vertexShader={vertex} fragmentShader={atmosphereFragment} uniforms={uniforms.atmosphere} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
