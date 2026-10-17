import { useRef, useState } from "react";
import type { PointerEvent } from "react";

type Layer = { id: string; name: string; src: string; x: number; y: number; width: number; rotation: number };
const uid = () => `layer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function QuickImageEditor() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [message, setMessage] = useState("Abrí una imagen o agregá varias para empezar a editar.");
  const [text, setText] = useState("");
  const [showText, setShowText] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; x: number; y: number; left: number; top: number } | null>(null);

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const accepted = Array.from(files).filter(file => file.type.startsWith("image/"));
    if (!accepted.length) { setMessage("Elegí imágenes PNG, JPG o WebP."); return; }
    let added = 0;
    for (const file of accepted) {
      if (file.size > 25 * 1024 * 1024) { setMessage(file.name + " supera el límite de 25 MB."); continue; }
      const reader = new FileReader();
      reader.onload = () => {
        const src = String(reader.result || "");
        if (!src.startsWith("data:image/")) return;
        const id = uid();
        setSelected(id);
        setLayers(previous => [...previous, { id, name: file.name, src, x: Math.min(12 + previous.length * 3, 30), y: Math.min(12 + previous.length * 3, 30), width: 54, rotation: 0 }]);
        setMessage("Imagen agregada al lienzo. Tocala y arrastrala para ubicarla.");
      };
      reader.onerror = () => setMessage("No se pudo leer " + file.name + ".");
      reader.readAsDataURL(file);
      added++;
    }
    if (fileRef.current) fileRef.current.value = "";
    if (added) setMessage("Cargando " + added + " imagen(es) en el lienzo…");
  }

  function update(id: string, patch: Partial<Layer>) {
    setLayers(previous => previous.map(layer => layer.id === id ? { ...layer, ...patch } : layer));
  }

  function startDrag(event: PointerEvent<HTMLImageElement>, layer: Layer) {
    event.preventDefault();
    event.stopPropagation();
    setSelected(layer.id);
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { id: layer.id, x: event.clientX, y: event.clientY, left: layer.x, top: layer.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLImageElement>) {
    const drag = dragRef.current;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!drag || !rect) return;
    update(drag.id, {
      x: Math.max(0, Math.min(88, drag.left + (event.clientX - drag.x) / rect.width * 100)),
      y: Math.max(0, Math.min(88, drag.top + (event.clientY - drag.y) / rect.height * 100)),
    });
  }

  async function exportPng() {
    if (!layers.length && !text.trim()) { setMessage("Agregá una imagen antes de exportar."); return; }
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200; canvas.height = 1600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("El navegador no pudo crear el lienzo.");
      for (const layer of layers) {
        const image = new Image();
        image.src = layer.src;
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("No se pudo cargar " + layer.name)); });
        const x = layer.x / 100 * canvas.width;
        const y = layer.y / 100 * canvas.height;
        const width = layer.width / 100 * canvas.width;
        const height = width * image.naturalHeight / image.naturalWidth;
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(layer.rotation * Math.PI / 180);
        ctx.drawImage(image, -width / 2, -height / 2, width, height);
        ctx.restore();
      }
      if (showText && text.trim()) {
        ctx.save();
        ctx.font = "bold 72px Arial, sans-serif";
        ctx.textAlign = "center"; ctx.lineWidth = 10; ctx.strokeStyle = "#24172f"; ctx.fillStyle = "#ffffff";
        ctx.strokeText(text.trim().slice(0, 100), canvas.width / 2, canvas.height * 0.9, canvas.width * 0.9);
        ctx.fillText(text.trim().slice(0, 100), canvas.width / 2, canvas.height * 0.9, canvas.width * 0.9);
        ctx.restore();
      }
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("No se pudo exportar el PNG.")), "image/png"));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = "botimagen-edicion.png"; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setMessage("PNG exportado en 1200 × 1600 px. Las imágenes originales no se modificaron.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falló la exportación.");
    } finally { setBusy(false); }
  }

  const active = layers.find(layer => layer.id === selected);
  return <section id="quick-image-editor" className="quick-image-editor" aria-label="Editor de imágenes">
    <style>{`
      .quick-image-editor{margin:18px 0 28px;padding:clamp(12px,2.5vw,22px);border:1px solid #34344c;border-radius:20px;background:#11121b;color:#f8f6ff;scroll-margin-top:12px}
      .qie-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}.qie-head h2{margin:0;font-size:clamp(20px,3vw,27px);letter-spacing:-.04em}.qie-head p{margin:5px 0 0;color:#a9acc2;font-size:13px}
      .qie-actions{display:flex;gap:8px;flex-wrap:wrap}.qie-btn{border:1px solid #42435b;border-radius:11px;padding:10px 13px;background:#222438;color:#fff;font:inherit;font-size:13px;font-weight:600;cursor:pointer;min-height:42px}.qie-btn.primary{background:#c6a5ff;border-color:#c6a5ff;color:#20152f}.qie-btn:disabled{opacity:.55}
      .qie-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(210px,270px);gap:14px;align-items:start}.qie-stage-wrap{min-width:0;background:#0a0b11;border:1px solid #303044;border-radius:15px;padding:10px}
      .qie-stage{position:relative;width:100%;aspect-ratio:3/4;max-height:72vh;margin:auto;overflow:hidden;touch-action:none;background-color:#202130;background-image:linear-gradient(45deg,#292a3a 25%,transparent 25%),linear-gradient(-45deg,#292a3a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#292a3a 75%),linear-gradient(-45deg,transparent 75%,#292a3a 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}
      .qie-layer{position:absolute;max-width:none;height:auto;object-fit:contain;touch-action:none;user-select:none;cursor:move;transform-origin:center center}.qie-layer.selected{outline:2px solid #c6a5ff;outline-offset:2px}
      .qie-empty{position:absolute;inset:0;display:grid;place-content:center;text-align:center;padding:24px;color:#a9acc2}.qie-empty b{font-size:18px;color:#e9e2ff}.qie-empty span{margin-top:8px;font-size:12px;line-height:1.6}
      .qie-panel{display:grid;gap:12px}.qie-card{padding:13px;border:1px solid #303248;border-radius:13px;background:#181a28;min-width:0}.qie-card h3{font-size:13px;margin:0 0 10px;color:#e9dfff}.qie-card label{display:grid;gap:7px;margin:10px 0;color:#bfc1d7;font-size:12px}.qie-card input[type=range]{width:100%;accent-color:#c6a5ff}.qie-card input[type=text]{width:100%;min-width:0;padding:10px;border:1px solid #3c3e55;border-radius:9px;background:#0e1019;color:white;font:inherit}.qie-layer-list{display:grid;gap:6px}.qie-layer-row{display:flex;gap:7px;align-items:center}.qie-layer-row button{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}.qie-layer-row button.active{border-color:#c6a5ff;background:#30263f}.qie-status{margin:12px 0 0;color:#bdbbd2;font-size:12px;line-height:1.5}
      @media(max-width:720px){.qie-layout{grid-template-columns:minmax(0,1fr)}.qie-stage-wrap{padding:7px}.qie-stage{max-height:none;max-width:100%;width:min(100%,460px)}.qie-panel{grid-template-columns:repeat(2,minmax(0,1fr))}.qie-card{padding:10px}.qie-card:last-child{grid-column:1/-1}.qie-btn{padding:9px 10px;font-size:12px}.qie-head{align-items:flex-start}.qie-actions{width:100%}.qie-actions .qie-btn{flex:1}}
      @media(max-width:390px){.qie-panel{grid-template-columns:minmax(0,1fr)}.qie-card:last-child{grid-column:auto}}
    `}</style>
    <div className="qie-head"><div><h2>Editor de imágenes</h2><p>Un lienzo limpio para combinar, mover y ajustar imágenes.</p></div>
      <div className="qie-actions"><input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={event => addFiles(event.target.files)}/><button className="qie-btn primary" type="button" onClick={() => fileRef.current?.click()}>＋ Agregar imagen</button><button className="qie-btn" type="button" onClick={() => setShowText(value => !value)}>T Texto</button><button className="qie-btn" type="button" disabled={busy || (!layers.length && !text.trim())} onClick={() => void exportPng()}>{busy ? "Exportando…" : "↓ Exportar PNG"}</button></div>
    </div>
    <div className="qie-layout">
      <div className="qie-stage-wrap"><div ref={stageRef} className="qie-stage" aria-label="Lienzo de edición">
        {!layers.length && <div className="qie-empty"><b>Tu lienzo está listo</b><span>Agregá una imagen desde tu celular o PC.<br/>Después podés sumar más capas.</span></div>}
        {layers.map(layer => <img key={layer.id} draggable={false} className={selected === layer.id ? "qie-layer selected" : "qie-layer"} src={layer.src} alt={layer.name} style={{left:layer.x+"%",top:layer.y+"%",width:layer.width+"%",transform:`rotate(${layer.rotation}deg)`}} onPointerDown={event => startDrag(event,layer)} onPointerMove={moveDrag} onPointerUp={() => {dragRef.current=null}} onPointerCancel={() => {dragRef.current=null}} onClick={() => setSelected(layer.id)}/>)}
        {showText && text.trim() && <div style={{position:"absolute",left:"5%",right:"5%",top:"82%",textAlign:"center",fontWeight:800,fontSize:"clamp(16px,4vw,34px)",color:"white",textShadow:"0 2px 5px #000,2px 0 #000",pointerEvents:"none",overflowWrap:"anywhere"}}>{text}</div>}
      </div></div>
      <aside className="qie-panel">
        {active ? <div className="qie-card"><h3>Editar capa seleccionada</h3><p style={{fontSize:12,overflowWrap:"anywhere",color:"#a9acc2"}}>{active.name}</p>
          <label>Tamaño · {active.width}%<input aria-label="Tamaño de la capa" type="range" min="8" max="100" value={active.width} onChange={event => update(active.id,{width:Number(event.target.value)})}/></label>
          <label>Rotación · {active.rotation}°<input aria-label="Rotación de la capa" type="range" min="-180" max="180" value={active.rotation} onChange={event => update(active.id,{rotation:Number(event.target.value)})}/></label>
          <div className="qie-actions"><button className="qie-btn" type="button" onClick={() => update(active.id,{x:50-active.width/2,y:12,rotation:0})}>Centrar</button><button className="qie-btn" type="button" onClick={() => {setLayers(items=>items.filter(item=>item.id!==active.id));setSelected("")}}>Eliminar capa</button></div>
        </div> : <div className="qie-card"><h3>Capas</h3><p style={{fontSize:12,color:"#a9acc2"}}>Seleccioná una imagen del lienzo para cambiar su tamaño, giro o posición.</p></div>}
        <div className="qie-card"><h3>Orden de capas</h3><div className="qie-layer-list">{layers.slice().reverse().map(layer=><div className="qie-layer-row" key={layer.id}><button type="button" className={selected===layer.id?"qie-btn active":"qie-btn"} onClick={()=>setSelected(layer.id)}>{layer.name}</button><button className="qie-btn" type="button" aria-label={`Subir ${layer.name}`} onClick={()=>setLayers(items=>{const index=items.findIndex(item=>item.id===layer.id);if(index<0||index===items.length-1)return items;const copy=[...items];[copy[index],copy[index+1]]=[copy[index+1],copy[index]];return copy})}>↑</button><button className="qie-btn" type="button" aria-label={`Bajar ${layer.name}`} onClick={()=>setLayers(items=>{const index=items.findIndex(item=>item.id===layer.id);if(index<=0)return items;const copy=[...items];[copy[index],copy[index-1]]=[copy[index-1],copy[index]];return copy})}>↓</button></div>)}</div></div>
        {showText && <div className="qie-card"><h3>Texto</h3><input aria-label="Texto para el lienzo" type="text" maxLength={100} placeholder="Escribí tu texto…" value={text} onChange={event=>setText(event.target.value)}/><button className="qie-btn" style={{marginTop:8}} type="button" onClick={()=>{setText("");setShowText(false)}}>Eliminar texto</button></div>}
      </aside>
    </div>
    <p className="qie-status" role="status" aria-live="polite">{message}</p>
  </section>;
}
