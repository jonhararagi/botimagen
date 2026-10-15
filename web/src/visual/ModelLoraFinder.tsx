import { useMemo, useState } from "react";

type Target = "character" | "hair" | "eyes" | "clothing" | "pose" | "style";

const targets: Array<{ id: Target; label: string; terms: string }> = [
  { id: "character", label: "Personaje parecido", terms: "anime character full body reference sheet" },
  { id: "hair", label: "Cabello / peinado", terms: "anime hair hairstyle LoRA" },
  { id: "eyes", label: "Ojos / rostro", terms: "anime eyes face detail LoRA" },
  { id: "clothing", label: "Ropa / armadura", terms: "anime outfit clothing design LoRA" },
  { id: "pose", label: "Pose / cuerpo", terms: "anime full body pose reference" },
  { id: "style", label: "Estilo visual", terms: "anime illustration style LoRA" },
];

export function ModelLoraFinder() {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<Target>("character");
  const [kind, setKind] = useState<"all" | "lora" | "checkpoint">("all");
  const targetInfo = targets.find(item => item.id === target) ?? targets[0];
  const searchText = useMemo(() => [query.trim(), targetInfo.terms, kind === "all" ? "" : kind].filter(Boolean).join(" "), [query, targetInfo, kind]);
  const encoded = encodeURIComponent(searchText);
  const civitaiUrl = `https://civitai.com/search/models?query=${encoded}`;
  const pixaiUrl = `https://www.google.com/search?q=${encodeURIComponent("site:pixai.art/en/model " + searchText)}`;
  const hfUrl = `https://huggingface.co/models?search=${encodeURIComponent([query.trim(), targetInfo.terms, kind === "all" ? "" : kind].filter(Boolean).join(" "))}`;

  return <section className="model-lora-finder" aria-labelledby="model-lora-finder-title">
    <style>{`
      .model-lora-finder{margin:24px 0;padding:20px;border:1px solid #34344a;border-radius:16px;background:linear-gradient(145deg,#171725,#101018);color:#f5f3ff}
      .model-lora-finder *{box-sizing:border-box}.model-lora-finder h2{font-size:19px;margin:0 0 7px}.model-lora-finder p{color:#b8b6cb;line-height:1.5;margin:0 0 14px}
      .mlf-controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(160px,.55fr) minmax(130px,.45fr);gap:9px}
      .mlf-controls input,.mlf-controls select{width:100%;min-width:0;border:1px solid #45445b;border-radius:9px;padding:11px;background:#0c0c13;color:#fff;font:inherit}
      .mlf-links{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}.mlf-links a{display:inline-flex;padding:10px 12px;border:1px solid #595078;border-radius:9px;background:#28243b;color:#fff;text-decoration:none;font-size:13px}.mlf-links a:hover{border-color:#b58aff}
      .mlf-note{font-size:12px;margin:12px 0 0!important}.mlf-tip{margin-top:14px;padding:12px;border-radius:10px;background:#0c0c13;border:1px solid #34344a;font-size:12px;color:#c5c0d8;line-height:1.55}
      @media(max-width:650px){.mlf-controls{grid-template-columns:1fr}.model-lora-finder{padding:15px}}
    `}</style>
    <h2 id="model-lora-finder-title">Buscador de modelos y LoRA 🔎</h2>
    <p>Busca referencias que se acerquen al personaje que queremos crear. Se abre el catálogo externo con la búsqueda preparada; BotImagen no descarga ni instala pesos automáticamente.</p>
    <div className="mlf-controls">
      <input aria-label="Descripción del personaje o rasgo" placeholder="Ej.: chica anime, pelo blanco, botas cyberpunk…" value={query} onChange={event => setQuery(event.target.value)} />
      <select aria-label="Tipo de referencia" value={target} onChange={event => setTarget(event.target.value as Target)}>{targets.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
      <select aria-label="Tipo de modelo" value={kind} onChange={event => setKind(event.target.value as typeof kind)}><option value="all">Modelos y LoRA</option><option value="lora">Solo LoRA</option><option value="checkpoint">Checkpoint / modelo base</option></select>
    </div>
    <div className="mlf-links">
      <a href={civitaiUrl} target="_blank" rel="noreferrer">Buscar en Civitai ↗</a>
      <a href={pixaiUrl} target="_blank" rel="noreferrer">Buscar modelos en PixAI ↗</a>
      <a href={hfUrl} target="_blank" rel="noreferrer">Buscar en Hugging Face ↗</a>
    </div>
    <p className="mlf-note">La búsqueda es orientativa, no una validación de calidad o licencia. Antes de usar un modelo, revisa la licencia, los permisos comerciales, los requisitos del checkpoint y la compatibilidad con tu motor local.</p>
    <div className="mlf-tip"><strong>Cómo usar el hallazgo como referencia:</strong> descarga únicamente una imagen que tengas permiso de usar, impórtala en «Constructor de modelos por regiones» y selecciona la imagen base. El constructor separa regiones raster editables, pero no reconoce semánticamente por sí solo «cabeza», «ojos» o «ropa»: hay que revisar y etiquetar las capas antes de publicarlas.</div>
  </section>;
}
