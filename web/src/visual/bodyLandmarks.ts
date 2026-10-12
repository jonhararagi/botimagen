/** Shared anatomy landmarks in the renderer's existing 340×490 SVG coordinate space. */
export type BodyView = "front" | "back";
export type Landmark = Readonly<{ x: number; y: number }>;

export type BodyLandmarkSet = Readonly<{
  view: BodyView;
  headTop: Landmark; headCenter: Landmark;
  neckLeft: Landmark; neckLeftBase: Landmark; neckRightBase: Landmark; neckRight: Landmark;
  shoulderLeft: Landmark; shoulderPeak: Landmark; shoulderRight: Landmark;
  torsoShoulderLeft: Landmark; torsoShoulderRight: Landmark;
  chestLeft: Landmark; chestCenter: Landmark; chestRight: Landmark;
  waistLeft: Landmark; waistRight: Landmark; hemLeft: Landmark; hemCenter: Landmark; hemRight: Landmark;
  elbowLeft: Landmark; elbowRight: Landmark; wristLeft: Landmark; wristRight: Landmark;
  handLeft: Landmark; handRight: Landmark;
  pelvisLeft: Landmark; pelvisCenter: Landmark; pelvisRight: Landmark;
  kneeLeft: Landmark; kneeRight: Landmark; ankleLeft: Landmark; ankleRight: Landmark;
  footLeft: Landmark; footRight: Landmark;
}>;

const SVG_LAYER_ORDER = [
  "ground-shadow", "hair-back", "neck", "arm-skin", "hands", "base-sleeves",
  "base-torso", "lower-body", "footwear", "outfit", "outer-layer",
  "surface-details", "chromapatch",
] as const;
export type SvgLayerId = typeof SVG_LAYER_ORDER[number];
export { SVG_LAYER_ORDER };
export function svgLayerIndex(layer: SvgLayerId): number {
  return SVG_LAYER_ORDER.indexOf(layer);
}

/**
 * Shared silhouette anchors for both views. The upper torso is raised and
 * shoulders are slightly tightened to reduce the compact, shoulder-heavy read;
 * the hip/knee/ankle chain remains aligned to the existing lower-body paths.
 * Garment length and waist controls still determine the lower torso anchors.
 */
export function getBodyLandmarks(view: BodyView, hemY: number, waistHalf: number): BodyLandmarkSet {
  const rear = view === "back";
  return {
    view, headTop: { x: 170, y: 80 }, headCenter: { x: 170, y: 145 },
    neckLeft: { x: 139, y: 188 }, neckLeftBase: { x: 137, y: 226 },
    neckRightBase: { x: 203, y: 226 }, neckRight: { x: 201, y: 188 },
    shoulderLeft: { x: 120, y: 251 }, shoulderPeak: { x: 170, y: 230 },
    shoulderRight: { x: 220, y: 251 }, torsoShoulderLeft: { x: 128, y: 254 },
    torsoShoulderRight: { x: 212, y: 254 },
    chestLeft: { x: 149, y: rear ? 274 : 273 }, chestCenter: { x: 170, y: rear ? 242 : 241 },
    chestRight: { x: 191, y: 273 },
    waistLeft: { x: 170 - waistHalf, y: hemY - 57 },
    waistRight: { x: 170 + waistHalf, y: hemY - 57 },
    hemLeft: { x: 170 - waistHalf * 0.72, y: hemY }, hemCenter: { x: 170, y: hemY },
    hemRight: { x: 170 + waistHalf * 0.72, y: hemY },
    elbowLeft: { x: 96, y: 270 }, elbowRight: { x: 244, y: 270 },
    wristLeft: { x: 105, y: 361 }, wristRight: { x: 235, y: 361 },
    handLeft: { x: 108, y: 386 }, handRight: { x: 232, y: 386 },
    pelvisLeft: { x: 136, y: 414 }, pelvisCenter: { x: 170, y: 405 }, pelvisRight: { x: 204, y: 414 },
    kneeLeft: { x: 150, y: 442 }, kneeRight: { x: 190, y: 442 },
    ankleLeft: { x: 150, y: 458 }, ankleRight: { x: 210, y: 458 },
    footLeft: { x: 146, y: 478 }, footRight: { x: 226, y: 478 },
  };
}
