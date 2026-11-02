import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { Group, SRGBColorSpace } from 'three'

const vertex = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
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
  color=mix(vec3(luminance),color,.55)*vec3(.48,.63,.85);
  gl_FragColor=vec4(color*.22,feather*smoothstep(.002,.18,luminance)*opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export default function Cosmos({reduced}:{reduced:boolean}) {
  const group=useRef<Group>(null)
  const [orion,carina]=useTexture(['/assets/space/nebula-orion.jpg','/assets/space/nebula-carina.jpg'])
  const uniforms=useMemo(()=>{
    for(const texture of [orion,carina]){texture.colorSpace=SRGBColorSpace;texture.anisotropy=4}
    return {
      orion:{imageMap:{value:orion},opacity:{value:.2}},
      carina:{imageMap:{value:carina},opacity:{value:.16}},
    }
  },[orion,carina])
  useFrame((state)=>{
    if(group.current && !reduced){
      group.current.rotation.y=Math.sin(state.clock.elapsedTime*.013)*.013
      group.current.rotation.x=Math.cos(state.clock.elapsedTime*.01)*.004
    }
  })
  return <group ref={group}>
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
