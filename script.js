// =========================
// RED CREEK - COMBAT SYSTEM V1
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

// =========================
// START GAME
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
// INIT WORLD
// =========================
function init(){

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87b5ff);
  scene.fog = new THREE.FogExp2(0x87b5ff, 0.015);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // LIGHTING
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(50, 100, 30);
  scene.add(sun);

  // GROUND
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 600),
    new THREE.MeshStandardMaterial({ color: 0x2f8a3a })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  buildWorld();
  spawnEnemies();

  player.position.set(0, 2, 20);
}

// =========================
// WORLD
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

function buildWorld(){

  box(0,0,60,20,10,20,0x444444); // spawn
  box(-30,0,0,12,10,12,0x5a5a5a);
  box(30,0,0,12,12,12,0x4f4f4f);
  box(0,0,-25,14,10,14,0x4a4a4a);

  for(let i=0;i<6;i++){
    box(-50+i*20,0,-90,10,8,10,0x666666);
  }

  box(-70,0,-140,25,15,25,0x3d3d3d);
  box(70,0,-140,25,15,25,0x3d3d3d);
}

// =========================
// ENEMIES
// =========================
function spawnEnemies(){

  for(let i=0;i<5;i++){

    const enemy = new THREE.Mesh(
      new THREE.BoxGeometry(2,4,2),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );

    enemy.position.set(
      (Math.random()-0.5)*100,
      2,
      -Math.random()*120
    );

    enemy.health = 100;

    scene.add(enemy);
    enemies.push(enemy);
  }
}

// =========================
// SHOOTING
// =========================
document.addEventListener("mousedown", shoot);

function shoot(){

  const ray = new THREE.Raycaster();

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  ray.set(camera.position, dir);

  const hits = ray.intersectObjects(enemies);

  if(hits.length > 0){

    const target = hits[0].object;

    target.health -= 50;

    // simple hit feedback
    target.material.color.set(0x000000);

    setTimeout(()=>{
      if(target.health > 0){
        target.material.color.set(0xff0000);
      }
    }, 100);

    if(target.health <= 0){
      scene.remove(target);
      enemies = enemies.filter(e => e !== target);
    }
  }
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

  camera.position.copy(player.position);

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  renderer.render(scene, camera);
}
