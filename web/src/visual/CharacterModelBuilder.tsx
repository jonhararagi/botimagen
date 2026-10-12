import { useEffect, useMemo, useState } from "react";

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
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [showAllLayers,setShowAllLayers]=useState(false);
  const [filter,setFilter]=useState("");

  const selectedAssets=useMemo(()=>assets.filter(asset=>selectedIds.includes(asset.id)),[assets,selectedIds]);
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
                <label>Nombre<input value={layerLabels[layer.id]??layer.label} onChange={event=>setLayerLabels(current=>({...current,[layer.id]:event.target.value}))} /></label>
                <div className="model-builder-region-meta"><span>{layer.pixel_count.toLocaleString()} px</span>{layer.color_hex&&<i style={{background:layer.color_hex}} title={layer.color_hex}/>}<small>{layer.suggested_zone}</small></div>
                <label>Rol para importar<select value={layerCategories[layer.id]||""} onChange={event=>setLayerCategories(current=>({...current,[layer.id]:event.target.value}))}><option value="">Solo candidato</option>{roleOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                <button type="button" className="model-builder-region-import" disabled={busy||!layerCategories[layer.id]} onClick={()=>publishLayer(layer)}>Importar como pieza</button>
              </div>
            </article>)}
          </div>
          {(model.layers.length>18)&&<button type="button" className="model-builder-secondary" onClick={()=>setShowAllLayers(value=>!value)}>{showAllLayers?"Mostrar menos":"Mostrar las "+model.layers.length+" regiones"}</button>}
          <div className="model-builder-warning"><strong>Qué hace esta separación</strong><p>Se divide la imagen en regiones conectadas por color. Al superponer todas las capas se reconstruyen los píxeles visibles de la imagen base. Esto no significa que el programa sepa por sí solo cuál región es una chaqueta o un ojo: revisa el recorte, asigna el rol correcto e importa solo las regiones que sirvan. Las otras imágenes amplían la paleta y el registro del estilo, pero no se mezclan automáticamente con la pose base.</p></div>
        </>}
      </div>
    </div>
  </section>;
}
