// =========================
// RED CREEK FPS CORE V1.1
// =========================

let scene, camera, renderer;

const player = {
  position: new THREE.Vector3(0, 2, 10),
  velocity: new THREE.Vector3(),
  speed: 0.12,
  sprint: 0.2,
  canJump: false
};

let yaw = 0;
let pitch = 0;

const keys = {};
let colliders = [];

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
    new THREE.PlaneGeometry(500, 500),
    new THREE.MeshStandardMaterial({ color: 0x2f8a3a })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // GRID (movement visibility)
  const grid = new THREE.GridHelper(500, 50);
  scene.add(grid);

  // CENTER TEST OBJECT
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(5,5,5),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  cube.position.set(0,2.5,0);
  scene.add(cube);

  // WORLD BORDERS
  makeWall(0, 0, -250, 500, 10);
  makeWall(0, 0, 250, 500, 10);
  makeWall(-250, 0, 0, 10, 500);
  makeWall(250, 0, 0, 10, 500);

  player.position.set(0, 2, 10);
}

// =========================
// COLLISION WALLS
// =========================
function makeWall(x, y, z, w, d){

  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(w, 50, d),
    new THREE.MeshBasicMaterial({ visible: false })
  );

  wall.position.set(x, 25, z);
  scene.add(wall);
  colliders.push(wall);
}

// =========================
// INPUT
// =========================
document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

document.addEventListener("mousemove", (e) => {
  if (document.pointerLockElement !== document.body) return;

  const sens = 0.002;

  yaw -= e.movementX * sens;
  pitch -= e.movementY * sens;

  pitch = Math.max(-1.5, Math.min(1.5, pitch));
});

// =========================
// COLLISION BOX
// =========================
function getBox(pos){
  return new THREE.Box3().setFromCenterAndSize(
    pos,
    new THREE.Vector3(1, 3, 1)
  );
}

// =========================
// GAME LOOP
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

  if (keys["w"]) move.add(forward.clone().multiplyScalar(speed));
  if (keys["s"]) move.add(forward.clone().multiplyScalar(-speed));
  if (keys["a"]) move.add(right.clone().multiplyScalar(-speed));
  if (keys["d"]) move.add(right.clone().multiplyScalar(speed));

  // gravity
  player.velocity.y -= 0.02;

  // jump
  if (keys[" "] && player.canJump){
    player.velocity.y = 0.35;
    player.canJump = false;
  }

  move.add(player.velocity);

  const nextPos = player.position.clone().add(move);
  const pBox = getBox(nextPos);

  let blocked = false;

  for (let c of colliders){
    const b = new THREE.Box3().setFromObject(c);
    if (pBox.intersectsBox(b)){
      blocked = true;
      break;
    }
  }

  if (!blocked){
    player.position.copy(nextPos);
  }

  // ground
  if (player.position.y < 2){
    player.position.y = 2;
    player.velocity.y = 0;
    player.canJump = true;
  }

  // camera
  camera.position.copy(player.position);

  camera.rotation.order = "YXZ";
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  renderer.render(scene, camera);
}
