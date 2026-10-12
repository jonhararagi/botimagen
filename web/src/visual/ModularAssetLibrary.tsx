import { useEffect, useRef, useState } from "react";

type UserAsset = {
  id: string; label: string; category: string; kind: string; filename: string;
  mime_type: string; width: number; height: number; bytes: number; sha256: string;
  view: string; license: string; source_url: string; duplicate?: boolean; available?: boolean;
};
const categories = [
  ["reference", "Referencia / clasificar después"], ["body", "Cuerpo base"], ["head", "Cabeza"],
  ["face", "Rostro"], ["hair_back", "Cabello posterior"], ["hair_front", "Cabello frontal"],
  ["eyes", "Ojos"], ["brows", "Cejas"], ["mouth", "Boca"], ["clothing_top", "Prenda superior"],
  ["clothing_bottom", "Prenda inferior"], ["footwear", "Calzado"], ["accessory_back", "Accesorio posterior"],
  ["accessory_front", "Accesorio frontal"], ["portrait", "Retrato / personaje completo"],
] as const;

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result.split(",")[1] || "") : reject(new Error("Archivo ilegible."));
    reader.readAsDataURL(file);
  });
}

export function ModularAssetLibrary() {
  const input = useRef<HTMLInputElement>(null);
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [previews, setPreviews] = useState<Array<{file:File;url:string}>>([]);
  const [category, setCategory] = useState("reference");
  const [kind, setKind] = useState("reference");
  const [license, setLicense] = useState("UNVERIFIED");
  const [sourceUrl, setSourceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Biblioteca local persistente");
  const refresh = async () => {
    const response = await fetch("/api/modular-assets");
    if (!response.ok) throw new Error("No se pudo leer la biblioteca local.");
    const data = await response.json();
    setAssets(Array.isArray(data.assets) ? data.assets : []);
  };
  useEffect(() => { void refresh().catch(e => setStatus(e instanceof Error ? e.message : "API local no disponible")); }, []);
  useEffect(() => () => previews.forEach(item => URL.revokeObjectURL(item.url)), [previews]);
  const selectFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files);
    const next = accepted.filter(file => ["image/png","image/jpeg","image/webp"].includes(file.type) && file.size > 0 && file.size <= 12 * 1024 * 1024);
    if (next.length !== accepted.length) setStatus("Se omitieron archivos vacíos, mayores de 12 MiB o con formato no admitido.");
    setPreviews(current => [...current, ...next.map(file => ({file, url:URL.createObjectURL(file)}))]);
  };
  const importFiles = async () => {
    if (!previews.length || busy) return;
    setBusy(true);
    let added = 0;
    try {
      for (const item of previews) {
        const data_base64 = await readDataUrl(item.file);
        const response = await fetch("/api/modular-assets", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({filename:item.file.name,mime_type:item.file.type,data_base64,category,kind,license,source_url:sourceUrl,view:"unknown",label:item.file.name.replace(/\.[^.]+$/,"")})
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Falló la importación.");
        added++;
      }
      setPreviews([]);
      await refresh();
      setStatus(`Importación completada: ${added} archivo(s). Los originales quedan en la biblioteca local.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Error de importación.");
    } finally { setBusy(false); }
  };
  return <section className="modular-library" aria-label="Biblioteca modular 2D">
    <div className="modular-library-head"><div><small>ASSET INTAKE · OFFLINE FIRST</small><h3>Biblioteca gráfica modular</h3><p>Importa piezas o personajes de referencia. Los retratos completos no se anuncian como piezas intercambiables.</p></div><b>{assets.length} RECURSOS</b></div>
    <div className="modular-library-controls">
      <label>Clasificación inicial<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      <label>Tipo de recurso<select value={kind} onChange={e=>setKind(e.target.value)}><option value="reference">Referencia sin anclajes</option><option value="portrait">Personaje completo / retrato</option><option value="modular_piece">Pieza modular (requiere anclajes validados)</option></select></label>
      <label>Licencia / derechos<input value={license} onChange={e=>setLicense(e.target.value)} maxLength={1000} /></label>
      <label>URL de procedencia<input value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} placeholder="https://… (opcional)" maxLength={1000} /></label>
    </div>
    <div className="modular-dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();selectFiles(e.dataTransfer.files)}}>
      <strong>Arrastra imágenes aquí</strong><span>PNG, JPEG o WebP · máximo 12 MiB y 20 MP por archivo</span>
      <button type="button" className="btn muted" onClick={()=>input.current?.click()}>Seleccionar archivos</button>
      <input ref={input} hidden type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={e=>{selectFiles(e.target.files);e.currentTarget.value=""}} />
    </div>
    {previews.length>0 && <div className="modular-preview-grid">{previews.map((item,i)=><div key={item.url}><img src={item.url} alt={item.file.name}/><span>{item.file.name}</span><button type="button" onClick={()=>setPreviews(current=>current.filter((_,j)=>i!==j))}>Quitar</button></div>)}</div>}
    <div className="modular-library-actions"><button className="btn primary" type="button" disabled={!previews.length||busy} onClick={()=>void importFiles()}>{busy?"Importando…":`Importar ${previews.length} archivo(s)`}</button><button className="btn muted" type="button" disabled={busy} onClick={()=>void refresh()}>Actualizar biblioteca</button><span role="status">{status}</span></div>
    <div className="modular-asset-list">{assets.map(asset=><article key={asset.id}><b>{asset.label}</b><span>{asset.category} · {asset.kind} · {asset.width}×{asset.height}</span><small>{asset.filename} · SHA-256 {asset.sha256.slice(0,16)}… · licencia: {asset.license}</small></article>)}</div>
  </section>;
}
