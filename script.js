let scene, camera, renderer;

let keys = {};
let yaw = 0;
let pitch = 0;

const player = {
    pos: new THREE.Vector3(0,2,10),
    vel: new THREE.Vector3(),
    speed: 0.12,
    jump: 0.3,
    gravity: 0.02,
    canJump: false
};

window.onload = () => {
    document.getElementById("startBtn").onclick = start;
};

function start(){

    document.getElementById("menu").style.display = "none";
    document.getElementById("hud").style.display = "block";

    init();
    animate();

    document.body.requestPointerLock();
}

function init(){

    // CLEAN SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87b5ff);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    // REMOVE OLD CANVAS IF EXISTS (IMPORTANT FIX)
    const old = document.querySelector("canvas");
    if(old) old.remove();

    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // LIGHT
    scene.add(new THREE.AmbientLight(0xffffff,0.8));

    const sun = new THREE.DirectionalLight(0xffffff,1);
    sun.position.set(50,100,50);
    scene.add(sun);

    // TEST GROUND (YOU MUST SEE THIS)
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500,500),
        new THREE.MeshStandardMaterial({color:0x2f8a3a})
    );

    ground.rotation.x = -Math.PI/2;
    scene.add(ground);

    // INPUT
    document.addEventListener("keydown",e=>{
        keys[e.key.toLowerCase()] = true;
    });

    document.addEventListener("keyup",e=>{
        keys[e.key.toLowerCase()] = false;
    });

    document.addEventListener("mousemove",e=>{

        if(document.pointerLockElement !== document.body) return;

        yaw -= e.movementX * 0.002;
        pitch -= e.movementY * 0.002;

        pitch = Math.max(-1.4,Math.min(1.4,pitch));
    });
}

function move(){

    if(keys["w"]) player.pos.z -= player.speed;
    if(keys["s"]) player.pos.z += player.speed;
    if(keys["a"]) player.pos.x -= player.speed;
    if(keys["d"]) player.pos.x += player.speed;

    player.vel.y -= player.gravity;

    if(player.pos.y <= 2){
        player.pos.y = 2;
        player.vel.y = 0;
        player.canJump = true;
    }

    if(keys[" "] && player.canJump){
        player.vel.y = player.jump;
        player.canJump = false;
    }

    player.pos.y += player.vel.y;
}

function animate(){

    requestAnimationFrame(animate);

    move();

    camera.position.copy(player.pos);

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    renderer.render(scene,camera);
}

window.addEventListener("resize",()=>{
    if(!camera) return;

    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth,window.innerHeight);
});
