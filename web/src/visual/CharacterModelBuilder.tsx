import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

type LibraryAsset = {
  id:string; label:string; category:string; kind:string; filename:string; source_filename?:string;
  view:string; available?:boolean; source_url?:string; license?:string;
};
type PaletteEntry = { hex:string; pixels:number; share:number };
type ModelLayer = {
  id:string; label:string; role:string; suggested_zone:string; pixel_count:number;
  bbox:{x:number;y:number;width:number;height:number}; color_hex:string|null;
  semantic_category:string|null; layer_order:number; filename:string; sha256:string;
};
type ModelReference = {
  asset_id:string; label:string; filename:string; category:string; kind:string; view:string;
  alpha_coverage:number; background_removed:boolean; content_bounds:{x:number;y:number;width:number;height:number};
};
type CharacterModel = {
  schema_version:number; id:string; name:string; style_id:string; revision:number;
  created_at:string; updated_at:string; base_asset_id:string; references:ModelReference[];
  style_signature:{source_image_count:number;category_counts:Record<string,number>;dominant_palette:PaletteEntry[];mean_alpha_coverage:number;images_with_flat_background_removed:number;is_trained_ml_model:false;description:string};
  decomposition:{method:string;palette_colors:number;source_visible_pixels:number;components_detected:number;regions_kept:number;residual_components:number;layers_written:number;minimum_region_pixels:number;round_trip_exact_visible_pixels:boolean;canvas:{width:number;height:number}};
  layers:ModelLayer[];
  workflow:{kind:string;split_is_semantic:boolean;needs_user_role_assignment:boolean;next_action:string};
};
type ModelSummary = {id:string;name:string;style_id:string;revision:number;created_at:string;updated_at:string;base_asset_id:string;reference_count:number;layer_count:number;palette:PaletteEntry[];round_trip_exact_visible_pixels:boolean};

const roleOptions=[
 ["body","Cuerpo"],["head","Cabeza"],["face","Rostro"],["hair_back","Cabello posterior"],
 ["hair_front","Cabello frontal"],["eyes","Ojos"],["brows","Cejas"],["mouth","Boca"],
 ["clothing_top","Prenda superior"],["clothing_bottom","Prenda inferior"],["footwear","Calzado"],
 ["accessory_back","Accesorio posterior"],["accessory_front","Accesorio frontal"],
] as const;
const suitableKinds=new Set(["reference","full_character","portrait","modular_piece"]);
const friendlyKind=(kind:string)=>({reference:"Referencia",full_character:"Personaje completo",portrait:"Retrato",modular_piece:"Pieza modular"}[kind]||kind);
const imageUrl=(id:string,name:string)=>"/api/character-models/"+encodeURIComponent(id)+"/"+name;

export function CharacterModelBuilder() {
  const [assets,setAssets]=useState<LibraryAsset[]>([]);
  const [models,setModels]=useState<ModelSummary[]>([]);
  const [selectedIds,setSelectedIds]=useState<string[]>([]);
  const [baseAssetId,setBaseAssetId]=useState("");
  const [name,setName]=useState("Nuevo modelo de personaje");
  const [styleId,setStyleId]=useState("mi-estilo-v1");
  const [maxRegions,setMaxRegions]=useState("48");
  const [model,setModel]=useState<CharacterModel|null>(null);
  const [activeModelId,setActiveModelId]=useState("");
  const [layerLabels,setLayerLabels]=useState<Record<string,string>>({});
  const [layerCategories,setLayerCategories]=useState<Record<string,string>>({});
  const [selectedRegionIds,setSelectedRegionIds]=useState<string[]>([]);
  const [groupLabel,setGroupLabel]=useState("Pieza agrupada");
  const [groupCategory,setGroupCategory]=useState("clothing_top");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [showAllLayers,setShowAllLayers]=useState(false);
  const [filter,setFilter]=useState("");
  const [editingLayerId,setEditingLayerId]=useState("");
  const [maskTool,setMaskTool]=useState<"add"|"erase"|"polygon-add"|"polygon-erase">("add");
  const [brushSize,setBrushSize]=useState(18);
  const [polygonPoints,setPolygonPoints]=useState<Array<{x:number;y:number}>>([]);
  const [maskDirty,setMaskDirty]=useState(false);
  const previewCanvasRef=useRef<HTMLCanvasElement|null>(null);
  const maskCanvasRef=useRef<HTMLCanvasElement|null>(null);
  const sourceImageRef=useRef<HTMLImageElement|null>(null);
  const maskHistoryRef=useRef<ImageData[]>([]);
  const paintingRef=useRef(false);


  const selectedAssets=useMemo(()=>assets.filter(asset=>selectedIds.includes(asset.id)),[assets,selectedIds]);
  const importReferenceFiles=async(files:FileList|null)=>{
    if(!files?.length)return;
    setBusy(true);setError("");setNotice("");
    try{
      const imported:string[]=[];
      for(const file of Array.from(files)){
        const mime=file.type.toLowerCase();
        if(!["image/png","image/jpeg","image/webp"].includes(mime))throw new Error(file.name+": usa PNG, JPEG o WebP.");
        if(file.size>12*1024*1024)throw new Error(file.name+": supera el límite de 12 MiB.");
        const bytes=new Uint8Array(await file.arrayBuffer());
        let binary="";
        for(let offset=0;offset<bytes.length;offset+=0x8000)binary+=String.fromCharCode(...bytes.subarray(offset,Math.min(offset+0x8000,bytes.length)));
        const response=await fetch("/api/modular-assets",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          filename:file.name,mime_type:mime,data_base64:btoa(binary),category:"reference",label:file.name.slice(0,100),
          kind:"reference",view:"unknown",license:"USER_PROVIDED_REFERENCE",source_url:"",source_filename:file.name
        })});
        const data=await response.json();
        if(!response.ok)throw new Error(data.error||"No se pudo importar "+file.name+".");
        imported.push(data.asset?.id||data.id);
      }
      const ids=imported.filter((id):id is string=>typeof id==="string");
      await refreshAssets();
      setSelectedIds(current=>Array.from(new Set([...current,...ids])).slice(0,32));
      if(ids.length&&!baseAssetId)setBaseAssetId(ids[0]);
      setNotice(ids.length+" imagen(es) importadas a la biblioteca y añadidas al lote. Las vistas distintas se conservan como referencias, no como prendas automáticas.");
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    finally{setBusy(false);}
  };
  const drawMaskPreview=()=>{
    const canvas=previewCanvasRef.current,maskCanvas=maskCanvasRef.current,source=sourceImageRef.current;
    if(!canvas||!maskCanvas||!source)return;
    const ctx=canvas.getContext("2d"),maskCtx=maskCanvas.getContext("2d");
    if(!ctx||!maskCtx)return;
    ctx.clearRect(0,0,512,768);ctx.drawImage(source,0,0,512,768);
    const mask=maskCtx.getImageData(0,0,512,768),overlay=ctx.createImageData(512,768);
    for(let i=0;i<mask.data.length;i+=4){const value=mask.data[i];overlay.data[i]=255;overlay.data[i+1]=35;overlay.data[i+2]=110;overlay.data[i+3]=Math.round(value*0.48);}
    ctx.putImageData(overlay,0,0);
    ctx.strokeStyle="#f8fafc";ctx.lineWidth=1;
    if(polygonPoints.length){ctx.beginPath();polygonPoints.forEach((point,index)=>index===0?ctx.moveTo(point.x,point.y):ctx.lineTo(point.x,point.y));ctx.stroke();}
  };
  useEffect(()=>{
    if(!model||!editingLayerId)return;
    let cancelled=false;
    const source=new Image(),layer=new Image();
    source.onload=()=>{if(cancelled)return;sourceImageRef.current=source;};
    layer.onload=()=>{
      if(cancelled)return;
      const maskCanvas=maskCanvasRef.current;
      const temp=document.createElement("canvas");temp.width=512;temp.height=768;
      const tempCtx=temp.getContext("2d"),maskCtx=maskCanvas?.getContext("2d");
      if(!tempCtx||!maskCtx||!maskCanvas)return;
      tempCtx.drawImage(layer,0,0,512,768);
      const rgba=tempCtx.getImageData(0,0,512,768),mask=maskCtx.createImageData(512,768);
      for(let i=0;i<rgba.data.length;i+=4){const value=rgba.data[i+3];mask.data[i]=value;mask.data[i+1]=value;mask.data[i+2]=value;mask.data[i+3]=255;}
      maskCtx.putImageData(mask,0,0);maskHistoryRef.current=[];setMaskDirty(false);setPolygonPoints([]);
      if(source.complete&&source.naturalWidth)drawMaskPreview();
      else source.onload=()=>{if(!cancelled){sourceImageRef.current=source;drawMaskPreview();}};
    };
    source.src=imageUrl(model.id,"source.png");
    layer.src=imageUrl(model.id,"layers/"+editingLayerId+".png");
    return ()=>{cancelled=true;};
  },[model?.id,model?.revision,editingLayerId]);
  useEffect(()=>{if(polygonPoints.length)drawMaskPreview();},[polygonPoints]);
  const canvasPoint=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
    const rect=event.currentTarget.getBoundingClientRect();
    return {x:Math.max(0,Math.min(511,(event.clientX-rect.left)*512/rect.width)),y:Math.max(0,Math.min(767,(event.clientY-rect.top)*768/rect.height))};
  };
  const paintAt=(point:{x:number;y:number},begin:boolean)=>{
    const canvas=maskCanvasRef.current,ctx=canvas?.getContext("2d");
    if(!canvas||!ctx)return;
    if(begin){maskHistoryRef.current.push(ctx.getImageData(0,0,512,768));if(maskHistoryRef.current.length>20)maskHistoryRef.current.shift();}
    ctx.globalCompositeOperation="source-over";
    ctx.strokeStyle=maskTool==="add"?"#ffffff":"#000000";
    ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=brushSize;ctx.lineCap="round";ctx.lineJoin="round";
    if(begin){ctx.beginPath();ctx.arc(point.x,point.y,brushSize/2,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(point.x,point.y);paintingRef.current=true;}
    else if(paintingRef.current){ctx.lineTo(point.x,point.y);ctx.stroke();ctx.beginPath();ctx.moveTo(point.x,point.y);}
    drawMaskPreview();setMaskDirty(true);
  };
  const finishPaint=()=>{const ctx=maskCanvasRef.current?.getContext("2d");if(ctx&&paintingRef.current)ctx.closePath();paintingRef.current=false;};
  const applyPolygon=()=>{
    const canvas=maskCanvasRef.current,ctx=canvas?.getContext("2d");
    if(!ctx||polygonPoints.length<3){setError("Marca al menos tres puntos para cerrar el polígono.");return;}
    maskHistoryRef.current.push(ctx.getImageData(0,0,512,768));
    ctx.beginPath();polygonPoints.forEach((point,index)=>index===0?ctx.moveTo(point.x,point.y):ctx.lineTo(point.x,point.y));ctx.closePath();
    ctx.fillStyle=maskTool==="polygon-add"?"#ffffff":"#000000";ctx.fill();setPolygonPoints([]);setMaskDirty(true);drawMaskPreview();
  };
  const undoMask=()=>{
    const previous=maskHistoryRef.current.pop(),ctx=maskCanvasRef.current?.getContext("2d");
    if(previous&&ctx){ctx.putImageData(previous,0,0);setMaskDirty(true);drawMaskPreview();}
  };
  const saveMask=async()=>{
    if(!model||!editingLayerId||!maskCanvasRef.current)return;
    setBusy(true);setError("");setNotice("");
    try{
      const dataUrl=maskCanvasRef.current.toDataURL("image/png");
      const response=await fetch("/api/character-models/"+encodeURIComponent(model.id)+"/edit-layer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({layer_id:editingLayerId,mask_png_base64:dataUrl.split(",")[1]})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"No se pudo guardar la máscara.");
      setModel(data.model);setLayerLabels(Object.fromEntries(data.model.layers.map((layer:ModelLayer)=>[layer.id,layer.label])));
      setNotice("Máscara guardada. Se conservaron los colores originales de la fuente y se recalculó la reconstrucción.");
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    finally{setBusy(false);}
  };
  const resetMask=async()=>{
    if(!model||!editingLayerId)return;
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/character-models/"+encodeURIComponent(model.id)+"/reset-layer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({layer_id:editingLayerId})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||"No hay máscara original para restaurar.");
      setModel(data.model);setMaskDirty(false);setNotice("Máscara original restaurada.");
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    finally{setBusy(false);}
  };

  const candidates=useMemo(()=>selectedAssets.filter(asset=>asset.id!==baseAssetId),[selectedAssets,baseAssetId]);
  const filteredAssets=useMemo(()=>{
    const q=filter.trim().toLowerCase();
    return assets.filter(asset=>!q||[asset.label,asset.filename,asset.category,asset.kind].some(value=>value.toLowerCase().includes(q)));
  },[assets,filter]);
  const layersToShow=showAllLayers?model?.layers??[]:(model?.layers??[]).slice(0,18);

  const refreshAssets=async()=>{
    const response=await fetch("/api/modular-assets");
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"No se pudo leer la biblioteca.");
    const available=(data.assets||[]).filter((asset:LibraryAsset)=>suitableKinds.has(asset.kind)&&asset.available!==false);
    setAssets(available);
    setSelectedIds(current=>current.filter(id=>available.some((asset:LibraryAsset)=>asset.id===id)));
    setBaseAssetId(current=>current&&available.some((asset:LibraryAsset)=>asset.id===current)?current:(available[0]?.id||""));
  };
  const refreshModels=async()=>{
    const response=await fetch("/api/character-models");
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"No se pudo leer la lista de modelos.");
    setModels(data.models||[]);
    return (data.models||[]) as ModelSummary[];
  };
  const loadModel=async(id:string)=>{
    if(!id){setModel(null);setActiveModelId("");return;}
    const response=await fetch("/api/character-models/"+encodeURIComponent(id));
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"No se pudo abrir el modelo.");
    setModel(data);
    setActiveModelId(id);
    setLayerLabels(Object.fromEntries((data.layers||[]).map((layer:ModelLayer)=>[layer.id,layer.label])));
    setSelectedRegionIds([]);
    setLayerCategories(Object.fromEntries((data.layers||[]).filter((layer:ModelLayer)=>layer.semantic_category).map((layer:ModelLayer)=>[layer.id,layer.semantic_category! ])));
    setShowAllLayers(false);
  };

  useEffect(()=>{
    let alive=true;
    (async()=>{
      try{
        const [assetResponse,modelResponse]=await Promise.all([fetch("/api/modular-assets"),fetch("/api/character-models")]);
        const [assetData,modelData]=await Promise.all([assetResponse.json(),modelResponse.json()]);
        if(!assetResponse.ok)throw new Error(assetData.error||"No se pudo leer la biblioteca local.");
        if(!modelResponse.ok)throw new Error(modelData.error||"No se pudo leer los modelos.");
        if(!alive)return;
        const available=(assetData.assets||[]).filter((asset:LibraryAsset)=>suitableKinds.has(asset.kind)&&asset.available!==false);
        setAssets(available);
        setBaseAssetId(available[0]?.id||"");
        setModels(modelData.models||[]);
        if(modelData.models?.length){
          const first=modelData.models[0].id;
          const response=await fetch("/api/character-models/"+encodeURIComponent(first));
          const detail=await response.json();
          if(response.ok&&alive){
            setModel(detail);setActiveModelId(first);
            setLayerLabels(Object.fromEntries((detail.layers||[]).map((layer:ModelLayer)=>[layer.id,layer.label])));
          }
        }
      }catch(reason){if(alive)setError(reason instanceof Error?reason.message:String(reason));}
    })();
    return ()=>{alive=false;};
  },[]);

  const refreshLibrary=async()=>{
    setBusy(true);setError("");setNotice("");
    try{
      await refreshAssets();
      await refreshModels();
      setNotice("Biblioteca actualizada. Las nuevas imágenes ya pueden añadirse a un modelo.");
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    finally{setBusy(false);}
  };

  const toggleAsset=(id:string)=>{
    setSelectedIds(current=>{
      if(current.includes(id))return current.filter(value=>value!==id);
      if(current.length>=32){setError("Un modelo admite como máximo 32 imágenes de referencia.");return current;}
      return [...current,id];
    });
    setError("");
  };
  const createModel=async()=>{
    if(!name.trim()||!styleId.trim()){setError("Pon un nombre y un ID de estilo.");return;}
    if(!baseAssetId||!selectedIds.includes(baseAssetId)){setError("Selecciona la imagen base y marca esa imagen en el lote.");return;}
    if(!selectedIds.length){setError("Marca al menos una imagen en la biblioteca.");return;}
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/character-models",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({name:name.trim(),style_id:styleId.trim(),base_asset_id:baseAssetId,asset_ids:selectedIds,max_regions:Number(maxRegions)})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No se pudo construir el paquete.");
      setModel(data.model);setActiveModelId(data.model.id);
      setLayerLabels(Object.fromEntries(data.model.layers.map((layer:ModelLayer)=>[layer.id,layer.label])));
      setLayerCategories({});
      setSelectedRegionIds([]);
      await refreshModels();
      setNotice("Modelo creado: "+data.model.layers.length+" capas raster, "+data.model.references.length+" referencias y una paleta de estilo guardada.");
      setShowAllLayers(false);
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    finally{setBusy(false);}
  };
  const extendStyle=async()=>{
    if(!model){setError("Primero crea o abre un modelo.");return;}
    const currentIds=new Set(model.references.map(reference=>reference.asset_id));
    const newIds=selectedIds.filter(id=>!currentIds.has(id));
    if(!newIds.length){setError("Marca al menos una imagen nueva que todavía no pertenezca a este estilo.");return;}
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/character-models/"+encodeURIComponent(model.id)+"/extend",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({asset_ids:newIds})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No se pudo ampliar el estilo.");
      setModel(data.model);await refreshModels();
      setNotice("Estilo ampliado con "+data.added_asset_ids.length+" referencia(s). Se actualizó la paleta; las capas base se conservaron.");
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    finally{setBusy(false);}
  };
  const toggleRegion=(id:string,checked:boolean)=>{
    setSelectedRegionIds(current=>checked?(current.includes(id)?current:[...current,id]):current.filter(value=>value!==id));
  };
  const publishSelectedRegions=async()=>{
    if(!model){setError("Primero crea o abre un modelo.");return;}
    if(!selectedRegionIds.length){setError("Selecciona al menos una región para unir.");return;}
    if(!groupLabel.trim()){setError("Pon un nombre para la pieza agrupada.");return;}
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/character-models/"+encodeURIComponent(model.id)+"/publish-layer",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({layer_ids:selectedRegionIds,label:groupLabel.trim(),category:groupCategory,view:"front"}),
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No se pudieron unir las regiones.");
      const count=Number(data.merged_region_count)||selectedRegionIds.length;
      setSelectedRegionIds([]);
      await refreshAssets();
      setNotice(count+" regiones unidas e importadas como una única pieza «"+groupLabel.trim()+"». Los anclajes quedan pendientes de validar.");
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    finally{setBusy(false);}
  };

  const publishLayer=async(layer:ModelLayer)=>{
    if(!model)return;
    const category=layerCategories[layer.id];
    if(!category){setError("Elige un rol para "+layer.label+" antes de importarla.");return;}
    setBusy(true);setError("");setNotice("");
    try{
      const response=await fetch("/api/character-models/"+encodeURIComponent(model.id)+"/publish-layer",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({layer_id:layer.id,label:(layerLabels[layer.id]||layer.label).trim(),category,view:"front"})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"No se pudo importar la región.");
      await refreshAssets();
      setNotice("Región importada al catálogo como «"+category+"». Sus anclajes siguen pendientes de validar antes de usarla en composición final.");
    }catch(reason){setError(reason instanceof Error?reason.message:String(reason));}
    finally{setBusy(false);}
  };

  return <section className="character-model-builder" aria-labelledby="character-model-builder-title">
    <div className="model-builder-heading">
      <div><div className="model-builder-kicker">MODEL BUILDER / OFFLINE</div><h2 id="character-model-builder-title">Constructor de modelos por regiones</h2>
      <p>Convierte una imagen base en capas PNG independientes y usa las demás imágenes para formar y ampliar el perfil visual del personaje.</p></div>
      <div className="model-builder-count"><strong>{assets.length}</strong><span>recursos</span></div>
    </div>
    {error&&<div className="model-builder-alert error" role="alert">{error}</div>}
    {notice&&<div className="model-builder-alert success" role="status">{notice}</div>}
    <div className="model-builder-columns">
      <div className="model-builder-inputs">
        <div className="model-builder-section-title"><span>01</span><h3>Armar lote de imágenes</h3></div>
        <div className="model-builder-form-row">
          <label>Nombre del modelo<input value={name} maxLength={80} onChange={event=>setName(event.target.value)} /></label>
          <label>ID de estilo<input value={styleId} maxLength={100} onChange={event=>setStyleId(event.target.value)} /></label>
        </div>
        <div className="model-builder-form-row">
          <label>Máximo de capas candidatas<select value={maxRegions} onChange={event=>setMaxRegions(event.target.value)}><option value="24">24 capas</option><option value="48">48 capas</option><option value="64">64 capas</option></select></label>
          <label>Imagen que se va a separar<select value={baseAssetId} onChange={event=>setBaseAssetId(event.target.value)}><option value="">Elegir imagen base</option>{selectedAssets.map(asset=><option key={asset.id} value={asset.id}>{asset.label}</option>)}</select></label>
        </div>
        <label className="model-builder-upload">Importar varias imágenes directamente<input aria-label="Importar varias imágenes directamente" type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={event=>{void importReferenceFiles(event.currentTarget.files);event.currentTarget.value="";}}/><small>PNG, JPEG o WebP. Las imágenes se guardan como referencias con SHA-256, procedencia y vista sin clasificar automáticamente como prendas.</small></label>
        <label className="model-builder-search">Filtrar recursos<input value={filter} onChange={event=>setFilter(event.target.value)} placeholder="Nombre, archivo o categoría…" /></label>
        <button type="button" className="model-builder-secondary" disabled={busy} onClick={refreshLibrary}>Actualizar biblioteca local</button>
        <div className="model-builder-asset-list">
          {filteredAssets.map(asset=><label className={selectedIds.includes(asset.id)?"model-builder-asset selected":"model-builder-asset"} key={asset.id}>
            <input type="checkbox" checked={selectedIds.includes(asset.id)} onChange={()=>toggleAsset(asset.id)} />
            <span className="model-builder-asset-copy"><strong>{asset.label||asset.filename}</strong><small>{asset.source_filename||asset.filename} · {friendlyKind(asset.kind)} · {asset.category}</small></span>
            {asset.id===baseAssetId&&<span className="model-builder-base-tag">BASE</span>}
          </label>)}
          {!filteredAssets.length&&<p className="model-builder-empty">Todavía no hay imágenes guardadas en la biblioteca. Impórtalas arriba, en “Biblioteca modular de PNG”, y vuelve aquí.</p>}
        </div>
        <div className="model-builder-action-row"><span>{selectedIds.length}/32 imágenes seleccionadas</span><button type="button" className="model-builder-primary" disabled={busy||!assets.length} onClick={createModel}>{busy?"Procesando…":"Crear modelo y separar capas"}</button></div>
        <button type="button" className="model-builder-secondary" disabled={busy||!model||!candidates.length} onClick={extendStyle}>Añadir selección al estilo abierto</button>
        {model&&<div className="model-builder-model-select"><label>Modelo guardado<select value={activeModelId} onChange={event=>loadModel(event.target.value)}>{models.map(item=><option key={item.id} value={item.id}>{item.name} · v{item.revision}</option>)}</select></label><button type="button" className="model-builder-secondary" disabled={busy} onClick={async()=>{try{await loadModel(activeModelId);setNotice("Modelo cargado desde el disco local.");setError("");}catch(reason){setError(reason instanceof Error?reason.message:String(reason));}}}>Abrir modelo</button></div>}
      </div>
      <div className="model-builder-output">
        {!model?<div className="model-builder-empty big"><strong>Tu primer modelo aparecerá aquí.</strong><span>Selecciona varias referencias y marca cuál será la imagen base. El procesamiento ocurre en el motor local.</span></div>:<>
          <div className="model-builder-output-title"><div><span>MODELO LOCAL · REVISIÓN {model.revision}</span><h3>{model.name}</h3><p>{model.references.length} imágenes de estilo · {model.layers.length} capas raster</p></div><span className={model.decomposition.round_trip_exact_visible_pixels?"model-builder-check":"model-builder-check warning"}>{model.decomposition.round_trip_exact_visible_pixels?"RECONSTRUCCIÓN EXACTA":"REVISAR RECONSTRUCCIÓN"}</span></div>
          <div className="model-builder-preview-pair">
            <figure><img src={imageUrl(model.id,"source.png")} alt="Imagen base procesada"/><figcaption>Fuente normalizada</figcaption></figure>
            <figure><img src={imageUrl(model.id,"preview.png")} alt="Reconstrucción a partir de las capas"/><figcaption>Reconstruida desde capas</figcaption></figure>
          </div>
          <div className="model-builder-metrics"><div><strong>{model.decomposition.components_detected}</strong><span>regiones encontradas</span></div><div><strong>{model.layers.length}</strong><span>capas guardadas</span></div><div><strong>{Math.round(model.decomposition.source_visible_pixels/768/512*100)}%</strong><span>lienzo visible</span></div></div>
          <div className="model-builder-palette"><b>Paleta aprendida de las referencias</b><div>{model.style_signature.dominant_palette.map(item=><span title={item.hex+" · "+Math.round(item.share*100)+"%"} key={item.hex} style={{background:item.hex}} />)}</div><small>Se actualiza al agregar imágenes. Es una firma visual local, no entrenamiento de un generador de imágenes.</small></div>
          <div className="model-builder-section-title regions"><span>02</span><h3>Capas separadas automáticamente</h3><small>Las regiones son por color y conectividad; la categoría semántica se confirma manualmente.</small></div>
          <div className="model-builder-region-grid">
            {layersToShow.map(layer=><article className="model-builder-region" key={layer.id}>
              <div className="model-builder-region-image"><img src={imageUrl(model.id,"layers/"+layer.id+"-thumb.png")} alt={layer.label}/></div>
              <div className="model-builder-region-body">
                <label className="model-builder-region-select"><input type="checkbox" checked={selectedRegionIds.includes(layer.id)} onChange={event=>toggleRegion(layer.id,event.target.checked)}/>Unir en pieza</label>
                <label>Nombre<input value={layerLabels[layer.id]??layer.label} onChange={event=>setLayerLabels(current=>({...current,[layer.id]:event.target.value}))} /></label>
                <div className="model-builder-region-meta"><span>{layer.pixel_count.toLocaleString()} px</span>{layer.color_hex&&<i style={{background:layer.color_hex}} title={layer.color_hex}/>}<small>{layer.suggested_zone}</small></div>
                <label>Rol para importar<select value={layerCategories[layer.id]||""} onChange={event=>setLayerCategories(current=>({...current,[layer.id]:event.target.value}))}><option value="">Solo candidato</option>{roleOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                <button type="button" className="model-builder-secondary" disabled={busy} onClick={()=>{setEditingLayerId(layer.id);setMaskTool("add");setPolygonPoints([]);setError("");}}>Editar máscara</button>
                <button type="button" className="model-builder-region-import" disabled={busy||!layerCategories[layer.id]} onClick={()=>publishLayer(layer)}>Importar como pieza</button>
              </div>
            </article>)}
          </div>
          {editingLayerId&&model.layers.some(layer=>layer.id===editingLayerId)&&<div className="model-builder-group-panel" data-testid="mask-editor">
            <div className="model-builder-group-heading"><b>Corregir máscara · {model.layers.find(layer=>layer.id===editingLayerId)?.label}</b><span>Rojo = píxeles seleccionados. Pincel y polígono solo seleccionan píxeles que ya existen en la fuente; no inventan zonas ocultas.</span></div>
            <div className="model-builder-form-row"><label>Herramienta<select value={maskTool} onChange={event=>setMaskTool(event.target.value as typeof maskTool)}><option value="add">Pincel: sumar</option><option value="erase">Pincel: borrar</option><option value="polygon-add">Polígono: sumar</option><option value="polygon-erase">Polígono: borrar</option></select></label>
              <label>Tamaño del pincel<input type="range" min="2" max="72" value={brushSize} onChange={event=>setBrushSize(Number(event.target.value))}/></label></div>
            <div style={{position:"relative",width:"min(100%, 320px)",margin:"0 auto",background:"#151522",borderRadius:"8px",overflow:"hidden"}}>
              <canvas ref={previewCanvasRef} width={512} height={768} aria-label="Fuente con superposición de máscara editable" data-testid="mask-preview" style={{display:"block",width:"100%",height:"auto",touchAction:"none",cursor:maskTool.startsWith("polygon")?"crosshair":"cell"}} onPointerDown={event=>{const point=canvasPoint(event);if(maskTool.startsWith("polygon")){setPolygonPoints(current=>[...current,point]);}else{event.currentTarget.setPointerCapture(event.pointerId);paintAt(point,true);}}} onPointerMove={event=>{if(paintingRef.current&&!maskTool.startsWith("polygon"))paintAt(canvasPoint(event),false);}} onPointerUp={finishPaint} onPointerCancel={finishPaint} />
              <canvas ref={maskCanvasRef} width={512} height={768} aria-hidden="true" style={{position:"absolute",left:"-10000px",top:0,pointerEvents:"none"}} />
            </div>
            {maskTool.startsWith("polygon")&&<p>{polygonPoints.length} puntos marcados. Haz clic en la imagen para añadir vértices.</p>}
            <div className="model-builder-action-row">
              <button type="button" className="model-builder-secondary" disabled={busy||!maskHistoryRef.current.length} onClick={undoMask}>Deshacer última edición</button>
              <button type="button" className="model-builder-secondary" disabled={busy||polygonPoints.length<3} onClick={applyPolygon}>Aplicar polígono</button>
              <button type="button" className="model-builder-secondary" disabled={busy||!polygonPoints.length} onClick={()=>setPolygonPoints([])}>Cancelar polígono</button>
            </div>
            <div className="model-builder-action-row">
              <button type="button" className="model-builder-primary" disabled={busy||!maskDirty} onClick={saveMask}>Guardar máscara corregida</button>
              <button type="button" className="model-builder-secondary" disabled={busy} onClick={resetMask}>Restaurar máscara original</button>
              <button type="button" className="model-builder-secondary" disabled={busy} onClick={()=>setEditingLayerId("")}>Cerrar editor</button>
            </div>
          </div>}
          {selectedRegionIds.length>0&&<div className="model-builder-group-panel">
            <div className="model-builder-group-heading"><b>Agrupar regiones seleccionadas</b><span>{selectedRegionIds.length} regiones se convertirán en una sola máscara PNG transparente.</span></div>
            <div className="model-builder-group-fields">
              <label>Nombre de la pieza agrupada<input value={groupLabel} maxLength={100} onChange={event=>setGroupLabel(event.target.value)}/></label>
              <label>Rol de la pieza<select value={groupCategory} onChange={event=>setGroupCategory(event.target.value)}>{roleOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <button type="button" className="model-builder-primary" disabled={busy||!groupLabel.trim()} onClick={publishSelectedRegions}>Unir e importar {selectedRegionIds.length} regiones como una pieza</button>
          </div>}
          {(model.layers.length>18)&&<button type="button" className="model-builder-secondary" onClick={()=>setShowAllLayers(value=>!value)}>{showAllLayers?"Mostrar menos":"Mostrar las "+model.layers.length+" regiones"}</button>}
          <div className="model-builder-warning"><strong>Qué hace esta separación</strong><p>Se divide la imagen en regiones conectadas por color. Al superponer todas las capas se reconstruyen los píxeles visibles de la imagen base. Esto no significa que el programa sepa por sí solo cuál región es una chaqueta o un ojo: revisa el recorte, asigna el rol correcto e importa solo las regiones que sirvan. Las otras imágenes amplían la paleta y el registro del estilo, pero no se mezclan automáticamente con la pose base.</p></div>
        </>}
      </div>
    </div>
  </section>;
}
