import { useEffect, useMemo, useState } from "react";

type Character = {
  id: string; name: string; body: string; skin: string; hair: string; hairstyle: string;
  eyes: string; top: string; bottom: string; accessory: string; pose: string;
};
type Choice = { id: string; label: string; color?: string };
const STORE_KEY = "botimagen.character-catalog.v1";
const choices: Record<string, Choice[]> = {
  body: [{id:"slim",label:"Esbelto"},{id:"balanced",label:"Proporcionado"},{id:"athletic",label:"Atlético"}],
  skin: [{id:"porcelain",label:"Porcelana",color:"#f4d7cb"},{id:"ivory",label:"Marfil",color:"#f7dfd0"},{id:"warm",label:"Cálido",color:"#d99d7b"},{id:"peach",label:"Durazno",color:"#e8b49b"},{id:"olive",label:"Oliva",color:"#c49a72"},{id:"tan",label:"Moreno",color:"#986449"},{id:"deep",label:"Oscuro",color:"#633f37"},{id:"ebony",label:"Ébano",color:"#4b302f"}],
  hair: [{id:"black",label:"Negro",color:"#252137"},{id:"brown",label:"Castaño",color:"#70462f"},{id:"auburn",label:"Cobrizo",color:"#a94f3f"},{id:"blonde",label:"Rubio",color:"#e9c56d"},{id:"silver",label:"Plateado",color:"#b9c2d8"},{id:"pink",label:"Rosa",color:"#e77aa9"},{id:"red",label:"Carmesí",color:"#bd315b"},{id:"blue",label:"Azul",color:"#557de0"},{id:"teal",label:"Turquesa",color:"#31aeb7"},{id:"white",label:"Blanco",color:"#e6e5ef"}],
  hairstyle: [{id:"long",label:"Largo"},{id:"bob",label:"Bob"},{id:"ponytail",label:"Coleta"},{id:"sidepony",label:"Coleta lateral"},{id:"short",label:"Corto"},{id:"wolfcut",label:"Wolf cut"},{id:"braids",label:"Trenzas"},{id:"twin",label:"Coletas dobles"}],
  eyes: [{id:"violet",label:"Violeta",color:"#8761d7"},{id:"blue",label:"Azul",color:"#4c91df"},{id:"sky",label:"Celeste",color:"#5bc7e8"},{id:"green",label:"Verde",color:"#42a77b"},{id:"emerald",label:"Esmeralda",color:"#168b65"},{id:"amber",label:"Ámbar",color:"#d69a35"},{id:"red",label:"Rojo",color:"#d94d66"},{id:"rose",label:"Rosa",color:"#e875a8"}],
  top: [{id:"uniform",label:"Uniforme"},{id:"hoodie",label:"Sudadera"},{id:"blouse",label:"Blusa"},{id:"jacket",label:"Chaqueta"},{id:"armor",label:"Armadura ligera"},{id:"kimono",label:"Kimono"},{id:"gothic",label:"Gótico"},{id:"sports",label:"Deportivo"}],
  bottom: [{id:"skirt",label:"Falda plisada"},{id:"shorts",label:"Shorts"},{id:"pants",label:"Pantalón"},{id:"dress",label:"Vestido"},{id:"pleated_long",label:"Falda larga"},{id:"cargo",label:"Pantalón cargo"},{id:"short_skirt",label:"Minifalda"}],
  accessory: [{id:"none",label:"Ninguno"},{id:"glasses",label:"Gafas"},{id:"ribbon",label:"Lazo"},{id:"headphones",label:"Auriculares"},{id:"hairclip",label:"Horquilla"},{id:"cat_ears",label:"Orejas felinas"},{id:"halo",label:"Aureola"},{id:"horns",label:"Cuernos pequeños"}],
  pose: [{id:"neutral",label:"De pie · frontal (fija)"}],
};
const defaults: Character = {id:"",name:"Mi personaje",body:"balanced",skin:"porcelain",hair:"black",hairstyle:"long",eyes:"violet",top:"uniform",bottom:"skirt",accessory:"none",pose:"neutral"};
const label = (group:string,id:string) => choices[group]?.find(option=>option.id===id)?.label ?? id;
const color = (group:string,id:string,fallback:string) => choices[group]?.find(option=>option.id===id)?.color ?? fallback;
function readSaved(): Character[] {
  try { const value = JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); return Array.isArray(value) ? value.filter(item=>item && typeof item.id==="string" && typeof item.name==="string") : []; }
  catch { return []; }
}
function CharacterFigure({character:c}:{character:Character}) {
  const hair = color("hair",c.hair,"#252137"), skin = color("skin",c.skin,"#f4d7cb"), eyes = color("eyes",c.eyes,"#8761d7");
  const topColor = ({uniform:"#5a54a8",hoodie:"#42475e",blouse:"#f2eaf4",jacket:"#29334c",armor:"#687a91",kimono:"#b74d75",gothic:"#292438",sports:"#2f8d9b"} as Record<string,string>)[c.top] || "#5a54a8";
  const bottomColor = ({skirt:"#d34f91",shorts:"#425f9a",pants:"#34405d",dress:"#a84d91",pleated_long:"#8b5fbf",cargo:"#45566c",short_skirt:"#e078a9"} as Record<string,string>)[c.bottom] || "#d34f91";
  const bodyWidth = c.body==="slim"?52:c.body==="athletic"?70:60;
  return <svg className="cc-figure" viewBox="0 0 240 360" role="img" aria-label={c.name + ", personaje anime de cuerpo completo"}>
    <ellipse cx="120" cy="337" rx="55" ry="9" fill="#151222" opacity=".12"/>
    <path d={c.hairstyle==="long"?"M82 72 Q58 118 77 181 L94 190 L99 104 Z":(c.hairstyle==="ponytail"||c.hairstyle==="sidepony")?"M143 63 Q190 63 184 121 L166 139 L158 93 Z":c.hairstyle==="braids"?"M82 72 Q63 111 78 157 L86 186 L96 178 L91 118 Z M145 75 Q164 111 155 157 L154 186 L144 178 L146 118 Z":"M82 62 Q66 97 78 119 L94 104 Z"} fill={hair}/>
    <path d="M99 234 L93 314 Q94 324 107 324 L118 250 Z M141 234 L148 314 Q148 324 135 324 L122 250 Z" fill={skin}/>
    <path d="M91 310 L111 310 L113 329 L83 329 Q82 318 91 310 M132 310 L150 310 Q160 317 157 329 L128 329 Z" fill="#29253d"/>
    <path d={c.bottom==="skirt"||c.bottom==="short_skirt"?"M91 204 L149 204 L164 260 Q120 273 76 260 Z":c.bottom==="shorts"?"M91 205 L149 205 L150 245 L122 249 L120 232 L108 249 L89 245 Z":c.bottom==="dress"?"M91 185 L149 185 L167 260 L73 260 Z":c.bottom==="pleated_long"?"M91 204 L149 204 L158 282 Q120 294 82 282 Z":"M91 204 L149 204 L150 263 L127 263 L120 225 L111 263 L89 263 Z"} fill={bottomColor} stroke="#2a243d" strokeWidth="2"/>
    <path d={c.top==="kimono"?"M98 132 L142 132 L156 211 L120 225 L84 211 Z":c.top==="armor"?"M100 132 L140 132 L150 211 L120 225 L90 211 Z":`M${120-bodyWidth/2} 132 Q120 119 ${120+bodyWidth/2} 132 L150 211 Q120 225 90 211 Z`} fill={topColor} stroke="#2a243d" strokeWidth="2"/>
    <path d="M101 139 L83 188 M139 139 L157 188" stroke={skin} strokeWidth="13" strokeLinecap="round"/>
    <path d="M95 58 Q120 35 145 58 L151 100 Q148 130 120 139 Q92 130 89 100 Z" fill={skin} stroke="#30273d" strokeWidth="2"/>
    <path d={c.hairstyle==="bob"?"M88 82 Q72 34 119 31 Q164 31 152 87 L143 105 L139 65 Q116 80 95 62 L94 106 Z":c.hairstyle==="short"?"M88 73 Q79 34 119 31 Q159 33 151 74 L137 62 L120 69 L98 61 Z":c.hairstyle==="twin"?"M89 69 Q63 30 78 16 Q103 22 101 63 Q119 40 143 48 Q178 28 166 73 L147 93 L143 61 Q119 78 96 61 L94 94 Z":c.hairstyle==="wolfcut"?"M88 76 Q70 29 118 27 Q166 29 152 76 L145 94 L151 117 L135 108 L130 127 L119 110 L105 128 L101 108 L85 120 L93 93 Z":c.hairstyle==="braids"?"M88 75 Q72 30 118 28 Q164 28 152 76 L141 96 L140 58 Q119 76 97 57 L95 98 Z M88 83 L76 139 L83 184 L96 179 L90 137 L100 111 Z M150 83 L164 139 L157 184 L144 179 L150 137 L140 111 Z":c.hairstyle==="sidepony"?"M88 75 Q72 30 118 28 Q164 28 152 76 L141 96 L140 58 Q119 76 97 57 L95 98 Z M142 39 Q176 28 175 55 L164 74 L152 60 Z":"M88 75 Q72 30 118 28 Q164 28 152 76 L141 96 L140 58 Q119 76 97 57 L95 98 Z"} fill={hair} stroke="#30273d" strokeWidth="2"/>
    <ellipse cx="105" cy="91" rx="5" ry="8" fill={eyes}/><ellipse cx="135" cy="91" rx="5" ry="8" fill={eyes}/><circle cx="106" cy="89" r="1.8" fill="white"/><circle cx="136" cy="89" r="1.8" fill="white"/>
    <path d="M113 113 Q120 118 127 113" fill="none" stroke="#b45f77" strokeWidth="2" strokeLinecap="round"/>
    {c.accessory==="glasses"&&<g fill="none" stroke="#29243b" strokeWidth="2.5"><circle cx="105" cy="91" r="11"/><circle cx="135" cy="91" r="11"/><path d="M116 91 L124 91"/></g>}
    {c.accessory==="ribbon"&&<path d="M116 43 L99 31 L101 51 L116 47 L132 31 L133 51 Z" fill="#e75b98" stroke="#30273d" strokeWidth="1.5"/>}
    {c.accessory==="hairclip"&&<path d="M137 51 L151 45" stroke="#f2c96d" strokeWidth="5" strokeLinecap="round"/>}
    {c.accessory==="headphones"&&<g fill="none" stroke="#7dd9e8" strokeWidth="5"><path d="M84 78 Q82 39 120 39 Q158 39 156 78"/><rect x="80" y="72" width="10" height="23" rx="4" fill="#7dd9e8"/><rect x="150" y="72" width="10" height="23" rx="4" fill="#7dd9e8"/></g>}
    {c.accessory==="cat_ears"&&<path d="M91 51 L86 25 L107 43 Q120 37 133 43 L154 25 L149 51Z" fill={hair} stroke="#30273d" strokeWidth="2.5"/>}
    {c.accessory==="halo"&&<ellipse cx="120" cy="19" rx="23" ry="6" fill="none" stroke="#f2c96d" strokeWidth="4"/>}
    {c.accessory==="horns"&&<path d="M99 43 Q88 26 96 17 Q107 27 109 40 M141 43 Q152 26 144 17 Q133 27 131 40" fill="#b94c62" stroke="#30273d" strokeWidth="2"/>
    {c.top==="uniform"&&<path d="M110 137 L120 151 L130 137" fill="none" stroke="#f5edf9" strokeWidth="4"/>}
    {(c.top==="jacket"||c.top==="armor")&&<path d="M120 151 L120 210 M108 143 L120 158 L132 143" fill="none" stroke={c.top==="armor"?"#dbe5f3":"#7ee4ee"} strokeWidth="2.5"/>}
    {c.top==="kimono"&&<path d="M104 145 L120 166 L136 145" fill="none" stroke="#f7dce8" strokeWidth="3"/>}
    {c.top==="sports"&&<path d="M104 155 L136 155 M104 167 L136 167" fill="none" stroke="#d8f7fa" strokeWidth="3"/>
    <path d="M104 211 L136 211" stroke="#f5d87b" strokeWidth="3"/>
  </svg>;
}
export function CharacterCatalogStudio() {
  const [character,setCharacter]=useState<Character>(defaults);
  const [saved,setSaved]=useState<Character[]>([]);
  const [notice,setNotice]=useState("");
  const [pixaiNotice,setPixaiNotice]=useState("");
  useEffect(()=>setSaved(readSaved()),[]);
  const update=(key:keyof Character,value:string)=>setCharacter(current=>({...current,[key]:value}));
  const fields: Array<[keyof Character,string,string]> = [
    ["body","Cuerpo","body"],["skin","Piel","skin"],["hairstyle","Peinado","hairstyle"],["hair","Color del cabello","hair"],["eyes","Ojos","eyes"],["top","Prenda superior","top"],["bottom","Prenda inferior","bottom"],["accessory","Accesorio","accessory"],["pose","Pose","pose"]
  ];
  const description=useMemo(()=>[label("body",character.body),label("hairstyle",character.hairstyle),label("hair",character.hair),label("eyes",character.eyes),label("top",character.top),label("bottom",character.bottom),label("accessory",character.accessory)].join(" · "),[character]);
  const pixaiPrompt=useMemo(()=>[
    "pibara gen",
    "masterpiece, best quality, clean 2D anime illustration, original adult anime character design, solo, full body from head to toe, directly facing forward, centered composition, symmetrical relaxed standing pose, arms slightly away from torso, hands visible, both feet and shoes visible, consistent body proportions, clean silhouette, expressive anime eyes, clean lineart, carefully drawn hair strands, illustrated clothing with visible fabric folds, clean cel shading, coherent color palette, polished character sheet, plain pure white background, even neutral lighting, no dramatic perspective",
    `character name or identity: ${character.name || "original character"}`,
    `body build: ${label("body",character.body)}`,
    `skin tone: ${label("skin",character.skin)}`,
    `hairstyle: ${label("hairstyle",character.hairstyle)}`,
    `hair color: ${label("hair",character.hair)}`,
    `eye color: ${label("eyes",character.eyes)}`,
    `top clothing: ${label("top",character.top)}`,
    `bottom clothing: ${label("bottom",character.bottom)}`,
    `accessory: ${label("accessory",character.accessory)}`,
    "preserve the listed design traits, one character only"
  ].join(", "),[character]);
  const pixaiNegative="photorealistic, realistic photograph, 3D render, CGI, painterly blur, sketch, messy lineart, low detail, multiple characters, duplicate body, extra arms, extra legs, extra fingers, missing fingers, cropped head, cropped feet, side view, back view, extreme perspective, dynamic action pose, sitting, running, floating accessories, fused clothing, merged hair and clothes, text, logo, watermark, scenery, busy background, shadows obscuring the silhouette";
  const copyPixAI=async(text:string,labelText:string)=>{try{await navigator.clipboard.writeText(text);setPixaiNotice(labelText+" copiado. Todavía no se generó ninguna imagen.");}catch{setPixaiNotice("No se pudo acceder al portapapeles. Selecciona y copia el texto manualmente.");}};

  const save=()=>{const item={...character,id:character.id||crypto.randomUUID()};const next=[item,...saved.filter(old=>old.id!==item.id)];setSaved(next);setCharacter(item);localStorage.setItem(STORE_KEY,JSON.stringify(next));setNotice("Personaje guardado en esta computadora.");};
  const load=(item:Character)=>{setCharacter({...item});setNotice("Ficha cargada. Puedes editar sus opciones.");};
  const remove=(id:string)=>{const next=saved.filter(item=>item.id!==id);setSaved(next);localStorage.setItem(STORE_KEY,JSON.stringify(next));setNotice("Ficha eliminada de la biblioteca local.");};
  const exportJson=()=>{const blob=new Blob([JSON.stringify(character,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(character.name||"personaje").replace(/[^\p{L}\p{N}_-]+/gu,"-")+".json";a.click();URL.revokeObjectURL(url);};
  const exportSvg=()=>{const svg=document.querySelector(".cc-figure");if(!svg)return;const clone=svg.cloneNode(true) as SVGElement;clone.setAttribute("xmlns","http://www.w3.org/2000/svg");const blob=new Blob([new XMLSerializer().serializeToString(clone)],{type:"image/svg+xml"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=(character.name||"personaje").replace(/[^\p{L}\p{N}_-]+/gu,"-")+".svg";a.click();URL.revokeObjectURL(url);};
  return <section className="character-catalog-studio" data-testid="character-catalog-studio" aria-labelledby="cc-title">
    <style>{`
      .character-catalog-studio{margin:16px 0 26px;padding:22px;border:1px solid #3c3654;border-radius:18px;background:linear-gradient(145deg,#171522,#111019);color:#f7f4ff}
      .character-catalog-studio *{box-sizing:border-box}.cc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap}.cc-head h2{margin:0 0 6px;font-size:23px}.cc-head p{margin:0;color:#bdb7d1;line-height:1.45}.cc-label{font-size:10px;letter-spacing:.14em;color:#a99aff;font-weight:800}
      .cc-layout{display:grid;grid-template-columns:minmax(210px,.8fr) minmax(260px,1.2fr);gap:22px;margin-top:20px}.cc-preview{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:390px;border:1px solid #37324a;border-radius:14px;background:radial-gradient(ellipse at 50% 38%,#38304f,#1b1828 70%);overflow:hidden}.cc-figure{width:min(100%,260px);height:auto;max-height:390px}.cc-name{width:calc(100% - 24px);margin:0 12px 12px;padding:10px;border:1px solid #49435f;border-radius:9px;background:#0c0c13;color:white;font:inherit}.cc-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.cc-field{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#d8d2e9}.cc-field select{width:100%;min-width:0;border:1px solid #49445e;border-radius:9px;background:#0c0c13;color:#fff;padding:11px 9px;font:inherit;font-size:13px}.cc-field select:focus,.cc-name:focus{outline:2px solid #9c83ff;outline-offset:1px}.cc-field-full{grid-column:1/-1}.cc-buttons{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.cc-button{border:1px solid #5a526e;border-radius:9px;padding:10px 12px;background:#252136;color:#f7f4ff;font-weight:700;cursor:pointer}.cc-button.primary{background:#a98aff;color:#171022;border-color:#a98aff}.cc-button:hover{filter:brightness(1.08)}.cc-description{margin:12px 0;color:#bdb7d1;font-size:12px;line-height:1.5}.cc-library{margin-top:20px;border-top:1px solid #37324a;padding-top:16px}.cc-library h3{margin:0 0 10px;font-size:14px}.cc-saved{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #302b40}.cc-saved button{background:none;border:0;color:#f2edff;cursor:pointer;text-align:left}.cc-saved small{display:block;color:#a9a2bd;margin-top:3px}.cc-notice{min-height:18px;margin:10px 0 0;color:#a9f0d5;font-size:12px}.cc-fixed{font-size:11px;color:#9ce9d7;padding:8px 10px;border:1px solid #2c665d;border-radius:9px;background:#142822}
      .cc-reference{margin-top:22px;border-top:1px solid #37324a;padding-top:18px}.cc-reference h3{margin:0 0 6px;font-size:16px}.cc-reference-intro{margin:0 0 14px;color:#bdb7d1;font-size:12px;line-height:1.5}.cc-reference-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.cc-reference-card{min-width:0;overflow:hidden;border:1px solid #3c3654;border-radius:12px;background:#1b1828}.cc-reference-card a{color:inherit;text-decoration:none}.cc-reference-card img{display:block;width:100%;height:165px;object-fit:cover;background:#282337}.cc-reference-card div{padding:9px 10px}.cc-reference-card strong{display:block;font-size:12px}.cc-reference-card small{display:block;margin-top:4px;color:#bdb7d1;font-size:11px;line-height:1.4}.cc-reference-note{margin:12px 0 0;color:#a9a2bd;font-size:11px;line-height:1.5}
      @media(max-width:760px){.cc-layout{grid-template-columns:1fr}.cc-preview{min-height:330px}.cc-figure{max-height:320px}.cc-fields{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `}</style>
    <div className="cc-head"><div><div className="cc-label">BOTIMAGEN · MODO SIMPLE</div><h2 id="cc-title">Creador de personajes</h2><p>Elige cada pieza de un catálogo fijo. Sin azar, sin prompts y sin cambiar la pose.</p></div><span className="cc-fixed">POSE BLOQUEADA · VISTA FRONTAL</span></div>
    <div className="cc-layout"><div className="cc-preview"><CharacterFigure character={character}/><div style={{fontWeight:800,letterSpacing:".04em"}}>{character.name||"Mi personaje"}</div><p className="cc-description" style={{textAlign:"center",padding:"0 12px"}}>{description}</p></div>
    <div><label className="cc-field cc-field-full">Nombre del personaje<input className="cc-name" value={character.name} maxLength={60} onChange={event=>update("name",event.target.value)}/></label>
    <div className="cc-fields">{fields.map(([key,title,group])=><label className="cc-field" key={key}>{title}<select aria-label={title} value={character[key]} onChange={event=>update(key,event.target.value)}>{choices[group].map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label>)}</div>
    <div className="cc-buttons"><button type="button" className="cc-button primary" onClick={save}>Guardar personaje</button><button type="button" className="cc-button" onClick={exportSvg}>Exportar SVG</button><button type="button" className="cc-button" onClick={exportJson}>Exportar ficha</button><button type="button" className="cc-button" onClick={()=>{setCharacter({...defaults,id:""});setNotice("Ficha nueva lista.");}}>Nuevo personaje</button></div>
    <p className="cc-notice" role="status">{notice}</p>
    <div className="cc-library"><h3>Biblioteca de personajes · {saved.length}</h3>{saved.length===0?<p className="cc-description">Todavía no guardaste personajes. Tus fichas se conservan en este navegador.</p>:saved.map(item=><div className="cc-saved" key={item.id}><button type="button" onClick={()=>load(item)}><strong>{item.name}</strong><small>{label("hairstyle",item.hairstyle)} · {label("top",item.top)} · {label("eyes",item.eyes)}</small></button><button type="button" aria-label={"Eliminar "+item.name} onClick={()=>remove(item.id)}>Eliminar</button></div>)}</div>
    </div></div>
    <div className="cc-reference" aria-labelledby="cc-reference-title">
      <h3 id="cc-reference-title">Galería visual · Dreamlike Anime 1.0</h3>
      <p className="cc-reference-intro">Muestras publicadas en la ficha oficial del modelo. Úsalas para conocer el estilo general, los rostros, el cabello y la paleta antes de diseñar tu personaje.</p>
      <div className="cc-reference-grid">
        {[
          {src:"https://huggingface.co/dreamlike-art/dreamlike-anime-1.0/resolve/main/anime.jpg",title:"Personaje de cuerpo entero",detail:"Cabello azul, ojos azules y ropa clara · fondo exterior"},
          {src:"https://huggingface.co/dreamlike-art/dreamlike-anime-1.0/resolve/main/dreamlike.jpg",title:"Estilo general",detail:"Ejemplo oficial del acabado y la iluminación"},
          {src:"https://huggingface.co/dreamlike-art/dreamlike-anime-1.0/resolve/main/preview1.jpg",title:"Galería de personajes I",detail:"Variaciones de expresiones, colores y fondos"},
          {src:"https://huggingface.co/dreamlike-art/dreamlike-anime-1.0/resolve/main/preview2.jpg",title:"Galería de personajes II",detail:"Diseños con peinados y paletas diferentes"},
          {src:"https://huggingface.co/dreamlike-art/dreamlike-anime-1.0/resolve/main/preview3.jpg",title:"Galería de personajes III",detail:"Más ejemplos publicados por el autor del modelo"}
        ].map(item=><article className="cc-reference-card" key={item.src}><a href={item.src} target="_blank" rel="noreferrer"><img src={item.src} loading="lazy" alt={item.title}/><div><strong>{item.title}</strong><small>{item.detail}</small></div></a></article>)}
      </div>
      <p className="cc-reference-note">Fuente: <a href="https://huggingface.co/dreamlike-art/dreamlike-anime-1.0" target="_blank" rel="noreferrer" style={{color:"#c7b8ff"}}>ficha oficial de Dreamlike Anime 1.0 en Hugging Face</a>. Estas imágenes son referencias del estilo del modelo, no una garantía de que cada opción del selector produzca exactamente ese resultado. La vista previa de arriba es un boceto esquemático; el catálogo aún necesita piezas ilustradas reales para previsualizar con precisión cada cabello, ojo y accesorio.</p>
    </div>

    <div className="cc-reference" aria-labelledby="cc-pixai-title">
      <h3 id="cc-pixai-title">Prueba económica · PixAI Gen Pibara V1</h3>
      <p className="cc-reference-intro">Prepara una receta a partir de las opciones que elegiste arriba. Estos botones solo copian texto; no generan imágenes ni gastan créditos.</p>
      <div className="cc-buttons">
        <a className="cc-button primary" href="https://pixai.art/en/model/2035047104781084932/2035126237569336174" target="_blank" rel="noreferrer">Abrir Gen Pibara V1 en PixAI ↗</a>
        <button type="button" className="cc-button" onClick={()=>void copyPixAI(pixaiPrompt,"Prompt positivo")}>Copiar prompt positivo</button>
        <button type="button" className="cc-button" onClick={()=>void copyPixAI(pixaiNegative,"Negative prompt")}>Copiar negative prompt</button>
      </div>
      <p className="cc-notice" role="status" aria-live="polite">{pixaiNotice}</p>
      <p className="cc-reference-note"><strong>Primera prueba recomendada:</strong> selecciona manualmente la LoRA Gen Pibara V1 en PixAI, usa intensidad 0,7 como punto de partida si el control está disponible, genera una sola imagen a resolución moderada y conserva la semilla. No uses lotes. Si la LoRA impone rasgos de su personaje y rompe el diseño elegido, compara una única prueba sin el trigger <code>pibara gen</code>. BotImagen no se conecta a PixAI ni inicia generación automática; así evitamos gasto accidental y respetamos que la LoRA se usa dentro de la plataforma.</p>
    </div>
  </section>;
}
