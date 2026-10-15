/* BotImagen Mobile: independent PNG part storage and SVG composition. */
(function(root){
"use strict";
const KEY="botimagen.mobile.parts.v1";
const SLOTS={hair:{label:"Cabello",x:115,y:35,width:282,height:420,baseLayer:"head"},face:{label:"Rostro",x:174,y:72,width:164,height:224,baseLayer:"head"},body:{label:"Cuerpo",x:160,y:275,width:192,height:250,baseLayer:"body"},clothes:{label:"Ropa",x:160,y:295,width:192,height:210,baseLayer:"body"}};
function validDataUrl(v){return typeof v==="string"&&/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(v)&&v.length<=2*1024*1024}
function normalizeParts(input){const out={};if(!input||typeof input!=="object")return out;Object.keys(SLOTS).forEach(k=>{if(validDataUrl(input[k]))out[k]=input[k]});return out}
function read(storage){try{return normalizeParts(JSON.parse(storage.getItem(KEY)||"{}"))}catch(_){return {}}}
function write(storage,parts){storage.setItem(KEY,JSON.stringify(normalizeParts(parts)))}
function set(storage,slot,dataUrl){if(!SLOTS[slot])throw new Error("Categoría de pieza desconocida: "+slot);if(!validDataUrl(dataUrl))throw new Error("La pieza debe ser un PNG válido de hasta 1,5 MB.");const p=read(storage);p[slot]=dataUrl;write(storage,p);return p}
function remove(storage,slot){if(!SLOTS[slot])throw new Error("Categoría de pieza desconocida: "+slot);const p=read(storage);delete p[slot];write(storage,p);return p}
function apply(svg,parts){const p=normalizeParts(parts);Object.keys(SLOTS).forEach(slot=>{const cfg=SLOTS[slot],id="part-"+slot;let im=svg.querySelector("#"+id);if(!im){im=svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg","image");im.setAttribute("id",id);im.setAttribute("preserveAspectRatio","xMidYMid meet");im.setAttribute("x",cfg.x);im.setAttribute("y",cfg.y);im.setAttribute("width",cfg.width);im.setAttribute("height",cfg.height);svg.appendChild(im)}const base=svg.querySelector("#"+cfg.baseLayer);if(p[slot]){im.setAttributeNS("http://www.w3.org/1999/xlink","href",p[slot]);im.setAttribute("href",p[slot]);im.style.display="";if(base)base.style.display="none"}else{im.removeAttribute("href");im.removeAttributeNS("http://www.w3.org/1999/xlink","href");im.style.display="none";if(base)base.style.display=""}})}
const api={KEY,SLOTS,validDataUrl,normalizeParts,read,write,set,remove,apply};
if(typeof module!=="undefined"&&module.exports)module.exports=api;if(root)root.BotImagenParts=api;
})(typeof window!=="undefined"?window:null);
