import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import * as THREE from 'three';

// Duplicating the floor logic here to keep enemies grounded correctly
const getFloorHeight = (x: number, z: number) => {
    if (z < -25) return 6.5; 
    if (z >= -25 && z < 55) return 3.5;
    if (z >= 55 && z < 130) return 0;
    return -2;
};

const Enemy: React.FC<{ data: any }> = ({ data }) => {
    const mesh = useRef<THREE.Group>(null);
    const time = useRef(Math.random() * 100);
    const lastAttack = useRef(0);

    useFrame((state, delta) => {
        if (useStore.getState().gameState !== 'PLAYING') return;
        if (!mesh.current) return;
        
        const playerPos = state.camera.position;
        const myPos = mesh.current.position;

        // Separation
        const enemies = useStore.getState().enemies;
        const separation = new THREE.Vector3();
        let count = 0;
        enemies.forEach(e => {
            if (e.id !== data.id) {
                const otherPos = new THREE.Vector3(e.x, 0, e.z); // Ignore Y for separation
                const dist = new THREE.Vector2(myPos.x, myPos.z).distanceTo(new THREE.Vector2(e.x, e.z));
                if (dist < 2.5) {
                    const push = new THREE.Vector3().subVectors(myPos, new THREE.Vector3(e.x, myPos.y, e.z)).normalize().multiplyScalar(2.5 - dist);
                    separation.add(push);
                    count++;
                }
            }
        });

        const distToPlayer = myPos.distanceTo(playerPos);
        
        if (distToPlayer > 2.5) {
            mesh.current.lookAt(playerPos.x, myPos.y, playerPos.z);
            const dir = new THREE.Vector3().subVectors(playerPos, myPos);
            dir.y = 0; // Move flat
            dir.normalize();
            
            if (count > 0) separation.divideScalar(count);
            separation.y = 0;
            dir.add(separation.multiplyScalar(3.0)).normalize();

            const moveDist = data.speed * delta;
            mesh.current.position.add(dir.multiplyScalar(moveDist));

            // Sync Store
            const idx = useStore.getState().enemies.findIndex(e => e.id === data.id);
            if(idx !== -1) {
                useStore.getState().enemies[idx].x = mesh.current.position.x;
                useStore.getState().enemies[idx].z = mesh.current.position.z;
            }

            // Animation
            time.current += delta * data.speed * 2;
        } else {
            // Attack
            const now = state.clock.getElapsedTime();
            if (now - lastAttack.current > 1.2) {
                useStore.getState().damagePlayer(data.type === 'captain' ? 25 : 10);
                lastAttack.current = now;
                mesh.current.position.add(mesh.current.getWorldDirection(new THREE.Vector3()).multiplyScalar(0.5));
                setTimeout(() => {
                   if(mesh.current) mesh.current.position.add(mesh.current.getWorldDirection(new THREE.Vector3()).multiplyScalar(-0.5));
                }, 200);
            }
        }

        // Apply Gravity / Floor Snap
        const floorY = getFloorHeight(mesh.current.position.x, mesh.current.position.z);
        // Smooth snap or instant? Instant is safer for now.
        mesh.current.position.y = floorY;
    });

    const isCaptain = data.type === 'captain';
    const mainColor = isCaptain ? "#800000" : "#A0522D";

    return (
        <group ref={mesh} position={[data.x, 0, data.z]}>
            {/* Tunic / Body */}
            <mesh position={[0, 1.4, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.5, 1.4, 8]} />
                <meshStandardMaterial color={mainColor} roughness={0.9} />
            </mesh>
            {/* Head */}
            <mesh position={[0, 2.3, 0]} castShadow>
                <sphereGeometry args={[0.3]} />
                <meshStandardMaterial color="#d2b48c" />
            </mesh>
            {/* Helmet */}
            <group position={[0, 2.3, 0]}>
                <mesh>
                    <cylinderGeometry args={[0.32, 0.32, 0.35]} />
                    <meshStandardMaterial color="#B8860B" metalness={0.6} roughness={0.4} />
                </mesh>
                <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0]}>
                     <boxGeometry args={[0.1, 0.3, 0.7]} />
                     <meshStandardMaterial color={isCaptain ? "red" : "#222"} />
                </mesh>
            </group>
            {/* Shield */}
            <group name="shield" position={[-0.4, 1.4, 0.4]} rotation={[0, -0.5, 0]}>
                <mesh rotation={[0, 0, 0]}>
                    <cylinderGeometry args={[0.6, 0.6, 0.1, 16]} rotation={[Math.PI/2, 0, 0]} />
                    <meshStandardMaterial color="#CD853F" />
                </mesh>
                <mesh position={[0, 0, 0.06]} rotation={[Math.PI/2, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.05]} />
                    <meshStandardMaterial color="#B8860B" />
                </mesh>
            </group>
            {/* Spear */}
            <group position={[0.5, 1.4, 0.2]} rotation={[-Math.PI/4, 0, 0]}>
                 <mesh>
                     <cylinderGeometry args={[0.03, 0.03, 3.5]} />
                     <meshStandardMaterial color="#555" />
                 </mesh>
            </group>
            {/* HP Bar */}
            <group position={[0, 3.2, 0]}>
                <mesh><planeGeometry args={[1, 0.1]} /><meshBasicMaterial color="red" /></mesh>
                <mesh position={[-(1 - (data.hp/data.maxHp))/2, 0, 0.01]} scale={[data.hp/data.maxHp, 1, 1]}>
                    <planeGeometry args={[1, 0.1]} /><meshBasicMaterial color="#00ff00" />
                </mesh>
            </group>
        </group>
    );
};

export const EnemyManager = () => {
    const enemies = useStore(state => state.enemies);
    const spawnEnemy = useStore(state => state.spawnEnemy);
    const gameState = useStore(state => state.gameState);
    const lastSpawn = useRef(0);

    useFrame((state) => {
        if (gameState !== 'PLAYING') return;
        const now = state.clock.getElapsedTime();
        if (now - lastSpawn.current > 2.5) {
             if (Math.random() < 0.7) spawnEnemy();
             lastSpawn.current = now;
        }
    });

    return (
        <>{enemies.map(e => <Enemy key={e.id} data={e} />)}</>
    )
}