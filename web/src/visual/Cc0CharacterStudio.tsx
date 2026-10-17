import { useEffect, useMemo, useState } from "react";

type Expression = { id: string; label: string; file: string };
type CharacterAsset = { id: string; label: string; base: string; expressions: Expression[] };
type SavedStudio = { characterId: string; expressionId: string; name: string; background: "transparent" | "white" | "black" };

const ROOT = "/cc0-character-library/characters";
const characters: CharacterAsset[] = [
  { id: "character-1", label: "Personaje 1", base: "base.png", expressions: [
    {id:"angry",label:"Enojada",file:"pl1 angry.png"},{id:"blink",label:"Parpadeo",file:"pl1 blink.png"},
    {id:"concept",label:"Concepto",file:"pl1 concept.png"},{id:"happy",label:"Feliz",file:"pl1 happy.png"},
    {id:"hate",label:"Desagrado",file:"pl1 hate.png"},{id:"plot",label:"Pensativa",file:"pl1 plot.png"},
    {id:"sad",label:"Triste",file:"pl1 sad.png"},{id:"sadhappy",label:"Triste y feliz",file:"pl1 sadhappy.png"},
    {id:"serious",label:"Seria",file:"pl1 serious.png"},{id:"surprise",label:"Sorprendida",file:"pl1 surprise.png"},
  ]},
  { id: "character-2", label: "Personaje 2", base: "base.png", expressions: [
    {id:"angry",label:"Enojada",file:"pl2 angry.png"},{id:"blink",label:"Parpadeo",file:"pl2 blink.png"},
    {id:"concept",label:"Concepto",file:"pl2 concept.png"},{id:"happy",label:"Feliz",file:"pl2 happy.png"},
    {id:"hate",label:"Desagrado",file:"pl2 hate.png"},{id:"plot",label:"Pensativa",file:"pl2 plot.png"},
    {id:"sad",label:"Triste",file:"pl2 sad.png"},{id:"shy",label:"Tímida",file:"pl2 shy.png"},
    {id:"surprise",label:"Sorprendida",file:"pl2 surprise.png"},{id:"worry",label:"Preocupada",file:"pl2 worry.png"},
  ]},
  { id: "character-3", label: "Personaje 3", base: "base.png", expressions: [
    {id:"avoid",label:"Evita la mirada",file:"pl3 avoid.png"},{id:"blink",label:"Parpadeo",file:"pl3 blink.png"},
    {id:"concept",label:"Concepto",file:"pl3 concept.png"},{id:"confusion",label:"Confundida",file:"pl3 confusion.png"},
    {id:"doubt",label:"Duda",file:"pl3 doubt.png"},{id:"happy",label:"Feliz",file:"pl3 happy.png"},
    {id:"plot",label:"Pensativa",file:"pl3 plot.png"},{id:"sad",label:"Triste",file:"pl3 sad.png"},
    {id:"shy",label:"Tímida",file:"pl3 shy.png"},{id:"surprise",label:"Sorprendida",file:"pl3 surprise.png"},
  ]},
  { id: "character-4", label: "Personaje 4", base: "base.png", expressions: [
    {id:"angry",label:"Enojada",file:"pl4 angry.png"},{id:"blink",label:"Parpadeo",file:"pl4 blink.png"},
    {id:"concept",label:"Concepto",file:"pl4 concept.png"},{id:"happy",label:"Feliz",file:"pl4 happy.png"},
    {id:"normal",label:"Neutral",file:"pl4 normal.png"},{id:"plot",label:"Pensativa",file:"pl4 plot.png"},
    {id:"sad",label:"Triste",file:"pl4 sad.png"},{id:"scoff",label:"Desafiante",file:"pl4 scoff.png"},
    {id:"shy",label:"Tímida",file:"pl4 shy.png"},{id:"surprise",label:"Sorprendida",file:"pl4 surprise.png"},
    {id:"worry",label:"Preocupada",file:"pl4 worry.png"},
  ]},
  { id: "character-5", label: "Personaje 5", base: "base.png", expressions: [
    {id:"blink",label:"Parpadeo",file:"pl5 blink.png"},{id:"doubt",label:"Duda",file:"pl5 doubt.png"},
    {id:"hate",label:"Desagrado",file:"pl5 hate.png"},{id:"plot",label:"Pensativa",file:"pl5 plot.png"},
    {id:"sad",label:"Triste",file:"pl5 sad.png"},{id:"scoff",label:"Desafiante",file:"pl5 scoff.png"},
    {id:"shy",label:"Tímida",file:"pl5 shy.png"},{id:"surprise",label:"Sorprendida",file:"pl5 surprise.png"},
  ]},
];
const STORAGE_KEY = "botimagen.cc0-character-studio.v1";
const assetUrl = (characterId: string, file: string) => `${ROOT}/${characterId}/expressions/${encodeURIComponent(file).replace(/%2F/gi, "/")}`;

function readSaved(): SavedStudio {
  const fallback: SavedStudio = { characterId: "character-1", expressionId: "happy", name: "Mi personaje CC0", background: "transparent" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const value = JSON.parse(raw) as Partial<SavedStudio>;
    return {
      characterId: characters.some(item => item.id === value.characterId) ? value.characterId! : fallback.characterId,
      expressionId: typeof value.expressionId === "string" ? value.expressionId : fallback.expressionId,
      name: typeof value.name === "string" ? value.name.slice(0, 80) : fallback.name,
      background: value.background === "white" || value.background === "black" ? value.background : "transparent",
    };
  } catch { return fallback; }
}

export function Cc0CharacterStudio() {
  const [saved, setSaved] = useState<SavedStudio>(() => readSaved());
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [message, setMessage] = useState("Cinco personajes de referencia CC0 listos para explorar.");
  const character = characters.find(item => item.id === saved.characterId) ?? characters[0];
  const expression = character.expressions.find(item => item.id === saved.expressionId) ?? character.expressions[0];
  const previewUrl = useMemo(() => assetUrl(character.id, expression.file), [character.id, expression.file]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); }
    catch { setMessage("El navegador no permitió guardar las preferencias. Podés descargar el PNG igualmente."); }
  }, [saved]);

  function chooseCharacter(id: string) {
    const next = characters.find(item => item.id === id) ?? characters[0];
    setSaved(current => ({...current, characterId: next.id, expressionId: next.expressions[0].id}));
    setMessage(next.label + " seleccionado. Elegí una expresión para cambiar su sprite.");
  }

  async function exportPng() {
    try {
      const image = new Image();
      image.src = previewUrl;
      await new Promise<void>((resolve, reject) => {
        if (image.complete && image.naturalWidth > 0) { resolve(); return; }
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("No se pudo cargar el sprite CC0."));
      });
      const canvas = document.createElement("canvas");
      canvas.width = 512; canvas.height = 768;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas no disponible en este navegador.");
      if (saved.background !== "transparent") {
        context.fillStyle = saved.background;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      const scale = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      context.drawImage(image, (canvas.width-width)/2, (canvas.height-height)/2, width, height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Falló la exportación PNG.")), "image/png"));
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = (saved.name.trim() || character.label).replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60) + ".png";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("PNG exportado en 512 × 768, con el sprite ajustado y fondo " + (saved.background === "transparent" ? "transparente" : saved.background) + ".");
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo exportar el PNG."); }
  }

  return <section className="cc0-studio" data-testid="cc0-character-studio" aria-labelledby="cc0-studio-title">
    <style>{`
      .cc0-studio{margin:0 0 24px;padding:clamp(16px,2.5vw,28px);border:1px solid #3d3556;border-radius:20px;background:linear-gradient(145deg,#171522,#101018);color:#f6f2ff}
      .cc0-studio *{box-sizing:border-box}.cc0-studio h2{font-size:clamp(20px,2.4vw,28px);margin:0 0 6px}.cc0-studio p{color:#bbb4ce;line-height:1.5;margin:0}
      .cc0-studio-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}.cc0-studio-kicker{font-size:11px;letter-spacing:.12em;color:#bba5ff;font-weight:800;margin-bottom:8px}
      .cc0-studio-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(230px,.85fr);gap:18px;margin-top:20px}
      .cc0-studio-stage{height:clamp(390px,54vw,600px);min-height:360px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:1px solid #49445d;border-radius:14px;padding:12px;background-color:#232131;background-image:linear-gradient(45deg,#2c2a3c 25%,transparent 25%),linear-gradient(-45deg,#2c2a3c 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2c2a3c 75%),linear-gradient(-45deg,transparent 75%,#2c2a3c 75%);background-size:20px 20px;background-position:0 0,0 10px,10px -10px,-10px 0}
      .cc0-studio-stage.is-white{background:#fff}.cc0-studio-stage.is-black{background:#08080c}.cc0-studio-stage img{display:block;width:100%;height:100%;object-fit:contain;image-rendering:auto}
      .cc0-studio-picker{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}.cc0-studio-character{min-width:0;padding:8px 4px;border:1px solid #464057;border-radius:10px;background:#211d2e;color:#eee8ff;cursor:pointer;font:inherit}
      .cc0-studio-character[aria-pressed="true"]{border-color:#c0a6ff;box-shadow:0 0 0 1px #c0a6ff;background:#34294a}.cc0-studio-character img{display:block;width:100%;height:82px;object-fit:contain}.cc0-studio-character span{display:block;font-size:11px;margin-top:5px}
      .cc0-studio-controls{display:grid;align-content:start;gap:13px}.cc0-studio-controls label{display:grid;gap:6px;color:#dcd5eb;font-size:13px}.cc0-studio-controls input,.cc0-studio-controls select{width:100%;min-width:0;padding:11px;border-radius:9px;border:1px solid #4a435e;background:#0e0d15;color:#fff;font:inherit}
      .cc0-studio-actions{display:flex;gap:8px;flex-wrap:wrap}.cc0-studio button{font:inherit}.cc0-studio-action{padding:10px 13px;border:1px solid #55496d;border-radius:10px;background:#282238;color:#fff;cursor:pointer}.cc0-studio-action.primary{background:#bba1ff;color:#181222;border-color:#d1c2ff;font-weight:800}
      .cc0-studio-options{border:1px solid #40384f;border-radius:10px;padding:10px}.cc0-studio-options summary{cursor:pointer;color:#e3d9fa;font-weight:650}.cc0-studio-status{margin-top:14px!important;font-size:12px}.cc0-studio-license{font-size:11px;margin-top:10px!important}
      @media(max-width:760px){.cc0-studio-grid{grid-template-columns:1fr}.cc0-studio-stage{height:500px}.cc0-studio-picker{gap:5px}.cc0-studio-character img{height:64px}.cc0-studio-actions>*{flex:1}}
    `}</style>
    <div className="cc0-studio-head"><div><div className="cc0-studio-kicker">BIBLIOTECA CC0 · PERSONAJES REALES</div><h2 id="cc0-studio-title">Creador de personajes anime</h2><p>Elegí uno de los cinco sprites originales, cambiá su expresión y exportá un PNG uniforme. No hace falta instalar una IA ni descargar modelos.</p></div>
      <span className="cc0-studio-kicker">512 × 768 · EXPORTACIÓN LOCAL</span></div>
    <div className="cc0-studio-grid">
      <div>
        <div className={"cc0-studio-stage"+(saved.background==="white"?" is-white":saved.background==="black"?" is-black":"")}><img data-testid="cc0-character-preview" src={previewUrl} alt={character.label+" · "+expression.label} /></div>
        <div className="cc0-studio-picker" aria-label="Elegir personaje">{characters.map(item=><button className="cc0-studio-character" type="button" key={item.id} data-character-id={item.id} aria-pressed={saved.characterId===item.id} aria-label={"Elegir "+item.label} onClick={()=>chooseCharacter(item.id)}><img src={`${ROOT}/${item.id}/base.png`} alt="" loading="lazy"/><span>{item.label}</span></button>)}</div>
      </div>
      <div className="cc0-studio-controls">
        <label>Nombre de tu personaje<input aria-label="Nombre de tu personaje" maxLength={80} value={saved.name} onChange={event=>setSaved(current=>({...current,name:event.target.value}))}/></label>
        <label>Expresión<select aria-label="Expresión del personaje" value={expression.id} onChange={event=>setSaved(current=>({...current,expressionId:event.target.value}))}>{character.expressions.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <div><p style={{fontSize:12,marginBottom:8}}>Personaje seleccionado: <strong>{character.label}</strong> · {character.expressions.length} expresiones disponibles</p><p style={{fontSize:12}}>Las expresiones son sprites originales separados, no recortes inventados. El encuadre se normaliza sin deformar la imagen.</p></div>
        <details className="cc0-studio-options" open={optionsOpen} onToggle={event=>setOptionsOpen((event.currentTarget as HTMLDetailsElement).open)}><summary>Opciones de vista y exportación</summary>
          <label style={{marginTop:10}}>Fondo de previsualización y PNG<select aria-label="Fondo de exportación" value={saved.background} onChange={event=>setSaved(current=>({...current,background:event.target.value as SavedStudio["background"]}))}><option value="transparent">Transparente</option><option value="white">Blanco</option><option value="black">Negro</option></select></label>
          <p style={{fontSize:11,marginTop:8}}>Las preferencias se guardan en este navegador. El PNG se exporta a 512 × 768, con proporción conservada.</p>
        </details>
        <div className="cc0-studio-actions"><button className="cc0-studio-action primary" type="button" onClick={()=>void exportPng()}>Exportar PNG</button><button className="cc0-studio-action" type="button" onClick={()=>{setSaved({characterId:"character-1",expressionId:"happy",name:"Mi personaje CC0",background:"transparent"});setMessage("Se restauró el personaje inicial.");}}>Restablecer</button></div>
      </div>
    </div>
    <p className="cc0-studio-status" role="status" aria-live="polite">{message}</p>
    <p className="cc0-studio-license">Recursos de FALLiNG_AiR · OpenGameArt · CC0 1.0 indicado en la ficha original. Esta biblioteca usa sprites completos y expresiones; las 43 capas PSD siguen disponibles en el clasificador manual para asignación semántica.</p>
  </section>;
}
