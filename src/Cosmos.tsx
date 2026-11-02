import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, Group, Mesh, ShaderMaterial, SRGBColorSpace } from 'three'
import { cometProgress } from './cosmos-motion'

const vertex = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`
const nebulaFragment = `
uniform sampler2D imageMap;
uniform float opacity;
uniform float time;
uniform float phase;
varying vec2 vUv;
void main(){
  vec3 color=texture2D(imageMap,vUv).rgb;
  vec2 edge=abs(vUv-.5)*2.;
  float feather=(1.-smoothstep(.3,1.,edge.x))*(1.-smoothstep(.3,1.,edge.y));
  float luminance=dot(color,vec3(.2126,.7152,.0722));
  vec2 core=vUv-vec2(.54,.46);
  float glow=exp(-dot(core,core)*9.)*smoothstep(.02,.3,luminance);
  float breathing=1.+glow*.12*sin(time*(.067+phase*.011)+phase+vUv.x*2.);
  color=mix(vec3(luminance),color,.55)*vec3(.48,.63,.85);
  gl_FragColor=vec4(color*.24*breathing,feather*smoothstep(.002,.18,luminance)*opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
const cometFragment = `
uniform float opacity;
varying vec2 vUv;
void main(){
  float across=(vUv.y-.5)*6.;
  float tail=exp(-across*across)*pow(vUv.x,2.)*(1.-smoothstep(.78,.9,vUv.x));
  vec2 head=(vUv-vec2(.86,.5))*vec2(26.,2.8);
  float nucleus=exp(-dot(head,head)*3.);
  float alpha=(tail*.25+nucleus*.8)*opacity;
  gl_FragColor=vec4(mix(vec3(.43,.62,.8),vec3(.9,.96,1.),nucleus),alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export default function Cosmos({reduced}:{reduced:boolean}) {
  const group=useRef<Group>(null),comet=useRef<Mesh>(null),cometMaterial=useRef<ShaderMaterial>(null)
  const [orion,carina]=useTexture(['/assets/space/nebula-orion.jpg','/assets/space/nebula-carina.jpg'])
  const uniforms=useMemo(()=>{
    for(const texture of [orion,carina]){texture.colorSpace=SRGBColorSpace;texture.anisotropy=4}
    return {
      orion:{imageMap:{value:orion},opacity:{value:.2},time:{value:0},phase:{value:0}},
      carina:{imageMap:{value:carina},opacity:{value:.16},time:{value:0},phase:{value:2.4}},
      comet:{opacity:{value:0}},
    }
  },[orion,carina])
  useFrame((state)=>{
    const time=state.clock.elapsedTime
    if(group.current && !reduced){
      group.current.rotation.y=Math.sin(time*.013)*.013
      group.current.rotation.x=Math.cos(time*.01)*.004
      uniforms.orion.time.value=uniforms.carina.time.value=time
    }
    if(comet.current && cometMaterial.current){
      const progress=reduced?null:cometProgress(time)
      comet.current.visible=progress!==null
      if(progress!==null){
        comet.current.position.set(18+progress*14,25-progress*3,-78)
        cometMaterial.current.uniforms.opacity.value=Math.sin(progress*Math.PI)**2
      }
    }
  })
  return <group ref={group}>
    {/* These distant observations and rare comet passes form an artistic backdrop, not a sky-coordinate chart. */}
    <mesh position={[-63,32,-110]} rotation={[0,.12,-.38]} renderOrder={-10}>
      <planeGeometry args={[112,83]}/>
      <shaderMaterial vertexShader={vertex} fragmentShader={nebulaFragment} uniforms={uniforms.orion} transparent depthWrite={false}/>
    </mesh>
    <mesh position={[60,36,-125]} rotation={[0,-.15,.2]} renderOrder={-10}>
      <planeGeometry args={[98,76]}/>
      <shaderMaterial vertexShader={vertex} fragmentShader={nebulaFragment} uniforms={uniforms.carina} transparent depthWrite={false}/>
    </mesh>
    <mesh ref={comet} visible={false} position={[18,25,-78]} rotation={[0,0,-.21]}>
      <planeGeometry args={[2.4,.24]}/>
      <shaderMaterial ref={cometMaterial} vertexShader={vertex} fragmentShader={cometFragment} uniforms={uniforms.comet} transparent blending={AdditiveBlending} depthWrite={false}/>
    </mesh>
  </group>
}

