let scene, camera, renderer;

let keys = {};

let yaw = 0;
let pitch = 0;

let world = [];
let enemies = [];

const player = {
    pos: new THREE.Vector3(0,2,10),
    vel: new THREE.Vector3(),
    speed: 0.12,
    sprint: 0.18,
    jump: 0.32,
    gravity: 0.02,
    canJump: false
};

const gun = {
    ammo: 30,
    reserve: 90,
    cooldown: 0,
    reloading: false
};

let mission = "Eliminate all targets";

// START
window.onload = () => {
    document.getElementById("startBtn").onclick = start;
};

function start(){
    document.getElementById("menu").style.display="none";
    document.getElementById("hud").style.display="block";

    init();
    loop();

    document.body.requestPointerLock();
}

// INIT
function init(){

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87b5ff);
    scene.fog = new THREE.Fog(0x87b5ff, 10, 200);

    camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);

    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    addLight();
    addWorld();
    spawnEnemies();
    input();
    hud();
}

function addLight(){
    scene.add(new THREE.AmbientLight(0xffffff,0.6));

    const sun = new THREE.DirectionalLight(0xffffff,1);
    sun.position.set(50,100,50);
    scene.add(sun);
}

function addBox(x,y,z,w,h,d,c){
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(w,h,d),
        new THREE.MeshStandardMaterial({color:c})
    );

    m.position.set(x,y+h/2,z);
    scene.add(m);
    world.push(m);
}
function addWorld(){

    // TOWN
    for(let x=-3;x<=3;x++){
        for(let z=-2;z<=2;z++){
            addBox(x*20,0,z*20,10,Math.random()*10+5,10,0x666666);
        }
    }

    // FOREST
    for(let i=0;i<40;i++){
        let x = Math.random()*200-100;
        let z = Math.random()*200-150;

        addBox(x,0,z,2,6,2,0x3b2a1a);
    }

    // INDUSTRIAL
    for(let i=0;i<8;i++){
        addBox(-100+i*20,0,-120,12,15,12,0x333333);
    }
}

function spawnEnemies(){
    for(let i=0;i<6;i++){

        let e = new THREE.Mesh(
            new THREE.BoxGeometry(2,4,2),
            new THREE.MeshStandardMaterial({color:0xff0000})
        );

        e.position.set(Math.random()*100-50,2,-Math.random()*100);

        e.hp = 100;

        scene.add(e);
        enemies.push(e);
    }
}
function input(){

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

    document.addEventListener("mousedown",shoot);
}

function shoot(){

    if(gun.cooldown>0 || gun.ammo<=0) return;

    gun.ammo--;
    gun.cooldown = 10;

    let ray = new THREE.Raycaster();
    let dir = new THREE.Vector3();

    camera.getWorldDirection(dir);

    ray.set(camera.position,dir);

    let hit = ray.intersectObjects(enemies);

    if(hit.length>0){

        let e = hit[0].object;

        e.hp -= 50;

        if(e.hp<=0){
            scene.remove(e);
            enemies = enemies.filter(x=>x!==e);
        }
    }

    document.getElementById("ammo").innerText =
        `Ammo: ${gun.ammo}/${gun.reserve}`;
}

function move(){

    let speed = keys["shift"] ? player.sprint : player.speed;

    let dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y=0;
    dir.normalize();

    let right = new THREE.Vector3().crossVectors(dir,camera.up);

    let move = new THREE.Vector3();

    if(keys["w"]) move.add(dir.clone().multiplyScalar(speed));
    if(keys["s"]) move.add(dir.clone().multiplyScalar(-speed));
    if(keys["a"]) move.add(right.clone().multiplyScalar(-speed));
    if(keys["d"]) move.add(right.clone().multiplyScalar(speed));

    player.vel.y -= player.gravity;

    if(keys[" "] && player.canJump){
        player.vel.y = player.jump;
        player.canJump=false;
    }

    move.add(player.vel);

    player.pos.add(move);

    if(player.pos.y<2){
        player.pos.y=2;
        player.vel.y=0;
        player.canJump=true;
    }
}

function loop(){

    requestAnimationFrame(loop);

    if(gun.cooldown>0) gun.cooldown--;

    move();

    camera.position.copy(player.pos);

    camera.rotation.order="YXZ";
    camera.rotation.y=yaw;
    camera.rotation.x=pitch;

    renderer.render(scene,camera);
}
