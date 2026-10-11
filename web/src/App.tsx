import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { DEFAULT_VISUAL_RECIPE, normalizeVisualRecipe, VisualCharacterRenderer, VisualStyleLab } from "./visual/VisualCharacterRenderer";
import type { VisualRecipe } from "./visual/VisualCharacterRenderer";

type Group = "identity" | "body" | "anatomy" | "face" | "hair" | "outfit" | "combat" | "detail";
type FieldId = string;
type CatalogOption = { id:string; label:string; tags:string[]; color_family?:string; compatible_with?:Record<string,string[]> };
type Catalog = { schema_version:number; catalog_version:number; style:{id:string;name:string;version:number}; categories:Record<string,CatalogOption[]>; trait_labels:Record<string,string>; auto_value:"auto" };
type Field = { id:FieldId; group:Group; label:string; initial:string; fixed:boolean; note:string };
type GeneratedCharacter = { version:number; style_id:string; style_name:string; profile:Record<string,string>; labels:Record<string,string>; rationale:string; style_direction:string; prompt:string; negative_prompt:string; seed:number|null; coherence:number; surprise:boolean; visual_recipe?:VisualRecipe };
type SavedProfileSummary = { id:string; name:string; saved_at:string; style_id:string; seed:number|null };
type SavedProfileRecord = { id:string; name:string; saved_at:string; style_id:string; seed:number|null; profile:{ selections?:Record<string,string>; generated?:GeneratedCharacter; seed?:number|null; coherence?:number; style_id?:string; visual_recipe?:VisualRecipe } };

const fields:Field[]=[
 {id:"personality",group:"identity",label:"Personalidad",initial:"alegre",fixed:false,note:"Preferencia de carácter que orienta las afinidades del motor."},
 {id:"species",group:"identity",label:"Especie",initial:"draconica",fixed:true,note:"Familia anatómica principal."},
 {id:"stature",group:"identity",label:"Estatura general",initial:"bajita",fixed:false,note:"Categoría visual de altura, separada de la medida exacta."},
 {id:"silhouette",group:"identity",label:"Silueta",initial:"compacta_agil",fixed:false,note:"Lectura general de la figura en pantalla."},

 {id:"height_cm",group:"body",label:"Altura exacta",initial:"h170",fixed:true,note:"La altura no determina por sí sola la constitución."},
 {id:"body_build",group:"body",label:"Constitución",initial:"fuerte_guardiana",fixed:true,note:"Volumen y lectura física, independiente de la altura."},
 {id:"body_proportions",group:"body",label:"Proporciones corporales",initial:"esbelta_elegante",fixed:true,note:"Relación de proporciones, no un preset de cuerpo completo."},
 {id:"bust_size",group:"body",label:"Tamaño del busto",initial:"balanced",fixed:false,note:"Proporción anatómica adulta, independiente de la constitución corporal."},
 {id:"skin_tone",group:"body",label:"Tono de piel",initial:"porcelana_neutra",fixed:false,note:"Tono base de piel definido por el catálogo."},

 {id:"ear_style",group:"anatomy",label:"Orejas",initial:"orejas_gato",fixed:false,note:"Forma de orejas independiente de la etiqueta de especie."},
 {id:"tail_style",group:"anatomy",label:"Cola",initial:"sin_cola",fixed:false,note:"Tipo de cola o ausencia explícita."},
 {id:"horn_style",group:"anatomy",label:"Cuernos / rasgo craneal",initial:"sin_cuernos",fixed:false,note:"Rasgos craneales controlados por separado."},
 {id:"scale_pattern",group:"anatomy",label:"Zonas / patrón de escamas",initial:"no_visible_scales",fixed:false,note:"Define primero dónde aparecen las escamas, no su color."},
 {id:"scale_color",group:"anatomy",label:"Color de escamas",initial:"metallic_gold",fixed:false,note:"El color solo se aplica si el patrón establece zonas visibles."},

 {id:"expression",group:"face",label:"Expresión",initial:"mirada_enfocada",fixed:false,note:"Emoción visible de la cara."},
 {id:"face_shape",group:"face",label:"Forma del rostro",initial:"equilibrada",fixed:false,note:"Estructura general del rostro."},
 {id:"nose_style",group:"face",label:"Nariz",initial:"minima",fixed:false,note:"Tratamiento visual de nariz."},
 {id:"eye_shape",group:"face",label:"Forma de ojos",initial:"grande_expresiva",fixed:false,note:"Silueta ocular independiente del color del iris."},
 {id:"eyes",group:"face",label:"Color de ojos",initial:"ambar",fixed:true,note:"El iris y la pupila son independientes."},
 {id:"pupil_shape",group:"face",label:"Forma de pupila",initial:"estrella",fixed:true,note:"Opciones especiales disponibles en el catálogo."},
 {id:"eyebrow_style",group:"face",label:"Cejas",initial:"rectas",fixed:false,note:"Forma y peso de las cejas."},
 {id:"mouth_style",group:"face",label:"Boca",initial:"sonrisa_pequena",fixed:false,note:"Forma de la boca y lectura de expresión."},
 {id:"facial_detail",group:"face",label:"Detalle facial",initial:"sin_marca",fixed:false,note:"Pecas, marcas u otros detalles expresivos."},

 {id:"hair_length",group:"hair",label:"Largo del cabello",initial:"medio",fixed:false,note:"Longitud separada del corte y el recogido."},
 {id:"hair_bangs",group:"hair",label:"Flequillo",initial:"recto",fixed:false,note:"Forma del flequillo como capa independiente."},
 {id:"hairstyle",group:"hair",label:"Corte / forma base",initial:"bob",fixed:false,note:"Estructura principal del peinado."},
 {id:"hair_arrangement",group:"hair",label:"Recogido / coleta",initial:"suelto",fixed:false,note:"Cómo se recoge o distribuye el cabello."},
 {id:"hair_texture",group:"hair",label:"Textura",initial:"liso_sedoso",fixed:false,note:"Acabado del cabello, independiente del corte."},
 {id:"side_hair",group:"hair",label:"Cabello lateral",initial:"mechones_largos",fixed:false,note:"Mechones y silueta lateral."},
 {id:"back_hair",group:"hair",label:"Cabello trasero",initial:"recto_liso",fixed:false,note:"Capas y perfil posterior."},
 {id:"hair",group:"hair",label:"Color base",initial:"rojo_coral",fixed:true,note:"Color dominante del cabello."},
 {id:"hair_color_pattern",group:"hair",label:"Patrón de color",initial:"puntas_doradas",fixed:true,note:"Distribución, degradado y transiciones del color."},
 {id:"hair_secondary_color",group:"hair",label:"Color secundario",initial:"oro_metalico",fixed:true,note:"Acento general que complementa el patrón de color."},
 {id:"hair_tip_color",group:"hair",label:"Color de puntas",initial:"matching_base",fixed:false,note:"Controla únicamente las puntas, independiente del color secundario y de las raíces."},
 {id:"hair_root_color",group:"hair",label:"Color de raíces",initial:"matching_base",fixed:false,note:"Zona de raíz independiente del color base y de las puntas."},
 {id:"hair_crown_color",group:"hair",label:"Color de coronilla",initial:"matching_base",fixed:false,note:"Controla únicamente el color sobre la coronilla."},
 {id:"hair_inner_color",group:"hair",label:"Color interior (inner hair)",initial:"matching_base",fixed:false,note:"Controla los mechones interiores sin recolorear toda la melena."},

 {id:"outfit",group:"outfit",label:"Vestimenta",initial:"tactical_baseball",fixed:false,note:"Conjunto principal de vestuario."},
 {id:"outer_layer",group:"outfit",label:"Capa exterior",initial:"none",fixed:false,note:"Chaqueta, capa u otra pieza exterior."},
 {id:"footwear",group:"outfit",label:"Calzado",initial:"combat_sneakers",fixed:false,note:"Calzado seleccionado de forma independiente."},
 {id:"accessory",group:"outfit",label:"Accesorio",initial:"minimal",fixed:false,note:"Accesorios compatibles sin rehacer el personaje completo."},

 {id:"combat_role",group:"combat",label:"Rol de combate",initial:"striker",fixed:false,note:"Rol conceptual del personaje."},
 {id:"baseball_prop",group:"combat",label:"Prop de baseball",initial:"bat",fixed:false,note:"Prop característico asociado a baseball/combat."},
 {id:"pose",group:"combat",label:"Pose",initial:"defiant",fixed:true,note:"Actitud y dirección corporal; cámara avanzada pendiente."},

 {id:"voice",group:"detail",label:"Voz / timbre",initial:"coral_brillante",fixed:false,note:"Identidad sonora conceptual, también expresada en el perfil."},
 {id:"palette_accent",group:"detail",label:"Acento de paleta",initial:"sunset",fixed:false,note:"Color secundario de diseño para reforzar la lectura visual."},
 {id:"quirk",group:"detail",label:"Detalle / quirk",initial:"bat_named",fixed:false,note:"Pequeño detalle distintivo del personaje."}
];
const tabs:{id:Group;label:string;no:string;title:string;subtitle:string}[]=[
 {id:"identity",label:"Identidad",no:"01",title:"Identidad",subtitle:"Personalidad, especie y silueta"},
 {id:"body",label:"Cuerpo",no:"02",title:"Cuerpo",subtitle:"Altura, constitución y proporciones"},
 {id:"anatomy",label:"Anatomía",no:"03",title:"Anatomía",subtitle:"Orejas, cola y rasgos craneales"},
 {id:"face",label:"Cara",no:"04",title:"Cara y expresión",subtitle:"Rasgos faciales, ojos y pupilas"},
 {id:"hair",label:"Cabello",no:"05",title:"Diseño de cabello",subtitle:"Corte, capas, textura y color"},
 {id:"outfit",label:"Vestuario",no:"06",title:"Vestuario",subtitle:"Prendas y accesorios por separado"},
 {id:"combat",label:"Combate",no:"07",title:"Combate",subtitle:"Rol, prop y pose"},
 {id:"detail",label:"Detalle",no:"08",title:"Detalles",subtitle:"Voz, paleta y quirk"}
];
const initialValues=Object.fromEntries(fields.map(f=>[f.id,f.initial])) as Record<FieldId,string>;
const initialFixed=Object.fromEntries(fields.map(f=>[f.id,f.fixed])) as Record<FieldId,boolean>;
function valuesFromCatalog(data:Catalog):Record<FieldId,string>{
 return Object.fromEntries(fields.map(field=>{
  const options=data.categories[field.id]??[];
  const preferred=options.find(option=>option.id===field.initial)?.id;
  return [field.id,preferred??options[0]?.id??"auto"];
 })) as Record<FieldId,string>;
}
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
 const [visualRecipe,setVisualRecipe]=useState<VisualRecipe>({...DEFAULT_VISUAL_RECIPE});
 const [status,setStatus]=useState("Conectando con el motor local de BotImagen…");
 const [showNegative,setShowNegative]=useState(false);
 const [saved,setSaved]=useState(false);
 const [draftDirty,setDraftDirty]=useState(false);
 const [loadingCatalog,setLoadingCatalog]=useState(true);
 const [generating,setGenerating]=useState(false);
 const [savedProfiles,setSavedProfiles]=useState<SavedProfileSummary[]>([]);
 const [loadingProfiles,setLoadingProfiles]=useState(false);
 const [duplicatingProfile,setDuplicatingProfile]=useState<string|null>(null);

 useEffect(()=>{
  const controller=new AbortController();
  async function load(){
   try{
    const catalogResponse=await fetch("/api/catalog",{signal:controller.signal});
    const data=await jsonResponse<Catalog>(catalogResponse);
    if(controller.signal.aborted)return;
    const defaults=valuesFromCatalog(data);
    setCatalog(data);setValues(defaults);setLoadingCatalog(false);setStatus("Catálogo oficial conectado. Generando la ficha inicial…");
    const initialSelections=Object.fromEntries(fields.map(field=>[field.id,field.fixed?defaults[field.id]:"auto"]));
    const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({selections:initialSelections,seed:314159,coherence:.82,surprise:false,visual_recipe:DEFAULT_VISUAL_RECIPE}),signal:controller.signal});
    const result=await jsonResponse<GeneratedCharacter>(response);
    if(controller.signal.aborted)return;
    setGenerated(result);setVisualRecipe(normalizeVisualRecipe(result.visual_recipe ?? DEFAULT_VISUAL_RECIPE));setDraftDirty(false);
    setValues(previous=>{
     const next={...previous};
     for(const field of fields){if(!field.fixed&&result.profile[field.id])next[field.id]=result.profile[field.id]}
     return next;
    });
    const profilesResponse=await fetch("/api/profiles",{signal:controller.signal});
    const profileList=await jsonResponse<{profiles:SavedProfileSummary[]}>(profilesResponse);
    if(controller.signal.aborted)return;
    setSavedProfiles(profileList.profiles);
    setStatus("Motor Python conectado · "+result.style_name+" · semilla "+result.seed);
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
 function updateVisualRecipe(next:VisualRecipe){setVisualRecipe(normalizeVisualRecipe(next));setDraftDirty(true);setSaved(false);setStatus("Receta visual editada. Genera el perfil para sincronizar receta y prompt antes de guardar.");}

 function setValue(id:FieldId,value:string){setValues(p=>({...p,[id]:value}));setDraftDirty(true);setSaved(false);setStatus("Diseño editado. Pulsa «Generar perfil» para actualizar el resultado oficial.")}
 function toggleFixed(id:FieldId){const willFix=!fixed[id];setFixed(p=>({...p,[id]:willFix}));setDraftDirty(true);setSaved(false);setStatus(willFix?"Campo fijado manualmente.":"Campo marcado AUTO; el motor elegirá una opción oficial al generar.")}
 async function generateProfile(){
  if(!catalog){setStatus("El catálogo aún no está disponible. Inicia el servicio local y recarga.");return}
  const normalizedSeed=seed.trim();
  if(!/^-?\d+$/.test(normalizedSeed)||!Number.isSafeInteger(Number(normalizedSeed))){setStatus("La semilla debe ser un número entero válido.");return}
  const numericSeed=Number(normalizedSeed);
  const selections=Object.fromEntries(fields.map(f=>[f.id,fixed[f.id]?values[f.id]:"auto"]));
  const recipeSnapshot=normalizeVisualRecipe(visualRecipe);
  setGenerating(true);setStatus("Generando mediante CharacterGenerator…");
  try{
   const response=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({selections,seed:numericSeed,coherence,surprise:false,visual_recipe:recipeSnapshot})});
   const result=await jsonResponse<GeneratedCharacter>(response);setGenerated({...result,visual_recipe:result.visual_recipe??recipeSnapshot});setVisualRecipe(normalizeVisualRecipe(result.visual_recipe??recipeSnapshot));setDraftDirty(false);
   setValues(previous=>{const next={...previous};for(const field of fields){if(!fixed[field.id]&&result.profile[field.id])next[field.id]=result.profile[field.id]}return next});
   setSaved(false);setStatus("Perfil generado por Python · semilla "+result.seed+" · "+result.style_name);
  }catch(error){setStatus(error instanceof Error?error.message:"El motor local no pudo generar el perfil.")}finally{setGenerating(false)}
 }
 async function refreshProfiles(){
  setLoadingProfiles(true);
  try{
   const response=await fetch("/api/profiles");
   const list=await jsonResponse<{profiles:SavedProfileSummary[]}>(response);
   setSavedProfiles(list.profiles);
   setStatus("Lista de perfiles locales actualizada.");
  }catch(error){setStatus(error instanceof Error?error.message:"No se pudo listar los perfiles locales.")}finally{setLoadingProfiles(false)}
 }
 async function loadProfile(profileId:string){
  try{
   const response=await fetch("/api/profiles/"+encodeURIComponent(profileId));
   const record=await jsonResponse<SavedProfileRecord>(response);
   const selections=record.profile.selections??{};
   const profileResult=record.profile.generated??null;
   const staleSelection=!profileResult||fields.some(field=>{const selected=selections[field.id];return typeof selected!=="string"||(selected!=="auto"&&profileResult.profile[field.id]!==selected)});
   const nextValues={...values};
   const nextFixed={...fixed};
   for(const field of fields){
    const value=selections[field.id];
    if(value==="auto"||typeof value!=="string"){
     nextFixed[field.id]=false;
     const resolved=profileResult?.profile[field.id];
     if(resolved)nextValues[field.id]=resolved;
    }else if(catalog?.categories[field.id]?.some(option=>option.id===value)){
     nextFixed[field.id]=true;
     nextValues[field.id]=value;
    }else{
     nextFixed[field.id]=false;
     const resolved=profileResult?.profile[field.id];
     if(resolved)nextValues[field.id]=resolved;
    }
   }
   setValues(nextValues);setFixed(nextFixed);
   setVisualRecipe(normalizeVisualRecipe(record.profile.visual_recipe ?? profileResult?.visual_recipe ?? DEFAULT_VISUAL_RECIPE));
   setGenerated(profileResult);
   setSeed(String(profileResult?.seed??record.profile.seed??314159));
   setCoherence(profileResult?.coherence??record.profile.coherence??.82);
   setDraftDirty(staleSelection);setSaved(!staleSelection);
   setStatus(staleSelection?"Perfil cargado con cambios no sincronizados. Genera el diseño antes de guardarlo o exportarlo.":"Perfil cargado desde la biblioteca local: "+record.name);
  }catch(error){setStatus(error instanceof Error?error.message:"No se pudo cargar el perfil local.")}
 }
 async function duplicateProfile(profileId:string){
  setDuplicatingProfile(profileId);
  try{
   const sourceResponse=await fetch("/api/profiles/"+encodeURIComponent(profileId));
   const source=await jsonResponse<SavedProfileRecord>(sourceResponse);
   const name=source.name.slice(0,72)+" · Copia";
   const copyResponse=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,profile:source.profile})});
   const copy=await jsonResponse<SavedProfileSummary>(copyResponse);
   setSavedProfiles(previous=>[copy,...previous.filter(item=>item.id!==copy.id)].slice(0,500));
   setStatus("Copia creada sin modificar el original · "+copy.name);
  }catch(error){
   setStatus(error instanceof Error?error.message:"No se pudo duplicar el perfil local.");
  }finally{
   setDuplicatingProfile(null);
  }
 }
 function reset(){
  const defaults=catalog?valuesFromCatalog(catalog):initialValues;
  const next={...defaults};
  if(generated){for(const field of fields){if(!initialFixed[field.id]&&generated.profile[field.id])next[field.id]=generated.profile[field.id]}}
  setValues(next);setFixed(initialFixed);setVisualRecipe({...DEFAULT_VISUAL_RECIPE});setSeed("314159");setCoherence(.82);setDraftDirty(true);setSaved(false);setStatus("Ejemplo restaurado. Pulsa Generar perfil para actualizar el motor.")
 }
 async function saveProfile(){
  if(!generated){setStatus("Genera un perfil antes de guardarlo.");return}
  if(draftDirty){setStatus("Hay cambios pendientes. Genera el diseño actualizado antes de guardarlo para mantener rasgos y prompt sincronizados.");return}
  const profile={schema_version:1,mode:"local-engine",style_id:generated.style_id,seed:generated.seed,coherence:generated.coherence,selections:Object.fromEntries(fields.map(f=>[f.id,fixed[f.id]?values[f.id]:"auto"])),visual_recipe:normalizeVisualRecipe(visualRecipe),generated:{...generated,visual_recipe:normalizeVisualRecipe(visualRecipe)}};
  const name=[labelFor(catalog,"species",values.species),labelFor(catalog,"hair",values.hair),labelFor(catalog,"eyes",values.eyes)].join(" · ");
  try{
   const response=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,profile})});
   const savedProfile=await jsonResponse<SavedProfileSummary>(response);
   setSavedProfiles(previous=>[savedProfile,...previous.filter(item=>item.id!==savedProfile.id)]);
   setSaved(true);setStatus("Perfil guardado en generated_characters/web_profiles · "+savedProfile.name);
  }catch(error){setStatus(error instanceof Error?error.message:"No se pudo guardar el perfil en el disco local.")}
 }
 async function copyPrompt(){try{await navigator.clipboard.writeText(showNegative?prompt+"\n\nNEGATIVE PROMPT:\n"+negative:prompt);setStatus("Texto oficial copiado al portapapeles.")}catch{setStatus("No se pudo acceder al portapapeles; selecciona y copia el texto manualmente.")}}
 function exportJson(){
  const data={schema_version:1,mode:"local-engine",style_id:generated?.style_id??catalog?.style.id??"bw-modern-gacha-v1",seed:Number.parseInt(seed,10),coherence,selections:Object.fromEntries(fields.map(f=>[f.id,fixed[f.id]?values[f.id]:"auto"])),visual_recipe:normalizeVisualRecipe(visualRecipe),generated};
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
   <section className="heading"><div><div className="eyebrow"><i/> ESTUDIO DE PERSONAJES <span>BIMG-004</span></div><h1>Diseña una nueva <em>waifu.</em></h1><p>Selecciona rasgos del catálogo real y deja que el motor complete los campos AUTO.</p></div><div className="heading-buttons"><button className="btn muted" onClick={reset} type="button" disabled={generating}>Restaurar ejemplo</button><button className="btn primary" onClick={() => void saveProfile()} type="button" disabled={!generated||draftDirty||generating}>＋ {draftDirty?"Genera para guardar":saved?"Perfil guardado":"Guardar perfil local"}</button></div></section>
   <div className="workspace">
    <section className="preview-area">
     <div className="kicker"><span><i>01</i> LIENZO DEL PERSONAJE</span><small>PREVIEW <i/></small></div>
     <div className="canvas" style={stageVars}>
      <div className="grid-bg"/><div className="halo halo-a"/><div className="halo halo-b"/>
      <div className="canvas-labels"><span>BW / DESIGN STUDY</span><span>#{(Number.parseInt(seed,10)||314159).toString().padStart(6,"0").slice(-6)}</span></div><div className="watermark">CHARACTER<br/>PROTOTYPE</div>
      <VisualCharacterRenderer values={values} recipe={visualRecipe}/>
      <div className="side-mark left"><span>01</span>IDENTITY</div><div className="side-mark right"><span>02</span>SILHOUETTE</div>
      <div className="canvas-footer"><div><i/><b>{labelFor(catalog,"species",values.species).toUpperCase()} STUDY</b><small>ILUSTRACIÓN NO GENERADA</small></div><div className="swatches"><i style={{background:colorFor(values.hair)}}/><i style={{background:values.hair_secondary_color==="oro_metalico"?"#d7ae59":"#a6abc0"}}/><i style={{background:values.eyes==="ambar"?"#d6a54d":"#7396df"}}/></div></div>
     </div>
     <div className="summary"><div><small>COMBINACIÓN ACTUAL</small><b>{labelFor(catalog,"species",values.species)} · {labelFor(catalog,"hair",values.hair)} · {labelFor(catalog,"eyes",values.eyes)}</b><span>{generated?"Estilo oficial: "+generated.style_name:"El motor aún no ha devuelto un perfil."}</span></div><div className="counts"><b>{Object.values(fixed).filter(Boolean).length}<small>FIJOS</small></b><b>{Object.values(fixed).filter(v=>!v).length}<small>AUTO</small></b></div></div>
     <VisualStyleLab recipe={visualRecipe} values={values} onChange={updateVisualRecipe}/><div className="roadmap"><b>✦ Motor visual CyberStreet</b><span>Vista vectorial original con estados NanoWear, receta visual versionada y Chromapatch persistente. La geometría es 2D estilizada, no un modelo 3D ni una ilustración final generada.</span></div>
    </section>
    <section className="controls-area">
     <div className="control-panel">
      <div className="kicker"><span><i>02</i> CONFIGURACIÓN</span><small>{tab.no} / 08</small></div>
      <div className="tabs" role="tablist" aria-label="Categorías del personaje">{tabs.map(t=><button key={t.id} type="button" role="tab" aria-selected={group===t.id} className={group===t.id?"tab selected":"tab"} onClick={()=>setGroup(t.id)}><small>{t.no}</small>{t.label}</button>)}</div>
      <div className="control-heading"><h2>{tab.title}</h2><p>{tab.subtitle}</p></div>
      <div className="fields">{visible.map(field=>{
       const options=catalog?.categories[field.id]??[];const current=values[field.id];const exists=options.some(item=>item.id===current);
       return <div className={fixed[field.id]?"field":"field is-auto"} key={field.id}>
        <div className="field-label"><label htmlFor={"trait-"+field.id}>{catalog?.trait_labels[field.id]??field.label}</label><button type="button" className={fixed[field.id]?"lock fixed":"lock auto"} aria-pressed={fixed[field.id]} onClick={()=>toggleFixed(field.id)} disabled={generating}>{fixed[field.id]?"● FIJO":"◇ AUTO"}</button></div>
        <select id={"trait-"+field.id} value={exists?current:""} disabled={!fixed[field.id]||loadingCatalog||!options.length||generating} onChange={event=>setValue(field.id,event.target.value)}>{!exists&&<option value="" disabled>{loadingCatalog?"Cargando catálogo…":"Seleccionar opción"}</option>}{options.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select><p>{field.note}</p>
       </div>
      })}</div>
      <div className="seed-row"><span><b>SEMILLA DEL GENERADOR</b><small>La semilla se envía al motor Python real.</small></span><input aria-label="Semilla del generador" value={seed} inputMode="numeric" disabled={generating} onChange={event=>{setSeed(event.target.value.replace(/[^0-9-]/g,"").slice(0,17));setDraftDirty(true);setSaved(false)}}/></div>
      <div className="seed-row"><span><b>COHERENCIA · {Math.round(coherence*100)}%</b><small>Controla las alternativas elegidas en AUTO.</small></span><input aria-label="Coherencia" type="range" min="0" max="100" value={Math.round(coherence*100)} disabled={generating} onChange={event=>{setCoherence(Number(event.target.value)/100);setDraftDirty(true);setSaved(false)}}/></div>
      <button className="btn primary wide" type="button" disabled={!catalog||generating} onClick={()=>void generateProfile()}>{generating?"Generando…":"✦ Generar perfil con motor local"} <span>→</span></button>
      <details className="saved-profile-panel">
       <summary>Perfiles locales ({savedProfiles.length})</summary>
       <button className="btn muted refresh-profiles" type="button" disabled={loadingProfiles||generating} onClick={()=>void refreshProfiles()}>{loadingProfiles?"Actualizando…":"Actualizar lista"}</button>
       {savedProfiles.length===0?<p className="saved-profile-empty">Aún no hay perfiles guardados. Genera uno y pulsa Guardar perfil local.</p>:<div className="saved-profile-list">{savedProfiles.map(item=><div className="saved-profile-row" key={item.id}><button className="saved-profile-item" type="button" disabled={generating} onClick={()=>void loadProfile(item.id)}><strong>{item.name}</strong><small>{item.style_id||"Estilo sin etiqueta"} · semilla {item.seed??"AUTO"}</small></button><button className="saved-profile-copy" type="button" aria-label={"Duplicar "+item.name} title="Crear copia independiente" disabled={duplicatingProfile===item.id||generating} onClick={()=>void duplicateProfile(item.id)}>{duplicatingProfile===item.id?"…":"Duplicar"}</button></div>)}</div>}
      </details>
     </div>
     <div className="prompt-panel"><div className="kicker"><span><i>03</i> DESCRIPCIÓN DEL DISEÑO</span><small>{draftDirty?"CAMBIOS PENDIENTES":generated?"MOTOR PYTHON":"ESPERANDO MOTOR"}</small></div><pre>{showNegative?prompt+"\n\nNEGATIVE PROMPT:\n"+negative:prompt}</pre><div className="prompt-actions"><button type="button" className="btn muted" disabled={draftDirty||!generated||generating} onClick={()=>setShowNegative(v=>!v)}>{showNegative?"Ocultar negativo":"Ver negative prompt"}</button><button type="button" className="btn copy" disabled={draftDirty||!generated||generating} onClick={()=>void copyPrompt()}>Copiar texto ↗</button><button type="button" className="btn muted" disabled={draftDirty||!generated||generating} onClick={exportJson}>{draftDirty?"Genera antes de exportar":"Exportar JSON"}</button></div>{generated&&<details className="rationale"><summary>Justificación del motor</summary><p>{generated.rationale}</p></details>}</div>
    </section>
   </div>
   <footer className="main-footer"><span><i/>{status}</span><small>{catalog?"CATÁLOGO OFICIAL · MOTOR LOCAL":"API LOCAL · 127.0.0.1:8765"}</small></footer>
  </main>
 </div>
}
