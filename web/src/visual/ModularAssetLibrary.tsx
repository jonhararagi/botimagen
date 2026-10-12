import { useEffect, useRef, useState } from "react";
import { convertToModularStage } from "./pngToModularAsset";
import type { AssetConversionMetadata } from "./pngToModularAsset";

type UserAsset = {
  id: string; label: string; category: string; kind: string; filename: string; source_filename?: string;
  source_asset_id?: string | null; mime_type: string; width: number; height: number; bytes: number; sha256: string;
  view: string; license: string; source_url: string; duplicate?: boolean; available?: boolean;
  layer_order?: number | null; anchor_estimate?: Record<string, {x:number;y:number}>;
  anchors_validated?: boolean; anchor_status?: string; conversion?: AssetConversionMetadata | null; note?: string;
};
type PreviewItem = { file:File; url:string; convertedUrl?:string; convertedBlob?:Blob; conversion?:AssetConversionMetadata };
const categories = [
  ["reference", "Referencia / clasificar después"], ["body", "Cuerpo base"], ["head", "Cabeza"],
  ["face", "Rostro"], ["hair_back", "Cabello posterior"], ["hair_front", "Cabello frontal"],
  ["eyes", "Ojos"], ["brows", "Cejas"], ["mouth", "Boca"], ["clothing_top", "Prenda superior"],
  ["clothing_bottom", "Prenda inferior"], ["footwear", "Calzado"], ["accessory_back", "Accesorio posterior"],
  ["accessory_front", "Accesorio frontal"], ["portrait", "Retrato / personaje completo"],
] as const;
const rigCategories:Record<string,string> = {
  body:"body", head:"head", face:"face", hair_back:"hair_back", hair_front:"hair_front",
  eyes:"eyes", brows:"brows", mouth:"mouth", clothing_top:"top", clothing_bottom:"bottom",
  footwear:"footwear", accessory_back:"accessory", accessory_front:"accessory",
};
const layerOrder:Record<string,number> = {
  hair_back:10, body:20, footwear:28, clothing_bottom:36, clothing_top:40, head:48,
  face:50, eyes:52, brows:54, mouth:56, accessory_back:58, accessory_front:60, hair_front:70,
};

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.split(",")[1] || "") : reject(new Error("Archivo ilegible."));
    reader.readAsDataURL(file);
  });
}

async function postAsset(payload:Record<string,unknown>):Promise<UserAsset>{
  const response=await fetch("/api/modular-assets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error||"Falló la importación del recurso.");
  return data as UserAsset;
}

export function ModularAssetLibrary() {
  const input = useRef<HTMLInputElement>(null);
  const objectUrls = useRef<Set<string>>(new Set());
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [category, setCategory] = useState("portrait");
  const [kind, setKind] = useState<"reference"|"full_character"|"modular_piece">("full_character");
  const [view, setView] = useState<"front"|"back"|"side"|"unknown">("front");
  const [license, setLicense] = useState("UNVERIFIED");
  const [sourceUrl, setSourceUrl] = useState("");
  const [removeBackground, setRemoveBackground] = useState(true);
  const [tolerance, setTolerance] = useState(36);
  const [scalePercent, setScalePercent] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [keepOriginal, setKeepOriginal] = useState(true);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [compositionPreview, setCompositionPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Biblioteca local persistente · listo para convertir imágenes");
  const [composeStatus, setComposeStatus] = useState("");

  const makeUrl = (blob:Blob) => {
    const url=URL.createObjectURL(blob);
    objectUrls.current.add(url);
    return url;
  };
  useEffect(() => () => {
    objectUrls.current.forEach(url=>URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);

  const refresh = async () => {
    const response = await fetch("/api/modular-assets");
    if (!response.ok) throw new Error("No se pudo leer la biblioteca local.");
    const data = await response.json();
    setAssets(Array.isArray(data.assets) ? data.assets : []);
  };
  useEffect(() => { void refresh().catch(e => setStatus(e instanceof Error ? e.message : "API local no disponible")); }, []);

  const clearConversions = () => setPreviews(current => current.map(item => ({file:item.file,url:item.url})));
  const selectFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files);
    const next = accepted.filter(file => ["image/png","image/jpeg","image/webp"].includes(file.type) && file.size > 0 && file.size <= 12 * 1024 * 1024);
    if (next.length !== accepted.length) setStatus("Se omitieron archivos vacíos, mayores de 12 MiB o con formato no admitido.");
    setPreviews(current => [...current, ...next.map(file => ({file, url:makeUrl(file)}))]);
    if (next.length) setStatus(`${next.length} imagen(es) lista(s). Ajusta las opciones y prepara el PNG normalizado.`);
  };

  const prepareMaterial = async () => {
    if (!previews.length || busy) return;
    setBusy(true);
    try {
      const prepared:PreviewItem[]=[];
      for (const item of previews) {
        const converted=await convertToModularStage(item.file,{
          category,kind,view,removeFlatBackground:removeBackground,backgroundTolerance:tolerance,
          scalePercent,offsetX,offsetY,
        });
        prepared.push({...item,convertedBlob:converted.blob,convertedUrl:makeUrl(converted.blob),conversion:converted.metadata});
      }
      setPreviews(prepared);
      setStatus(`Conversión lista: ${prepared.length} PNG de 512×768. Revisa el resultado antes de guardar.`);
    } catch(error) {
      setStatus(error instanceof Error ? error.message : "No se pudo convertir la imagen.");
    } finally { setBusy(false); }
  };

  const importFiles = async () => {
    if (!previews.length || previews.some(item=>!item.convertedBlob||!item.conversion) || busy) {
      setStatus("Primero pulsa «Preparar PNG 512 × 768» y revisa la vista previa.");
      return;
    }
    setBusy(true);
    let finished=0;
    try {
      for (const item of previews) {
        const stem=item.file.name.replace(/\.[^.]+$/,"").slice(0,90) || "personaje";
        let sourceRecord:UserAsset|undefined;
        if (keepOriginal) {
          const originalBase64=await readDataUrl(item.file);
          sourceRecord=await postAsset({
            filename:item.file.name,source_filename:item.file.name,mime_type:item.file.type,data_base64:originalBase64,
            category:"reference",kind:"reference",label:`Fuente original · ${stem}`,view,license,source_url:sourceUrl,
          });
        }
        const convertedFile=new File([item.convertedBlob!],`${stem}-botimagen-512x768.png`,{type:"image/png"});
        const convertedBase64=await readDataUrl(convertedFile);
        await postAsset({
          filename:convertedFile.name,source_filename:item.file.name,mime_type:"image/png",data_base64:convertedBase64,
          category,kind,label:stem,view,license,source_url:sourceUrl,
          ...(sourceRecord?.id?{source_asset_id:sourceRecord.id}:{}),
          conversion:item.conversion,
        });
        finished++;
      }
      setPreviews([]);
      await refresh();
      setStatus(`Listo: ${finished} material(es) convertido(s) y guardado(s) en la biblioteca local. ${keepOriginal?"También se conservó cada fuente original.":""}`);
    } catch(error) {
      await refresh().catch(()=>undefined);
      setStatus(`${finished} material(es) guardado(s). ${error instanceof Error?error.message:"Falló la importación."}`);
    } finally { setBusy(false); }
  };

  const confirmAnchors = async (asset:UserAsset) => {
    if (busy) return;
    setBusy(true);
    try {
      const response=await fetch("/api/modular-assets/"+encodeURIComponent(asset.id)+"/validate-anchors",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({confirm:true}),
      });
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"No se pudieron confirmar los anclajes.");
      await refresh();
      setStatus(`Anclajes confirmados para «${asset.label}». Ya puede probarse en el compositor modular.`);
    } catch(error) {
      setStatus(error instanceof Error?error.message:"Falló la confirmación de anclajes.");
    } finally { setBusy(false); }
  };

  const composeSelection = async () => {
    if (busy || !selectedAssets.length) return;
    setBusy(true);
    setComposeStatus("");
    try {
      const selected=assets.filter(asset=>selectedAssets.includes(asset.id));
      const pieces=selected.map(asset=>{
        const compositorCategory=rigCategories[asset.category];
        if(!compositorCategory) throw new Error(`«${asset.label}» no es una pieza modular del esqueleto.`);
        return {
          schema_version:1,id:asset.id,category:compositorCategory,resource:asset.id,
          dimensions:{width:asset.width,height:asset.height},anchors:asset.anchor_estimate||{},
          transform:{x:0,y:0,scale_x:1,scale_y:1},
          layer_order:asset.layer_order??layerOrder[asset.category]??50,
          anchors_validated:asset.anchors_validated===true,compatible_with:[],
        };
      });
      const response=await fetch("/api/modular-compose",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({pieces,canvas_size:[512,768]}),
      });
      const data=await response.json();
      if(!response.ok) throw new Error(data.error||"No se pudo componer la selección.");
      setCompositionPreview(`data:image/png;base64,${data.png_base64}`);
      setComposeStatus(`Composición real lista · ${data.width}×${data.height} · ${pieces.length} capa(s).`);
    } catch(error) {
      setCompositionPreview("");
      setComposeStatus(error instanceof Error?error.message:"Falló la composición.");
    } finally { setBusy(false); }
  };

  const toggleAsset = (id:string, checked:boolean) => setSelectedAssets(current=>checked?[...new Set([...current,id])]:current.filter(value=>value!==id));
  const isConvertiblePiece = (asset:UserAsset) => asset.kind==="modular_piece" && Boolean(asset.conversion) && Boolean(rigCategories[asset.category]);

  return <section className="modular-library" aria-label="Biblioteca modular 2D">
    <div className="modular-library-head">
      <div><small>ASSET FORGE · OFFLINE FIRST</small><h3>Convertidor PNG y biblioteca de piezas</h3>
        <p>Usa imágenes normales. El convertidor crea una versión con fondo transparente y lienzo común de 512×768, conserva la fuente, propone anclajes y permite componer las piezas verificadas.</p>
      </div><b>{assets.length} RECURSOS</b>
    </div>

    <div className="modular-library-controls">
      <label>¿Qué estás importando?
        <select aria-label="Tipo de recurso" value={kind} onChange={e=>{setKind(e.target.value as typeof kind);clearConversions();}}>
          <option value="full_character">Personaje completo / conservar su pose</option>
          <option value="modular_piece">Pieza separada para el esqueleto</option>
          <option value="reference">Referencia visual sin composición</option>
        </select>
      </label>
      <label>Parte del personaje
        <select aria-label="Clasificación de la imagen" value={category} onChange={e=>{setCategory(e.target.value);clearConversions();}}>
          {categories.map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label>Pose / vista
        <select aria-label="Vista de la imagen" value={view} onChange={e=>{setView(e.target.value as typeof view);clearConversions();}}>
          <option value="front">Frontal</option><option value="back">Trasera</option><option value="side">Lateral</option><option value="unknown">Sin definir</option>
        </select>
      </label>
      <label>Licencia / derechos <input aria-label="Licencia de la imagen" value={license} onChange={e=>setLicense(e.target.value)} maxLength={1000} /></label>
      <label className="modular-source-url">URL de procedencia <input aria-label="URL de procedencia" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://… (opcional)" maxLength={1000} /></label>
    </div>

    <div className="modular-converter-options">
      <label className="modular-check"><input type="checkbox" checked={removeBackground} onChange={e=>{setRemoveBackground(e.target.checked);clearConversions();}}/> Quitar fondo uniforme conectado a las esquinas</label>
      <label className="modular-check"><input type="checkbox" checked={keepOriginal} onChange={e=>setKeepOriginal(e.target.checked)}/> Conservar también el archivo fuente original</label>
      {removeBackground&&<label className="modular-range"><span>Tolerancia del fondo <b>{tolerance}</b></span><input aria-label="Tolerancia del fondo" type="range" min="0" max="100" step="2" value={tolerance} onChange={e=>{setTolerance(Number(e.target.value));clearConversions();}}/></label>}
      <label className="modular-range"><span>Escala de encaje <b>{scalePercent}%</b></span><input aria-label="Escala de encaje" type="range" min="50" max="150" step="5" value={scalePercent} onChange={e=>{setScalePercent(Number(e.target.value));clearConversions();}}/></label>
      <label className="modular-range"><span>Desplazamiento horizontal <b>{offsetX}px</b></span><input aria-label="Desplazamiento horizontal" type="range" min="-200" max="200" step="10" value={offsetX} onChange={e=>{setOffsetX(Number(e.target.value));clearConversions();}}/></label>
      <label className="modular-range"><span>Desplazamiento vertical <b>{offsetY}px</b></span><input aria-label="Desplazamiento vertical" type="range" min="-240" max="240" step="10" value={offsetY} onChange={e=>{setOffsetY(Number(e.target.value));clearConversions();}}/></label>
    </div>

    <p className="modular-converter-note"><b>Regla rápida:</b> un PNG completo con una pose concreta se importa como personaje completo. Para cambiar solo cabello o ropa, selecciona «Pieza separada» y carga ese elemento recortado o transparente. La herramienta quita fondos planos; no inventa partes ocultas ni convierte por sí sola una ilustración plana en capas reales.</p>
    <div className="modular-dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();selectFiles(e.dataTransfer.files);}}>
      <strong>Arrastra imágenes aquí</strong><span>PNG, JPEG o WebP · máximo 12 MiB y 20 megapíxeles por archivo</span>
      <button type="button" className="btn muted" onClick={()=>input.current?.click()}>Seleccionar imágenes</button>
      <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>{selectFiles(e.target.files);e.currentTarget.value="";}}/>
    </div>
    {previews.length>0&&<div className="modular-preview-grid">
      {previews.map((item,i)=><div key={item.url} className="modular-preview-card">
        <img src={item.url} alt={`Imagen fuente ${item.file.name}`}/>
        <span>{item.file.name}</span><small>Original · {Math.round(item.file.size/1024)} KiB</small>
        {item.convertedUrl&&<><img className="modular-converted-preview" src={item.convertedUrl} alt={`PNG normalizado de ${item.file.name} 512 por 768`}/><small>Material convertido · 512×768</small></>}
        <button type="button" onClick={()=>setPreviews(current=>current.filter((_,j)=>j!==i))}>Quitar</button>
      </div>)}
    </div>}
    <div className="modular-library-actions">
      <button className="btn muted" type="button" disabled={!previews.length||busy} onClick={()=>void prepareMaterial()}>{busy?"Procesando…":"Preparar PNG 512 × 768"}</button>
      <button className="btn primary" type="button" disabled={!previews.length||previews.some(item=>!item.convertedBlob)||busy} onClick={()=>void importFiles()}>{busy?"Guardando…":"Guardar material convertido"}</button>
      <button className="btn muted" type="button" disabled={busy} onClick={()=>void refresh()}>Actualizar biblioteca</button>
      <span role="status" data-testid="modular-library-status">{status}</span>
    </div>

    <div className="modular-asset-list">
      {assets.map(asset=>{
        const canCompose=isConvertiblePiece(asset);
        const selectable=canCompose&&(asset.category==="body"||asset.anchors_validated===true);
        return <article key={asset.id} data-asset-id={asset.id} data-asset-kind={asset.kind}>
          <img className="modular-saved-preview" src={"/api/modular-assets/"+encodeURIComponent(asset.id)+"/image"} alt={`Material guardado ${asset.label}`}/>
          <b>{asset.label}</b><span>{asset.category} · {asset.kind} · {asset.width}×{asset.height}</span>
          <small>{asset.filename} · SHA-256 {asset.sha256.slice(0,16)}… · licencia: {asset.license}</small>
          {asset.conversion&&<small>{asset.conversion.background_removed?"Fondo plano retirado":"Fondo conservado"} · vista {asset.view} · anclajes: {asset.anchor_status==="user_confirmed"?"confirmados":"estimados sin validar"}</small>}
          {canCompose&&<div className="modular-asset-actions">
            <label className="modular-check"><input type="checkbox" aria-label={`Seleccionar pieza ${asset.label}`} checked={selectedAssets.includes(asset.id)} disabled={!selectable||busy} onChange={e=>toggleAsset(asset.id,e.target.checked)}/>{asset.category==="body"?"Base del esqueleto":"Incluir en la composición"}</label>
            {!asset.anchors_validated&&asset.category!=="body"&&<button type="button" className="btn muted" disabled={busy} onClick={()=>void confirmAnchors(asset)}>Confirmar encaje y anclajes</button>}
            {!selectable&&asset.category!=="body"&&<small>Primero revisa el PNG en el lienzo y confirma los anclajes aproximados.</small>}
          </div>}
        </article>;
      })}
    </div>
    <div className="modular-composition-panel">
      <div><b>Compositor de piezas importadas</b><p>Las imágenes comparten el mismo lienzo; el esqueleto usa los anclajes para ordenar y verificar las capas. La primera capa del conjunto debe ser un cuerpo base.</p></div>
      <button className="btn primary" type="button" disabled={!selectedAssets.length||busy} onClick={()=>void composeSelection()}>{busy?"Componiendo…":`Componer selección (${selectedAssets.length})`}</button>
      <span role="status" data-testid="modular-compose-status">{composeStatus}</span>
      {compositionPreview&&<img className="modular-composition-preview" src={compositionPreview} alt="Composición PNG de piezas modulares importadas"/>}
    </div>
  </section>;
}
