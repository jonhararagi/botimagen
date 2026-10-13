export type AlphaPiece = {
  file: File;
  componentIndex: number;
  bounds: { x: number; y: number; width: number; height: number };
};

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_DIMENSION = 8192;
const MAX_PIXELS = 20_000_000;
const MAX_ANALYSIS_EDGE = 2048;

/** Split a transparent PNG sprite sheet into independent visible islands. */
export async function splitTransparentPng(file: File): Promise<AlphaPiece[]> {
  if (file.type !== "image/png") throw new Error("La separación automática requiere un PNG con transparencia.");
  if (!file.size || file.size > MAX_BYTES) throw new Error("El PNG debe ocupar entre 1 byte y 12 MiB.");
  const source = await createImageBitmap(file);
  try {
    if (!source.width || !source.height || source.width > MAX_DIMENSION || source.height > MAX_DIMENSION ||
      source.width * source.height > MAX_PIXELS) throw new Error("La imagen supera 8192 px por lado o 20 megapíxeles.");
    const scale = Math.min(1, MAX_ANALYSIS_EDGE / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("El navegador no ofrece Canvas 2D.");
    ctx.drawImage(source, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const total = width * height;
    const visited = new Uint8Array(total), labels = new Int32Array(total), queue = new Int32Array(total);
    const parts: Array<{ id:number; left:number; top:number; right:number; bottom:number }> = [];
    const minimum = Math.max(6, Math.floor(total * 0.000005));
    for (let start = 0; start < total; start++) {
      if (visited[start] || pixels[start * 4 + 3] <= 12) continue;
      let read = 0, write = 0;
      queue[write++] = start; visited[start] = 1;
      const id = parts.length + 1;
      let left = width, top = height, right = -1, bottom = -1;
      while (read < write) {
        const at = queue[read++], x = at % width, y = Math.floor(at / width);
        labels[at] = id;
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
        const ns = [x > 0 ? at - 1 : -1, x + 1 < width ? at + 1 : -1, y > 0 ? at - width : -1,
          y + 1 < height ? at + width : -1, x > 0 && y > 0 ? at - width - 1 : -1,
          x + 1 < width && y > 0 ? at - width + 1 : -1, x > 0 && y + 1 < height ? at + width - 1 : -1,
          x + 1 < width && y + 1 < height ? at + width + 1 : -1];
        for (const next of ns) {
          if (next < 0 || visited[next] || pixels[next * 4 + 3] <= 12) continue;
          visited[next] = 1; queue[write++] = next;
        }
      }
      if (write >= minimum && right - left >= 2 && bottom - top >= 2) parts.push({id,left,top,right,bottom});
      else for (let y=top;y<=bottom;y++) for(let x=left;x<=right;x++){const at=y*width+x;if(labels[at]===id)labels[at]=0;}
    }
    if (parts.length < 2) throw new Error("No se detectaron dos o más piezas separadas por transparencia. Usa un PNG con huecos transparentes entre piezas o dibuja el contorno manual.");
    parts.sort((a,b)=>a.top-b.top||a.left-b.left);
    const result: AlphaPiece[] = [];
    const stem = file.name.replace(/\.[^.]+$/, "") || "sprite";
    for (let i=0;i<parts.length;i++) {
      const p=parts[i], w=p.right-p.left+1, h=p.bottom-p.top+1;
      const out=document.createElement("canvas"); out.width=w; out.height=h;
      const outCtx=out.getContext("2d");
      if(!outCtx)throw new Error("No se pudo crear el lienzo de una pieza.");
      const image=outCtx.createImageData(w,h);
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const src=(p.top+y)*width+p.left+x;
        if(labels[src]!==p.id)continue;
        const from=src*4,to=(y*w+x)*4;
        image.data[to]=pixels[from];image.data[to+1]=pixels[from+1];image.data[to+2]=pixels[from+2];image.data[to+3]=pixels[from+3];
      }
      outCtx.putImageData(image,0,0);
      const blob=await new Promise<Blob>((resolve,reject)=>out.toBlob(v=>v?resolve(v):reject(new Error("No se pudo exportar una pieza PNG.")),"image/png"));
      result.push({file:new File([blob],`${stem}-pieza-${String(i+1).padStart(2,"0")}.png`,{type:"image/png"}),componentIndex:i+1,
        bounds:{x:Math.round(p.left/width*source.width),y:Math.round(p.top/height*source.height),width:Math.round(w/width*source.width),height:Math.round(h/height*source.height)}});
    }
    return result;
  } finally { source.close(); }
}
