import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Player } from './entities/Player.js';
import { Bullet } from './entities/Bullet.js';
import { Spawner } from './systems/Spawner.js';
import { CollisionSystem } from './systems/Collision.js';
import { CharacterSelect } from './ui/CharacterSelect.js';
import { HUD } from './ui/HUD.js';
import { sounds } from './audio.js';

let scene, camera, renderer;
let player = null;
let spawner = null;
let collisionSystem = null;
let hud = null;
let groundPlane = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

const bullets = [];
const inputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  isMouseDown: false
};

let lastTime = performance.now();
let gameRunning = false;

function init() {
  // 1. Cena Three.js
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1118);
  scene.fog = new THREE.FogExp2(0x0e1118, 0.022);

  // 2. Câmera Isométrica
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
  camera.position.set(0, 32, 28);
  camera.lookAt(0, 0, 0);

  // 3. Renderizador WebGL
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // 4. Iluminação
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  dirLight.position.set(20, 40, 20);
  scene.add(dirLight);

  const redAtmosphere = new THREE.PointLight(0xff3344, 0.5, 40);
  redAtmosphere.position.set(0, 5, 0);
  scene.add(redAtmosphere);

  // 5. Chão / Arena de Batalha Estilizada
  createGround();

  // 6. Sistemas
  spawner = new Spawner(scene);
  collisionSystem = new CollisionSystem(scene);
  hud = new HUD();

  // 7. Eventos de Janela e Controles
  setupEventListeners();

  // 8. Tela de Seleção de Personagem Inicial
  new CharacterSelect((selectedSkinUrl) => {
    startGame(selectedSkinUrl);
  });

  // Loop de Renderização
  requestAnimationFrame(animate);
}

function createGround() {
  const size = CONFIG.WORLD_SIZE;
  // Malha de colisão invisível para o Raycaster
  const groundGeo = new THREE.PlaneGeometry(size, size);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x161b26,
    roughness: 0.85,
    metalness: 0.15
  });
  groundPlane = new THREE.Mesh(groundGeo, groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  scene.add(groundPlane);

  // Grade tática
  const gridHelper = new THREE.GridHelper(size, 45, 0x00f0ff, 0x1f293d);
  gridHelper.position.y = 0.02;
  scene.add(gridHelper);

  // Paredes limítrofes iluminadas
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.25 });
  const halfSize = size / 2;
  const wallThickness = 0.4;
  const wallHeight = 2.5;

  const walls = [
    { pos: [0, wallHeight / 2, -halfSize], size: [size, wallHeight, wallThickness] },
    { pos: [0, wallHeight / 2, halfSize], size: [size, wallHeight, wallThickness] },
    { pos: [-halfSize, wallHeight / 2, 0], size: [wallThickness, wallHeight, size] },
    { pos: [halfSize, wallHeight / 2, 0], size: [wallThickness, wallHeight, size] }
  ];

  walls.forEach(w => {
    const geo = new THREE.BoxGeometry(...w.size);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(...w.pos);
    scene.add(mesh);
  });
}

function startGame(skinUrl) {
  player = new Player(scene, skinUrl);
  gameRunning = true;
  document.getElementById('hud-container').classList.remove('hidden');
}

function setupEventListeners() {
  window.addEventListener('resize', onWindowResize);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') inputState.forward = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') inputState.backward = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') inputState.left = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') inputState.right = true;
    if (e.code === 'Space') inputState.isMouseDown = true;
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') inputState.forward = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') inputState.backward = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') inputState.left = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') inputState.right = false;
    if (e.code === 'Space') inputState.isMouseDown = false;
  });

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('mousedown', (e) => {
    if (e.button === 0) inputState.isMouseDown = true;
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) inputState.isMouseDown = false;
  });

  document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload();
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleShooting(currentTime) {
  if (!player || !inputState.isMouseDown || !player.canShoot(currentTime)) return;

  player.lastShotTime = currentTime;
  const props = CONFIG.TIER_PROPERTIES[player.tier];
  sounds.playShoot(player.tier);

  // Mecânica de múltiplos disparos / leque para Tiers mais altos
  const spreadCount = props.bulletSpread;
  const baseAngle = Math.atan2(player.aimDirection.z, player.aimDirection.x);

  for (let i = 0; i < spreadCount; i++) {
    let offsetAngle = 0;
    if (spreadCount === 2) {
      offsetAngle = (i === 0 ? -0.08 : 0.08);
    } else if (spreadCount === 3) {
      offsetAngle = (i - 1) * 0.12;
    }

    const angle = baseAngle + offsetAngle;
    const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const bullet = new Bullet(scene, player.position, dir, props);
    bullets.push(bullet);
  }
}

function animate(currentTimeMs) {
  requestAnimationFrame(animate);

  const currentTime = currentTimeMs * 0.001;
  const delta = Math.min((currentTimeMs - lastTime) * 0.001, 0.1);
  lastTime = currentTimeMs;

  if (gameRunning && player) {
    // 1. Atualizar Raycaster do Mouse
    raycaster.setFromCamera(mouse, camera);

    // 2. Atualizar Jogador
    player.update(delta, inputState, raycaster, groundPlane, camera);

    // 3. Suavizar Câmera acompanhando o Jogador
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, player.position.z + 28, 0.08);

    // 4. Disparos
    handleShooting(currentTime);

    // 5. Atualizar Balas
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.update(delta);
      if (b.dead) bullets.splice(i, 1);
    }

    // 6. Spawner & Zumbis & Sobreviventes & Equipamentos
    spawner.update(delta, player, currentTime);

    // Atualizar zumbis
    for (let i = spawner.zombies.length - 1; i >= 0; i--) {
      const z = spawner.zombies[i];
      z.update(delta, player, spawner.survivors, currentTime);
    }

    // Atualizar sobreviventes
    for (let i = spawner.survivors.length - 1; i >= 0; i--) {
      const s = spawner.survivors[i];
      s.update(delta, player.position);
    }

    // Atualizar pickups
    for (let i = spawner.pickups.length - 1; i >= 0; i--) {
      const p = spawner.pickups[i];
      p.update(delta);
    }

    // 7. Colisões
    collisionSystem.checkAll(player, bullets, spawner);

    // 8. Atualizar HUD
    hud.update(player, spawner.wave);

    // 9. Checar Game Over
    if (player.hp <= 0) {
      gameOver();
    }
  }

  renderer.render(scene, camera);
}

function gameOver() {
  gameRunning = false;
  document.getElementById('hud-container').classList.add('hidden');
  document.getElementById('game-over-screen').classList.remove('hidden');
  document.getElementById('final-score').textContent = player.score;
  document.getElementById('final-rescued').textContent = player.rescuedCount;
}

init();
