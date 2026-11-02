import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ModelStage } from './Scene'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { missions, type Mission } from './missions'
import photoMetadata from '../public/assets/explorer/metadata.json'
import { wrapMission } from './motion'
const Scene=lazy(()=>import('./Scene'))
gsap.registerPlugin(ScrollTrigger)

function Arrow({right=false}:{right?:boolean}) { return <svg viewBox="0 0 40 20" fill="none" aria-hidden="true" style={{transform:right?'rotate(180deg)':undefined}}><path d="M39 10H2m0 0 8-8M2 10l8 8" stroke="currentColor" strokeWidth="1.2"/></svg> }
function Brand() { return <a href="/" className="brand" aria-label="ORBITAL — главная"><span className="brand-symbol">◎</span>ORBITAL<span className="brand-caption">SPACE OBSERVATORY</span></a> }
function Credits() {return <footer id="credits"><Brand/><p>Независимая научная экспозиция.<br/>Не является проектом NASA и не подразумевает её одобрения.</p><div><span>МОДЕЛИ И ИЗОБРАЖЕНИЯ</span><a href="/credits.txt" target="_blank" rel="noreferrer">NASA · ESA · CSA · STScI ↗</a></div><a href="#top">К началу ↑</a></footer>}

function MissionPanel({index,reduced,visible}:{index:number;reduced:boolean;visible:boolean}) {
  const [displayed,setDisplayed]=useState(index),panel=useRef<HTMLElement>(null)
  const mission=missions[displayed]
  useEffect(()=>{
    const ctx=gsap.context(()=>{
      if(index!==displayed){
        gsap.to(panel.current,{opacity:0,duration:reduced?0:.25,onComplete:()=>setDisplayed(index)})
      } else if(!visible){
        gsap.to(panel.current,{opacity:0,duration:reduced?0:.25})
      } else {
        gsap.set(panel.current,{opacity:1})
        gsap.fromTo(panel.current!.children,{opacity:0,y:reduced?0:6},{opacity:1,y:0,duration:reduced?0:.65,stagger:reduced?0:.08,delay:reduced?0:.25,ease:'power2.out'})
      }
    },panel)
    return()=>ctx.revert()
  },[index,displayed,reduced,visible])
  return <section ref={panel} className="mission-info" aria-live="polite"><div className="info-top"><span className="eyebrow">{mission.kicker}</span><span className="mono">0{displayed+1} / 03</span></div><h1>{mission.name}</h1><p>{mission.description}</p><dl><div><dt>ЗАПУСК</dt><dd>{mission.launch}</dd></div><div><dt>РАСПОЛОЖЕНИЕ</dt><dd>{mission.location}</dd></div></dl><div className="specs">{mission.stats.slice(0,2).map(s=><div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>)}</div></section>
}

function Gallery({id}:{id:string}) {
  const mission=missions.find(m=>m.id===id),dialog=useRef<HTMLDialogElement>(null),[photo,setPhoto]=useState(0)
  useEffect(()=>{window.scrollTo(0,0);document.title=`${mission?.short??'Страница не найдена'} — ORBITAL`;return()=>{document.title='ORBITAL — За пределами видимого'}},[mission])
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('is-visible')}),{threshold:.08})
    document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));return()=>observer.disconnect()
  },[])
  if(!mission)return <main className="not-found"><Brand/><h1>За пределами карты.</h1><a href="/">Вернуться в обсерваторию ↗</a></main>
  return <div className="gallery-page" id="top"><header><Brand/><a href="/" className="back-link">← В ОБСЕРВАТОРИЮ</a><span className="nav-coordinate">MISSION ARCHIVE / {mission.short.toUpperCase()}</span></header>
    <main><section className="gallery-intro"><div className="eyebrow">НАУЧНЫЙ АРХИВ <span> / </span> {mission.kicker}</div><h1>{mission.name}</h1><p>{mission.description}</p><div className="gallery-quick"><span>ЗАПУСК <b>{mission.launch}</b></span><span>РАСПОЛОЖЕНИЕ <b>{mission.location}</b></span></div></section>
    {mission.images.map((img,i)=><section key={img.src} className={`exhibit reveal exhibit-${i%3}`}><button className="exhibit-image" onClick={()=>{setPhoto(i);dialog.current?.showModal()}} aria-label={`Открыть изображение: ${img.title}`}><img src={img.src} alt={img.caption} loading={i?'lazy':'eager'}/><span>ПОЛНЫЙ ЭКРАН ↗</span></button><div className="exhibit-caption"><span className="eyebrow">0{i+1} <i>/</i> {img.kind}</span><h2>{img.title}</h2><p>{img.caption}</p><small>{img.credit} · <a href={img.source} target="_blank" rel="noreferrer">Источник ↗</a></small></div></section>)}
    <section className="mission-story reveal"><span className="eyebrow">ИНЖЕНЕРИЯ ВСТРЕЧАЕТ ОТКРЫТИЯ</span><div><h2>Чтобы увидеть<br/>невидимое.</h2><article><h3>Конструкция</h3><p>{mission.construction}</p><h3>Научная задача</h3><p>{mission.science}</p><h3>Что изменилось</h3><p>{mission.achievement}</p><a href={mission.source} target="_blank" rel="noreferrer">О миссии на сайте NASA ↗</a></article></div></section>
    <nav className="other-missions" aria-label="Другие миссии">{missions.filter(m=>m.id!==id).map(m=><a href={`/telescopes/${m.id}`} key={m.id}><span>СЛЕДУЮЩАЯ МИССИЯ</span><b>{m.short}</b><span>ОТКРЫТЬ АРХИВ ↗</span></a>)}</nav></main><Credits/>
    <dialog ref={dialog} className="lightbox" onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close()}} onKeyDown={e=>{if(e.key==='ArrowRight')setPhoto(p=>wrapMission(p+1,mission.images.length));if(e.key==='ArrowLeft')setPhoto(p=>wrapMission(p-1,mission.images.length))}}><button className="lightbox-close" onClick={()=>dialog.current?.close()} aria-label="Закрыть изображение">ЗАКРЫТЬ ×</button><img src={mission.images[photo].src} alt={mission.images[photo].caption}/><div><button onClick={()=>setPhoto(p=>wrapMission(p-1,mission.images.length))} aria-label="Предыдущее изображение">←</button><p>{mission.images[photo].title}<small>{mission.images[photo].credit}</small></p><button onClick={()=>setPhoto(p=>wrapMission(p+1,mission.images.length))} aria-label="Следующее изображение">→</button></div></dialog>
  </div>
}

function SpacecraftPhoto({mission}:{mission:Mission}) {
  const meta=photoMetadata[mission.id==='james-webb'?'webb':mission.id]
  const preview=mission.image.replace('-cutout.webp','-preview.webp')
  return <img src={preview} srcSet={`${preview} ${meta.previewWidth}w, ${mission.image} ${meta.width}w`} sizes="(max-width:650px) 86vw, 29vw" width={meta.width} height={meta.height} alt={`Космический телескоп ${mission.name}`} loading="lazy"/>
}

function Observatory() {
  const [selected,setSelected]=useState(0),[reset,setReset]=useState(0),[ready,setReady]=useState(false),[reduced,setReduced]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const progress=useRef(0),root=useRef<HTMLDivElement>(null),mission=missions[selected]
  const [settled,setSettled]=useState(-1)
  const [stage,setStage]=useState<ModelStage>({left:0,top:400,width:500,height:250})
  const onReady=useCallback(()=>setReady(true),[])
  const onSettled=useCallback((index:number)=>setSettled(index),[])
  useLayoutEffect(()=>{
    const hero=root.current!.querySelector<HTMLElement>('.hero')!,panel=root.current!.querySelector<HTMLElement>('.mission-info')!,zone=document.getElementById('model-interaction')!
    const measure=()=>{
      hero.style.setProperty('--model-top',`${panel.offsetTop+panel.offsetHeight+32}px`)
      const box=hero.parentElement!.getBoundingClientRect(),frame=zone.parentElement!
      const next={left:box.left+frame.offsetLeft+zone.offsetLeft,top:box.top+window.scrollY+frame.offsetTop+zone.offsetTop,width:zone.clientWidth,height:zone.clientHeight}
      setStage(previous=>Object.keys(next).every(key=>next[key as keyof ModelStage]===previous[key as keyof ModelStage])?previous:next)
    }
    const observer=new ResizeObserver(measure)
    observer.observe(hero);observer.observe(panel);observer.observe(zone)
    window.addEventListener('resize',measure);measure()
    return()=>{observer.disconnect();window.removeEventListener('resize',measure)}
  },[])
  useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
  useEffect(()=>{
    const ctx=gsap.context(()=>{
      ScrollTrigger.create({trigger:'.journey',start:'top top',end:'bottom bottom',scrub:reduced?false:1,onUpdate:self=>{
        progress.current=self.progress
        gsap.set('.hero-interface',{opacity:1-Math.min(1,self.progress*3.5),y:reduced?0:-self.progress*100,pointerEvents:self.progress>.28?'none':'auto'})
      }})
      gsap.fromTo('.travel-copy',{autoAlpha:0,y:reduced?0:70},{autoAlpha:1,y:0,ease:'none',scrollTrigger:{trigger:'.journey',start:'top -35%',end:'top -70%',scrub:reduced?false:1}})
      if(!reduced)gsap.to('.travel-copy',{y:-70,opacity:0,ease:'none',scrollTrigger:{trigger:'.journey',start:'bottom 135%',end:'bottom 90%',scrub:1}})
      gsap.fromTo('.section-heading h2',{y:reduced?0:80,opacity:0},{y:0,opacity:1,scrollTrigger:{trigger:'.explorer',start:'top 90%',end:'top 45%',scrub:reduced?false:1}})
      gsap.fromTo('.section-heading>p',{y:reduced?0:45,opacity:0},{y:0,opacity:1,scrollTrigger:{trigger:'.explorer',start:'top 75%',end:'top 40%',scrub:reduced?false:1}})
      gsap.utils.toArray<HTMLElement>('.explorer-card').forEach((card,i)=>{
        gsap.fromTo(card,{opacity:0,y:reduced?0:110+i*35,rotateX:reduced?0:12,rotateZ:reduced?0:[-2,1,2][i],scale:reduced?1:.9},{opacity:1,y:0,rotateX:0,rotateZ:0,scale:1,ease:'power2.out',scrollTrigger:{trigger:card,start:`top ${94-i*4}%`,end:'top 40%',scrub:reduced?false:1.2}})
        if(!reduced)gsap.fromTo(card.querySelector('img'),{y:25},{y:-25,ease:'none',scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:1.5}})
      })
    },root)
    return()=>ctx.revert()
  },[reduced])
  useEffect(()=>{if(ready)document.body.classList.add('scene-ready');return()=>document.body.classList.remove('scene-ready')},[ready])
  const choose=(i:number)=>{const next=wrapMission(i,missions.length);if(next!==selected){setSettled(-1);setSelected(next)}}
  return <div ref={root} id="top" className={`observatory ${ready?'ready':''} ${reduced?'reduced':''}`}>
    <Suspense fallback={<div className="boot-message">ORBITAL / ПОДГОТОВКА СЦЕНЫ</div>}><Scene selected={selected} progress={progress} reset={reset} reduced={reduced} stage={stage} onReady={onReady} onSettled={onSettled}/></Suspense>
    <header><Brand/><nav aria-label="Основная навигация"><a href="#top" className="active">ОБСЕРВАТОРИЯ</a><a href="#explorer">ТЕЛЕСКОПЫ</a><a href="#credits">О ПРОЕКТЕ ↗</a></nav><span className="nav-coordinate"><i/> EARTH / SOL SYSTEM</span></header>
    <main><section className="journey" aria-label="Интерактивная обсерватория"><div className="hero"><div className="hero-interface">
      <div className="mission-index"><span className="eyebrow">ТРИ ВЗГЛЯДА<br/>НА БЕСКОНЕЧНОСТЬ</span><span className="vertical-rule"/><span className="mono">ЭКСПОЗИЦИЯ / 01—03</span></div>
      <MissionPanel index={selected} reduced={reduced} visible={ready&&settled===selected}/>
      <div className="model-frame"><button className="switch previous" onClick={()=>choose(selected-1)} aria-label="Предыдущий телескоп"><Arrow/></button><div id="model-interaction" className="model-interaction" tabIndex={0} role="application" aria-label={`Вращение ${mission.short}: перетаскивайте мышью или используйте стрелки клавиатуры`}/><button className="switch next" onClick={()=>choose(selected+1)} aria-label="Следующий телескоп"><Arrow right/></button></div>
      <div className="model-tools"><span className="drag-icon">⤧</span><span>ПЕРЕТАЩИТЕ, ЧТОБЫ ВРАЩАТЬ</span><button onClick={()=>setReset(r=>r+1)} aria-label="Сбросить ориентацию телескопа">↺ СБРОС</button></div>
      <div className="earth-label"><span className="crosshair">+</span><span>ЗЕМЛЯ<small>НАШ ОБЩИЙ ДОМ</small></span></div>
      <div className="hero-bottom"><nav aria-label="Выбор телескопа" className="mission-tabs">{missions.map((m,i)=><button key={m.id} className={i===selected?'selected':''} aria-pressed={i===selected} onClick={()=>choose(i)}><small>0{i+1}</small>{m.short}<span/></button>)}</nav><a href="#explorer" className="scroll-hint"><span>ПРОДОЛЖИТЬ ПУТЕШЕСТВИЕ</span><span>↓</span></a><span className="hero-note">РЕАЛЬНЫЕ МОДЕЛИ NASA<br/>МАСШТАБ УСЛОВНЫЙ</span></div>
    </div><div className="travel-copy"><span className="eyebrow">ЗА ПРЕДЕЛАМИ ВИДИМОГО</span><p>Одна Вселенная.<br/>Разные способы её увидеть.</p><span className="travel-rule"/></div></div></section>
    <section id="explorer" className="explorer"><div className="section-heading reveal"><div><span className="eyebrow">02 / TELESCOPE EXPLORER</span><h2>Расширяя<br/><em>горизонты.</em></h2></div><p>От первого света галактик до самых мощных взрывов в космосе. Три обсерватории раскрывают Вселенную в разных диапазонах.</p></div><div className="explorer-grid">{missions.map((m,i)=><article className="explorer-card reveal" key={m.id}><a className="card-image" href={`/telescopes/${m.id}`} aria-label={`Галерея ${m.short}`}><SpacecraftPhoto mission={m}/><span className="card-number">0{i+1}</span><span className="card-spectrum">{m.kicker}</span></a><div className="card-title"><h3>{m.short}</h3><a href={`/telescopes/${m.id}`}>GALLERY <span>↗</span></a></div><p>{m.purpose}</p><p className="photo-caption">{m.photoCaption}<br/><a href={m.photoSource} target="_blank" rel="noreferrer">{m.photoCredit} ↗</a></p></article>)}</div></section>
    </main><Credits/>
  </div>
}
export default function App() {
  const path=decodeURI(window.location.pathname).replace(/^\/orbital-space-observatory(?=\/|$)/,'').replace(/\/$/,'')
  return path===''?<Observatory/>:path.startsWith('/telescopes/')?<Gallery id={path.slice('/telescopes/'.length)}/>:<Gallery id="404"/>
}
