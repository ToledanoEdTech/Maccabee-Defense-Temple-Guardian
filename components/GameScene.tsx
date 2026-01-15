import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Level } from './Environment';
import { Player } from './Player';
import { EnemyManager } from './Enemies';
import { FX } from './Effects';
import { useStore } from '../store';

export const GameScene = () => {
    const gameState = useStore(state => state.gameState);
    
    return (
        <Canvas shadows className="w-full h-full bg-black">
            <Suspense fallback={null}>
                <Level />
                <Player />
                {gameState === 'PLAYING' && <EnemyManager />}
                <FX />
            </Suspense>
        </Canvas>
    );
};