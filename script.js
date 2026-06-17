// =========================
// RED CREEK - V2 WORLD + GUN + AI SYSTEM
// =========================

let scene, camera, renderer;

const player = {
  position: new THREE.Vector3(0, 2, 20),
  velocity: new THREE.Vector3(),
  speed: 0.12,
  sprint: 0.2,
  canJump: false
};

let yaw = 0;
let pitch = 0;

const keys = {};
let colliders = [];
let enemies = [];

// GUN SYSTEM
let ammo = 30;
let maxAmmo = 30;
let recoil = 0;

// =========================
// START
// =========================
window.addEventListener("load", () => {
  document.getElementById("startBtn").addEventListener("click", startGame);
});

function startGame(){
  document.getElementById("menu").style.display = "none";
  document.getElementById("hud").style.display = "block";

  init();
  animate();

  document.body.requestPointerLock();
}

// =========================
// INIT
// =========================
function init(){

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87b5ff);
  scene.fog = new THREE.FogExp2(0x87b5ff, 0.02);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth/window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // LIGHT
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(50,100,30);
  scene.add(sun);

  // GROUND
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(800,800),
    new THREE.MeshStandardMaterial({ color: 0x2f8a3a })
  );
  ground.rotation.x = -Math.PI/2;
  scene.add(ground);

  buildWorldV2();
  spawnEnemies();

  player.position.set(0,2,20);

  createHUD();
}

// =========================
// WORLD V2 (REAL STRUCTURE)
// =========================
function box(x,y,z,w,h,d,color=0x555555){

  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({ color })
  );

  m.position.set(x,y+h/2,z);
  scene.add(m);
  colliders.push(m);

  return m;
}

function buildWorldV2(){

  // 🛡 SPAWN BASE
  box(0,0,80,30,10,30,0x444444);

  // 🏙 MAIN STREET
  for(let i=-2;i<=2;i++){
    box(i*25,0,0,12,10,12,0x5a5a5a);
  }

  // 🏪 CENTRAL BLOCK
  box(0,0,-40,20,12,20,0x4a4a4a);

  // 🏘 RESIDENTIAL GRID
  for(let x=-2;x<=2;x++){
    for(let z=-2;z<=-5;z--){
      box(x*25,0,z*25,10,8,10,0x666666);
    }
  }

  // 🏭 INDUSTRIAL ZONE
  for(let i=0;i<6;i++){
    box(-120 + i*40,0,-160,18,15,18,0x3d3d3d);
  }

  // 🛣 ROAD
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(60,400),
    new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
  );
  road.rotation.x = -Math.PI/2;
  scene.add(road);
}

// =========================
// ENEMIES (AI V1)
// =========================
function spawnEnemies(){

  for(let i=0;i<6;i++){

    const e = new THREE.Mesh(
      new THREE.BoxGeometry(2,4,2),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );

    e.position.set(
      (Math.random()-0.5)*200,
      2,
      -Math.random()*120
    );

    e.health = 100;

    scene.add(e);
    enemies.push(e);
  }
}

// =========================
// AI V1 (CHASE PLAYER)
// =========================
function updateAI(){

  enemies.forEach(e => {

    const dir = new THREE.Vector3()
      .subVectors(player.position, e.position);

    const dist = dir.length();

    if(dist < 60){
      dir.normalize();
      e.position.add(dir.multiplyScalar(0.05));
    }

    // look at player (simple)
    e.lookAt(player.position);
  });
}

// =========================
// SHOOTING (V2)
// =========================
document.addEventListener("mousedown", shoot);

function shoot(){

  if(ammo <= 0) return;

  ammo--;

  recoil = 0.05;

  const ray = new THREE.Raycaster();
  const dir = new THREE.Vector3();

  camera.getWorldDirection(dir);
  ray.set(camera.position, dir);

  const hits = ray.intersectObjects(enemies);

  if(hits.length > 0){

    const target = hits[0].object;

    target.health -= 40;

    target.material.color.set(0x000000);

    setTimeout(()=>{
      if(target.health > 0){
        target.material.color.set(0xff0000);
      }
    },100);

    if(target.health <= 0){
      scene.remove(target);
      enemies = enemies.filter(x => x !== target);
    }
  }
}

// =========================
// HUD
// =========================
function createHUD(){

  const hud = document.getElementById("hud");

  const ammoText = document.createElement("div");
  ammoText.id = "ammoText";
  hud.appendChild(ammoText);

  setInterval(()=>{
    ammoText.innerText = `Ammo: ${ammo}/${maxAmmo}`;
  },100);
}

// =========================
// INPUT
// =========================
document.addEventListener("keydown", e=>{
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", e=>{
  keys[e.key.toLowerCase()] = false;
});

document.addEventListener("mousemove", e=>{
  if(document.pointerLockElement !== document.body) return;

  const sens = 0.002;

  yaw -= e.movementX * sens;
  pitch -= e.movementY * sens;

  pitch = Math.max(-1.5, Math.min(1.5, pitch));
});

// =========================
// COLLISION
// =========================
function getBox(pos){
  return new THREE.Box3().setFromCenterAndSize(
    pos,
    new THREE.Vector3(1,3,1)
  );
}

// =========================
// LOOP
// =========================
function animate(){

  requestAnimationFrame(animate);

  updateAI();

  const speed = keys["shift"] ? player.sprint : player.speed;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3().crossVectors(forward, camera.up);

  let move = new THREE.Vector3();

  if(keys["w"]) move.add(forward.clone().multiplyScalar(speed));
  if(keys["s"]) move.add(forward.clone().multiplyScalar(-speed));
  if(keys["a"]) move.add(right.clone().multiplyScalar(-speed));
  if(keys["d"]) move.add(right.clone().multiplyScalar(speed));

  player.velocity.y -= 0.02;

  if(keys[" "] && player.canJump){
    player.velocity.y = 0.35;
    player.canJump = false;
  }

  move.add(player.velocity);

  const next = player.position.clone().add(move);
  const boxP = getBox(next);

  let blocked = false;

  for(let c of colliders){
    const b = new THREE.Box3().setFromObject(c);
    if(boxP.intersectsBox(b)){
      blocked = true;
      break;
    }
  }

  if(!blocked){
    player.position.copy(next);
  }

  if(player.position.y < 2){
    player.position.y = 2;
    player.velocity.y = 0;
    player.canJump = true;
  }

  // recoil decay
  recoil *= 0.9;
  camera.rotation.x = pitch - recoil;
  camera.rotation.y = yaw;

  camera.position.copy(player.position);

  renderer.render(scene,camera);
}
