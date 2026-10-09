import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type Group = "identity" | "body" | "hair" | "face" | "pose";
type FieldId = "species" | "height_cm" | "body_build" | "body_proportions" | "hair" | "hair_color_pattern" | "hair_secondary_color" | "eyes" | "pupil_shape" | "pose";
type CatalogOption = { id:string; label:string; tags:string[] };
type Catalog = { schema_version:number; catalog_version:number; style:{id:string;name:string;version:number}; categories:Record<string,CatalogOption[]>; trait_labels:Record<string,string>; auto_value:"auto" };
type Field = { id:FieldId; group:Group; label:string; initial:string; note:string };
type GeneratedCharacter = { version:number; style_id:string; style_name:string; profile:Record<string,string>; labels:Record<string,string>; rationale:string; style_direction:string; prompt:string; negative_prompt:string; seed:number|null; coherence:number; surprise:boolean };

const fields:Field[]=[
 {id:"species",group:"identity",label:"Especie",initial:"draconica",note:"Familia anatómica principal."},
 {id:"height_cm",group:"body",label:"Altura",initial:"h170",note:"La altura no determina por sí sola la constitución."},
 {id:"body_build",group:"body",label:"Constitución",initial:"fuerte_guardiana",note:"Independiente de altura y proporciones."},
 {id:"body_proportions",group:"body",label:"Proporciones corporales",initial:"esbelta_elegante",note:"Parámetro independiente del catálogo actual."},
 {id:"hair",group:"hair",label:"Color base del cabello",initial:"rojo_coral",note:"El color base es independiente del patrón y acento."},
 {id:"hair_color_pattern",group:"hair",label:"Patrón de color",initial:"puntas_doradas",note:"Patrones ofrecidos por el catálogo oficial."},
 {id:"hair_secondary_color",group:"hair",label:"Color secundario",initial:"oro_metalico",note:"Raíces, coronilla e inner hair aún no son campos separados."},
 {id:"eyes",group:"face",label:"Color de ojos",initial:"ambar",note:"El iris y la pupila son independientes."},
 {id:"pupil_shape",group:"face",label:"Forma de pupila",initial:"estrella",note:"Opciones especiales disponibles en el catálogo."},
 {id:"pose",group:"pose",label:"Pose",initial:"defiant",note:"La cámara y composición avanzada aún no tienen controles independientes."}
];
const tabs:{id:Group;label:string;no:string;title:string;subtitle:string}[]=[
 {id:"identity",label:"Identidad",no:"01",title:"Identidad",subtitle:"Especie y familia visual"},
 {id:"body",label:"Cuerpo",no:"02",title:"Cuerpo y anatomía",subtitle:"Estatura y proporciones"},
 {id:"hair",label:"Cabello",no:"03",title:"Diseño de cabello",subtitle:"Color base, patrón y acento"},
 {id:"face",label:"Rostro",no:"04",title:"Ojos y rostro",subtitle:"Iris y forma de pupila"},
 {id:"pose",label:"Pose",no:"05",title:"Pose y presencia",subtitle:"Actitud y dirección corporal"}
];
const initialValues=Object.fromEntries(fields.map(f=>[f.id,f.initial])) as Record<FieldId,string>;
const initialFixed=Object.fromEntries(fields.map(f=>[f.id,true])) as Record<FieldId,boolean>;

function labelFor(catalog:Catalog|null,id:FieldId,value:string):string{return catalog?.categories[id]?.find(x=>x.id===value)?.label??value}
function colorFor(id:string):string{return ({rojo_coral:"#ef646b",naranja_tangerina:"#ef8b43",rosa_chicle:"#ec78bd",violeta_profundo:"#8e7ae7",negro_obsidiana:"#38384b",azul_nocturno:"#4761b1",plateado_perla:"#bbc6d8",castano_miel:"#a97851",rubio_platino:"#e8dfba",turquesa:"#35c5bd",verde_esmeralda:"#2da987",rubio_dorado:"#d4a440"} as Record<string,string>)[id]??"#ef646b"}
async function jsonResponse<T>(response:Response):Promise<T>{
 const payload:unknown=await response.json();
 if(!response.ok){const msg=payload&&typeof payload==="object"&&"error" in payload&&typeof payload.error==="string"?payload.error:"La solicitud local no pudo completarse.";throw new Error(msg)}
 return payload as T;
}

export default function App(){
 const [group,setGroup]=useState<Group>("hair");
 const [catalog,setCatalog]=useState<Catalog|null>(null);
 const [values,setValues]=useState<Record<FieldId,string>>(initialValues);
 const [fixed,setFixed]=useState<Record<FieldId,boolean>>(initialFixed);
 const [seed,setSeed]=useState("314159");
 const [coherence,setCoherence]=useState(.82);
 const [generated,setGenerated]=useState<GeneratedCharacter|null>(null);
 const [status,setStatus]=useState("Conectando con el motor local de BotImagen…");
 const [showNegative,setShowNegative]=useState(false);
 const [saved,setSaved]=useState(false);
 const [loadingCatalog,setLoadingCatalog]=useState(true);
 const [generating,setGenerating]=useState(false);

 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   try{
    const catalogResponse=await fetch("/api/catalog",{signal:controller.signal});
    const data=await jsonResponse<Catalog>(catalogResponse);
    if(controller.signal.aborted)return;
    setCatalog(data);setLoadingCatalog(false);setStatus("Catálogo oficial conectado. Generando la ficha inicial…");
    const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({selections:initialValues,seed:314159,coherence:.82,surprise:false}),signal:controller.signal});
    const result=await jsonResponse<GeneratedCharacter>(response);
    if(controller.signal.aborted)return;
    setGenerated(result);setStatus("Motor Python conectado · "+result.style_name+" · semilla "+result.seed);
   }catch(error){
    if(controller.signal.aborted)return;
    setLoadingCatalog(false);setStatus(error instanceof Error?error.message+" Inicia el servidor local y vuelve a cargar.":"No se pudo conectar con la API local.");
   }
  }
  void load();return()=>controller.abort();
 },[]);

 const tab=tabs.find(t=>t.id===group)??tabs[0];
 const visible=fields.filter(f=>f.group===group);
 const prompt=generated?.prompt??"Esperando el resultado del motor Python…";
 const negative=generated?.negative_prompt??"El negative prompt se cargará desde el motor oficial.";
 const stageVars={"--hair-color":colorFor(values.hair)} as CSSProperties;

 function setValue(id:FieldId,value:string){setValues(p=>({...p,[id]:value}));setSaved(false);setStatus("Diseño editado. Pulsa «Generar perfil» para actualizar el resultado oficial.")}
 function toggleFixed(id:FieldId){const willFix=!fixed[id];setFixed(p=>({...p,[id]:willFix}));setSaved(false);setStatus(willFix?"Campo fijado manualmente.":"Campo marcado AUTO; el motor elegirá una opción oficial al generar.")}
 async function generateProfile(){
  if(!catalog){setStatus("El catálogo aún no está disponible. Inicia el servicio local y recarga.");return}
  const numericSeed=Number.parseInt(seed,10);
  if(!Number.isSafeInteger(numericSeed)){setStatus("La semilla debe ser un número entero válido.");return}
  const selections=Object.fromEntries(fields.map(f=>[f.id,fixed[f.id]?values[f.id]:"auto"]));
  setGenerating(true);setStatus("Generando mediante CharacterGenerator…");
  try{
   const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({selections,seed:numericSeed,coherence,surprise:false})});
   const result=await jsonResponse<GeneratedCharacter>(response);setGenerated(result);
   setValues(previous=>{const next={...previous};for(const field of fields){if(!fixed[field.id]&&result.profile[field.id])next[field.id]=result.profile[field.id]}return next});
   setSaved(false);setStatus("Perfil generado por Python · semilla "+result.seed+" · "+result.style_name);
  }catch(error){setStatus(error instanceof Error?error.message:"El motor local no pudo generar el perfil.")}finally{setGenerating(false)}
 }
 function reset(){setValues(initialValues);setFixed(initialFixed);setSeed("314159");setCoherence(.82);setSaved(false);setStatus("Ejemplo restaurado. Pulsa Generar perfil para actualizar el motor.")}
 async function saveProfile(){
  if(!generated){setStatus("Genera un perfil antes de guardarlo.");return}
  const profile={schema_version:1,mode:"local-engine",style_id:generated.style_id,seed:generated.seed,coherence:generated.coherence,selections:Object.fromEntries(fields.map(f=>[f.id,fixed[f.id]?values[f.id]:"auto"])),generated};
  const name=[labelFor(catalog,"species",values.species),labelFor(catalog,"hair",values.hair),labelFor(catalog,"eyes",values.eyes)].join(" · ");
  try{
   const response=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,profile})});
   const savedProfile=await jsonResponse<{id:string;name:string}>(response);
   setSaved(true);setStatus("Perfil guardado en generated_characters/web_profiles · "+savedProfile.name);
  }catch(error){setStatus(error instanceof Error?error.message:"No se pudo guardar el perfil en el disco local.")}
 }
 async function copyPrompt(){try{await navigator.clipboard.writeText(showNegative?prompt+"\n\nNEGATIVE PROMPT:\n"+negative:prompt);setStatus("Texto oficial copiado al portapapeles.")}catch{setStatus("No se pudo acceder al portapapeles; selecciona y copia el texto manualmente.")}}
 function exportJson(){
  const data={schema_version:1,mode:"local-engine",style_id:generated?.style_id??catalog?.style.id??"bw-modern-gacha-v1",seed:Number.parseInt(seed,10),coherence,selections:Object.fromEntries(fields.map(f=>[f.id,fixed[f.id]?values[f.id]:"auto"])),generated};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download="botimagen-profile.json";link.click();URL.revokeObjectURL(url);setStatus("Perfil exportado como JSON.");
 }

 return <div className="shell">
  <aside className="sidebar">
   <div className="brand"><span className="brand-mark">✳</span><span><b>BotImagen</b><small>CHARACTER STUDIO</small></span></div>
   <div className="nav-label">ESPACIO DE TRABAJO</div>
   <button className="nav active" type="button"><span>◈</span> Diseñador <i>01</i></button>
   <button className="nav" type="button" disabled title="Pendiente de BIMG-007"><span>▦</span> Biblioteca visual <small>PRONTO</small></button>
   <button className="nav" type="button" disabled title="Función futura"><span>⇄</span> Comparar variantes</button>
   <button className="nav" type="button" disabled title="Integración futura"><span>▤</span> Assets</button>
   <div className="side-spacer"/>
   <div className="local-card"><div className="online"><i/> MOTOR LOCAL</div><b>{catalog?"Motor detectado":"Conectando motor"}</b><p>{catalog?"Catálogo y prompts procesados por Python. Sin API de IA externa.":"Inicia el servicio Python para habilitar el catálogo real."}</p><div className="progress"><i/></div><small>{catalog?catalog.style.id:"API LOCAL · 127.0.0.1"}</small></div>
   <footer className="side-footer"><span>v0.2.0</span><span>OFFLINE-FIRST</span></footer>
  </aside>
  <main className="main">
   <header className="topbar"><div className="crumb">WORKSPACE <span>/</span> <b>CHARACTER DESIGN</b></div><div className="top-actions"><span className="local-pill"><i/> {catalog?"LOCAL · CONECTADO":"LOCAL · DESCONECTADO"}</span><span className="avatar">BW</span></div></header>
   <section className="heading"><div><div className="eyebrow"><i/> ESTUDIO DE PERSONAJES <span>BIMG-004</span></div><h1>Diseña una nueva <em>waifu.</em></h1><p>Selecciona rasgos del catálogo real y deja que el motor complete los campos AUTO.</p></div><div className="heading-buttons"><button className="btn muted" onClick={reset} type="button">Restaurar ejemplo</button><button className="btn primary" onClick={() => void saveProfile()} type="button">＋ {saved?"Perfil guardado":"Guardar perfil local"}</button></div></section>
   <div className="workspace">
    <section className="preview-area">
     <div className="kicker"><span><i>01</i> LIENZO DEL PERSONAJE</span><small>PREVIEW <i/></small></div>
     <div className="canvas" style={stageVars}>
      <div className="grid-bg"/><div className="halo halo-a"/><div className="halo halo-b"/>
      <div className="canvas-labels"><span>BW / DESIGN STUDY</span><span>#{(Number.parseInt(seed,10)||314159).toString().padStart(6,"0").slice(-6)}</span></div><div className="watermark">CHARACTER<br/>PROTOTYPE</div>
      <svg className="silhouette" viewBox="0 0 340 490" role="img" aria-label="Silueta vectorial temporal, no es una ilustración generada">
       <defs><linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="var(--hair-color)"/><stop offset="76%" stopColor="var(--hair-color)"/><stop offset="100%" stopColor="#e9bd69"/></linearGradient><linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34334d"/><stop offset="100%" stopColor="#121727"/></linearGradient><linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f6c8c2"/><stop offset="100%" stopColor="#bd8198"/></linearGradient></defs>
       <ellipse cx="170" cy="463" rx="82" ry="10" fill="#070a13" opacity=".5"/><path d="M110 90 Q72 137 99 235 L83 338 Q81 377 109 400 L137 374 L138 273 L163 245 L188 246 L211 281 L211 376 L242 401 Q268 371 255 331 L238 238 Q265 130 224 82 Z" fill="url(#hair)"/>
       <path d="M137 190 L135 233 L116 260 L149 282 L170 248 L193 281 L225 259 L207 229 L204 190 Z" fill="url(#skin)"/><path d="M113 243 Q88 249 89 309 L98 372 L125 371 L133 301 L151 278 Z M226 243 Q252 250 251 310 L244 372 L218 371 L213 301 L194 278 Z" fill="url(#cloth)" stroke="#767b9c" strokeWidth="2"/>
       <path d="M125 263 Q170 238 216 263 L209 340 L196 397 L145 397 L131 338 Z" fill="url(#cloth)" stroke="#858aaa" strokeWidth="2"/><path d="M142 280 L170 305 L199 280 L195 349 L170 369 L145 349 Z" fill="#e8bd6a"/><path d="M145 349 L170 369 L195 349 L204 414 L187 440 L153 440 L136 414 Z" fill="#20263b" stroke="#9b9fba" strokeWidth="2"/>
       <path d="M151 410 L149 456 L170 456 L177 410 Z M185 410 L190 456 L211 456 L202 410 Z" fill="#111727"/><path d="M148 452 L150 471 L181 471 L180 455 Z M190 452 L194 471 L225 471 L215 455 Z" fill="#dbb15e"/>
       <ellipse cx="170" cy="143" rx="52" ry="63" fill="url(#skin)" stroke="#f5d7ce" strokeWidth="2"/><path d="M118 152 Q107 91 150 63 Q211 35 233 96 L221 149 L206 102 Q173 117 130 110 Z" fill="url(#hair)" stroke="#f0a6ad" strokeWidth="1.5"/>
       <path d="M128 120 L101 83 L129 94 M219 118 L250 81 L229 97" fill="none" stroke="#e3ba66" strokeWidth="8" strokeLinecap="round"/><path d="M143 148 Q156 140 165 148 M185 148 Q196 140 205 148" fill="none" stroke="#664253" strokeWidth="4" strokeLinecap="round"/>
       <ellipse cx="155" cy="151" rx="6" ry="7" fill={values.eyes==="ambar"?"#d7a64f":"#5e8cd2"}/><ellipse cx="195" cy="151" rx="6" ry="7" fill={values.eyes==="ambar"?"#d7a64f":"#5e8cd2"}/><path d="M161 177 Q170 183 180 177" fill="none" stroke="#9c526a" strokeWidth="2.5" strokeLinecap="round"/><path d="M144 195 L119 228 L137 250 L161 220 Z M196 195 L222 228 L203 250 L179 220 Z" fill="#e7bd69" stroke="#f7d992" strokeWidth="2"/>
      </svg>
      <div className="side-mark left"><span>01</span>IDENTITY</div><div className="side-mark right"><span>02</span>SILHOUETTE</div>
      <div className="canvas-footer"><div><i/><b>{labelFor(catalog,"species",values.species).toUpperCase()} STUDY</b><small>ILUSTRACIÓN NO GENERADA</small></div><div className="swatches"><i style={{background:colorFor(values.hair)}}/><i style={{background:values.hair_secondary_color==="oro_metalico"?"#d7ae59":"#a6abc0"}}/><i style={{background:values.eyes==="ambar"?"#d6a54d":"#7396df"}}/></div></div>
     </div>
     <div className="summary"><div><small>COMBINACIÓN ACTUAL</small><b>{labelFor(catalog,"species",values.species)} · {labelFor(catalog,"hair",values.hair)} · {labelFor(catalog,"eyes",values.eyes)}</b><span>{generated?"Estilo oficial: "+generated.style_name:"El motor aún no ha devuelto un perfil."}</span></div><div className="counts"><b>{Object.values(fixed).filter(Boolean).length}<small>FIJOS</small></b><b>{Object.values(fixed).filter(v=>!v).length}<small>AUTO</small></b></div></div>
     <div className="roadmap"><b>✦ Próximos rasgos</b><span>Color y zonas de escamas, tamaño del busto, raíces, coronilla e inner hair aún requieren ampliar el catálogo.</span></div>
    </section>
    <section className="controls-area">
     <div className="control-panel">
      <div className="kicker"><span><i>02</i> CONFIGURACIÓN</span><small>{tab.no} / 05</small></div>
      <div className="tabs" role="tablist" aria-label="Categorías del personaje">{tabs.map(t=><button key={t.id} type="button" role="tab" aria-selected={group===t.id} className={group===t.id?"tab selected":"tab"} onClick={()=>setGroup(t.id)}><small>{t.no}</small>{t.label}</button>)}</div>
      <div className="control-heading"><h2>{tab.title}</h2><p>{tab.subtitle}</p></div>
      <div className="fields">{visible.map(field=>{
       const options=catalog?.categories[field.id]??[];const current=values[field.id];const exists=options.some(item=>item.id===current);
       return <div className={fixed[field.id]?"field":"field is-auto"} key={field.id}>
        <div className="field-label"><label htmlFor={"trait-"+field.id}>{catalog?.trait_labels[field.id]??field.label}</label><button type="button" className={fixed[field.id]?"lock fixed":"lock auto"} aria-pressed={fixed[field.id]} onClick={()=>toggleFixed(field.id)}>{fixed[field.id]?"● FIJO":"◇ AUTO"}</button></div>
        <select id={"trait-"+field.id} value={exists?current:""} disabled={!fixed[field.id]||loadingCatalog||!options.length} onChange={event=>setValue(field.id,event.target.value)}>{!exists&&<option value="" disabled>{loadingCatalog?"Cargando catálogo…":"Seleccionar opción"}</option>}{options.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select><p>{field.note}</p>
       </div>
      })}</div>
      {group==="body"&&<div className="future-trait"><b>＋</b><span><strong>Tamaño del busto</strong><small>Se añadirá como rasgo independiente en la ampliación del catálogo.</small></span><em>PLANIFICADO</em></div>}
      {group==="identity"&&values.species==="draconica"&&<div className="future-trait"><b>＋</b><span><strong>Color / distribución de escamas</strong><small>La especie existe; estos selectores aún no están en el catálogo.</small></span><em>PLANIFICADO</em></div>}
      <div className="seed-row"><span><b>SEMILLA DEL GENERADOR</b><small>La semilla se envía al motor Python real.</small></span><input aria-label="Semilla del generador" value={seed} inputMode="numeric" onChange={event=>setSeed(event.target.value.replace(/[^0-9-]/g,"").slice(0,15))}/></div>
      <div className="seed-row"><span><b>COHERENCIA · {Math.round(coherence*100)}%</b><small>Controla las alternativas elegidas en AUTO.</small></span><input aria-label="Coherencia" type="range" min="0" max="100" value={Math.round(coherence*100)} onChange={event=>setCoherence(Number(event.target.value)/100)}/></div>
      <button className="btn primary wide" type="button" disabled={!catalog||generating} onClick={()=>void generateProfile()}>{generating?"Generando…":"✦ Generar perfil con motor local"} <span>→</span></button>
     </div>
     <div className="prompt-panel"><div className="kicker"><span><i>03</i> DESCRIPCIÓN DEL DISEÑO</span><small>{generated?"MOTOR PYTHON":"ESPERANDO MOTOR"}</small></div><pre>{showNegative?prompt+"\n\nNEGATIVE PROMPT:\n"+negative:prompt}</pre><div className="prompt-actions"><button type="button" className="btn muted" onClick={()=>setShowNegative(v=>!v)}>{showNegative?"Ocultar negativo":"Ver negative prompt"}</button><button type="button" className="btn copy" onClick={()=>void copyPrompt()}>Copiar texto ↗</button><button type="button" className="btn muted" onClick={exportJson}>Exportar JSON</button></div>{generated&&<details className="rationale"><summary>Justificación del motor</summary><p>{generated.rationale}</p></details>}</div>
    </section>
   </div>
   <footer className="main-footer"><span><i/>{status}</span><small>{catalog?"CATÁLOGO OFICIAL · MOTOR LOCAL":"API LOCAL · 127.0.0.1:8765"}</small></footer>
  </main>
 </div>
}
