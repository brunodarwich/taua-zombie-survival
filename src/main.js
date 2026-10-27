import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Player } from './entities/Player.js';
import { Bullet } from './entities/Bullet.js';
import { Spawner } from './systems/Spawner.js';
import { CollisionSystem } from './systems/Collision.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { DamageTextManager } from './systems/DamageTextManager.js';
import { CharacterSelect } from './ui/CharacterSelect.js';
import { HUD } from './ui/HUD.js';
import { MobileControls } from './ui/MobileControls.js';
import { sounds } from './audio.js';

let scene, camera, renderer;
let player = null;
let spawner = null;
let collisionSystem = null;
let particleSystem = null;
let damageTextManager = null;
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
  isMouseDown: false,
  aimDirection: null
};

let lastTime = performance.now();
let gameRunning = false;

function init() {
  // 1. Cena Three.js com atmosfera Paper Mario
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.016);

  // 2. Câmera Isométrica mais próxima para personagens maiores
  const isMobile = window.innerWidth <= 768;
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 200);
  const camHeight = isMobile ? 22 : 24;
  const camDist = isMobile ? 20 : 22;
  camera.position.set(0, camHeight, camDist);
  camera.lookAt(0, 0, 0);

  // 3. Renderizador WebGL
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // 4. Iluminação Estilo Paper Mario (Luz quente suave + Key light + Rim light)
  const ambientLight = new THREE.AmbientLight(0xdde6ff, 1.1);
  scene.add(ambientLight);

  // Luz do Sol / Palco
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
  sunLight.position.set(25, 45, 25);
  scene.add(sunLight);

  // Rim Light (Destaque de contorno traseiro estilo Paper Mario)
  const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.85);
  rimLight.position.set(-25, 20, -25);
  scene.add(rimLight);

  // 5. Chão / Arena Paper Mario com Textura Quadriculada e Borda de Papel
  createGround();

  // 6. Sistemas
  particleSystem = new ParticleSystem(scene);
  damageTextManager = new DamageTextManager(scene);
  spawner = new Spawner(scene);
  collisionSystem = new CollisionSystem(scene, particleSystem, damageTextManager);
  hud = new HUD();
  new MobileControls(inputState);

  // 7. Eventos
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
  const groundGeo = new THREE.PlaneGeometry(size, size);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x141a29,
    roughness: 0.8,
    metalness: 0.1
  });
  groundPlane = new THREE.Mesh(groundGeo, groundMat);
  groundPlane.rotation.x = -Math.PI / 2;
  scene.add(groundPlane);

  // Grade Paper Mario
  const gridHelper = new THREE.GridHelper(size, 40, 0x00e1ff, 0x1c253b);
  gridHelper.position.y = 0.02;
  scene.add(gridHelper);

  // Paredes de papel destacadas (Bordas cartoon)
  const wallMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35 });
  const halfSize = size / 2;
  const wallThickness = 0.5;
  const wallHeight = 3.0;

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

  // Se for celular/touch, ativa o container de controles touch
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) {
    document.getElementById('mobile-controls').classList.remove('hidden');
  }
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

  // Touch para mirar ao tocar na tela (se não for no joystick)
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      if (t.clientX > window.innerWidth * 0.45) { // Lado direito da tela = mira/tiro
        mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
      }
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      if (t.clientX > window.innerWidth * 0.45) {
        mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
      }
    }
  }, { passive: true });

  document.getElementById('restart-btn').addEventListener('click', () => {
    location.reload();
  });
}

function onWindowResize() {
  const isMobile = window.innerWidth <= 768;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleShooting(currentTime) {
  if (!player || !inputState.isMouseDown || !player.canShoot(currentTime)) return;

  player.lastShotTime = currentTime;
  const props = CONFIG.TIER_PROPERTIES[player.tier];
  sounds.playShoot(player.tier);

  const spreadCount = props.bulletSpread;
  const baseAngle = Math.atan2(player.aimDirection.z, player.aimDirection.x);

  for (let i = 0; i < spreadCount; i++) {
    let offsetAngle = 0;
    if (spreadCount === 2) {
      offsetAngle = (i === 0 ? -0.1 : 0.1);
    } else if (spreadCount === 3) {
      offsetAngle = (i - 1) * 0.14;
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
    raycaster.setFromCamera(mouse, camera);

    player.update(delta, inputState, raycaster, groundPlane, camera);

    // Câmera dinâmica mais próxima acompanhando com suavização
    const isMobile = window.innerWidth <= 768;
    const targetZ = player.position.z + (isMobile ? 20 : 22);
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x, 0.1);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);

    handleShooting(currentTime);

    // Balas com trilha FX
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.update(delta, particleSystem);
      if (b.dead) bullets.splice(i, 1);
    }

    // Spawner
    spawner.update(delta, player, currentTime);

    // Zumbis
    for (let i = spawner.zombies.length - 1; i >= 0; i--) {
      const z = spawner.zombies[i];
      z.update(delta, player, spawner.survivors, currentTime);
    }

    // Sobreviventes
    for (let i = spawner.survivors.length - 1; i >= 0; i--) {
      const s = spawner.survivors[i];
      s.update(delta, player.position);
    }

    // Pickups
    for (let i = spawner.pickups.length - 1; i >= 0; i--) {
      const p = spawner.pickups[i];
      p.update(delta);
    }

    // Partículas e Números de Dano
    particleSystem.update(delta);
    damageTextManager.update(delta);

    // Colisões
    collisionSystem.checkAll(player, bullets, spawner);

    // HUD
    hud.update(player, spawner.wave);

    if (player.hp <= 0) {
      gameOver();
    }
  }

  renderer.render(scene, camera);
}

function gameOver() {
  gameRunning = false;
  document.getElementById('hud-container').classList.add('hidden');
  document.getElementById('mobile-controls').classList.add('hidden');
  document.getElementById('game-over-screen').classList.remove('hidden');
  document.getElementById('final-score').textContent = player.score;
  document.getElementById('final-rescued').textContent = player.rescuedCount;
}

init();
