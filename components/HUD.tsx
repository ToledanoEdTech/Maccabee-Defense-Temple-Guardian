import React from 'react';
import { useStore, WEAPONS } from '../store';
import { audioService } from '../services/AudioService';

export const HUD = () => {
  const { gameState, hp, score, wave, enemies, currentWeapon, weaponState, isReloading, hitMarkerOpacity, startGame, resetGame, togglePause } = useStore();
  const weapon = WEAPONS[currentWeapon];
  const currentAmmo = weaponState[currentWeapon].currentAmmo;

  if (gameState === 'MENU') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-90 text-white z-50">
         <div className="text-6xl text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">🕎 מגן המקדש</div>
         <div className="text-2xl text-red-500 mb-8 font-bold">טיהור ההיכל</div>
         <div className="bg-gray-800 p-6 rounded-lg max-w-lg text-center mb-8 border border-yellow-600">
             <p className="mb-4">הגן על המנורה מפני הפולשים היוונים.</p>
             <p className="text-sm text-gray-400">תזוזה: WASD | ירי: עכבר | נשקים: 1-5 | טעינה: R | עצירה: ESC</p>
         </div>
         <button 
           onClick={() => { startGame(); audioService.init(); }}
           className="px-10 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-2xl rounded shadow-[0_0_20px_#b8860b]"
         >
           התחל בקרב
         </button>
      </div>
    );
  }

  if (gameState === 'PAUSED') {
      return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 text-white z-50 backdrop-blur-sm">
             <h2 className="text-5xl text-yellow-400 mb-8 font-bold">משחק מושהה</h2>
             <div className="flex flex-col gap-4">
                 <button onClick={togglePause} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded w-64">
                    המשך
                 </button>
                 <button onClick={resetGame} className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xl rounded w-64">
                    חזרה להתחלה
                 </button>
             </div>
          </div>
      )
  }

  if (gameState === 'GAMEOVER') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900 bg-opacity-90 text-white z-50">
         <h1 className="text-8xl mb-4 font-bold">המשחק נגמר</h1>
         <p className="text-3xl mb-8">ניקוד סופי: {score}</p>
         <button onClick={resetGame} className="px-8 py-3 bg-white text-red-900 font-bold text-xl rounded">נסה שוב</button>
      </div>
    );
  }

  const hpPercent = (hp / 100) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none select-none">
       {/* Damage Vignette */}
       <div 
         className="absolute inset-0 transition-opacity duration-200"
         style={{ boxShadow: `inset 0 0 100px ${100-hp}px rgba(255,0,0,${(100-hp)/200})` }}
       ></div>

       {/* Crosshair */}
       <div className="crosshair-center">
           <div className={`w-1 h-1 bg-red-500 rounded-full transition-all duration-100 ${isReloading ? 'opacity-50' : 'opacity-100'}`} />
           <div 
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white rounded-full transition-all duration-100 opacity-50"
             style={{ width: `${weapon.spread * 500 + 20}px`, height: `${weapon.spread * 500 + 20}px` }}
           />
           {/* Hit Marker */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none" style={{ opacity: hitMarkerOpacity }}>
                <div className="absolute w-full h-1 bg-white rotate-45 top-1/2 left-0 -translate-y-1/2 shadow-sm shadow-black" />
                <div className="absolute w-full h-1 bg-white -rotate-45 top-1/2 left-0 -translate-y-1/2 shadow-sm shadow-black" />
           </div>
       </div>

       {/* Top Bar */}
       <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start">
            <div className="text-yellow-400 font-bold text-2xl drop-shadow-md">ניקוד: {score}</div>
            
            {/* Radar (Visual Only) */}
            <div className="w-32 h-32 bg-black bg-opacity-70 rounded-full border-2 border-yellow-600 relative overflow-hidden flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_lime]" />
                <div className="absolute bottom-2 text-xs text-red-400">{enemies.length} אויבים</div>
            </div>
       </div>

       {/* Bottom Stats */}
       <div className="absolute bottom-0 w-full p-6 flex justify-center gap-8 bg-gradient-to-t from-black to-transparent">
           {/* HP */}
           <div className="flex flex-col items-center">
               <div className="text-gray-400 text-sm">בריאות</div>
               <div className="text-4xl font-bold text-red-500 drop-shadow-sm">
                  {hp} <span className="text-2xl">HP</span>
               </div>
               <div className="w-32 h-2 bg-gray-800 rounded mt-2 overflow-hidden">
                  <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${hpPercent}%` }} />
               </div>
           </div>

           {/* Wave */}
           <div className="flex flex-col items-center border-l border-r border-gray-700 px-8">
               <div className="text-yellow-500 text-xl font-bold mb-1">גל {wave + 1}</div>
               <div className="text-white opacity-80 text-sm tracking-widest">מלחמת המכבים</div>
           </div>

           {/* Weapon */}
           <div className="flex flex-col items-center">
               <div className="text-gray-400 text-sm">{weapon.name}</div>
               <div className={`text-4xl font-bold drop-shadow-sm ${currentAmmo === 0 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                   {isReloading ? 'טוען...' : `${currentAmmo} / ${weapon.maxAmmo}`}
               </div>
               <div className="text-xs text-gray-500 mt-1">מקשים 1-5 להחלפה</div>
           </div>
       </div>
       
       {isReloading && (
           <div className="absolute top-2/3 left-1/2 -translate-x-1/2 text-yellow-400 text-xl font-bold animate-pulse">
               טוען נשק...
           </div>
       )}
    </div>
  );
};