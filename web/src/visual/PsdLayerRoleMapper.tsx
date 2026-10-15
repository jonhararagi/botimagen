import { useEffect, useMemo, useState } from "react";

type LayerRole = "unassigned" | "body" | "face" | "eyes" | "hair" | "clothing" | "accessory" | "expression" | "shadow" | "background" | "other";
type LayerAsset = { id:string; name:string; label:string; layer_path:string; path:string; bytes:number; width:number; height:number; sha256:string; source_member:string; source_psd:string; source_url:string; license:string; category:string };
type LayerCatalog = { schema_version:number; title:string; source_url:string; creator:string; license:string; psd_count:number; layer_count:number; assets:LayerAsset[] };
type Assignment = { role:LayerRole; note:string; updatedAt:string };
const STORAGE_KEY = "botimagen-cc0-psd-layer-roles-v1";
const ROLES:Array<{value:LayerRole;label:string}> = [
 {value:"unassigned",label:"Sin asignar"},{value:"body",label:"Cuerpo / silueta"},{value:"face",label:"Rostro"},
 {value:"eyes",label:"Ojos"},{value:"hair",label:"Cabello"},{value:"clothing",label:"Ropa / prendas"},
 {value:"accessory",label:"Accesorio"},{value:"expression",label:"Expresión facial"},{value:"shadow",label:"Sombra / detalle"},
 {value:"background",label:"Fondo"},{value:"other",label:"Otro / revisar"}
];
function psdLabel(asset:LayerAsset):string { return asset.source_psd.split("/").slice(-3).join("/"); }
function sourceLabel(asset:LayerAsset):string { const p=asset.source_member.split("/"); return p.length>1 ? p[0]+" · "+p.slice(1).join("/") : asset.source_member; }
function parseAssignments(raw:unknown):Record<string,Assignment> {
 if(!raw||typeof raw!=="object"||Array.isArray(raw)) return {};
 const output:Record<string,Assignment>={};
 for(const [id,value] of Object.entries(raw)) {
  if(!value||typeof value!=="object") continue;
  const candidate=value as Partial<Assignment>;
  output[id]={role:ROLES.some(r=>r.value===candidate.role)?candidate.role as LayerRole:"unassigned",note:typeof candidate.note==="string"?candidate.note.slice(0,240):"",updatedAt:typeof candidate.updatedAt==="string"?candidate.updatedAt:""};
 }
 return output;
}
export function PsdLayerRoleMapper() {
 const [catalog,setCatalog]=useState<LayerCatalog|null>(null);
 const [assignments,setAssignments]=useState<Record<string,Assignment>>({});
 const [hydrated,setHydrated]=useState(false);
 const [query,setQuery]=useState("");
 const [sourceFilter,setSourceFilter]=useState("all");
 const [roleFilter,setRoleFilter]=useState<"all"|"assigned"|"unassigned">("all");
 const [status,setStatus]=useState("Cargando las 43 capas PSD CC0…");
 const [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  try { const raw=localStorage.getItem(STORAGE_KEY); if(raw) setAssignments(parseAssignments(JSON.parse(raw))); }
  catch { setStatus("No se pudieron leer las asignaciones guardadas; podés volver a asignar roles."); }
  finally { setHydrated(true); }
  void fetch("/cc0-character-library/psd-layers-manifest.json",{cache:"no-cache"}).then(async response=>{
   if(!response.ok) throw new Error("El catálogo de capas PSD CC0 no está disponible.");
   const payload=await response.json() as LayerCatalog;
   if(!Array.isArray(payload.assets)||payload.assets.length!==payload.layer_count) throw new Error("El catálogo PSD está incompleto o no coincide con su inventario.");
   if(active){setCatalog(payload);setStatus(payload.assets.length+" capas listas para asignación manual.");setError("");}
  }).catch(reason=>{if(active){setError(reason instanceof Error?reason.message:"No se pudo cargar el catálogo PSD.");setStatus("No se pudo cargar el catálogo de capas.");}});
  return ()=>{active=false;};
 },[]);
 useEffect(()=>{
  if(!hydrated) return;
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(assignments)); }
  catch { setStatus("No se pudieron guardar los cambios. Exportá el JSON para conservarlos."); }
 },[assignments,hydrated]);
 const sources=useMemo(()=>catalog?Array.from(new Set(catalog.assets.map(psdLabel))).sort((a,b)=>a.localeCompare(b)):[],[catalog]);
 const filtered=useMemo(()=>{
  if(!catalog) return [];
  const needle=query.trim().toLocaleLowerCase();
  return catalog.assets.filter(asset=>{
   const role=assignments[asset.id]?.role??"unassigned";
   const text=[asset.label,asset.name,asset.layer_path,asset.source_member,asset.source_psd].join(" ").toLocaleLowerCase();
   return (!needle||text.includes(needle))&&(sourceFilter==="all"||psdLabel(asset)===sourceFilter)&&(roleFilter==="all"||(roleFilter==="assigned"?role!=="unassigned":role==="unassigned"));
  });
 },[assignments,catalog,query,roleFilter,sourceFilter]);
 const assigned=useMemo(()=>Object.values(assignments).filter(item=>item.role!=="unassigned").length,[assignments]);
 const update=(asset:LayerAsset,changes:Partial<Assignment>)=>{
  setAssignments(previous=>{const current=previous[asset.id]??{role:"unassigned" as LayerRole,note:"",updatedAt:""};return {...previous,[asset.id]:{...current,...changes,updatedAt:new Date().toISOString()}};});
  setStatus("Asignación guardada: "+asset.id+".");
 };
 const exportJson=()=>{
  if(!catalog)return;
  const payload={schema_version:1,title:"BotImagen · asignación manual de roles para capas PSD CC0",exported_at:new Date().toISOString(),source_url:catalog.source_url,creator:catalog.creator,license:catalog.license,total_layers:catalog.assets.length,assigned_layers:assigned,assignments:catalog.assets.map(asset=>({asset_id:asset.id,label:asset.label,role:assignments[asset.id]?.role??"unassigned",note:assignments[asset.id]?.note??"",preview_path:asset.path,source_member:asset.source_member,source_psd:asset.source_psd,source_url:asset.source_url,license:asset.license,sha256:asset.sha256,updated_at:assignments[asset.id]?.updatedAt??""}))};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));
  const anchor=document.createElement("a");anchor.href=url;anchor.download="botimagen-psd-layer-roles.json";anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  setStatus("JSON exportado con roles, notas, hashes y procedencia.");
 };
 const reset=()=>{setAssignments({});setStatus("Asignaciones reiniciadas. Todas las capas vuelven a «Sin asignar».");};
 return <section className="psd-role-mapper" data-testid="psd-layer-role-mapper" aria-labelledby="psd-role-title">
  <style>{[
   ".psd-role-mapper{margin:24px 0;padding:clamp(14px,2.4vw,24px);border:1px solid #494064;border-radius:18px;background:linear-gradient(145deg,#191525,#101019);color:#f5f0ff}",
   ".psd-role-mapper *{box-sizing:border-box}.psd-role-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}",
   ".psd-role-mapper h2{margin:0 0 7px;font-size:21px}.psd-role-mapper p{margin:0;color:#bcb5d0;line-height:1.5}",
   ".psd-role-counts,.psd-role-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.psd-role-chip{border:1px solid #514568;border-radius:999px;padding:5px 9px;font-size:12px;color:#e2d4ff;background:#231d31}",
   ".psd-role-mapper button,.psd-role-mapper select,.psd-role-mapper input,.psd-role-mapper textarea{font:inherit}.psd-role-mapper button{border:1px solid #5a4b76;border-radius:10px;padding:10px 12px;background:#292238;color:#fff;cursor:pointer}.psd-role-mapper button:disabled{opacity:.55;cursor:not-allowed}.psd-role-mapper .psd-role-primary{background:#bba1ff;border-color:#d1c2ff;color:#171021;font-weight:750}",
   ".psd-role-toolbar{display:grid;grid-template-columns:minmax(180px,1.5fr) repeat(2,minmax(150px,1fr));gap:10px;margin:18px 0}.psd-role-toolbar input,.psd-role-toolbar select,.psd-role-card select,.psd-role-note{width:100%;min-width:0;border:1px solid #49445d;border-radius:9px;padding:10px;background:#0d0c14;color:#f8f3ff}",
   ".psd-role-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr));gap:12px}.psd-role-card{min-width:0;overflow:hidden;border:1px solid #393348;border-radius:12px;background:#12111b}",
   ".psd-role-preview{height:190px;display:flex;align-items:center;justify-content:center;padding:8px;background-color:#222131;background-image:linear-gradient(45deg,#2c2a3c 25%,transparent 25%),linear-gradient(-45deg,#2c2a3c 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2c2a3c 75%),linear-gradient(-45deg,transparent 75%,#2c2a3c 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0}.psd-role-preview img{display:block;width:100%;height:100%;object-fit:contain}",
   ".psd-role-card-content{padding:10px;display:grid;gap:8px}.psd-role-layer-name{font-size:13px;font-weight:700;overflow-wrap:anywhere}.psd-role-source{font-size:11px;color:#b5aec9;overflow-wrap:anywhere}.psd-role-dims{font-size:11px;color:#a49cb9}.psd-role-note{resize:vertical;min-height:58px;font-size:12px}.psd-role-mapper .psd-role-status{margin-top:12px;font-size:12px;color:#d3c5ff}.psd-role-mapper .psd-role-error{margin-top:12px;color:#ffb8c5}.psd-role-empty{padding:24px;text-align:center;border:1px dashed #514568;border-radius:12px;color:#c9c0dc}",
   "@media(max-width:680px){.psd-role-toolbar{grid-template-columns:1fr}.psd-role-preview{height:165px}.psd-role-actions{width:100%}.psd-role-actions button{flex:1}}"
  ].join("\n")}</style>
  <div className="psd-role-head"><div>
   <h2 id="psd-role-title">Clasificador visual de capas PSD CC0</h2>
   <p>Revisá cada recorte real, elegí su función y guardá la asignación en este navegador. Los nombres originales se conservan aunque no describan la pieza.</p>
   <div className="psd-role-counts" aria-label="Resumen de asignación"><span className="psd-role-chip">{catalog?.psd_count??10} PSD de origen</span><span className="psd-role-chip">{catalog?.layer_count??43} capas extraídas</span><span className="psd-role-chip">{assigned} asignadas</span><span className="psd-role-chip">{Math.max(0,(catalog?.layer_count??43)-assigned)} pendientes</span></div>
  </div><div className="psd-role-actions"><button className="psd-role-primary" type="button" disabled={!catalog} onClick={exportJson}>Exportar asignaciones JSON</button><button type="button" disabled={assigned===0} onClick={reset}>Reiniciar roles</button></div></div>
  <div className="psd-role-toolbar">
   <input aria-label="Buscar capas PSD" placeholder="Buscar nombre, personaje o PSD…" value={query} onChange={event=>setQuery(event.target.value)}/>
   <select aria-label="Filtrar capas por archivo PSD" value={sourceFilter} onChange={event=>setSourceFilter(event.target.value)}><option value="all">Todos los PSD de origen</option>{sources.map(source=><option key={source} value={source}>{source}</option>)}</select>
   <select aria-label="Filtrar capas por asignación" value={roleFilter} onChange={event=>setRoleFilter(event.target.value as "all"|"assigned"|"unassigned")}><option value="all">Todas las asignaciones</option><option value="unassigned">Solo pendientes</option><option value="assigned">Solo asignadas</option></select>
  </div>
  {error&&<p className="psd-role-error" role="alert">{error}</p>}
  <div className="psd-role-grid" aria-live="polite">{filtered.map(asset=>{
   const assignment=assignments[asset.id]??{role:"unassigned" as LayerRole,note:"",updatedAt:""};
   return <article className="psd-role-card" data-layer-id={asset.id} key={asset.id}>
    <div className="psd-role-preview"><img src={asset.path} alt={"Vista previa de "+asset.label} loading="lazy"/></div>
    <div className="psd-role-card-content"><div className="psd-role-layer-name">{asset.id} · {asset.label}</div><div className="psd-role-source">{sourceLabel(asset)}</div><div className="psd-role-source">{psdLabel(asset)}</div><div className="psd-role-dims">{asset.width} × {asset.height} px · {Math.max(1,Math.round(asset.bytes/1024))} KB</div>
     <label><span className="psd-role-source">Rol semántico</span><select aria-label={"Rol para "+asset.id} value={assignment.role} onChange={event=>update(asset,{role:event.target.value as LayerRole})}>{ROLES.map(role=><option key={role.value} value={role.value}>{role.label}</option>)}</select></label>
     <label><span className="psd-role-source">Nota manual (opcional)</span><textarea className="psd-role-note" aria-label={"Nota para "+asset.id} maxLength={240} placeholder="Ej. mechón frontal, ojo cerrado, manga…" value={assignment.note} onChange={event=>update(asset,{note:event.target.value})}/></label>
    </div>
   </article>;
  })}</div>
  {catalog&&filtered.length===0&&<div className="psd-role-empty">No hay capas que coincidan con estos filtros.</div>}
  <p className="psd-role-status" role="status">{status} Mostrando {filtered.length} de {catalog?.layer_count??43} capas. Las asignaciones son locales; exportá el JSON para compartirlas o incorporarlas al motor.</p>
  <p className="psd-role-source">Fuente: <a href="https://opengameart.org/content/visual-novel-character-sprite" target="_blank" rel="noreferrer">FALLiNG_AiR · OpenGameArt</a> · CC0 1.0 indicado en la ficha. La clasificación es manual y no altera los PNG originales.</p>
 </section>;
}
