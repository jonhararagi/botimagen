import { useEffect, useMemo, useState } from "react";

type AssetContract = {
  id: string; title: string; description: string; destination: string;
  expected: { format: "PNG"; width?: number; height?: number; max_bytes?: number };
};
type ContractResponse = { count: number; contracts: AssetContract[] };
type ImportResponse = { status: "imported"; asset_id: string; destination: string; bytes: number; width: number; height: number };

export default function AssetImporter() {
  const [contracts, setContracts] = useState<AssetContract[]>([]);
  const [assetId, setAssetId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<ImportResponse | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/assets/contracts").then(async response => {
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "No se pudieron cargar los contratos.");
      return body as ContractResponse;
    }).then(body => {
      if (!alive) return;
      setContracts(body.contracts);
      setAssetId(body.contracts[0]?.id ?? "");
    }).catch(reason => {
      if (alive) setError(reason instanceof Error ? reason.message : "No se pudieron cargar los contratos.");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const contract = useMemo(() => contracts.find(item => item.id === assetId) ?? null, [contracts, assetId]);
  function chooseFile(next: File | null) { setFile(next); setError(""); setConfirmation(null); }

  async function importFile() {
    if (!contract || !file) { setError("Elige un contrato y un archivo PNG antes de importar."); return; }
    const maxBytes = contract.expected.max_bytes ?? 12 * 1024 * 1024;
    if (file.size <= 0 || file.size > maxBytes) {
      setError("El archivo debe ocupar entre 1 y " + maxBytes.toLocaleString("es-AR") + " bytes.");
      return;
    }
    setBusy(true); setError(""); setConfirmation(null);
    try {
      const response = await fetch("/api/assets/import?asset_id=" + encodeURIComponent(contract.id), {
        method: "POST", headers: { "Content-Type": "image/png" }, body: file,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || ("La importación falló (HTTP " + response.status + ")."));
      if (body.status !== "imported" || body.asset_id !== contract.id || body.destination !== contract.destination
          || !Number.isSafeInteger(body.bytes) || body.bytes <= 0\n          || !Number.isSafeInteger(body.width) || body.width <= 0\n          || !Number.isSafeInteger(body.height) || body.height <= 0) {
        throw new Error("El servidor devolvió una confirmación de importación inesperada.");
      }
      setConfirmation(body as ImportResponse); setFile(null);
      const input = document.getElementById("asset-png-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo importar el PNG.");
    } finally { setBusy(false); }
  }

  return <section className="asset-importer" aria-labelledby="asset-import-title">
    <div className="asset-import-heading">
      <div><div className="kicker"><span><i>04</i> INTAKE DE ASSETS</span><small>CONTRATOS OFICIALES</small></div>
        <h2 id="asset-import-title">Importar PNG local</h2>
        <p>El destino lo determina el manifiesto. El servidor valida la imagen y nunca sobrescribe un asset existente.</p>
      </div><span className="asset-local-tag">SOLO LOCAL</span>
    </div>
    {loading ? <p role="status">Cargando contratos oficiales…</p> : contracts.length === 0 ? <p role="alert">No hay contratos PNG disponibles. {error}</p> : <>
      <label className="asset-label" htmlFor="asset-contract">Contrato de destino</label>
      <select id="asset-contract" value={assetId} disabled={busy} onChange={event => { setAssetId(event.target.value); setConfirmation(null); setError(""); }}>
        {contracts.map(item => <option key={item.id} value={item.id}>{item.title} · {item.id}</option>)}
      </select>
      {contract && <div className="asset-contract-card">
        <strong>{contract.title}</strong><p>{contract.description}</p>
        <dl><div><dt>Destino canónico</dt><dd>{contract.destination}</dd></div>
          <div><dt>Dimensiones</dt><dd>{contract.expected.width && contract.expected.height ? contract.expected.width + " × " + contract.expected.height + " px" : "Definidas por el archivo"}</dd></div>
          <div><dt>Tamaño máximo</dt><dd>{(contract.expected.max_bytes ?? 12 * 1024 * 1024).toLocaleString("es-AR")} bytes</dd></div>
        </dl>
      </div>}
      <label className="asset-label" htmlFor="asset-png-file">Archivo PNG de tu equipo</label>
      <input id="asset-png-file" type="file" accept=".png,image/png" disabled={busy} onChange={event => chooseFile(event.target.files?.[0] ?? null)} />
      {file && <p className="asset-file-selected">Seleccionado: <strong>{file.name}</strong> · {file.size.toLocaleString("es-AR")} bytes. La validez real se comprueba en el servidor.</p>}
      <button className="btn primary asset-import-button" type="button" disabled={busy || loading || !contract || !file} onClick={() => void importFile()}>{busy ? "Validando e importando…" : "Importar PNG validado →"}</button>
    </>}
    {error && <p className="asset-feedback asset-error" role="alert">{error}</p>}
    {confirmation && <p className="asset-feedback asset-success" role="status">Importación confirmada por el servidor: {confirmation.destination} · {confirmation.width} × {confirmation.height} px · {confirmation.bytes.toLocaleString("es-AR")} bytes.</p>}
  </section>;
}
