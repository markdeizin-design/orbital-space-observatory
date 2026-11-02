import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF, useProgress, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import Earth from './Earth'
import Cosmos from './Cosmos'
import { missions } from './missions'

type SceneProps = { selected: number; progress: React.RefObject<number>; reset: number; reduced: boolean; skipIntro: boolean; onReady: () => void }

class SceneBoundary extends Component<{children: ReactNode}, {error: boolean}> {
  state = {error: false}
  static getDerivedStateFromError() { return {error: true} }
  render() { return this.state.error ? <div className="scene-error"><span>3D-СЦЕНА НЕДОСТУПНА</span><p>Проверьте поддержку WebGL и обновите страницу. Галереи и материалы доступны ниже.</p><button onClick={() => location.reload()}>Повторить загрузку ↗</button></div> : this.props.children }
}

function Loading() {
  const {progress, errors} = useProgress()
  return <div className="loading" role="status"><span className="loading-orbit"/><span>{errors.length ? 'ОШИБКА ЗАГРУЗКИ · ОБНОВИТЕ СТРАНИЦУ' : 'СИНХРОНИЗАЦИЯ С ОБСЕРВАТОРИЕЙ'}</span><b>{Math.round(progress).toString().padStart(2,'0')}<small>%</small></b><div><i style={{width:`${progress}%`}}/></div></div>
}

function Starfield({reduced}: {reduced:boolean}) {
  const ref = useRef<THREE.Points>(null)
  const geometry = useMemo(() => {
    let seed = 42
    const rand = () => {seed=(seed*16807)%2147483647; return (seed-1)/2147483646}
    const count = 6500, positions = new Float32Array(count*3), colors = new Float32Array(count*3), sizes = new Float32Array(count)
    for(let i=0;i<count;i++) {
      const theta=rand()*Math.PI*2, z=rand()*2-1, r=45+rand()*100, v=Math.sqrt(1-z*z)
      positions.set([Math.cos(theta)*v*r,z*r,Math.sin(theta)*v*r],i*3)
      const temperature = rand(), intensity=.3+Math.pow(rand(),4)*1.8
      colors.set([intensity*(temperature>.8?1:.8),intensity*.88,intensity*(temperature<.2?1.15:.95)],i*3)
      sizes[i] = .55 + Math.pow(rand(),10)*3.5
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.BufferAttribute(positions,3)); g.setAttribute('color',new THREE.BufferAttribute(colors,3)); g.setAttribute('size',new THREE.BufferAttribute(sizes,1))
    return g
  },[])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  useFrame((_,dt)=>{if(ref.current && !reduced) ref.current.rotation.y+=dt*.0008})
  return <points ref={ref} geometry={geometry}><shaderMaterial transparent depthWrite={false} vertexColors blending={THREE.AdditiveBlending} vertexShader={`attribute float size; varying vec3 vColor; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*2.;gl_Position=projectionMatrix*mv;}`} fragmentShader={`varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5);float a=exp(-r*r*130.)+exp(-r*r*15.)*.16;gl_FragColor=vec4(vColor,a);}`} /></points>
}

function Telescope({index,selected,reset,reduced,skipIntro}: {index:number;selected:number;reset:number;reduced:boolean;skipIntro:boolean}) {
  const {scene} = useGLTF(missions[index].model, '/assets/draco/')
  const {viewport} = useThree()
  const outer = useRef<THREE.Group>(null!), pivot=useRef<THREE.Group>(null!)
  const velocity=useRef(new THREE.Vector2()), pointer=useRef<{x:number;y:number}|null>(null)
  const first=useRef(true)
  const mobile=viewport.width<9
  const normalized = useMemo(()=>{
    const clone=scene.clone(true), box=new THREE.Box3().setFromObject(clone), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3())
    clone.position.sub(center)
    const wrapper=new THREE.Group(); wrapper.add(clone);wrapper.scale.setScalar(1/Math.max(size.x,size.y,size.z))
    return wrapper
  },[scene])
  const x=mobile ? -viewport.width*.12 : -viewport.width*.19
  const y=mobile ? -1.05 : -.55
  const modelScale=(mobile?viewport.width*.95:viewport.width*.4)*(index===0?(mobile?1.05:.92):1)
  useEffect(()=>{
    const group=outer.current
    const immediate=reduced||(first.current&&skipIntro)
    first.current=false
    gsap.killTweensOf(group.position);gsap.killTweensOf(group.rotation)
    if(index===selected) {
      if(group.position.x < -viewport.width*.6)group.rotation.set(0,-.2,.1)
      gsap.to(group.position,{x,y,duration:immediate?0:2.5,delay:immediate?0:.45,ease:'power3.out'})
      gsap.to(group.rotation,{x:0,y:0,z:0,duration:immediate?0:2.8,ease:'power2.out'})
    } else gsap.to(group.position,{x:-viewport.width*1.3,duration:reduced?0:1,ease:'power2.inOut'})
    return ()=>{gsap.killTweensOf(group.position);gsap.killTweensOf(group.rotation)}
  },[selected,index,mobile,viewport.width,reduced,x,y])
  useEffect(()=>{
    velocity.current.set(0,0);pointer.current=null
  },[selected])
  useEffect(()=>{if(index===selected)pivot.current.rotation.set(0,0,0)},[reset])
  useEffect(()=>{
    if(index!==selected)return
    const zone=document.getElementById('model-interaction')
    if(!zone)return
    const down=(e:PointerEvent)=>{pointer.current={x:e.clientX,y:e.clientY};velocity.current.set(0,0);zone.setPointerCapture(e.pointerId)}
    const move=(e:PointerEvent)=>{if(!pointer.current)return;velocity.current.set((e.clientX-pointer.current.x)*.006,(e.clientY-pointer.current.y)*.006);pointer.current={x:e.clientX,y:e.clientY};pivot.current.rotation.y+=velocity.current.x;pivot.current.rotation.x+=velocity.current.y}
    const up=()=>{pointer.current=null}
    const key=(e:KeyboardEvent)=>{const keys:Record<string,[number,number]>={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,-.12],ArrowDown:[0,.12]};if(keys[e.key]){e.preventDefault();pivot.current.rotation.y+=keys[e.key][0];pivot.current.rotation.x+=keys[e.key][1]}}
    zone.addEventListener('pointerdown',down);zone.addEventListener('pointermove',move);zone.addEventListener('pointerup',up);zone.addEventListener('pointercancel',up);zone.addEventListener('lostpointercapture',up);zone.addEventListener('keydown',key)
    return ()=>{zone.removeEventListener('pointerdown',down);zone.removeEventListener('pointermove',move);zone.removeEventListener('pointerup',up);zone.removeEventListener('pointercancel',up);zone.removeEventListener('lostpointercapture',up);zone.removeEventListener('keydown',key)}
  },[index,selected])
  useFrame((state,dt)=>{
    if(index!==selected)return
    if(!pointer.current){velocity.current.multiplyScalar(reduced?0:Math.exp(-dt*5));pivot.current.rotation.y+=velocity.current.x*dt*40;pivot.current.rotation.x+=velocity.current.y*dt*40}
    if(!reduced) outer.current.position.y=y+Math.sin(state.clock.elapsedTime*.22)*.045
  })
  // shortcut: NASA assets are normalized independently; preserve model details instead of rebuilding hardware.
  const orientations: [number,number,number][] = [[.15,-Math.PI/2,-.2],[.3,-.5,-.55],[.7,Math.PI/2,-.25]]
  return <group ref={outer} position={[-30,y,0]}><group ref={pivot}><group rotation={orientations[index]} scale={modelScale}><primitive object={normalized}/></group></group></group>
}

function World(props:SceneProps) {
  const {camera,viewport} = useThree()
  const world=useRef<THREE.Group>(null!), earth=useRef<THREE.Group>(null!)
  const smoothProgress=useRef(0)
  const mobile=viewport.width<9
  useEffect(()=>{props.onReady()},[props.onReady])
  useFrame((state,dt)=>{
    smoothProgress.current=THREE.MathUtils.damp(smoothProgress.current,props.progress.current,props.reduced?100:5,dt)
    const p=props.reduced?0:smoothProgress.current
    world.current.position.set(-p*3,p*2,-p*14)
    earth.current.position.set(viewport.width*.36+p*viewport.width, -viewport.height*.16-p*3,-2-p*7)
    camera.position.x=THREE.MathUtils.damp(camera.position.x,(!props.reduced?state.pointer.x*.07:0)+p*.7,3,dt)
    camera.position.y=THREE.MathUtils.damp(camera.position.y,(!props.reduced?state.pointer.y*.04:0)+p*.3,3,dt)
    camera.position.z=10+p*9
    camera.lookAt(0,0,-p*5)
  })
  return <>
    <Cosmos reduced={props.reduced}/>
    <Starfield reduced={props.reduced}/>
    <ambientLight intensity={.35}/><directionalLight position={[-5,6,8]} intensity={3.4} color="#ffefd9"/><directionalLight position={[5,-2,-5]} intensity={1.8} color="#92b9dd"/>
    <Environment resolution={128} frames={1}><Lightformer form="rect" intensity={1.3} color="#e2e9ec" position={[0,0,8]} scale={[18,12,1]}/><Lightformer form="rect" intensity={3} position={[-4,5,4]} scale={[8,5,1]}/><Lightformer form="rect" intensity={1.5} color="#8baec8" position={[5,0,-4]} scale={[4,7,1]}/><Lightformer form="rect" intensity={2} position={[0,-5,2]} scale={[5,2,1]}/></Environment>
    <group ref={earth}><Earth scale={mobile?viewport.width*.51:viewport.height*.5} reducedMotion={props.reduced}/></group>
    <group ref={world}>{missions.map((_,index)=><Telescope key={index} {...props} index={index}/>)}</group>
    <AdaptiveDpr pixelated/>
  </>
}

function ContextEvents({onLost,onRestored}:{onLost:()=>void;onRestored:()=>void}) {
  const {gl}=useThree()
  useEffect(()=>{
    const canvas=gl.domElement
    const lost=(e:Event)=>{e.preventDefault();onLost()}
    canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',onRestored)
    return()=>{canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',onRestored)}
  },[gl,onLost,onRestored])
  return null
}

export default function Scene(props:SceneProps) {
  const [dpr,setDpr]=useState(1.5),[lost,setLost]=useState(false)
  return <SceneBoundary><div className="space-canvas" aria-hidden="true"><Canvas dpr={dpr} camera={{position:[0,0,10],fov:40,near:.1,far:300}} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} onCreated={({gl})=>{
    setLost(false);gl.setClearColor('#030609');gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=1.1
  }}><ContextEvents onLost={()=>setLost(true)} onRestored={()=>setLost(false)}/><PerformanceMonitor onDecline={()=>setDpr(1)}><Suspense fallback={null}><World {...props}/></Suspense></PerformanceMonitor></Canvas></div><Loading/>{lost&&<div className="context-notice" role="alert">Восстанавливаем 3D-сцену… <button onClick={()=>location.reload()}>Перезагрузить</button></div>}</SceneBoundary>
}
