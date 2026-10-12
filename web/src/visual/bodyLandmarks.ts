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


/** Fixed body geometry, independent of garment selection and fit recipe values. */
export type BodyBaseGeometry = Readonly<{ torso: string; pelvis: string; legs: string; feet: string }>;
export function getBodyBaseGeometry(view: BodyView): BodyBaseGeometry {
  const rear = view === "back";
  return {
    torso: rear ? "M128 254 Q170 230 212 254 L194 347 Q170 359 146 347 Z" : "M128 254 Q170 230 212 254 L194 346 Q170 354 146 346 Z",
    pelvis: rear ? "M146 346 Q170 354 194 346 L208 390 Q190 408 170 410 Q150 408 132 390 Z" : "M146 346 Q170 354 194 346 L205 389 Q190 404 170 411 Q150 404 135 389 Z",
    legs: rear ? "M135 386 Q145 389 158 397 L166 441 L158 458 L145 458 L145 442 L142 414 Z M182 397 Q195 389 205 386 L198 414 L195 442 L195 458 L182 458 L174 441 Z" : "M135 386 Q147 390 160 398 L164 441 L157 458 L145 458 L145 442 L142 414 Z M180 398 Q193 390 205 386 L198 414 L195 442 L195 458 L183 458 L176 441 Z",
    feet: "M145 455 L158 455 L160 470 Q172 475 178 479 L143 479 Q140 474 145 455 Z M183 455 L195 455 L199 475 L226 479 L190 479 L183 470 Z",
  };
}
