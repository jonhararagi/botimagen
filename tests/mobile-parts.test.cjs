const test=require("node:test");const assert=require("node:assert/strict");const P=require("../android/app/src/main/assets/parts-engine.js");
function storage(){const d=new Map();return {getItem:k=>d.has(k)?d.get(k):null,setItem:(k,v)=>d.set(k,String(v)),removeItem:k=>d.delete(k)}}
const png="data:image/png;base64,iVBORw0KGgo=";
test("accepts only PNG data URLs within the size limit",()=>{assert.equal(P.validDataUrl(png),true);assert.equal(P.validDataUrl("data:image/jpeg;base64,AAAA"),false);assert.equal(P.validDataUrl("https://example.com/x.png"),false);assert.equal(P.validDataUrl("data:image/png;base64,"+"A".repeat(2*1024*1024)),false)});
test("stores categories independently and persists across reads",()=>{const s=storage();P.set(s,"hair",png);P.set(s,"face",png);const p=P.read(s);assert.equal(p.hair,png);assert.equal(p.face,png);assert.equal(p.body,undefined)});
test("removes one category without damaging others",()=>{const s=storage();P.set(s,"hair",png);P.set(s,"body",png);P.remove(s,"hair");assert.equal(P.read(s).hair,undefined);assert.equal(P.read(s).body,png)});
test("rejects unknown categories and malformed files",()=>{const s=storage();assert.throws(()=>P.set(s,"hat",png));assert.throws(()=>P.set(s,"face","not png"));assert.throws(()=>P.remove(s,"unknown"))});
test("normalization drops invalid slots and malformed payloads",()=>{assert.deepEqual(P.normalizeParts({hair:png,face:"bad",body:3}),{hair:png});assert.deepEqual(P.normalizeParts(null),{})});
