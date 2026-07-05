import React, { useState } from 'react';
import { Html, Edges } from '@react-three/drei';
import * as THREE from 'three';

// 1. Procedural Helix Curve Class for suspension springs (Fixed TS1294 erasable syntax)
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  radius: number;
  height: number;
  turns: number;

  constructor(radius: number = 0.024, height: number = 0.12, turns: number = 5) {
    super();
    this.radius = radius;
    this.height = height;
    this.turns = turns;
  }

  getPoint(t: number, optionalTarget = new THREE.Vector3()) {
    const angle = t * Math.PI * 2 * this.turns;
    const x = this.radius * Math.cos(angle);
    const y = t * this.height - this.height / 2;
    const z = this.radius * Math.sin(angle);
    return optionalTarget.set(x, y, z);
  }
}

// 2. High-Fidelity Procedural SUV chassis component with physical, wireframe, and points layers
const HighFidelitySUV: React.FC<{
  wireMaterial: THREE.ShaderMaterial;
  pointsMaterial: THREE.ShaderMaterial;
}> = ({ wireMaterial, pointsMaterial }) => {
  const bodyOpacity = 0.15;
  const bodyColor = '#475569';

  return (
    <group scale={[0.85, 0.85, 0.85]} position={[0, -0.05, 0]}>
      {/* --- A. TIRES & MACHINED RIM ASSEMBLIES --- */}
      {[-0.9, 0.9].map((x) => 
        [-0.52, 0.52].map((z) => {
          const isOuterLeft = z > 0;
          const faceOffset = isOuterLeft ? 0.058 : -0.058;
          return (
            <group key={`wheel-${x}-${z}`} position={[x, -0.05, z]}>
              {/* Dark Charcoal Rubber Tire */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.22, 0.22, 0.12, 24]} />
                <meshStandardMaterial color="#0b0f19" roughness={0.9} />
              </mesh>
              {/* Sporty Rim Face Backing */}
              <mesh position={[0, 0, faceOffset]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.01, 16]} />
                <meshPhysicalMaterial color="#0f172a" roughness={0.15} metalness={0.8} clearcoat={1.0} />
              </mesh>
              {/* Outer Metallic Lip Ring */}
              <mesh position={[0, 0, faceOffset]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.145, 0.006, 8, 32]} />
                <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.05} />
              </mesh>
              {/* 5-Spoke Machined Alloy Details */}
              {Array.from({ length: 5 }).map((_, idx) => (
                <mesh 
                  key={`spoke-${idx}`} 
                  position={[0, 0, faceOffset]} 
                  rotation={[0, 0, (idx * Math.PI * 2) / 5]}
                >
                  <boxGeometry args={[0.02, 0.14, 0.006]} />
                  <meshStandardMaterial color="#ffffff" metalness={0.95} roughness={0.05} />
                </mesh>
              ))}
            </group>
          );
        })
      )}

      {/* --- B. TRANSLUCENT BODY SHIELDS WITH OVERLAID SHADERS --- */}
      {/* Front Engine Hood */}
      <group position={[0.6, 0.12, 0]}>
        <mesh>
          <boxGeometry args={[0.7, 0.02, 0.74]} />
          <meshPhysicalMaterial color={bodyColor} transparent opacity={bodyOpacity} roughness={0.2} metalness={0.8} depthWrite={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.7, 0.02, 0.74]} />
          <primitive object={wireMaterial} attach="material" />
        </mesh>
        <points>
          <boxGeometry args={[0.7, 0.02, 0.74]} />
          <primitive object={pointsMaterial} attach="material" />
        </points>
      </group>

      {/* Cabin Roof Frame */}
      <group position={[-0.2, 0.45, 0]}>
        <mesh>
          <boxGeometry args={[1.0, 0.02, 0.7]} />
          <meshPhysicalMaterial color={bodyColor} transparent opacity={bodyOpacity} roughness={0.2} metalness={0.8} depthWrite={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.0, 0.02, 0.7]} />
          <primitive object={wireMaterial} attach="material" />
        </mesh>
        <points>
          <boxGeometry args={[1.0, 0.02, 0.7]} />
          <primitive object={pointsMaterial} attach="material" />
        </points>
      </group>

      {/* Slanted Aerodynamic Windshield */}
      <mesh position={[0.2, 0.28, 0]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.42, 0.01, 0.72]} />
        <meshPhysicalMaterial color={bodyColor} transparent opacity={bodyOpacity} roughness={0.1} metalness={0.9} depthWrite={false} />
      </mesh>

      {/* Left Flank Side Doors */}
      <group position={[-0.1, 0.18, 0.36]}>
        <mesh>
          <boxGeometry args={[0.9, 0.28, 0.02]} />
          <meshPhysicalMaterial color={bodyColor} transparent opacity={bodyOpacity} roughness={0.2} metalness={0.8} depthWrite={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.9, 0.28, 0.02]} />
          <primitive object={wireMaterial} attach="material" />
        </mesh>
        <points>
          <boxGeometry args={[0.9, 0.28, 0.02]} />
          <primitive object={pointsMaterial} attach="material" />
        </points>
      </group>

      {/* Right Flank Side Doors */}
      <group position={[-0.1, 0.18, -0.36]}>
        <mesh>
          <boxGeometry args={[0.9, 0.28, 0.02]} />
          <meshPhysicalMaterial color={bodyColor} transparent opacity={bodyOpacity} roughness={0.2} metalness={0.8} depthWrite={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.9, 0.28, 0.02]} />
          <primitive object={wireMaterial} attach="material" />
        </mesh>
        <points>
          <boxGeometry args={[0.9, 0.28, 0.02]} />
          <primitive object={pointsMaterial} attach="material" />
        </points>
      </group>

      {/* Rear Tailgate Door */}
      <group position={[-0.7, 0.22, 0]}>
        <mesh>
          <boxGeometry args={[0.02, 0.44, 0.72]} />
          <meshPhysicalMaterial color={bodyColor} transparent opacity={bodyOpacity} roughness={0.2} metalness={0.8} depthWrite={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.02, 0.44, 0.72]} />
          <primitive object={wireMaterial} attach="material" />
        </mesh>
        <points>
          <boxGeometry args={[0.02, 0.44, 0.72]} />
          <primitive object={pointsMaterial} attach="material" />
        </points>
      </group>

      {/* --- C. ROBUST INTEGRATED STRUCTURAL ROLLCAGE --- */}
      {/* Front Nose Bumper Bar */}
      <mesh position={[1.15, -0.05, 0]}>
        <boxGeometry args={[0.08, 0.08, 0.8]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Rear Safety Bumper Bar */}
      <mesh position={[-1.15, -0.05, 0]}>
        <boxGeometry args={[0.08, 0.08, 0.8]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Side Frame Lower Rocker Rails */}
      <mesh position={[0, -0.06, 0.35]}>
        <boxGeometry args={[2.0, 0.04, 0.04]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, -0.06, -0.35]}>
        <boxGeometry args={[2.0, 0.04, 0.04]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Curved A-Pillars */}
      <mesh position={[0.2, 0.28, 0.35]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.015, 0.015, 0.45, 8]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0.2, 0.28, -0.35]} rotation={[0, 0, -0.6]}>
        <cylinderGeometry args={[0.015, 0.015, 0.45, 8]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Vertical B-Pillars */}
      <mesh position={[-0.1, 0.22, 0.35]}>
        <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[-0.1, 0.22, -0.35]}>
        <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Angled Rear C-Pillars */}
      <mesh position={[-0.7, 0.22, 0.35]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[-0.7, 0.22, -0.35]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.015, 0.015, 0.44, 8]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Left and Right Roof Frame Tubes */}
      <mesh position={[-0.2, 0.44, 0.35]}>
        <boxGeometry args={[1.0, 0.03, 0.03]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[-0.2, 0.44, -0.35]}>
        <boxGeometry args={[1.0, 0.03, 0.03]} />
        <meshPhysicalMaterial color="#334155" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
};

export interface EvChassisModelProps {
  activeStation?: number;
  hasFailed?: boolean;
  failStation?: number;
  gate1Status?: string;
  gate2Status?: string;
  gate3Status?: string;
  materialType?: string;
  onJointClick?: (id: string, name: string, status: 'nominal' | 'anomaly', event: any) => void;
  clamping?: number;
  frequency?: number;
  clearance?: number;
  coolingRate?: number;
  isInteractive?: boolean;
}

export const EvChassisModel: React.FC<EvChassisModelProps> = ({
  activeStation = 0,
  hasFailed = false,
  failStation = 0,
  gate1Status = 'nominal',
  gate2Status = 'nominal',
  gate3Status = 'nominal',
  materialType = 'steel',
  onJointClick,
  clamping = 15.0,
  frequency = 420,
  clearance = 12.0,
  coolingRate = 18.0,
  isInteractive = true
}) => {
  const isStampingFail = gate1Status === 'microcrack_detected' && materialType !== 'mmc';
  const isWeldingFail = gate2Status === 'cold_weld_detected';
  const isMarriageFail = gate3Status === 'uneven_load_detected';

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const getRoofHeight = React.useCallback((x: number) => {
    if (x < -2.3) return 0.35;
    if (x < -1.3) return 0.35 + ((x - (-2.3)) / 1.0) * (0.52 - 0.35);
    if (x < -0.15) return 0.52 + ((x - (-1.3)) / 1.15) * (1.35 - 0.52);
    if (x < 0.75) return 1.35;
    if (x < 1.65) return 1.35 - ((x - 0.75) / 0.9) * (1.35 - 0.85);
    if (x < 2.2) return 0.85 - ((x - 1.65) / 0.55) * (0.85 - 0.45);
    return 0.35;
  }, []);

  // Silence TS6133 unused warnings
  void activeStation;
  void hasFailed;
  void failStation;

  // Anomaly reactivity colors
  const sillColor = isStampingFail ? '#FF2A6D' : '#C87D55';
  const subframeColor = isWeldingFail ? '#FF2A6D' : '#C87D55';
  const boltsColor = isMarriageFail ? '#FF2A6D' : '#CFD8DC';

  // Instantiate the spiral curve path
  const helixPath = React.useMemo(() => new HelixCurve(0.025, 0.12, 5), []);

  // STEP 0: FEA STRESS SHADER MATERIALS DEFINITION
  const fragmentShaderSource = React.useMemo(() => `
    varying vec3 vPosition;
    void main() {
      float stress = 0.0;
      
      // 1. B-pillar stress (high stress concentrated at B-pillar: local X = -0.3)
      float distToBPillar = abs(vPosition.x - (-0.3));
      if (distToBPillar < 0.22) {
        float factor = (0.22 - distToBPillar) / 0.22;
        stress = max(stress, factor * 0.95);
      }
      
      // 2. A-pillar stress (sloped line from [1.65, 0.85] to [0.75, 1.35])
      vec2 p = vPosition.xy;
      vec2 a = vec2(1.65, 0.85);
      vec2 b = vec2(0.75, 1.35);
      vec2 ba = b - a;
      float t = clamp(dot(p - a, ba) / dot(ba, ba), 0.0, 1.0);
      float distToAPillar = length(p - (a + ba * t));
      if (distToAPillar < 0.20) {
        float factor = (0.20 - distToAPillar) / 0.20;
        float apillarStress = factor * (1.0 - t * 0.85);
        stress = max(stress, apillarStress);
      }
      
      // 3. Side sill stress (Y around 0.35, X from -0.9 to 0.9)
      float distToSill = abs(vPosition.y - 0.35);
      if (distToSill < 0.12 && abs(vPosition.x) < 1.0) {
        float factor = (0.12 - distToSill) / 0.12;
        float sillStress = factor * 0.35;
        if (abs(vPosition.x - (-0.3)) < 0.4) {
          sillStress = factor * 0.75;
        }
        stress = max(stress, sillStress);
      }
      
      stress = clamp(stress, 0.0, 1.0);
      
      // Color mapping matching prompt specifications:
      vec3 color;
      if (stress < 0.25) {
        // Base Stress (Low): Bright cyan/teal lines along bumper and hood
        color = vec3(0.0, 0.94, 1.0);
      } else if (stress < 0.55) {
        // Transition Stress (Medium): Cyan to bright green / yellow at lower A-pillar
        float m = (stress - 0.25) / 0.30;
        color = mix(vec3(0.0, 0.94, 1.0), vec3(0.1, 0.95, 0.2), m);
      } else if (stress < 0.80) {
        // Medium-High transition
        float m = (stress - 0.55) / 0.25;
        color = mix(vec3(0.1, 0.95, 0.2), vec3(1.0, 0.65, 0.0), m);
      } else {
        // Critical Stress (High): Intense red/orange glowing bands explicitly at lower A-pillar and B-pillar
        float m = (stress - 0.80) / 0.20;
        color = mix(vec3(1.0, 0.65, 0.0), vec3(1.0, 0.1, 0.2), m);
      }
      
      gl_FragColor = vec4(color, 0.95);
    }
  `, []);

  const transverseMaterials = React.useMemo(() => {
    return [-2.1, -1.5, -0.9, -0.3, 0.3, 0.9, 1.5, 2.1].map((xVal) => {
      const yHeight = getRoofHeight(xVal);
      const vertexShaderSource = `
        uniform vec3 uCenter;
        varying vec3 vPosition;
        void main() {
          vPosition = position + uCenter;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `;
      return {
        leftPost: new THREE.ShaderMaterial({
          uniforms: { uCenter: { value: new THREE.Vector3(xVal, (yHeight + 0.35) / 2 - 0.15, 0.525) } },
          vertexShader: vertexShaderSource,
          fragmentShader: fragmentShaderSource,
          transparent: true,
          depthWrite: false
        }),
        rightPost: new THREE.ShaderMaterial({
          uniforms: { uCenter: { value: new THREE.Vector3(xVal, (yHeight + 0.35) / 2 - 0.15, -0.545) } },
          vertexShader: vertexShaderSource,
          fragmentShader: fragmentShaderSource,
          transparent: true,
          depthWrite: false
        }),
        roofBeam: new THREE.ShaderMaterial({
          uniforms: { uCenter: { value: new THREE.Vector3(xVal, yHeight - 0.15, -0.01) } },
          vertexShader: vertexShaderSource,
          fragmentShader: fragmentShaderSource,
          transparent: true,
          depthWrite: false
        })
      };
    });
  }, [fragmentShaderSource, getRoofHeight]);

  const leftBeltlineMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uCenter: { value: new THREE.Vector3(0, 0.55 - 0.15, 0.525) } },
      vertexShader: `
        uniform vec3 uCenter;
        varying vec3 vPosition;
        void main() {
          vPosition = position + uCenter;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      depthWrite: false
    });
  }, [fragmentShaderSource]);

  const rightBeltlineMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uCenter: { value: new THREE.Vector3(0, 0.55 - 0.15, -0.545) } },
      vertexShader: `
        uniform vec3 uCenter;
        varying vec3 vPosition;
        void main() {
          vPosition = position + uCenter;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      depthWrite: false
    });
  }, [fragmentShaderSource]);

  const canopyPointsMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uCenter: { value: new THREE.Vector3(0, -0.15, -0.52) } },
      vertexShader: `
        uniform vec3 uCenter;
        varying vec3 vPosition;
        void main() {
          vPosition = position + uCenter;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 7.0 * (3.0 / -mvPosition.z);
        }
      `,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      depthWrite: false
    });
  }, [fragmentShaderSource]);

  const leftPointsMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uCenter: { value: new THREE.Vector3(0, -0.15, 0.52) } },
      vertexShader: `
        uniform vec3 uCenter;
        varying vec3 vPosition;
        void main() {
          vPosition = position + uCenter;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 7.0 * (3.0 / -mvPosition.z);
        }
      `,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      depthWrite: false
    });
  }, [fragmentShaderSource]);

  const rightPointsMaterial = React.useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uCenter: { value: new THREE.Vector3(0, -0.15, -0.54) } },
      vertexShader: `
        uniform vec3 uCenter;
        varying vec3 vPosition;
        void main() {
          vPosition = position + uCenter;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = 7.0 * (3.0 / -mvPosition.z);
        }
      `,
      fragmentShader: fragmentShaderSource,
      transparent: true,
      depthWrite: false
    });
  }, [fragmentShaderSource]);

  // STEP 1: DENSE HIGH-FIDELITY EV BATTERY ARRAY (6x4 Cell Matrix)
  const evBatteryArray = React.useMemo(() => (
    <group position={[0, -0.065, 0]}>
      {/* Base graphite core enclosure tray */}
      <mesh>
        <boxGeometry args={[1.28, 0.05, 0.82]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.85} />
        <Edges threshold={15} color="#00F0FF" />
      </mesh>
      {/* 24 Cell modules arranged in a rectangular grid */}
      {[-0.52, -0.31, -0.1, 0.1, 0.31, 0.52].map((x) => 
        [-0.3, -0.1, 0.1, 0.3].map((z) => (
          <group key={`cell-${x}-${z}`} position={[x, 0.02, z]}>
            {/* Cell casing with teal emission */}
            <mesh>
              <boxGeometry args={[0.08, 0.03, 0.08]} />
              <meshStandardMaterial 
                color="#00ffff" 
                roughness={0.15} 
                metalness={0.7} 
                emissive="#00e5ff" 
                emissiveIntensity={0.25} 
              />
            </mesh>
            {/* Brass/copper terminal top posts */}
            <mesh position={[0, 0.016, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.004, 8]} />
              <meshStandardMaterial color="#b45309" roughness={0.25} metalness={0.9} />
            </mesh>
          </group>
        ))
      )}
    </group>
  ), []);

  // STEP 2: HIGH-FIDELITY REAR DRIVE MOTOR UNIT (with cooling fins, diff, axles)
  const rearDriveMotorUnit = React.useMemo(() => (
    <group position={[-0.75, -0.06, 0]}>
      {/* Main motor cylindrical housing */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
        <Edges threshold={15} color="#00ffff" />
      </mesh>
      {/* Circular cooling fins */}
      {[-0.08, -0.04, 0.0, 0.04, 0.08].map((xOffset) => (
        <mesh key={`fin-${xOffset}`} position={[xOffset, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.095, 0.005, 8, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.15} />
        </mesh>
      ))}
      {/* Axle differential gearbox casing */}
      <mesh position={[0, 0, -0.07]}>
        <sphereGeometry args={[0.075, 16, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* High-fidelity drive axles */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.94, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.95} />
      </mesh>
    </group>
  ), []);

  void sillColor;
  void boltsColor;
  void transverseMaterials;
  void rightBeltlineMaterial;
  void leftPointsMaterial;
  void rightPointsMaterial;

  return (
    <group>
      {/* 1. FRONT SUBFRAME & HELICAL SUSPENSION */}
      <group>
        {/* Front Subframe Cradle Casting */}
        <group position={[0.7, -0.05, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.22, 12]} />
            <meshStandardMaterial color={subframeColor} metalness={0.88} roughness={0.22} />
            <Edges threshold={15} color={isWeldingFail ? '#FF2A6D' : '#C87D55'} />
          </mesh>
          <mesh position={[-0.08, 0, 0.15]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
            <meshStandardMaterial color={subframeColor} metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[-0.08, 0, -0.15]} rotation={[-0.4, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
            <meshStandardMaterial color={subframeColor} metalness={0.88} roughness={0.22} />
          </mesh>
        </group>

        {/* Rear Subframe Cradle Casting */}
        <group position={[-0.7, -0.05, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 0.24, 12]} />
            <meshStandardMaterial color={subframeColor} metalness={0.88} roughness={0.22} />
            <Edges threshold={15} color={isWeldingFail ? '#FF2A6D' : '#C87D55'} />
          </mesh>
          <mesh position={[0.08, 0, 0.16]} rotation={[0.4, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
            <meshStandardMaterial color={subframeColor} metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[0.08, 0, -0.16]} rotation={[-0.4, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.3, 8]} />
            <meshStandardMaterial color={subframeColor} metalness={0.88} roughness={0.22} />
          </mesh>
        </group>

        {/* Helical Springs behind front wheels */}
        {[-0.9, 0.9].map((x) => 
          [-0.46, 0.46].map((z) => (
            <group key={`spring-${x}-${z}`} position={[x, -0.05, z]}>
              <mesh position={[0, 0.05, 0]}>
                <cylinderGeometry args={[0.012, 0.012, 0.18, 12]} />
                <meshStandardMaterial color="#B0BEC5" metalness={0.8} />
              </mesh>
              <mesh position={[0, -0.02, 0]}>
                <tubeGeometry args={[helixPath, 64, 0.005, 8, false]} />
                <meshStandardMaterial color="#FF6D00" metalness={0.6} roughness={0.2} />
              </mesh>
              <mesh position={[-x * 0.08, -0.1, -z * 0.12]} rotation={[0.4, 0, x > 0 ? 0.3 : -0.3]}>
                <cylinderGeometry args={[0.01, 0.01, 0.2, 8]} />
                <meshStandardMaterial color="#78909C" metalness={0.9} />
              </mesh>
            </group>
          ))
        )}
      </group>

      {/* 2. DETAILED EV BATTERY MATRIX & DRIVE MOTOR */}
      {evBatteryArray}
      {rearDriveMotorUnit}

      {/* Orange high-voltage spine cabling */}
      <group>
        <mesh position={[0.42, -0.03, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
          <meshStandardMaterial color="#FF6D00" emissive="#FF3D00" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[-0.42, -0.03, -0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
          <meshStandardMaterial color="#FF6D00" emissive="#FF3D00" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* 3. HIGH-FIDELITY GLTF SUV LAYERED REPRESENTATION */}
      <React.Suspense fallback={
        <group>
          {/* Fallback translucent cage box to maintain offline compatibility */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[3.8, 1.2, 1.4]} />
            <meshPhysicalMaterial transparent opacity={0.12} color="#475569" depthWrite={false} />
            <Edges threshold={15} color="#00ffff" />
          </mesh>
        </group>
      }>
        <HighFidelitySUV 
          wireMaterial={leftBeltlineMaterial} 
          pointsMaterial={canopyPointsMaterial} 
        />
      </React.Suspense>

      {/* 4. 3D HTML SPATIAL ANCHOR LABELS (Sleek Black Pill Tags with Glowing Cyan Borders) */}
      <group>
        {/* Label 1: EV BATTERY ARRAY */}
        <Html position={[0.0, 0.05, 0.0]} center distanceFactor={2.5}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              background: '#0c0f17',
              border: '1.5px solid #00f0ff',
              borderRadius: '12px',
              padding: '3px 10px',
              fontSize: '8px',
              fontWeight: 'bold',
              color: '#00f0ff',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.08em',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
            }}>
              EV BATTERY ARRAY
            </div>
            <div style={{ width: '1px', height: '14px', background: 'rgba(0, 240, 255, 0.6)' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 6px #00F0FF' }} />
          </div>
        </Html>

        {/* Label 2: EV BATTERY */}
        <Html position={[0.35, -0.05, 0.42]} center distanceFactor={2.5}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              background: '#0c0f17',
              border: '1.5px solid #00f0ff',
              borderRadius: '12px',
              padding: '3px 10px',
              fontSize: '8px',
              fontWeight: 'bold',
              color: '#00f0ff',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.08em',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
            }}>
              EV BATTERY
            </div>
            <div style={{ width: '1px', height: '18px', background: 'rgba(0, 240, 255, 0.6)' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 6px #00F0FF' }} />
          </div>
        </Html>

        {/* Label 3: EV MOTOR */}
        <Html position={[-0.7, 0.15, 0.0]} center distanceFactor={2.5}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              background: '#0c0f17',
              border: '1.5px solid #00f0ff',
              borderRadius: '12px',
              padding: '3px 10px',
              fontSize: '8px',
              fontWeight: 'bold',
              color: '#00f0ff',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.08em',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
            }}>
              EV MOTOR
            </div>
            <div style={{ width: '1px', height: '22px', background: 'rgba(0, 240, 255, 0.6)' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 6px #00F0FF' }} />
          </div>
        </Html>

        {/* Label 4: DRIVE MOTOR */}
        <Html position={[-0.75, -0.02, -0.15]} center distanceFactor={2.5}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{
              background: '#0c0f17',
              border: '1.5px solid #00f0ff',
              borderRadius: '12px',
              padding: '3px 10px',
              fontSize: '8px',
              fontWeight: 'bold',
              color: '#00f0ff',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
              letterSpacing: '0.08em',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.4)'
            }}>
              DRIVE MOTOR
            </div>
            <div style={{ width: '1px', height: '22px', background: 'rgba(0, 240, 255, 0.6)' }} />
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#00F0FF', boxShadow: '0 0 6px #00F0FF' }} />
          </div>
        </Html>
      </group>

      {/* 5. HOTSPOTS INTERACTIVE WRAPPER */}
      {isInteractive && (
        <group>
          {/* Hotspot 1: Front Pillar (ST1) */}
          <group position={[0.55, 0.16, 0.35]}>
            <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.12, 32]} />
              <meshBasicMaterial color={isStampingFail ? '#FF2A6D' : '#00F0FF'} side={THREE.DoubleSide} transparent opacity={0.4} wireframe />
            </mesh>
            <mesh 
              onPointerOver={() => setHoveredNode('stamping')}
              onPointerOut={() => setHoveredNode(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (onJointClick) onJointClick('joint_stamping', 'Front Pillar', isStampingFail ? 'anomaly' : 'nominal', e);
              }}
              scale={[0.06, 0.06, 0.06]}
            >
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial 
                color={isStampingFail ? '#FF2A6D' : '#00F0FF'} 
                emissive={isStampingFail ? '#FF2A6D' : '#00F0FF'}
                emissiveIntensity={1.5}
              />
              
              {(hoveredNode === 'stamping') && (
                <Html distanceFactor={4} position={[0, 1.0, 0]}>
                  <div style={{
                    background: 'rgba(8, 11, 17, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: `1.5px solid ${isStampingFail ? '#FF2A6D' : '#00F0FF'}`,
                    boxShadow: `0 0 10px ${isStampingFail ? '#FF2A6D44' : '#00F0FF44'}`,
                    borderRadius: '6px',
                    padding: '8px 10px',
                    width: '185px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', color: isStampingFail ? '#FF2A6D' : '#00F0FF' }}>
                      Front Pillar Node (ST1)
                    </div>
                    <div>MPU6050 Frequency: {frequency.toFixed(0)} Hz</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>AI SCAN:</span>
                      <span style={{ fontWeight: 'bold', color: isStampingFail ? '#FF2A6D' : '#10b981' }}>
                        {isStampingFail ? 'FISSURE WARNING' : 'NOMINAL'}
                      </span>
                    </div>
                  </div>
                </Html>
              )}
            </mesh>
          </group>

          {/* Hotspot 2: Rear Axle (ST2) */}
          <group position={[-0.7, 0.12, -0.22]}>
            <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.12, 32]} />
              <meshBasicMaterial color={isWeldingFail ? '#FF2A6D' : '#00F0FF'} side={THREE.DoubleSide} transparent opacity={0.4} wireframe />
            </mesh>
            <mesh 
              onPointerOver={() => setHoveredNode('welding')}
              onPointerOut={() => setHoveredNode(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (onJointClick) onJointClick('joint_welding', 'Rear Axle Subframe Weld', isWeldingFail ? 'anomaly' : 'nominal', e);
              }}
              scale={[0.06, 0.06, 0.06]}
            >
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial 
                color={isWeldingFail ? '#FF2A6D' : '#00F0FF'} 
                emissive={isWeldingFail ? '#FF2A6D' : '#00F0FF'}
                emissiveIntensity={1.5}
              />
              
              {(hoveredNode === 'welding') && (
                <Html distanceFactor={4} position={[0, 1.0, 0]}>
                  <div style={{
                    background: 'rgba(8, 11, 17, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: `1.5px solid ${isWeldingFail ? '#FF2A6D' : '#00F0FF'}`,
                    boxShadow: `0 0 10px ${isWeldingFail ? '#FF2A6D44' : '#00F0FF44'}`,
                    borderRadius: '6px',
                    padding: '8px 10px',
                    width: '185px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', color: isWeldingFail ? '#FF2A6D' : '#00F0FF' }}>
                      Rear Axle Weld Seam (ST2)
                    </div>
                    <div>Alignment Gap: {clearance.toFixed(1)} mm</div>
                    <div>Cooling Rate: {coolingRate.toFixed(1)} °C/s</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>AI SCAN:</span>
                      <span style={{ fontWeight: 'bold', color: isWeldingFail ? '#FF2A6D' : '#10b981' }}>
                        {isWeldingFail ? 'COLD WELD VOID' : 'NOMINAL'}
                      </span>
                    </div>
                  </div>
                </Html>
              )}
            </mesh>
          </group>

          {/* Hotspot 3: Battery Core (ST3) */}
          <group position={[0.0, 0.12, 0.0]}>
            <mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.12, 32]} />
              <meshBasicMaterial color={isMarriageFail ? '#FF2A6D' : '#00F0FF'} side={THREE.DoubleSide} transparent opacity={0.4} wireframe />
            </mesh>
            <mesh 
              onPointerOver={() => setHoveredNode('marriage')}
              onPointerOut={() => setHoveredNode(null)}
              onClick={(e) => {
                e.stopPropagation();
                if (onJointClick) onJointClick('joint_marriage', 'Battery Core Lock Mount', isMarriageFail ? 'anomaly' : 'nominal', e);
              }}
              scale={[0.06, 0.06, 0.06]}
            >
              <sphereGeometry args={[1, 16, 16]} />
              <meshStandardMaterial 
                color={isMarriageFail ? '#FF2A6D' : '#00F0FF'} 
                emissive={isMarriageFail ? '#FF2A6D' : '#00F0FF'}
                emissiveIntensity={1.5}
              />
              
              {(hoveredNode === 'marriage') && (
                <Html distanceFactor={4} position={[0, 1.0, 0]}>
                  <div style={{
                    background: 'rgba(8, 11, 17, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: `1.5px solid ${isMarriageFail ? '#FF2A6D' : '#00F0FF'}`,
                    boxShadow: `0 0 10px ${isMarriageFail ? '#FF2A6D44' : '#00F0FF44'}`,
                    borderRadius: '6px',
                    padding: '8px 10px',
                    width: '185px',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '8px',
                    pointerEvents: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px', color: isMarriageFail ? '#FF2A6D' : '#00F0FF' }}>
                      Battery Core Lock Mount (ST3)
                    </div>
                    <div>Clamping Tension: {clamping.toFixed(1)} kN</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>AI SCAN:</span>
                      <span style={{ fontWeight: 'bold', color: isMarriageFail ? '#FF2A6D' : '#10b981' }}>
                        {isMarriageFail ? 'FASTEN FAIL' : 'NOMINAL'}
                      </span>
                    </div>
                  </div>
                </Html>
              )}
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
};
