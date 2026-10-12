export type AssetConversionOptions = {
  category: string;
  kind: "modular_piece" | "full_character" | "reference" | "portrait";
  view: "front" | "back" | "side" | "unknown";
  removeFlatBackground: boolean;
  backgroundTolerance: number;
  scalePercent: number;
  offsetX: number;
  offsetY: number;
};

export type NormalizedBounds = { x: number; y: number; width: number; height: number };
export type EstimatedAnchors = Record<string, { x: number; y: number }>;
export type AssetConversionMetadata = {
  schema_version: 1;
  algorithm: "botimagen-png-stage-v1";
  normalized: true;
  canvas_width: 512;
  canvas_height: 768;
  source_width: number;
  source_height: number;
  source_sha256?: string;
  source_format: string;
  background_removed: boolean;
  background_tolerance: number;
  scale_percent: number;
  offset_x: number;
  offset_y: number;
  pose: "front" | "back" | "side" | "unknown";
  rig_category: string;
  content_bounds: NormalizedBounds;
  anchors: EstimatedAnchors;
  anchor_status: "estimated_not_validated";
};
export type NormalizedAsset = { blob: Blob; metadata: AssetConversionMetadata };

const STAGE_WIDTH = 512;
const STAGE_HEIGHT = 768;
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_SOURCE_DIMENSION = 8192;
const MAX_SOURCE_PIXELS = 20_000_000;
const MAX_ANALYSIS_EDGE = 2048;

type Box = { x: number; y: number; width: number; height: number };
const PIECE_ZONES: Record<string, Box> = {
  head: { x: 128, y: 40, width: 256, height: 230 },
  face: { x: 172, y: 91, width: 168, height: 132 },
  hair_back: { x: 110, y: 24, width: 292, height: 260 },
  hair_front: { x: 118, y: 44, width: 276, height: 210 },
  eyes: { x: 164, y: 113, width: 184, height: 56 },
  brows: { x: 164, y: 96, width: 184, height: 35 },
  mouth: { x: 202, y: 154, width: 108, height: 42 },
  clothing_top: { x: 132, y: 168, width: 248, height: 210 },
  clothing_bottom: { x: 152, y: 335, width: 208, height: 155 },
  footwear: { x: 150, y: 626, width: 212, height: 88 },
  accessory_back: { x: 142, y: 170, width: 228, height: 290 },
  accessory_front: { x: 142, y: 190, width: 228, height: 270 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isTransparentCorner(imageData: ImageData): boolean {
  const { width, height, data } = imageData;
  const indices = [0, width - 1, (height - 1) * width, height * width - 1];
  return indices.filter(index => data[index * 4 + 3] <= 12).length >= 3;
}

function removeConnectedFlatBackground(imageData: ImageData, tolerance: number): boolean {
  const { width, height, data } = imageData;
  if (isTransparentCorner(imageData)) return false;
  const total = width * height;
  const corners = [0, width - 1, (height - 1) * width, total - 1];
  const seeds = corners.map(index => ({
    index,
    r: data[index * 4],
    g: data[index * 4 + 1],
    b: data[index * 4 + 2],
    alpha: data[index * 4 + 3],
  })).filter(seed => seed.alpha > 12);
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  const distanceSquared = Math.pow(clamp(tolerance, 0, 100) * Math.sqrt(3), 2);
  let removed = false;

  for (const seed of seeds) {
    if (visited[seed.index]) continue;
    let read = 0;
    let write = 0;
    queue[write++] = seed.index;
    visited[seed.index] = 1;
    while (read < write) {
      const index = queue[read++];
      const pixel = index * 4;
      if (data[pixel + 3] <= 12) continue;
      const dr = data[pixel] - seed.r;
      const dg = data[pixel + 1] - seed.g;
      const db = data[pixel + 2] - seed.b;
      if (index !== seed.index && dr * dr + dg * dg + db * db > distanceSquared) continue;
      if (data[pixel + 3] !== 0) {
        data[pixel + 3] = 0;
        removed = true;
      }

      const x = index % width;
      const neighbours: number[] = [];
      if (x > 0) neighbours.push(index - 1);
      if (x + 1 < width) neighbours.push(index + 1);
      if (index >= width) neighbours.push(index - width);
      if (index + width < total) neighbours.push(index + width);
      for (const next of neighbours) {
        if (visited[next]) continue;
        const p = next * 4;
        if (data[p + 3] <= 12) { visited[next] = 1; continue; }
        const nr = data[p] - seed.r;
        const ng = data[p + 1] - seed.g;
        const nb = data[p + 2] - seed.b;
        if (nr * nr + ng * ng + nb * nb <= distanceSquared) {
          visited[next] = 1;
          queue[write++] = next;
        }
      }
    }
  }
  return removed;
}

function findAlphaBounds(imageData: ImageData): Box | null {
  const { width, height, data } = imageData;
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }
  if (right < left || bottom < top) return null;
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}

function rigCategory(category: string, kind: AssetConversionOptions["kind"]): string {
  if (kind === "full_character" || kind === "portrait") return "full_character";
  const map: Record<string, string> = {
    body: "body", head: "head", face: "face", eyes: "eyes", brows: "brows", mouth: "mouth",
    hair_back: "hair_back", hair_front: "hair_front", clothing_top: "top", clothing_bottom: "bottom",
    footwear: "footwear", accessory_back: "accessory", accessory_front: "accessory",
  };
  return map[category] ?? "reference";
}

function estimateAnchors(category: string, bounds: Box): EstimatedAnchors {
  const x = bounds.x;
  const y = bounds.y;
  const w = bounds.width;
  const h = bounds.height;
  const cx = x + w / 2;
  const point = (px: number, py: number) => ({
    x: Number((clamp(px, 0, STAGE_WIDTH) / STAGE_WIDTH).toFixed(4)),
    y: Number((clamp(py, 0, STAGE_HEIGHT) / STAGE_HEIGHT).toFixed(4)),
  });
  const result: EstimatedAnchors = { origin: point(cx, y + h / 2) };

  if (["body", "portrait", "reference"].includes(category)) {
    Object.assign(result, {
      head: point(cx, y + h * 0.10), neck: point(cx, y + h * 0.19),
      shoulder_l: point(x + w * 0.30, y + h * 0.22), shoulder_r: point(x + w * 0.70, y + h * 0.22),
      waist: point(cx, y + h * 0.48), hip: point(cx, y + h * 0.58),
      elbow_l: point(x + w * 0.12, y + h * 0.37), elbow_r: point(x + w * 0.88, y + h * 0.37),
      hand_l: point(x + w * 0.09, y + h * 0.51), hand_r: point(x + w * 0.91, y + h * 0.51),
      knee_l: point(x + w * 0.39, y + h * 0.78), knee_r: point(x + w * 0.61, y + h * 0.78),
      ankle_l: point(x + w * 0.39, y + h * 0.95), ankle_r: point(x + w * 0.61, y + h * 0.95),
    });
  } else if (["head", "face", "eyes", "brows", "mouth"].includes(category)) {
    Object.assign(result, { head: point(cx, y + h * 0.08), neck: point(cx, y + h * 0.92) });
  } else if (["hair_back", "hair_front"].includes(category)) {
    result.head = point(cx, y + h * 0.45);
  } else if (category === "clothing_top") {
    Object.assign(result, {
      shoulder_l: point(x + w * 0.20, y + h * 0.13),
      shoulder_r: point(x + w * 0.80, y + h * 0.13),
      waist: point(cx, y + h * 0.92),
    });
  } else if (category === "clothing_bottom") {
    Object.assign(result, { waist: point(cx, y + h * 0.08), hip: point(cx, y + h * 0.26) });
  } else if (category === "footwear") {
    Object.assign(result, { ankle_l: point(x + w * 0.25, y + h * 0.35), ankle_r: point(x + w * 0.75, y + h * 0.35) });
  }
  return result;
}

async function sha256(file: File): Promise<string | undefined> {
  try {
    if (!globalThis.crypto?.subtle) return undefined;
    const digest = await globalThis.crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  } catch {
    return undefined;
  }
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("No se pudo codificar el PNG convertido.")), "image/png");
  });
}

export async function convertToModularStage(file: File, options: AssetConversionOptions): Promise<NormalizedAsset> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Formato no admitido. Selecciona PNG, JPEG o WebP.");
  }
  if (!file.size || file.size > MAX_SOURCE_BYTES) throw new Error("La imagen debe ocupar entre 1 byte y 12 MiB.");
  const source = await createImageBitmap(file);
  try {
    if (source.width < 1 || source.height < 1 || source.width > MAX_SOURCE_DIMENSION || source.height > MAX_SOURCE_DIMENSION ||
        source.width * source.height > MAX_SOURCE_PIXELS) {
      throw new Error("La imagen supera el límite de 8192 px por lado o 20 megapíxeles.");
    }
    const downscale = Math.min(1, MAX_ANALYSIS_EDGE / Math.max(source.width, source.height), Math.sqrt(4_000_000 / (source.width * source.height)));
    const width = Math.max(1, Math.round(source.width * downscale));
    const height = Math.max(1, Math.round(source.height * downscale));
    const workCanvas = document.createElement("canvas");
    workCanvas.width = width;
    workCanvas.height = height;
    const workContext = workCanvas.getContext("2d", { willReadFrequently: true });
    if (!workContext) throw new Error("El navegador no ofrece Canvas 2D.");
    workContext.clearRect(0, 0, width, height);
    workContext.drawImage(source, 0, 0, width, height);
    const workPixels = workContext.getImageData(0, 0, width, height);
    const backgroundRemoved = options.removeFlatBackground
      ? removeConnectedFlatBackground(workPixels, options.backgroundTolerance)
      : false;
    if (backgroundRemoved) workContext.putImageData(workPixels, 0, 0);
    const sourceBounds = findAlphaBounds(backgroundRemoved ? workContext.getImageData(0, 0, width, height) : workPixels);
    if (!sourceBounds) throw new Error("No quedó contenido visible. Reduce la tolerancia de fondo o desactiva la eliminación.");
    const zone = options.kind === "modular_piece" && !["body", "portrait", "reference"].includes(options.category)
      ? PIECE_ZONES[options.category] ?? { x: 36, y: 24, width: 440, height: 720 }
      : { x: 28, y: 18, width: 456, height: 732 };
    const fitScale = Math.min(zone.width / sourceBounds.width, zone.height / sourceBounds.height) * clamp(options.scalePercent, 50, 150) / 100;
    const drawWidth = Math.max(1, sourceBounds.width * fitScale);
    const drawHeight = Math.max(1, sourceBounds.height * fitScale);
    const dx = zone.x + (zone.width - drawWidth) / 2 + clamp(options.offsetX, -200, 200);
    const dy = zone.y + (zone.height - drawHeight) / 2 + clamp(options.offsetY, -240, 240);
    const stageCanvas = document.createElement("canvas");
    stageCanvas.width = STAGE_WIDTH;
    stageCanvas.height = STAGE_HEIGHT;
    const stageContext = stageCanvas.getContext("2d", { willReadFrequently: true });
    if (!stageContext) throw new Error("El navegador no ofrece Canvas 2D.");
    stageContext.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT);
    stageContext.imageSmoothingEnabled = true;
    stageContext.imageSmoothingQuality = "high";
    stageContext.drawImage(workCanvas, sourceBounds.x, sourceBounds.y, sourceBounds.width, sourceBounds.height, dx, dy, drawWidth, drawHeight);
    const finalBounds = findAlphaBounds(stageContext.getImageData(0, 0, STAGE_WIDTH, STAGE_HEIGHT));
    if (!finalBounds) throw new Error("La conversión no produjo una imagen visible.");
    const blob = await canvasToPng(stageCanvas);
    const sourceSha = await sha256(file);
    const anchors = estimateAnchors(options.kind === "full_character" || options.kind === "portrait" ? "portrait" : options.category, finalBounds);
    const metadata: AssetConversionMetadata = {
      schema_version: 1, algorithm: "botimagen-png-stage-v1", normalized: true,
      canvas_width: STAGE_WIDTH, canvas_height: STAGE_HEIGHT,
      source_width: source.width, source_height: source.height,
      ...(sourceSha ? { source_sha256: sourceSha } : {}),
      source_format: file.type, background_removed: backgroundRemoved,
      background_tolerance: Math.round(clamp(options.backgroundTolerance, 0, 100)),
      scale_percent: Math.round(clamp(options.scalePercent, 50, 150)),
      offset_x: Math.round(clamp(options.offsetX, -200, 200)),
      offset_y: Math.round(clamp(options.offsetY, -240, 240)),
      pose: options.view, rig_category: rigCategory(options.category, options.kind),
      content_bounds: {
        x: finalBounds.x, y: finalBounds.y, width: finalBounds.width, height: finalBounds.height,
      },
      anchors, anchor_status: "estimated_not_validated",
    };
    source.close();
    return { blob, metadata };
  } catch (error) {
    source.close();
    throw error;
  }
}
