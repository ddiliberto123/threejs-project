import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center, OrbitControls, Text, Text3D } from "@react-three/drei";
import * as THREE from "three";

// Single hexagon component
function Hexagon({
  position,
  color = 0x8b4513,
  showToken = false,
  isDesert = false,
  tokenNumber = 0,
  texturePath,
}: {
  position: [number, number, number];
  color?: number;
  showToken?: boolean;
  isDesert?: boolean;
  tokenNumber?: number;
  texturePath?: string;
}) {
  const hexRef = useRef<THREE.Mesh>(null!);
  const [fontLoaded, setFontLoaded] = useState(false);

  // Force re-render after a short delay to ensure font is loaded
  useEffect(() => {
    const timer = setTimeout(() => {
      setFontLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Load texture if provided
  const texture = texturePath
    ? new THREE.TextureLoader().load(texturePath)
    : null;
  if (texture) {
    // Rotate the texture (in radians)
    texture.rotation = Math.PI / 6; // 30 degrees rotation
    texture.center.set(0.7, 0.5); // Set rotation center to middle of texture

    // Scale the texture to cover more area
    texture.repeat.set(0.22, 0.22); // Make texture 20% larger

    // Adjust positioning if needed
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
  }

  // Calculate dot count using formula 6 - |7 - n| and determine color
  const dotCount = 6 - Math.abs(7 - tokenNumber);
  const isRed = dotCount === 5;
  const textColor = isRed ? "#FF0000" : "#000000";

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
  const tokenHeight = 0.2;
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
        <meshPhongMaterial
          color={color}
          transparent
          opacity={1}
          map={texture}
        />

        {/* Outer hexagon - acts as border (child of main hexagon) */}
        <mesh position={[0, 0, -0.05]} castShadow receiveShadow>
          <extrudeGeometry
            args={[outerHexShape, { depth: 0.1, bevelEnabled: false }]}
          />
          <meshPhongMaterial color={0x654321} transparent opacity={1} />{" "}
          {/* Darker brown for border */}
        </mesh>

        {/* Optional token with text and cylinder row (child of main hexagon) */}
        {showToken && !isDesert && (
          <group>
            {/* Main token (beige) */}
            <mesh
              position={[0, 0, tileHeight]}
              rotation={[THREE.MathUtils.degToRad(90), 0, 0]}
            >
              <cylinderGeometry args={[0.5, 0.5, tokenHeight, 32]} />
              <meshPhongMaterial color={0xf5f5dc} transparent opacity={1} />

              {/* 3D Text on token */}
              <group
                rotation={[
                  THREE.MathUtils.degToRad(-90),
                  0,
                  THREE.MathUtils.degToRad(30),
                ]}
                position={[0, tokenHeight / 2, 0]}
              >
                {fontLoaded && (
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
                      {tokenNumber}
                      <meshStandardMaterial color={textColor} />
                    </Text3D>
                  </Center>
                )}
                {/* Probability markers (row of cylinders) below coin */}
                {Array.from({ length: dotCount }, (_, index) => {
                  const spacing = 0.12;
                  const startOffset = (-(dotCount - 1) * spacing) / 2;

                  return (
                    <mesh
                      key={index}
                      position={[startOffset + index * spacing, -0.25, 0]}
                      rotation={[THREE.MathUtils.degToRad(90), 0, 0]}
                    >
                      <cylinderGeometry args={[0.05, 0.05, 0.05, 16]} />
                      <meshPhongMaterial color={textColor} />
                    </mesh>
                  );
                })}
              </group>
            </mesh>
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

  // Calculate positions for 3,4,5,4,3 pattern with Catan terrain distribution
  const getHexPositions = () => {
    const positions: Array<{
      pos: [number, number, number];
      color: number;
      isDesert: boolean;
      tokenNumber: number;
      texturePath: string;
    }> = [];
    const rowCounts = [3, 4, 5, 4, 3];

    // Catan terrain distribution
    const terrains = [
      ...Array(4).fill({
        color: 0x2f4f2f,
        name: "Wood",
        texture: "/src/assets/hexes/forest.png",
      }), // Dark green
      ...Array(4).fill({
        color: 0xe9d1ca,
        name: "Wheat",
        texture: "/src/assets/hexes/field.png",
      }), // Beige variant
      ...Array(4).fill({
        color: 0x90ee90,
        name: "Sheep",
        texture: "/src/assets/hexes/pasture.png",
      }), // Light green
      ...Array(3).fill({
        color: 0x808080,
        name: "Ore",
        texture: "/src/assets/hexes/mountain.png",
      }), // Gray
      ...Array(3).fill({
        color: 0xd2691e,
        name: "Brick",
        texture: "/src/assets/hexes/hill.png",
      }), // Orangish brown
      {
        color: 0xf4a460,
        name: "Desert",
        texture: "/src/assets/hexes/desert.png",
      }, // Sandy desert
    ];

    // Catan token distribution (18 tokens for 18 non-desert hexes)
    const tokens = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

    // Adjacency map for 3-4-5-4-3 hex grid (index -> adjacent indices)
    const adjacencyMap: { [key: number]: number[] } = {
      0: [1, 3, 4],
      1: [0, 2, 4, 5],
      2: [1, 5, 6],
      3: [0, 4, 7, 8],
      4: [0, 1, 3, 5, 8, 9],
      5: [1, 2, 4, 6, 9, 10],
      6: [2, 5, 10, 11],
      7: [3, 8, 12, 13],
      8: [3, 4, 7, 9, 13, 14],
      9: [4, 5, 8, 10, 14, 15],
      10: [5, 6, 9, 11, 15, 16],
      11: [6, 10, 16, 17],
      12: [7, 13, 16],
      13: [7, 8, 12, 14, 16, 17],
      14: [8, 9, 13, 15, 17, 18],
      15: [9, 10, 14, 18],
      16: [10, 11, 12, 13, 17],
      17: [11, 13, 14, 16, 18],
      18: [14, 15, 17],
    };

    // Validation functions
    const validateRedAdjacency = (
      tokenAssignments: number[],
      terrainTypes: any[],
    ) => {
      for (let i = 0; i < 19; i++) {
        if (terrainTypes[i].name === "Desert") continue;
        const token = tokenAssignments[i];
        if (token === 6 || token === 8) {
          for (const adjIndex of adjacencyMap[i]) {
            if (terrainTypes[adjIndex].name !== "Desert") {
              const adjToken = tokenAssignments[adjIndex];
              if (adjToken === 6 || adjToken === 8) {
                return false; // Red numbers are adjacent
              }
            }
          }
        }
      }
      return true;
    };

    const validateResourceDistribution = (
      tokenAssignments: number[],
      terrainTypes: any[],
    ) => {
      const resourceTokens: { [resource: string]: number[] } = {};

      for (let i = 0; i < 19; i++) {
        if (terrainTypes[i].name === "Desert") continue;
        const resource = terrainTypes[i].name;
        const token = tokenAssignments[i];

        if (!resourceTokens[resource]) resourceTokens[resource] = [];
        resourceTokens[resource].push(token);
      }

      // Check no resource has both 6s or both 8s
      for (const resource in resourceTokens) {
        const tokens = resourceTokens[resource];
        const sixCount = tokens.filter((t) => t === 6).length;
        const eightCount = tokens.filter((t) => t === 8).length;
        if (sixCount > 1 || eightCount > 1) return false;
      }

      return true;
    };

    const validateLowNumberClustering = (
      tokenAssignments: number[],
      terrainTypes: any[],
    ) => {
      const resourceTokens: { [resource: string]: number[] } = {};

      for (let i = 0; i < 19; i++) {
        if (terrainTypes[i].name === "Desert") continue;
        const resource = terrainTypes[i].name;
        const token = tokenAssignments[i];

        if (!resourceTokens[resource]) resourceTokens[resource] = [];
        resourceTokens[resource].push(token);
      }

      // Check no resource has more than one very low number (2, 3, 12)
      for (const resource in resourceTokens) {
        const tokens = resourceTokens[resource];
        const lowNumbers = tokens.filter((t) => t === 2 || t === 3 || t === 12);
        if (lowNumbers.length > 1) return false;
      }

      return true;
    };

    // Generate valid token assignments
    const generateValidAssignment = () => {
      let attempts = 0;
      const maxAttempts = 1000;

      while (attempts < maxAttempts) {
        // Shuffle terrain types
        const shuffledTerrains = [...terrains];
        for (let i = shuffledTerrains.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledTerrains[i], shuffledTerrains[j]] = [
            shuffledTerrains[j],
            shuffledTerrains[i],
          ];
        }

        // Shuffle tokens
        const shuffledTokens = [...tokens];
        for (let i = shuffledTokens.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledTokens[i], shuffledTokens[j]] = [
            shuffledTokens[j],
            shuffledTokens[i],
          ];
        }

        // Assign tokens to non-desert hexes
        const tokenAssignments = new Array(19).fill(0);
        let tokenIndex = 0;

        for (let i = 0; i < 19; i++) {
          if (shuffledTerrains[i].name !== "Desert") {
            tokenAssignments[i] = shuffledTokens[tokenIndex++];
          }
        }

        // Validate all rules
        if (
          validateRedAdjacency(tokenAssignments, shuffledTerrains) &&
          validateResourceDistribution(tokenAssignments, shuffledTerrains) &&
          validateLowNumberClustering(tokenAssignments, shuffledTerrains)
        ) {
          return { terrains: shuffledTerrains, tokens: tokenAssignments };
        }

        attempts++;
      }

      // Fallback: return unvalidated assignment if max attempts reached
      console.warn(
        "Could not generate valid Catan board after",
        maxAttempts,
        "attempts",
      );
      const shuffledTerrains = [...terrains];
      for (let i = shuffledTerrains.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTerrains[i], shuffledTerrains[j]] = [
          shuffledTerrains[j],
          shuffledTerrains[i],
        ];
      }
      const shuffledTokens = [...tokens];
      for (let i = shuffledTokens.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTokens[i], shuffledTokens[j]] = [
          shuffledTokens[j],
          shuffledTokens[i],
        ];
      }
      const tokenAssignments = new Array(19).fill(0);
      let tokenIndex = 0;
      for (let i = 0; i < 19; i++) {
        if (shuffledTerrains[i].name !== "Desert") {
          tokenAssignments[i] = shuffledTokens[tokenIndex++];
        }
      }
      return { terrains: shuffledTerrains, tokens: tokenAssignments };
    };

    const { terrains: validTerrains, tokens: validTokens } =
      generateValidAssignment();

    let hexIndex = 0;
    rowCounts.forEach((count, rowIndex) => {
      const rowZ = (rowIndex - 2) * hexHeight * spacingMultiplier;
      const startX = (-(count - 1) * hexWidth * spacingMultiplier) / 2;

      for (let col = 0; col < count; col++) {
        const x = startX + col * hexWidth * spacingMultiplier;
        const y = 0.1; // Just above water
        const terrain = validTerrains[hexIndex];
        const isDesert = terrain.name === "Desert";

        positions.push({
          pos: [x, y, rowZ],
          color: terrain.color,
          isDesert: isDesert,
          tokenNumber: validTokens[hexIndex],
          texturePath: terrain.texture,
        });

        hexIndex++;
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
          showToken={!hex.isDesert} // Show token on all non-desert hexes
          isDesert={hex.isDesert}
          tokenNumber={hex.tokenNumber}
          texturePath={hex.texturePath}
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
      {/* Sun-like light from behind */}
      <directionalLight
        position={[-50, 50, -30]}
        intensity={1.5}
        color={0xfff4e6}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-camera-near={0.1}
        shadow-camera-far={200}
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
