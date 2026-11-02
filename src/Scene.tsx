import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF, useProgress, AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import Earth from './Earth'
import Cosmos from './Cosmos'
import { missions } from './missions'
import { fittedProjectedPose, remainingEntrance } from './motion'
import hulls from './model-hulls.json'

const modelOrientations: [number,number,number][] = [[.22,-1.12,.12],[.3,-.5,-.55],[.7,Math.PI/2,-.25]]

export type ModelStage = { left: number; top: number; width: number; height: number }
type SceneProps = { selected: number; progress: React.RefObject<number>; reset: number; reduced: boolean; stage: ModelStage; onReady: () => void; onSettled: (index:number) => void }

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
    const count = 4300, positions = new Float32Array(count*3), colors = new Float32Array(count*3), sizes = new Float32Array(count)
    for(let i=0;i<count;i++) {
      const theta=rand()*Math.PI*2, z=rand()*2-1, r=45+rand()*100, v=Math.sqrt(1-z*z)
      positions.set([Math.cos(theta)*v*r,z*r,Math.sin(theta)*v*r],i*3)
      const temperature = rand(), intensity=.2+Math.pow(rand(),5)*1.4
      colors.set([intensity*(temperature>.8?1:.8),intensity*.88,intensity*(temperature<.2?1.15:.95)],i*3)
      sizes[i] = .45 + Math.pow(rand(),10)*2.8
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position',new THREE.BufferAttribute(positions,3)); g.setAttribute('color',new THREE.BufferAttribute(colors,3)); g.setAttribute('size',new THREE.BufferAttribute(sizes,1))
    return g
  },[])
  useEffect(()=>()=>geometry.dispose(),[geometry])
  useFrame((_,dt)=>{if(ref.current && !reduced) ref.current.rotation.y+=dt*.0008})
  return <points ref={ref} geometry={geometry}><shaderMaterial transparent depthWrite={false} vertexColors blending={THREE.AdditiveBlending} vertexShader={`attribute float size; varying vec3 vColor; void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*2.;gl_Position=projectionMatrix*mv;}`} fragmentShader={`varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5);float a=exp(-r*r*130.)+exp(-r*r*15.)*.16;gl_FragColor=vec4(vColor,a);}`} /></points>
}

function Telescope({index,selected,reset,reduced,stage,onSettled}: SceneProps & {index:number}) {
  const {scene} = useGLTF(missions[index].model, '/assets/draco/')
  const {viewport,size} = useThree()
  const outer = useRef<THREE.Group>(null!), offset=useRef<THREE.Group>(null!), pivot=useRef<THREE.Group>(null!), model=useRef<THREE.Group>(null!)
  const scale=useRef(0)
  const hull=useMemo(()=>hulls[missions[index].id].points.map(p=>new THREE.Vector3(...p as [number,number,number])),[index])
  const rotatedHull=useMemo(()=>hull.map(p=>p.clone()),[hull])
  const rotation=useMemo(()=>new THREE.Quaternion(),[])
  const velocity=useRef(new THREE.Vector2()), pointer=useRef<{x:number;y:number}|null>(null)
  const first=useRef(true),lastSelection=useRef(-1),entrance=useRef({start:0,end:0,active:false})
  const normalized = useMemo(()=>{
    const clone=scene.clone(true), sphere=new THREE.Box3().setFromObject(clone).getBoundingSphere(new THREE.Sphere())
    clone.position.sub(sphere.center)
    const wrapper=new THREE.Group(); wrapper.add(clone);wrapper.scale.setScalar(1/sphere.radius)
    return wrapper
  },[scene])
  const x=((stage.left+stage.width/2)/size.width-.5)*viewport.width
  const y=(.5-(stage.top+stage.height/2)/size.height)*viewport.height
  useEffect(()=>{
    const group=outer.current
    const selectionChanged=lastSelection.current!==selected
    lastSelection.current=selected
    const delay=first.current?1.1:.45
    if(first.current)group.position.y=y
    first.current=false
    gsap.killTweensOf(group.position);gsap.killTweensOf(group.rotation)
    const now=performance.now()/1000
    if(index===selected) {
      group.visible=true
      if(selectionChanged){
        entrance.current={start:now+(reduced?0:delay),end:now+(reduced?0:delay+3),active:!reduced}
        if(group.position.x < -viewport.width*.6)group.rotation.set(0,-.2,.1)
      }
      if(!selectionChanged&&!entrance.current.active){
        group.position.set(x,y,0);group.rotation.set(0,0,0)
      } else {
        const timing=remainingEntrance(entrance.current.start,entrance.current.end,now)
        gsap.to(group.position,{x,y,...timing,ease:'power3.out',onComplete:()=>{entrance.current.active=false;onSettled(index)}})
        gsap.to(group.rotation,{x:0,y:0,z:0,...timing,ease:'power2.out'})
      }
    } else {
      entrance.current.active=false
      gsap.to(group.position,{x:-viewport.width*1.3,duration:reduced?0:1,ease:'power2.inOut',onComplete:()=>{group.visible=false}})
    }
    return ()=>{gsap.killTweensOf(group.position);gsap.killTweensOf(group.rotation)}
  },[selected,index,viewport.width,reduced,x,y,onSettled])
  useEffect(()=>{
    velocity.current.set(0,0);pointer.current=null
  },[selected])
  useEffect(()=>{if(index===selected){pivot.current.rotation.set(0,0,0);velocity.current.set(0,0)}},[reset])
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
    rotation.copy(outer.current.quaternion).multiply(pivot.current.quaternion).multiply(model.current.quaternion)
    for(let i=0;i<hull.length;i++)rotatedHull[i].copy(hull[i]).applyQuaternion(rotation)
    const pose=fittedProjectedPose(rotatedHull,stage.width,stage.height,viewport.height/size.height,x,y)
    scale.current=scale.current===0||pose.scale<scale.current?pose.scale:THREE.MathUtils.damp(scale.current,pose.scale,8,dt)
    model.current.scale.setScalar(scale.current)
    offset.current.position.set(pose.x-x,pose.y-y,0)
  })
  // shortcut: NASA assets are normalized independently; preserve model details instead of rebuilding hardware.
  return <group ref={outer} position={[-30,0,0]}><group ref={offset}><group ref={pivot}><group ref={model} rotation={modelOrientations[index]}><primitive object={normalized}/></group></group></group></group>
}

function World(props:SceneProps) {
  const {camera,viewport,size} = useThree()
  const world=useRef<THREE.Group>(null!), earth=useRef<THREE.Group>(null!)
  const smoothProgress=useRef(0)
  const mobile=size.width<=650
  useEffect(()=>{props.onReady()},[props.onReady])
  useFrame((state,dt)=>{
    smoothProgress.current=THREE.MathUtils.damp(smoothProgress.current,props.progress.current,props.reduced?100:5,dt)
    const p=props.reduced?0:smoothProgress.current
    const departure=THREE.MathUtils.smoothstep(p,0,.65)
    world.current.position.set(-departure*viewport.width*2,departure*1.8,-departure*14)
    world.current.rotation.set(departure*.12,-departure*.35,-departure*.18)
    earth.current.position.set(viewport.width*(mobile?.68:.62)+p*viewport.width*2.8, -viewport.height*(mobile?.38:.25)-p*3,-4-p*7)
    camera.position.x=THREE.MathUtils.damp(camera.position.x,(!props.reduced?state.pointer.x*.035:0)+Math.sin(p*Math.PI)*1.5,3,dt)
    camera.position.y=THREE.MathUtils.damp(camera.position.y,(!props.reduced?state.pointer.y*.025:0)+Math.sin(p*Math.PI)*.75,3,dt)
    camera.position.z=10+p*14
    const bank=Math.sin(p*Math.PI)*.055
    camera.up.set(Math.sin(bank),Math.cos(bank),0)
    camera.lookAt(-p*.5,p*.3,-p*7)
  })
  return <>
    <Cosmos reduced={props.reduced}/>
    <Starfield reduced={props.reduced}/>
    <ambientLight intensity={.35}/><directionalLight position={[-5,6,8]} intensity={3.4} color="#ffefd9"/><directionalLight position={[5,-2,-5]} intensity={1.8} color="#92b9dd"/>
    <Environment resolution={128} frames={1}><Lightformer form="rect" intensity={1.3} color="#e2e9ec" position={[0,0,8]} scale={[18,12,1]}/><Lightformer form="rect" intensity={3} position={[-4,5,4]} scale={[8,5,1]}/><Lightformer form="rect" intensity={1.5} color="#8baec8" position={[5,0,-4]} scale={[4,7,1]}/><Lightformer form="rect" intensity={2} position={[0,-5,2]} scale={[5,2,1]}/></Environment>
    <group ref={earth}><Earth scale={mobile?viewport.width*.95:viewport.height*.78} reducedMotion={props.reduced}/></group>
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
