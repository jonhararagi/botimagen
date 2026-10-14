import { useEffect, useMemo, useRef, useState } from "react";

type CharacterPng = {
  id: string;
  name: string;
  addedAt: number;
  width: number;
  height: number;
  bytes: number;
  category: "universal-character";
  blob: Blob;
};

const DB_NAME = "botimagen-anime-png-library";
const STORE_NAME = "characters";
const MAX_FILE_BYTES = 25 * 1024 * 1024;

function openLibrary(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("addedAt", "addedAt");
        store.createIndex("name", "name");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir la biblioteca local."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falló una operación de biblioteca."));
  });
}

async function readAll(): Promise<CharacterPng[]> {
  const db = await openLibrary();
  try {
    const tx = db.transaction(STORE_NAME, "readonly");
    const records = await requestResult(tx.objectStore(STORE_NAME).getAll()) as CharacterPng[];
    return records.sort((a, b) => b.addedAt - a.addedAt);
  } finally {
    db.close();
  }
}

async function storeCharacter(record: CharacterPng): Promise<void> {
  const db = await openLibrary();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo guardar el PNG."));
      tx.onabort = () => reject(tx.error ?? new Error("Se canceló el guardado del PNG."));
    });
  } finally {
    db.close();
  }
}

async function removeCharacter(id: string): Promise<void> {
  const db = await openLibrary();
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo eliminar el PNG."));
      tx.onabort = () => reject(tx.error ?? new Error("Se canceló la eliminación."));
    });
  } finally {
    db.close();
  }
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function AnimePngLibrary() {
  const [items, setItems] = useState<CharacterPng[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Importá PNG de personajes anime de cuerpo completo o sprites con fondo transparente.");
  const [selected, setSelected] = useState<CharacterPng | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    try {
      setItems(await readAll());
    } catch {
      setMessage("El navegador no permitió abrir la biblioteca local. Probá en Chrome o Edge y revisá el almacenamiento del sitio.");
    }
  };

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter(item => item.name.toLocaleLowerCase().includes(normalized) || "anime personaje universal cuerpo completo sprite png".includes(normalized));
  }, [items, query]);

  const importFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setBusy(true);
    let added = 0;
    let skipped = 0;
    const problems: string[] = [];
    try {
      for (const file of Array.from(fileList)) {
        if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
          skipped++;
          continue;
        }
        if (file.size > MAX_FILE_BYTES || file.size === 0) {
          skipped++;
          problems.push(`${file.name}: tamaño no válido (máximo 25 MB)`);
          continue;
        }
        try {
          const bitmap = await createImageBitmap(file);
          const width = bitmap.width;
          const height = bitmap.height;
          bitmap.close();
          if (width < 128 || height < 128) {
            skipped++;
            problems.push(`${file.name}: resolución demasiado pequeña (${width}×${height})`);
            continue;
          }
          const id = `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;
          await storeCharacter({
            id, name: file.name, addedAt: Date.now(), width, height,
            bytes: file.size, category: "universal-character", blob: file.slice(0, file.size, "image/png"),
          });
          added++;
        } catch {
          skipped++;
          problems.push(`${file.name}: PNG ilegible o almacenamiento lleno`);
        }
      }
      await refresh();
      setMessage(`Importados ${added} PNG de personaje. Omitidos: ${skipped}.${problems.length ? ` ${problems.slice(0, 3).join(" · ")}` : ""}`);
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const download = (item: CharacterPng) => {
    const url = URL.createObjectURL(item.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = item.name;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const deleteItem = async (item: CharacterPng) => {
    if (!window.confirm(`¿Eliminar "${item.name}" de la biblioteca local? El archivo original de tu PC no se toca.`)) return;
    await removeCharacter(item.id);
    if (selected?.id === item.id) setSelected(null);
    await refresh();
    setMessage(`Eliminado de la biblioteca: ${item.name}`);
  };

  return (
    <section className="anime-png-library" aria-labelledby="anime-png-library-title">
      <style>{`
        .anime-png-library{margin:24px 0;padding:22px;border:1px solid #34344a;border-radius:18px;background:linear-gradient(145deg,#171725,#101018);color:#f5f3ff}
        .anime-png-library *{box-sizing:border-box}.anime-png-head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap}
        .anime-png-library h2{margin:0 0 7px;font-size:20px}.anime-png-library p{margin:0;color:#b8b6cb;line-height:1.5}
        .anime-png-actions{display:flex;gap:8px;flex-wrap:wrap}.anime-png-library button,.anime-png-library input{font:inherit}
        .anime-png-library button{border:1px solid #595078;border-radius:10px;padding:10px 13px;background:#28243b;color:#fff;cursor:pointer}
        .anime-png-library button:disabled{opacity:.55;cursor:wait}.anime-png-library .anime-png-primary{background:#9b5cff;border-color:#b58aff;color:#130b20;font-weight:700}
        .anime-png-toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:18px 0}
        .anime-png-search{flex:1;min-width:190px;border:1px solid #45445b;border-radius:10px;padding:11px 12px;background:#0c0c13;color:#fff}
        .anime-png-count{color:#d3c4ff;font-size:13px}.anime-png-note{font-size:12px;margin-top:8px!important}
        .anime-png-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:12px}
        .anime-png-card{overflow:hidden;border:1px solid #353449;border-radius:12px;background:#11111a;min-width:0}
        .anime-png-thumb{height:190px;padding:8px;display:flex;align-items:center;justify-content:center;background-color:#1c1c2a;background-image:linear-gradient(45deg,#272738 25%,transparent 25%),linear-gradient(-45deg,#272738 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#272738 75%),linear-gradient(-45deg,transparent 75%,#272738 75%);background-size:16px 16px;background-position:0 0,0 8px,8px -8px,-8px 0}
        .anime-png-thumb img{width:100%;height:100%;object-fit:contain}.anime-png-meta{padding:10px}.anime-png-name{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px;color:#f0eaff}
        .anime-png-dim{font-size:11px;color:#a7a4bb}.anime-png-card-actions{display:flex;gap:6px;margin-top:9px}.anime-png-card-actions button{flex:1;padding:7px 4px;font-size:11px}
        .anime-png-empty{padding:30px 16px;border:1px dashed #4a4562;border-radius:12px;text-align:center;color:#c3bddb}
        .anime-png-modal{position:fixed;inset:0;z-index:1000;background:#05050be8;display:flex;align-items:center;justify-content:center;padding:20px}
        .anime-png-modal-inner{max-width:720px;width:100%;max-height:90vh;overflow:auto;background:#171725;border:1px solid #4b4566;border-radius:16px;padding:16px}
        .anime-png-modal img{display:block;max-width:100%;max-height:65vh;margin:12px auto;object-fit:contain}
      `}</style>
      <div className="anime-png-head">
        <div>
          <h2 id="anime-png-library-title">Biblioteca universal de personajes anime PNG</h2>
          <p>Galería de personajes completos, sprites y referencias de arte real. Importá colecciones grandes, buscá por nombre y revisá cada PNG sobre fondo de transparencia.</p>
          <p className="anime-png-note">Los archivos quedan en este navegador, no se suben a GitHub ni a ningún servidor. Importá solo arte propio o con permiso/licencia de uso.</p>
        </div>
        <div className="anime-png-actions">
          <input ref={fileInput} type="file" accept="image/png,.png" multiple hidden onChange={event => void importFiles(event.target.files)} />
          <button className="anime-png-primary" type="button" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? "Importando…" : "＋ Importar PNG"}</button>
        </div>
      </div>
      <div className="anime-png-toolbar">
        <input className="anime-png-search" aria-label="Buscar PNG de personajes" placeholder="Buscar por nombre de archivo…" value={query} onChange={event => setQuery(event.target.value)} />
        <span className="anime-png-count">{filtered.length.toLocaleString()} / {items.length.toLocaleString()} personajes</span>
      </div>
      <p role="status" aria-live="polite" className="anime-png-note">{message}</p>
      {filtered.length ? <div className="anime-png-grid" style={{ marginTop: 14 }}>
        {filtered.map(item => {
          return <AnimePngCard key={item.id} item={item} onPreview={() => setSelected(item)} onDownload={() => download(item)} onDelete={() => void deleteItem(item)} />;
        })}
      </div> : <div className="anime-png-empty" style={{ marginTop: 14 }}>
        <strong>{items.length ? "No hay resultados con ese nombre." : "La biblioteca está lista para recibir tu colección."}</strong>
        <p style={{ marginTop: 8 }}>{items.length ? "Probá con otra búsqueda o borrá el filtro." : "Seleccioná cientos o miles de PNG desde tu PC. Se mostrarán como miniaturas y se conservarán localmente entre sesiones."}</p>
        {!items.length && <button className="anime-png-primary" style={{ marginTop: 14 }} type="button" onClick={() => fileInput.current?.click()}>Elegir archivos PNG</button>}
      </div>}
      {selected && <div className="anime-png-modal" role="dialog" aria-modal="true" aria-label={selected.name} onClick={() => setSelected(null)}>
        <div className="anime-png-modal-inner" onClick={event => event.stopPropagation()}>
          <div className="anime-png-head"><div><strong>{selected.name}</strong><p className="anime-png-note">{selected.width} × {selected.height} px · {formatBytes(selected.bytes)} · Clase universal: personaje completo</p></div><button type="button" onClick={() => setSelected(null)}>Cerrar ✕</button></div>
          <AnimePngImage blob={selected.blob} alt={selected.name} />
          <div className="anime-png-actions"><button className="anime-png-primary" type="button" onClick={() => download(selected)}>Descargar original</button><button type="button" onClick={() => void deleteItem(selected)}>Quitar de biblioteca</button></div>
        </div>
      </div>}
    </section>
  );
}

function AnimePngCard({ item, onPreview, onDownload, onDelete }: {
  item: CharacterPng; onPreview: () => void; onDownload: () => void; onDelete: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return <article className="anime-png-card">
    <button type="button" className="anime-png-thumb" aria-label={`Ver ${item.name}`} onClick={onPreview} style={{ width: "100%", border: 0, borderRadius: 0, padding: 8 }}>
      {!failed ? <AnimePngImage blob={item.blob} alt={item.name} onError={() => setFailed(true)} /> : <span>PNG no disponible</span>}
    </button>
    <div className="anime-png-meta">
      <div className="anime-png-name" title={item.name}>{item.name}</div>
      <div className="anime-png-dim">{item.width}×{item.height} · {formatBytes(item.bytes)}</div>
      <div className="anime-png-card-actions"><button type="button" onClick={onPreview}>Ver</button><button type="button" onClick={onDownload}>Bajar</button><button type="button" onClick={onDelete} aria-label={`Eliminar ${item.name}`}>✕</button></div>
    </div>
  </article>;
}

function AnimePngImage({ blob, alt, onError }: { blob: Blob; alt: string; onError?: () => void }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return src ? <img src={src} alt={alt} onError={onError} /> : null;
}
