import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Group, Matrix3, Mesh, SRGBColorSpace, Vector3 } from 'three'

type EarthProps = { position?: [number, number, number]; scale?: number; reducedMotion?: boolean }

const vertex = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalNormal;
void main() {
  vUv = uv;
  vLocalNormal = normalize(position);
  vNormal = normalize(mat3(modelMatrix) * normal);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`

const surfaceFragment = `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D waterMask;
uniform sampler2D cloudMap;
uniform vec3 sunDirection;
uniform mat3 worldToGlobe;
uniform float cloudRotation;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vLocalNormal;
void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float sun = dot(n, sunDirection);
  vec3 day = texture2D(dayMap, vUv).rgb;
  vec3 night = texture2D(nightMap, vUv).rgb;
  float daylight = smoothstep(-0.08, 0.10, sun);
  float ocean = texture2D(waterMask, vUv).r;
  float luminance = dot(day, vec3(0.2126, 0.7152, 0.0722));
  day = mix(day, vec3(luminance), 0.10 * (1.0 - ocean));
  // Lift NASA's near-black water base just enough to retain deep blue under directional light.
  day = mix(day, vec3(0.006, 0.024, 0.060), ocean * 0.68);
  vec3 localSun = normalize(worldToGlobe * sunDirection);
  vec3 localNormal = normalize(vLocalNormal);
  float alongSun = dot(localNormal, localSun);
  float cloudDistance = -alongSun + sqrt(alongSun * alongSun + 1.003 * 1.003 - 1.0);
  vec3 cloudPoint = normalize(localNormal + cloudDistance * localSun);
  vec2 shadowUv = vec2(fract(atan(cloudPoint.z, -cloudPoint.x) / 6.2831853 - cloudRotation / 6.2831853), asin(clamp(cloudPoint.y, -1.0, 1.0)) / 3.14159265 + 0.5);
  float cloudDensity = texture2D(cloudMap, shadowUv).r * 0.5
    + texture2D(cloudMap, shadowUv + vec2(0.0005, 0.00025)).r * 0.25
    + texture2D(cloudMap, shadowUv - vec2(0.0005, 0.00025)).r * 0.25;
  float cloudShadow = smoothstep(0.08, 0.92, cloudDensity);
  float directLight = max(sun, 0.0) * 0.90 * (1.0 - cloudShadow * 0.34);
  vec3 color = day * (0.002 + directLight);
  float lights = smoothstep(0.02, 0.23, max(night.r, max(night.g, night.b)));
  color += night * lights * (1.0 - smoothstep(-0.16, 0.02, sun)) * 0.40;
  vec3 halfDirection = normalize(sunDirection + viewDirection);
  float glint = pow(max(dot(n, halfDirection), 0.0), 56.0);
  float fresnel = 0.02 + 0.98 * pow(1.0 - max(dot(viewDirection, halfDirection), 0.0), 5.0);
  color += vec3(0.62, 0.75, 0.88) * glint * fresnel * ocean * daylight * 0.11;
  float rim = pow(1.0 - max(dot(n, viewDirection), 0.0), 2.8);
  color = mix(color, vec3(0.015, 0.047, 0.095), rim * daylight * 0.12);
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
  float light = 0.003 + max(sun, 0.0) * 0.94;
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
  float mu = max(dot(n, eye), 0.0);
  // Ray length through a thin shell vanishes at the outer edge and peaks above the ground limb.
  float radius = 1.016;
  float groundHit = 1.0 - radius * radius * (1.0 - mu * mu);
  float path = groundHit > 0.0
    ? radius * mu - sqrt(groundHit)
    : 2.0 * radius * mu;
  float sunlight = smoothstep(-0.16, 0.42, dot(n, sunDirection));
  float phase = 0.75 * (1.0 + pow(dot(eye, sunDirection), 2.0));
  float scatter = (1.0 - exp(-max(path, 0.0) * 3.8)) * sunlight * 0.64;
  gl_FragColor = vec4(vec3(0.018, 0.15, 0.48) * phase, scatter);
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
    const sunDirection = { value: new Vector3(-0.45, 0.8, 0.1).normalize() }
    return {
      surface: { dayMap: { value: day }, nightMap: { value: night }, waterMask: { value: water }, cloudMap: { value: cloud }, sunDirection, worldToGlobe: { value: new Matrix3() }, cloudRotation: { value: 0 } },
      clouds: { cloudMap: { value: cloud }, sunDirection },
      atmosphere: { sunDirection },
    }
  }, [day, night, cloud, water])

  useFrame((_, delta) => {
    const step = Math.min(delta, 0.05)
    if (!reducedMotion) {
      if (globe.current) globe.current.rotation.y += step * 0.0015
      if (clouds.current) clouds.current.rotation.y += step * 0.001
    }
    if (globe.current) {
      globe.current.updateWorldMatrix(true, false)
      uniforms.surface.worldToGlobe.value.setFromMatrix4(globe.current.matrixWorld).invert()
      uniforms.surface.cloudRotation.value = clouds.current?.rotation.y ?? 0
    }
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
      <mesh scale={1.016}>
        <sphereGeometry args={[1, 96, 64]} />
        <shaderMaterial vertexShader={vertex} fragmentShader={atmosphereFragment} uniforms={uniforms.atmosphere} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}
