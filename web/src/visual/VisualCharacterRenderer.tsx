import { useId } from "react";
import type { CSSProperties } from "react";

export type NanoWearState = "everyday" | "nanoweave" | "transformation";
export type MaterialFinish = "textile" | "nanoweave" | "synthetic";
export type EmblemShape = "bunny" | "star" | "fox" | "skull" | "geo";
export type EmblemPosition = "chest" | "sleeve" | "hood";
export type FabricPattern = "plain" | "circuit" | "geometric" | "gradient";
export type VisualRecipe = {
  schema_version: 3;
  family: "cyberstreet";
  anime_influence: number;
  toon_influence: number;
  streetwear_cyberpunk: number;
  detail_level: number;
  garment_base_color: string;
  garment_panel_color: string;
  garment_accent_color: string;
  fabric_pattern: FabricPattern;
  torso_length: number;
  sleeve_length: number;
  waist_fit: number;
  nanowear_state: NanoWearState;
  material_finish: MaterialFinish;
  emblem_shape: EmblemShape;
  emblem_color: string;
  emblem_contrast: "auto" | "manual";
  emblem_position: EmblemPosition;
  view: "front" | "back";
};

export const DEFAULT_VISUAL_RECIPE: VisualRecipe = {
  schema_version: 3, family: "cyberstreet", anime_influence: 68, toon_influence: 56,
  streetwear_cyberpunk: 30, detail_level: 58, garment_base_color: "#343246", garment_panel_color: "#48516a",
  garment_accent_color: "#5ce4dc", fabric_pattern: "circuit", torso_length: 80, sleeve_length: 60, waist_fit: 50, nanowear_state: "everyday",
  material_finish: "textile", emblem_shape: "bunny", emblem_color: "#f3c96b",
  emblem_contrast: "auto", emblem_position: "chest", view: "front",
};

const validHex = /^#[0-9a-f]{6}$/i;
export function normalizeVisualRecipe(value: unknown): VisualRecipe {
  if (!value || typeof value !== "object") return { ...DEFAULT_VISUAL_RECIPE };
  const input = value as Partial<VisualRecipe> & { schema_version?: number };
  const bounded = (n: unknown, fallback: number) => typeof n === "number" && Number.isFinite(n) ? Math.round(Math.max(0, Math.min(100, n))) : fallback;
  const oneOf = <T extends string>(candidate: unknown, values: readonly T[], fallback: T): T =>
    typeof candidate === "string" && values.includes(candidate as T) ? candidate as T : fallback;
  return {
    schema_version: 3, family: "cyberstreet",
    anime_influence: bounded(input.anime_influence, DEFAULT_VISUAL_RECIPE.anime_influence),
    toon_influence: bounded(input.toon_influence, DEFAULT_VISUAL_RECIPE.toon_influence),
    streetwear_cyberpunk: bounded(input.streetwear_cyberpunk, DEFAULT_VISUAL_RECIPE.streetwear_cyberpunk),
    detail_level: bounded(input.detail_level, DEFAULT_VISUAL_RECIPE.detail_level),
    garment_base_color: typeof input.garment_base_color === "string" && validHex.test(input.garment_base_color) ? input.garment_base_color : DEFAULT_VISUAL_RECIPE.garment_base_color,
    garment_panel_color: typeof input.garment_panel_color === "string" && validHex.test(input.garment_panel_color) ? input.garment_panel_color : DEFAULT_VISUAL_RECIPE.garment_panel_color,
    garment_accent_color: typeof input.garment_accent_color === "string" && validHex.test(input.garment_accent_color) ? input.garment_accent_color : DEFAULT_VISUAL_RECIPE.garment_accent_color,
    fabric_pattern: oneOf(input.fabric_pattern, ["plain", "circuit", "geometric", "gradient"] as const, DEFAULT_VISUAL_RECIPE.fabric_pattern),
    torso_length: bounded(input.torso_length, DEFAULT_VISUAL_RECIPE.torso_length),
    sleeve_length: bounded(input.sleeve_length, DEFAULT_VISUAL_RECIPE.sleeve_length),
    waist_fit: bounded(input.waist_fit, DEFAULT_VISUAL_RECIPE.waist_fit),
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
function hsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let hue = 0;
  if (delta) hue = max === r ? 60 * (((g - b) / delta) % 6) : max === g ? 60 * ((b - r) / delta + 2) : 60 * ((r - g) / delta + 4);
  if (hue < 0) hue += 360;
  const light = (max + min) / 2;
  return { h: hue, s: delta === 0 ? 0 : delta / (1 - Math.abs(2 * light - 1)) };
}
function fromHsl(h: number, s: number, l: number) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const rgb = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x] : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
  return "#" + rgb.map(v => Math.round((v + m) * 255).toString(16).padStart(2,"0")).join("");
}
export function complementaryEmblemColor(base: string) {
  const safe = validHex.test(base) ? base : DEFAULT_VISUAL_RECIPE.garment_base_color;
  const source = hsl(safe), hue = (source.h + 180) % 360;
  const candidates = [fromHsl(hue, Math.max(.55, source.s), .38), fromHsl(hue, Math.max(.55, source.s), .68), "#ffffff", "#171522"];
  return candidates.find(color => contrastRatio(safe, color) >= 3) ?? candidates[2];
}
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

type RendererProps = { values: Record<string, string>; recipe: VisualRecipe };

export type GarmentCapabilities = { torsoLength: boolean; sleeveLength: boolean; waistFit: boolean };
const SLEEVED_OUTFITS = new Set(["tactical_baseball", "combat_jacket", "techwear_sport", "street_bomber", "support_coat", "baseball_tech_suit"]);
const SLEEVED_LAYERS = new Set(["short_bomber", "hooded_jacket", "long_coat", "chaqueta_corta_asimetrica", "mangas_desmontables"]);
const TORSO_FIT_OUTFITS = new Set(["tactical_baseball", "combat_jacket", "techwear_sport", "street_bomber", "support_coat", "baseball_tech_suit", "elegant_command"]);
const TORSO_FIT_LAYERS = new Set(["short_bomber", "hooded_jacket", "long_coat", "chaqueta_corta_asimetrica"]);
export function getGarmentCapabilities(values: Record<string, string>): GarmentCapabilities {
  const sleeves = SLEEVED_OUTFITS.has(values.outfit ?? "") || SLEEVED_LAYERS.has(values.outer_layer ?? "");
  const torso = TORSO_FIT_OUTFITS.has(values.outfit ?? "") || TORSO_FIT_LAYERS.has(values.outer_layer ?? "");
  return { torsoLength: torso, sleeveLength: sleeves, waistFit: torso };
}
export function VisualCharacterRenderer({ values, recipe }: RendererProps) {
  const r = normalizeVisualRecipe(recipe);
  const hair = optionColor(values.hair ?? "", "#ef646b");
  const skinMap: Record<string, string> = { porcelana_neutra: "#f2d2c6", marfil_calido: "#f1d4b0", beige_claro: "#e5c3a0", durazno: "#e9b6a1", beige_dorado: "#d7ad82", oliva_suave: "#c89b73", canela: "#ad7656", bronce_calido: "#986344", marron_profundo: "#754b40", fantasia_azul_suave: "#a4c9df" };
  const skin = skinMap[values.skin_tone] ?? "#edc3b8";
  const hairAccent = optionColor(values.palette_accent ?? values.hair_secondary_color ?? "", "#5ce4dc");
  const eyeMap: Record<string, string> = { ambar: "#d7a64f", rojo_rubi: "#c64256", violeta: "#9b72e8", azul_hielo: "#a6e8fa", verde_esmeralda: "#2da987", gris_grafito: "#778296", azul_profundo: "#3655b9", celeste: "#68c6ec", verde_lima: "#9acb45", rosa_opalina: "#e88bc2" };
  const eyeColor = eyeMap[values.eyes] ?? "#d7a64f";
  const street = r.streetwear_cyberpunk / 100;
  const toon = r.toon_influence / 100;
  const anime = r.anime_influence / 100;
  const detail = r.detail_level / 100;
  const rear = r.view === "back";
  const uid = useId().replace(/:/g, "");
  const fabric = r.garment_base_color;
  const panel = r.garment_panel_color;
  const accent = r.garment_accent_color;
  const patchBg = fabric;
  const patchColor = r.emblem_contrast === "manual" ? r.emblem_color : complementaryEmblemColor(fabric);
  const stroke = toon > .65 ? "#090d1a" : "#8a91ad";
  const line = 1.1 + toon * 2.1;
  const hemY = 340 + r.torso_length * .7;
  const waistHalf = 25 + r.waist_fit * .18;
  const torsoPath = `M125 263 Q170 238 216 263 L${170 + waistHalf} ${hemY - 57} L${170 + waistHalf * .72} ${hemY} L${170 - waistHalf * .72} ${hemY} L${170 - waistHalf} ${hemY - 57} Z`;
  // The skin arm remains below fabric; 0..100 maps to a visible 300..362 hem.
  const sleeveEnd = 300 + r.sleeve_length * .62;
  const bomberHem = 285 + r.torso_length * .55;
  const coatHem = 335 + r.torso_length * .75;
  const fitTransform = `translate(170 0) scale(${.9 + r.waist_fit / 500} 1) translate(-170 0)`;
  const capabilities = getGarmentCapabilities(values);
  const hasHood = values.outer_layer === "hooded_jacket";
  const effectiveEmblemPosition = (r.emblem_position === "hood" && !hasHood)
    || (r.emblem_position === "sleeve" && !capabilities.sleeveLength) ? "chest" : r.emblem_position;
  const emblemHem = values.outfit === "street_bomber" || values.outer_layer === "short_bomber"
    ? bomberHem : values.outer_layer === "long_coat" ? coatHem : hemY;
  const patchX = effectiveEmblemPosition === "sleeve" ? (rear ? 224 : 116) : 170;
  const patchY = effectiveEmblemPosition === "hood" ? 246
    : effectiveEmblemPosition === "sleeve" ? Math.max(285, Math.min(sleeveEnd - 12, 335))
    : Math.min(rear ? 305 : 285, emblemHem - 17);
  const patchTransform = `translate(${patchX} ${patchY}) scale(${effectiveEmblemPosition === "sleeve" ? .72 : .85})`;
  const svgStyle = { "--hair": hair, "--skin": skin, "--fabric": fabric, "--accent": accent, "--cyber": street, "--detail": detail } as CSSProperties;
  return <svg className={`silhouette visual-character-svg ${rear ? "is-back" : "is-front"}`} viewBox="0 0 340 490" role="img" aria-label={`Vista ${rear ? "trasera" : "frontal"} del personaje CyberStreet, receta vectorial`} style={svgStyle} data-nanowear={r.nanowear_state} data-finish={r.material_finish} data-fabric-pattern={r.fabric_pattern} data-fabric-base={r.garment_base_color} data-fabric-panel={r.garment_panel_color} data-fabric-accent={r.garment_accent_color} data-hair-color={hair} data-skin-color={skin} data-outfit={values.outfit ?? ""} data-outer-layer={values.outer_layer ?? ""} data-footwear={values.footwear ?? ""} data-torso-length={r.torso_length} data-sleeve-length={r.sleeve_length} data-waist-fit={r.waist_fit}>
    <defs>
      <linearGradient id={`cw-pattern-gradient-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={fabric}/><stop offset="100%" stopColor={panel}/></linearGradient>
      <pattern id={`cw-pattern-${uid}`} patternUnits="userSpaceOnUse" width={r.fabric_pattern === "geometric" ? 12 : 18} height={r.fabric_pattern === "geometric" ? 12 : 18}><rect width="100%" height="100%" fill={r.fabric_pattern === "gradient" ? `url(#cw-pattern-gradient-${uid})` : "transparent"}/>{r.fabric_pattern === "circuit" && <path d="M0 4 H7 V10 H15 M7 4 V0 M15 10 V16" fill="none" stroke={accent} strokeWidth="1.1" opacity=".8" />}{r.fabric_pattern === "geometric" && <path d="M6 0 L12 6 L6 12 L0 6 Z" fill="none" stroke={panel} strokeWidth="1.3"/>}</pattern>
      <linearGradient id={`cw-hair-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={hair}/><stop offset="76%" stopColor={hair}/><stop offset="100%" stopColor={hairAccent}/></linearGradient>
      <linearGradient id={`cw-fabric-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={fabric}/><stop offset="100%" stopColor={r.nanowear_state === "transformation" || r.material_finish === "synthetic" ? "#ffffff" : panel}/></linearGradient>
      <linearGradient id={`cw-skin-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={skin}/><stop offset="100%" stopColor="#b77c8e"/></linearGradient>
      <linearGradient id={`cw-gloss-${uid}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity=".02"/><stop offset="48%" stopColor="#ffffff" stopOpacity={r.nanowear_state === "transformation" || r.material_finish === "synthetic" ? .58 : .12}/><stop offset="100%" stopColor="#8cecff" stopOpacity=".04"/></linearGradient>
    </defs>
    <ellipse cx="170" cy="463" rx="82" ry="10" fill="#070a13" opacity=".5"/>
    {!rear && <path d="M110 90 Q72 137 99 235 L83 338 Q81 377 109 400 L137 374 L138 273 L163 245 L188 246 L211 281 L211 376 L242 401 Q268 371 255 331 L238 238 Q265 130 224 82 Z" fill={`url(#cw-hair-${uid})`}/>}
    {rear && <path d="M116 91 Q82 135 101 236 L110 263 L138 250 L144 218 L196 218 L202 250 L230 263 L237 235 Q259 132 222 83 Z" fill={`url(#cw-hair-${uid})`}/>}
    <path d="M137 190 L135 233 L116 260 L149 282 L170 248 L193 281 L225 259 L207 229 L204 190 Z" fill={`url(#cw-skin-${uid})`}/>
    <path className="character-arm-skin" data-qa-surface="arm-skin" d="M113 243 Q88 249 89 309 L98 372 L125 371 L133 301 L151 278 Z M226 243 Q252 249 251 310 L244 372 L218 371 L213 301 L194 278 Z" fill={`url(#cw-skin-${uid})`} stroke={stroke} strokeWidth={line}/>
    {capabilities.sleeveLength && <g className="garment-sleeves" data-qa-surface="base-sleeves" data-sleeve-end={sleeveEnd}>
      <path d={`M113 243 Q88 249 89 309 L${Math.max(92, 89 + (sleeveEnd - 309) * .12)} ${sleeveEnd} L125 ${sleeveEnd - 2} L133 301 L151 278 Z M226 243 Q252 249 251 309 L${Math.min(248, 251 - (sleeveEnd - 309) * .12)} ${sleeveEnd} L218 ${sleeveEnd - 2} L213 301 L194 278 Z`} fill={`url(#cw-fabric-${uid})`} stroke={stroke} strokeWidth={line}/>
      <path d={`M${Math.max(92, 89 + (sleeveEnd - 309) * .12)} ${sleeveEnd} L125 ${sleeveEnd - 2} M${Math.min(248, 251 - (sleeveEnd - 309) * .12)} ${sleeveEnd} L218 ${sleeveEnd - 2}`} stroke={accent} strokeWidth={r.nanowear_state === "everyday" ? .6 : 1.4} fill="none" opacity={r.nanowear_state === "everyday" ? .35 : .9}/>
    </g>}
    <path className="garment-torso-main" data-qa-surface="base-torso" d={torsoPath} transform={fitTransform} fill={`url(#cw-fabric-${uid})`} stroke={stroke} strokeWidth={line}/>
    <path className="garment-torso-panels" d={torsoPath} transform={fitTransform} fill={panel} opacity={r.nanowear_state === "everyday" ? .16 : .28}/>
    <path d={torsoPath} transform={fitTransform} fill={`url(#cw-pattern-${uid})`} opacity={r.fabric_pattern === "plain" ? 0 : r.nanowear_state === "everyday" ? .35 : .82}/>
    {r.nanowear_state !== "everyday" && <path d={`M${170 - waistHalf * .65} 270 Q170 282 ${170 + waistHalf * .65} 270 L${170 + waistHalf * .5} ${hemY - 50} L170 ${hemY - 30} L${170 - waistHalf * .5} ${hemY - 50} Z`} fill={accent} opacity={.08 + street * .26}/>}
    <path d={torsoPath} transform={fitTransform} fill={`url(#cw-gloss-${uid})`} opacity={r.material_finish === "textile" && r.nanowear_state === "everyday" ? .12 : .88}/>
    <path className="character-lower-body" data-qa-surface="lower-body" d="M145 349 L170 369 L195 349 L204 414 L187 440 L153 440 L136 414 Z" fill={panel} stroke={stroke} strokeWidth={line}/>
    <path d="M151 410 L149 456 L170 456 L177 410 Z M185 410 L190 456 L211 456 L202 410 Z" fill="#111727"/>
    <path d="M148 452 L150 471 L181 471 L180 455 Z M190 452 L194 471 L225 471 L215 455 Z" fill={panel} stroke={accent} strokeWidth=".8"/>
    {values.footwear === "armored_boots" && <path d="M148 432 L171 432 L181 475 L146 475 Z M190 432 L212 432 L227 475 L194 475 Z" fill={panel} stroke={accent} strokeWidth={line}/>}
    {values.footwear === "high_top" && <path d="M149 438 L174 438 L181 469 L150 469 Z M190 438 L207 438 L222 469 L194 469 Z" fill={panel} stroke={stroke} strokeWidth={line}/>}
    {values.footwear === "sleek_boots" && <path d="M151 428 L172 428 L178 469 L149 469 Z M190 428 L209 428 L222 469 L195 469 Z" fill={fabric} stroke={accent} strokeWidth={line}/>}
    {values.footwear === "botas_cortas" && <path d="M150 442 L172 442 L179 468 L149 468 Z M191 442 L210 442 L223 468 L195 468 Z" fill={panel} stroke={stroke} strokeWidth={line}/>}
    {values.footwear === "zapatillas_plataforma" && <path d="M148 451 L180 451 L181 478 L146 478 Z M190 451 L221 451 L226 478 L194 478 Z" fill={panel} stroke={accent} strokeWidth={line}/>}
    {values.footwear === "botas_asimetricas" && <path d="M150 429 L172 429 L179 469 L148 469 Z M190 444 L211 444 L225 469 L194 469 Z" fill={panel} stroke={accent} strokeWidth={line}/>}
    {values.footwear === "calzado_ligero_pitcher" && <path d="M148 452 L181 452 L180 468 L148 468 Z M190 452 L219 452 L224 468 L194 468 Z" fill={fabric} stroke={accent} strokeWidth={line}/>}
    {values.footwear === "botines_elegantes" && <path d="M151 442 L172 442 L179 467 L150 467 Z M191 442 L210 442 L222 467 L195 467 Z" fill={fabric} stroke={stroke} strokeWidth={line}/>}
    {values.footwear === "botas_reforzadas" && <path d="M149 429 L173 429 L180 470 L147 470 Z M190 429 L212 429 L226 470 L194 470 Z" fill={panel} stroke={accent} strokeWidth={line}/>}
    <ellipse cx="170" cy="143" rx={52 - anime * 3} ry={63 - anime * 4} fill={`url(#cw-skin-${uid})`} stroke="#f5d7ce" strokeWidth={1 + toon * 1.8}/>
    {!rear && <>
      <path d="M118 152 Q107 91 150 63 Q211 35 233 96 L221 149 L206 102 Q173 117 130 110 Z" fill={`url(#cw-hair-${uid})`} stroke={stroke} strokeWidth={line}/>
      <path d="M128 120 L101 83 L129 94 M219 118 L250 81 L229 97" fill="none" stroke={hairAccent} strokeWidth={4 + street * 5} strokeLinecap="round"/>
      <path d="M143 148 Q156 140 165 148 M185 148 Q196 140 205 148" fill="none" stroke="#664253" strokeWidth={1.5 + toon * 2.5} strokeLinecap="round"/>
      <ellipse cx="155" cy="151" rx={5 + anime * 3} ry={6 + anime * 3} fill={eyeColor}/>
      <ellipse cx="195" cy="151" rx={5 + anime * 3} ry={6 + anime * 3} fill={optionColor(values.eyes ?? "", "#d7a64f")}/>
      <path d={values.expression?.includes("sonrisa") ? "M160 176 Q170 188 181 176" : "M160 179 L180 179"} fill="none" stroke="#9c526a" strokeWidth={2 + toon} strokeLinecap="round"/>
      {values.ear_style === "orejas_gato" && <path d="M126 121 L111 82 L143 103 M214 121 L230 82 L199 103" fill={skin} stroke={stroke} strokeWidth={line}/>}
      {values.ear_style === "orejas_zorro" && <path d="M126 120 L105 70 L146 100 M214 120 L235 70 L194 100" fill={skin} stroke={stroke} strokeWidth={line}/>}
      {values.ear_style === "orejas_lobo" && <path d="M126 121 L115 75 L145 101 M214 121 L225 75 L195 101" fill={skin} stroke={stroke} strokeWidth={line}/>}
      {values.ear_style === "orejas_conejo" && <path d="M143 115 Q123 44 137 42 Q151 43 155 113 M185 113 Q188 43 202 42 Q218 45 197 116" fill={skin} stroke={stroke} strokeWidth={line}/>}
      {values.ear_style === "orejas_elficas" && <path d="M127 131 L88 111 L133 145 M213 131 L252 111 L207 145" fill={skin} stroke={stroke} strokeWidth={line}/>} 
      {values.horn_style && !values.horn_style.includes("sin_") && <path d="M137 98 L126 64 L151 86 M202 86 L226 62 L216 102" fill={hairAccent} stroke={stroke} strokeWidth={line}/>}
      {values.facial_detail && !values.facial_detail.includes("sin_") && <g fill={hairAccent}><circle cx="145" cy="166" r="2"/><circle cx="149" cy="169" r="1.4"/></g>}
    </>}
    {rear && <path d="M118 152 Q107 91 150 63 Q211 35 233 96 L221 149 L206 102 Q173 117 130 110 Z" fill={`url(#cw-hair-${uid})`} stroke={stroke} strokeWidth={line}/>}
    {Array.from({ length: Math.round(2 + detail * 7) }, (_, i) => <path key={i} d={`M${139 + i * 4} 275 l${(i % 2 ? 4 : -3) + street * 2} ${30 + detail * 16}`} stroke={accent} strokeWidth={.45 + detail * .8} opacity={r.nanowear_state === "everyday" ? .12 + street * .2 : .25 + street * .65} fill="none"/>)}

    {values.outer_layer === "long_coat" && <g className="garment-layer long-coat" data-qa-surface="outer-layer" transform={fitTransform} fill={`url(#cw-fabric-${uid})`} stroke={stroke} strokeWidth={line}><path d={`M126 265 L111 285 L119 ${coatHem} L145 ${coatHem + 17} L144 333 Z`}/><path d={`M214 265 L229 285 L221 ${coatHem} L195 ${coatHem + 17} L196 333 Z`}/></g>}
    {values.outer_layer === "hooded_jacket" && <path d="M137 240 Q137 217 151 222 L170 242 L189 222 Q203 217 203 240 L194 264 L146 264 Z" fill={`url(#cw-fabric-${uid})`} stroke={stroke} strokeWidth={line}/>}
    {values.outer_layer === "short_bomber" && <path className="garment-layer short-bomber" data-qa-surface="outer-layer" d={`M125 263 Q170 245 216 263 L211 ${bomberHem} L129 ${bomberHem} Z`} transform={fitTransform} fill={panel} stroke={stroke} strokeWidth={line}/>}
    {values.outer_layer === "utility_cape" && <path d="M128 262 L105 282 L120 347 L145 365 L153 287 L187 287 L195 365 L220 347 L235 282 L212 262 Z" fill={panel} stroke={stroke} strokeWidth={line}/>}
    {values.outer_layer === "chaqueta_corta_asimetrica" && <path d="M125 263 L145 252 L170 274 L195 252 L216 263 L206 320 L177 331 L170 307 L153 337 L134 320 Z" fill={fabric} stroke={accent} strokeWidth={line}/>}
    {values.outer_layer === "capa_corta_energetica" && <path d="M130 262 L106 279 L120 340 L145 356 L154 284 L186 284 L195 356 L220 340 L234 279 L210 262 Z" fill={accent} opacity=".22" stroke={accent} strokeWidth={line}/>}
    {values.outer_layer === "mangas_desmontables" && <path d="M112 260 L98 282 L105 352 L126 355 L138 286 Z M228 260 L242 282 L235 352 L214 355 L202 286 Z" fill={panel} stroke={accent} strokeWidth={line}/>}
    {values.outer_layer === "chaleco_tactico" && <path d="M140 267 L158 282 L170 274 L182 282 L200 267 L195 337 L181 352 L170 344 L159 352 L145 337 Z" fill="#202b3e" stroke={accent} strokeWidth={line}/>}
    {["short_bomber", "hooded_jacket", "long_coat", "chaqueta_corta_asimetrica"].includes(values.outer_layer ?? "") && capabilities.sleeveLength && <g className="garment-layer outer-layer-sleeves" data-qa-surface="outer-layer-sleeves">
      <path d={`M113 243 Q88 249 89 309 L${Math.max(92, 89 + (sleeveEnd - 309) * .12)} ${sleeveEnd} L125 ${sleeveEnd - 2} L133 301 L151 278 Z M226 243 Q252 249 251 309 L${Math.min(248, 251 - (sleeveEnd - 309) * .12)} ${sleeveEnd} L218 ${sleeveEnd - 2} L213 301 L194 278 Z`} fill={`url(#cw-fabric-${uid})`} stroke={stroke} strokeWidth={line}/>
      <path d={`M${Math.max(92, 89 + (sleeveEnd - 309) * .12)} ${sleeveEnd} L125 ${sleeveEnd - 2} M${Math.min(248, 251 - (sleeveEnd - 309) * .12)} ${sleeveEnd} L218 ${sleeveEnd - 2}`} stroke={accent} strokeWidth={r.nanowear_state === "everyday" ? .6 : 1.4} fill="none" opacity={r.nanowear_state === "everyday" ? .35 : .9}/>
    </g>}
    {values.outfit === "street_bomber" && <g className="garment-layer street-bomber" data-qa-surface="outfit-garment" transform={fitTransform}><path className="street-bomber-shell" d={`M125 263 Q170 245 216 263 L211 ${bomberHem} L129 ${bomberHem} Z`} fill={panel} stroke={stroke} strokeWidth={line}/><path className="street-bomber-hem" d={`M137 ${bomberHem - 14} L203 ${bomberHem - 14} L198 ${bomberHem} L142 ${bomberHem} Z`} fill={accent} opacity=".72"/></g>}
    {values.outfit === "light_armor" && <path d="M143 280 L168 294 L194 279 L188 322 L170 334 L148 321 Z" fill={panel} opacity=".96" stroke={accent} strokeWidth={1 + street}/>}
    {values.outfit === "armadura_asimetrica" && <path d="M141 278 L169 291 L196 280 L185 315 L174 331 L146 324 Z M173 291 L197 296 L190 326 L175 333 Z" fill={panel} opacity=".96" stroke={accent} strokeWidth={1 + street}/>}
    {values.outfit === "techwear_sport" && <path d="M128 318 L145 329 M212 318 L195 329" stroke={accent} strokeWidth={2 + street * 2} fill="none"/>}
    {values.outfit === "tactical_baseball" && <path d="M138 269 L153 281 L170 274 L187 281 L203 269 L198 333 L187 351 L153 351 L142 333 Z" fill={panel} stroke={stroke} strokeWidth={line}/>}
    {values.outfit === "combat_jacket" && <path className="garment-layer combat-jacket" d={`M126 264 L145 253 L160 279 L170 289 L180 279 L195 253 L214 264 L205 ${Math.min(hemY, 410)} L188 ${Math.min(hemY, 410) + 15} L152 ${Math.min(hemY, 410) + 15} L135 ${Math.min(hemY, 410)} Z`} transform={fitTransform} fill={fabric} stroke={stroke} strokeWidth={line}/>}
    {values.outfit === "idol_combat" && <path d="M139 268 L160 280 L170 274 L180 280 L201 268 L196 331 L170 347 L144 331 Z" fill={panel} stroke={accent} strokeWidth={line}/>}
    {values.outfit === "elegant_command" && <path d="M151 269 L170 282 L189 269 L181 345 L170 359 L159 345 Z" fill={panel} stroke={stroke} strokeWidth={line}/>}
    {values.outfit === "support_coat" && <path className="garment-layer support-coat" d={`M130 264 L112 286 L122 ${hemY - 4} L145 ${hemY + 14} L151 330 L170 347 L189 330 L195 ${hemY + 14} L218 ${hemY - 4} L228 286 L210 264 Z`} transform={fitTransform} fill={fabric} stroke={stroke} strokeWidth={line}/>}
    {values.outfit === "baseball_tech_suit" && <path d="M135 269 L170 280 L205 269 L198 340 L186 352 L154 352 L142 340 Z" fill={panel} stroke={accent} strokeWidth={line}/>}
    {values.outer_layer === "hombrera_modular" && <path d="M124 265 L141 260 L151 280 L132 292 Z M216 265 L199 260 L189 280 L208 292 Z" fill={accent} opacity=".65" stroke={stroke} strokeWidth={line}/>}
    {r.nanowear_state !== "everyday" && <g fill="none" stroke={accent} strokeWidth={.7 + street} opacity={.35 + street * .55}><path d="M131 300 L145 315 L140 333 M209 300 L195 315 L200 333"/><path d="M141 353 L151 360 L148 377 M199 353 L189 360 L192 377"/></g>}
    <g className="chromapatch-anchor" data-qa-surface="chromapatch" data-requested-position={r.emblem_position} data-effective-position={effectiveEmblemPosition} data-anchor-x={patchX} data-anchor-y={patchY} transform={patchTransform} aria-label="Chromapatch">
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

export function VisualStyleLab({ recipe, values, onChange }: { recipe: VisualRecipe; values: Record<string, string>; onChange: (recipe: VisualRecipe) => void }) {
  const r = normalizeVisualRecipe(recipe);
  const patchBackground = r.nanowear_state === "transformation" || r.material_finish === "synthetic" ? "#202b43" : r.nanowear_state === "nanoweave" || r.material_finish === "nanoweave" ? "#273044" : "#343246";
  const contrast = contrastRatio(patchBackground, r.emblem_contrast === "manual" ? r.emblem_color : bestContrast(patchBackground, r.emblem_color));
  const update = <K extends keyof VisualRecipe>(key: K, value: VisualRecipe[K]) => onChange(normalizeVisualRecipe({ ...r, [key]: value }));
  const capabilities = getGarmentCapabilities(values);
  const garmentRange = (key: "torso_length" | "sleeve_length" | "waist_fit", label: string, low: string, high: string, enabled: boolean) => <label className={`style-range garment-range ${enabled ? "" : "is-disabled"}`} key={key}><span>{label}<b>{r[key]}%</b></span><input aria-label={label} type="range" min="0" max="100" step="1" value={r[key]} disabled={!enabled} onChange={e => update(key, Number(e.target.value))}/><small>{low}<span>{high}</span></small></label>;
  const range = (key: "anime_influence" | "toon_influence" | "streetwear_cyberpunk" | "detail_level", label: string) =>
    <label className="style-range" key={key}><span>{label}<b>{r[key]}%</b></span><input type="range" min="0" max="100" step="1" value={r[key]} onChange={e => update(key, Number(e.target.value))}/></label>;
  return <section className="style-lab" aria-label="Style Lab CyberStreet">
    <div className="style-lab-head"><div><span className="kicker">STYLE LAB / CYBERSTREET</span><p>La receta cambia la vista vectorial sin IA.</p></div><div className="view-toggle" role="group" aria-label="Vista del personaje"><button type="button" className={r.view === "front" ? "selected" : ""} aria-pressed={r.view === "front"} onClick={() => update("view", "front")}>Frontal</button><button type="button" className={r.view === "back" ? "selected" : ""} aria-pressed={r.view === "back"} onClick={() => update("view", "back")}>Trasera</button></div></div>
    <div className="style-ranges">{range("anime_influence", "Influencia Anime")}{range("toon_influence", "Influencia Toon")}{range("streetwear_cyberpunk", "Streetwear / Cyberpunk")}{range("detail_level", "Nivel de detalle")}</div>
    <div className="garment-fit-panel" aria-label="Corte y ajuste de la ropa"><div><b>Corte y ajuste de la ropa</b><p>Modifica la geometría de la pieza sin cambiar su identificador, color o material.</p></div><div className="style-ranges">{garmentRange("torso_length", "Largo del torso", "Corto", "Largo", capabilities.torsoLength)}{garmentRange("sleeve_length", "Largo de mangas", "Cortas", "Largas", capabilities.sleeveLength)}{garmentRange("waist_fit", "Ajuste de cintura", "Entallado", "Holgado", capabilities.waistFit)}</div><p className="fit-capability-note" role="status">{capabilities.torsoLength ? "Largo y cintura aplicables a la pieza seleccionada." : "La pieza actual no expone ajuste de torso o cintura."} {!capabilities.sleeveLength ? " El largo de manga no está disponible para esta combinación." : ""}</p></div>
    <div className="style-fields">
      <label>Color base de nanotela<input aria-label="Color base de nanotela" type="color" value={r.garment_base_color} onChange={e => update("garment_base_color", e.target.value)}/></label>
      <label>Color de paneles<input aria-label="Color secundario de nanotela" type="color" value={r.garment_panel_color} onChange={e => update("garment_panel_color", e.target.value)}/></label>
      <label>Acento tecnológico<input aria-label="Color de acento tecnológico" type="color" value={r.garment_accent_color} onChange={e => update("garment_accent_color", e.target.value)}/></label>
      <label>Patrón de nanotela<select aria-label="Patrón de nanotela" value={r.fabric_pattern} onChange={e => update("fabric_pattern", e.target.value as FabricPattern)}><option value="plain">Liso</option><option value="circuit">Circuitos</option><option value="geometric">Geométrico</option><option value="gradient">Degradado</option></select></label>
      <label>Estado NanoWear<select value={r.nanowear_state} onChange={e => update("nanowear_state", e.target.value as NanoWearState)}><option value="everyday">Everyday · cotidiano</option><option value="nanoweave">Nanoweave · técnico</option><option value="transformation">Transformation · transformado</option></select></label>
      <label>Acabado del material<select value={r.material_finish} onChange={e => update("material_finish", e.target.value as MaterialFinish)}><option value="textile">Textil cotidiano</option><option value="nanoweave">Nanotela técnica</option><option value="synthetic">Sintético brillante</option></select></label>
      <label>Forma Chromapatch<select value={r.emblem_shape} onChange={e => update("emblem_shape", e.target.value as EmblemShape)}><option value="bunny">Conejito</option><option value="star">Estrella</option><option value="fox">Zorro</option><option value="skull">Calavera</option><option value="geo">Geométrico</option></select></label>
      <label>Ubicación Chromapatch<select value={r.emblem_position} onChange={e => update("emblem_position", e.target.value as EmblemPosition)}><option value="chest">Pecho</option><option value="sleeve">Manga</option><option value="hood">Capucha / cuello</option></select></label>
      {r.emblem_position === "hood" && values.outer_layer !== "hooded_jacket" && <p className="patch-anchor-note" role="status">La prenda actual no tiene capucha; el Chromapatch se ancla temporalmente al pecho. Selecciona una chaqueta con capucha para usar esa ubicación.</p>}
      {r.emblem_position === "sleeve" && !capabilities.sleeveLength && <p className="patch-anchor-note" role="status">La combinación actual no tiene mangas compatibles; el Chromapatch se ancla temporalmente al pecho.</p>}
      <label>Contraste del emblema<select value={r.emblem_contrast} onChange={e => update("emblem_contrast", e.target.value as "auto" | "manual")}><option value="auto">Automático por luminancia</option><option value="manual">Manual</option></select></label>
      <label>Color del emblema<input type="color" value={r.emblem_color} onChange={e => update("emblem_color", e.target.value)}/></label>
    </div>
    <p className={r.emblem_contrast === "manual" && contrast < 3 ? "contrast-warning" : "contrast-note"} role="status">{r.emblem_contrast === "manual" && contrast < 3 ? "Advertencia: el color manual tiene poco contraste con la nanotela. Cambia el color o usa contraste automático." : r.emblem_contrast === "auto" ? "Contraste automático calculado con luminancia relativa." : "Contraste manual suficiente para esta zona de muestra."}</p>
  </section>;
}
