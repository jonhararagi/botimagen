import { useEffect, useState } from "react";

type Asset = { id:string; label:string; category:string; kind:string; width:number; height:number; available?:boolean };
type PieceCategory = "body"|"hair_back"|"hair_front"|"face"|"top"|"bottom"|"coat"|"accessory";
const categories: {id:PieceCategory;label:string}[] = [
 {id:"body",label:"Cuerpo base"},{id:"hair_back",label:"Cabello trasero"},{id:"hair_front",label:"Cabello frontal"},
 {id:"face",label:"Rostro"},{id:"top",label:"Prenda superior"},{id:"bottom",label:"Prenda inferior"},
 {id:"coat",label:"Abrigo"},{id:"accessory",label:"Accesorio"}
];
const anchorPending = "Los anclajes deben revisarse visualmente antes de habilitar esta pieza para composición de producción.";
export function ModularCharacterComposer() {
 const [assets,setAssets]=useState<Asset[]>([]);
 const [selected,setSelected]=useState<Partial<Record<PieceCategory,string>>>({});
 const [preview,setPreview]=useState("");
 const [message,setMessage]=useState("Importa piezas PNG transparentes en la biblioteca. Las ilustraciones completas no se convierten automáticamente en piezas.");
 const [busy,setBusy]=useState(false);
 const [profileName,setProfileName]=useState("Mi personaje modular");
 const [offset,setOffset]=useState(0);
 async function refresh() {
  try { const r=await fetch("/api/modular-assets"); if(!r.ok) throw new Error("No se pudo consultar la biblioteca.");
   const data=await r.json(); setAssets(Array.isArray(data)?data:[]);
  } catch { setMessage("Biblioteca no disponible. Comprueba que el motor local esté iniciado."); }
 }
 useEffect(()=>{void refresh()},[]);
 const byId=(id:string)=>assets.find(a=>a.id===id);
 async function compose() {
  setBusy(true); setMessage("Componiendo…");
  try {
   const pieces=categories.flatMap(({id})=>{
    const asset=byId(selected[id]||""); if(!asset) return [];
    return [{schema_version:1,id:asset.id,category:id,resource:asset.id,
     dimensions:{width:asset.width,height:asset.height},anchors:{origin:{x:.5,y:.5}},
     transform:{x:offset/1000,y:0,scale_x:1,scale_y:1,rotation:0},
     layer_order:({hair_back:10,body:20,bottom:36,top:40,coat:45,face:50,accessory:60,hair_front:70} as Record<string,number>)[id],
     anchors_validated:id==="body",compatible_with:[]}];
   });
   const r=await fetch("/api/modular-compose",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({pieces,canvas_size:[1024,1024]})});
   const data=await r.json(); if(!r.ok) throw new Error(data.error||"No se pudo componer.");
   setPreview("data:image/png;base64,"+data.png_base64); setMessage("Vista previa generada. Las piezas con anclajes pendientes se rechazan, no se marcan como arte validado.");
  } catch(e) { setMessage(e instanceof Error?e.message:"Error de composición desconocido."); }
  finally {setBusy(false)}
 }
 function saveProfile() {
  const payload={schema_version:1,pieces:selected,transforms:{offset_x:offset}};
  localStorage.setItem("botimagen.modular-profile.v1",JSON.stringify({name:profileName,modular_composition:payload}));
  setMessage("Perfil modular guardado en este navegador.");
 }
 function loadProfile() {
  try {const value=JSON.parse(localStorage.getItem("botimagen.modular-profile.v1")||"null");
   if(!value?.modular_composition?.pieces) throw new Error("No hay perfil modular guardado.");
   setProfileName(value.name||"Mi personaje modular");setSelected(value.modular_composition.pieces);
   setOffset(value.modular_composition.transforms?.offset_x||0);setMessage("Perfil modular recuperado.");setPreview("");
  } catch(e) {setMessage(e instanceof Error?e.message:"No se pudo cargar el perfil.");}
 }
 function exportPng() {
  if(!preview) {setMessage("Primero genera una composición válida.");return}
  const a=document.createElement("a");a.href=preview;a.download="botimagen-personaje-modular.png";a.click();
 }
 return <section className="modular-composer" aria-label="Ensamblador de personaje por capas">
  <div className="kicker"><span><i>04</i> ENSAMBLADOR MODULAR</span><small>CONTRATO V1</small></div>
  <p>Selecciona recursos importados por categoría. El ensamblador no deduce anatomía ni valida automáticamente los anclajes.</p>
  <div className="modular-composer-grid">
   <div className="modular-composer-controls">
    {categories.map(c=><label key={c.id}>{c.label}<select value={selected[c.id]||""} onChange={e=>{setSelected(v=>({...v,[c.id]:e.target.value}));setPreview("")}}>
     <option value="">Sin seleccionar</option>{assets.filter(a=>a.available!==false).map(a=><option key={a.id} value={a.id}>{a.label} · {a.width}×{a.height}</option>)}
    </select></label>)}
    <label>Nombre del perfil<input value={profileName} maxLength={80} onChange={e=>setProfileName(e.target.value)}/></label>
    <label>Ajuste horizontal de calibración: {offset}<input type="range" min="-200" max="200" value={offset} onChange={e=>{setOffset(Number(e.target.value));setPreview("")}}/></label>
    <p className="modular-warning">{anchorPending}</p>
    <div className="prompt-actions"><button className="btn primary" disabled={busy} onClick={()=>void compose()}>{busy?"Componiendo…":"Componer PNG"}</button>
    <button className="btn muted" onClick={saveProfile}>Guardar perfil</button><button className="btn muted" onClick={loadProfile}>Cargar perfil</button>
    <button className="btn muted" disabled={!preview} onClick={exportPng}>Exportar PNG</button><button className="btn muted" onClick={()=>void refresh()}>Actualizar biblioteca</button></div>
   </div>
   <div className="modular-composer-preview">{preview?<img src={preview} alt="Previsualización PNG del personaje compuesto"/>:<div>La composición aparecerá aquí cuando las piezas seleccionadas superen las validaciones.</div>}</div>
  </div><p role="status">{message}</p>
 </section>;
}
