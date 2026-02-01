import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, OrbitControls, Text, Text3D } from "@react-three/drei";
import * as THREE from "three";

// Single hexagon component
function Hexagon({
  position,
  color = 0x8b4513,
  showCoin = false,
}: {
  position: [number, number, number];
  color?: number;
  showCoin?: boolean;
}) {
  const hexRef = useRef<THREE.Mesh>(null!);
  const coinNumber = useRef(Math.floor(Math.random() * 12) + 1);

  // Create outer hexagon shape (border)
  const createHexShape = (radius: number) => {
    const hexShape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) {
        hexShape.moveTo(x, y);
      } else {
        hexShape.lineTo(x, y);
      }
    }
    return hexShape;
  };

  const outerHexShape = createHexShape(2.2); // Bigger border
  const innerHexShape = createHexShape(2.0); // Bigger main area
  const tileHeight = 0.2;
  const coinHeight = 0.2;
  return (
    <group
      ref={hexRef}
      position={position}
      rotation={[
        THREE.MathUtils.degToRad(-90),
        0,
        THREE.MathUtils.degToRad(-30),
      ]}
    >
      {/* Inner hexagon - main color area (parent) */}
      <mesh position={[0, 0, 0.05]} castShadow receiveShadow>
        <extrudeGeometry
          args={[innerHexShape, { depth: tileHeight, bevelEnabled: false }]}
        />
        <meshPhongMaterial color={color} transparent opacity={1} />

        {/* Outer hexagon - acts as border (child of main hexagon) */}
        <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
          <extrudeGeometry
            args={[outerHexShape, { depth: 0.1, bevelEnabled: false }]}
          />
          <meshPhongMaterial color={0x654321} /> {/* Darker brown for border */}
        </mesh>

        {/* Optional coin with text and cylinder row (child of main hexagon) */}
        {showCoin && (
          <group>
            {/* Main coin (beige) */}
            <mesh
              position={[0, 0, tileHeight]}
              rotation={[THREE.MathUtils.degToRad(90), 0, 0]}
            >
              <cylinderGeometry args={[0.5, 0.5, coinHeight, 32]} />
              <meshPhongMaterial color={0xf5f5dc} />

              {/* 3D Text on coin */}
              <group
                rotation={[THREE.MathUtils.degToRad(-90), 0, THREE.MathUtils.degToRad(30)]}
                position={[0, coinHeight / 2,0]}
              >
                <Center>
                  <Text3D
                    font="src\assets\fonts\times.json"
                    size={0.3}
                    height={0.05}
                    curveSegments={12}
                    bevelEnabled
                    bevelSize={0.01}
                    bevelThickness={0.01}
                  >
                    {coinNumber.current}
                    <meshStandardMaterial color="#8B4513" />
                  </Text3D>
                </Center>
              </group>
            </mesh>

            {/* Probability markers (row of cylinders) below coin */}
            {Array.from(
              { length: Math.floor(Math.random() * 4) + 2 },
              (_, index) => {
                const totalMarkers = Math.floor(Math.random() * 4) + 2; // 2-5 markers
                const spacing = 0.4;
                const startOffset = (-(totalMarkers - 1) * spacing) / 2;
                return (
                  <mesh
                    key={index}
                    position={[
                      startOffset + index * spacing,
                      0,
                      tileHeight - 0.4,
                    ]}
                    rotation={[THREE.MathUtils.degToRad(90), 0, 0]}
                  >
                    <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
                    <meshPhongMaterial color="#8B4513" />
                  </mesh>
                );
              },
            )}
          </group>
        )}
      </mesh>

      <axesHelper args={[1]} />
    </group>
  );
}

// Catan board hexagon grid component
function CatanBoard() {
  const boardRef = useRef<THREE.Group>(null!);
  const hexRadius = 2.2; // Updated to match outer hexagon size
  const hexWidth = hexRadius * 2;
  const hexHeight = hexRadius * Math.sqrt(3);

  // Calculate spacing: hexagon width + half border width
  // Border width = 2.2 - 2.0 = 0.2, half border = 0.1
  // Spacing = hexWidth + 0.1 = 4.4 + 0.1 = 4.5
  const spacingMultiplier = 3.6 / hexWidth; // = 4.5 / 4.4 ≈ 1.023

  // Calculate positions for 3,4,5,4,3 pattern
  const getHexPositions = () => {
    const positions: Array<{ pos: [number, number, number]; color: number }> =
      [];
    const rowCounts = [3, 4, 5, 4, 3];
    const colors = [0x8b4513, 0x228b22, 0xffd700, 0xff6347, 0x4169e1, 0x9932cc]; // Brown, Green, Gold, Red, Blue, Purple

    rowCounts.forEach((count, rowIndex) => {
      const rowZ = (rowIndex - 2) * hexHeight * spacingMultiplier; // Use calculated spacing
      const startX = (-(count - 1) * hexWidth * spacingMultiplier) / 2; // Use calculated spacing

      for (let col = 0; col < count; col++) {
        const x = startX + col * hexWidth * spacingMultiplier; // Use calculated spacing
        const y = 0.1; // Just above water
        const color = colors[Math.floor(Math.random() * colors.length)];

        positions.push({
          pos: [x, y, rowZ],
          color: color,
        });
      }
    });

    return positions;
  };

  const hexData = getHexPositions();

  return (
    <group ref={boardRef}>
      {hexData.map((hex, index) => (
        <Hexagon
          key={index}
          position={hex.pos}
          color={hex.color}
          showCoin={index % 3 === 0} // Show coin on every 3rd hexagon
        />
      ))}
    </group>
  );
}

// Water group component with animation
function WaterGroup() {
  const waterGroupRef = useRef<THREE.Group>(null!);
  const layerRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 0.5;

    // Animate water layers
    layerRefs.current.forEach((layer, index) => {
      if (layer) {
        layer.rotation.z = Math.sin(time + index) * 0.02;
        layer.position.y =
          -0.05 + index * 0.02 + Math.sin(time * 2 + index) * 0.005;
      }
    });
  });

  return (
    <group ref={waterGroupRef} position={[0, 0, 0]}>
      {/* Axes helper for coordinate system reference */}
      <axesHelper args={[5]} />

      {/* Main water base */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[400, 400, 64, 64]} />
        <meshPhongMaterial
          color={0x006994}
          transparent
          opacity={0.8}
          shininess={100}
        />
      </mesh>

      {/* Animated water layers */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (layerRefs.current[i] = el)}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.05 + i * 0.02, 0]}
        >
          <planeGeometry args={[180 - i * 10, 180 - i * 10]} />
          <meshPhongMaterial
            color={new THREE.Color().setHSL(0.58, 0.8, 0.3 + i * 0.1)}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Catan hexagon board - positioned relative to water group */}
      <CatanBoard />
    </group>
  );
}

// Main scene component
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} color={0x404040} />
      <directionalLight
        position={[10, 20, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Water group with Catan board */}
      <WaterGroup />

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enableZoom
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={50}
      />
    </>
  );
}

function ThreeScene() {
  return (
    <div className="scene-container">
      <Canvas
        camera={{
          position: [0, 25, 20],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        shadows
        gl={{
          antialias: true,
        }}
        scene={{ background: new THREE.Color(0x87ceeb) }}
      >
        <Scene />
      </Canvas>

      <div className="scene-info">
        <h1>Catan Board - Hexagon Grid</h1>
        <p>Classic 3-4-5-4-3 hexagon pattern</p>
        <p>Left click: rotate | Right click: pan | Scroll: zoom</p>
      </div>
    </div>
  );
}

export default ThreeScene;
