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

/** Coordinates are anchored to paths already present in VisualCharacterRenderer. */
export function getBodyLandmarks(view: BodyView, hemY: number, waistHalf: number): BodyLandmarkSet {
  const rear = view === "back";
  return {
    view, headTop: { x: 170, y: 80 }, headCenter: { x: 170, y: 145 },
    neckLeft: { x: 137, y: 190 }, neckLeftBase: { x: 135, y: 233 },
    neckRightBase: { x: 207, y: 229 }, neckRight: { x: 204, y: 190 },
    shoulderLeft: { x: 116, y: 260 }, shoulderPeak: { x: 170, y: 238 },
    shoulderRight: { x: 225, y: 259 }, torsoShoulderLeft: { x: 125, y: 263 },
    torsoShoulderRight: { x: 216, y: 263 },
    chestLeft: { x: 149, y: rear ? 283 : 282 }, chestCenter: { x: 170, y: rear ? 249 : 248 },
    chestRight: { x: 193, y: 281 },
    waistLeft: { x: 170 - waistHalf, y: hemY - 57 },
    waistRight: { x: 170 + waistHalf, y: hemY - 57 },
    hemLeft: { x: 170 - waistHalf * 0.72, y: hemY }, hemCenter: { x: 170, y: hemY },
    hemRight: { x: 170 + waistHalf * 0.72, y: hemY },
    elbowLeft: { x: 94, y: 268 }, elbowRight: { x: 246, y: 268 },
    wristLeft: { x: 105, y: 361 }, wristRight: { x: 235, y: 361 },
    handLeft: { x: 108, y: 386 }, handRight: { x: 232, y: 386 },
    pelvisLeft: { x: 136, y: 414 }, pelvisCenter: { x: 170, y: 405 }, pelvisRight: { x: 204, y: 414 },
    kneeLeft: { x: 150, y: 440 }, kneeRight: { x: 190, y: 440 },
    ankleLeft: { x: 150, y: 456 }, ankleRight: { x: 210, y: 456 },
    footLeft: { x: 146, y: 478 }, footRight: { x: 226, y: 478 },
  };
}
