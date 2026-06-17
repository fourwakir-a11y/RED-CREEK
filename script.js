// =====================================
// RED CREEK FPS V2 - CLEAN REBUILD
// PART 1 / 3
// =====================================

let scene, camera, renderer;

let worldObjects = [];
let enemies = [];

const keys = {};

let yaw = 0;
let pitch = 0;

// ==========================
// PLAYER
// ==========================

const player = {

    position: new THREE.Vector3(0, 2, 15),

    velocity: new THREE.Vector3(),

    walkSpeed: 0.12,
    sprintSpeed: 0.18,

    jumpForce: 0.32,
    gravity: 0.018,

    canJump: false
};

// ==========================
// GUN
// ==========================

const gun = {

    ammo: 30,
    maxAmmo: 30,

    recoil: 0,
    cooldown: 0
};

// ==========================
// START
// ==========================

window.addEventListener("load", () => {

    document
        .getElementById("startBtn")
        .addEventListener("click", startGame);
});

function startGame(){

    document.getElementById("menu").style.display = "none";
    document.getElementById("hud").style.display = "block";

    init();
    animate();

    document.body.requestPointerLock();
}

// ==========================
// INIT
// ==========================

function init(){

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8ebcff);
    scene.fog = new THREE.FogExp2(0x8ebcff, 0.012);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1500
    );

    camera.rotation.order = "YXZ";

    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createLights();
    createGround();
    createWorld();

    spawnEnemies();

    setupInput();
}

// ==========================
// LIGHTS
// ==========================

function createLights(){

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(80, 120, 40);
    scene.add(sun);
}

// ==========================
// GROUND
// ==========================

function createGround(){

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(1200, 1200),
        new THREE.MeshStandardMaterial({ color: 0x2f8a3a })
    );

    ground.rotation.x = -Math.PI / 2;

    scene.add(ground);
}
// =====================================
// WORLD + ENEMIES + INPUT
// PART 2 / 3
// =====================================

function box(x,y,z,w,h,d,color){

    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w,h,d),
        new THREE.MeshStandardMaterial({ color })
    );

    mesh.position.set(x, y + h/2, z);

    scene.add(mesh);

    worldObjects.push(mesh);

    return mesh;
}

// ==========================
// WORLD V2
// ==========================

function createWorld(){

    // Spawn
    box(0,0,60,30,12,30,0x444444);

    // Street line
    for(let i=-3;i<=3;i++){
        box(i*25,0,0,12,10,12,0x666666);
    }

    // Center building
    box(0,0,-45,22,15,22,0x555555);

    // Residential
    for(let x=-3;x<=3;x++){
        for(let z=-2;z>=-5;z--){
            box(x*22,0,z*22,10,8,10,0x777777);
        }
    }

    // Industrial
    for(let i=0;i<5;i++){
        box(-120 + i*35,0,-220,20,18,20,0x3d3d3d);
    }
}

// ==========================
// ENEMIES
// ==========================

function spawnEnemies(){

    for(let i=0;i<8;i++){

        const e = new THREE.Mesh(
            new THREE.BoxGeometry(2,4,2),
            new THREE.MeshStandardMaterial({ color:0xff0000 })
        );

        e.position.set(
            (Math.random()-0.5)*200,
            2,
            -50 - Math.random()*200
        );

        e.health = 100;

        scene.add(e);
        enemies.push(e);
    }
}
// =====================================
// MOVEMENT + CAMERA + GAME LOOP
// PART 3 / 3
// =====================================

// ==========================
// INPUT
// ==========================

function setupInput(){

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

        pitch = Math.max(-1.4, Math.min(1.4, pitch));
    });

    document.addEventListener("mousedown", shoot);
}

// ==========================
// COLLISION
// ==========================

function playerBox(pos){
    return new THREE.Box3().setFromCenterAndSize(
        pos,
        new THREE.Vector3(1,3,1)
    );
}

function checkCollision(nextPos){

    const pBox = playerBox(nextPos);

    for(const obj of worldObjects){

        const box = new THREE.Box3().setFromObject(obj);

        if(pBox.intersectsBox(box)){
            return true;
        }
    }

    return false;
}

// ==========================
// SHOOT
// ==========================

function shoot(){

    if(gun.cooldown > 0) return;
    if(gun.ammo <= 0) return;

    gun.ammo--;
    gun.cooldown = 10;

    gun.recoil = 0.03;

    const ray = new THREE.Raycaster();
    const dir = new THREE.Vector3();

    camera.getWorldDirection(dir);
    ray.set(camera.position, dir);

    const hits = ray.intersectObjects(enemies);

    if(hits.length > 0){

        const t = hits[0].object;

        t.health -= 50;

        t.material.color.set(0x000000);

        setTimeout(()=>{
            if(t.health > 0){
                t.material.color.set(0xff0000);
            }
        },100);

        if(t.health <= 0){
            scene.remove(t);
            enemies = enemies.filter(e => e !== t);
        }
    }
}

// ==========================
// MOVEMENT
// ==========================

function updateMovement(){

    const speed = keys["shift"]
        ? player.sprintSpeed
        : player.walkSpeed;

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

    player.velocity.y -= player.gravity;

    if(keys[" "] && player.canJump){
        player.velocity.y = player.jumpForce;
        player.canJump = false;
    }

    move.add(player.velocity);

    const next = player.position.clone().add(move);

    if(!checkCollision(next)){
        player.position.copy(next);
    }

    if(player.position.y < 2){
        player.position.y = 2;
        player.velocity.y = 0;
        player.canJump = true;
    }
}

// ==========================
// CAMERA
// ==========================

function updateCamera(){

    gun.recoil *= 0.85;

    camera.position.copy(player.position);

    camera.rotation.y = yaw;
    camera.rotation.x = pitch - gun.recoil;
}

// ==========================
// LOOP
// ==========================

function animate(){

    requestAnimationFrame(animate);

    if(gun.cooldown > 0) gun.cooldown--;

    updateMovement();
    updateCamera();

    renderer.render(scene,camera);
}

// ==========================
// RESIZE
// ==========================

window.addEventListener("resize", ()=>{

    if(!camera) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});
