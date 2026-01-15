export type WeaponType = 'pistol' | 'rifle' | 'shotgun' | 'sniper' | 'laser';

export interface WeaponConfig {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number; // ms between shots
  spread: number;
  color: string;
  auto: boolean;
  pellets: number;
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
}

export interface EnemyData {
  id: string;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  speed: number;
  type: 'soldier' | 'captain';
}

export interface ParticleData {
  id: string;
  x: number;
  y: number;
  z: number;
  color: string;
  createdAt: number;
}
