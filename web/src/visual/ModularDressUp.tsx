import { useEffect, useMemo, useState } from "react";

type ModularAsset = {
  id: string;
  label: string;
  category: string;
  kind: string;
  width: number;
  height: number;
  view: string;
  anchor_estimate?: Record<string, { x: number; y: number }>;
  anchors_validated?: boolean;
  layer_order?: number | null;
  conversion?: { anchors?: Record<string, { x: number; y: number }> } | null;
};
type Slot = { category: string; label: string; compositor: string; order: number };
const slots: Slot[] = [
  { category: "body", label: "Cuerpo base", compositor: "body", order: 20 },
  { category: "hair_back", label: "Cabello posterior", compositor: "hair_back", order: 10 },
  { category: "clothing_bottom", label: "Prenda inferior", compositor: "bottom", order: 36 },
  { category: "clothing_top", label: "Prenda superior", compositor: "top", order: 40 },
  { category: "head", label: "Cabeza", compositor: "head", order: 48 },
  { category: "face", label: "Rostro", compositor: "face", order: 50 },
  { category: "eyes", label: "Ojos", compositor: "eyes", order: 52 },
  { category: "hair_front", label: "Cabello frontal", compositor: "hair_front", order: 70 },
  { category: "footwear", label: "Calzado", compositor: "footwear", order: 28 },
  { category: "accessory_back", label: "Accesorio posterior", compositor: "accessory", order: 58 },
  { category: "accessory_front", label: "Accesorio frontal", compositor: "accessory", order: 60 },
];
const viewForAsset = (asset: ModularAsset, view: "front" | "back") => asset.view === "unknown" || asset.view === view;

export function ModularDressUp() {
  const [assets, setAssets] = useState<ModularAsset[]>([]);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [view, setView] = useState<"front" | "back">("front");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Cargando piezas PNG de la biblioteca local…");

  useEffect(() => {
    let active = true;
    fetch("/api/modular-assets")
      .then(async response => {
        if (!response.ok) throw new Error("El servidor local de piezas no está disponible. Abre BotImagen con su lanzador local.");
        return response.json();
      })
      .then(data => {
        if (!active) return;
        const list = Array.isArray(data.assets) ? data.assets as ModularAsset[] : [];
        setAssets(list.filter(asset => asset.kind === "modular_piece" && slots.some(slot => slot.category === asset.category)));
        setStatus("Biblioteca leída. Selecciona las piezas que ya tengas preparadas.");
      })
      .catch(error => { if (active) setStatus(error instanceof Error ? error.message : "No se pudo leer la biblioteca."); });
    return () => { active = false; };
  }, []);

  const availableBySlot = useMemo(() => Object.fromEntries(slots.map(slot => [
    slot.category, assets.filter(asset => asset.category === slot.category && viewForAsset(asset, view)),
  ])) as Record<string, ModularAsset[]>, [assets, view]);

  const compose = async () => {
    if (busy) return;
    const selected = slots.flatMap(slot => {
      const id = selection[slot.category];
      const asset = availableBySlot[slot.category]?.find(item => item.id === id);
      if (!asset) return [];
      return [{
        schema_version: 1, id: asset.id, category: slot.compositor, resource: asset.id,
        dimensions: { width: asset.width, height: asset.height },
        anchors: asset.anchor_estimate || asset.conversion?.anchors || {},
        transform: { x: 0, y: 0, scale_x: 1, scale_y: 1 },
        layer_order: asset.layer_order ?? slot.order,
        anchors_validated: asset.anchors_validated === true,
        align_to_body: asset.category !== "body", compatible_with: [],
      }];
    });
    if (!selected.length) {
      setStatus("Aún no hay piezas seleccionadas. Importa PNG y guárdalos como «Pieza modular» en la biblioteca.");
      return;
    }
    setBusy(true);
    setStatus("Componiendo las piezas PNG seleccionadas…");
    try {
      const response = await fetch("/api/modular-compose", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieces: selected, canvas_size: [512, 768] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo componer el personaje.");
      if (typeof data.png_base64 !== "string" || !data.png_base64.startsWith("iVBOR")) throw new Error("El compositor no devolvió un PNG válido.");
      setPreview("data:image/png;base64," + data.png_base64);
      setStatus(`Personaje compuesto con ${selected.length} pieza(s) PNG real(es) · 512 × 768. Las anclas no verificadas pueden necesitar ajuste.`);
    } catch (error) {
      setPreview("");
      setStatus(error instanceof Error ? error.message : "Falló la composición.");
    } finally { setBusy(false); }
  };

  const download = () => {
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview;
    link.download = "botimagen-waifu-modular.png";
    link.click();
  };

  return <section className="modular-dressup" data-testid="modular-dressup" aria-labelledby="modular-dressup-title">
    <style>{`
      .modular-dressup{margin:22px 0;padding:clamp(14px,2.4vw,26px);border:1px solid #3b4260;border-radius:20px;background:#151a29;color:#f7f8ff}
      .modular-dressup h2{margin:0 0 6px;font-size:clamp(21px,2.5vw,28px)}.modular-dressup p{color:#bac4dc;line-height:1.5}
      .modular-dressup-layout{display:grid;grid-template-columns:minmax(180px,.8fr) minmax(0,1.2fr);gap:18px;margin-top:16px}
      .modular-dressup-stage{min-height:340px;display:grid;place-items:center;border-radius:14px;background:repeating-conic-gradient(#252b3d 0% 25%,#1d2333 0% 50%) 50%/24px 24px;padding:12px}
      .modular-dressup-stage img{display:block;max-height:520px;max-width:100%;object-fit:contain}
      .modular-dressup-slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .modular-dressup-slot{display:grid;gap:6px;padding:10px;border:1px solid #333d59;border-radius:12px;background:#111725}
      .modular-dressup-slot label{font-size:12px;font-weight:700;color:#d5ddf5}.modular-dressup-slot select{min-width:0;width:100%;padding:9px;border-radius:8px;background:#252d42;color:#fff;border:1px solid #4a5674}
      .modular-dressup-slot small{color:#aeb9d3}.modular-dressup-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
      .modular-dressup button{padding:10px 13px;border-radius:9px;border:1px solid #638ed1;background:#2d4e7e;color:white;font-weight:700;cursor:pointer}.modular-dressup button:disabled{opacity:.5;cursor:not-allowed}
      .modular-dressup [role=status]{margin-top:12px;color:#c2d9ff;font-size:13px}
      @media(max-width:680px){.modular-dressup-layout{grid-template-columns:1fr}.modular-dressup-slots{grid-template-columns:1fr}.modular-dressup-stage{min-height:250px}}
    `}</style>
    <h2 id="modular-dressup-title">🧩 Vestuario con tus PNG reales</h2>
    <p>Este segundo modo usa las piezas que importaste y clasificaste en la biblioteca modular. No inventa prendas: cada ranura indica cuántas piezas reales tienes. Las piezas de cuerpo completo o las regiones sin clasificar no aparecen como ropa intercambiable.</p>
    <div className="modular-dressup-layout">
      <div className="modular-dressup-stage">
        {preview ? <img src={preview} alt="Personaje compuesto a partir de piezas PNG seleccionadas" /> : <div style={{textAlign:"center",maxWidth:270}}><div style={{fontSize:48}}>🧵</div><b>Tu composición aparecerá aquí</b><p>Selecciona piezas compatibles y pulsa «Componer personaje».</p></div>}
      </div>
      <div>
        <div className="modular-dressup-slots">
          {slots.map(slot => {
            const available = availableBySlot[slot.category] || [];
            const selected = selection[slot.category] || "";
            return <div className="modular-dressup-slot" key={slot.category}>
              <label htmlFor={`modular-slot-${slot.category}`}>{slot.label}</label>
              <select id={`modular-slot-${slot.category}`} aria-label={slot.label} value={selected} disabled={!available.length || busy} onChange={event=>{setSelection(current=>({...current,[slot.category]:event.target.value}));setPreview("");}}>
                <option value="">{available.length ? "No usar esta pieza" : "AÚN NO"}</option>
                {available.map(asset=><option key={asset.id} value={asset.id}>{asset.label}</option>)}
              </select>
              <small>{available.length ? `${available.length} pieza(s) disponible(s)` : "Importa y confirma una pieza modular de esta categoría."}</small>
            </div>;
          })}
        </div>
        <div className="modular-dressup-actions">
          <button type="button" disabled={busy || !Object.values(selection).some(Boolean)} onClick={()=>void compose()}>{busy ? "Componiendo…" : "Componer personaje"}</button>
          <button type="button" disabled={!preview} onClick={download}>Descargar PNG</button>
          <button type="button" disabled={busy} onClick={()=>{setSelection({});setPreview("");setStatus("Selección reiniciada. Elige piezas PNG disponibles.");}}>Reiniciar piezas</button>
          <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12}}>Vista
            <select aria-label="Vista de piezas" value={view} disabled={busy} onChange={event=>{setView(event.target.value as "front"|"back");setSelection({});setPreview("");}}>
              <option value="front">Frontal</option><option value="back">Posterior</option>
            </select>
          </label>
        </div>
      </div>
    </div>
    <p role="status" aria-live="polite" data-testid="modular-dressup-status">{status}{assets.length===0 ? " · No hay piezas modulares confirmadas todavía." : ` · ${assets.length} pieza(s) modular(es) reconocida(s).`}</p>
  </section>;
}
