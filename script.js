// =====================================
// RED CREEK FPS V3 - GUN SYSTEM UPGRADE
// (WORKS WITH YOUR CURRENT FPS CORE V3)
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
    position: new THREE.Vector3(0, 2, 20),
    velocity: new THREE.Vector3(),

    walkSpeed: 0.12,
    sprintSpeed: 0.18,

    jumpForce: 0.32,
    gravity: 0.018,

    canJump: false
};

// ==========================
// GUN V3
// ==========================

const gun = {
    ammo: 30,
    maxAmmo: 30,

    reserveAmmo: 90,

    fireRate: 6,        // frames between shots
    fireCooldown: 0,

    reloadTime: 90,
    reloadTimer: 0,

    reloading: false,

    recoil: 0
};

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
// INIT (USES YOUR FPS CORE V3 WORLD)
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
    spawnEnemies();

    setupInput();
    createCrosshair();
    updateAmmoUI();
}

// ==========================
// LIGHTS
// ==========================

function createLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const sun = new THREE.DirectionalLight(0xffffff, 1.4);
    sun.position.set(100, 150, 50);
    scene.add(sun);
}

// ==========================
// GROUND
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
// CROSSHAIR
// ==========================

function createCrosshair() {

    const cross = document.createElement("div");
    cross.id = "crosshair";
    cross.innerHTML = "+";

    cross.style.position = "absolute";
    cross.style.left = "50%";
    cross.style.top = "50%";
    cross.style.transform = "translate(-50%, -50%)";
    cross.style.color = "white";
    cross.style.fontSize = "24px";
    cross.style.userSelect = "none";

    document.body.appendChild(cross);
}

// ==========================
// INPUT
// ==========================

function setupInput() {

    document.addEventListener("keydown", e => {

        keys[e.key.toLowerCase()] = true;

        // reload
        if (e.key.toLowerCase() === "r") {
            startReload();
        }
    });

    document.addEventListener("keyup", e => {
        keys[e.key.toLowerCase()] = false;
    });

    document.addEventListener("mousemove", e => {

        if (document.pointerLockElement !== document.body) return;

        const sens = 0.0022;

        yaw -= e.movementX * sens;
        pitch -= e.movementY * sens;

        pitch = Math.max(-1.45, Math.min(1.45, pitch));
    });

    document.addEventListener("mousedown", shoot);
}

// ==========================
// SHOOTING V3
// ==========================

function shoot() {

    if (gun.reloading) return;
    if (gun.fireCooldown > 0) return;
    if (gun.ammo <= 0) return;

    gun.ammo--;
    gun.fireCooldown = gun.fireRate;

    gun.recoil = 0.04;

    const ray = new THREE.Raycaster();
    const dir = new THREE.Vector3();

    camera.getWorldDirection(dir);
    ray.set(camera.position, dir);

    const hits = ray.intersectObjects(enemies);

    if (hits.length > 0) {

        const target = hits[0].object;

        target.health -= 50;

        target.material.color.set(0x000000);

        setTimeout(() => {
            if (target.health > 0) {
                target.material.color.set(0xff0000);
            }
        }, 100);

        if (target.health <= 0) {
            scene.remove(target);
            enemies = enemies.filter(e => e !== target);
        }
    }

    updateAmmoUI();
}

// ==========================
// RELOAD SYSTEM
// ==========================

function startReload() {

    if (gun.reloading) return;
    if (gun.ammo === gun.maxAmmo) return;
    if (gun.reserveAmmo <= 0) return;

    gun.reloading = true;
    gun.reloadTimer = gun.reloadTime;
}

// ==========================
// UPDATE GUN
// ==========================

function updateGun() {

    if (gun.fireCooldown > 0) {
        gun.fireCooldown--;
    }

    if (gun.reloading) {

        gun.reloadTimer--;

        if (gun.reloadTimer <= 0) {

            const needed = gun.maxAmmo - gun.ammo;

            const taken = Math.min(needed, gun.reserveAmmo);

            gun.ammo += taken;
            gun.reserveAmmo -= taken;

            gun.reloading = false;

            updateAmmoUI();
        }
    }

    gun.recoil *= 0.85;
}

// ==========================
// HUD
// ==========================

function updateAmmoUI() {

    const hud = document.getElementById("ammo");

    if (!hud) return;

    hud.innerText =
        `Ammo: ${gun.ammo} / ${gun.maxAmmo} | Reserve: ${gun.reserveAmmo}`;
}

// ==========================
// MOVEMENT (simple hook version)
// ==========================

function updateMovement() {

    const speed = keys["shift"]
        ? player.sprintSpeed
        : player.walkSpeed;

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

    player.velocity.y -= player.gravity;

    if (keys[" "] && player.canJump) {
        player.velocity.y = player.jumpForce;
        player.canJump = false;
    }

    move.add(player.velocity);

    player.position.add(move);

    if (player.position.y < 2) {
        player.position.y = 2;
        player.velocity.y = 0;
        player.canJump = true;
    }
}

// ==========================
// CAMERA
// ==========================

function updateCamera() {

    camera.position.copy(player.position);

    camera.rotation.y = yaw;
    camera.rotation.x = pitch - gun.recoil;
}

// ==========================
// LOOP
// ==========================

function animate() {

    requestAnimationFrame(animate);

    updateGun();
    updateMovement();
    updateCamera();

    renderer.render(scene, camera);
}

// ==========================
// RESIZE
// ==========================

window.addEventListener("resize", () => {

    if (!camera) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
});
