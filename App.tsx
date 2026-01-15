import React from 'react';
import { GameScene } from './components/GameScene';
import { HUD } from './components/HUD';

const App = () => {
  return (
    <div className="w-full h-full relative">
        <GameScene />
        <HUD />
    </div>
  );
};

export default App;