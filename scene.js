/* Original illustrative architectural model. Not a measured survey. */
(() => {
 'use strict';
 const host = document.getElementById('scene');
 if (!host) return;
 const fallback = () => {
   document.getElementById('scene-fallback').hidden = false;
   document.querySelector('.scene-badge').hidden = true;
   document.querySelector('.scene-tip').hidden = true;
   document.querySelector('.scene-controls').hidden = true;
 };
 if (!window.THREE) { fallback(); return; }
 const T = window.THREE;
 let renderer;
 try { renderer = new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'}); }
 catch { fallback(); return; }
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
 renderer.setClearColor(0x181a1c,0);
 renderer.shadowMap.enabled = true;
 renderer.shadowMap.type = T.PCFSoftShadowMap;
 renderer.outputColorSpace = T.SRGBColorSpace;
 renderer.toneMapping = T.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.35;
 host.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-hidden','true');
 const scene = new T.Scene();
 const world = new T.Group();
 scene.add(world);
 const camera = new T.PerspectiveCamera(37,1,.5,900);
 const target = new T.Vector3(0,10,0);
 let yaw = .57, elevation = .59, distance = 218, rotating = false, visible = false, dirty = true, frameId = 0;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 const materials = {};
 function mat(name,color,roughness=.7,metalness=0,extra={}) {
   return materials[name] = new T.MeshStandardMaterial({color,roughness,metalness,...extra});
 }
 const stone=mat('stone',0xd5d0c6,.7),concrete=mat('concrete',0x74787a,.85),roof=mat('roof',0x828581,.75),
   glass=mat('glass',0x355660,.2,.65),glassDark=mat('glassDark',0x20363e,.22,.65),
   trim=mat('trim',0xa4a9a6,.4,.5),dark=mat('dark',0x262b30,.7),
   ground=mat('ground',0x393f41,.95),road=mat('road',0x252b2e,1),
   grass=mat('grass',0x354e42,1),treeGreen=mat('tree',0x40694c,1),treeLight=mat('treeLight',0x56785a,1),
   trunk=mat('trunk',0x74634c,1),water=mat('water',0x397b80,.2,.45),
   glow=mat('glow',0xefcd9a,.35,0,{emissive:0xe8b56b,emissiveIntensity:.75}),
   red=mat('red',0xe5434c,.4,0,{emissive:0x721119,emissiveIntensity:.25}),
   white=mat('white',0xd7dbd8,.8);
 const boxGeometry = new T.BoxGeometry(1,1,1);
 const batches = new Map();
 function box(x,y,z,w,h,d,material,rot=0){
   if(!batches.has(material))batches.set(material,[]);
   batches.get(material).push({x,y,z,w,h,d,rot});
 }
 function mesh(geometry,material,x,y,z){
   const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;world.add(m);return m;
 }
 // The broad retail podium, glazed central roof and tall end towers follow photo references.
 box(0,-2,0,158,3,112,ground);
 box(0,-3.6,0,160,1,114,dark);
 box(0,-.3,33,155,.2,12,road);
 box(-69,-.3,-5,10,.2,82,road);
 box(69,-.3,-5,10,.2,82,road);
 for(let x=-73;x<76;x+=7){box(x,-.16,33,3,.035,.14,white);box(x,-.14,27.8,3,.03,.1,white);box(x,-.14,38.2,3,.03,.1,white);}
 for(let z=-44;z<34;z+=7){box(-69,-.15,z,.13,.03,3,white);box(69,-.15,z,.13,.03,3,white);}
 // Crosswalks and paths.
 for(let x=-5;x<6;x+=1.4)box(x,-.15,33,.65,.04,10,white);
 for(let z=-2;z<7;z+=1.5)box(69,-.15,z,9,.04,.7,white);
 box(0,-.1,23.8,124,.25,4,stone);
 box(0,-.1,-23.5,122,.25,4,stone);
 box(0,.15,0,123,.65,44,stone);
 box(0,6.5,0,116,12,39,glassDark);
 box(0,12.5,-.3,117,.8,40,stone);
 // Alternating floor bands and a curtain-wall grid.
 for(let level=0;level<4;level++){
   const y=1.1+level*3.1;
   box(0,y,19.7,117,.37,.75,stone);
   box(0,y,-19.7,117,.37,.75,stone);
   box(-58.6,y,0,.75,.37,40,stone);box(58.6,y,0,.75,.37,40,stone);
 }
 for(let x=-57;x<58;x+=2.1){box(x,6.7,19.65,.12,11,.22,trim);box(x,6.7,-19.65,.12,11,.22,trim);}
 // Perforated champagne facade ribbons; gaps reveal the glazing.
 for(let x=-54;x<55;x+=1.05){
   const breakAtEntrance=Math.abs(x)<10;
   if(!breakAtEntrance){box(x,8.3,20.2,.48,6.7,.27,stone);box(x,8.1,-20.1,.4,6.3,.27,stone);}
   if(!breakAtEntrance && Math.sin(x*2.3)>.25)box(x,8.4+(Math.sin(x)*1.5),20.38,.51,.6,.04,glow);
 }
 // Long rooftop gallery with a raised central volume.
 box(0,14.3,-1,87,3,28,concrete);
 box(0,15.95,-1,88,.3,29,stone);
 box(0,16.6,-2,39,1.3,20,roof);
 for(let x=-39;x<40;x+=3.1){box(x,13.25,15,1.3,.3,8,trim,-.15);box(x,13.25,-15,1.3,.3,6,trim,.15);}
 // Oval glazed skylight: a low dome, not a generic sphere.
 const dome=mesh(new T.SphereGeometry(1,48,24,0,Math.PI*2,0,Math.PI/2),glass,0,17.2,-2);
 dome.scale.set(13.3,4.3,8.7);
 const ribMat = new T.LineBasicMaterial({color:0xb9c8c6,transparent:true,opacity:.6});
 for(let i=0;i<12;i++){
   const a=i*Math.PI/12,pts=[];
   for(let j=0;j<=40;j++){const b=j*Math.PI/40;pts.push(new T.Vector3(Math.cos(b)*Math.cos(a)*13.4,17.2+Math.sin(b)*4.35,-2+Math.cos(b)*Math.sin(a)*8.8));}
   world.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),ribMat));
 }
 for(let j=1;j<5;j++){
   const b=j*Math.PI/10,pts=[];
   for(let i=0;i<=64;i++){const a=i*Math.PI/32;pts.push(new T.Vector3(Math.cos(a)*13.4*Math.cos(b),17.2+Math.sin(b)*4.35,-2+Math.sin(a)*8.8*Math.cos(b)));}
   world.add(new T.Line(new T.BufferGeometry().setFromPoints(pts),ribMat));
 }
 // The main entrance and illuminated canopy.
 box(0,5.2,20.45,18,9,.65,glass);box(0,10.5,23,23,.7,7,dark);box(0,10.14,26.5,23,.12,.15,glow);
 for(let x=-8;x<=8;x+=4){box(x,4,20.9,.16,7,.18,trim);box(x,1.8,21,3.5,3.5,.1,glass);}
 box(0,.45,24.5,26,.4,4,stone);box(0,.2,25.6,29,.2,4,concrete);
 // Tower facades: vertical mullions, horizontal spandrels, parapets and mechanical roofs.
 function tower(x,z,w,d,h){
   box(x,h/2+.8,z,w,h,d,glass);
   box(x,1,z,w+3,1.2,d+3,stone);
   box(x,h+1.2,z,w+.6,2,d+.6,concrete);
   box(x,h+2.45,z,w-3,.5,d-3,dark);
   box(x-w/2+.5,h/2+1,z,.9,h+1,d+.2,stone);
   box(x+w/2-.5,h/2+1,z,.9,h+1,d+.2,stone);
   for(let y=3;y<h;y+=2.3){
     box(x,y,z+d/2+.03,w,.16,.13,trim);box(x,y,z-d/2-.03,w,.16,.13,trim);
     box(x-w/2-.03,y,z,.13,.16,d,trim);box(x+w/2+.03,y,z,.13,.16,d,trim);
   }
   for(let a=-w/2+1.2;a<w/2;a+=1.15){box(x+a,h/2+1,z+d/2+.1,.09,h,.18,trim);box(x+a,h/2+1,z-d/2-.1,.09,h,.18,trim);}
   for(let a=-d/2+1;a<d/2;a+=1.3){box(x-w/2-.1,h/2+1,z+a,.18,h,.09,trim);box(x+w/2+.1,h/2+1,z+a,.18,h,.09,trim);}
   // Dark, subtly varied window panels with a few warm occupied windows.
   for(let row=0;row<Math.floor(h/2.3)-1;row++)for(let col=0;col<Math.floor(w/2);col++){
     const x0=x-w/2+1.25+col*1.9,y0=3.95+row*2.3;
     if((row*7+col*13)%19===0)box(x0,y0,z+d/2+.16,1.65,1.25,.015,glow);
     else if((row+col*5)%5===0)box(x0,y0,z+d/2+.11,1.7,1.8,.02,glassDark);
   }
 }
 tower(47,1,18,18,63);
 tower(-46,-4,19,17,53);
 // Rooftop units and planted terraces.
 for(const x of [-29,-23,23,29]){box(x,16.4,-5,3,1.4,4,dark);for(let z=-6;z<=-4;z++)box(x,17.15,z,2.8,.08,.13,trim);}
 for(let x=-37;x<38;x+=8){box(x,13.3,17.5,5,.7,2,grass);box(x,13.7,18.4,5,.2,.2,stone);}
 function textPlane(text,w,h,x,y,z,size=70,color='#eae9e4'){
   const c=document.createElement('canvas');c.width=1024;c.height=160;const ctx=c.getContext('2d');
   ctx.clearRect(0,0,1024,160);ctx.fillStyle=color;ctx.font=`600 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,80,990);
   const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
   const material=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide});
   return mesh(new T.PlaneGeometry(w,h),material,x,y,z);
 }
 textPlane('TASHKENT CITY MALL',32,4.9,0,14.3,20.45,70);
 textPlane('SUMMIT',15,2.8,47,62.9,10.15,85);
 textPlane('CITY MALL',13,2.5,-46,51,4.65,78);
 for(const [x,name] of [[-32,'ZARA'],[-17,'PULL&BEAR'],[20,'adidas'],[33,'NIKE']]){
   box(x,6,20.5,8,3,.1,dark);textPlane(name,7.2,1.3,x,6,20.58,82);
 }
 // Adjacent city blocks are deliberately simplified, with consistent facade detail.
 function neighbour(x,z,w,d,h){
   box(x,h/2,z,w,h,d,concrete);box(x,h+.35,z,w+.6,.7,d+.6,stone);
   for(let y=2;y<h-1;y+=2.8){box(x,y,z+d/2+.04,w-1,1.4,.1,glassDark);box(x-w/2-.04,y,z,.1,1.4,d-1,glassDark);}
   for(let a=-w/2+1;a<w/2;a+=2.2)box(x+a,h/2,z+d/2+.14,.3,h,.15,stone);
 }
 neighbour(-47,-42,17,12,32);neighbour(-26,-44,13,12,39);neighbour(-76,-31,7,16,19);
 neighbour(48,-43,17,13,27);neighbour(72,48,13,10,21);neighbour(-57,48,24,12,13);
 // Park on the rear side, with a winding water feature and curved footpaths.
 box(3,-.05,-39,59,.3,27,grass);
 const lakeShape=new T.Shape();
 lakeShape.moveTo(-21,-4);lakeShape.bezierCurveTo(-26,4,-9,8,-2,5);lakeShape.bezierCurveTo(6,0,21,9,24,1);lakeShape.bezierCurveTo(26,-7,7,-6,0,-3);lakeShape.bezierCurveTo(-8,1,-16,-9,-21,-4);
 const lake=mesh(new T.ShapeGeometry(lakeShape,40),water,3,.18,-40);lake.rotation.x=-Math.PI/2;
 function parkPath(points,width=.65){
   const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(p[0],.15,p[1])));
   mesh(new T.TubeGeometry(curve,60,width,6,false),stone,0,0,0);
 }
 parkPath([[-24,-28],[-13,-31],[-4,-29],[10,-29],[25,-34],[28,-49]]);
 parkPath([[-25,-48],[-14,-45],[0,-47],[14,-49],[28,-48]],.48);
 // Tree canopies are instanced for mobile performance.
 const trees=[];
 for(let i=0;i<20;i++){trees.push([-59+i*6.2,24.2]);trees.push([-59+i*6.2,42]);}
 for(let i=0;i<13;i++)trees.push([-61,-39+i*4.5],[61,-39+i*4.5]);
 for(let i=0;i<21;i++){const x=-23+(i*17%51),z=-49+(i*7%21);if(Math.abs(z+40)>4)trees.push([x,z]);}
 const treeGeom=new T.IcosahedronGeometry(1,1),dummy=new T.Object3D();
 const canopies=new T.InstancedMesh(treeGeom,treeGreen,trees.length),canopies2=new T.InstancedMesh(treeGeom,treeLight,trees.length);
 canopies.castShadow=true;canopies.receiveShadow=true;canopies2.castShadow=true;
 trees.forEach(([x,z],i)=>{
   const size=1.3+(i%4)*.16;box(x,1.05,z,.24,2.2,.24,trunk);
   dummy.position.set(x,2.6,z);dummy.scale.set(size,size*1.15,size);dummy.rotation.set(i*.2,i,.1);dummy.updateMatrix();canopies.setMatrixAt(i,dummy.matrix);
   dummy.position.set(x+.25,3.3,z-.1);dummy.scale.set(size*.75,size*.8,size*.75);dummy.updateMatrix();canopies2.setMatrixAt(i,dummy.matrix);
 });world.add(canopies,canopies2);
 // Street furniture, benches, cars, roof edging and landscape lights.
 for(let x=-53;x<55;x+=12){box(x,2.2,26,.13,4.4,.13,dark);box(x+.6,4.35,26,1.4,.16,.3,glow);box(x,.55,22.5,2,.18,.65,stone);}
 for(let i=0;i<15;i++){
   const x=-63+i*8.7,z=i%2===0?30.8:35.2;
   box(x,.65,z,2.9,.8,1.35,i%5===0?red:i%3===0?white:glassDark);
   box(x,.95,z,1.6,.6,1.2,glass);box(x-.85,.28,z, .5,.4,1.45,dark);box(x+.85,.28,z,.5,.4,1.45,dark);
 }
 // Flush every repeated component into one instanced draw call per material.
 let instanceCount=0;
 for(const [material,items] of batches){
   const batch=new T.InstancedMesh(boxGeometry,material,items.length);batch.castShadow=true;batch.receiveShadow=true;
   items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.w,p.h,p.d);dummy.rotation.set(0,p.rot,0);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});
   batch.computeBoundingSphere();world.add(batch);instanceCount+=items.length;
 }
 host.dataset.modelInstances=String(instanceCount);
 host.dataset.modelReady='true';
 const ambient=new T.HemisphereLight(0xc8e1ec,0x5c5951,2);scene.add(ambient);
 const sun=new T.DirectionalLight(0xffe7c8,3.2);sun.position.set(-60,100,70);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-110;sun.shadow.camera.right=110;sun.shadow.camera.top=100;sun.shadow.camera.bottom=-100;sun.shadow.camera.near=1;sun.shadow.camera.far=300;sun.shadow.bias=-.0003;sun.shadow.normalBias=.08;scene.add(sun);
 const fill=new T.DirectionalLight(0x9ecadb,1.5);fill.position.set(60,30,-60);scene.add(fill);
 function updateCamera(){camera.position.set(Math.sin(yaw)*Math.cos(elevation)*distance,Math.sin(elevation)*distance+target.y,Math.cos(yaw)*Math.cos(elevation)*distance);camera.lookAt(target);}
 function requestRender(){dirty=true;if(!frameId&&visible&&!document.hidden)frameId=requestAnimationFrame(render);}
 let previous=0;
 function render(now){
   frameId=0;if(!visible||document.hidden)return;
   if(rotating){yaw+=Math.min((now-previous)||16,50)*.000055;dirty=true;}
   previous=now;if(dirty){updateCamera();renderer.render(scene,camera);dirty=false;}
   if(rotating)frameId=requestAnimationFrame(render);
 }
 function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();requestRender();}
 if('ResizeObserver'in window)new ResizeObserver(resize).observe(host);else window.addEventListener('resize',resize);
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestRender();else if(frameId){cancelAnimationFrame(frameId);frameId=0;}},{rootMargin:'100px'}).observe(host);else{visible=true;}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frameId);frameId=0;}else requestRender();});
 const rotateButton=document.getElementById('auto-rotate');
 function setRotating(value){rotating=value;rotateButton.setAttribute('aria-pressed',String(value));requestRender();}
 rotateButton.addEventListener('click',()=>setRotating(!rotating));
 function zoom(delta){distance=T.MathUtils.clamp(distance+delta,140,320);requestRender();}
 document.getElementById('zoom-in').addEventListener('click',()=>zoom(-15));
 document.getElementById('zoom-out').addEventListener('click',()=>zoom(15));
 document.getElementById('reset-view').addEventListener('click',()=>{yaw=.57;elevation=.59;distance=host.clientWidth<520?285:218;setRotating(false);requestRender();});
 let pointer=null,previousX=0,previousY=0;
 host.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer=e.pointerId;previousX=e.clientX;previousY=e.clientY;host.setPointerCapture(e.pointerId);setRotating(false);});
 host.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;yaw-=(e.clientX-previousX)*.007;if(e.pointerType!=='touch')elevation=T.MathUtils.clamp(elevation+(e.clientY-previousY)*.005,.22,1.2);previousX=e.clientX;previousY=e.clientY;requestRender();});
 const endPointer=()=>{pointer=null;};host.addEventListener('pointerup',endPointer);host.addEventListener('pointercancel',endPointer);host.addEventListener('lostpointercapture',endPointer);
 host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0'].includes(e.key))return;e.preventDefault();setRotating(false);if(e.key==='ArrowLeft')yaw-=.12;if(e.key==='ArrowRight')yaw+=.12;if(e.key==='ArrowUp')elevation=Math.min(elevation+.08,1.2);if(e.key==='ArrowDown')elevation=Math.max(elevation-.08,.22);if(e.key==='+'||e.key==='=')zoom(-15);if(e.key==='-')zoom(15);if(e.key==='0')document.getElementById('reset-view').click();requestRender();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setRotating(false);fallback();});
 if(host.clientWidth<520)distance=285;
 // Start static: intentional movement is available even with reduced-motion preferences.
 if(reduced)setRotating(false);
 resize();requestRender();
})();
