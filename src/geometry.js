export const defaults={radius:150,thickness:12,waferRadius:150,waferThickness:.775,warpage:.4,shape:'bowl',shapeAngle:0,shapeAnisotropy:.45,localX:45,localY:20,localSigma:35,localWeight:.45,tilt:0,lift:2,pinRadius:95,pinSize:2,ringWidth:8,ringHeight:1,connected:true,resolution:240,deep:{enabled:true,pattern:'Grid',width:3,depth:2,pitch:30,count:9,start:0,end:148},shallow:{enabled:true,pattern:'Concentric',width:1.5,depth:.5,pitch:15,count:9,start:12,end:145}};
export function validate(c){let e=[];for(const k of ['radius','thickness','waferRadius','waferThickness','pinSize','ringWidth'])if(!(c[k]>0))e.push(k+' > 0 필요');if(c.waferRadius>c.radius)e.push('V1: wafer 반경 ≤ stage 반경 필요');if(c.pinRadius+c.pinSize>=c.waferRadius)e.push('Lift pin은 wafer 내부에 있어야 합니다');for(const k of ['deep','shallow']){const g=c[k];if(!g.enabled)continue;if(g.width<=0||g.depth<=0||g.depth>=c.thickness||g.pitch<=0||g.count<1||g.count>80||!Number.isInteger(g.count)||g.start<0||g.end<=g.start||g.end>c.radius)e.push(k+': 폭/깊이/피치/개수/반경 확인');}if(c.deep.enabled&&c.shallow.enabled&&c.deep.depth<c.shallow.depth)e.push('Deep 깊이는 Shallow 이상이어야 합니다');if(!Number.isFinite(c.warpage)||c.warpage<0)e.push('Warpage PV는 0 이상 필요');
if(!['bowl','dome','saddle','elliptic','local','mixed'].includes(c.shape))e.push('지원하지 않는 wafer shape');
if(!Number.isFinite(c.shapeAngle)||Math.abs(c.shapeAngle)>180)e.push('Shape 각도 -180~180° 필요');
if(!Number.isFinite(c.shapeAnisotropy)||c.shapeAnisotropy<.1||c.shapeAnisotropy>1)e.push('비등방 비율은 0.1~1');
if(['local','mixed'].includes(c.shape)){if(!Number.isFinite(c.localX)||!Number.isFinite(c.localY)||Math.hypot(c.localX,c.localY)>c.waferRadius)e.push('Local 중심은 wafer 내부');if(!Number.isFinite(c.localSigma)||c.localSigma<=0||c.localSigma>c.waferRadius)e.push('Local 폭은 0~wafer 반경');if(!Number.isFinite(c.localWeight)||c.localWeight<0||c.localWeight>1)e.push('Local 혼합 비율은 0~1');}
return e;}
function hit(x,y,g){const r=Math.hypot(x,y);if(r<g.start||r>g.end)return false;if(g.pattern==='Concentric'){const i=Math.round((r-g.start)/g.pitch);return i>=0&&i<g.count&&Math.abs(r-(g.start+i*g.pitch))<=g.width/2;}if(g.pattern==='Grid'){for(const v of [x,y]){let i=Math.round(v/g.pitch+(g.count-1)/2);if(i>=0&&i<g.count&&Math.abs(v-(i-(g.count-1)/2)*g.pitch)<=g.width/2)return true;}return false;}for(let i=0;i<g.count;i++){let a=i*2*Math.PI/g.count;if(x*Math.cos(a)+y*Math.sin(a)>=0&&Math.abs(-x*Math.sin(a)+y*Math.cos(a))<=g.width/2)return true;}return false;}
export function depthAt(x,y,c){if(Math.hypot(x,y)>c.radius)return null;let d=0;for(const key of ['deep','shallow']){const g=c[key];if(g.enabled&&hit(x,y,g))d=Math.max(d,g.depth);} // Outlet: explicit +X radial channel through stage and edge ring.
if(c.connected&&c.deep.enabled&&x>=c.deep.start&&Math.abs(y)<=c.deep.width/2)d=Math.max(d,c.deep.depth);return d;}
// Shape profiles informed by Subrahmanyan et al. (SPIE 2025, DOI:10.1117/12.3051168).
// These are independent idealized heightfields, NOT digitized paper figures or calibrated stress models.
// warpage is the baseline (untilted) peak-to-valley height in mm; tilt can increase measured PV.
const shapeRanges=new WeakMap();
function rawProfile(x,y,c){
  const angle=c.shapeAngle*Math.PI/180,cs=Math.cos(angle),sn=Math.sin(angle),R=c.waferRadius;
  const u=(cs*x+sn*y)/R,v=(-sn*x+cs*y)/R;
  if(c.shape==='bowl')return u*u+v*v;
  if(c.shape==='dome')return -(u*u+v*v);
  if(c.shape==='saddle')return u*u-v*v;
  if(c.shape==='elliptic')return u*u+c.shapeAnisotropy*v*v;
  const dX=x-c.localX,dY=y-c.localY;
  const bump=Math.exp(-(dX*dX+dY*dY)/(2*c.localSigma*c.localSigma));
  if(c.shape==='local')return bump;
  if(c.shape==='mixed')return (1-c.localWeight)*(u*u-v*v)+c.localWeight*bump;
  return u*u+v*v;
}
function profileRange(c){
  const key=[c.shape,c.waferRadius,c.shapeAngle,c.shapeAnisotropy,c.localX,c.localY,c.localSigma,c.localWeight].join('|');
  let entry=shapeRanges.get(c);
  if(entry&&entry.key===key)return entry;
  let min=Infinity,max=-Infinity;
  // Polar scan includes the circular perimeter; sampling error is reported separately.
  for(let i=0;i<=48;i++){const r=c.waferRadius*i/48;for(let j=0;j<120;j++){
    const a=2*Math.PI*j/120,z=rawProfile(r*Math.cos(a),r*Math.sin(a),c);
    min=Math.min(min,z);max=Math.max(max,z);
  }}
  if(c.shape==='local')max=1; // The prescribed Gaussian peak lies inside the wafer.
  entry={key,span:Math.max(1e-12,max-min)};
  shapeRanges.set(c,entry);
  return entry;
}
export function warp(x,y,c){
  const height=c.warpage===0?0:c.warpage*rawProfile(x,y,c)/profileRange(c).span;
  return height+c.tilt*x/c.waferRadius;
}
export function landWidth(g,r){return g.pattern==='Radial'?2*r*Math.sin(Math.PI/g.count)-g.width:g.pitch-g.width;}
export function calculate(c,n=c.resolution){const step=2*c.radius/n,area=step*step,cells=[];let total=0,land=0,volume=0,minLand=Infinity,minAll=Infinity,minWarp=Infinity,maxWarp=-Infinity,contact=null;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=-c.radius+(i+.5)*step,y=-c.radius+(j+.5)*step,d=depthAt(x,y,c);if(d===null)continue;total+=area;if(d===0)land+=area;volume+=d*area;const inWafer=Math.hypot(x,y)<=c.waferRadius,w=warp(x,y,c);if(inWafer){minWarp=Math.min(minWarp,w);maxWarp=Math.max(maxWarp,w);minAll=Math.min(minAll,w+d);if(d===0&&w<minLand){minLand=w;contact={x,y};}}cells.push({x,y,d,w,inWafer});}let pinLimit=-Infinity;for(let k=0;k<3;k++){let a=k*2*Math.PI/3;pinLimit=Math.max(pinLimit,c.lift-warp(c.pinRadius*Math.cos(a),c.pinRadius*Math.sin(a),c));}const offset=pinLimit;let minGap=Infinity,interference=0;for(const p of cells){p.gap=p.w+offset+p.d;if(p.inWafer){minGap=Math.min(minGap,p.gap);if(p.gap< -1e-6)interference++;}}return{step,cells,total,land,volume,groove:total-land,waferPV:maxWarp-minWarp,minLand,contact,offset,minGap,interference,firstLandOffset:-minLand,firstSurfaceOffset:-minAll};}
// V2 extension boundary: pressure, gas flow and elastic/contact force solvers receive geometry; V1 never fabricates these outputs.
export const physicsModels={pressure:null,gasFlow:null,elasticContact:null};
