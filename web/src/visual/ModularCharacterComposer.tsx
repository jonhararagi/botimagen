import { useEffect, useMemo, useState } from "react";

type Layer = { id:string; label:string; role:string; slot:string; z:number; editable:boolean; enabled_by_default:boolean };
type Manifest = { schema_version:number; pack_id:string; title:string; width:number; height:number; layers:Layer[] };
type Saved = { id:string; name:string; saved_at:string; style_id:string; seed:number|null };
const defaultEnabled:Record<string,boolean> = {
 "base-body":true,"skirt-tech-pleated":true,"top-neon-jacket":true,"hair-midnight-cyan":true
};

export function ModularCharacterComposer() {
 const [manifest,setManifest]=useState<Manifest|null>(null);
 const [enabled,setEnabled]=useState<Record<string,boolean>>(defaultEnabled);
 const [svg,setSvg]=useState("");
 const [message,setMessage]=useState("Cargando el paquete CyberStreet local…");
 const [busy,setBusy]=useState(false);
 const [profileName,setProfileName]=useState("Mi personaje CyberStreet");
 const [profiles,setProfiles]=useState<Saved[]>([]);
 const [profileId,setProfileId]=useState("");

 const svgUrl=useMemo(()=>svg?URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"})):"",[svg]);
 useEffect(()=>()=>{if(svgUrl)URL.revokeObjectURL(svgUrl)},[svgUrl]);

 async function refreshProfiles() {
  try { const r=await fetch("/api/profiles"); if(!r.ok) throw new Error(); const d=await r.json(); setProfiles(Array.isArray(d.profiles)?d.profiles:[]); }
  catch { setMessage("No se pudieron cargar los perfiles guardados en el motor local."); }
 }
 useEffect(()=>{void (async()=>{try{const r=await fetch("/api/modular-cyberstreet");const d=await r.json();if(!r.ok)throw new Error(d.error||"Paquete no disponible.");setManifest(d);const defaults=Object.fromEntries(d.layers.map((l:Layer)=>[l.id,l.enabled_by_default]));setEnabled(defaults);setMessage("Paquete SVG real cargado. Elige una sola alternativa por ranura.");await render(defaults);}catch(e){setMessage(e instanceof Error?e.message:"No se pudo cargar CyberStreet.");}})();void refreshProfiles();},[]);

 async function render(selection=enabled) {
  setBusy(true);
  try { const r=await fetch("/api/modular-cyberstreet/render",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:selection})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Falló el render SVG.");setSvg(d.svg);setMessage("Composición actualizada desde los SVG originales del paquete."); }
  catch(e){setMessage(e instanceof Error?e.message:"Error de render desconocido.");}
  finally{setBusy(false);}
 }
 function toggle(id:string,value:boolean) {
  const next={...enabled};
  const activeLayer=manifest?.layers.find(layer=>layer.id===id);
  if(value&&activeLayer?.slot) {
   for(const sibling of manifest?.layers||[]) if(sibling.slot===activeLayer.slot&&sibling.id!==id) next[sibling.id]=false;
  }
  next[id]=value;setEnabled(next);void render(next);
 }
 async function saveProfile() {
  setBusy(true);
  try {const r=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:profileName,profile:{modular_composition:{schema_version:1,pack_id:manifest?.pack_id,enabled}}})});const d=await r.json();if(!r.ok)throw new Error(d.error||"No se pudo guardar el perfil.");setProfileId(d.id||"");await refreshProfiles();setMessage("Perfil guardado en el almacenamiento local del motor.");}
  catch(e){setMessage(e instanceof Error?e.message:"Error guardando perfil.");}
  finally{setBusy(false);}
 }
 async function loadProfile() {
  if(!profileId){setMessage("Selecciona un perfil guardado.");return;}
  setBusy(true);
  try {const r=await fetch("/api/profiles/"+encodeURIComponent(profileId));const d=await r.json();if(!r.ok)throw new Error(d.error||"No se pudo recuperar el perfil.");const comp=d.profile?.modular_composition;const saved=comp?.enabled;if(!saved||typeof saved!=="object")throw new Error("El perfil no contiene selecciones CyberStreet.");const next=Object.fromEntries((manifest?.layers||[]).map(layer=>[layer.id,typeof saved[layer.id]==="boolean"?saved[layer.id]:layer.enabled_by_default]));if(!(manifest?.layers||[]).some(layer=>layer.slot==="body"&&next[layer.id]===true))next["base-body"]=true;setProfileName(d.name||"Mi personaje CyberStreet");setEnabled(next);await render(next);setMessage("Selecciones recuperadas del perfil local.");}
  catch(e){setMessage(e instanceof Error?e.message:"Error cargando perfil.");}
  finally{setBusy(false);}
 }
 async function exportPng() {
  if(!svg){setMessage("Primero renderiza una composición.");return;}
  setBusy(true);
  try {
   const image=new Image();const url=URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"}));
   await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error("El navegador no pudo rasterizar el SVG."));image.src=url;});
   const canvas=document.createElement("canvas");canvas.width=manifest?.width||512;canvas.height=manifest?.height||768;
   const context=canvas.getContext("2d");if(!context)throw new Error("Canvas 2D no disponible.");
   context.clearRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);URL.revokeObjectURL(url);
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("No se pudo crear el PNG.")),"image/png"));
   const downloadUrl=URL.createObjectURL(blob);const a=document.createElement("a");a.href=downloadUrl;a.download="botimagen-cyberstreet.png";a.click();URL.revokeObjectURL(downloadUrl);setMessage("PNG exportado con fondo transparente y lienzo 512×768.");
  } catch(e){setMessage(e instanceof Error?e.message:"Falló la exportación PNG.");}
  finally{setBusy(false);}
 }
 return <section className="modular-composer" aria-label="Ensamblador CyberStreet por capas">
  <div className="kicker"><span><i>04</i> PERSONAJE MODULAR</span><small>CYBERSTREET SVG</small></div>
  <p>Composición real del paquete local 512×768. El cuerpo base es obligatorio; las otras capas se pueden alternar.</p>
  <div className="modular-composer-grid">
   <div className="modular-composer-controls">
    {manifest?.layers.map(layer=><label key={layer.id} className="modular-layer-toggle"><input type="checkbox" checked={enabled[layer.id]!==false} disabled={!layer.editable||layer.id==="base-body"||busy} onChange={e=>toggle(layer.id,e.target.checked)}/><span>{layer.label}</span><small>{layer.role}</small></label>)}
    <label>Nombre del perfil<input value={profileName} maxLength={80} onChange={e=>setProfileName(e.target.value)}/></label>
    <label>Perfiles guardados<select value={profileId} onChange={e=>setProfileId(e.target.value)}><option value="">Seleccionar perfil</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.name} · {new Date(p.saved_at).toLocaleString()}</option>)}</select></label>
    <div className="prompt-actions"><button className="btn primary" disabled={busy||!manifest} onClick={()=>void render()}>{busy?"Renderizando…":"Actualizar composición"}</button><button className="btn muted" disabled={busy} onClick={()=>void saveProfile()}>Guardar perfil</button><button className="btn muted" disabled={busy||!profileId} onClick={()=>void loadProfile()}>Restaurar perfil</button><button className="btn muted" disabled={busy||!svg} onClick={()=>void exportPng()}>Exportar PNG</button><button className="btn muted" onClick={()=>void refreshProfiles()}>Actualizar perfiles</button></div>
   </div>
   <div className="modular-composer-preview">{svgUrl?<img src={svgUrl} alt="Personaje CyberStreet compuesto con capas SVG reales" style={{width:"100%",maxHeight:"640px",objectFit:"contain"}}/>:<div>El personaje aparecerá cuando el paquete SVG esté disponible.</div>}</div>
  </div><p role="status" aria-live="polite">{message}</p>
 </section>;
}
