import { create } from 'zustand';
import { WeaponConfig, EnemyData, WeaponType, ParticleData } from './types';

// Initial Weapons Configuration
export const WEAPONS: Record<WeaponType, WeaponConfig> = {
  pistol: { id: 'pistol', name: 'אקדח מכבי', damage: 35, fireRate: 300, spread: 0.02, color: '#ffd700', auto: false, pellets: 1, ammo: 12, maxAmmo: 12, reloadTime: 1200 },
  rifle: { id: 'rifle', name: 'רובה סער', damage: 20, fireRate: 100, spread: 0.04, color: '#00ffff', auto: true, pellets: 1, ammo: 30, maxAmmo: 30, reloadTime: 2000 },
  shotgun: { id: 'shotgun', name: 'מטה הזעם', damage: 12, fireRate: 900, spread: 0.12, color: '#ff4400', auto: false, pellets: 6, ammo: 6, maxAmmo: 6, reloadTime: 2500 },
  sniper: { id: 'sniper', name: 'קשת יהונתן', damage: 150, fireRate: 1500, spread: 0.001, color: '#00ff00', auto: false, pellets: 1, ammo: 4, maxAmmo: 4, reloadTime: 3000 },
  laser: { id: 'laser', name: 'אש התמיד', damage: 8, fireRate: 50, spread: 0.02, color: '#4444ff', auto: true, pellets: 1, ammo: 50, maxAmmo: 50, reloadTime: 3500 },
};

export const BATTLES = ["קרב מעלה לבונה", "קרב בית חורון", "קרב אמאוס", "קרב בית צור", "קרב אלעשה"];

interface GameState {
  gameState: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'VICTORY';
  hp: number;
  score: number;
  wave: number;
  enemies: EnemyData[];
  particles: ParticleData[];
  currentWeapon: WeaponType;
  weaponState: Record<WeaponType, { currentAmmo: number }>;
  isReloading: boolean;
  hitMarkerOpacity: number;
  
  // Actions
  startGame: () => void;
  togglePause: () => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  shootWeapon: () => boolean; // Returns true if shot fired
  reloadWeapon: () => void;
  finishReload: () => void;
  switchWeapon: (w: WeaponType) => void;
  spawnEnemy: () => void;
  damageEnemy: (id: string, damage: number) => void;
  addParticle: (x: number, y: number, z: number, color: string) => void;
  cleanupParticles: () => void;
  resetGame: () => void;
  setHitMarker: () => void;
}

export const useStore = create<GameState>((set, get) => ({
  gameState: 'MENU',
  hp: 100,
  score: 0,
  wave: 1,
  enemies: [],
  particles: [],
  currentWeapon: 'pistol',
  weaponState: {
    pistol: { currentAmmo: 12 },
    rifle: { currentAmmo: 30 },
    shotgun: { currentAmmo: 8 },
    sniper: { currentAmmo: 5 },
    laser: { currentAmmo: 60 },
  },
  isReloading: false,
  hitMarkerOpacity: 0,

  startGame: () => set({ gameState: 'PLAYING', hp: 100, score: 0, wave: 1, enemies: [] }),

  togglePause: () => {
    const { gameState } = get();
    if (gameState === 'PLAYING') set({ gameState: 'PAUSED' });
    else if (gameState === 'PAUSED') set({ gameState: 'PLAYING' });
  },
  
  damagePlayer: (amount) => {
    const { hp, gameState } = get();
    if (gameState !== 'PLAYING') return;
    const newHp = Math.max(0, hp - amount);
    set({ hp: newHp });
    if (newHp <= 0) set({ gameState: 'GAMEOVER' });
  },

  healPlayer: (amount) => set((state) => ({ hp: Math.min(100, state.hp + amount) })),

  shootWeapon: () => {
    const { currentWeapon, weaponState, isReloading } = get();
    if (isReloading) return false;
    
    const currentAmmo = weaponState[currentWeapon].currentAmmo;
    if (currentAmmo <= 0) {
      get().reloadWeapon();
      return false;
    }

    set((state) => ({
      weaponState: {
        ...state.weaponState,
        [currentWeapon]: { currentAmmo: currentAmmo - 1 }
      }
    }));
    return true;
  },

  reloadWeapon: () => {
    const { isReloading, currentWeapon } = get();
    const config = WEAPONS[currentWeapon];
    if (isReloading) return;
    
    set({ isReloading: true });
    setTimeout(() => {
        get().finishReload();
    }, config.reloadTime);
  },

  finishReload: () => {
    const { currentWeapon } = get();
    set((state) => ({
      isReloading: false,
      weaponState: {
        ...state.weaponState,
        [currentWeapon]: { currentAmmo: WEAPONS[currentWeapon].maxAmmo }
      }
    }));
  },

  switchWeapon: (w) => set((state) => ({ 
    currentWeapon: w, 
    isReloading: false // Cancel reload on switch
  })),

  spawnEnemy: () => {
    const { wave, enemies } = get();
    if (enemies.length >= 10 + wave) return; // Cap enemies based on wave, start lower
    
    // Spawn logic: random position circle but further away
    // Avoiding spawn inside walls - spawn outside the Temple Mount area basically
    const angle = Math.random() * Math.PI * 2;
    const r = 80 + Math.random() * 20; 
    const type = Math.random() > 0.9 ? 'captain' : 'soldier'; // Fewer captains
    const hp = type === 'captain' ? 200 + (wave * 30) : 80 + (wave * 15);
    
    const newEnemy: EnemyData = {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.cos(angle) * r,
      z: Math.sin(angle) * r,
      hp: hp,
      maxHp: hp,
      speed: type === 'captain' ? 3.5 : 5.5,
      type
    };

    set({ enemies: [...enemies, newEnemy] });
  },

  damageEnemy: (id, damage) => {
    const { enemies, score, wave } = get();
    const enemyIndex = enemies.findIndex(e => e.id === id);
    if (enemyIndex === -1) return;

    const enemy = enemies[enemyIndex];
    const newHp = enemy.hp - damage;

    get().setHitMarker();

    if (newHp <= 0) {
      // Enemy Died
      const newEnemies = [...enemies];
      newEnemies.splice(enemyIndex, 1);
      
      // Wave progression logic
      const newScore = score + (enemy.type === 'captain' ? 50 : 10);
      let newWave = wave;
      if (newScore > wave * 500) {
          newWave = wave + 1;
      }

      set({ 
        enemies: newEnemies,
        score: newScore,
        wave: newWave
      });
      
    } else {
      const newEnemies = [...enemies];
      newEnemies[enemyIndex] = { ...enemy, hp: newHp };
      set({ enemies: newEnemies });
    }
  },

  addParticle: (x, y, z, color) => {
    const p: ParticleData = {
      id: Math.random().toString(),
      x, y, z, color,
      createdAt: Date.now()
    };
    set(state => ({ particles: [...state.particles, p] }));
  },

  cleanupParticles: () => {
    const now = Date.now();
    set(state => ({
      particles: state.particles.filter(p => now - p.createdAt < 500)
    }));
  },

  resetGame: () => {
     get().startGame();
     set({
        weaponState: {
            pistol: { currentAmmo: 12 },
            rifle: { currentAmmo: 30 },
            shotgun: { currentAmmo: 8 },
            sniper: { currentAmmo: 5 },
            laser: { currentAmmo: 60 },
        },
     });
  },
  
  setHitMarker: () => {
      set({ hitMarkerOpacity: 1 });
      setTimeout(() => set({ hitMarkerOpacity: 0 }), 100);
  }
}));

export const getWeaponConfig = (type: WeaponType) => WEAPONS[type];