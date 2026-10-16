/**
 * Canonical front/back anatomy for the 340×490 CyberStreet canvas.
 *
 * Calibration source: references/dataset-cuerpos/12.png (primary front view),
 * cross-checked against 15.png and 4.png. Coordinates below are a stylized
 * adaptation of normalized landmark ratios, not a pixel trace of any source.
 * The references are kept out of the product bundle; no source pixels are copied.
 */
export type BodyView = "front" | "back";
export type Landmark = Readonly<{ x: number; y: number }>;

export const BODY_REFERENCE_CALIBRATION = Object.freeze({
  primary: "references/dataset-cuerpos/12.png",
  secondary: "references/dataset-cuerpos/15.png",
  additionalFullBody: "references/dataset-cuerpos/4.png",
  sourceDimensions: Object.freeze({ width: 768, height: 1280 }),
  method: "Approximate normalized landmark ratios adapted to the 340×490 viewport",
  notes: Object.freeze([
    "12.png is the primary front-view proportion reference; its arms are slightly abducted and one ankle is partly occluded.",
    "15.png is a secondary full-body check with hip shift and crossed ankles, not a neutral template.",
    "4.png is full-body but has a hip shift and crossed ankles.",
    "The other inspected references are primarily pose references because of cropping, rotation, or limb overlap.",
    "Measurements are illustrative art-design proportions, not clinical or motion-capture data.",
  ]),
  viewportRatios: Object.freeze({
    crown: 0.01,
    chin: 0.25,
    shoulderLine: 0.26,
    waist: 0.45,
    pelvis: 0.59,
    knee: 0.71,
    ankle: 0.87,
    sole: 0.99,
  }),
});

export type BodyLandmarkSet = Readonly<{
  view: BodyView;
  headTop: Landmark; headCenter: Landmark;
  neckLeft: Landmark; neckLeftBase: Landmark; neckRightBase: Landmark; neckRight: Landmark;
  shoulderLeft: Landmark; shoulderPeak: Landmark; shoulderRight: Landmark;
  torsoShoulderLeft: Landmark; torsoShoulderRight: Landmark;
  chestLeft: Landmark; chestCenter: Landmark; chestRight: Landmark;
  waistLeft: Landmark; waistRight: Landmark;
  elbowLeft: Landmark; elbowRight: Landmark; wristLeft: Landmark; wristRight: Landmark;
  handLeft: Landmark; handRight: Landmark;
  pelvisLeft: Landmark; pelvisCenter: Landmark; pelvisRight: Landmark;
  kneeLeft: Landmark; kneeRight: Landmark; ankleLeft: Landmark; ankleRight: Landmark;
  footLeft: Landmark; footRight: Landmark;
}>;

export type GarmentFitLandmarks = Readonly<{
  view: BodyView;
  torsoShoulderLeft: Landmark; shoulderPeak: Landmark; torsoShoulderRight: Landmark;
  waistLeft: Landmark; waistRight: Landmark;
  hemLeft: Landmark; hemCenter: Landmark; hemRight: Landmark;
}>;

const SVG_LAYER_ORDER = [
  "ground-shadow", "hair-back", "body-base", "neck", "arm-skin", "hands", "base-sleeves",
  "base-torso", "lower-body", "footwear", "outfit", "outer-layer",
  "surface-details", "chromapatch",
] as const;
export type SvgLayerId = typeof SVG_LAYER_ORDER[number];
export { SVG_LAYER_ORDER };
export function svgLayerIndex(layer: SvgLayerId): number {
  return SVG_LAYER_ORDER.indexOf(layer);
}

/**
 * Anatomical points are deliberately independent of torso_length, waist_fit,
 * sleeve_length, clothing IDs, and accessory placement.
 */
export function getBodyLandmarks(view: BodyView): BodyLandmarkSet {
  const rear = view === "back";
  return {
    view,
    headTop: { x: 170, y: 5 },
    headCenter: { x: 170, y: 83 },
    neckLeft: { x: 151, y: 119 },
    neckLeftBase: { x: 148, y: 153 },
    neckRightBase: { x: 192, y: 153 },
    neckRight: { x: 189, y: 119 },
    shoulderLeft: { x: 110, y: 132 },
    shoulderPeak: { x: 170, y: 120 },
    shoulderRight: { x: 230, y: 132 },
    torsoShoulderLeft: { x: 116, y: 134 },
    torsoShoulderRight: { x: 224, y: 134 },
    chestLeft: { x: 140, y: rear ? 171 : 166 },
    chestCenter: { x: 170, y: rear ? 155 : 151 },
    chestRight: { x: 200, y: rear ? 171 : 166 },
    waistLeft: { x: 132, y: 219 },
    waistRight: { x: 208, y: 219 },
    elbowLeft: { x: 67, y: 184 },
    elbowRight: { x: 273, y: 184 },
    wristLeft: { x: 42, y: 244 },
    wristRight: { x: 298, y: 244 },
    handLeft: { x: 27, y: 267 },
    handRight: { x: 313, y: 267 },
    pelvisLeft: { x: 118, y: 274 },
    pelvisCenter: { x: 170, y: 293 },
    pelvisRight: { x: 222, y: 274 },
    kneeLeft: { x: 137, y: 350 },
    kneeRight: { x: 203, y: 350 },
    ankleLeft: { x: 148, y: 426 },
    ankleRight: { x: 192, y: 426 },
    footLeft: { x: 140, y: 478 },
    footRight: { x: 213, y: 478 },
  };
}

/**
 * Clothing-fit anchors may vary with garment fit controls; they never feed back
 * into the canonical torso, pelvis, limbs, ankles, or feet.
 */
export function getGarmentFitLandmarks(view: BodyView, hemY: number, waistHalf: number): GarmentFitLandmarks {
  const body = getBodyLandmarks(view);
  const waistY = hemY - 25;
  const hemHalf = waistHalf * 0.78;
  return {
    view,
    torsoShoulderLeft: body.torsoShoulderLeft,
    shoulderPeak: body.shoulderPeak,
    torsoShoulderRight: body.torsoShoulderRight,
    waistLeft: { x: 170 - waistHalf, y: waistY },
    waistRight: { x: 170 + waistHalf, y: waistY },
    hemLeft: { x: 170 - hemHalf, y: hemY },
    hemCenter: { x: 170, y: hemY },
    hemRight: { x: 170 + hemHalf, y: hemY },
  };
}

export type BodyBaseGeometry = Readonly<{ torso: string; pelvis: string; legs: string; feet: string }>;
export function getBodyBaseGeometry(view: BodyView, points: BodyLandmarkSet = getBodyLandmarks(view)): BodyBaseGeometry {
  const rear = view === "back";
  const l = points;
  const torso = [
    "M" + l.torsoShoulderLeft.x + " " + l.torsoShoulderLeft.y,
    "C 140 120 155 122 170 122",
    "C 185 122 200 120 " + l.torsoShoulderRight.x + " " + l.torsoShoulderRight.y,
    "C 232 158 214 184 208 207",
    "C 206 218 205 227 208 237",
    "C 212 250 207 261 198 270",
    "Q 170 285 142 270",
    "C 133 261 128 250 132 237",
    "C 135 227 134 218 132 207",
    "C 126 184 108 158 " + l.torsoShoulderLeft.x + " " + l.torsoShoulderLeft.y + " Z",
  ].join(" ");
  const pelvis = [
    "M 118 260",
    "C 132 270 148 281 " + l.pelvisCenter.x + " " + (l.pelvisCenter.y + 7),
    "C 192 281 208 270 222 260",
    "C 235 272 230 286 215 298",
    "C 200 310 185 316 170 316",
    "C 155 316 140 310 125 298",
    "C 110 286 105 272 118 260 Z",
  ].join(" ");
  const legs = [
    "M 122 278",
    "C 116 300 120 328 " + (l.kneeLeft.x - 3) + " " + l.kneeLeft.y,
    "C 138 373 143 402 " + l.ankleLeft.x + " " + l.ankleLeft.y,
    "C 146 444 142 461 143 473",
    "Q 143 481 151 481 L 168 481 Q 175 480 171 473",
    "C 166 456 165 435 162 415",
    "C 158 390 155 367 160 345",
    "C 152 320 154 296 160 286 Z",
    "M 218 278",
    "C 224 300 220 328 " + (l.kneeRight.x + 3) + " " + l.kneeRight.y,
    "C 202 373 197 402 " + l.ankleRight.x + " " + l.ankleRight.y,
    "C 194 444 198 461 197 473",
    "Q 197 481 189 481 L 173 481 Q 166 480 169 473",
    "C 174 456 175 435 178 415",
    "C 182 390 185 367 180 345",
    "C 188 320 186 296 180 286 Z",
  ].join(" ");
  const feet = [
    "M146 421 C145 435 143 449 139 462 Q136 473 143 478 Q147 482 168 481 Q175 480 171 474 L160 447 L158 421 Z",
    "M182 421 L184 447 L193 469 Q190 477 198 481 L210 481 Q220 481 216 474 Q206 464 200 457 L194 421 Z",
  ].join(" ");
  return { torso: rear ? torso.replace("C 140 120 155 122 170 122", "C 145 121 155 123 170 124") : torso, pelvis, legs, feet };
}
