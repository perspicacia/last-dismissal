// Authoring source for the static doll. Front is -Z, feet are at Y=0.
// All visible shapes have real geometry; no photo planes or alpha extrusion.
import * as THREE from 'three';
import {mergeGeometries,mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

const TAU=Math.PI*2;
const vec=p=>new THREE.Vector3(...p);
const noise=(x,y)=>{const a=Math.sin(x*127.1+y*311.7)*43758.5453;return a-Math.floor(a);};

function surface(fn,columns=48,rows=24){
  const positions=[],uv=[],indices=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
    positions.push(...fn(i/columns,j/rows));uv.push(i/columns,j/rows);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
    const a=j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;
    indices.push(a,b,c,b,d,c);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

function texture(type){
  const w=128,h=128,data=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const n=noise(x,y),weave=(x%4===0?-.045:0)+(y%4===0?-.045:0);
    const v=type==='hair'?.84+.12*Math.sin(x*.51+Math.sin(y*.035)*.65)+n*.06:.92+weave+n*.045;
    const i=(y*w+x)*4;data[i]=data[i+1]=data[i+2]=Math.round(THREE.MathUtils.clamp(v,0,1)*255);data[i+3]=255;
  }
  const map=new THREE.DataTexture(data,w,h);map.name=`doll-${type}-surface`;
  map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(type==='hair'?1:5,type==='hair'?2:5);map.needsUpdate=true;return map;
}

function materials(){
  const cloth=texture('weave'),hair=texture('hair');
  const standard=(name,color,props={})=>{const m=new THREE.MeshStandardMaterial({name,color,roughness:.7,...props});return m;};
  return {
    skin:standard('aged ivory porcelain','#e2d7c1',{roughness:.36,vertexColors:true}),
    joint:standard('porcelain joints','#d1c5ad',{roughness:.42}),
    navy:standard('woven navy uniform','#172031',{map:cloth,roughness:.94}),
    cream:standard('woven cream collar','#dcd4bb',{map:cloth,roughness:.91}),
    trim:standard('navy piping','#252d3a',{roughness:.85}),
    hair:standard('ash blonde hair','#b9a478',{map:hair,roughness:.58}),
    socket:standard('eyelid recess','#574136',{roughness:.8}),
    white:standard('glass eye sclera','#d6cfc0',{roughness:.2}),
    iris:new THREE.MeshPhysicalMaterial({name:'amber glass iris',color:'#ffffff',vertexColors:true,roughness:.16,clearcoat:1,clearcoatRoughness:.08}),
    black:standard('glass pupils','#120e0b',{roughness:.12}),
    lip:standard('muted rose lips','#a77e6e',{roughness:.58}),
    seam:standard('joint seams','#756c5c',{roughness:.9}),
    shoe:standard('worn dark leather','#1d1b1c',{roughness:.4}),
    metal:standard('shoe buckles','#8c8268',{metalness:.65,roughness:.48})
  };
}

function add(group,name,geometry,mat,position=[0,0,0],scale=[1,1,1]){
  if(mat.vertexColors&&!geometry.hasAttribute('color'))geometry.setAttribute('color',new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*3).fill(1),3));
  const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;mesh.position.set(...position);mesh.scale.set(...scale);
  mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;
}
function ellipsoid(group,name,position,size,mat,segments=24){
  const geometry=new THREE.SphereGeometry(1,segments,Math.max(12,segments/2));
  if(mat.vertexColors){const colors=[],p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){const shade=.96+.035*noise(i,2);colors.push(shade,shade,shade);}
    geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  }
  return add(group,name,geometry,mat,position,size);
}
function tube(group,name,points,radius,mat,segments=16){
  return add(group,name,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(vec)),segments,radius,6,false),mat);
}
function limb(group,name,a,b,r1,r2,mat){
  const start=vec(a),end=vec(b),delta=end.clone().sub(start);
  const mesh=add(group,name,new THREE.CapsuleGeometry(1,1,5,12),mat,start.clone().add(end).multiplyScalar(.5).toArray(),[r1,delta.length()/3,r2]);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
}

// Closed elliptical shell, including end caps, with subtle cloth folds.
function garment(group,name,y0,y1,profile,mat,pleats=0){
  const geometry=surface((u,v)=>{
    const angle=u*TAU,r=profile(v),fold=1+pleats*Math.cos(angle*14)*(1-v);
    return [Math.sin(angle)*r[0]*fold,y0+(y1-y0)*v,Math.cos(angle)*r[1]*fold];
  },56,14);
  const mesh=add(group,name,geometry,mat);
  for(const [y,v] of [[y0,0],[y1,1]]){
    const r=profile(v);const cap=add(group,`${name}-cap`,new THREE.CircleGeometry(1,56),mat,[0,y,0],[r[0],r[1],1]);
    cap.rotation.x=v===0?Math.PI/2:-Math.PI/2;
  }
  return mesh;
}

function face(group,m){
  const head=new THREE.Group();head.name='head';head.position.y=1.30;head.rotation.z=-.10;group.add(head);
  const geometry=new THREE.SphereGeometry(1,64,40),p=geometry.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const taper=y<-.15?1-.22*((-y-.15)/.85):1;
    const xx=x*.183*taper,yy=y*.225,zz=z*.164;
    // A shallow eye socket and cheek swell sculpt the porcelain itself.
    const front=Math.max(0,-z),eyes=Math.exp(-((Math.abs(xx)-.081)**2/.0013+(yy-.038)**2/.0018));
    const cheeks=Math.exp(-((Math.abs(xx)-.095)**2/.0017+(yy+.037)**2/.0013));
    p.setXYZ(i,xx,yy,zz+front*(eyes*.014-cheeks*.005));
    const c=new THREE.Color('#ffffff').lerp(new THREE.Color('#dcafa0'),cheeks*front*.20);
    colors.push(c.r,c.g,c.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  add(head,'porcelain-head',geometry,m.skin);
  for(const side of [-1,1]){
    ellipsoid(head,'ear',[side*.174,-.006,.005],[.026,.045,.023],m.skin);
    ellipsoid(head,'ear-inner',[side*.189,-.007,-.009],[.009,.025,.015],m.lip,16);
    const x=side*.078,y=.037;
    ellipsoid(head,'eye-socket',[x,y,-.130],[.060,.040,.029],m.socket,32);
    ellipsoid(head,'glass-eye',[x,y,-.139],[.055,.034,.028],m.white,32);
    const irisGeo=new THREE.SphereGeometry(1,36,20),ip=irisGeo.attributes.position,ic=[];
    for(let i=0;i<ip.count;i++){
      const px=ip.getX(i),py=ip.getY(i),r=Math.hypot(px,py),angle=Math.atan2(py,px);
      const fiber=.5+.5*Math.sin(angle*57+Math.sin(r*30)*2),edge=THREE.MathUtils.smoothstep(r,.76,1);
      const c=new THREE.Color('#b19556').lerp(new THREE.Color('#674f2d'),fiber*.48).lerp(new THREE.Color('#342c21'),edge*.82);
      ic.push(c.r,c.g,c.b);
    }
    irisGeo.setAttribute('color',new THREE.Float32BufferAttribute(ic,3));
    add(head,'amber-iris',irisGeo,m.iris,[x,y-.002,-.169],[.027,.029,.007]);
    ellipsoid(head,'pupil',[x,y-.002,-.178],[.012,.014,.003],m.black,24);
    ellipsoid(head,'eye-glint',[x-.006,y+.008,-.181],[.003,.004,.0015],m.white,12);
    const upper=[],lower=[];
    for(let i=0;i<=12;i++){
      const a=Math.PI*i/12;
      upper.push([x+.056*Math.cos(a),y+.033*Math.sin(a),-.141-.022*Math.sin(a)]);
      lower.push([x+.056*Math.cos(a),y-.031*Math.sin(a),-.141-.022*Math.sin(a)]);
    }
    tube(head,'upper-eyelid',upper,.0045,m.joint,24);tube(head,'lower-eyelid',lower,.0035,m.skin,24);
    tube(head,'upper-lash',upper.map(([a,b,c])=>[a,b+.001,c-.003]),.0018,m.socket,24);
    for(let i=0;i<6;i++){
      const a=.28+i*.32,x0=x+.056*Math.cos(a),y0=y+.033*Math.sin(a),z0=-.144-.022*Math.sin(a);
      tube(head,'eyelash',[[x0,y0,z0],[x0+side*.002,y0+.004,z0-.002],[x0+side*.004,y0+.009,z0]],.0007,m.socket,4);
    }
    tube(head,'eyebrow',[[x-side*.048,.104,-.126],[x,.114,-.145],[x+side*.047,.105,-.127]],.0025,m.hair,16);
  }
  ellipsoid(head,'nose-bridge',[0,-.010,-.156],[.012,.029,.013],m.skin,24);
  ellipsoid(head,'nose-tip',[0,-.032,-.167],[.017,.014,.017],m.skin,24);
  for(const side of [-1,1])ellipsoid(head,'nostril',[side*.008,-.040,-.174],[.003,.0015,.002],m.socket,12);
  tube(head,'upper-lip',[[-.031,-.090,-.146],[-.013,-.085,-.156],[0,-.089,-.157],[.013,-.085,-.156],[.031,-.090,-.146]],.003,m.lip,24);
  tube(head,'lower-lip',[[-.030,-.092,-.146],[0,-.099,-.157],[.030,-.092,-.146]],.004,m.lip,20);
  tube(head,'closed-mouth',[[-.027,-.091,-.148],[0,-.092,-.161],[.027,-.091,-.148]],.0012,m.socket,20);
  hair(head,m);return head;
}

function hair(head,m){
  const cap=surface((u,v)=>{
    const phi=u*TAU,front=Math.max(0,-Math.cos(phi)),end=2.13-front**5*1.04;
    const theta=.005+v*end,wave=Math.sin(phi*13+theta*2)*.003*v;
    return [Math.sin(phi)*(.195+wave)*Math.sin(theta),.245*Math.cos(theta)+.005,Math.cos(phi)*(.180+wave)*Math.sin(theta)+.020];
  },64,24);
  // Surface parameterization winds inward; reverse once for outward normals.
  const index=cap.index;for(let i=0;i<index.count;i+=3){const a=index.getX(i);index.setX(i,index.getX(i+2));index.setX(i+2,a);}cap.computeVertexNormals();
  add(head,'bob-scalp',cap,m.hair);
  // Each lock is a curved solid oval sweep, including back and both sides.
  for(let k=0;k<29;k++){
    const phi=-2.14+k*(4.28/28),side=Math.sin(phi),back=Math.cos(phi);
    const points=[
      [side*.072,.214,back*.074+.026],
      [side*.158,.155,back*.157+.024],
      [side*(.207+Math.sin(k)*.010),.020,back*.184+.032],
      [side*(.214+Math.sin(k*1.7)*.014),-.119,back*.185+.019],
      [side*.190,-.181+Math.sin(k*1.7)*.018,back*.165+.012],
      [side*.164,-.145+Math.sin(k*1.7)*.012,back*.137+.009]
    ];
    lock(head,`bob-lock-${k}`,points,.024+noise(k,3)*.010,m.hair);
  }
  // Swept asymmetrical fringe leaves the glass eyes and nose unobscured.
  for(let k=0;k<9;k++){
    const x=-.153+k*.037,edge=Math.abs(x)/.17;
    const points=[[x*.5,.226,-.055],[x*.75,.191,-.130],[x-.006,.149,-.170],[x-.020,.090+edge*.024+(k>4?.018:0),-.166]];
    lock(head,`fringe-${k}`,points,.021,m.hair);
  }
}

function lock(group,name,points,radius,mat){
  const curve=new THREE.CatmullRomCurve3(points.map(vec)),frames=curve.computeFrenetFrames(18,false);
  const geometry=surface((u,v)=>{
    const i=Math.min(18,Math.round(v*18)),p=curve.getPointAt(v),a=u*TAU;
    const r=radius*(.46+.54*Math.sin(Math.PI*(.08+v*.86))) * (v>.88?1-(v-.88)*5.4:1);
    p.addScaledVector(frames.normals[i],Math.cos(a)*r).addScaledVector(frames.binormals[i],Math.sin(a)*r*.68);
    return p.toArray();
  },10,18);
  // The tube must be outward-facing (front/back inspection catches inversions).
  add(group,name,geometry,mat);
}

function collar(group,m){
  for(const side of [-1,1]){
    const points=[[side*.036,1.085,-.080],[side*.182,1.01,-.085],[side*.083,.906,-.143],[side*.023,.956,-.151]];
    const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);
    for(const [x,y] of points.slice(1))shape.lineTo(x,y);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.013,bevelEnabled:true,bevelSize:.004,bevelThickness:.003,bevelSegments:2});
    // Collar follows the chest instead of lying on a flat photograph.
    const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)-.102+(p.getY(i)-.94)*.13);geometry.computeVertexNormals();
    add(group,'sailor-collar-front',geometry,m.cream);
    tube(group,'collar-piping',[[side*.043,1.065,-.090],[side*.158,1.006,-.097],[side*.080,.927,-.107],[side*.039,.956,-.108]],.0025,m.trim,24);
    // Real folded bow loops and two flowing fabric tails.
    tube(group,'bow-fold',[[side*.010,.918,-.119],[side*.056,.950,-.109],[side*.085,.924,-.109],[side*.053,.903,-.113],[side*.010,.918,-.119]],.011,m.cream,24);
    const ribbon=surface((u,v)=>{
      const a=u*TAU,width=.007+.022*Math.sin(Math.PI*v),y=.916-v*.170;
      return [side*(.018+v*.044)+Math.sin(a)*width,y,Math.cos(a)*.008-.104-Math.sin(v*Math.PI)*.010];
    },12,22);
    add(group,'bow-ribbon',ribbon,m.cream);
  }
  ellipsoid(group,'bow-knot',[0,.918,-.123],[.017,.022,.024],m.cream,24);
  const back=add(group,'sailor-collar-back',new THREE.BoxGeometry(.29,.12,.016),m.cream,[0,1.02,.093]);
  back.rotation.x=.17;
  for(const x of [-.132,.132])tube(group,'back-collar-piping',[[x,1.065,.107],[x,.971,.093]],.0025,m.trim,8);
  tube(group,'back-collar-piping',[[-.132,.971,.093],[0,.971,.100],[.132,.971,.093]],.0025,m.trim,12);
}

function hands(group,side,m){
  const x=side*.267,y=.608,z=-.008;
  ellipsoid(group,'wrist-joint',[x,y+.050,z],[.028,.027,.029],m.joint);
  ellipsoid(group,'palm',[x,y,z-.011],[.031,.048,.020],m.skin,24);
  for(let i=0;i<4;i++){
    const px=x+side*(i-1.5)*.015,yy=y-.035;
    limb(group,'porcelain-finger',[px,yy,z-.011],[px+side*.006,yy-.037+Math.abs(i-1.4)*.004,z-.017],.0065,.007,m.joint);
  }
  limb(group,'thumb',[x-side*.022,y+.003,z-.014],[x-side*.039,y-.026,z-.021],.009,.010,m.joint);
}

function mergeParts(root){
  // Merge only within major parts: face/head, clothing, limbs. This keeps the
  // authoring hierarchy useful while avoiding hundreds of hair draw calls.
  for(const group of [...root.children]){
    if(!group.isGroup)continue;
    const batches=new Map();group.updateMatrixWorld(true);
    for(const mesh of [...group.children]){
      if(!mesh.isMesh)continue;
      const key=mesh.material;let geometry=mesh.geometry.clone();mesh.updateMatrix();geometry.applyMatrix4(mesh.matrix);
      if(!geometry.index){const indexed=mergeVertices(geometry,1e-6);geometry.dispose();geometry=indexed;}
      if(!batches.has(key))batches.set(key,[]);batches.get(key).push(geometry);group.remove(mesh);mesh.geometry.dispose();
    }
    for(const [mat,geometries] of batches){
      const geometry=mergeGeometries(geometries,false);for(const g of geometries)g.dispose();
      if(!geometry)throw new Error(`Could not merge ${group.name}/${mat.name}`);
      add(group,`${group.name}/${mat.name}`,geometry,mat);
    }
  }
}

export function createStudentDoll(){
  const root=new THREE.Group();root.name='student-doll';
  root.userData={assetVersion:1,kind:'static-solid-model',pose:'relaxed-supine',front:'-Z',heightMeters:1.55,rigged:false};
  const m=materials();face(root,m);
  const uniform=new THREE.Group();uniform.name='uniform';root.add(uniform);
  garment(uniform,'blouse',.71,1.055,v=>[.105+Math.sin(v*Math.PI)*.037,.077+Math.sin(v*Math.PI)*.022],m.navy,.014);
  garment(uniform,'pleated-skirt',.37,.735,v=>[.225-.118*v,.143-.066*v],m.navy,.065);
  tube(uniform,'waist-seam',Array.from({length:41},(_,i)=>[Math.sin(i*TAU/40)*.11,.728,Math.cos(i*TAU/40)*.083]),.003,m.trim,40);
  for(const side of [-1,1]){
    const sleeve=ellipsoid(uniform,'puff-sleeve',[side*.169,.963,0],[.068,.093,.079],m.navy,32);sleeve.rotation.z=side*.23;
    limb(uniform,'long-sleeve',[side*.181,.941,0],[side*.263,.691,-.002],.047,.043,m.navy);
    const cuff=ellipsoid(uniform,'sailor-cuff',[side*.258,.699,-.002],[.042,.039,.043],m.cream);
    cuff.rotation.z=side*.24;
    for(const y of [.687,.703])tube(uniform,'cuff-stripe',Array.from({length:25},(_,i)=>[side*.258+Math.sin(i*TAU/24)*.043,y,Math.cos(i*TAU/24)*.044-.002]),.0027,m.trim,24);
  }
  collar(uniform,m);
  const body=new THREE.Group();body.name='porcelain-body';root.add(body);
  ellipsoid(body,'neck',[0,1.092,0],[.043,.066,.045],m.skin);
  ellipsoid(body,'torso',[0,.86,0],[.104,.169,.079],m.skin);
  for(const side of [-1,1]){
    ellipsoid(body,'shoulder-joint',[side*.128,1.008,0],[.043,.041,.042],m.joint);
    hands(body,side,m);
    limb(body,'thigh',[side*.065,.56,.012],[side*.068,.348,.009],.046,.048,m.skin);
    ellipsoid(body,'knee-joint',[side*.068,.334,.005],[.043,.040,.042],m.joint);
    tube(body,'knee-seam',[[side*.106,.337,-.01],[side*.083,.323,-.036],[side*.056,.323,-.036],[side*.031,.337,-.01]],.0018,m.seam,16);
    limb(body,'calf',[side*.068,.315,.009],[side*.070,.116,.005],.036,.038,m.skin);
  }
  const feet=new THREE.Group();feet.name='socks-and-shoes';root.add(feet);
  for(const side of [-1,1]){
    limb(feet,'cream-sock',[side*.070,.242,.007],[side*.070,.085,-.010],.0365,.040,m.cream);
    ellipsoid(feet,'sock-cuff',[side*.070,.251,.009],[.040,.018,.044],m.cream);
    ellipsoid(feet,'mary-jane-shoe',[side*.070,.048,-.034],[.051,.043,.094],m.shoe,32);
    ellipsoid(feet,'shoe-sole',[side*.070,.015,-.033],[.052,.015,.093],m.shoe,24);
    tube(feet,'shoe-strap',[[side*.119,.062,-.057],[side*.070,.087,-.059],[side*.021,.062,-.057]],.008,m.shoe,16);
    add(feet,'strap-buckle',new THREE.BoxGeometry(.016,.018,.008),m.metal,[side*.112,.070,-.059]);
  }
  mergeParts(root);
  // Relaxed supine pose: bend the neck and knees and bring the back, hem and
  // heels to the same support plane. A rigid standing pose would float above it.
  const support=[[0,.155],[.18,.150],[.37,.078],[.75,.13],[.95,.118],[1.055,.078],[1.17,0],[1.55,0]];
  const offset=y=>{for(let i=1;i<support.length;i++)if(y<=support[i][0]){const [a,za]=support[i-1],[b,zb]=support[i];return THREE.MathUtils.lerp(za,zb,THREE.MathUtils.clamp((y-a)/(b-a),0,1));}return 0;};
  for(const group of root.children){if(group.name==='head')continue;group.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+offset(p.getY(i)));mesh.geometry.computeVertexNormals();mesh.geometry.normalizeNormals();});}
  // Duplicated UV poles can have zero normals after recomputation. Recover the
  // normal from their coincident vertex so every exported normal is unit length.
  root.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,valid=new Map();
    const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e6)).join(',');
    for(let i=0;i<n.count;i++)if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))>.001)valid.set(key(i),[n.getX(i),n.getY(i),n.getZ(i)]);
    for(let i=0;i<n.count;i++)if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<.001)n.setXYZ(i,...(valid.get(key(i))??[0,1,0]));mesh.geometry.normalizeNormals();
  });
  const bounds=new THREE.Box3().setFromObject(root),scale=1.55/(bounds.max.y-bounds.min.y);
  root.scale.setScalar(scale);root.position.y=-bounds.min.y*scale;root.updateMatrixWorld(true);
  return root;
}
