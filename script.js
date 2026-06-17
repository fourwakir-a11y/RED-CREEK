// =====================================
// RED CREEK FPS CORE V3 + WORLD V3
// CLEAN ENGINE BASE
// =====================================

let scene, camera, renderer;

const keys = {};

let yaw = 0;
let pitch = 0;

// ==========================
// PLAYER (CLEAN FPS CORE)
// ==========================

const player = {
    position: new THREE.Vector3(0, 2, 20),
    velocity: new THREE.Vector3(),

    walkSpeed: 0.12,
    sprintSpeed: 0.18,

    jumpForce: 0.32,
    gravity: 0.018,

    canJump: false
};

// world collision objects
let colliders = [];

// ==========================
// START
// ==========================

window.addEventListener("load", () => {
    document.getElementById("startBtn")
        .addEventListener("click", startGame);
});

function startGame() {

    document.getElementById("menu").style.display = "none";
    document.getElementById("hud").style.display = "block";

    init();
    animate();

    document.body.requestPointerLock();
}

// ==========================
// INIT ENGINE
// ==========================

function init() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x87b5ff);
    scene.fog = new THREE.FogExp2(0x87b5ff, 0.010);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );

    camera.rotation.order = "YXZ";

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createLights();
    createGround();
    createWorldV3();

    setupInput();
}

// ==========================
// LIGHTING
// ==========================

function createLights() {

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(100, 150, 50);
    scene.add(sun);
}

// ==========================
// GROUND (BIGGER SCALE)
// ==========================

function createGround() {

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshStandardMaterial({ color: 0x2f8a3a })
    );

    ground.rotation.x = -Math.PI / 2;

    scene.add(ground);
}

// ==========================
// WORLD V3 (REAL MAP STRUCTURE)
// ==========================

function box(x,y,z,w,h,d,color){

    const m = new THREE.Mesh(
        new THREE.BoxGeometry(w,h,d),
        new THREE.MeshStandardMaterial({ color })
    );

    m.position.set(x, y + h/2, z);

    scene.add(m);

    colliders.push(m);

    return m;
}

function createWorldV3() {

    // =========================
    // 🏙 TOWN CENTER
    // =========================

    for(let x = -3; x <= 3; x++){
        for(let z = -2; z <= 2; z++){

            let height = 6 + Math.random() * 18;

            box(
                x * 35,
                0,
                z * 35,
                18,
                height,
                18,
                0x5a5a5a
            );
        }
    }

    // main road
    const road = new THREE.Mesh(
        new THREE.PlaneGeometry(300, 40),
        new THREE.MeshStandardMaterial({ color: 0x2b2b2b })
    );

    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    scene.add(road);

    // =========================
    // 🌲 FOREST ZONE
    // =========================

    for(let i = 0; i < 80; i++){

        const x = -300 + Math.random() * 600;
        const z = -300 - Math.random() * 500;

        const trunk = box(x,0,z,2,8,2,0x4b2e16);

        const leaves = new THREE.Mesh(
            new THREE.SphereGeometry(5, 6, 6),
            new THREE.MeshStandardMaterial({ color: 0x1f6b2a })
        );

        leaves.position.set(x, 10, z);

        scene.add(leaves);
    }

    // =========================
    // 🏭 INDUSTRIAL ZONE
    // =========================

    for(let i = 0; i < 10; i++){

        box(
            -400 + i * 40,
            0,
            200,
            30,
            20 + Math.random() * 10,
            30,
            0x3d3d3d
        );
    }

    // containers / cover
    for(let i = 0; i < 15; i++){

        box(
            -450 + Math.random() * 300,
            0,
            260 + Math.random() * 100,
            6,
            6,
            12,
            0x8a2c2c
        );
    }
}

// ==========================
// INPUT (FPS CORE FIXED)
// ==========================

function setupInput() {

    document.addEventListener("keydown", e => {
        keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener("keyup", e => {
        keys[e.key.toLowerCase()] = false;
    });

    document.addEventListener("mousemove", e => {

        if (document.pointerLockElement !== document.body) return;

        const sens = 0.0022;

        yaw -= e.movementX * sens;
        pitch -= e.movementY * sens;

        // clamp vertical look (IMPORTANT FIX)
        pitch = Math.max(-1.45, Math.min(1.45, pitch));
    });
}

// ==========================
// MOVEMENT CORE
// ==========================

function updateMovement() {

    const speed = keys["shift"]
        ? player.sprintSpeed
        : player.walkSpeed;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3()
        .crossVectors(forward, camera.up)
        .normalize();

    let move = new THREE.Vector3();

    if(keys["w"]) move.add(forward.clone().multiplyScalar(speed));
    if(keys["s"]) move.add(forward.clone().multiplyScalar(-speed));
    if(keys["a"]) move.add(right.clone().multiplyScalar(-speed));
    if(keys["d"]) move.add(right.clone().multiplyScalar(speed));

    // gravity
    player.velocity.y -= player.gravity;

    // jump
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
// COLLISION
// ==========================

function checkCollision(pos){

    const box = new THREE.Box3().setFromCenterAndSize(
        pos,
        new THREE.Vector3(1,3,1)
    );

    for(let obj of colliders){

        const b = new THREE.Box3().setFromObject(obj);

        if(box.intersectsBox(b)){
            return true;
        }
    }

    return false;
}

// ==========================
// CAMERA (CLEAN FPS FIX)
// ==========================

function updateCamera() {

    camera.position.copy(player.position);

    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

// ==========================
// LOOP
// ==========================

function animate() {

    requestAnimationFrame(animate);

    updateMovement();
    updateCamera();

    renderer.render(scene, camera);
}

// ==========================
// RESIZE
// ==========================

window.addEventListener("resize", () => {

    if(!camera) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});
