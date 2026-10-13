import { useEffect, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { convertToModularStage } from "./pngToModularAsset";
import type { AssetConversionMetadata } from "./pngToModularAsset";
import { splitTransparentPng } from "./pngAlphaSplitter";

type UserAsset = {
  id: string; label: string; category: string; kind: string; filename: string; source_filename?: string;
  source_asset_id?: string | null; mime_type: string; width: number; height: number; bytes: number; sha256: string;
  view: string; license: string; source_url: string; duplicate?: boolean; available?: boolean;
  layer_order?: number | null; anchor_estimate?: Record<string, {x:number;y:number}>;
  anchors_validated?: boolean; anchor_status?: string; conversion?: AssetConversionMetadata | null; note?: string;
};
type CutoutPoint = { x:number; y:number };
type PreviewItem = { file:File; url:string; category?:string; sourceFile?:File; cutoutPoints?:CutoutPoint[]; convertedUrl?:string; convertedBlob?:Blob; conversion?:AssetConversionMetadata };
type SavedProfile = { id:string; name:string; saved_at:string };
type PieceTransform = { x:number; y:number; scale:number; rotation:number; layer_order:number; visible:boolean };
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


const anchorLabels:Record<string,string> = {
  origin:"Centro",head:"Cabeza",neck:"Cuello",shoulder_l:"Hombro izq.",shoulder_r:"Hombro der.",
  waist:"Cintura",hip:"Cadera",elbow_l:"Codo izq.",elbow_r:"Codo der.",
  hand_l:"Mano izq.",hand_r:"Mano der.",knee_l:"Rodilla izq.",knee_r:"Rodilla der.",
  ankle_l:"Tobillo izq.",ankle_r:"Tobillo der.",
};
const skeletonLinks:[string,string][] = [
  ["head","neck"],["neck","shoulder_l"],["neck","shoulder_r"],
  ["shoulder_l","elbow_l"],["elbow_l","hand_l"],["shoulder_r","elbow_r"],["elbow_r","hand_r"],
  ["neck","waist"],["waist","hip"],["hip","knee_l"],["knee_l","ankle_l"],
  ["hip","knee_r"],["knee_r","ankle_r"],
];

function AnchorStageEditor({imageUrl,anchors,onChange,label}:{imageUrl:string;anchors:AssetConversionMetadata["anchors"];onChange:(value:AssetConversionMetadata["anchors"])=>void;label:string}) {
  const dragging=useRef<string|null>(null);
  const placePoint=(svg:SVGSVGElement,name:string,clientX:number,clientY:number)=>{
    // Map screen coordinates through the actual SVG transform into its 512x768 viewBox.
    // Bounding-client-rect normalization drifts when CSS scales or letterboxes the SVG.
    const inverse=svg.getScreenCTM()?.inverse();
    if(!inverse)return;
    const local=new DOMPoint(clientX,clientY).matrixTransform(inverse);
    const x=Math.max(0,Math.min(1,local.x/512));
    const y=Math.max(0,Math.min(1,local.y/768));
    onChange({...anchors,[name]:{x:Number(x.toFixed(4)),y:Number(y.toFixed(4))}});
  };
  return <svg className="modular-anchor-stage" viewBox="0 0 512 768" role="group" aria-label={label}
    onPointerMove={event=>{const name=dragging.current;if(name)placePoint(event.currentTarget,name,event.clientX,event.clientY);}}
    onPointerUp={event=>{const name=dragging.current;if(name)placePoint(event.currentTarget,name,event.clientX,event.clientY);dragging.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
    onPointerCancel={()=>{dragging.current=null;}}>
    <image href={imageUrl} x="0" y="0" width="512" height="768" preserveAspectRatio="none"/>
    <g className="modular-anchor-bones" pointerEvents="none">
      {skeletonLinks.filter(([a,b])=>anchors[a]&&anchors[b]).map(([a,b])=><line key={a+"-"+b} x1={anchors[a].x*512} y1={anchors[a].y*768} x2={anchors[b].x*512} y2={anchors[b].y*768}/>)}
    </g>
    {Object.entries(anchors).map(([name,point])=><g key={name} className="modular-anchor-point" role="slider" tabIndex={0}
      aria-label={anchorLabels[name]||name} aria-valuetext={`X ${Math.round(point.x*512)}, Y ${Math.round(point.y*768)}`}
      transform={`translate(${point.x*512} ${point.y*768})`}
      onPointerDown={event=>{
        event.preventDefault();
        dragging.current=name;
        const svg=event.currentTarget.ownerSVGElement;
        if(svg){svg.setPointerCapture(event.pointerId);placePoint(svg,name,event.clientX,event.clientY);}
      }}
      onKeyDown={event=>{
        const step=event.shiftKey?0.02:0.005;
        const changes:Record<string,{x:number;y:number}>={ArrowLeft:{x:-step,y:0},ArrowRight:{x:step,y:0},ArrowUp:{x:0,y:-step},ArrowDown:{x:0,y:step}};
        const delta=changes[event.key];
        if(delta){event.preventDefault();onChange({...anchors,[name]:{x:Number(Math.max(0,Math.min(1,point.x+delta.x)).toFixed(4)),y:Number(Math.max(0,Math.min(1,point.y+delta.y)).toFixed(4))}});}
      }}>
      <circle r="9"/><circle className="modular-anchor-dot" r="3.2"/>
      <text x="11" y="-8">{anchorLabels[name]||name}</text>
    </g>)}
  </svg>;
}

function PolygonCutoutEditor({
  imageUrl, points, onChange, label, disabled,
}: {
  imageUrl:string;
  points:CutoutPoint[];
  onChange:(value:CutoutPoint[])=>void;
  label:string;
  disabled:boolean;
}) {
  const [open,setOpen]=useState(false);
  const [size,setSize]=useState({width:0,height:0});
  const [mode,setMode]=useState<"polygon"|"lasso">("polygon");
  const [drawing,setDrawing]=useState(false);
  const [redoStack,setRedoStack]=useState<CutoutPoint[][]>([]);
  const beforeEdit=useRef<CutoutPoint[]>(points);
  useEffect(()=>{
    let active=true;
    const image=new Image();
    image.onload=()=>{if(active)setSize({width:image.naturalWidth,height:image.naturalHeight});};
    image.src=imageUrl;
    return ()=>{active=false;image.onload=null;};
  },[imageUrl]);

  const pointString=points.map(point=>`${point.x*size.width},${point.y*size.height}`).join(" ");
  const pointAt=(event:{currentTarget:SVGSVGElement;clientX:number;clientY:number})=>{
    if(!size.width||!size.height)return null;
    const inverse=event.currentTarget.getScreenCTM()?.inverse();
    if(!inverse)return null;
    const local=new DOMPoint(event.clientX,event.clientY).matrixTransform(inverse);
    return {x:Number(Math.max(0,Math.min(1,local.x/size.width)).toFixed(5)),y:Number(Math.max(0,Math.min(1,local.y/size.height)).toFixed(5))};
  };
  const addPoint=(event:MouseEvent<SVGSVGElement>)=>{
    if(mode!=="polygon"||points.length>=256)return;
    const next=pointAt(event);if(!next)return;
    beforeEdit.current=points;setRedoStack([]);onChange([...points,next]);
  };
  const startLasso=(event:ReactPointerEvent<SVGSVGElement>)=>{
    if(mode!=="lasso"||disabled)return;
    const next=pointAt(event);if(!next)return;
    event.preventDefault();beforeEdit.current=points;setRedoStack([]);setDrawing(true);
    event.currentTarget.setPointerCapture(event.pointerId);onChange([next]);
  };
  const continueLasso=(event:React.PointerEvent<SVGSVGElement>)=>{
    if(!drawing||mode!=="lasso"||points.length>=256)return;
    const next=pointAt(event);if(!next)return;
    const last=points[points.length-1];
    if(last&&Math.hypot(next.x-last.x,next.y-last.y)<0.003)return;
    onChange([...points,next]);
  };
  const finishLasso=()=>setDrawing(false);
  const undoEdit=()=>{
    if(!points.length)return;
    setRedoStack(stack=>[points,...stack].slice(0,20));
    onChange(mode==="polygon"?points.slice(0,-1):beforeEdit.current);
  };
  const redoEdit=()=>{
    const next=redoStack[0];if(!next)return;
    setRedoStack(stack=>stack.slice(1));onChange(next);
  };
  return <div className="modular-cutout-editor">
    <button type="button" className="btn muted" disabled={disabled} aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
      {open?"Cerrar contorno":"Dibujar contorno de pieza"}
    </button>
    {open&&<>
      <p>Haz clic alrededor del cabello, rostro, ropa o accesorio que quieras extraer. Cada clic añade un punto. El exterior quedará transparente al preparar el PNG. Las partes ocultas detrás de otra prenda no existen en la imagen original.</p>
      <div className="modular-cutout-actions">
        <label>Herramienta de recorte
          <select aria-label={`Herramienta de recorte de ${label}`} value={mode} disabled={disabled||drawing} onChange={event=>setMode(event.target.value as "polygon"|"lasso")}>
            <option value="polygon">Polígono por puntos</option><option value="lasso">Lazo libre (arrastrar)</option>
          </select>
        </label>
        <span>{mode==="lasso"?"Arrastra alrededor de la pieza y suelta para cerrar el lazo.":"Haz clic para añadir vértices al contorno."}</span>
      </div>
      {size.width>0&&size.height>0&&<svg
        className="modular-cutout-stage"
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        preserveAspectRatio="none"
        role="application"
        aria-label={label}
        style={{touchAction:"none",cursor:mode==="lasso"?"crosshair":"default"}}
        onClick={addPoint}
        onPointerDown={startLasso}
        onPointerMove={continueLasso}
        onPointerUp={finishLasso}
        onPointerCancel={finishLasso}
      >
        <image href={imageUrl} x="0" y="0" width={size.width} height={size.height} preserveAspectRatio="none" pointerEvents="none"/>
        {points.length>=3&&<polygon points={pointString} className="modular-cutout-fill"/>}
        {points.length>=2&&<polyline points={pointString} className="modular-cutout-line"/>}
        {points.map((point,index)=><circle key={index} cx={point.x*size.width} cy={point.y*size.height} r={Math.max(4,Math.min(12,size.width*0.018))} className="modular-cutout-point"/>)}
      </svg>}
      <div className="modular-cutout-actions">
        <span>{points.length} punto(s) · {points.length>=3?"contorno listo":"se necesitan al menos 3"}</span>
        <button type="button" className="btn muted" disabled={disabled||points.length===0} onClick={undoEdit}>{mode==="lasso"?"Deshacer lazo":"Deshacer punto"}</button>
        <button type="button" className="btn muted" disabled={disabled||redoStack.length===0} onClick={redoEdit}>Rehacer</button>
        <button type="button" className="btn muted" disabled={disabled||points.length===0} onClick={()=>{beforeEdit.current=points;setRedoStack([]);onChange([]);}}>Borrar contorno</button>
      </div>
    </>}
    {points.length>=3&&<small className="modular-cutout-ready">Recorte manual activo. Pulsa «Preparar PNG 512 × 768» para crear una pieza transparente.</small>}
  </div>;
}

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
  const [selectedPieceId, setSelectedPieceId] = useState("");
  const [pieceTransforms, setPieceTransforms] = useState<Record<string,PieceTransform>>({});
  const [compositionView, setCompositionView] = useState<"front"|"back">("front");
  const [compositionPreview, setCompositionPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Biblioteca local persistente · listo para convertir imágenes");
  const [composeStatus, setComposeStatus] = useState("");
  const [profileName, setProfileName] = useState("Mi personaje importado");
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [profileId, setProfileId] = useState("");

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
  const refreshProfiles = async () => {
    const response=await fetch("/api/profiles");
    if(!response.ok)throw new Error("No se pudieron cargar los perfiles guardados.");
    const data=await response.json();
    setProfiles(Array.isArray(data.profiles)?data.profiles:[]);
  };
  useEffect(() => {
    void refresh().catch(e => setStatus(e instanceof Error ? e.message : "API local no disponible"));
    void refreshProfiles().catch(e => setStatus(e instanceof Error ? e.message : "No se pudieron cargar los perfiles."));
  }, []);

  const clearConversions = () => setPreviews(current => current.map(item => ({...item,convertedUrl:undefined,convertedBlob:undefined,conversion:undefined})));
  const selectFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files);
    const next = accepted.filter(file => ["image/png","image/jpeg","image/webp"].includes(file.type) && file.size > 0 && file.size <= 12 * 1024 * 1024);
    if (next.length !== accepted.length) setStatus("Se omitieron archivos vacíos, mayores de 12 MiB o con formato no admitido.");
    setPreviews(current => [...current, ...next.map(file => ({file, url:makeUrl(file), category}))]);
    if (next.length) setStatus(`${next.length} imagen(es) lista(s). Ajusta las opciones y prepara el PNG normalizado.`);
  };

  const splitAllTransparentPngs = async () => {
    if (busy) return;
    if (kind !== "modular_piece") {
      setStatus("Selecciona «Pieza separada» antes de dividir una hoja de sprites.");
      return;
    }
    const candidates = previews.filter(item => item.file.type === "image/png" && !item.sourceFile && !item.convertedBlob);
    if (!candidates.length) {
      setStatus("No hay PNG originales pendientes para separar. Carga una hoja PNG con piezas separadas por transparencia.");
      return;
    }
    setBusy(true);
    setStatus(`Separando ${candidates.length} PNG en lote…`);
    let splitCount = 0;
    let failedCount = 0;
    const replacements = new Map<string, PreviewItem[]>();
    try {
      for (const item of candidates) {
        try {
          const pieces = await splitTransparentPng(item.file);
          replacements.set(item.url, pieces.map(piece => ({
            file: piece.file, url: makeUrl(piece.file), category: item.category || category, sourceFile: item.file,
          })));
          splitCount += pieces.length;
        } catch {
          failedCount++;
        }
      }
      setPreviews(current => current.flatMap(item => replacements.get(item.url) ?? [item]));
      setStatus(`Lote terminado: ${splitCount} pieza(s) extraída(s) de ${candidates.length} PNG. ${failedCount} archivo(s) no se pudieron separar automáticamente y se conservaron para recorte manual.`);
    } finally {
      setBusy(false);
    }
  };

  const splitPreviewIntoPieces = async (item:PreviewItem) => {
    if (busy) return;
    setBusy(true);
    try {
      const pieces=await splitTransparentPng(item.file);
      const replacements:PreviewItem[]=pieces.map(piece=>({
        file:piece.file,
        url:makeUrl(piece.file),
        category:item.category||category,
        sourceFile:item.sourceFile||item.file,
      }));
      setPreviews(current=>{
        const index=current.findIndex(entry=>entry.url===item.url);
        if(index<0)return current;
        return [...current.slice(0,index),...replacements,...current.slice(index+1)];
      });
      setStatus(`Separación terminada: ${pieces.length} piezas transparentes. Clasifica cada una y prepara los PNG para la biblioteca.`);
    } catch(error) {
      setStatus(error instanceof Error?error.message:"No se pudieron separar las piezas del PNG.");
    } finally { setBusy(false); }
  };

  const prepareMaterial = async () => {
    if (!previews.length || busy) return;
    if (previews.some(item => (item.cutoutPoints?.length||0)>0 && (item.cutoutPoints?.length||0)<3)) {
      setStatus("Completa el contorno con al menos 3 puntos o bórralo antes de preparar el material.");
      return;
    }
    setBusy(true);
    setStatus("Preparando las piezas normalizadas 512×768…");
    try {
      const prepared:PreviewItem[]=[];
      for (const item of previews) {
        const converted=await convertToModularStage(item.file,{
          category:item.category||category,kind,view,removeFlatBackground:removeBackground&&!item.sourceFile,backgroundTolerance:tolerance,
          scalePercent,offsetX,offsetY,
          ...(item.cutoutPoints && item.cutoutPoints.length>=3 ? {cutoutPolygon:item.cutoutPoints} : {}),
        });
        prepared.push({...item,convertedBlob:converted.blob,convertedUrl:makeUrl(converted.blob),conversion:converted.metadata});
      }
      setPreviews(prepared);
      setStatus(`Conversión lista: ${prepared.length} PNG de 512×768. ${prepared.filter(item=>item.conversion?.cutout_applied).length} con recorte manual. Revisa el resultado antes de guardar.`);
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
    const savedSources=new WeakMap<File,UserAsset>();
    try {
      for (const item of previews) {
        const stem=item.file.name.replace(/\.[^.]+$/,"").slice(0,90) || "personaje";
        const sourceFile=item.sourceFile||item.file;
        let sourceRecord:UserAsset|undefined=savedSources.get(sourceFile);
        if (keepOriginal && !sourceRecord) {
          const originalBase64=await readDataUrl(sourceFile);
          sourceRecord=await postAsset({
            filename:sourceFile.name,source_filename:sourceFile.name,mime_type:sourceFile.type,data_base64:originalBase64,
            category:"reference",kind:"reference",label:`Fuente original · ${sourceFile.name.replace(/\.[^.]+$/,"").slice(0,90)}`,view,license,source_url:sourceUrl,
          });
          savedSources.set(sourceFile,sourceRecord);
        }
        const suffix=item.conversion?.cutout_applied?"-pieza-recortada":"";
        const convertedFile=new File([item.convertedBlob!],`${stem}${suffix}-botimagen-512x768.png`,{type:"image/png"});
        const convertedBase64=await readDataUrl(convertedFile);
        await postAsset({
          filename:convertedFile.name,source_filename:sourceFile.name,mime_type:"image/png",data_base64:convertedBase64,
          category:item.category||category,kind,label:stem,view,license,source_url:sourceUrl,
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
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({confirm:true,...(asset.anchor_estimate?{anchors:asset.anchor_estimate}:{})}),
      });
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"No se pudieron confirmar los anclajes.");
      await refresh();
      setStatus(`Anclajes confirmados para «${asset.label}». Ya puede probarse en el compositor modular.`);
    } catch(error) {
      setStatus(error instanceof Error?error.message:"Falló la confirmación de anclajes.");
    } finally { setBusy(false); }
  };

  const getPieceTransform = (asset:UserAsset, source=pieceTransforms):PieceTransform => source[asset.id] || ({
    x:0,y:0,scale:100,rotation:0,layer_order:asset.layer_order??layerOrder[asset.category]??50,visible:true,
  });
  const composeSelection = async (transformSource=pieceTransforms) => {
    if (busy || !selectedAssets.length) return;
    setBusy(true);
    setComposeStatus("");
    try {
      const selected=assets.filter(asset=>selectedAssets.includes(asset.id)&&(asset.view==="unknown"||asset.view===compositionView));
      const visible=selected.filter(asset=>asset.category==="body"||getPieceTransform(asset,transformSource).visible);
      const pieces=visible.map(asset=>{
        const compositorCategory=rigCategories[asset.category];
        if(!compositorCategory) throw new Error(`«${asset.label}» no es una pieza modular del esqueleto.`);
        const transform=getPieceTransform(asset,transformSource);
        return {
          schema_version:1,id:asset.id,category:compositorCategory,resource:asset.id,
          dimensions:{width:asset.width,height:asset.height},anchors:asset.anchor_estimate||{},
          transform:{x:transform.x/512,y:transform.y/768,scale_x:transform.scale/100,scale_y:transform.scale/100,rotation:transform.rotation},
          layer_order:transform.layer_order,
          anchors_validated:asset.anchors_validated===true,align_to_body:asset.category!=="body",compatible_with:[],
        };
      });
      if(!pieces.some(piece=>piece.category==="body")) throw new Error("La composición necesita una pieza de cuerpo base visible.");
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

  const saveCompositionProfile = async () => {
    if(busy||!selectedAssets.length){setComposeStatus("Selecciona piezas antes de guardar el personaje.");return;}
    setBusy(true);
    try {
      const response=await fetch("/api/profiles",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        name:profileName.trim()||"Mi personaje importado",
        profile:{modular_composition:{
          schema_version:1,source:"imported-assets",pieces:[...selectedAssets],view:compositionView,
          transforms:Object.fromEntries(selectedAssets.map(id=>{const asset=assets.find(item=>item.id===id);return [id,asset?getPieceTransform(asset):undefined];}).filter((entry):entry is [string,PieceTransform]=>Boolean(entry[1]))),
        }},
      })});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No se pudo guardar el personaje importado.");
      setProfileId(data.id||"");
      await refreshProfiles();
      setComposeStatus("Personaje importado guardado con referencias persistentes a sus piezas.");
    } catch(error) { setComposeStatus(error instanceof Error?error.message:"Falló el guardado del personaje importado."); }
    finally { setBusy(false); }
  };

  const loadCompositionProfile = async () => {
    if(busy||!profileId){setComposeStatus("Selecciona un perfil de piezas guardado.");return;}
    setBusy(true);
    try {
      const response=await fetch("/api/profiles/"+encodeURIComponent(profileId));
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No se pudo recuperar el personaje importado.");
      const composition=data.profile?.modular_composition;
      if(composition?.source!=="imported-assets"||!Array.isArray(composition.pieces)||!composition.pieces.every((id:unknown)=>typeof id==="string"))throw new Error("El perfil no contiene referencias de piezas importadas compatibles.");
      const available=new Set(assets.map(asset=>asset.id));
      const restored=composition.pieces.filter((id:string)=>available.has(id));
      if(restored.length!==composition.pieces.length)throw new Error("Faltan piezas referenciadas en la biblioteca; no se restauró una composición incompleta.");
      const restoredTransforms:Record<string,PieceTransform>={};
      if(composition.transforms!==undefined){
        if(!composition.transforms||typeof composition.transforms!=="object"||Array.isArray(composition.transforms))throw new Error("El perfil contiene transformaciones inválidas; no se modificó la composición actual.");
        for(const [id,value] of Object.entries(composition.transforms as Record<string,unknown>)){
          if(!restored.includes(id)||!value||typeof value!=="object")throw new Error("El perfil contiene una transformación sin referencia válida; no se modificó la composición actual.");
          const item=value as Partial<PieceTransform>;
          if(![item.x,item.y,item.scale,item.rotation,item.layer_order].every(Number.isFinite)||typeof item.visible!=="boolean"||item.scale! < 50||item.scale! > 150||item.x! < -512||item.x! > 512||item.y! < -768||item.y! > 768||item.rotation! < -180||item.rotation! > 180||!Number.isInteger(item.layer_order)||item.layer_order! < 0||item.layer_order! > 100)throw new Error("El perfil contiene valores de transformación fuera de rango; no se modificó la composición actual.");
          restoredTransforms[id]={x:item.x!,y:item.y!,scale:item.scale!,rotation:item.rotation!,layer_order:item.layer_order!,visible:item.visible};
        }
      }
      setProfileName(data.name||"Mi personaje importado");
      setCompositionView(composition.view==="back"?"back":"front");
      setSelectedAssets(restored);
      setSelectedPieceId(restored.includes(selectedPieceId)?selectedPieceId:(restored[0]||""));
      setPieceTransforms(restoredTransforms);
      setCompositionPreview("");
      setComposeStatus("Selecciones y referencias de piezas recuperadas del perfil local.");
    } catch(error) { setComposeStatus(error instanceof Error?error.message:"Falló la carga del personaje importado."); }
    finally { setBusy(false); }
  };

  const supportsCompositionView=(asset:UserAsset,view=compositionView)=>asset.view==="unknown"||asset.view===view;
  const changeCompositionView=(view:"front"|"back")=>{
    setCompositionView(view);
    setSelectedAssets(current=>current.filter(id=>{const asset=assets.find(item=>item.id===id);return Boolean(asset&&supportsCompositionView(asset,view));}));
    setCompositionPreview("");
    setComposeStatus(view==="front"?"Vista frontal seleccionada.":"Vista trasera seleccionada.");
  };
  const updatePieceTransform=(assetId:string,patch:Partial<PieceTransform>)=>{
    const asset=assets.find(item=>item.id===assetId);
    if(!asset||asset.category==="body")return;
    setPieceTransforms(current=>({...current,[assetId]:{...getPieceTransform(asset,current),...patch}}));
    setCompositionPreview("");
  };
  useEffect(()=>{
    if(!selectedAssets.length)return;
    const timer=window.setTimeout(()=>void composeSelection(),180);
    return ()=>window.clearTimeout(timer);
  },[pieceTransforms]);
  const toggleAsset=(id:string,checked:boolean)=>{
    if(!checked){setSelectedAssets(current=>current.filter(value=>value!==id));return;}
    const chosen=assets.find(asset=>asset.id===id);
    if(!chosen||!supportsCompositionView(chosen))return;
    setSelectedPieceId(chosen.id);
    const multi=["accessory_back","accessory_front","footwear"];
    setSelectedAssets(current=>{
      const compatible=current.filter(existingId=>{
        const existing=assets.find(asset=>asset.id===existingId);
        if(!existing||!supportsCompositionView(existing))return false;
        return multi.includes(chosen.category)||existing.category!==chosen.category;
      });
      return [...new Set([...compatible,id])];
    });
  };
  const isConvertiblePiece = (asset:UserAsset) => asset.kind==="modular_piece" && Boolean(asset.conversion) && Boolean(rigCategories[asset.category]);
  const selectedPiece=assets.find(asset=>asset.id===selectedPieceId&&selectedAssets.includes(asset.id));
  const selectedPieceTransform=selectedPiece?getPieceTransform(selectedPiece):null;

  return <section className="modular-library" aria-label="Biblioteca modular 2D">
    <div className="modular-library-head">
      <div><small>ASSET FORGE · OFFLINE FIRST</small><h3>Convertidor PNG y biblioteca de piezas</h3>
        <p>Importa PNG normales. El convertidor conserva el original, crea una versión 512×768, propone puntos del esqueleto que puedes arrastrar y encaja piezas sobre un cuerpo base confirmado.</p>
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

    <p className="modular-converter-note"><b>Flujo de piezas:</b> elige «Pieza separada», carga un PNG, selecciona qué parte vas a extraer y dibuja su contorno. Pulsa «Extraer otra parte de este PNG» para crear otra capa desde la misma imagen y clasificarla por separado. Luego prepara y guarda todas las piezas juntas. El exterior queda transparente; las zonas tapadas en la imagen original no se pueden reconstruir automáticamente.</p>
    {kind==="modular_piece"&&previews.some(item=>item.file.type==="image/png"&&!item.sourceFile&&!item.convertedBlob)&&<div className="modular-batch-split">
      <button type="button" className="btn muted" disabled={busy} onClick={()=>void splitAllTransparentPngs()}>Separar todas las PNG transparentes</button>
      <small>Procesa hojas con piezas separadas por alfa. Los PNG que no se puedan dividir quedan intactos para recorte manual.</small>
    </div>}
    <div className="modular-dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();selectFiles(e.dataTransfer.files);}}>
      <strong>Arrastra imágenes aquí</strong><span>PNG, JPEG o WebP · máximo 12 MiB y 20 megapíxeles por archivo</span>
      <button type="button" className="btn muted" onClick={()=>input.current?.click()}>Seleccionar imágenes</button>
      <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>{selectFiles(e.target.files);e.currentTarget.value="";}}/>
    </div>
    {previews.length>0&&<div className="modular-preview-grid">
      {previews.map((item,i)=><div key={item.url} className="modular-preview-card">
        <img src={item.url} alt={`Imagen fuente ${item.file.name}`}/>
        {kind==="modular_piece"&&<label>Parte que extraer
          <select aria-label={`Parte que extraer de ${item.file.name}`} value={item.category||category} disabled={busy} onChange={e=>setPreviews(current=>current.map((entry,j)=>j===i?{...entry,category:e.target.value,convertedUrl:undefined,convertedBlob:undefined,conversion:undefined}:entry))}>
            {categories.filter(([id])=>id!=="portrait"&&id!=="reference").map(([id,label])=><option key={id} value={id}>{label}</option>)}
          </select>
        </label>}
        <PolygonCutoutEditor imageUrl={item.url} points={item.cutoutPoints||[]} label={`Dibujar contorno en ${item.file.name}`} disabled={busy}
          onChange={points=>setPreviews(current=>current.map((entry,j)=>j===i?{...entry,cutoutPoints:points,convertedUrl:undefined,convertedBlob:undefined,conversion:undefined}:entry))}/>
        {kind==="modular_piece"&&item.file.type==="image/png"&&<button type="button" className="btn muted" disabled={busy||Boolean(item.convertedBlob)} onClick={()=>void splitPreviewIntoPieces(item)}>Separar piezas por transparencia</button>}
        {item.sourceFile&&<small>Pieza extraída de «{item.sourceFile.name}» · el original se conserva una sola vez.</small>}
        <span>{item.file.name}</span><small>Original · {Math.round(item.file.size/1024)} KiB</small>
        {item.convertedUrl&&<>{kind==="modular_piece"&&item.conversion?<div className="modular-converted-preview"><AnchorStageEditor imageUrl={item.convertedUrl} anchors={item.conversion.anchors} label={`Ajustar esqueleto de ${item.file.name}`} onChange={anchors=>setPreviews(current=>current.map((entry,j)=>j===i&&entry.conversion?{...entry,conversion:{...entry.conversion,anchors}}:entry))}/></div>:<img className="modular-converted-preview" src={item.convertedUrl} alt={`PNG normalizado de ${item.file.name} 512 por 768`}/>}<small>{kind==="modular_piece"?"Arrastra los puntos del esqueleto al lugar real de cada articulación; se guardarán con la pieza.":"Material convertido · 512×768"}</small></>}
        {kind==="modular_piece"&&<button type="button" className="btn muted" disabled={busy} onClick={()=>setPreviews(current=>{const source=current[i];if(!source)return current;return [...current.slice(0,i+1),{file:source.file,url:makeUrl(source.file),category:"hair_front"},...current.slice(i+1)];})}>Extraer otra parte de este PNG</button>}
        <button type="button" disabled={busy} onClick={()=>setPreviews(current=>current.filter((_,j)=>j!==i))}>Quitar</button>
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
        const selectable=canCompose&&asset.anchors_validated===true&&supportsCompositionView(asset);
        return <article key={asset.id} data-asset-id={asset.id} data-asset-kind={asset.kind}>
          {asset.kind==="modular_piece"&&asset.conversion?<div className="modular-saved-preview"><AnchorStageEditor imageUrl={"/api/modular-assets/"+encodeURIComponent(asset.id)+"/image"} anchors={asset.anchor_estimate||asset.conversion.anchors} label={`Ajustar esqueleto de ${asset.label}`} onChange={anchors=>setAssets(current=>current.map(entry=>entry.id===asset.id?{...entry,anchor_estimate:anchors,conversion:entry.conversion?{...entry.conversion,anchors}:entry.conversion}:entry))}/></div>:<img className="modular-saved-preview" src={"/api/modular-assets/"+encodeURIComponent(asset.id)+"/image"} alt={`Material guardado ${asset.label}`}/>}
          <b>{asset.label}</b><span>{asset.category} · {asset.kind} · {asset.width}×{asset.height}</span>
          <small>{asset.filename} · SHA-256 {asset.sha256.slice(0,16)}… · licencia: {asset.license}</small>
          {asset.conversion&&<small>{asset.conversion.cutout_applied?"Recorte manual":"Imagen completa"} · {asset.conversion.background_removed?"fondo plano retirado":"fondo conservado"} · vista {asset.view} · anclajes: {asset.anchor_status==="user_confirmed"?"confirmados":"estimados sin validar"}</small>}
          {canCompose&&<div className="modular-asset-actions">
            <label className="modular-check"><input type="checkbox" aria-label={`Seleccionar pieza ${asset.label}`} checked={selectedAssets.includes(asset.id)} disabled={!selectable||busy} onChange={e=>toggleAsset(asset.id,e.target.checked)}/>{asset.category==="body"?"Base del esqueleto":"Incluir en la composición"}</label>
            {!asset.anchors_validated&&canCompose&&<button type="button" className="btn muted" disabled={busy} onClick={()=>void confirmAnchors(asset)}>Confirmar puntos del esqueleto</button>}
            {!selectable&&canCompose&&<small>{!supportsCompositionView(asset)?`Esta pieza es de vista ${asset.view==="back"?"trasera":"frontal"}. Cambia la vista de composición para usarla.`:"Arrastra los puntos del esqueleto y confírmalos antes de usar el encaje automático."}</small>}
          </div>}
        </article>;
      })}
    </div>
    <div className="modular-composition-panel">
      <div><b>Compositor de piezas importadas</b><p>El cuerpo base actúa como esqueleto de referencia: las prendas se escalan y trasladan automáticamente usando los puntos compartidos. Importa y confirma un juego frontal y otro trasero, y cambia la vista aquí para alternarlos.</p><label className="modular-composition-view">Vista de composición<select aria-label="Vista para componer" value={compositionView} onChange={e=>changeCompositionView(e.target.value as "front"|"back")}><option value="front">Frontal</option><option value="back">Trasera</option></select></label></div>
      <label>Nombre del personaje importado<input aria-label="Nombre del personaje importado" maxLength={80} value={profileName} onChange={event=>setProfileName(event.target.value)}/></label>
      <label>Perfil de piezas guardado<select aria-label="Perfil de piezas guardado" value={profileId} onChange={event=>setProfileId(event.target.value)}><option value="">Seleccionar perfil</option>{profiles.map(profile=><option key={profile.id} value={profile.id}>{profile.name} · {new Date(profile.saved_at).toLocaleString()}</option>)}</select></label>
      {selectedAssets.length>0&&<div className="modular-piece-editor" aria-label="Ajustes de la pieza seleccionada">
        <label>🧩 Pieza a editar
          <select aria-label="Pieza a editar" value={selectedPiece?.id||""} onChange={event=>setSelectedPieceId(event.target.value)}>
            {assets.filter(asset=>selectedAssets.includes(asset.id)).map(asset=><option key={asset.id} value={asset.id}>{asset.label} · {asset.category==="body"?"Cuerpo base":asset.category}</option>)}
          </select>
        </label>
        {selectedPiece&&selectedPieceTransform&&<div className="modular-piece-transform-grid">
          <div className="modular-piece-identity"><img src={"/api/modular-assets/"+encodeURIComponent(selectedPiece.id)+"/image"} alt={"Vista de la pieza seleccionada "+selectedPiece.label}/><div><b>{selectedPiece.category==="body"?"🧍 Cuerpo base":"🎨 "+selectedPiece.label}</b><small>{selectedPiece.id} · {selectedPiece.category} · alfa original conservado</small></div></div>
          <label><span>↔ Posición X <b>{selectedPieceTransform.x}px</b></span><input aria-label="Desplazamiento horizontal de pieza" type="range" min="-256" max="256" step="4" value={selectedPieceTransform.x} disabled={busy||selectedPiece.category==="body"} onChange={event=>updatePieceTransform(selectedPiece.id,{x:Number(event.target.value)})}/></label>
          <label><span>↕ Posición Y <b>{selectedPieceTransform.y}px</b></span><input aria-label="Desplazamiento vertical de pieza" type="range" min="-384" max="384" step="4" value={selectedPieceTransform.y} disabled={busy||selectedPiece.category==="body"} onChange={event=>updatePieceTransform(selectedPiece.id,{y:Number(event.target.value)})}/></label>
          <label><span>⤢ Escala <b>{selectedPieceTransform.scale}%</b></span><input aria-label="Escala de pieza" type="range" min="50" max="150" step="5" value={selectedPieceTransform.scale} disabled={busy||selectedPiece.category==="body"} onChange={event=>updatePieceTransform(selectedPiece.id,{scale:Number(event.target.value)})}/></label>
          <label><span>⟳ Rotación <b>{selectedPieceTransform.rotation}°</b></span><input aria-label="Rotación de pieza" type="range" min="-180" max="180" step="5" value={selectedPieceTransform.rotation} disabled={busy||selectedPiece.category==="body"} onChange={event=>updatePieceTransform(selectedPiece.id,{rotation:Number(event.target.value)})}/></label>
          <label><span>▤ Orden de capa <b>{selectedPieceTransform.layer_order}</b></span><input aria-label="Orden de capa de pieza" type="range" min="0" max="100" step="1" value={selectedPieceTransform.layer_order} disabled={busy||selectedPiece.category==="body"} onChange={event=>updatePieceTransform(selectedPiece.id,{layer_order:Number(event.target.value)})}/></label>
          <label className="modular-check"><input aria-label="Pieza visible" type="checkbox" checked={selectedPiece.category==="body"||selectedPieceTransform.visible} disabled={busy||selectedPiece.category==="body"} onChange={event=>updatePieceTransform(selectedPiece.id,{visible:event.target.checked})}/> 👁 Mostrar pieza sin eliminarla de la selección</label>
          <button type="button" className="btn muted" disabled={busy||selectedPiece.category==="body"} onClick={()=>updatePieceTransform(selectedPiece.id,{x:0,y:0,scale:100,rotation:0,layer_order:selectedPiece.layer_order??layerOrder[selectedPiece.category]??50,visible:true})}>Restaurar valores iniciales de esta pieza</button>
        </div>}
        <small role="status">Los cambios se aplican al PNG real automáticamente. El cuerpo base se mantiene visible como referencia.</small>
      </div>}
      <div className="modular-library-actions">
        <button className="btn muted" type="button" disabled={!selectedAssets.length||busy} onClick={()=>void saveCompositionProfile()}>Guardar personaje importado</button>
        <button className="btn muted" type="button" disabled={!profileId||busy} onClick={()=>void loadCompositionProfile()}>Cargar personaje importado</button>
        <button className="btn primary" type="button" disabled={!selectedAssets.length||busy} onClick={()=>void composeSelection()}>{busy?"Componiendo…":`Componer selección (${selectedAssets.length})`}</button>
      </div>
      <span role="status" data-testid="modular-compose-status">{composeStatus}</span>
      {compositionPreview&&<img className="modular-composition-preview" src={compositionPreview} alt="Composición PNG de piezas modulares importadas"/>}
    </div>
  </section>;
}
