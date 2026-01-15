import React, { useRef, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, getWeaponConfig } from '../store';
import { audioService } from '../services/AudioService';

const WEAPON_OFFSET = new THREE.Vector3(0.5, -0.5, -0.6);
const LEVEL_WOMEN = 0;
const LEVEL_AZARA = 2.5;
const LEVEL_HEICHAL = 5.0;

// --- Visuals ---
const PistolModel = () => (<group><mesh position={[0, 0.1, 0]}><boxGeometry args={[0.15, 0.2, 0.6]} /><meshStandardMaterial color="#444" /></mesh></group>);
const RifleModel = () => (<group><mesh position={[0, 0.1, -0.2]}><boxGeometry args={[0.15, 0.2, 1.2]} /><meshStandardMaterial color="#333" /></mesh></group>);
const ShotgunModel = () => (<group><mesh position={[0, 0, 0.3]}><boxGeometry args={[0.15, 0.2, 0.6]} /><meshStandardMaterial color="#5D4037" /></mesh></group>);
const SniperModel = () => (<group><mesh position={[0, 0.1, -0.4]}><boxGeometry args={[0.12, 0.15, 1.4]} /><meshStandardMaterial color="#2E3B28" /></mesh></group>);
const LaserModel = () => (<group><mesh position={[0, 0.1, -0.2]}><boxGeometry args={[0.2, 0.3, 0.8]} /><meshStandardMaterial color="#eee" /></mesh></group>);

// --- Collision Logic ---

// Defined Wall Boundaries (AABB)
// Z- is West (Heichal), Z+ is East (Entrance)
const WALLS = [
    // Women's Court (Center Z=85, Size 70 -> Z: 50 to 120, X: -35 to 35)
    { xMin: -37, xMax: 37, zMin: 118, zMax: 122 }, // East Wall (Entrance)
    { xMin: -37, xMax: 37, zMin: 48, zMax: 52 },   // West Wall (Between Women & Azara)
    { xMin: 33, xMax: 37, zMin: 50, zMax: 120 },   // South Wall
    { xMin: -37, xMax: -33, zMin: 50, zMax: 120 }, // North Wall

    // Azara (Center Z=0, Depth 93 -> Z: -46.5 to 46.5, Width 70 -> X: -35 to 35)
    { xMin: 33, xMax: 37, zMin: -48, zMax: 48 },   // South Wall
    { xMin: -37, xMax: -33, zMin: -48, zMax: 48 }, // North Wall
    { xMin: -37, xMax: 37, zMin: -48, zMax: -45 }, // West Wall (Behind Heichal)
    // Note: East Wall of Azara is handled by Women's Court West Wall logic or separate block? 
    // Actually Azara East wall is at Z=46.5. Women's West is at Z=50.
    // Let's add Azara East Wall specifically.
    { xMin: -37, xMax: 37, zMin: 45, zMax: 48 },

    // Heichal Structure (Center Z=-25)
    { xMin: -16, xMax: -9, zMin: -35, zMax: -5 }, // Left Wall
    { xMin: 9, xMax: 16, zMin: -35, zMax: -5 },   // Right Wall
    { xMin: -16, xMax: 16, zMin: -38, zMax: -34 }, // Back Wall
    
    // Altar Base (Solid) - Center at Z=20. Size 16x16.
    { xMin: -9, xMax: 9, zMin: 11, zMax: 29 } 
];

// Check if a point is inside a gate (gap in wall) to ALLOW passage
const isInsideGate = (pos: THREE.Vector3) => {
    // 1. Nicanor Gate (Between Azara and Women's Court)
    // Located at Z ~ 45 to 52. X centered.
    if (Math.abs(pos.x) < 8 && pos.z > 42 && pos.z < 55) return true;

    // 2. Women's Court East Entrance
    // Located at Z ~ 120. X centered.
    if (Math.abs(pos.x) < 10 && pos.z > 115 && pos.z < 125) return true;

    // 3. Azara North/South Gates
    // Gates at Global Z: -22, 0, 28.
    // Walls at X = +/- 35.
    // Allow passage if Z is near these values.
    const gateZLocations = [-22, 0, 28];
    const zTolerance = 6; // Wide enough for player to walk through
    
    // Check if Z is aligned with any gate
    const alignedWithGateZ = gateZLocations.some(gz => Math.abs(pos.z - gz) < zTolerance);
    
    if (alignedWithGateZ) {
        // If aligned with Z, allow passing through X walls
        if (Math.abs(pos.x) > 30 && Math.abs(pos.x) < 40) return true;
    }

    return false;
}

const checkWallCollision = (newPos: THREE.Vector3) => {
    // If inside a gate zone, disable collision
    if (isInsideGate(newPos)) return false;

    for (const wall of WALLS) {
        // Simple AABB check
        if (newPos.x > wall.xMin && newPos.x < wall.xMax &&
            newPos.z > wall.zMin && newPos.z < wall.zMax) {
            return true;
        }
    }
    return false;
};

const getFloorHeight = (x: number, z: number) => {
    // --- 1. Altar Ramp (Kevesh) ---
    // Ramp visual center Z ~ 33. Length ~17.
    // Goes from Z=28 (Top, H=8.5) to Z=44 (Bottom, H=2.5)
    if (x > -3 && x < 3 && z >= 28 && z <= 46) {
        const pct = (z - 28) / 18; 
        return Math.max(LEVEL_AZARA, 8.5 - (6.0 * pct));
    }
    // Top of Altar
    if (x > -9 && x < 9 && z > 11 && z < 29) {
        return 8.5; 
    }

    // --- 2. Heichal Level (Top) ---
    if (z < -5) return LEVEL_HEICHAL; 

    // --- 3. Steps Azara -> Heichal ---
    // Z range: -5 to 2.
    if (z >= -5 && z < 2 && Math.abs(x) < 10) {
        const p = (2 - z) / 7; 
        return LEVEL_AZARA + (p * (LEVEL_HEICHAL - LEVEL_AZARA));
    }

    // --- 4. Azara Level ---
    if (z < 48) return LEVEL_AZARA;

    // --- 5. Steps Women -> Azara ---
    // Nicanor steps. Z range 48 to 58.
    // Circular check for semi-circle steps
    const distFromGate = Math.sqrt(x*x + (z-50)*(z-50));
    if (z >= 48 && z < 60 && distFromGate < 15) {
         // Approx slope
         const p = (60 - z) / 12;
         return Math.max(LEVEL_WOMEN, LEVEL_WOMEN + (p * (LEVEL_AZARA - LEVEL_WOMEN)));
    }

    // --- 6. Women's Court Level ---
    if (z >= 48 && z < 130) return LEVEL_WOMEN;

    // Outside (Temple Mount)
    return -5;
};

export const Player = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const weaponRef = useRef<THREE.Group>(null);
  const flashRef = useRef<THREE.Mesh>(null);
  
  const { shootWeapon, currentWeapon, isReloading, switchWeapon, togglePause, gameState } = useStore();
  const weaponConfig = getWeaponConfig(currentWeapon);

  const moveState = useRef({ fwd: false, bwd: false, left: false, right: false, jump: false });
  const velocity = useRef(new THREE.Vector3());
  const canJump = useRef(true);
  const lastShot = useRef(0);
  const isMouseDown = useRef(false);

  useEffect(() => {
    if (gameState === 'PLAYING') controlsRef.current?.lock();
    else controlsRef.current?.unlock();
  }, [gameState]);

  const fire = () => {
      if (gameState !== 'PLAYING') return;
      const now = performance.now();
      const currentState = useStore.getState();
      const currentConfig = getWeaponConfig(currentState.currentWeapon);
      if (now - lastShot.current < currentConfig.fireRate) return;
      if (currentState.isReloading) return;
      const didShoot = currentState.shootWeapon();
      if (didShoot) {
          lastShot.current = now;
          audioService.playShot(currentState.currentWeapon);
          if (weaponRef.current) { 
              weaponRef.current.position.z += 0.2; 
              weaponRef.current.rotation.x += 0.1; 
          }
          if (flashRef.current) { 
              flashRef.current.visible = true; 
              setTimeout(() => { if(flashRef.current) flashRef.current.visible = false; }, 50); 
          }
          
          const raycaster = new THREE.Raycaster();
          const direction = new THREE.Vector3();
          
          for(let i=0; i<currentConfig.pellets; i++) {
              camera.getWorldDirection(direction);
              direction.x += (Math.random() - 0.5) * currentConfig.spread;
              direction.y += (Math.random() - 0.5) * currentConfig.spread;
              direction.z += (Math.random() - 0.5) * currentConfig.spread;
              direction.normalize();
              raycaster.set(camera.position, direction);
              
              const enemies = useStore.getState().enemies;
              let hitEnemyId: string | null = null;
              let minDist = Infinity;
              
              enemies.forEach(e => {
                  const enemyY = getFloorHeight(e.x, e.z) + 1.5;
                  const enemyPos = new THREE.Vector3(e.x, enemyY, e.z);
                  const vToEnemy = new THREE.Vector3().subVectors(enemyPos, camera.position);
                  const t = vToEnemy.dot(direction);
                  if (t > 0) {
                      const closestPoint = camera.position.clone().add(direction.clone().multiplyScalar(t));
                      const dist = closestPoint.distanceTo(enemyPos);
                      if (dist < 1.0 && t < minDist) { minDist = t; hitEnemyId = e.id; }
                  }
              });
              
              if (hitEnemyId) {
                  useStore.getState().damageEnemy(hitEnemyId!, currentConfig.damage);
                  useStore.getState().addParticle(camera.position.x + direction.x * minDist, camera.position.y + direction.y * minDist, camera.position.z + direction.z * minDist, '#ff0000');
                  audioService.playHit();
              }
          }
      } else {
         if (!currentState.isReloading && now - lastShot.current > 500) { audioService.playEmpty(); lastShot.current = now; }
      }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') { togglePause(); return; }
      if (useStore.getState().gameState !== 'PLAYING') return;
      switch (e.code) {
        case 'KeyW': moveState.current.fwd = true; break;
        case 'KeyS': moveState.current.bwd = true; break;
        case 'KeyA': moveState.current.left = true; break;
        case 'KeyD': moveState.current.right = true; break;
        case 'Space': if(canJump.current) { velocity.current.y = 8; canJump.current = false; } break;
        case 'Digit1': switchWeapon('pistol'); break;
        case 'Digit2': switchWeapon('rifle'); break;
        case 'Digit3': switchWeapon('shotgun'); break;
        case 'Digit4': switchWeapon('sniper'); break;
        case 'Digit5': switchWeapon('laser'); break;
        case 'KeyR': useStore.getState().reloadWeapon(); audioService.playReload(); break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': moveState.current.fwd = false; break;
        case 'KeyS': moveState.current.bwd = false; break;
        case 'KeyA': moveState.current.left = false; break;
        case 'KeyD': moveState.current.right = false; break;
      }
    };
    const onMouseDown = () => { if (useStore.getState().gameState !== 'PLAYING') return; isMouseDown.current = true; if (!getWeaponConfig(useStore.getState().currentWeapon).auto) fire(); };
    const onMouseUp = () => { isMouseDown.current = false; };
    document.addEventListener('keydown', onKeyDown); document.addEventListener('keyup', onKeyUp); document.addEventListener('mousedown', onMouseDown); document.addEventListener('mouseup', onMouseUp);
    return () => { document.removeEventListener('keydown', onKeyDown); document.removeEventListener('keyup', onKeyUp); document.removeEventListener('mousedown', onMouseDown); document.removeEventListener('mouseup', onMouseUp); };
  }, [switchWeapon, togglePause]);

  useFrame((state, delta) => {
    if (gameState !== 'PLAYING') return;
    
    // Physics Constants
    const SPEED = 250.0; // Slightly reduced for better control
    const FRICTION = 8.0;
    const GRAVITY = 25.0;

    // Apply Friction
    velocity.current.x -= velocity.current.x * FRICTION * delta;
    velocity.current.z -= velocity.current.z * FRICTION * delta;
    velocity.current.y -= GRAVITY * delta; 

    // Input Direction
    const direction = new THREE.Vector3();
    direction.z = Number(moveState.current.fwd) - Number(moveState.current.bwd);
    direction.x = Number(moveState.current.right) - Number(moveState.current.left);
    direction.normalize();

    // Apply Acceleration
    if (moveState.current.fwd || moveState.current.bwd) velocity.current.z -= direction.z * SPEED * delta;
    if (moveState.current.left || moveState.current.right) velocity.current.x -= direction.x * SPEED * delta;

    if (controlsRef.current) {
        const oldPos = camera.position.clone();
        
        // Move X
        controlsRef.current.moveRight(-velocity.current.x * delta);
        if (checkWallCollision(camera.position)) camera.position.x = oldPos.x; // Slide X

        // Move Z
        controlsRef.current.moveForward(-velocity.current.z * delta);
        if (checkWallCollision(camera.position)) camera.position.z = oldPos.z; // Slide Z

        // Move Y
        camera.position.y += velocity.current.y * delta;
        
        // Floor Logic with Smoothing
        const floorH = getFloorHeight(camera.position.x, camera.position.z);
        const eyeHeight = 1.8;
        const targetY = floorH + eyeHeight;
        
        if (camera.position.y < targetY) {
            // Grounded
            velocity.current.y = 0;
            // Lerp for smooth stair climbing
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.25);
            
            // Snap if very close to avoid jitter
            if (Math.abs(camera.position.y - targetY) < 0.05) camera.position.y = targetY;
            
            canJump.current = true;
        }
        
        // World Bounds
        const MAX_BOUND = 200;
        if (camera.position.x > MAX_BOUND) camera.position.x = MAX_BOUND;
        if (camera.position.x < -MAX_BOUND) camera.position.x = -MAX_BOUND;
        if (camera.position.z > MAX_BOUND) camera.position.z = MAX_BOUND;
        if (camera.position.z < -MAX_BOUND) camera.position.z = -MAX_BOUND;
    }

    // Weapon Animation (Slight Bob)
    if (weaponRef.current) {
        weaponRef.current.position.lerp(WEAPON_OFFSET, 0.1);
        // Simple walk bob
        if (velocity.current.lengthSq() > 1 && canJump.current) {
            weaponRef.current.position.y += Math.sin(state.clock.elapsedTime * 10) * 0.005;
        }
        weaponRef.current.rotation.x = THREE.MathUtils.lerp(weaponRef.current.rotation.x, 0, 0.1);
    }
    if (isMouseDown.current && weaponConfig.auto) fire();
  });

  const CurrentWeaponModel = useMemo(() => {
      switch(currentWeapon) {
          case 'pistol': return <PistolModel />;
          case 'rifle': return <RifleModel />;
          case 'shotgun': return <ShotgunModel />;
          case 'sniper': return <SniperModel />;
          case 'laser': return <LaserModel />;
          default: return <PistolModel />;
      }
  }, [currentWeapon]);

  return (
    <>
        <PerspectiveCamera makeDefault position={[0, 5, 120]} fov={75} />
        <PointerLockControls ref={controlsRef} />
        {gameState === 'PLAYING' && (
             <primitive object={camera}>
                 <group ref={weaponRef} position={WEAPON_OFFSET}>
                     {CurrentWeaponModel}
                     <mesh ref={flashRef} position={[0, 0.1, -1.5]} visible={false}>
                         <sphereGeometry args={[0.3]} />
                         <meshBasicMaterial color={weaponConfig.color} transparent opacity={0.8} />
                     </mesh>
                 </group>
             </primitive>
        )}
    </>
  );
};