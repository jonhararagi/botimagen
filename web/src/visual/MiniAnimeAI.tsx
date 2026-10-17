import { useEffect, useState } from "react";

type Status = { available: boolean; models: string[]; available_ram_gb: number | null; message: string; detail?: string; max_seconds: number; max_steps: number };
type Result = { mime_type: string; png_base64: string; seed: number; steps: number; width: number; height: number; elapsed_seconds: number; prompt: string; negative_prompt: string; notice: string };

const defaults = { character_name: "Astra", archetype: "heroína anime adulta, elegante y decidida", hair: "cabello largo coral con puntas doradas", eyes: "ojos ámbar grandes y expresivos", outfit: "chaqueta táctica futurista negra con detalles cian y falda plisada", palette: "coral, negro obsidiana, cian y oro", pose: "cuerpo completo, pose dinámica estable, vista frontal tres cuartos", background: "fondo sencillo claro para recortar el personaje", extra: "un solo personaje, manos visibles, botas completas, sin texto", seed: "314159", steps: "12", timeout_seconds: "300", ram_budget_gb: "6" };

export function MiniAnimeAI() {
  const [form, setForm] = useState(defaults);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("La mini IA utiliza un motor de difusión instalado en tu PC. No descarga modelos ni llama a servicios de pago.");
  const [result, setResult] = useState<Result | null>(null);

  const refreshStatus = async () => {
    try {
      const response = await fetch("/api/mini-ai/status");
      const data = await response.json();
      setStatus(data);
    } catch {
      setStatus({ available: false, models: [], available_ram_gb: null, max_seconds: 300, max_steps: 16, message: "No se pudo consultar la API local de BotImagen." });
    }
  };
  useEffect(() => { void refreshStatus(); }, []);

  const update = (key: keyof typeof defaults, value: string) => setForm(current => ({ ...current, [key]: value }));

  const generate = async () => {
    setBusy(true);
    setResult(null);
    setMessage("Preparando el diseño y esperando al motor local. La generación puede tardar varios minutos.");
    try {
      const response = await fetch("/api/mini-ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, seed: Number(form.seed), steps: Number(form.steps),
          timeout_seconds: Number(form.timeout_seconds), ram_budget_gb: Number(form.ram_budget_gb),
          width: 512, height: 768,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "La mini IA no pudo generar el personaje.");
      setResult(data);
      setMessage(`Personaje generado en ${data.elapsed_seconds} s. Semilla: ${data.seed}. Revisá el resultado antes de incorporarlo al diseño definitivo.`);
      await refreshStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falló la generación local.");
      await refreshStatus();
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result) return;
    const link = document.createElement("a");
    link.href = "data:image/png;base64," + result.png_base64;
    link.download = (form.character_name.trim() || "personaje-anime").replace(/[^\p{L}\p{N}_-]+/gu, "-") + ".png";
    link.click();
  };

  return <section id="mini-anime-ai" className="mini-anime-ai" aria-labelledby="mini-anime-ai-title">
    <style>{`
      .mini-anime-ai{margin:24px 0;padding:22px;border:1px solid #38344f;border-radius:18px;background:linear-gradient(145deg,#191624,#101018);color:#f7f4ff}
      .mini-anime-ai *{box-sizing:border-box}.mini-ai-head{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
      .mini-anime-ai h2{margin:0 0 7px;font-size:21px}.mini-anime-ai p{margin:0;color:#c0bbd2;line-height:1.5}
      .mini-ai-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:18px 0}
      .mini-ai-field{display:flex;flex-direction:column;gap:6px;color:#dcd6f0;font-size:12px}.mini-ai-field input,.mini-ai-field textarea,.mini-ai-field select{width:100%;border:1px solid #49445e;border-radius:9px;background:#0c0c13;color:#fff;padding:10px;font:inherit;font-size:13px}
      .mini-ai-field textarea{min-height:72px;resize:vertical}.mini-ai-button{border:1px solid #b58aff;border-radius:10px;padding:11px 15px;background:#9b5cff;color:#150c22;font-weight:700;cursor:pointer}.mini-ai-button:disabled{opacity:.55;cursor:wait}
      .mini-ai-status{margin:12px 0;padding:12px;border-radius:10px;background:#242033;color:#ddd4f8;font-size:13px}.mini-ai-status strong{color:#fff}.mini-ai-status p{font-size:12px;margin-top:5px}
      .mini-ai-output{margin-top:18px;display:grid;grid-template-columns:minmax(180px,360px) minmax(0,1fr);gap:18px;align-items:start}.mini-ai-output img{width:100%;max-height:560px;object-fit:contain;background-color:#252536;background-image:linear-gradient(45deg,#303044 25%,transparent 25%),linear-gradient(-45deg,#303044 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#303044 75%),linear-gradient(-45deg,transparent 75%,#303044 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0;border-radius:10px}
      .mini-ai-small{font-size:12px!important;margin-top:8px!important}.mini-ai-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.mini-ai-label{font-size:12px;color:#bfb6db}
      @media(max-width:620px){.mini-anime-ai{padding:14px}.mini-ai-output{grid-template-columns:1fr}.mini-ai-output img{max-height:440px}}
    `}</style>
    <div className="mini-ai-head">
      <div><h2 id="mini-anime-ai-title">Mini IA · Diseñador de personajes anime</h2>
        <p>Convierte una ficha de diseño controlada en una ilustración PNG real. Los rasgos se convierten en una receta fija y un prompt negativo para reducir cambios aleatorios.</p>
      </div>
      <button type="button" className="mini-ai-button" disabled={busy} onClick={() => void refreshStatus()}>Comprobar motor</button>
    </div>
    <div className="mini-ai-status" role="status" aria-live="polite">
      <strong>{status?.available ? "Motor local conectado" : "Motor local no detectado"}</strong>
      <p>{status?.message || "Comprobando..."}</p>
      {status?.models?.length ? <p>Modelo(s): {status.models.join(", ")}</p> : null}
      {status?.available_ram_gb != null ? <p>RAM libre detectada: {status.available_ram_gb} GB</p> : null}
      {status?.detail ? <p>{status.detail}</p> : null}
    </div>
    <div className="mini-ai-fields">
      <label className="mini-ai-field">Nombre del personaje<input value={form.character_name} maxLength={70} onChange={e => update("character_name", e.target.value)} /></label>
      <label className="mini-ai-field">Arquetipo / identidad<textarea value={form.archetype} maxLength={100} onChange={e => update("archetype", e.target.value)} /></label>
      <label className="mini-ai-field">Cabello<textarea value={form.hair} maxLength={100} onChange={e => update("hair", e.target.value)} /></label>
      <label className="mini-ai-field">Ojos<input value={form.eyes} maxLength={80} onChange={e => update("eyes", e.target.value)} /></label>
      <label className="mini-ai-field">Vestimenta<textarea value={form.outfit} maxLength={140} onChange={e => update("outfit", e.target.value)} /></label>
      <label className="mini-ai-field">Paleta de color<input value={form.palette} maxLength={100} onChange={e => update("palette", e.target.value)} /></label>
      <label className="mini-ai-field">Pose<textarea value={form.pose} maxLength={100} onChange={e => update("pose", e.target.value)} /></label>
      <label className="mini-ai-field">Fondo<input value={form.background} maxLength={80} onChange={e => update("background", e.target.value)} /></label>
      <label className="mini-ai-field">Detalles adicionales<textarea value={form.extra} maxLength={180} onChange={e => update("extra", e.target.value)} /></label>
      <label className="mini-ai-field">Semilla fija (repetibilidad)<input type="number" min="0" max="4294967295" value={form.seed} onChange={e => update("seed", e.target.value)} /></label>
      <label className="mini-ai-field">Pasos de difusión (máx. 16)<select value={form.steps} onChange={e => update("steps", e.target.value)}>{[4,6,8,10,12,14,16].map(n => <option key={n} value={n}>{n} pasos</option>)}</select></label>
      <label className="mini-ai-field">Tiempo máximo<select value={form.timeout_seconds} onChange={e => update("timeout_seconds", e.target.value)}>{[60,120,180,240,300].map(n => <option key={n} value={n}>{n/60} min{n===60?"uto":"utos"}</option>)}</select></label>
      <label className="mini-ai-field">Presupuesto preventivo de RAM<select value={form.ram_budget_gb} onChange={e => update("ram_budget_gb", e.target.value)}>{[4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} GB</option>)}</select></label>
    </div>
    <div className="mini-ai-controls">
      <button type="button" className="mini-ai-button" disabled={busy || !status?.available} onClick={() => void generate()}>{busy ? "Generando, no cierres el motor…" : "✦ Crear personaje PNG"}</button>
      <span className="mini-ai-label">Una imagen por vez · 512×768 · hasta 16 pasos · corte solicitado a los 5 minutos</span>
    </div>
    <p className="mini-ai-small">{message}</p>
    <p className="mini-ai-small">Importante: el límite de RAM es preventivo, no un bloqueo duro del sistema operativo. Para un tope real, el motor de difusión debe ejecutarse dentro de un proceso aislado con límites del sistema. La IA puede variar detalles aunque se conserve la semilla.</p>
    {result ? <div className="mini-ai-output">
      <img src={"data:image/png;base64," + result.png_base64} alt={"Personaje anime generado: " + form.character_name} />
      <div><h3>{form.character_name || "Personaje anime"}</h3><p>{result.width}×{result.height} px · {result.elapsed_seconds} segundos · semilla {result.seed}</p>
        <div className="mini-ai-controls" style={{ marginTop: 12 }}><button type="button" className="mini-ai-button" onClick={download}>Descargar PNG</button><button type="button" className="mini-ai-button" onClick={() => { setForm(current => ({ ...current, seed: String(Number(current.seed) + 1) })); setMessage("Semilla incrementada. El resto de la ficha se conserva."); }}>Variación controlada</button></div>
        <p className="mini-ai-small">{result.notice}</p>
      </div>
    </div> : null}
  </section>;
}
