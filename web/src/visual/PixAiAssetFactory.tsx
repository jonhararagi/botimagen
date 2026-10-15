import { useEffect, useMemo, useState } from "react";

type TraitOption = { id: string; label: string };
type Catalog = { categories?: Record<string, TraitOption[]> };
type AssetRecord = {
  id: string;
  field: string;
  fieldLabel: string;
  trait: string;
  traitLabel: string;
  filename: string;
  createdAt: string;
  prompt: string;
  blob: Blob;
};
type Slot = { field: string; label: string; group: string; description: string };
const DB_NAME = "botimagen-asset-factory";
const STORE = "assets";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const PIXAI_URL = "https://pixai.art/";

const slots: Slot[] = [
  { field: "hairstyle", label: "Peinado / cabello", group: "Cabello", description: "Una sola pieza de cabello anime, vista frontal, centrada, bordes limpios." },
  { field: "eyes", label: "Color de ojos", group: "Ojos", description: "Primer plano de ojos anime simétricos, iris bien definidos, sin rostro completo." },
  { field: "eye_shape", label: "Forma de ojos", group: "Ojos", description: "Par de ojos anime simétricos, forma legible y aislada." },
  { field: "expression", label: "Expresión", group: "Rostro", description: "Expresión facial anime clara, frontal, sin cambiar el peinado ni los accesorios." },
  { field: "outfit", label: "Vestimenta", group: "Ropa", description: "Prenda anime completa, frontal, aislada, sin cuerpo ni maniquí." },
  { field: "outer_layer", label: "Capa exterior", group: "Ropa", description: "Chaqueta o capa anime aislada, frontal, sin persona." },
  { field: "footwear", label: "Calzado", group: "Ropa", description: "Par de calzados anime, vista frontal y tres cuartos, aislados." },
  { field: "accessory", label: "Accesorio", group: "Accesorios", description: "Un accesorio anime aislado, centrado y completamente visible." },
  { field: "body_build", label: "Constitución", group: "Cuerpo", description: "Referencia de silueta corporal adulta anime, neutral, vestida y frontal." },
  { field: "hair", label: "Color de cabello", group: "Cabello", description: "Muestra de cabello anime con el color elegido, mechones definidos." },
];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir la biblioteca local."));
  });
}
async function readAssets(): Promise<AssetRecord[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => { db.close(); resolve((request.result as AssetRecord[]).sort((a,b) => b.createdAt.localeCompare(a.createdAt))); };
    request.onerror = () => { db.close(); reject(request.error); };
  });
}
async function writeAsset(asset: AssetRecord): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(asset);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error("No se pudo guardar el asset.")); };
  });
}
async function removeAsset(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
function idFor(field: string, trait: string) { return field + "::" + trait; }

export function PixAiAssetFactory() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [field, setField] = useState(slots[0].field);
  const [trait, setTrait] = useState("");
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [message, setMessage] = useState("Elegí un rasgo: si no hay una pieza compatible, figurará como «Aún no».");
  const [busy, setBusy] = useState(false);
  const slot = slots.find(item => item.field === field) ?? slots[0];
  const options = catalog?.categories?.[field] ?? [];
  const selectedTrait = options.find(item => item.id === trait);
  const prompt = useMemo(() => {
    const label = selectedTrait?.label ?? (trait || "rasgo por definir");
    return [
      "original anime game asset, clean professional anime gacha illustration, isolated reusable character component",
      slot.description,
      "Trait: " + label + ". Keep the requested trait unmistakable and consistent.",
      "single asset only, centered, full object visible, orthographic front view, crisp contours, clean lineart, polished cel shading, high detail",
      "transparent background if supported; otherwise perfectly flat pure magenta (#ff00ff) background for later background removal",
      "no text, no watermark, no logo, no collage, no contact sheet, no extra objects, no cropped edges, no dramatic perspective, no cast shadow",
      "original design, do not imitate a named copyrighted character or artist",
    ].join(", ");
  }, [selectedTrait?.label, trait, slot]);
  const found = assets.filter(item => item.field === field && item.trait === (selectedTrait?.id ?? trait));
  const assetUrls = useMemo(() => new Map(assets.map(asset => [asset.id, URL.createObjectURL(asset.blob)])), [assets]);
  useEffect(() => () => { for (const url of assetUrls.values()) URL.revokeObjectURL(url); }, [assetUrls]);
  const status = found.length ? "HAY · " + found.length + (found.length === 1 ? " pieza" : " piezas") : "AÚN NO";

  async function refresh() {
    try { setAssets(await readAssets()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo leer la biblioteca local."); }
  }
  useEffect(() => {
    let active = true;
    void fetch("/api/catalog").then(response => {
      if (!response.ok) throw new Error("El catálogo del motor local no respondió.");
      return response.json() as Promise<Catalog>;
    }).then(value => { if (active) setCatalog(value); }).catch(() => {
      if (active) setMessage("Catálogo Python desconectado: inicia BotImagen para cargar las opciones reales.");
    });
    void refresh();
    return () => { active = false; };
  }, []);

  async function preparePixAI() {
    const text = prompt;
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Prompt copiado. PixAI se abrirá; elegí Gen Pibara V1 y la cola económica/de espera, 1 imagen y el tamaño más pequeño útil. No uses generación rápida premium.");
    } catch {
      setMessage("PixAI se abrirá. Copiá el prompt visible de abajo y pegalo en la generación.");
    }
    window.open(PIXAI_URL, "_blank", "noopener,noreferrer");
  }
  async function importPng(file?: File) {
    if (!file) return;
    if (file.size <= 8 || file.size > MAX_FILE_BYTES) {
      setMessage("El PNG debe pesar entre 9 bytes y 20 MB.");
      return;
    }
    const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if ([137,80,78,71,13,10,26,10].some((value, index) => signature[index] !== value)) {
      setMessage("Ese archivo no tiene una firma PNG válida. Descargá el PNG desde PixAI, no una captura o un JPG renombrado.");
      return;
    }
    if (!selectedTrait) {
      setMessage("Elegí primero un rasgo concreto del catálogo.");
      return;
    }
    setBusy(true);
    try {
      const imageUrl = URL.createObjectURL(file);
      const image = new Image();
      image.src = imageUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("El archivo no se pudo decodificar como imagen."));
      });
      URL.revokeObjectURL(imageUrl);
      if (image.naturalWidth < 64 || image.naturalHeight < 64 || image.naturalWidth > 8192 || image.naturalHeight > 8192) {
        throw new Error("Dimensiones no admitidas: usa una imagen de entre 64 y 8192 píxeles por lado.");
      }
      const record: AssetRecord = {
        id: idFor(field, selectedTrait.id) + "::" + crypto.randomUUID(),
        field, fieldLabel: slot.label, trait: selectedTrait.id, traitLabel: selectedTrait.label,
        filename: file.name.slice(0, 180), createdAt: new Date().toISOString(), prompt, blob: file,
      };
      await writeAsset(record);
      await refresh();
      setMessage("Pieza importada y guardada en la biblioteca local del navegador. No se subió a GitHub ni se compartió.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo importar el PNG.");
    } finally { setBusy(false); }
  }
  async function exportAsset(asset: AssetRecord) {
    const url = URL.createObjectURL(asset.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = asset.filename.toLowerCase().endsWith(".png") ? asset.filename : asset.filename + ".png";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function deleteAsset(asset: AssetRecord) {
    await removeAsset(asset.id);
    await refresh();
    setMessage("Pieza eliminada de la biblioteca local.");
  }

  return <section className="pixai-factory" data-testid="pixai-asset-factory" aria-labelledby="pixai-factory-title">
    <style>{`
      .pixai-factory{margin:0 0 24px;padding:clamp(16px,2.5vw,28px);border:1px solid #3b4260;border-radius:20px;background:linear-gradient(145deg,#171c2b,#101018);color:#f5f6ff}
      .pixai-factory *{box-sizing:border-box}.pixai-factory h2{font-size:clamp(21px,2.5vw,29px);margin:0 0 7px}.pixai-factory p{color:#b8c0d8;line-height:1.5;margin:0}
      .pixai-factory-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}.pixai-factory-kicker{font-size:11px;letter-spacing:.12em;color:#9ecbff;font-weight:800;margin-bottom:8px}
      .pixai-factory-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,.9fr);gap:18px;margin-top:18px}
      .pixai-factory label{display:block;color:#dbe3ff;font-size:12px;font-weight:750;margin:12px 0 6px}.pixai-factory select,.pixai-factory textarea,.pixai-factory input[type=file]{width:100%;padding:10px;border:1px solid #434b69;border-radius:10px;background:#0e1220;color:#f5f6ff;font:inherit}
      .pixai-factory textarea{min-height:130px;resize:vertical;font-size:12px;line-height:1.5}.pixai-factory-actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}
      .pixai-factory button{border:1px solid #505c7d;border-radius:10px;padding:10px 13px;background:#222b43;color:#fff;font-weight:750;cursor:pointer}.pixai-factory button.primary{background:#345d9f;border-color:#6396e5}.pixai-factory button:disabled{opacity:.5;cursor:not-allowed}
      .pixai-factory-status{display:inline-block;margin-top:10px;padding:7px 10px;border-radius:9px;background:#202a40;color:#b8d6ff;font-weight:800;font-size:12px}
      .pixai-factory-assets{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:10px;margin-top:14px}.pixai-factory-asset{border:1px solid #303a54;border-radius:12px;overflow:hidden;background:#0e1220;min-width:0}.pixai-factory-asset img{display:block;width:100%;height:155px;object-fit:contain;background:repeating-conic-gradient(#24283a 0% 25%,#171b2a 0% 50%) 50%/16px 16px}.pixai-factory-asset div{padding:9px}.pixai-factory-asset strong{display:block;overflow-wrap:anywhere;font-size:12px}.pixai-factory-asset small{display:block;color:#9faac5;margin:5px 0}.pixai-factory-note{margin-top:10px!important;font-size:12px!important}
      @media(max-width:760px){.pixai-factory-grid{grid-template-columns:1fr}.pixai-factory-assets{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `}</style>
    <div className="pixai-factory-head">
      <div><div className="pixai-factory-kicker">PIXAI · FÁBRICA DE PIEZAS</div><h2 id="pixai-factory-title">Biblioteca que crece con cada personaje</h2><p>Reutilizá lo que ya existe y detectá los huecos. Las piezas nuevas se guardan localmente en este navegador.</p></div>
      <div className="pixai-factory-status" data-testid="pixai-slot-status">{status}</div>
    </div>
    <div className="pixai-factory-grid">
      <div>
        <label htmlFor="pixai-slot-field">¿Qué pieza querés completar?</label>
        <select id="pixai-slot-field" value={field} onChange={event => { setField(event.target.value); setTrait(""); }}>
          {slots.map(item => <option key={item.field} value={item.field}>{item.group} · {item.label}</option>)}
        </select>
        <label htmlFor="pixai-slot-trait">Variante del catálogo</label>
        <select id="pixai-slot-trait" value={selectedTrait?.id ?? trait} onChange={event => setTrait(event.target.value)}>
          <option value="">Elegí una variante…</option>
          {options.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
        <div className="pixai-factory-actions">
          <button className="primary" type="button" onClick={() => void preparePixAI()} disabled={!selectedTrait}>Abrir PixAI · modo económico</button>
          <button type="button" onClick={() => document.getElementById("pixai-png-import")?.click()} disabled={!selectedTrait || busy}>Importar PNG descargado</button>
        </div>
        <input id="pixai-png-import" aria-label="Importar PNG descargado de PixAI" type="file" accept="image/png,.png" hidden onChange={event => { void importPng(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        <label htmlFor="pixai-prompt-preview">Prompt listo para copiar</label>
        <textarea id="pixai-prompt-preview" readOnly value={prompt} />
        <p className="pixai-factory-note">Ahorro: una imagen por pedido, Gen Pibara V1, resolución baja/mediana y cola normal/de espera. No se activa Premium ni se hacen lotes automáticos. PixAI conserva sus propios controles de precio y modelo.</p>
        <p className="pixai-factory-note">Por seguridad, el navegador no permite que BotImagen lea Descargas a escondidas. Descargá el PNG en Descargas y elegí «Importar PNG descargado» para incorporarlo.</p>
      </div>
      <div>
        <h3 style={{margin:"0 0 7px"}}>Piezas que ya tenés para este rasgo</h3>
        <p>{found.length ? "Estas piezas están guardadas en la biblioteca local y pueden volver a descargarse." : "Aún no hay una pieza etiquetada para esta variante. Al importarla, el estado cambiará a HAY."}</p>
        <div className="pixai-factory-assets">
          {found.map(asset => <article className="pixai-factory-asset" key={asset.id}>
            <img src={assetUrls.get(asset.id)} alt={asset.traitLabel} />
            <div><strong>{asset.traitLabel}</strong><small>{asset.filename}</small><button type="button" onClick={() => void exportAsset(asset)}>Descargar</button> <button type="button" onClick={() => void deleteAsset(asset)}>Quitar</button></div>
          </article>)}
        </div>
        <p className="pixai-factory-note">Biblioteca local: {assets.length} piezas importadas. No se publican automáticamente en GitHub. Primero quedan en tu navegador; así evitamos subir imágenes privadas, duplicadas o con licencia dudosa.</p>
      </div>
    </div>
    <p role="status" aria-live="polite" style={{marginTop:14,color:"#d7e3ff"}}>{message}</p>
  </section>;
}
