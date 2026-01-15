import React, { useRef } from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import * as THREE from 'three';

const Particle: React.FC<{ data: any }> = ({ data }) => {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, delta) => {
        if (ref.current) {
            ref.current.position.y += delta;
            ref.current.scale.multiplyScalar(0.9);
            ref.current.rotation.x += delta;
        }
    });
    return (
        <mesh ref={ref} position={[data.x, data.y, data.z]}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial color={data.color} transparent />
        </mesh>
    );
}

export const FX = () => {
    const particles = useStore(state => state.particles);
    const cleanup = useStore(state => state.cleanupParticles);

    useFrame(() => {
        if (particles.length > 0) cleanup();
    });

    return (
        <>
            <EffectComposer disableNormalPass>
                <Bloom luminanceThreshold={0.5} luminanceSmoothing={0.9} height={300} intensity={0.5} />
                <Vignette eskil={false} offset={0.1} darkness={0.5} />
            </EffectComposer>
            {particles.map(p => <Particle key={p.id} data={p} />)}
        </>
    );
};