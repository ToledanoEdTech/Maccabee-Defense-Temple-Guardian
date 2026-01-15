import React, { useMemo } from 'react';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// --- Materials ---
const goldMaterial = new THREE.MeshStandardMaterial({ 
    color: '#FFD700', roughness: 0.1, metalness: 1.0, emissive: '#DAA520', emissiveIntensity: 0.2
});
const copperMaterial = new THREE.MeshStandardMaterial({
    color: '#B87333', roughness: 0.2, metalness: 0.9,
});
const whiteWashMaterial = new THREE.MeshStandardMaterial({
    color: '#F5F5F5', roughness: 0.9, metalness: 0.0
});
const marbleBlue = new THREE.MeshStandardMaterial({
    color: '#E0FFFF', roughness: 0.1, metalness: 0.1
});
const marbleWhite = new THREE.MeshStandardMaterial({
    color: '#FFFFFF', roughness: 0.1, metalness: 0.1
});
const parochetMaterial = new THREE.MeshStandardMaterial({
    color: '#4B0082', roughness: 0.8, side: THREE.DoubleSide
});
const stoneFloor = new THREE.MeshStandardMaterial({
    color: '#D2B48C', roughness: 0.9
});
const woodMaterial = new THREE.MeshStandardMaterial({
    color: '#8B4513', roughness: 0.9
});

// --- Constants (1 Game Unit ~ 1 Meter, 1 Amah ~ 0.5m) ---
export const LEVEL_WOMEN = 0;
export const LEVEL_AZARA = 2.5; // 15 steps * ~0.17m
export const LEVEL_HEICHAL = 5.0; // 12 steps * ~0.2m

// Dimensions
const WOMENS_COURT_SIZE = 70; // 135 amah
const AZARA_WIDTH = 70; 
const AZARA_DEPTH = 93; // 187 amah
const ALTAR_BASE_SIZE = 16; // 32 amah
const RAMP_LENGTH = 16; // 32 amah

// --- Helper Components ---

const Stairs = ({ width, height, depth, count, position, round = false }: any) => {
    const stepHeight = height / count;
    const stepDepth = depth / count;
    return (
        <group position={position}>
            {[...Array(count)].map((_, i) => (
                <mesh key={i} position={[0, i * stepHeight + stepHeight/2, -i * stepDepth]} receiveShadow>
                    {round ? (
                        // Semi-circle logic: scale X based on depth to create curve effect approximating semi-circle steps
                        <cylinderGeometry args={[width/2 + (count-i)*0.8, width/2 + (count-i)*0.8, stepHeight, 64, 1, false, 0, Math.PI]} rotation={[0, Math.PI, 0]} />
                    ) : (
                        <boxGeometry args={[width, stepHeight, stepDepth]} />
                    )}
                    <meshStandardMaterial color="#dcdcdc" roughness={0.7} />
                </mesh>
            ))}
            {/* Fill gap under stairs */}
            {!round && (
                 <mesh position={[0, height/2 - stepHeight, -depth/2]} rotation={[Math.atan(height/depth),0,0]}>
                     <boxGeometry args={[width, Math.sqrt(height**2 + depth**2) - 1, 0.1]} />
                     <meshStandardMaterial color="#aaa" />
                 </mesh>
            )}
        </group>
    )
}

const MosaicFloor = ({ width, depth, level }: { width: number, depth: number, level: number }) => {
    const tiles = useMemo(() => {
        const temp = [];
        const tileSize = 5;
        const colors = ['#f0f0f0', '#222', '#500']; 
        for(let x = -width/2; x < width/2; x += tileSize) {
            for(let z = -depth/2; z < depth/2; z += tileSize) {
                const color = colors[Math.floor(Math.abs(x*13 + z*7)) % 3];
                temp.push(
                    <mesh key={`${x}-${z}`} position={[x + tileSize/2, 0.05, z + tileSize/2]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                        <planeGeometry args={[tileSize * 0.95, tileSize * 0.95]} />
                        <meshStandardMaterial color={color} roughness={0.4} />
                    </mesh>
                )
            }
        }
        return temp;
    }, [width, depth]);
    return <group position={[0, level, 0]}>{tiles}</group>;
}

// --- Structures ---

const CornerChamber = ({ position, label }: { position: [number, number, number], label?: string }) => {
    const size = 20; // 40 amah
    const height = 10;
    return (
        <group position={position}>
            {/* Walls - Open Roof */}
            <mesh position={[0, height/2, -size/2]}><boxGeometry args={[size, height, 1]} /><meshStandardMaterial {...marbleWhite} /></mesh>
            <mesh position={[0, height/2, size/2]}><boxGeometry args={[size, height, 1]} /><meshStandardMaterial {...marbleWhite} /></mesh>
            <mesh position={[-size/2, height/2, 0]}><boxGeometry args={[1, height, size]} /><meshStandardMaterial {...marbleWhite} /></mesh>
            <mesh position={[size/2, height/2, 0]}><boxGeometry args={[1, height, size]} /><meshStandardMaterial {...marbleWhite} /></mesh>
            {/* Floor */}
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}><planeGeometry args={[size-1, size-1]} /><meshStandardMaterial color="#ddd" /></mesh>
        </group>
    )
}

const WomensCourt = () => {
    const size = WOMENS_COURT_SIZE;
    const height = 12;
    const centerZ = 85; 

    return (
        <group position={[0, LEVEL_WOMEN, centerZ]}>
            {/* Floor */}
            <mesh rotation={[-Math.PI/2, 0, 0]} receiveShadow><planeGeometry args={[size, size]} /><meshStandardMaterial {...stoneFloor} /></mesh>

            {/* Corner Chambers */}
            <CornerChamber position={[-size/2 + 10, 0, -size/2 + 10]} label="Lepers" /> {/* NW */}
            <CornerChamber position={[size/2 - 10, 0, -size/2 + 10]} label="Wood" />   {/* NE */}
            <CornerChamber position={[-size/2 + 10, 0, size/2 - 10]} label="Oils" />   {/* SW */}
            <CornerChamber position={[size/2 - 10, 0, size/2 - 10]} label="Nazirites" /> {/* SE */}

            {/* Outer Walls with Gates */}
            {/* South Wall */}
            <mesh position={[0, height/2, size/2]}><boxGeometry args={[size, height, 2]} /><meshStandardMaterial {...marbleWhite} /></mesh>
            
            {/* North Wall */}
            <mesh position={[0, height/2, -size/2]}><boxGeometry args={[size, height, 2]} /><meshStandardMaterial {...marbleWhite} /></mesh>

            {/* East Wall (Main Entrance) */}
            <mesh position={[-20, height/2, size/2]} rotation={[0, Math.PI/2, 0]}><boxGeometry args={[size, height, 2]} /><meshStandardMaterial {...marbleWhite} /></mesh> 
            {/* Wait, East is X+ or Z+? In our coord system:
                Z- is West (Heichal), Z+ is East (Women's Court Entrance).
                So East Wall is at Z = +size/2 relative to centerZ? No, centerZ is 85.
                Women's court is roughly Z=50 to Z=120.
                So Z+ is East.
            */}
             <mesh position={[-size/2, height/2, 0]}><boxGeometry args={[2, height, size]} /><meshStandardMaterial {...marbleWhite} /></mesh> {/* West side (towards Azara) handled by gaps */}
             <mesh position={[size/2, height/2, 0]}><boxGeometry args={[2, height, size]} /><meshStandardMaterial {...marbleWhite} /></mesh> {/* East side */}
            
             {/* 15 Semi-Circular Steps to Nicanor Gate (West side of Women's Court) */}
             <Stairs width={20} height={LEVEL_AZARA} depth={6} count={15} position={[0, 0, -size/2 + 3]} round={true} />
        </group>
    )
}

const OuterAltar = () => {
    // Altar is 32x32 amah (~16x16 units).
    // Ramp is 32 amah long (~16 units).
    // Ramp is on the South side (X- or X+? "South" depends on orientation. Assuming Z- is West (Holy of Holies), Z+ is East. X- is North, X+ is South).
    // The Ramp is on the South side of the altar.
    // The Altar is placed in the Azara.
    
    return (
        <group position={[0, 0, 20]}> 
            {/* Base (Yesod/Sovev combined visual) */}
            <mesh position={[0, 3, 0]} castShadow receiveShadow>
                <boxGeometry args={[ALTAR_BASE_SIZE, 6, ALTAR_BASE_SIZE]} />
                <meshStandardMaterial {...whiteWashMaterial} />
            </mesh>
            {/* Red Line */}
            <mesh position={[0, 3.5, 0]}><boxGeometry args={[ALTAR_BASE_SIZE+0.1, 0.1, ALTAR_BASE_SIZE+0.1]} /><meshBasicMaterial color="#8B0000" /></mesh>
            
            {/* Horns */}
            {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map((d, i) => (
                <mesh key={i} position={[d[0]*7.5, 6.5, d[1]*7.5]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial {...whiteWashMaterial} />
                </mesh>
            ))}

            {/* Ramp (Kevesh) - South side (X+) ascending to North (X-) */}
            {/* Wait, standard orientation: Entrance East (Z+), Holy of Holies West (Z-).
                South is X-? No. Let's define:
                Z+ = East.
                Z- = West.
                X+ = South.
                X- = North.
                So Ramp is on South (X+), ascending towards Altar (North).
            */}
            <group position={[0, 0, 0]}>
                <mesh position={[0, 3, 13]} rotation={[Math.atan(6/16), 0, 0]} castShadow receiveShadow>
                     <boxGeometry args={[4, 0.5, 17]} />
                     <meshStandardMaterial {...whiteWashMaterial} />
                </mesh>
            </group>

            {/* Fire */}
            <group position={[0, 6, 0]}>
                <pointLight color="orange" intensity={2} distance={30} decay={2} />
                <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[2, 3, 1]} /><meshBasicMaterial color="#220000" /></mesh>
                <mesh position={[0, 2, 0]}><dodecahedronGeometry args={[1.5]} /><meshBasicMaterial color="orange" wireframe /></mesh>
            </group>
        </group>
    )
}

const Azara = () => {
    // 135 wide (X) x 187 deep (Z). ~70 x 93 units.
    const width = AZARA_WIDTH;
    const depth = AZARA_DEPTH;
    const height = 15;
    const wallThick = 3;

    return (
        <group position={[0, LEVEL_AZARA, 0]}>
            {/* Ground Floor Azara */}
            <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial {...stoneFloor} />
            </mesh>
            <MosaicFloor width={width} depth={depth} level={0} />

            {/* Ezrat Yisrael Strip (East side) */}
            {/* 11 amah deep ~ 5.5 units. At Z = +40 approx */}
            <group position={[0, 0, 42]}>
                 <mesh position={[0, 0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                     <planeGeometry args={[width, 5.5]} />
                     <meshStandardMaterial color="#c0c0c0" roughness={0.8} />
                 </mesh>
                 {/* Duchan (Step separating Israel from Priests) */}
                 <mesh position={[0, 0.5, -3]}><boxGeometry args={[width, 1, 1]} /><meshStandardMaterial {...stoneFloor} /></mesh>
            </group>

            {/* --- Walls with Gates --- */}

            {/* North Wall (X-) */}
            {/* 3 Gates: Nitzotz, Korban, Moked */}
            <group position={[-width/2, height/2, 0]}>
                 {/* We construct the wall from segments to leave holes */}
                 <mesh position={[0, 0, -35]}><boxGeometry args={[wallThick, height, 20]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 <mesh position={[0, 0, -10]}><boxGeometry args={[wallThick, height, 15]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 <mesh position={[0, 0, 15]}><boxGeometry args={[wallThick, height, 15]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 <mesh position={[0, 0, 40]}><boxGeometry args={[wallThick, height, 13]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 
                 {/* Gate Frames */}
                 <mesh position={[0, 2, -22]}><boxGeometry args={[3.2, 8, 4]} /><meshStandardMaterial {...copperMaterial} /></mesh>
                 <mesh position={[0, 2, 0]}><boxGeometry args={[3.2, 8, 4]} /><meshStandardMaterial {...copperMaterial} /></mesh>
                 <mesh position={[0, 2, 28]}><boxGeometry args={[3.2, 8, 4]} /><meshStandardMaterial {...copperMaterial} /></mesh>
            </group>

            {/* South Wall (X+) */}
            {/* 3 Gates: Fuel, Firstborns, Water */}
            <group position={[width/2, height/2, 0]}>
                 <mesh position={[0, 0, -35]}><boxGeometry args={[wallThick, height, 20]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 <mesh position={[0, 0, -10]}><boxGeometry args={[wallThick, height, 15]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 <mesh position={[0, 0, 15]}><boxGeometry args={[wallThick, height, 15]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 <mesh position={[0, 0, 40]}><boxGeometry args={[wallThick, height, 13]} /><meshStandardMaterial {...marbleWhite} /></mesh>

                 <mesh position={[0, 2, -22]}><boxGeometry args={[3.2, 8, 4]} /><meshStandardMaterial {...copperMaterial} /></mesh>
                 <mesh position={[0, 2, 0]}><boxGeometry args={[3.2, 8, 4]} /><meshStandardMaterial {...copperMaterial} /></mesh>
                 <mesh position={[0, 2, 28]}><boxGeometry args={[3.2, 8, 4]} /><meshStandardMaterial {...copperMaterial} /></mesh>
            </group>

            {/* East Wall (Nicanor Gate) */}
            <group position={[0, height/2, depth/2]}>
                 <mesh position={[-20, 0, 0]}><boxGeometry args={[30, height, wallThick]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 <mesh position={[20, 0, 0]}><boxGeometry args={[30, height, wallThick]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 {/* Nicanor Gate (Gold/Copper) */}
                 <mesh position={[0, 1, 0]}><boxGeometry args={[8, 10, 4]} /><meshStandardMaterial {...copperMaterial} color="#d4af37" /></mesh>
            </group>

            {/* West Wall (Behind Heichal) */}
             <mesh position={[0, height/2, -depth/2]}><boxGeometry args={[width, height, wallThick]} /><meshStandardMaterial {...marbleWhite} /></mesh>

            {/* Structures in Azara */}
            <OuterAltar />
            
            {/* Lishkat HaGazit (NE Corner - X-, Z+) */}
            <group position={[-25, 5, 35]}>
                 <mesh><cylinderGeometry args={[8, 8, 10, 6]} /><meshStandardMaterial {...marbleBlue} /></mesh>
                 <mesh position={[0, 8, 0]}><sphereGeometry args={[8, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color="#eee" /></mesh>
            </group>

            {/* Beit HaMoked (NW Corner - X-, Z-) */}
            <group position={[-25, 5, -35]}>
                <mesh><boxGeometry args={[15, 10, 15]} /><meshStandardMaterial {...marbleBlue} /></mesh>
                <mesh position={[0, 5, 0]}><sphereGeometry args={[7, 16, 16, 0, Math.PI*2, 0, Math.PI/2]} /><meshStandardMaterial color="#eee" /></mesh>
            </group>

            {/* Laver (Kiyor) */}
            <group position={[-6, 0, 10]}>
                <mesh position={[0,1,0]}><cylinderGeometry args={[1,1.2,2]} /><meshStandardMaterial {...copperMaterial} /></mesh>
                <mesh position={[0,2.5,0]}><sphereGeometry args={[1.5,16,16,0,6.3,0,1.5]} /><meshStandardMaterial {...copperMaterial} /></mesh>
            </group>
        </group>
    )
}

const Heichal = () => {
    // Grounded Foundation to fix "floating" look
    // Heichal starts at LEVEL_HEICHAL (5.0).
    // It sits on a foundation block that goes from LEVEL_AZARA (2.5) to LEVEL_HEICHAL (5.0).
    const foundationHeight = LEVEL_HEICHAL - LEVEL_AZARA;

    return (
        <group position={[0, 0, -25]}>
             {/* 12 Steps leading up */}
             <Stairs width={16} height={foundationHeight} depth={5} count={12} position={[0, LEVEL_AZARA, 18]} />

             {/* Foundation Block (Solid base) */}
             <mesh position={[0, LEVEL_AZARA + foundationHeight/2, -5]} receiveShadow>
                 <boxGeometry args={[40, foundationHeight, 50]} />
                 <meshStandardMaterial {...stoneFloor} />
             </mesh>

             <group position={[0, LEVEL_HEICHAL, 0]}>
                 {/* Ulam (Entrance) */}
                 <mesh position={[-15, 20, 15]}><boxGeometry args={[10, 40, 10]} /><meshStandardMaterial {...marbleBlue} /></mesh>
                 <mesh position={[15, 20, 15]}><boxGeometry args={[10, 40, 10]} /><meshStandardMaterial {...marbleBlue} /></mesh>
                 <mesh position={[0, 35, 15]}><boxGeometry args={[40, 10, 10]} /><meshStandardMaterial {...marbleBlue} /></mesh>
                 <mesh position={[0, 30, 15]}><torusGeometry args={[8, 0.5, 16, 40, Math.PI]} rotation={[0,0,Math.PI]} /><meshStandardMaterial {...goldMaterial} /></mesh>

                 {/* Kodesh Walls (Start from floor!) */}
                 {/* Left */}
                 <mesh position={[-12, 15, -10]}><boxGeometry args={[4, 30, 40]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 {/* Right */}
                 <mesh position={[12, 15, -10]}><boxGeometry args={[4, 30, 40]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 {/* Back */}
                 <mesh position={[0, 15, -30]}><boxGeometry args={[28, 30, 4]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 {/* Roof */}
                 <mesh position={[0, 30, -10]}><boxGeometry args={[28, 2, 44]} /><meshStandardMaterial {...marbleWhite} /></mesh>
                 {/* Spikes */}
                 {[...Array(8)].map((_, i) => (
                      <mesh key={i} position={[-10 + i*2.8, 31, -10]}><coneGeometry args={[0.3, 1.5, 4]} /><meshStandardMaterial {...goldMaterial} /></mesh>
                  ))}

                 {/* Interior Artifacts */}
                 <group position={[0, 1, -10]}>
                      <mesh position={[0, 8, -15]}><planeGeometry args={[20, 16]} /><meshStandardMaterial {...parochetMaterial} /></mesh>
                      <group position={[-5, 0, 0]}><mesh position={[0, 3, 0]}><cylinderGeometry args={[0.2, 0.5, 6]} /><meshStandardMaterial {...goldMaterial} /></mesh><pointLight color="orange" distance={8} position={[0,6,0]} /></group>
                      <group position={[5, 0, 0]}><mesh position={[0, 1.5, 0]}><boxGeometry args={[2, 3, 1]} /><meshStandardMaterial {...goldMaterial} /></mesh></group>
                      <group position={[0, 0, 5]}><mesh position={[0, 1, 0]}><boxGeometry args={[1, 2, 1]} /><meshStandardMaterial {...goldMaterial} /></mesh></group>
                 </group>
             </group>
        </group>
    )
}

export const Level = () => {
  return (
    <group>
      <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[100, 100, 50]} intensity={0.7} color="#FFFACD" castShadow />
      
      {/* Temple Mount Floor (The Base) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
            <planeGeometry args={[400, 400]} />
            <meshStandardMaterial color="#C2B280" roughness={1} />
      </mesh>

      <WomensCourt />
      <Azara />
      <Heichal />

    </group>
  );
};