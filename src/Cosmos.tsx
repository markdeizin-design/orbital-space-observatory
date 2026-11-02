import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { BackSide, Group, SRGBColorSpace } from 'three'

const vertex = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`
const skyFragment = `
uniform sampler2D skyMap;
varying vec2 vUv;
void main(){
  vec3 color=texture2D(skyMap,vUv).rgb;
  color=mix(vec3(dot(color,vec3(.2126,.7152,.0722))),color,1.12);
  gl_FragColor=vec4(color*.54,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
const nebulaFragment = `
uniform sampler2D imageMap;
uniform float opacity;
varying vec2 vUv;
void main(){
  vec3 color=texture2D(imageMap,vUv).rgb;
  vec2 edge=abs(vUv-.5)*2.;
  float feather=(1.-smoothstep(.3,1.,edge.x))*(1.-smoothstep(.3,1.,edge.y));
  float luminance=dot(color,vec3(.2126,.7152,.0722));
  gl_FragColor=vec4(color*.6,feather*smoothstep(.002,.18,luminance)*opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export default function Cosmos({reduced}:{reduced:boolean}) {
  const group=useRef<Group>(null)
  const [sky,orion,carina]=useTexture(['/assets/space/milky-way.jpg','/assets/space/nebula-orion.jpg','/assets/space/nebula-carina.jpg'])
  const uniforms=useMemo(()=>{
    for(const texture of [sky,orion,carina]){texture.colorSpace=SRGBColorSpace;texture.anisotropy=4}
    return {
      sky:{skyMap:{value:sky}},
      orion:{imageMap:{value:orion},opacity:{value:.55}},
      carina:{imageMap:{value:carina},opacity:{value:.38}},
    }
  },[sky,orion,carina])
  useFrame((state)=>{
    if(group.current && !reduced){
      group.current.rotation.y=Math.sin(state.clock.elapsedTime*.013)*.013
      group.current.rotation.x=Math.cos(state.clock.elapsedTime*.01)*.004
    }
  })
  return <group ref={group}>
    <group rotation={[0,0,.38]}><mesh rotation={[0,Math.PI/2,0]} renderOrder={-20}>
      <sphereGeometry args={[170,64,32]}/>
      <shaderMaterial side={BackSide} vertexShader={vertex} fragmentShader={skyFragment} uniforms={uniforms.sky} depthWrite={false}/>
    </mesh></group>
    {/* These distant observational images form an artistic exhibition backdrop, not a sky-coordinate chart. */}
    <mesh position={[-63,32,-110]} rotation={[0,.12,-.38]} renderOrder={-10}>
      <planeGeometry args={[112,83]}/>
      <shaderMaterial vertexShader={vertex} fragmentShader={nebulaFragment} uniforms={uniforms.orion} transparent depthWrite={false}/>
    </mesh>
    <mesh position={[60,36,-125]} rotation={[0,-.15,.2]} renderOrder={-10}>
      <planeGeometry args={[98,76]}/>
      <shaderMaterial vertexShader={vertex} fragmentShader={nebulaFragment} uniforms={uniforms.carina} transparent depthWrite={false}/>
    </mesh>
  </group>
}
