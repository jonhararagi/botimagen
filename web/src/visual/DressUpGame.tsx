import { useEffect, useState } from "react";

type Look = {
  hair: "long" | "bob" | "twin" | "ponytail";
  hairColor: string;
  eyes: string;
  outfit: "uniform" | "hoodie" | "dress" | "cyber";
  outfitColor: string;
  accessory: "none" | "bow" | "star";
};
const initialLook: Look = {
  hair: "long", hairColor: "#273a83", eyes: "#43d9f2",
  outfit: "uniform", outfitColor: "#e64d91", accessory: "bow",
};
const looksKey = "botimagen-dressup-look-v1";
const hairColors = [
  ["Medianoche", "#273a83"], ["Rosa", "#f078bb"], ["Celeste", "#54cfe8"],
  ["Plata", "#c6d2e8"], ["Lila", "#9c75dc"], ["Castaño", "#8b573f"],
  ["Rojo", "#d94a56"], ["Menta", "#68c9a6"], ["Negro", "#252431"],
];
const outfitColors = [
  ["Fucsia", "#e64d91"], ["Azul", "#3f76df"], ["Violeta", "#8859d9"],
  ["Negro", "#343445"], ["Blanco", "#e8edf8"], ["Verde", "#3aaf91"],
  ["Rojo", "#d94955"], ["Dorado", "#d6a63f"],
];
const hairNames: Record<Look["hair"], string> = { long: "Largo", bob: "Bob", twin: "Dos coletas", ponytail: "Coleta" };
const outfitNames: Record<Look["outfit"], string> = { uniform: "Uniforme", hoodie: "Hoodie", dress: "Vestido", cyber: "Cyberpunk" };

function readLook(): Look {
  try {
    const value = localStorage.getItem(looksKey);
    if (value) {
      const parsed = JSON.parse(value) as Partial<Look>;
      return { ...initialLook, ...parsed };
    }
  } catch { /* Use safe defaults when storage is unavailable. */ }
  return initialLook;
}

export function DressUpGame() {
  const [look, setLook] = useState<Look>(initialLook);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setLook(readLook()); }, []);
  function change<K extends keyof Look>(key: K, value: Look[K]) {
    setLook(previous => ({ ...previous, [key]: value }));
    setSaved(false);
  }
  function save() {
    try {
      localStorage.setItem(looksKey, JSON.stringify(look));
      setSaved(true);
    } catch { setSaved(false); }
  }
  function randomize() {
    const pick = <T,>(values: readonly T[]) => values[Math.floor(Math.random() * values.length)];
    setLook({
      hair: pick(["long", "bob", "twin", "ponytail"] as const),
      hairColor: pick(hairColors.map(item => item[1])),
      eyes: pick(["#43d9f2", "#8be28c", "#d78cff", "#e8b34d", "#f38bac"]),
      outfit: pick(["uniform", "hoodie", "dress", "cyber"] as const),
      outfitColor: pick(outfitColors.map(item => item[1])),
      accessory: pick(["none", "bow", "star"] as const),
    });
    setSaved(false);
  }
  const hair = look.hairColor;
  const cloth = look.outfitColor;
  return <section className="dressup-game" data-testid="dressup-game" aria-labelledby="dressup-title">
    <style>{`
      .dressup-game{margin:22px 0;padding:clamp(14px,2.4vw,26px);border:1px solid #3b4260;border-radius:20px;background:linear-gradient(145deg,#1a2033,#11121d);color:#f7f8ff}
      .dressup-game *{box-sizing:border-box}.dressup-game h2{margin:0 0 5px;font-size:clamp(22px,2.6vw,30px)}.dressup-game p{margin:0;color:#b8c0d8;line-height:1.5}
      .dressup-layout{display:grid;grid-template-columns:minmax(220px,.9fr) minmax(0,1.1fr);gap:20px;margin-top:18px}
      .dressup-stage{display:flex;align-items:center;justify-content:center;min-height:390px;border-radius:16px;background:radial-gradient(ellipse at 50% 30%,#303957,#141723 72%);overflow:hidden}
      .dressup-stage svg{width:100%;max-width:340px;max-height:470px;filter:drop-shadow(0 12px 18px #08091080)}
      .dressup-controls{display:grid;gap:13px;align-content:start}.dressup-group{padding:12px;border:1px solid #333d59;border-radius:13px;background:#151a29}
      .dressup-group h3{font-size:13px;margin:0 0 10px;color:#cdd9ff}.dressup-options{display:flex;flex-wrap:wrap;gap:7px}
      .dressup-game button{border:1px solid #465271;background:#242c42;color:#f8f9ff;padding:9px 11px;border-radius:10px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
      .dressup-game button[aria-pressed=true]{border-color:#7cc8ff;background:#304d70;box-shadow:0 0 0 1px #7cc8ff55}
      .dressup-game button:focus-visible{outline:2px solid #a5dcff;outline-offset:2px}
      .dressup-swatches button{width:31px;height:31px;padding:0;border-radius:50%;font-size:0;border:2px solid #59617a}
      .dressup-swatches button[aria-pressed=true]{outline:2px solid #fff;outline-offset:2px}
      .dressup-actions{display:flex;gap:8px;flex-wrap:wrap}.dressup-actions .primary{background:#365e9f;border-color:#75a9f0}
      .dressup-message{font-size:12px;color:#bfe8cb!important;min-height:18px}
      @media(max-width:680px){.dressup-layout{grid-template-columns:1fr}.dressup-stage{min-height:320px}.dressup-stage svg{max-height:360px}}
    `}</style>
    <div><div style={{fontSize:11,letterSpacing:".12em",fontWeight:800,color:"#9ecbff",marginBottom:8}}>BOTIMAGEN · MINI JUEGO</div><h2 id="dressup-title">¡Viste a tu waifu!</h2><p>Cambia peinado, color de cabello, ojos y ropa en directo. No necesitas generar imágenes ni gastar créditos.</p></div>
    <div className="dressup-layout">
      <div className="dressup-stage" aria-label="Vista previa del personaje">
        <svg viewBox="0 0 300 430" role="img" aria-label={`Personaje con cabello ${hairNames[look.hair]} y ${outfitNames[look.outfit]}`}>
          <defs>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe1d5"/><stop offset="1" stopColor="#e9adad"/></linearGradient>
            <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop stopColor={cloth}/><stop offset="1" stopColor={cloth} stopOpacity=".72"/></linearGradient>
          </defs>
          <ellipse cx="150" cy="405" rx="67" ry="10" fill="#080b16" opacity=".65"/>
          <path d="M112 319 L103 390 Q101 401 115 402 L137 402 L150 337 L163 402 L188 402 Q200 400 197 388 L187 319Z" fill="#f0d9e6" stroke="#a5a9c8" strokeWidth="2"/>
          <path d="M117 240 Q91 250 88 293 L75 333 Q73 346 85 349 Q96 350 101 337 L124 292Z" fill="url(#skin)" stroke="#d3919b" strokeWidth="2"/>
          <path d="M183 240 Q209 250 212 293 L225 333 Q227 346 215 349 Q204 350 199 337 L176 292Z" fill="url(#skin)" stroke="#d3919b" strokeWidth="2"/>
          <path d={look.outfit==="dress"?"M112 232 Q150 216 188 232 L212 344 Q150 367 88 344Z":look.outfit==="hoodie"?"M113 231 Q150 218 187 231 L203 325 L97 325Z":"M114 231 L186 231 L205 326 L95 326Z"} fill="url(#cloth)" stroke={cloth} strokeWidth="3"/>
          {look.outfit==="uniform" && <><path d="M127 233 L150 269 L173 233 L164 318 L136 318Z" fill="#f5f5ff"/><path d="M137 264 L150 278 L163 264 L158 295 L142 295Z" fill="#ffd2e5"/><path d="M101 312 L199 312 L202 330 L98 330Z" fill="#f1eafa"/></>}
          {look.outfit==="hoodie" && <><path d="M126 231 Q150 270 174 231" fill="none" stroke="#e9d9ff" strokeWidth="5"/><path d="M137 285 L138 310 M163 285 L162 310" stroke="#f7d5eb" strokeWidth="3"/><path d="M115 310 Q150 319 185 310" fill="none" stroke="#f7d5eb" strokeWidth="2"/></>}
          {look.outfit==="dress" && <><path d="M110 285 Q150 310 190 285 L212 344 Q150 367 88 344Z" fill={cloth} stroke="#f9c7e3" strokeWidth="2"/><path d="M120 296 L180 296" stroke="#ffe7f4" strokeWidth="3"/></>}
          {look.outfit==="cyber" && <><path d="M116 250 L137 276 L122 315 M184 250 L163 276 L178 315" fill="none" stroke="#62f2f5" strokeWidth="4"/><path d="M103 300 L197 300" stroke="#62f2f5" strokeWidth="2"/><circle cx="150" cy="290" r="7" fill="#62f2f5"/></>}
          <path d="M134 201 L134 237 Q150 253 166 237 L166 201Z" fill="url(#skin)" stroke="#d3919b" strokeWidth="2"/>
          {look.hair==="long" && <path d="M91 111 Q84 55 150 50 Q220 51 211 132 L211 286 Q191 315 184 274 L179 154 L120 153 L115 279 Q105 314 88 279Z" fill={hair} stroke="#171c40" strokeWidth="3"/>}
          {look.hair==="bob" && <path d="M91 119 Q82 54 150 50 Q220 52 209 130 L204 215 Q183 237 175 190 L177 151 L123 151 L120 190 Q109 234 91 211Z" fill={hair} stroke="#171c40" strokeWidth="3"/>}
          {look.hair==="twin" && <><path d="M104 102 Q73 88 77 151 Q80 207 105 210 L116 145Z M196 102 Q227 88 223 151 Q220 207 195 210 L184 145Z" fill={hair} stroke="#171c40" strokeWidth="3"/><path d="M91 112 Q83 54 150 50 Q217 54 209 118 L194 149 L106 149Z" fill={hair} stroke="#171c40" strokeWidth="3"/><path d="M107 91 L117 142 M193 91 L183 142" stroke="#ffffff" strokeOpacity=".22" strokeWidth="5"/></>}
          {look.hair==="ponytail" && <><path d="M184 82 Q244 72 230 147 Q224 180 195 185 L182 143Z" fill={hair} stroke="#171c40" strokeWidth="3"/><path d="M91 119 Q82 54 150 50 Q220 52 209 130 L204 174 L180 151 L120 151 L98 174Z" fill={hair} stroke="#171c40" strokeWidth="3"/></>}
          <path d="M106 118 Q101 76 150 73 Q199 75 194 124 L187 174 Q180 210 150 216 Q120 210 113 174Z" fill="url(#skin)" stroke="#d3919b" strokeWidth="2"/>
          <path d="M107 135 Q95 119 107 111 M193 135 Q205 119 193 111" fill="none" stroke="#d3919b" strokeWidth="5" strokeLinecap="round"/>
          <path d="M118 135 Q131 126 140 136 Q131 148 119 140Z M160 136 Q170 126 182 135 Q180 148 161 140Z" fill="#fff"/>
          <ellipse cx="130" cy="137" rx="6" ry="8" fill={look.eyes}/><ellipse cx="171" cy="137" rx="6" ry="8" fill={look.eyes}/>
          <ellipse cx="131" cy="139" rx="2" ry="3" fill="#171b2a"/><ellipse cx="172" cy="139" rx="2" ry="3" fill="#171b2a"/>
          <circle cx="132" cy="134" r="2" fill="#fff"/><circle cx="173" cy="134" r="2" fill="#fff"/>
          <path d="M146 157 L150 161 L154 157" fill="none" stroke="#ce8e9a" strokeWidth="2" strokeLinecap="round"/>
          <path d="M140 177 Q150 186 160 177" fill="none" stroke="#ad536f" strokeWidth="3" strokeLinecap="round"/>
          <path d="M105 116 Q103 74 150 69 Q193 72 196 113 L184 101 L174 89 L161 107 L145 89 L128 111 L116 101Z" fill={hair} stroke="#171c40" strokeWidth="3" strokeLinejoin="round"/>
          {look.hair==="long" && <path d="M113 102 Q104 164 119 230 M184 103 Q196 168 182 226" fill="none" stroke="#ffffff" strokeOpacity=".2" strokeWidth="5"/>}
          {look.accessory==="bow" && <><path d="M183 91 Q166 72 166 91 Q166 103 183 98 Q200 103 200 91 Q200 72 183 91Z" fill="#ff86c7" stroke="#fff0fa" strokeWidth="2"/><circle cx="183" cy="94" r="4" fill="#fff0fa"/></>}
          {look.accessory==="star" && <path d="M185 79 L190 91 L203 92 L193 101 L196 114 L185 107 L174 114 L177 101 L167 92 L180 91Z" fill="#f6d56d" stroke="#fff0b4" strokeWidth="2"/>}
          <path d="M137 231 L150 250 L163 231" fill="none" stroke="#ffeaf5" strokeWidth="3"/>
        </svg>
      </div>
      <div className="dressup-controls">
        <div className="dressup-group"><h3>💇 Peinado</h3><div className="dressup-options">{(Object.keys(hairNames) as Look["hair"][]).map(key=><button key={key} type="button" aria-pressed={look.hair===key} onClick={()=>change("hair",key)}>{hairNames[key]}</button>)}</div><h3 style={{marginTop:13}}>Color de cabello</h3><div className="dressup-options dressup-swatches">{hairColors.map(([name,color])=><button key={color} type="button" title={name} aria-label={name} aria-pressed={look.hairColor===color} style={{background:color}} onClick={()=>change("hairColor",color)}>{name}</button>)}</div></div>
        <div className="dressup-group"><h3>👗 Ropa</h3><div className="dressup-options">{(Object.keys(outfitNames) as Look["outfit"][]).map(key=><button key={key} type="button" aria-pressed={look.outfit===key} onClick={()=>change("outfit",key)}>{outfitNames[key]}</button>)}</div><h3 style={{marginTop:13}}>Color de ropa</h3><div className="dressup-options dressup-swatches">{outfitColors.map(([name,color])=><button key={color} type="button" title={name} aria-label={name} aria-pressed={look.outfitColor===color} style={{background:color}} onClick={()=>change("outfitColor",color)}>{name}</button>)}</div></div>
        <div className="dressup-group"><h3>✨ Detalles</h3><div className="dressup-options">{[["#43d9f2","Celeste"],["#8be28c","Verde"],["#d78cff","Lila"],["#e8b34d","Ámbar"],["#f38bac","Rosa"]].map(([color,label])=><button key={color} type="button" aria-pressed={look.eyes===color} onClick={()=>change("eyes",color)}>{label}</button>)}</div><div className="dressup-options" style={{marginTop:8}}>{(["none","bow","star"] as const).map(key=><button key={key} type="button" aria-pressed={look.accessory===key} onClick={()=>change("accessory",key)}>{key==="none"?"Sin accesorio":key==="bow"?"Moño":"Estrella"}</button>)}</div></div>
        <div className="dressup-actions"><button type="button" className="primary" onClick={save}>Guardar look</button><button type="button" onClick={randomize}>Sorpréndeme 🎲</button><button type="button" onClick={()=>{setLook(initialLook);setSaved(false);}}>Reiniciar</button></div>
        <p className="dressup-message" role="status" aria-live="polite">{saved?"¡Look guardado en este navegador!": "Los cambios se ven al instante. Guarda tu look para conservarlo."}</p>
      </div>
    </div>
  </section>;
}
