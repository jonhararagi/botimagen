import type { CSSProperties } from "react";

export type NanoWearState = "everyday" | "nanoweave" | "transformation";
export type MaterialFinish = "textile" | "nanoweave" | "synthetic";
export type EmblemShape = "bunny" | "star" | "fox" | "skull" | "geo";
export type EmblemPosition = "chest" | "sleeve" | "hood";
export type VisualRecipe = {
  schema_version: 1;
  family: "cyberstreet";
  anime_influence: number;
  toon_influence: number;
  streetwear_cyberpunk: number;
  detail_level: number;
  nanowear_state: NanoWearState;
  material_finish: MaterialFinish;
  emblem_shape: EmblemShape;
  emblem_color: string;
  emblem_contrast: "auto" | "manual";
  emblem_position: EmblemPosition;
  view: "front" | "back";
};

export const DEFAULT_VISUAL_RECIPE: VisualRecipe = {
  schema_version: 1, family: "cyberstreet", anime_influence: 68, toon_influence: 56,
  streetwear_cyberpunk: 30, detail_level: 58, nanowear_state: "everyday",
  material_finish: "textile", emblem_shape: "bunny", emblem_color: "#f3c96b",
  emblem_contrast: "auto", emblem_position: "chest", view: "front",
};

const validHex = /^#[0-9a-f]{6}$/i;
export function normalizeVisualRecipe(value: unknown): VisualRecipe {
  if (!value || typeof value !== "object") return { ...DEFAULT_VISUAL_RECIPE };
  const input = value as Partial<VisualRecipe>;
  const bounded = (n: unknown, fallback: number) => typeof n === "number" && Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n))) : fallback;
  const oneOf = <T extends string>(candidate: unknown, values: readonly T[], fallback: T): T =>
    typeof candidate === "string" && values.includes(candidate as T) ? candidate as T : fallback;
  return {
    schema_version: 1, family: "cyberstreet",
    anime_influence: bounded(input.anime_influence, DEFAULT_VISUAL_RECIPE.anime_influence),
    toon_influence: bounded(input.toon_influence, DEFAULT_VISUAL_RECIPE.toon_influence),
    streetwear_cyberpunk: bounded(input.streetwear_cyberpunk, DEFAULT_VISUAL_RECIPE.streetwear_cyberpunk),
    detail_level: bounded(input.detail_level, DEFAULT_VISUAL_RECIPE.detail_level),
    nanowear_state: oneOf(input.nanowear_state, ["everyday", "nanoweave", "transformation"] as const, "everyday"),
    material_finish: oneOf(input.material_finish, ["textile", "nanoweave", "synthetic"] as const, "textile"),
    emblem_shape: oneOf(input.emblem_shape, ["bunny", "star", "fox", "skull", "geo"] as const, "bunny"),
    emblem_color: typeof input.emblem_color === "string" && validHex.test(input.emblem_color) ? input.emblem_color : DEFAULT_VISUAL_RECIPE.emblem_color,
    emblem_contrast: oneOf(input.emblem_contrast, ["auto", "manual"] as const, "auto"),
    emblem_position: oneOf(input.emblem_position, ["chest", "sleeve", "hood"] as const, "chest"),
    view: oneOf(input.view, ["front", "back"] as const, "front"),
  };
}

function hexRgb(hex: string) {
  const safe = validHex.test(hex) ? hex : "#f3c96b";
  return [1, 3, 5].map(i => Number.parseInt(safe.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
}
function luminance(hex: string) { const [r, g, b] = hexRgb(hex); return .2126 * r + .7152 * g + .0722 * b; }
function contrastRatio(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
function bestContrast(background: string, preferred: string) {
  return contrastRatio(background, preferred) >= 3 ? preferred : luminance(background) > .42 ? "#171522" : "#fff4e8";
}
function optionColor(id: string, fallback: string) {
  const map: Record<string, string> = {
    rojo_coral: "#ef646b", naranja_tangerina: "#ef8b43", rosa_chicle: "#ec78bd", violeta_profundo: "#8e7ae7",
    negro_obsidiana: "#38384b", azul_nocturno: "#4761b1", plateado_perla: "#bbc6d8", castano_miel: "#a97851",
    rubio_platino: "#e8dfba", turquesa: "#35c5bd", verde_esmeralda: "#2da987", rubio_dorado: "#d4a440",
  };
  return map[id] ?? fallback;
}

export function buildVisualPrompt(value: unknown): string {
  const r = normalizeVisualRecipe(value);
  const state = { everyday: "ordinary wearable street clothing, subtle seams", nanoweave: "technical programmable nanofabric, restrained luminous seam channels", transformation: "transformed synthetic textile sheen and controlled cybernetic panel accents" }[r.nanowear_state];
  const finish = { textile: "matte everyday textile", nanoweave: "fine technical nanoweave surface", synthetic: "glossy synthetic finish" }[r.material_finish];
  return `Visual recipe CyberStreet v${r.schema_version}: ${r.anime_influence}% anime influence, ${r.toon_influence}% toon influence, ${r.streetwear_cyberpunk}% streetwear-to-cyberpunk detailing, ${r.detail_level}% decorative detail. NanoWear state: ${state}; material finish: ${finish}. Personal original Chromapatch emblem: ${r.emblem_shape}, ${r.emblem_color}, position ${r.emblem_position}, contrast mode ${r.emblem_contrast}. Keep the selected outfit recognizable as wearable clothing; technology accents must remain proportional to the cyberpunk balance and never replace every garment with armor.`;
}

type RendererProps = { values: Record<string, string>; recipe: VisualRecipe; onRecipeChange: (recipe: VisualRecipe) => void };
export function VisualCharacterRenderer({ values, recipe, onRecipeChange }: RendererProps) {
  const r = normalizeVisualRecipe(recipe);
  const hair = optionColor(values.hair ?? "", "#ef646b");
  const skinMap: Record<string, string> = { porcelana_neutra: "#f2d2c6", morena_calida: "#b97858", piel_oliva: "#c89b73", piel_oscura: "#754b40" };
  const skin = skinMap[values.skin_tone] ?? "#edc3b8";
  const accent = optionColor(values.palette_accent ?? values.hair_secondary_color ?? "", "#5ce4dc");
  const street = r.streetwear_cyberpunk / 100;
  const toon = r.toon_influence / 100;
  const anime = r.anime_influence / 100;
  const detail = r.detail_level / 100;
  const rear = r.view === "back";
  const fabric = r.nanowear_state === "transformation" || r.material_finish === "synthetic" ? "#202b43" : r.nanowear_state === "nanoweave" || r.material_finish === "nanoweave" ? "#273044" : "#343246";
  const patchBg = fabric;
  const patchColor = r.emblem_contrast === "manual" ? r.emblem_color : bestContrast(patchBg, r.emblem_color);
  const stroke = toon > .65 ? "#090d1a" : "#8a91ad";
  const line = 1.1 + toon * 2.1;
  const patchX = r.emblem_position === "sleeve" ? 113 : r.emblem_position === "hood" ? 168 : 170;
  const patchY = r.emblem_position === "hood" ? 263 : r.emblem_position === "sleeve" ? 292 : rear ? 292 : 291;
  const patchTransform = `translate(${patchX} ${patchY}) scale(${r.emblem_position === "sleeve" ? .72 : .85})`;
  const svgStyle = { "--hair": hair, "--skin": skin, "--fabric": fabric, "--accent": accent, "--cyber": street, "--detail": detail } as CSSProperties;
  return <svg className={`silhouette visual-character-svg ${rear ? "is-back" : "is-front"}`} viewBox="0 0 340 490" role="img" aria-label={`Vista ${rear ? "trasera" : "frontal"} del personaje CyberStreet, receta vectorial`} style={svgStyle} data-nanowear={r.nanowear_state} data-finish={r.material_finish}>
    <defs>
      <linearGradient id="cw-hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={hair}/><stop offset="76%" stopColor={hair}/><stop offset="100%" stopColor={accent}/></linearGradient>
      <linearGradient id="cw-fabric" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={fabric}/><stop offset="100%" stopColor="#111625"/></linearGradient>
      <linearGradient id="cw-skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={skin}/><stop offset="100%" stopColor="#b77c8e"/></linearGradient>
      <linearGradient id="cw-gloss" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity=".02"/><stop offset="48%" stopColor="#ffffff" stopOpacity={r.nanowear_state === "transformation" || r.material_finish === "synthetic" ? .58 : .12}/><stop offset="100%" stopColor="#8cecff" stopOpacity=".04"/></linearGradient>
    </defs>
    <ellipse cx="170" cy="463" rx="82" ry="10" fill="#070a13" opacity=".5"/>
    {!rear && <path d="M110 90 Q72 137 99 235 L83 338 Q81 377 109 400 L137 374 L138 273 L163 245 L188 246 L211 281 L211 376 L242 401 Q268 371 255 331 L238 238 Q265 130 224 82 Z" fill="url(#cw-hair)"/>}
    {rear && <path d="M116 91 Q82 135 101 236 L91 346 Q91 384 122 403 L145 369 L144 265 L196 265 L195 369 L222 403 Q253 380 250 342 L237 235 Q259 132 222 83 Z" fill="url(#cw-hair)"/>}
    <path d="M137 190 L135 233 L116 260 L149 282 L170 248 L193 281 L225 259 L207 229 L204 190 Z" fill="url(#cw-skin)"/>
    <path d="M113 243 Q88 249 89 309 L98 372 L125 371 L133 301 L151 278 Z M226 243 Q252 250 251 310 L244 372 L218 371 L213 301 L194 278 Z" fill="url(#cw-fabric)" stroke={stroke} strokeWidth={line}/>
    <path d="M125 263 Q170 238 216 263 L209 340 L196 397 L145 397 L131 338 Z" fill="url(#cw-fabric)" stroke={stroke} strokeWidth={line}/>
    {r.nanowear_state !== "everyday" && <path d="M139 270 Q170 282 201 270 L193 345 L170 363 L147 345 Z" fill={accent} opacity={.08 + street * .26}/>}
    <path d="M125 263 Q170 238 216 263 L209 340 L196 397 L145 397 L131 338 Z" fill="url(#cw-gloss)" opacity={r.material_finish === "textile" && r.nanowear_state === "everyday" ? .12 : .88}/>
    <path d="M145 349 L170 369 L195 349 L204 414 L187 440 L153 440 L136 414 Z" fill="#20263b" stroke={stroke} strokeWidth={line}/>
    <path d="M151 410 L149 456 L170 456 L177 410 Z M185 410 L190 456 L211 456 L202 410 Z" fill="#111727"/>
    <path d="M148 452 L150 471 L181 471 L180 455 Z M190 452 L194 471 L225 471 L215 455 Z" fill={accent}/>
    <ellipse cx="170" cy="143" rx={52 - anime * 3} ry={63 - anime * 4} fill="url(#cw-skin)" stroke="#f5d7ce" strokeWidth={1 + toon * 1.8}/>
    {!rear && <>
      <path d="M118 152 Q107 91 150 63 Q211 35 233 96 L221 149 L206 102 Q173 117 130 110 Z" fill="url(#cw-hair)" stroke={stroke} strokeWidth={line}/>
      <path d="M128 120 L101 83 L129 94 M219 118 L250 81 L229 97" fill="none" stroke={accent} strokeWidth={4 + street * 5} strokeLinecap="round"/>
      <path d="M143 148 Q156 140 165 148 M185 148 Q196 140 205 148" fill="none" stroke="#664253" strokeWidth={1.5 + toon * 2.5} strokeLinecap="round"/>
      <ellipse cx="155" cy="151" rx={5 + anime * 3} ry={6 + anime * 3} fill={optionColor(values.eyes ?? "", "#d7a64f")}/>
      <ellipse cx="195" cy="151" rx={5 + anime * 3} ry={6 + anime * 3} fill={optionColor(values.eyes ?? "", "#d7a64f")}/>
      <path d={values.expression?.includes("sonrisa") ? "M160 176 Q170 188 181 176" : "M160 179 L180 179"} fill="none" stroke="#9c526a" strokeWidth={2 + toon} strokeLinecap="round"/>
      {values.ear_style?.includes("gato") && <path d="M126 121 L111 82 L143 103 M214 121 L230 82 L199 103" fill={skin} stroke={stroke} strokeWidth={line}/>}
      {values.horn_style && !values.horn_style.includes("sin_") && <path d="M137 98 L126 64 L151 86 M202 86 L226 62 L216 102" fill={accent} stroke={stroke} strokeWidth={line}/>}
      {values.facial_detail && !values.facial_detail.includes("sin_") && <g fill={accent}><circle cx="145" cy="166" r="2"/><circle cx="149" cy="169" r="1.4"/></g>}
    </>}
    {rear && <path d="M118 152 Q107 91 150 63 Q211 35 233 96 L221 149 L206 102 Q173 117 130 110 Z" fill="url(#cw-hair)" stroke={stroke} strokeWidth={line}/>}
    {Array.from({ length: Math.round(2 + detail * 7) }, (_, i) => <path key={i} d={`M${139 + i * 4} 275 l${(i % 2 ? 4 : -3) + street * 2} ${30 + detail * 16}`} stroke={accent} strokeWidth={.45 + detail * .8} opacity={r.nanowear_state === "everyday" ? .12 + street * .2 : .25 + street * .65} fill="none"/>)}
    {r.nanowear_state !== "everyday" && <g fill="none" stroke={accent} strokeWidth={.7 + street} opacity={.35 + street * .55}><path d="M131 300 L145 315 L140 333 M209 300 L195 315 L200 333"/><path d="M141 353 L151 360 L148 377 M199 353 L189 360 L192 377"/></g>}
    <g transform={patchTransform} aria-label="Chromapatch">
      <circle r="13" fill={patchBg} stroke={accent} strokeWidth={1 + detail}/>
      <g transform="scale(.52)" fill={patchColor} stroke={patchColor} strokeWidth="2" strokeLinejoin="round">
        {r.emblem_shape === "bunny" && <><path d="M-8 -4 Q-18 -28 -11 -34 Q-1 -32 0 -8 Q5 -32 14 -34 Q21 -26 9 -3 Q19 5 11 17 Q0 27 -12 17 Q-20 7 -8 -4Z"/><circle cx="4" cy="5" r="2" fill={patchBg} stroke="none"/></>}
        {r.emblem_shape === "star" && <path d="M0 -25 L6 -8 L24 -8 L10 3 L15 22 L0 11 L-15 22 L-10 3 L-24 -8 L-6 -8Z"/>}
        {r.emblem_shape === "fox" && <path d="M-24 -15 L-8 -6 L0 -12 L8 -6 L24 -15 L18 13 L0 25 L-18 13Z"/>}
        {r.emblem_shape === "skull" && <><path d="M-19 -8 Q-19 -24 0 -24 Q19 -24 19 -8 L14 8 L6 8 L6 20 L-6 20 L-6 8 L-14 8Z"/><circle cx="-7" cy="-5" r="4" fill={patchBg} stroke="none"/><circle cx="7" cy="-5" r="4" fill={patchBg} stroke="none"/></>}
        {r.emblem_shape === "geo" && <path d="M0 -24 L22 -12 L22 12 L0 24 L-22 12 L-22 -12Z"/>}
      </g>
    </g>
  </svg>;
}

export function VisualStyleLab({ recipe, onChange }: { recipe: VisualRecipe; onChange: (recipe: VisualRecipe) => void }) {
  const r = normalizeVisualRecipe(recipe);
  const patchBackground = "#273044";
  const contrast = contrastRatio(patchBackground, r.emblem_contrast === "manual" ? r.emblem_color : bestContrast(patchBackground, r.emblem_color));
  const update = <K extends keyof VisualRecipe>(key: K, value: VisualRecipe[K]) => onChange(normalizeVisualRecipe({ ...r, [key]: value }));
  const range = (key: "anime_influence" | "toon_influence" | "streetwear_cyberpunk" | "detail_level", label: string) =>
    <label className="style-range" key={key}><span>{label}<b>{r[key]}%</b></span><input type="range" min="0" max="100" step="1" value={r[key]} onChange={e => update(key, Number(e.target.value))}/></label>;
  return <section className="style-lab" aria-label="Style Lab CyberStreet">
    <div className="style-lab-head"><div><span className="kicker">STYLE LAB / CYBERSTREET</span><p>La receta cambia la vista vectorial sin IA.</p></div><div className="view-toggle" role="group" aria-label="Vista del personaje"><button type="button" className={r.view === "front" ? "selected" : ""} aria-pressed={r.view === "front"} onClick={() => update("view", "front")}>Frontal</button><button type="button" className={r.view === "back" ? "selected" : ""} aria-pressed={r.view === "back"} onClick={() => update("view", "back")}>Trasera</button></div></div>
    <div className="style-ranges">{range("anime_influence", "Influencia Anime")}{range("toon_influence", "Influencia Toon")}{range("streetwear_cyberpunk", "Streetwear / Cyberpunk")}{range("detail_level", "Nivel de detalle")}</div>
    <div className="style-fields">
      <label>Estado NanoWear<select value={r.nanowear_state} onChange={e => update("nanowear_state", e.target.value as NanoWearState)}><option value="everyday">Everyday · cotidiano</option><option value="nanoweave">Nanoweave · técnico</option><option value="transformation">Transformation · transformado</option></select></label>
      <label>Acabado del material<select value={r.material_finish} onChange={e => update("material_finish", e.target.value as MaterialFinish)}><option value="textile">Textil cotidiano</option><option value="nanoweave">Nanotela técnica</option><option value="synthetic">Sintético brillante</option></select></label>
      <label>Forma Chromapatch<select value={r.emblem_shape} onChange={e => update("emblem_shape", e.target.value as EmblemShape)}><option value="bunny">Conejito</option><option value="star">Estrella</option><option value="fox">Zorro</option><option value="skull">Calavera</option><option value="geo">Geométrico</option></select></label>
      <label>Ubicación Chromapatch<select value={r.emblem_position} onChange={e => update("emblem_position", e.target.value as EmblemPosition)}><option value="chest">Pecho</option><option value="sleeve">Manga</option><option value="hood">Capucha / cuello</option></select></label>
      <label>Contraste del emblema<select value={r.emblem_contrast} onChange={e => update("emblem_contrast", e.target.value as "auto" | "manual")}><option value="auto">Automático por luminancia</option><option value="manual">Manual</option></select></label>
      <label>Color del emblema<input type="color" value={r.emblem_color} onChange={e => update("emblem_color", e.target.value)}/></label>
    </div>
    <p className={r.emblem_contrast === "manual" && contrast < 3 ? "contrast-warning" : "contrast-note"} role="status">{r.emblem_contrast === "manual" && contrast < 3 ? "Advertencia: el color manual tiene poco contraste con la nanotela. Cambia el color o usa contraste automático." : r.emblem_contrast === "auto" ? "Contraste automático calculado con luminancia relativa." : "Contraste manual suficiente para esta zona de muestra."}</p>
  </section>;
}
