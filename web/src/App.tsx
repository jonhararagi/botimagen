import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type Group = "identity" | "body" | "hair" | "face" | "pose";
type FieldId = "species" | "height_cm" | "body_build" | "body_proportions" | "hair" | "hair_color_pattern" | "hair_secondary_color" | "eyes" | "pupil_shape" | "pose";
type Option = { value: string; label: string };
type Field = { id: FieldId; label: string; group: Group; initial: string; note: string; options: Option[] };
const o = (value: string, label: string): Option => ({ value, label });

const fields: Field[] = [
  { id: "species", label: "Especie", group: "identity", initial: "draconica", note: "Familia anatómica principal.", options: [
    o("humana","Humana"),o("kemonomimi_gato","Kemonomimi de gato"),o("kemonomimi_zorro","Kemonomimi de zorro"),o("kemonomimi_lobo","Kemonomimi de lobo"),o("kemonomimi_conejo","Kemonomimi de conejo"),o("elfa","Elfa"),o("oni","Oni"),o("draconica","Dracónica"),o("androide","Androide"),o("espiritu","Espíritu de energía")
  ]},
  { id: "height_cm", label: "Altura", group: "body", initial: "h170", note: "La altura no determina por sí sola la constitución.", options: [
    o("h145","145 cm"),o("h150","150 cm"),o("h155","155 cm"),o("h160","160 cm"),o("h165","165 cm"),o("h170","170 cm"),o("h175","175 cm"),o("h180","180 cm"),o("h185","185 cm"),o("h190","190 cm")
  ]},
  { id: "body_build", label: "Constitución", group: "body", initial: "fuerte_guardiana", note: "Se mantiene separada de altura y proporciones.", options: [
    o("compacta_atletica","Compacta atlética"),o("delgada_atletica","Delgada atlética"),o("equilibrada","Atlética equilibrada"),o("fuerte_guardiana","Fuerte / guardiana"),o("elegante_larga","Esbelta / elegante"),o("ligera_compacta","Ligera y compacta"),o("atletica_potente","Atlética potente"),o("flexible_esbelta","Flexible y esbelta"),o("robusta_deportiva","Robusta deportiva"),o("equilibrada_flexible","Equilibrada y flexible")
  ]},
  { id: "body_proportions", label: "Proporciones corporales", group: "body", initial: "esbelta_elegante", note: "Parámetro independiente dentro del catálogo actual.", options: [
    o("equilibradas","Equilibradas"),o("piernas_largas","Piernas largas"),o("compactas_agiles","Compactas y ágiles"),o("torso_corto_deportivo","Torso compacto deportivo"),o("extremidades_largas","Extremidades largas"),o("hombros_deportivos","Hombros deportivos definidos"),o("centro_bajo","Centro de gravedad bajo"),o("esbelta_elegante","Esbelta y elegante"),o("potencia_compacta","Potencia compacta"),o("movilidad_flexible","Flexible y móvil")
  ]},
  { id: "hair", label: "Color base del cabello", group: "hair", initial: "rojo_coral", note: "El color base es independiente del patrón y del color secundario.", options: [
    o("rojo_coral","Rojo coral"),o("naranja_tangerina","Naranja mandarina"),o("rosa_chicle","Rosa chicle"),o("violeta_profundo","Violeta profundo"),o("negro_obsidiana","Negro obsidiana"),o("azul_nocturno","Azul nocturno"),o("plateado_perla","Plateado perla"),o("castano_miel","Castaño miel"),o("rubio_platino","Rubio platino"),o("turquesa","Turquesa"),o("verde_esmeralda","Verde esmeralda"),o("rubio_dorado","Rubio dorado")
  ]},
  { id: "hair_color_pattern", label: "Patrón de color", group: "hair", initial: "puntas_doradas", note: "Elige una opción reconocida por el catálogo de rasgos actual.", options: [
    o("color_solido","Color uniforme"),o("puntas_doradas","Puntas doradas"),o("degradado_suave","Degradado suave"),o("ombre_oscuro_claro","Ombré oscuro a claro"),o("raices_contraste","Raíces de contraste"),o("dos_tonos_divididos","Dos tonos divididos"),o("capa_interior","Capa interior de otro color"),o("mechones_color","Mechones de color"),o("reflejos_metalicos","Reflejos metálicos"),o("puntas_plateadas","Puntas plateadas")
  ]},
  { id: "hair_secondary_color", label: "Color secundario", group: "hair", initial: "oro_metalico", note: "Todavía no controla por separado raíces, coronilla e inner hair.", options: [
    o("oro_metalico","Oro metálico"),o("plata_perla","Plata perla"),o("blanco_luminoso","Blanco luminoso"),o("coral_vivo","Coral vivo"),o("rojo_rubi","Rojo rubí"),o("rosa_chicle","Rosa chicle"),o("violeta","Violeta"),o("verde_esmeralda","Verde esmeralda"),o("turquesa","Turquesa"),o("azul_medianoche","Azul medianoche")
  ]},
  { id: "eyes", label: "Color de ojos", group: "face", initial: "ambar", note: "El color del iris y la forma de pupila son campos independientes.", options: [
    o("ambar","Ámbar dorado"),o("rojo_rubi","Rojo rubí"),o("violeta","Violeta"),o("azul_hielo","Azul hielo"),o("verde_esmeralda","Verde esmeralda"),o("gris_grafito","Gris grafito"),o("azul_profundo","Azul profundo"),o("celeste","Celeste"),o("verde_lima","Verde lima"),o("rosa_opalina","Rosa opalina")
  ]},
  { id: "pupil_shape", label: "Forma de pupila", group: "face", initial: "estrella", note: "Las formas especiales dependen de las opciones disponibles.", options: [
    o("circular","Circular clásica"),o("ovalada","Ovalada"),o("vertical_fina","Vertical fina"),o("estrella","Estrella"),o("corazon","Corazón"),o("diamante","Diamante"),o("anillo_concentrico","Anillos concéntricos"),o("doble_anillo","Doble anillo"),o("brillo_geometrico","Brillo geométrico integrado"),o("ranura_vertical","Ranura vertical estilizada")
  ]},
  { id: "pose", label: "Pose", group: "pose", initial: "defiant", note: "El control de cámara y la composición avanzada aún están pendientes.", options: [
    o("relaxed_ready","Reposo listo"),o("energetic","Energética"),o("defiant","Desafiante"),o("stoic","Estoica"),o("protective","Protectora"),o("technical","Técnica / concentrada"),o("sleepy_ready","Somnolienta pero lista"),o("batting_ready","Preparada para batear"),o("pitch_windup","Inicio de lanzamiento"),o("victory_pose","Pose de victoria")
  ]}
];

const tabs: { id: Group; label: string; no: string; title: string; subtitle: string }[] = [
  { id: "identity", label: "Identidad", no: "01", title: "Identidad", subtitle: "Especie y familia visual" },
  { id: "body", label: "Cuerpo", no: "02", title: "Cuerpo y anatomía", subtitle: "Estatura y proporciones" },
  { id: "hair", label: "Cabello", no: "03", title: "Diseño de cabello", subtitle: "Color base, patrón y acento" },
  { id: "face", label: "Rostro", no: "04", title: "Ojos y rostro", subtitle: "Iris y forma de pupila" },
  { id: "pose", label: "Pose", no: "05", title: "Pose y presencia", subtitle: "Actitud y dirección corporal" }
];
const initialValues = Object.fromEntries(fields.map((f) => [f.id, f.initial])) as Record<FieldId, string>;
const initialFixed = Object.fromEntries(fields.map((f) => [f.id, true])) as Record<FieldId, boolean>;

function labelFor(id: FieldId, value: string): string {
  return fields.find((f) => f.id === id)?.options.find((x) => x.value === value)?.label ?? value;
}
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return h >>> 0;
}
function colorFor(id: string): string {
  const map: Record<string,string> = {
    rojo_coral:"#ef646b", naranja_tangerina:"#ef8b43", rosa_chicle:"#ec78bd", violeta_profundo:"#8e7ae7",
    negro_obsidiana:"#38384b", azul_nocturno:"#4761b1", plateado_perla:"#bbc6d8", castano_miel:"#a97851",
    rubio_platino:"#e8dfba", turquesa:"#35c5bd", verde_esmeralda:"#2da987", rubio_dorado:"#d4a440"
  };
  return map[id] ?? "#ef646b";
}

export default function App() {
  const [group, setGroup] = useState<Group>("hair");
  const [values, setValues] = useState<Record<FieldId,string>>(initialValues);
  const [fixed, setFixed] = useState<Record<FieldId,boolean>>(initialFixed);
  const [seed, setSeed] = useState("314159");
  const [status, setStatus] = useState("Prototipo visual: el motor Python aún no está conectado.");
  const [showNegative, setShowNegative] = useState(false);
  const [saved, setSaved] = useState(false);
  const activeTab = tabs.find((t) => t.id === group) ?? tabs[0];
  const visibleFields = fields.filter((f) => f.group === group);
  const prompt = useMemo(() => [
    "Original adult anime gacha character, bw-modern-gacha-v1 visual direction.",
    "Clean controlled line art, polished cel shading, clear silhouette and coherent palette.",
    ...fields.map((f) => f.label + ": " + (fixed[f.id] ? labelFor(f.id, values[f.id]) : "AUTO (resolver con el motor oficial)")),
    "Respect manually fixed traits. Do not invent properties that are missing from the approved catalog.",
    "Prototype only. This preview has not been sent to an image generator."
  ].join("\n"), [fixed, values]);
  const negative = "photorealistic, generic 3D CGI, low-poly, copied franchise character, watermark, logo, cropped head, cropped feet, malformed hands, duplicate limbs, mixed art styles, cluttered silhouette";
  const styleVars = { "--hair-color": colorFor(values.hair) } as CSSProperties;

  function setValue(id: FieldId, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setSaved(false);
    setStatus("Diseño modificado. El prompt de demostración se ha actualizado.");
  }
  function toggleFixed(id: FieldId) {
    setFixed((prev) => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
    setStatus(fixed[id] ? "Campo marcado AUTO en el prototipo." : "Campo fijado manualmente.");
  }
  function fillAuto() {
    const safeSeed = String(Number.parseInt(seed, 10) || 314159);
    const next = { ...values };
    let count = 0;
    for (const field of fields) {
      if (!fixed[field.id]) {
        next[field.id] = field.options[hashSeed(safeSeed + "|" + field.id) % field.options.length].value;
        count += 1;
      }
    }
    setValues(next);
    setSeed(safeSeed);
    setSaved(false);
    setStatus(count ? "Campos AUTO explorados con una semilla de demostración." : "No hay campos AUTO; marca alguno como AUTO para probar la función.");
  }
  function reset() {
    setValues(initialValues);
    setFixed(initialFixed);
    setSeed("314159");
    setSaved(false);
    setStatus("Ejemplo de dragonkin restaurado.");
  }
  function saveDemo() {
    try {
      window.localStorage.setItem("botimagen.web.prototype.profile.v1", JSON.stringify({
        schema_version: 1, mode: "prototype-demo", style_id: "bw-modern-gacha-v1",
        seed: Number.parseInt(seed,10) || 314159, values, fixed, saved_at: new Date().toISOString()
      }, null, 2));
      setSaved(true);
      setStatus("Perfil demo guardado en el almacenamiento de este navegador, no en una carpeta de Windows.");
    } catch {
      setStatus("El navegador no permitió guardar este perfil.");
    }
  }
  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(showNegative ? prompt + "\n\nNEGATIVE PROMPT:\n" + negative : prompt);
      setStatus("Texto copiado al portapapeles.");
    } catch {
      setStatus("No se pudo acceder al portapapeles; selecciona y copia el texto manualmente.");
    }
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify({ schema_version: 1, mode: "prototype-demo", style_id: "bw-modern-gacha-v1", seed, values, fixed }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "botimagen-profile-demo.json"; link.click();
    URL.revokeObjectURL(url);
    setStatus("Perfil demo exportado como JSON.");
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">✳</span><span><b>BotImagen</b><small>CHARACTER STUDIO</small></span></div>
      <div className="nav-label">ESPACIO DE TRABAJO</div>
      <button className="nav active" type="button"><span>◈</span> Diseñador <i>01</i></button>
      <button className="nav" type="button" disabled title="Pendiente de BIMG-007"><span>▦</span> Biblioteca visual <small>PRONTO</small></button>
      <button className="nav" type="button" disabled title="Función futura"><span>⇄</span> Comparar variantes</button>
      <button className="nav" type="button" disabled title="Integración futura"><span>▤</span> Assets</button>
      <div className="side-spacer" />
      <div className="local-card"><div className="online"><i /> MOTOR LOCAL</div><b>Modo prototipo</b><p>Controles interactivos listos. La conexión al generador Python está pendiente.</p><div className="progress"><i /></div><small>BASE WEB · ETAPA INICIAL</small></div>
      <footer className="side-footer"><span>v0.1.0</span><span>OFFLINE-FIRST</span></footer>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">WORKSPACE <span>/</span> <b>CHARACTER DESIGN</b></div><div className="top-actions"><span className="local-pill"><i /> LOCAL · DEMO</span><span className="avatar">BW</span></div></header>
      <section className="heading"><div><div className="eyebrow"><i /> ESTUDIO DE PERSONAJES <span>BIMG-003</span></div><h1>Diseña una nueva <em>waifu.</em></h1><p>Construye un personaje por capas. Tus elecciones permanecen bajo tu control.</p></div><div className="heading-buttons"><button className="btn muted" onClick={reset} type="button">Restaurar ejemplo</button><button className="btn primary" onClick={saveDemo} type="button">＋ {saved ? "Perfil guardado" : "Guardar perfil demo"}</button></div></section>

      <div className="workspace">
        <section className="preview-area">
          <div className="kicker"><span><i>01</i> LIENZO DEL PERSONAJE</span><small>PREVIEW <i /></small></div>
          <div className="canvas" style={styleVars}>
            <div className="grid-bg" /><div className="halo halo-a" /><div className="halo halo-b" />
            <div className="canvas-labels"><span>BW / DESIGN STUDY</span><span>#{seed.padStart(6,"0").slice(-6)}</span></div>
            <div className="watermark">CHARACTER<br />PROTOTYPE</div>
            <svg className="silhouette" viewBox="0 0 340 490" role="img" aria-label="Silueta vectorial temporal de interfaz, no es una ilustración generada">
              <defs>
                <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="var(--hair-color)" /><stop offset="76%" stopColor="var(--hair-color)" /><stop offset="100%" stopColor="#e9bd69" /></linearGradient>
                <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34334d"/><stop offset="100%" stopColor="#121727"/></linearGradient>
                <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f6c8c2"/><stop offset="100%" stopColor="#bd8198"/></linearGradient>
              </defs>
              <ellipse cx="170" cy="463" rx="82" ry="10" fill="#070a13" opacity=".5"/>
              <path d="M110 90 Q72 137 99 235 L83 338 Q81 377 109 400 L137 374 L138 273 L163 245 L188 246 L211 281 L211 376 L242 401 Q268 371 255 331 L238 238 Q265 130 224 82 Z" fill="url(#hair)"/>
              <path d="M137 190 L135 233 L116 260 L149 282 L170 248 L193 281 L225 259 L207 229 L204 190 Z" fill="url(#skin)"/>
              <path d="M113 243 Q88 249 89 309 L98 372 L125 371 L133 301 L151 278 Z M226 243 Q252 250 251 310 L244 372 L218 371 L213 301 L194 278 Z" fill="url(#cloth)" stroke="#767b9c" strokeWidth="2"/>
              <path d="M125 263 Q170 238 216 263 L209 340 L196 397 L145 397 L131 338 Z" fill="url(#cloth)" stroke="#858aaa" strokeWidth="2"/>
              <path d="M142 280 L170 305 L199 280 L195 349 L170 369 L145 349 Z" fill="#e8bd6a"/>
              <path d="M145 349 L170 369 L195 349 L204 414 L187 440 L153 440 L136 414 Z" fill="#20263b" stroke="#9b9fba" strokeWidth="2"/>
              <path d="M151 410 L149 456 L170 456 L177 410 Z M185 410 L190 456 L211 456 L202 410 Z" fill="#111727"/>
              <path d="M148 452 L150 471 L181 471 L180 455 Z M190 452 L194 471 L225 471 L215 455 Z" fill="#dbb15e"/>
              <ellipse cx="170" cy="143" rx="52" ry="63" fill="url(#skin)" stroke="#f5d7ce" strokeWidth="2"/>
              <path d="M118 152 Q107 91 150 63 Q211 35 233 96 L221 149 L206 102 Q173 117 130 110 Z" fill="url(#hair)" stroke="#f0a6ad" strokeWidth="1.5"/>
              <path d="M128 120 L101 83 L129 94 M219 118 L250 81 L229 97" fill="none" stroke="#e3ba66" strokeWidth="8" strokeLinecap="round"/>
              <path d="M143 148 Q156 140 165 148 M185 148 Q196 140 205 148" fill="none" stroke="#664253" strokeWidth="4" strokeLinecap="round"/>
              <ellipse cx="155" cy="151" rx="6" ry="7" fill="#d7a64f"/><ellipse cx="195" cy="151" rx="6" ry="7" fill="#d7a64f"/>
              <path d="M161 177 Q170 183 180 177" fill="none" stroke="#9c526a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M144 195 L119 228 L137 250 L161 220 Z M196 195 L222 228 L203 250 L179 220 Z" fill="#e7bd69" stroke="#f7d992" strokeWidth="2"/>
            </svg>
            <div className="side-mark left"><span>01</span>IDENTITY</div><div className="side-mark right"><span>02</span>SILHOUETTE</div>
            <div className="canvas-footer"><div><i /><b>DRAGONKIN STUDY</b><small>ILUSTRACIÓN NO GENERADA</small></div><div className="swatches"><i style={{background:colorFor(values.hair)}}/><i style={{background:values.hair_secondary_color === "oro_metalico" ? "#d7ae59" : "#a6abc0"}}/><i style={{background:values.eyes === "ambar" ? "#d6a54d" : "#7396df"}}/></div></div>
          </div>
          <div className="summary"><div><small>COMBINACIÓN ACTUAL</small><b>{labelFor("species",values.species)} · {labelFor("hair",values.hair)} · {labelFor("eyes",values.eyes)}</b><span>Silueta temporal para validar la composición de pantalla.</span></div><div className="counts"><b>{Object.values(fixed).filter(Boolean).length}<small>FIJOS</small></b><b>{Object.values(fixed).filter((v) => !v).length}<small>AUTO</small></b></div></div>
          <div className="roadmap"><b>✦ Próximos rasgos</b><span>Color y zonas de escamas, tamaño del busto y otros controles anatómicos aún no existen como selectores.</span></div>
        </section>

        <section className="controls-area">
          <div className="control-panel">
            <div className="kicker"><span><i>02</i> CONFIGURACIÓN</span><small>{activeTab.no} / 05</small></div>
            <div className="tabs" role="tablist" aria-label="Categorías del personaje">
              {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={group === tab.id} className={group === tab.id ? "tab selected" : "tab"} onClick={() => setGroup(tab.id)}><small>{tab.no}</small>{tab.label}</button>)}
            </div>
            <div className="control-heading"><h2>{activeTab.title}</h2><p>{activeTab.subtitle}</p></div>
            <div className="fields">
              {visibleFields.map((field) => <div className={fixed[field.id] ? "field" : "field is-auto"} key={field.id}>
                <div className="field-label"><label htmlFor={"trait-" + field.id}>{field.label}</label><button type="button" className={fixed[field.id] ? "lock fixed" : "lock auto"} aria-pressed={fixed[field.id]} onClick={() => toggleFixed(field.id)}>{fixed[field.id] ? "● FIJO" : "◇ AUTO"}</button></div>
                <select id={"trait-" + field.id} value={values[field.id]} disabled={!fixed[field.id]} onChange={(event) => setValue(field.id,event.target.value)}>{field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
                <p>{field.note}</p>
              </div>)}
            </div>
            {group === "body" && <div className="future-trait"><b>＋</b><span><strong>Tamaño del busto</strong><small>Se añadirá como rasgo independiente en BIMG-006.</small></span><em>PLANIFICADO</em></div>}
            {group === "identity" && values.species === "draconica" && <div className="future-trait"><b>＋</b><span><strong>Color / distribución de escamas</strong><small>La especie existe; estos selectores aún no están en el catálogo.</small></span><em>PLANIFICADO</em></div>}
            <div className="seed-row"><span><b>SEMILLA DE DEMOSTRACIÓN</b><small>Explora solo los campos AUTO de esta interfaz.</small></span><input aria-label="Semilla de demostración" value={seed} inputMode="numeric" onChange={(event) => setSeed(event.target.value.replace(/[^0-9-]/g,"").slice(0,12))}/></div>
            <button className="btn primary wide" type="button" onClick={fillAuto}>✦ Completar campos AUTO <span>→</span></button>
          </div>
          <div className="prompt-panel"><div className="kicker"><span><i>03</i> DESCRIPCIÓN DEL DISEÑO</span><small>PREVIEW</small></div><pre>{showNegative ? prompt + "\n\nNEGATIVE PROMPT:\n" + negative : prompt}</pre><div className="prompt-actions"><button type="button" className="btn muted" onClick={() => setShowNegative((v) => !v)}>{showNegative ? "Ocultar negativo" : "Ver negative prompt"}</button><button type="button" className="btn copy" onClick={copyPrompt}>Copiar texto ↗</button><button type="button" className="btn muted" onClick={exportJson}>Exportar JSON</button></div></div>
        </section>
      </div>
      <footer className="main-footer"><span><i />{status}</span><small>DEMO LOCAL · SIN MOTOR CONECTADO</small></footer>
    </main>
  </div>;
}
