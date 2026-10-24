import{test}from'node:test';import assert from'node:assert/strict';import{defaults,depthAt,calculate,validate,warp}from'./src/geometry.js';
const base=()=>{let c=structuredClone(defaults);c.radius=20;c.waferRadius=20;c.pinRadius=10;c.connected=false;c.deep.enabled=false;c.shallow.enabled=false;c.resolution=400;return c;};
test('flat disk area and zero volume',()=>{let c=base(),r=calculate(c);assert.ok(Math.abs(r.land-Math.PI*400)/(Math.PI*400)<.001);assert.equal(r.volume,0);});
test('single annular groove analytic area and volume',()=>{let c=base();Object.assign(c.deep,{enabled:true,pattern:'Concentric',start:10,end:19,width:2,depth:2,count:1}); // start clips inner half, hence annulus 10..11
let r=calculate(c),exact=Math.PI*(121-100);assert.ok(Math.abs(r.groove-exact)/exact<.015);assert.ok(Math.abs(r.volume-exact*2)/(exact*2)<.015);});
test('crossing grooves use maximum depth, never sum',()=>{let c=base();Object.assign(c.deep,{enabled:true,pattern:'Grid',start:0,end:20,count:1,width:4,depth:2});c.shallow={...c.deep,depth:.5};assert.equal(depthAt(0,0,c),2);let a=calculate(c);c.shallow.enabled=false;let b=calculate(c);assert.equal(a.volume,b.volume);});
test('pin down interference and flat contact',()=>{let c=base();c.warpage=0;c.lift=0;let r=calculate(c);assert.equal(r.minGap,0);assert.equal(r.interference,0);c.warpage=.4;r=calculate(c);assert.ok(r.minGap<0);assert.ok(r.interference>0);});
test('all patterns and outlet',()=>{let c=base();Object.assign(c.deep,{enabled:true,pattern:'Radial',start:2,end:15,width:1,count:4});assert.equal(depthAt(10,0,c),2);assert.equal(depthAt(5,5,c),0);assert.equal(depthAt(18,0,c),0);c.connected=true;assert.equal(depthAt(18,0,c),2);});
test('depth doubling doubles union volume',()=>{let c=structuredClone(defaults),a=calculate(c,160);c.deep.depth*=2;c.shallow.depth*=2;let b=calculate(c,160);assert.ok(Math.abs(b.volume-2*a.volume)<1e-7);});
test('invalid dimensions rejected',()=>{let c=base();c.deep.enabled=true;c.deep.depth=c.thickness;assert.ok(validate(c).length);});
test('saddle signs',()=>{let c=base();c.shape='saddle';assert.ok(warp(10,0,c)>0);assert.ok(warp(0,10,c)<0);});


test('all extended shapes produce finite warp and expected sampled PV',()=>{
  for(const shape of ['bowl','dome','saddle','elliptic','local','mixed']){
    let c=base();c.shape=shape;c.warpage=.5;
    const r=calculate(c,160);
    assert.ok(Number.isFinite(r.waferPV)&&r.waferPV>.43&&r.waferPV<.55,shape+' sampled PV='+r.waferPV);
    assert.ok(Number.isFinite(r.minGap),shape);
  }
});
test('saddle rotation swaps principal height directions',()=>{
  let c=base();c.shape='saddle';c.shapeAngle=0;const a=warp(10,0,c);
  c.shapeAngle=90;const b=warp(10,0,c);
  assert.ok(a>0&&b<0);
});
test('local hump peaks at user-specified location',()=>{
  let c=base();c.shape='local';c.localX=4;c.localY=-3;c.localSigma=5;
  assert.ok(warp(4,-3,c)>warp(0,0,c));
  assert.ok(warp(4,-3,c)>warp(-8,7,c));
});
test('bad local center or width rejected',()=>{
  let c=base();c.shape='local';c.localX=100;assert.ok(validate(c).length);
  c.localX=0;c.localSigma=0;assert.ok(validate(c).length);
});
