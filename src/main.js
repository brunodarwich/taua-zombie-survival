import * as THREE from 'three';
import { CONFIG } from './config.js';
import { Player } from './entities/Player.js';
import { Survivor } from './entities/Survivor.js';
import { Bullet } from './entities/Bullet.js';
import { Spawner } from './systems/Spawner.js';
import { CollisionSystem } from './systems/Collision.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { DamageTextManager } from './systems/DamageTextManager.js';
import { RescueMission } from './systems/RescueMission.js';
import { CharacterSelect } from './ui/CharacterSelect.js';
import { HUD } from './ui/HUD.js';
import { MobileControls } from './ui/MobileControls.js';
import { createNavigation, createWorld, RESCUE_POINT } from './world.js';
import { sounds } from './audio.js';
import { nearestZombie } from './systems/Targeting.js';

let scene, camera, renderer, player, spawner, collisionSystem, particleSystem, damageTextManager, hud, groundPlane, mission;
const navigation = createNavigation();
const raycaster = new THREE.Raycaster(), mouse = new THREE.Vector2();
const bullets = [];
const inputState = { forward: false, backward: false, left: false, right: false, isMouseDown: false, aimDirection: null };
let lastTime = performance.now(), gameRunning = false, zoomTarget = 1, zoomCurrent = 1;
const cameraFocus = new THREE.Vector3();
const $ = id => document.getElementById(id);

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e1a);
  scene.fog = new THREE.FogExp2(0x0a0e1a, 0.009);
  camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 250);
  updateCamera(1);
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  $('canvas-container').appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xdde6ff, 1.1));
  const sun = new THREE.DirectionalLight(0xfff5e6, 1.4); sun.position.set(25, 45, 25); scene.add(sun);
  const rim = new THREE.DirectionalLight(0x00f0ff, 0.85); rim.position.set(-25, 20, -25); scene.add(rim);
  createGround();
  createWorld(scene);
  particleSystem = new ParticleSystem(scene);
  damageTextManager = new DamageTextManager(scene);
  spawner = new Spawner(scene, navigation);
  collisionSystem = new CollisionSystem(scene, particleSystem, damageTextManager, navigation);
  mission = new RescueMission(navigation, RESCUE_POINT, survivor => {
    particleSystem.spawnBurst(survivor.position, 0x00ff88, 25);
    $('rescue-message').textContent = 'Sobrevivente recebido! +350 pontos';
    $('rescue-message').classList.remove('hidden');
    clearTimeout(mission.messageTimer);
    mission.messageTimer = setTimeout(() => $('rescue-message').classList.add('hidden'), 2600);
  });
  hud = new HUD();
  new MobileControls(inputState);
  new CharacterSelect(startGame);
  setupEventListeners();
  requestAnimationFrame(animate);
}

function createGround() {
  const size = CONFIG.WORLD_SIZE;
  groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color: 0x141a29, roughness: 0.8, metalness: 0.1 }));
  groundPlane.rotation.x = -Math.PI / 2; scene.add(groundPlane);
  const grid = new THREE.GridHelper(size, 40, 0x225f70, 0x1c253b);
  grid.position.y = 0.02; scene.add(grid);
  const material = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.35 });
  for (const [x, z, w, d] of [[0, -size / 2, size, 0.5], [0, size / 2, size, 0.5], [-size / 2, 0, 0.5, size], [size / 2, 0, 0.5, size]]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 3, d), material);
    wall.position.set(x, 1.5, z); scene.add(wall);
  }
}

function startGame(skin) {
  if (player) return;
  player = new Player(scene, skin);
  sounds.init();
  gameRunning = true;
  resetInput();
  $('hud-container').classList.remove('hidden');
  document.activeElement?.blur();
  if (navigator.maxTouchPoints > 0) {
    $('mobile-controls').classList.remove('hidden');
    document.body.classList.add('touch-input');
  }
  // An immediately visible first escort introduces the new objective.
  spawner.survivors.push(new Survivor(scene, new THREE.Vector3(0, 0, -11), navigation));
}

function resetInput() {
  for (const key of ['forward', 'backward', 'left', 'right', 'isMouseDown']) inputState[key] = false;
  inputState.aimDirection = null;
  inputState.moveX = inputState.moveZ = 0;
}
function changeZoom(value) {
  zoomTarget = Math.max(0.7, Math.min(1.5, value));
  $('zoom-value').textContent = `${Math.round(100 / zoomTarget)}%`;
}
function updateCamera(delta) {
  const alpha = 1 - Math.exp(-10 * delta);
  zoomCurrent = THREE.MathUtils.lerp(zoomCurrent, zoomTarget, alpha);
  if (player) cameraFocus.lerp(player.position, alpha);
  const mobile = innerWidth <= 768;
  camera.position.set(cameraFocus.x, (mobile ? 22 : 24) * zoomCurrent, cameraFocus.z + (mobile ? 20 : 22) * zoomCurrent);
  camera.lookAt(cameraFocus);
}
function setAim(x, y) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.set((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1);
}
function setupEventListeners() {
  $('play-btn').addEventListener('click', () => {
    $('start-screen').classList.add('hidden');
    $('char-select-screen').classList.remove('hidden');
    $('back-btn').focus();
  });
  $('back-btn').addEventListener('click', () => {
    $('char-select-screen').classList.add('hidden');
    $('start-screen').classList.remove('hidden');
    $('play-btn').focus();
  });
  $('restart-btn').addEventListener('click', () => location.reload());
  $('zoom-in').addEventListener('click', () => changeZoom(zoomTarget - 0.1));
  $('zoom-out').addEventListener('click', () => changeZoom(zoomTarget + 0.1));
  $('zoom-reset').addEventListener('click', () => changeZoom(1));
  const keyMap = { KeyW: 'forward', ArrowUp: 'forward', KeyS: 'backward', ArrowDown: 'backward', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'isMouseDown' };
  window.addEventListener('keydown', e => {
    if (!gameRunning || (e.code === 'Space' && e.target.closest('button, a, input'))) return;
    if (keyMap[e.code]) { e.preventDefault(); inputState[keyMap[e.code]] = true; }
  });
  window.addEventListener('keyup', e => { if (keyMap[e.code]) inputState[keyMap[e.code]] = false; });
  window.addEventListener('blur', resetInput);
  document.addEventListener('visibilitychange', resetInput);
  renderer.domElement.addEventListener('mousemove', e => { if (gameRunning) setAim(e.clientX, e.clientY); });
  renderer.domElement.addEventListener('mousedown', e => {
    if (gameRunning && e.button === 0) { setAim(e.clientX, e.clientY); inputState.isMouseDown = true; document.activeElement?.blur(); }
  });
  window.addEventListener('mouseup', e => { if (e.button === 0) inputState.isMouseDown = false; });
  for (const event of ['touchstart', 'touchmove']) renderer.domElement.addEventListener(event, e => {
    if (!gameRunning || !e.touches.length) return;
    const touch = e.touches[0]; setAim(touch.clientX, touch.clientY);
  }, { passive: true });
  renderer.domElement.addEventListener('wheel', e => {
    if (!gameRunning) return;
    e.preventDefault(); changeZoom(zoomTarget + Math.sign(e.deltaY) * 0.1);
  }, { passive: false });
  const resize = () => {
    const width = $('canvas-container').clientWidth, height = $('canvas-container').clientHeight;
    camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.setSize(width, height); updateCamera(1);
  };
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  resize();
}

function handleShooting(time) {
  if (!inputState.isMouseDown || !player.canShoot(time)) return;
  player.lastShotTime = time;
  const props = CONFIG.TIER_PROPERTIES[player.tier];
  const target = nearestZombie(player.position, spawner.zombies);
  if (target) {
    player.aimDirection.subVectors(target.position, player.position).setY(0).normalize();
    player.sprite.scale.x = (player.aimDirection.x < 0 ? -1 : 1) * player.scale;
  }
  sounds.playShoot(player.tier);
  const muzzle = player.position.clone().setY(1.3).addScaledVector(player.aimDirection, 0.7);
  particleSystem.spawnMuzzleFlash(muzzle, player.aimDirection, props.bulletColor);
  const base = Math.atan2(player.aimDirection.z, player.aimDirection.x);
  for (let i = 0; i < props.bulletSpread; i++) {
    const angle = base + (props.bulletSpread === 2 ? (i ? 0.1 : -0.1) : props.bulletSpread === 3 ? (i - 1) * 0.14 : 0);
    bullets.push(new Bullet(scene, player.position, new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)), props));
  }
}

function animate(ms) {
  requestAnimationFrame(animate);
  const time = ms * 0.001, delta = Math.min((ms - lastTime) * 0.001, 0.1);
  lastTime = ms;
  if (gameRunning && player && !document.hidden) {
    updateCamera(delta);
    raycaster.setFromCamera(mouse, camera);
    player.update(delta, inputState, raycaster, groundPlane, camera, navigation);
    handleShooting(time);
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].update(delta, particleSystem);
      if (bullets[i].dead) bullets.splice(i, 1);
    }
    spawner.update(delta, player, time);
    for (const s of spawner.survivors) s.update(delta, player.position, RESCUE_POINT);
    mission.update(player, spawner.survivors);
    for (const z of spawner.zombies) z.update(delta, player, spawner.survivors, time);
    for (const p of spawner.pickups) p.update(delta);
    particleSystem.update(delta); damageTextManager.update(delta);
    collisionSystem.checkAll(player, bullets, spawner);
    hud.update(player, spawner.wave, spawner.survivors, RESCUE_POINT, navigation);
    if (player.hp <= 0) gameOver();
  }
  if (gameRunning && !document.hidden) renderer.render(scene, camera);
}
function gameOver() {
  gameRunning = false; resetInput();
  $('hud-container').classList.add('hidden'); $('mobile-controls').classList.add('hidden');
  $('rescue-message').classList.add('hidden');
  $('game-over-screen').classList.remove('hidden');
  $('final-score').textContent = player.score; $('final-rescued').textContent = player.rescuedCount;
  $('restart-btn').focus();
}

// Development-only inspection for repeatable local gameplay checks.
export function inspectGame() {
  if (!import.meta.env.DEV) return null;
  return { player, spawner, navigation, mission, bullets, inputState, camera, zoomTarget, zoomCurrent, gameRunning, renderer };
}
init();
