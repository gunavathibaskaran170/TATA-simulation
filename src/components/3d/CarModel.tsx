import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import type { VehicleComponent, Sensor, VehicleStructure } from '../../App';

interface CarModelProps {
  onJointClick?: (joint: { id: string; name: string; status: 'nominal' | 'anomaly'; event: any }) => void;
  activeTab: 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc';
  vehicleStructure: VehicleStructure;
  placedSensors: Sensor[];
  setPlacedSensors: React.Dispatch<React.SetStateAction<Sensor[]>>;
  components: VehicleComponent[];
  setComponents: React.Dispatch<React.SetStateAction<VehicleComponent[]>>;
  activePlacingSensor: string | null;
  setActivePlacingSensor: (type: string | null) => void;
  activePlacingComponent: string | null;
  setActivePlacingComponent: (type: string | null) => void;
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  selectedSensorId: string | null;
  setSelectedSensorId: (id: string | null) => void;
  simulating: boolean;
  timelineVal: number;
  ghostPos: [number, number, number] | null;
  setGhostPos: (pos: [number, number, number] | null) => void;
  ghostComp: string | null;
  setGhostComp: (comp: string | null) => void;
  viewMode: 'realistic' | 'structural' | 'exploded';
  transformMode: 'translate' | 'rotate' | 'scale';
  addConsoleLog: (text: string, type?: 'info' | 'warning' | 'system') => void;
  driveProfile?: 'static' | 'braking' | 'acceleration' | 'slalom' | 'pothole' | 'side_impact';
  viewTheme: 'engineering' | 'realistic' | 'study';
  colorMode: 'dark' | 'light';

  // Custom visual overlay states
  stampingStrike: boolean;
  weldInspect: boolean;
  ultrasonicPulse: boolean;
  boltTensions: number[];
  selectedBolt: number | null;
  setSelectedBolt: (index: number | null) => void;
  materialType: 'steel' | 'aluminum' | 'mmc';
  mmcConcentration: number;
  sillThickness: number;
  gate1Status: 'nominal' | 'microcrack_detected';
  gate2Status: 'nominal' | 'cold_weld_detected';
  gate3Status: 'nominal' | 'uneven_load_detected';
  visibleLayers?: { spaceframe: boolean; body: boolean; battery: boolean; powertrain: boolean; interior: boolean; };
  dismantleFactor?: number;
}

const componentStaticData: Record<string, {
  name: string;
  baseWeight: number;
  baseStress: number;
  desc: string;
}> = {
  leftRail: { name: '🛤️ Left Longitudinal Rail', baseWeight: 35.4, baseStress: 120, desc: 'Primary left chassis load-bearing rail.' },
  rightRail: { name: '🛤️ Right Longitudinal Rail', baseWeight: 35.4, baseStress: 120, desc: 'Primary right chassis load-bearing rail.' },
  frontCrossMember: { name: '🔗 Front Cross Member', baseWeight: 10.5, baseStress: 85, desc: 'Front bumper structural support member.' },
  midCrossMember: { name: '🔗 Middle Cross Member', baseWeight: 14.2, baseStress: 105, desc: 'Sub-assembly battery tray support member.' },
  rearCrossMember: { name: '🔗 Rear Cross Member', baseWeight: 9.8, baseStress: 75, desc: 'Rear chassis frame support link.' },
  batteryBox: { name: '🔋 Battery Pack Enclosure', baseWeight: 40.0, baseStress: 55, desc: 'Structural containment box for battery modules.' },
  edgeController: { name: '🧠 Edge AI Controller (ECU)', baseWeight: 1.8, baseStress: 10, desc: 'Core Edge AI Embedded ECU.' },
  batteryModules: { name: '⚡ HV Lithium Modules', baseWeight: 180.0, baseStress: 30, desc: 'Lithium battery energy storage cells.' },
  frontMotor: { name: '⚙️ Front Motor & Inverter', baseWeight: 65.0, baseStress: 90, desc: 'Front electric drive motor & inverter unit.' },
  rearMotor: { name: '⚙️ Rear High-Torque Motor', baseWeight: 85.0, baseStress: 100, desc: 'Rear electric traction motor assembly.' },
  frontAxle: { name: '🔩 Front Axle Shaft', baseWeight: 15.0, baseStress: 110, desc: 'Front axle hub linkage.' },
  rearAxle: { name: '🔩 Rear Axle Shaft', baseWeight: 19.5, baseStress: 140, desc: 'Rear drive axles.' },
  frontLeftWheel: { name: '🛞 Front Left Wheel', baseWeight: 16.0, baseStress: 40, desc: 'EV low-rolling resistance tire and alloy rim.' },
  frontRightWheel: { name: '🛞 Front Right Wheel', baseWeight: 16.0, baseStress: 40, desc: 'EV low-rolling resistance tire and alloy rim.' },
  rearLeftWheel: { name: '🛞 Rear Left Wheel', baseWeight: 16.0, baseStress: 40, desc: 'EV low-rolling resistance tire and alloy rim.' },
  rearRightWheel: { name: '🛞 Rear Right Wheel', baseWeight: 16.0, baseStress: 40, desc: 'EV low-rolling resistance tire and alloy rim.' },
  steeringRack: { name: '🏎️ Steering Assembly & Column', baseWeight: 12.0, baseStress: 65, desc: 'R&D steering gear column assembly.' },
  brakeSystem: { name: '🛑 Ventilated Brake System', baseWeight: 18.0, baseStress: 80, desc: 'Brake discs & calipers hydraulic circuit.' },
  cabinSeats: { name: '💺 R&D Lightweight Seats', baseWeight: 22.0, baseStress: 15, desc: 'Dual carbon fiber lightweight seats.' },
  dashboard: { name: '🖥️ R&D Dash & Instrument Cluster', baseWeight: 15.0, baseStress: 20, desc: 'Cockpit instruments panel console.' },
  cabinDoors: { name: '🚪 Reinforced Side Doors', baseWeight: 35.0, baseStress: 25, desc: 'Left & right steel reinforced doors.' },
  hood: { name: '🚘 Front Ventilated Hood', baseWeight: 8.5, baseStress: 12, desc: 'Aerodynamic hood shell cover.' },
  roof: { name: '🏠 Panoramic Carbon Roof Panel', baseWeight: 14.0, baseStress: 15, desc: 'Panels roof structural containment.' },
  bumpers: { name: '🛡️ Impact Absorbing Bumpers', baseWeight: 18.0, baseStress: 50, desc: 'Front and rear collision mitigation beams.' }
};

const materialSpecs: Record<string, {
  name: string;
  yieldStrength: number;
  elasticModulus: number;
  density: number;
  costFactor: number;
  weightFactor: number;
}> = {
  steel: { name: 'Steel AISI 4130', yieldStrength: 460, elasticModulus: 205, density: 7850, costFactor: 1.0, weightFactor: 1.0 },
  aluminum: { name: 'Aluminum 6061-T6', yieldStrength: 276, elasticModulus: 68.9, density: 2700, costFactor: 2.1, weightFactor: 0.35 },
  carbon: { name: 'Carbon Fiber CFRP', yieldStrength: 600, elasticModulus: 150, density: 1600, costFactor: 5.5, weightFactor: 0.20 },
  titanium: { name: 'Titanium Grade 5', yieldStrength: 880, elasticModulus: 113.8, density: 4430, costFactor: 6.8, weightFactor: 0.56 },
  lithium: { name: 'Lithium Assembly', yieldStrength: 200, elasticModulus: 50, density: 2200, costFactor: 8.5, weightFactor: 0.60 },
  mmc: { name: 'Al-SiCp MMC (10% SiC)', yieldStrength: 480, elasticModulus: 98.5, density: 2850, costFactor: 4.2, weightFactor: 0.30 }
};

const sensorSpecs: Record<string, { name: string; snPrefix: string; desc: string }> = {
  LoadCell: { name: 'Industrial Load Cell', snPrefix: 'LC-TM-', desc: 'Compression force transducer' },
  StrainGauge: { name: 'Foil Strain Gauge', snPrefix: 'SG-TM-', desc: 'Micro-strain foil grid sensor' },
  IMU: { name: 'Automotive IMU', snPrefix: 'IMU-TM-', desc: '6-DOF gyroscopic module' },
  Accelerometer: { name: 'MEMS Accelerometer', snPrefix: 'ACC-TM-', desc: 'High-G vibration sensor' },
  TemperatureSensor: { name: 'RTD Probe', snPrefix: 'TMP-TM-', desc: 'Automotive temperature probe' },
  VibrationSensor: { name: 'Resonance sensor', snPrefix: 'VIB-TM-', desc: 'Industrial vibration sensor' },
  PressureSensor: { name: 'Pressure Transducer', snPrefix: 'PRS-TM-', desc: 'Brake fluid pressure transmitter' }
};

const getMaterialProps = (materialId: string) => {
  switch (materialId) {
    case 'aluminum':
      return { color: '#cbd5e1', metalness: 0.9, roughness: 0.15 };
    case 'carbon':
      return { color: '#1e293b', metalness: 0.2, roughness: 0.6 };
    case 'titanium':
      return { color: '#94a3b8', metalness: 0.9, roughness: 0.15 };
    case 'lithium':
      return { color: '#14b8a6', metalness: 0.4, roughness: 0.4 };
    case 'mmc':
      return { color: '#10b981', metalness: 0.95, roughness: 0.25 }; // Green-silver metallic
    case 'steel':
    default:
      return { color: '#475569', metalness: 0.8, roughness: 0.35 };
  }
};

const getStressColor = (component: VehicleComponent, vehicleStructure: VehicleStructure, simulating: boolean, driveProfile: string) => {
  const baseStresses: Record<string, number> = {
    leftRail: 120, rightRail: 120, frontCrossMember: 85, midCrossMember: 105, rearCrossMember: 75,
    batteryBox: 55, suspensionArm: 110, Axle: 120, wheel: 40
  };

  const baseStress = baseStresses[component.type] || 60;
  const thicknessFactor = vehicleStructure.chassisThickness / 0.04;
  const wheelbaseFactor = vehicleStructure.wheelbase / 2.8;
  
  let profileModifier = 1.0;
  if (simulating) {
    if (driveProfile === 'braking' && (component.id.includes('front') || component.id === 'frontCrossMember')) {
      profileModifier = 1.6;
    } else if (driveProfile === 'acceleration' && (component.id.includes('rear') || component.id === 'rearCrossMember')) {
      profileModifier = 1.5;
    } else if (driveProfile === 'slalom') {
      const isLeft = component.id.includes('left') || component.id === 'leftRail';
      profileModifier = 1.0 + Math.sin(Date.now() / 200) * (isLeft ? 0.5 : -0.5);
    }
  }

  let stress = (baseStress + component.appliedLoad * 24.5) * wheelbaseFactor / (thicknessFactor * thicknessFactor);
  stress *= profileModifier;

  if (simulating) {
    stress *= (1.0 + Math.sin(Date.now() / 150) * 0.08);
  }

  const factor = Math.min(1.0, Math.max(0.0, (stress - 40) / 260));
  const c = new THREE.Color();
  if (factor < 0.3) {
    c.lerpColors(new THREE.Color('#00f0ff'), new THREE.Color('#10b981'), factor / 0.3);
  } else if (factor < 0.65) {
    c.lerpColors(new THREE.Color('#10b981'), new THREE.Color('#fb923c'), (factor - 0.3) / 0.35);
  } else {
    c.lerpColors(new THREE.Color('#fb923c'), new THREE.Color('#f43f5e'), (factor - 0.65) / 0.35);
  }
  
  return '#' + c.getHexString();
};

export const CarModel: React.FC<CarModelProps> = ({
  onJointClick,
  activeTab,
  vehicleStructure,
  placedSensors,
  setPlacedSensors,
  components,
  setComponents,
  activePlacingSensor,
  setActivePlacingSensor,
  activePlacingComponent,
  setActivePlacingComponent,
  selectedComponentId,
  setSelectedComponentId,
  selectedSensorId,
  setSelectedSensorId,
  simulating,
  timelineVal,
  ghostPos,
  setGhostPos,
  setGhostComp,
  viewMode,
  transformMode,
  addConsoleLog,
  driveProfile = 'static',
  viewTheme,
  colorMode,
  
  // Custom states
  stampingStrike,
  weldInspect,
  ultrasonicPulse,
  boltTensions,
  selectedBolt,
  setSelectedBolt,
  materialType,
  gate1Status,
  gate2Status,
  gate3Status,
  visibleLayers = { spaceframe: true, body: true, battery: true, powertrain: true, interior: true },
  dismantleFactor = 0.0
}) => {
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);

  const wb = vehicleStructure.wheelbase;
  const bt = vehicleStructure.chassisThickness;
  const railZ = vehicleStructure.batteryScaleX / 2 + 0.08 + bt;

  // Animated view mode values
  const opacityVal = useRef(0.08);
  const explosionVal = useRef(0.0);

  useFrame(() => {
    // Lerp opacity based on viewTheme
    let targetOpacity = 0.04;
    if (viewTheme === 'realistic') {
      targetOpacity = 1.0;
    } else if (viewTheme === 'study') {
      targetOpacity = 0.0;
    } else if (viewTheme === 'engineering') {
      targetOpacity = colorMode === 'light' ? 0.05 : 0.06;
    }
    opacityVal.current = THREE.MathUtils.lerp(opacityVal.current, targetOpacity, 0.08);

    // Lerp explosion displacement factor
    const targetExplosion = activeTab === 'twin' ? dismantleFactor : (viewMode === 'exploded' ? 1.0 : 0.0);
    explosionVal.current = THREE.MathUtils.lerp(explosionVal.current, targetExplosion, 0.08);
  });

  const handleComponentChange = (id: string, updates: Partial<VehicleComponent>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...updates, manuallyMoved: true } : c));
  };

  // Calculate dynamic deflection at coordinate X
  const getDeflection = (x: number) => {
    const normalizedX = (2 * x) / vehicleStructure.wheelbase;
    const shape = Math.max(0, 1 - normalizedX * normalizedX);
    
    const batteryComponent = components.find(c => c.id === 'batteryBox');
    const load = batteryComponent ? batteryComponent.appliedLoad : 3.5;
    const staticOffset = - (load * 0.008) * shape;
    
    let dynamicVibe = 0;
    if (simulating) {
      const frequency = driveProfile === 'slalom' ? 180 : 100;
      dynamicVibe = Math.sin((Date.now() / frequency) + x * 2.5) * 0.003 * (1.0 + load * 0.1);
    } else {
      dynamicVibe = Math.sin((timelineVal / 100) * Math.PI * 2) * 0.003 * (1.0 + load * 0.1);
    }
    
    return (staticOffset + dynamicVibe) * shape;
  };

  // Snapping logic on pointer hover/move
  const handlePointerMove = (e: any, compId: string) => {
    if (activePlacingSensor || activePlacingComponent) {
      e.stopPropagation();
      let snapPos = [e.point.x, e.point.y, e.point.z] as [number, number, number];
      
      if (activePlacingComponent) {
        // Snap components onto grid
        snapPos[0] = Math.round(e.point.x / 0.1) * 0.1;
        snapPos[1] = Math.round(e.point.y / 0.05) * 0.05;
        snapPos[2] = Math.round(e.point.z / 0.1) * 0.1;
      }
      
      setGhostPos(snapPos);
      setGhostComp(compId);
    }
  };

  const handlePointerOver = (e: any, compId: string) => {
    e.stopPropagation();
    if (!activePlacingSensor && !activePlacingComponent) {
      setHoveredComponentId(compId);
    }
  };

  const handlePointerOut = () => {
    setHoveredComponentId(null);
  };

  // Add placed objects
  const handlePlacementClick = (e: any, compId: string) => {
    e.stopPropagation();
    if (activePlacingSensor) {
      const sensorType = activePlacingSensor;
      const spec = sensorSpecs[sensorType] || { name: sensorType, snPrefix: 'SN-' };
      const sensorName = `${sensorType.replace(/([A-Z])/g, ' $1').trim()} ${placedSensors.length + 1}`;
      const serialNumber = `${spec.snPrefix}${Math.floor(1000 + Math.random() * 9000)}`;
      
      const newSensor: Sensor = {
        id: `SN-${Date.now().toString().slice(-4)}`,
        type: sensorType,
        name: sensorName,
        position: ghostPos || [e.point.x, e.point.y, e.point.z],
        parentComponent: compId,
        samplingRate: 200,
        threshold: sensorType === 'TemperatureSensor' ? 75.0 : sensorType === 'LoadCell' ? 25.0 : 4.5,
        status: 'normal',
        liveValue: 0.0
      };

      setPlacedSensors(prev => [...prev, newSensor]);
      addConsoleLog(`Sensor node "${newSensor.name}" (${serialNumber}) mounted on ${compId.replace(/([A-Z])/g, ' $1').trim()}.`, 'info');
      setActivePlacingSensor(null);
      setGhostPos(null);
      setGhostComp(null);
    } else if (activePlacingComponent) {
      const compType = activePlacingComponent as any;
      
      // Assemble the selected catalog part
      setComponents(prev => prev.map(c => {
        if (c.type === compType && !c.assembled) {
          addConsoleLog(`Assembled ${c.name} onto chassis.`, 'info');
          return { ...c, assembled: true };
        }
        return c;
      }));
      setActivePlacingComponent(null);
      setGhostPos(null);
      setGhostComp(null);
    } else {
      setSelectedComponentId(compId);
      setSelectedSensorId(null);
    }
  };

  // Exploded view offsets
  const getExplodedPosition = (comp: VehicleComponent, expFactor: number): [number, number, number] => {
    let [x, y, z] = comp.position;
    
    // Apply dynamic vibration and chassis bending deflection to parts sitting on chassis
    if (comp.id !== 'batteryBox' && comp.type !== 'wheel' && comp.type !== 'axle') {
      y += getDeflection(x);
    }

    if (expFactor === 0) return [x, y, z];

    const downOffset = -1.2 * expFactor;
    const upOffset = 1.0 * expFactor;
    const outZOffset = 0.8 * expFactor;
    const outXOffset = 0.6 * expFactor;

    if (comp.id === 'batteryBox' || comp.id === 'batteryModules') {
      y += downOffset; // Battery slides down
    } else if (comp.id.includes('left') || comp.id.includes('Left')) {
      z += outZOffset; // Left moves out
    } else if (comp.id.includes('right') || comp.id.includes('Right')) {
      z -= outZOffset; // Right moves out
    } else if (comp.id.includes('front') || comp.id.includes('front') || comp.id === 'frontMotor') {
      x += outXOffset;
    } else if (comp.id.includes('rear') || comp.id.includes('rear') || comp.id === 'rearMotor') {
      x -= outXOffset;
    } else if (comp.id === 'hood' || comp.id === 'roof' || comp.id === 'dashboard') {
      y += upOffset;
    }

    return [x, y, z];
  };

  // 3D Cable routing path generator
  const getCablePathPoints = (sensorPos: [number, number, number], ecuPos: [number, number, number]): [number, number, number][] => {
    const [sx, sy, sz] = sensorPos;
    const [ex, ey, ez] = ecuPos;
    
    const bt = vehicleStructure.chassisThickness;
    const railZ = vehicleStructure.batteryScaleX / 2 + 0.08 + bt;
    
    const targetRailZ = sz > 0 ? railZ : -railZ;
    const railY = vehicleStructure.groundClearance;
    
    return [
      [sx, sy, sz],                     // Start at sensor
      [sx, railY, targetRailZ],          // Drop down to chassis rail
      [ex, railY, targetRailZ],          // Route along rail length to ECU X
      [ex, railY + 0.02, targetRailZ],   // Step up
      [ex, ey - 0.01, ez]                // Terminate at ECU connector
    ];
  };

  // Helper component to render individual dynamic CAD parts
  const DynamicCADPart = ({ comp }: { comp: VehicleComponent }) => {

    const isSelected = selectedComponentId === comp.id;
    const isHovered = hoveredComponentId === comp.id;
    const [partGroup, setPartGroup] = useState<THREE.Group | null>(null);

    // Assembly progress lerping
    const animProgress = useRef(comp.assembled ? 1.0 : 0.0);
    
    useFrame(() => {
      const target = comp.assembled ? 1.0 : 0.0;
      animProgress.current = THREE.MathUtils.lerp(animProgress.current, target, 0.1);

      if (simulating && comp.type === 'wheel' && partGroup) {
        const mesh = partGroup.children[0];
        if (mesh) {
          const rotationSpeed = driveProfile === 'slalom' ? 0.25 : 0.15;
          mesh.rotation.y -= rotationSpeed;
        }
      }
    });

    const isVisible = comp.assembled || (activeTab === 'stamping' && viewMode !== 'realistic');
    if (!isVisible) return null;

    // Layer visibility filter
    if (activeTab === 'twin') {
      const isSpaceframe = ['chassisRail', 'crossMember', 'suspensionArm', 'shockAbsorber', 'axle'].includes(comp.type);
      const isBody = ['doors', 'hood', 'roof', 'bumpers'].includes(comp.type);
      const isBattery = ['batteryTray', 'batteryModules'].includes(comp.type);
      const isPowertrain = ['frontMotor', 'rearMotor', 'wheel', 'steeringRack', 'brakeSystem', 'ecu'].includes(comp.type);
      const isInterior = ['seats', 'dashboard'].includes(comp.type);

      if (isSpaceframe && !visibleLayers.spaceframe) return null;
      if (isBody && !visibleLayers.body) return null;
      if (isBattery && !visibleLayers.battery) return null;
      if (isPowertrain && !visibleLayers.powertrain) return null;
      if (isInterior && !visibleLayers.interior) return null;
    }

    // Materials and stress mapping
    const defaultColor = comp.type === 'wheel' ? '#18181b' : '#64748b';
    const activeColor = getStressColor(comp, vehicleStructure, simulating, driveProfile);
    
    // Theme-based coloring
    let themedColor = defaultColor;
    if (viewTheme === 'engineering') {
      if (colorMode === 'dark') {
        if (simulating && (comp.type === 'chassisRail' || comp.type === 'crossMember')) {
          themedColor = activeColor;
        } else {
          switch (comp.type) {
            case 'chassisRail': themedColor = '#00ffff'; break;
            case 'crossMember': themedColor = '#ffffff'; break;
            case 'batteryTray':
            case 'batteryModules': themedColor = '#10b981'; break;
            case 'suspensionArm':
            case 'shockAbsorber': themedColor = '#fb923c'; break;
            case 'steeringRack': themedColor = '#c084fc'; break;
            case 'wheel': themedColor = '#64748b'; break;
            case 'ecu': themedColor = '#facc15'; break;
            default: themedColor = '#00ffff';
          }
        }
      } else {
        if (simulating && (comp.type === 'chassisRail' || comp.type === 'crossMember')) {
          themedColor = activeColor;
        } else {
          switch (comp.type) {
            case 'chassisRail':
            case 'crossMember': themedColor = '#334155'; break;
            case 'batteryTray':
            case 'batteryModules': themedColor = '#15803d'; break;
            case 'suspensionArm':
            case 'shockAbsorber': themedColor = '#c2410c'; break;
            case 'steeringRack': themedColor = '#1d4ed8'; break;
            case 'wheel': themedColor = '#475569'; break;
            case 'ecu': themedColor = '#0f172a'; break;
            default: themedColor = '#334155';
          }
        }
      }
    } else if (viewTheme === 'study') {
      if (simulating && (comp.type === 'chassisRail' || comp.type === 'crossMember')) {
        themedColor = activeColor;
      } else {
        themedColor = getMaterialProps(comp.material).color;
      }
    } else {
      // realistic
      themedColor = defaultColor;
    }

    let renderedColor = themedColor;
    if (isSelected) {
      renderedColor = colorMode === 'light' ? '#6d28d9' : '#c084fc';
    } else if (isHovered) {
      renderedColor = colorMode === 'light' ? '#1d4ed8' : '#00f0ff';
    }
    
    const matProps = getMaterialProps(comp.material);
    if (viewTheme !== 'realistic' || isSelected || isHovered) {
      matProps.color = renderedColor;
    }

    // Exploded View offset position
    const baseExplodedPos = getExplodedPosition(comp, explosionVal.current);
    
    // Apply assembly slide-down and scale-in animation
    const slideOffset = (1.0 - animProgress.current) * 0.0;
    const explodedPos: [number, number, number] = [
      baseExplodedPos[0],
      baseExplodedPos[1] + slideOffset,
      baseExplodedPos[2]
    ];
    
    const renderedScale: [number, number, number] = [
      comp.scale[0] * (0.2 + 0.8 * animProgress.current),
      comp.scale[1] * (0.2 + 0.8 * animProgress.current),
      comp.scale[2] * (0.2 + 0.8 * animProgress.current)
    ];

    // High fidelity R&D CAD geometry builder
    const renderGeometry = () => {
      const radius = comp.dimensions.radius || 0.04;
      const length = comp.dimensions.length || 1.0;
      const width = comp.dimensions.width || 0.8;
      const height = comp.dimensions.height || 0.15;

      const isGhost = !comp.assembled;

      const isRealistic = viewTheme === 'realistic';
      const isTwin = activeTab === 'twin';
      const materialComponent = (
        <meshStandardMaterial 
          {...matProps}
          wireframe={isGhost}
          transparent={isGhost || (!isRealistic && !isTwin)}
          opacity={isGhost ? 0.18 : (isRealistic ? 1.0 : (isTwin ? 0.9 : 0.75))}
          emissive={isTwin ? (matProps.color || '#00f0ff') : undefined}
          emissiveIntensity={isTwin ? 0.8 : 0}
        />
      );

      switch (comp.type) {
        case 'batteryTray':
          return (
            <group>
              {/* Main Box Enclosure */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[length, height, width]} />
                {materialComponent}
              </mesh>
              {/* Bottom Protective Skid Plate */}
              <mesh position={[0, -height/2 - 0.005, 0]}>
                <boxGeometry args={[length + 0.04, 0.01, width + 0.04]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} wireframe={isGhost} transparent={isGhost} opacity={isGhost ? 0.1 : 1} />
              </mesh>
              {/* Perimeter Flange Lip with bolting details */}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[length + 0.06, 0.015, width + 0.06]} />
                <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.25} wireframe={isGhost} transparent={isGhost} opacity={isGhost ? 0.1 : 0.8} />
              </mesh>

              {/* Gate 2: Weld Bead Line Heatmap Overlay */}
              {activeTab === 'welding' && (
                <group>
                  {/* Left weld flange bead line */}
                  <mesh position={[0, height / 2 + 0.008, -width / 2 - 0.005]}>
                    <boxGeometry args={[length - 0.1, 0.005, 0.015]} />
                    <meshBasicMaterial 
                      color={gate2Status === 'nominal' || materialType === 'mmc' ? '#10b981' : '#f43f5e'} 
                      transparent 
                      opacity={0.6 + Math.sin(Date.now() / 150) * 0.3} 
                    />
                  </mesh>
                  {/* Right weld flange bead line */}
                  <mesh position={[0, height / 2 + 0.008, width / 2 + 0.005]}>
                    <boxGeometry args={[length - 0.1, 0.005, 0.015]} />
                    <meshBasicMaterial 
                      color={gate2Status === 'nominal' || materialType === 'mmc' ? '#10b981' : '#f43f5e'} 
                      transparent 
                      opacity={0.6 + Math.sin(Date.now() / 150) * 0.3} 
                    />
                  </mesh>
                </group>
              )}

              {/* Gate 2: Welding Laser Sweep animation plane */}
              {weldInspect && activeTab === 'welding' && (() => {
                const pulseTime = ((Date.now() % 3000) / 3000); // 3 seconds sweep cycles
                const currentX = -length / 2 + pulseTime * length;
                if (currentX < -length / 2 || currentX > length / 2) return null;

                return (
                  <group>
                    {/* Sweeping laser line */}
                    <mesh position={[currentX, height / 2 + 0.012, 0]}>
                      <boxGeometry args={[0.015, 0.005, width + 0.08]} />
                      <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} />
                    </mesh>
                    {/* Sweeping laser volumetric plane */}
                    <mesh position={[currentX, height / 2 + 0.25, 0]}>
                      <planeGeometry args={[0.004, 0.5]} />
                      <meshBasicMaterial color="#00f0ff" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
                    </mesh>
                  </group>
                );
              })()}

              {/* Gate 3: Detailed 12-Bolt clamp-load grid */}
              {!isGhost && (() => {
                const boltSpacing = (length - 0.25) / 5;
                const boltPositions: [number, number, number][] = [];
                // Left rail mount bolts (0 to 5)
                for (let i = 0; i < 6; i++) {
                  boltPositions.push([-length/2 + 0.125 + i * boltSpacing, height / 2 + 0.01, -width/2 - 0.015]);
                }
                // Right rail mount bolts (6 to 11)
                for (let i = 0; i < 6; i++) {
                  boltPositions.push([-length/2 + 0.125 + i * boltSpacing, height / 2 + 0.01, width/2 + 0.015]);
                }

                return boltPositions.map((pos, idx) => {
                  const tension = boltTensions[idx] ?? 24.0;
                  const isLow = tension < 15.0;
                  const isSelected = selectedBolt === idx;
                  
                  // Color code bolts by status
                  let boltColor = '#cbd5e1';
                  if (activeTab === 'marriage') {
                    if (isSelected) {
                      boltColor = '#00f0ff'; // select cyan
                    } else {
                      boltColor = isLow ? '#f43f5e' : '#10b981';
                    }
                  } else if (activeTab === 'twin') {
                    boltColor = isLow ? '#f43f5e' : '#475569';
                  }

                  return (
                    <group 
                      key={idx} 
                      position={pos}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBolt(idx);
                        addConsoleLog(`Directly selected mount bolt #${idx + 1}. Measured tension clamping load: ${tension.toFixed(2)} kN.`, 'info');
                      }}
                    >
                      {/* Hex Bolt Cap */}
                      <mesh castShadow>
                        <cylinderGeometry args={[0.012, 0.012, 0.015, 6]} />
                        <meshStandardMaterial 
                          color={boltColor} 
                          metalness={0.9} 
                          roughness={0.1}
                          emissive={isSelected ? '#00f0ff' : 'none'}
                          emissiveIntensity={isSelected ? 0.6 : 0}
                        />
                      </mesh>
                      {/* Threaded stud going down through flange */}
                      <mesh position={[0, -0.02, 0]}>
                        <cylinderGeometry args={[0.007, 0.007, 0.035, 8]} />
                        <meshStandardMaterial color="#475569" metalness={0.9} />
                      </mesh>
                      {/* Invisible hover helper */}
                      <mesh visible={false}>
                        <sphereGeometry args={[0.03]} />
                      </mesh>

                      {/* Ultrasonic Pulse Ring wave animation */}
                      {ultrasonicPulse && (
                        <group position={[0, -0.01, 0]}>
                          <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[0.018, 0.0015, 8, 16]} />
                            <meshBasicMaterial color="#00f0ff" transparent opacity={0.8} />
                          </mesh>
                        </group>
                      )}
                    </group>
                  );
                });
              })()}
            </group>
          );
        
        case 'batteryModules':
          return (
            <group scale={[0.94, 0.94, 0.94]}>
              {/* Draw 8 modules in a 4x2 grid inside the pack */}
              {Array.from({ length: 4 }).map((_, xi) => 
                Array.from({ length: 2 }).map((_, zi) => {
                  const xCell = (xi - 1.5) * (length * 0.23);
                  const zCell = (zi - 0.5) * (width * 0.44);
                  return (
                    <group key={`${xi}-${zi}`} position={[xCell, 0, zCell]}>
                      {/* Module outer aluminum case */}
                      <mesh castShadow>
                        <boxGeometry args={[length * 0.19, height * 0.72, width * 0.36]} />
                        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} wireframe={isGhost} transparent={isGhost} />
                      </mesh>
                      {/* Procedural rows of small cell cans inside when visible */}
                      {!isGhost && Array.from({ length: 4 }).map((_, cx) =>
                        Array.from({ length: 3 }).map((_, cz) => {
                          const px = (cx - 1.5) * (length * 0.04);
                          const pz = (cz - 1) * (width * 0.09);
                          return (
                            <mesh key={`${cx}-${cz}`} position={[px, height * 0.37, pz]}>
                              <cylinderGeometry args={[0.01, 0.01, 0.01, 8]} />
                              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
                            </mesh>
                          );
                        })
                      )}
                      {/* Interconnecting orange copper busbars */}
                      {!isGhost && (
                        <mesh position={[0, height * 0.375, 0]}>
                          <boxGeometry args={[length * 0.14, 0.005, width * 0.28]} />
                          <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={simulating ? 0.7 : 0.1} />
                        </mesh>
                      )}
                    </group>
                  );
                })
              )}
            </group>
          );

        case 'frontMotor':
        case 'rearMotor':
          const isRear = comp.type === 'rearMotor';
          const motRad = isRear ? 0.17 : 0.13;
          const motLen = isRear ? 0.36 : 0.28;
          return (
            <group rotation={[0, 0, Math.PI / 2]}>
              {/* Main cylindrical motor housing */}
              <mesh castShadow>
                <cylinderGeometry args={[motRad, motRad, motLen, 16]} />
                {materialComponent}
              </mesh>
              {/* Radial Cooling Fins */}
              {Array.from({ length: 9 }).map((_, idx) => (
                <mesh key={idx} position={[0, (idx - 4) * (motLen / 10), 0]}>
                  <torusGeometry args={[motRad + 0.012, 0.008, 4, 20]} />
                  <meshStandardMaterial color="#475569" metalness={0.9} wireframe={isGhost} transparent={isGhost} />
                </mesh>
              ))}
              {/* Integrated Inverter Box */}
              <group position={[motRad * 0.7, 0, motRad * 0.3]} rotation={[0, -Math.PI / 2, 0]}>
                <mesh castShadow>
                  <boxGeometry args={[motLen * 0.85, motRad * 0.8, motRad * 1.15]} />
                  <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.3} wireframe={isGhost} transparent={isGhost} />
                </mesh>
                {/* HV Orange Cables out of inverter */}
                {!isGhost && (
                  <group position={[0, motRad * 0.41, 0]}>
                    <mesh position={[-0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
                      <meshStandardMaterial color="#ea580c" roughness={0.5} />
                    </mesh>
                    <mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
                      <meshStandardMaterial color="#ea580c" roughness={0.5} />
                    </mesh>
                  </group>
                )}
              </group>
            </group>
          );

        case 'steeringRack':
          return (
            <group>
              {/* Steering Rack Main Tube aligned transversely along Z-axis */}
              <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, length, 8]} />
                {materialComponent}
              </mesh>
              {/* Accordion Bellows aligned transversely on left and right ends */}
              <mesh position={[0, 0, length / 2 - 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
                <meshStandardMaterial color="#18181b" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0, -length / 2 + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
                <meshStandardMaterial color="#18181b" roughness={0.8} />
              </mesh>
              {/* Steering Shaft / Column angled at 45 degrees towards RHD driver side (Z = -0.28) */}
              <mesh position={[-0.2, 0.22, -0.28]} rotation={[0, 0, -Math.PI / 4]} castShadow>
                <cylinderGeometry args={[0.012, 0.012, 0.58, 8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} wireframe={isGhost} transparent={isGhost} />
              </mesh>
              {/* Steering Wheel tilted perpendicular to column on driver side */}
              <group position={[-0.4, 0.42, -0.28]} rotation={[0, Math.PI / 2, -Math.PI / 4]}>
                <mesh castShadow>
                  <torusGeometry args={[0.16, 0.018, 8, 24]} />
                  <meshStandardMaterial color="#18181b" roughness={0.8} wireframe={isGhost} transparent={isGhost} />
                </mesh>
                <mesh>
                  <boxGeometry args={[0.3, 0.015, 0.03]} />
                  <meshStandardMaterial color="#475569" wireframe={isGhost} transparent={isGhost} />
                </mesh>
              </group>
            </group>
          );

        case 'brakeSystem':
          const brakePositions: [number, number, number][] = [
            [wb / 2, 0, railZ + 0.08],
            [wb / 2, 0, -(railZ + 0.08)],
            [-wb / 2, 0, railZ + 0.08],
            [-wb / 2, 0, -(railZ + 0.08)]
          ];
          return (
            <group>
              {brakePositions.map((bPos, bIdx) => (
                <group key={bIdx} position={bPos} rotation={[Math.PI / 2, 0, bIdx % 2 === 0 ? 0 : Math.PI]}>
                  {/* Steel Ventilated Brake Disc (Rotor) */}
                  <mesh castShadow>
                    <cylinderGeometry args={[0.13, 0.13, 0.012, 24]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.96} roughness={0.06} wireframe={isGhost} transparent={isGhost} />
                  </mesh>
                  {/* Drilled ventilation holes on rotor */}
                  {!isGhost && Array.from({ length: 12 }).map((_, idx) => {
                    const angle = (idx / 12) * Math.PI * 2;
                    return (
                      <mesh key={idx} position={[Math.sin(angle) * 0.09, 0.007, Math.cos(angle) * 0.09]}>
                        <cylinderGeometry args={[0.003, 0.003, 0.002, 6]} />
                        <meshStandardMaterial color="#475569" metalness={0.8} />
                      </mesh>
                    );
                  })}
                  {/* Large caliper painted in golden-yellow (reference style) */}
                  <mesh position={[0.08, 0.008, 0.035]} rotation={[0, 0.4, 0]}>
                    <boxGeometry args={[0.075, 0.03, 0.09]} />
                    <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.15} wireframe={isGhost} transparent={isGhost} />
                  </mesh>
                </group>
              ))}
            </group>
          );

        case 'shockAbsorber':
          const shLength = comp.dimensions.length || 0.35;
          const shRadius = comp.dimensions.radius || 0.02;
          const springRadius = shRadius * 1.8;
          const wireRadius = shRadius * 0.25;
          const turns = 10;
          
          let compression = 1.0;
          if (simulating) {
            compression = 1.0 + Math.sin(Date.now() / 150) * 0.06;
          }

          return (
            <group>
              {/* Shock Damper Body (Lower Cylinder) */}
              <mesh position={[0, -shLength * 0.22 * compression, 0]} castShadow>
                <cylinderGeometry args={[shRadius, shRadius, shLength * 0.45, 12]} />
                <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} wireframe={isGhost} transparent={isGhost} />
              </mesh>
              {/* Damper Piston Rod (Upper Chrome Shaft) */}
              <mesh position={[0, shLength * 0.22 * compression, 0]} castShadow>
                <cylinderGeometry args={[shRadius * 0.55, shRadius * 0.55, shLength * 0.45 * compression, 12]} />
                <meshStandardMaterial color="#f8fafc" metalness={0.99} roughness={0.02} wireframe={isGhost} transparent={isGhost} />
              </mesh>
              {/* Helical Coil Spring (10 stacked torus coils that stretch/compress) */}
              <group scale={[1, compression, 1]}>
                {Array.from({ length: turns }).map((_, i) => {
                  const yOffset = (i - turns/2) * (shLength / turns);
                  return (
                    <mesh key={i} position={[0, yOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
                      <torusGeometry args={[springRadius, wireRadius, 8, 20]} />
                      <meshStandardMaterial color={isGhost ? '#64748b' : '#dc2626'} metalness={0.92} roughness={0.08} wireframe={isGhost} transparent={isGhost} />
                    </mesh>
                  );
                })}
              </group>
              {/* Spring Seats (Plates) */}
              <mesh position={[0, -shLength / 2 * compression, 0]}>
                <cylinderGeometry args={[springRadius * 1.2, springRadius * 1.2, 0.008, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.9} />
              </mesh>
              <mesh position={[0, shLength / 2 * compression, 0]}>
                <cylinderGeometry args={[springRadius * 1.2, springRadius * 1.2, 0.008, 12]} />
                <meshStandardMaterial color="#334155" metalness={0.9} />
              </mesh>
            </group>
          );

        case 'seats':
          return (
            <group>
              {/* Render two front seats (Left & Right) */}
              {[-0.28, 0.28].map((zPos, sIdx) => (
                <group key={sIdx} position={[0, 0, zPos]}>
                  {/* Seat Base Cushion */}
                  <mesh castShadow>
                    <boxGeometry args={[0.42, 0.08, 0.42]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.7} wireframe={isGhost} transparent={isGhost} />
                  </mesh>
                  {/* Side bolsters for base */}
                  {!isGhost && (
                    <group>
                      <mesh position={[0, 0.02, 0.19]}>
                        <boxGeometry args={[0.42, 0.04, 0.04]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.7} />
                      </mesh>
                      <mesh position={[0, 0.02, -0.19]}>
                        <boxGeometry args={[0.42, 0.04, 0.04]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.7} />
                      </mesh>
                    </group>
                  )}
                  {/* Backrest */}
                  <mesh position={[-0.18, 0.24, 0]} rotation={[0, 0, -Math.PI / 10]} castShadow>
                    <boxGeometry args={[0.07, 0.48, 0.42]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.7} wireframe={isGhost} transparent={isGhost} />
                  </mesh>
                  {/* Headrest on steel bars */}
                  {!isGhost && (
                    <group>
                      <mesh position={[-0.23, 0.48, -0.06]}>
                        <cylinderGeometry args={[0.005, 0.005, 0.08, 8]} />
                        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                      </mesh>
                      <mesh position={[-0.23, 0.48, 0.06]}>
                        <cylinderGeometry args={[0.005, 0.005, 0.08, 8]} />
                        <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                      </mesh>
                      <mesh position={[-0.24, 0.54, 0]} rotation={[0, 0, -Math.PI / 10]}>
                        <boxGeometry args={[0.06, 0.12, 0.22]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.7} />
                      </mesh>
                    </group>
                  )}
                </group>
              ))}
            </group>
          );

        case 'dashboard':
          return (
            <group>
              <mesh castShadow>
                <boxGeometry args={[0.15, height, width * 1.15]} />
                {materialComponent}
              </mesh>
              {!isGhost && (
                <group>
                  {/* Digital Instrument Cluster Screen directly in front of RHD driver (Z = -0.28) */}
                  <mesh position={[0.082, 0.05, -0.28]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[0.28, 0.09]} />
                    <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={1.2} roughness={0.1} />
                  </mesh>
                  {/* Central Infotainment display screen (Z = 0.0) */}
                  <mesh position={[0.082, 0.02, 0.0]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[0.26, 0.14]} />
                    <meshStandardMaterial color="#0f172a" emissive="#0369a1" emissiveIntensity={0.6} roughness={0.05} />
                  </mesh>
                </group>
              )}
            </group>
          );

        case 'doors': {
          const isLeftDoor = comp.id.includes('left') || comp.id.includes('Left') || comp.position[2] > 0;
          return (
            <group>
              {/* Lower solid metal panel */}
              <mesh castShadow receiveShadow position={[0, -height * 0.15, 0]}>
                <boxGeometry args={[length, height * 0.7, width * 0.4]} />
                {materialComponent}
              </mesh>
              {/* Window frame */}
              <mesh castShadow position={[-length * 0.45, height * 0.3, 0]}>
                <boxGeometry args={[0.03, height * 0.4, width * 0.2]} />
                {materialComponent}
              </mesh>
              <mesh castShadow position={[length * 0.45, height * 0.3, 0]}>
                <boxGeometry args={[0.03, height * 0.4, width * 0.2]} />
                {materialComponent}
              </mesh>
              <mesh castShadow position={[0, height * 0.5, 0]}>
                <boxGeometry args={[length, 0.03, width * 0.2]} />
                {materialComponent}
              </mesh>
              {/* Window glass (smoked transparent) */}
              {!isGhost && (
                <mesh position={[0, height * 0.2, 0]}>
                  <boxGeometry args={[length * 0.9, height * 0.5, width * 0.15]} />
                  <meshPhysicalMaterial 
                    color="#38bdf8" 
                    transparent 
                    opacity={0.3} 
                    transmission={0.9} 
                    roughness={0.1} 
                    ior={1.5}
                  />
                </mesh>
              )}
              {/* Door handle */}
              {!isGhost && (
                <mesh position={[0.2, -height * 0.05, isLeftDoor ? width * 0.22 : -width * 0.22]}>
                  <boxGeometry args={[0.08, 0.015, 0.015]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
                </mesh>
              )}
            </group>
          );
        }

        case 'hood':
          return (
            <group>
              {/* Main curved hood panel */}
              <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[0, 0, -0.05]}>
                <boxGeometry args={[length, 0.015, width]} />
                {materialComponent}
              </mesh>
              {/* Left/Right styling lines */}
              {!isGhost && (
                <group>
                  <mesh position={[0, 0.01, width * 0.2]} rotation={[0, 0, -0.05]}>
                    <boxGeometry args={[length * 0.9, 0.005, 0.01]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.5} />
                  </mesh>
                  <mesh position={[0, 0.01, -width * 0.2]} rotation={[0, 0, -0.05]}>
                    <boxGeometry args={[length * 0.9, 0.005, 0.01]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.5} />
                  </mesh>
                </group>
              )}
            </group>
          );

        case 'roof':
          return (
            <group>
              {/* Perimeter support frame */}
              <mesh castShadow receiveShadow position={[0, 0, 0]}>
                <boxGeometry args={[length, height, width]} />
                {materialComponent}
              </mesh>
              {/* Panoramic sunroof panel (Glass) */}
              {!isGhost && (
                <mesh position={[0, 0.005, 0]}>
                  <boxGeometry args={[length * 0.8, height * 1.1, width * 0.8]} />
                  <meshPhysicalMaterial 
                    color="#0f172a" 
                    transparent 
                    opacity={0.65} 
                    transmission={0.9} 
                    roughness={0.1}
                    ior={1.5}
                  />
                </mesh>
              )}
            </group>
          );

        case 'bumpers': {
          const isFrontBumper = comp.id.includes('front') || comp.position[0] > 0;
          return (
            <group>
              {/* Main bumper bar */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[length, height, width]} />
                {materialComponent}
              </mesh>
              {/* Bumper styling details */}
              {!isGhost && (
                <group>
                  {isFrontBumper ? (
                    <>
                      {/* Lower splitter */}
                      <mesh position={[0.03, -height * 0.6, 0]}>
                        <boxGeometry args={[0.08, 0.02, width * 1.05]} />
                        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
                      </mesh>
                      {/* Glowing white LED headlights */}
                      <mesh position={[0.012, height * 0.15, width * 0.35]}>
                        <boxGeometry args={[0.01, 0.04, 0.15]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
                      </mesh>
                      <mesh position={[0.012, height * 0.15, -width * 0.35]}>
                        <boxGeometry args={[0.01, 0.04, 0.15]} />
                        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3.0} />
                      </mesh>
                    </>
                  ) : (
                    <>
                      {/* Rear diffuser fins */}
                      <mesh position={[-0.03, -height * 0.6, 0]}>
                        <boxGeometry args={[0.08, 0.02, width]} />
                        <meshStandardMaterial color="#0f172a" />
                      </mesh>
                      {/* Glowing red LED taillight strip */}
                      <mesh position={[-0.012, height * 0.2, 0]}>
                        <boxGeometry args={[0.005, 0.02, width * 0.9]} />
                        <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={2.5} />
                      </mesh>
                    </>
                  )}
                </group>
              )}
            </group>
          );
        }

        case 'wheel': {
          const wRad = comp.dimensions.radius || 0.32;
          const wWidth = comp.dimensions.width || 0.22;
          
          return (
            <group rotation={[Math.PI / 2, 0, 0]}>
              {/* Toroidal tire (charcoal rubber #111827) */}
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[wRad, wRad, wWidth, 24]} />
                <meshStandardMaterial color="#111827" roughness={0.8} />
              </mesh>
              {/* Alloy rim face (Silver multi-spoke turbine rims) */}
              <mesh position={[0, wWidth * 0.51, 0]}>
                <cylinderGeometry args={[wRad * 0.7, wRad * 0.7, 0.01, 16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[0, -wWidth * 0.51, 0]}>
                <cylinderGeometry args={[wRad * 0.7, wRad * 0.7, 0.01, 16]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
              </mesh>
              
              {/* 12 spoke turbine alloy layout on outer side */}
              {!isGhost && Array.from({ length: 12 }).map((_, idx) => (
                <group key={idx} rotation={[0, (idx * Math.PI * 2) / 12, 0]}>
                  <mesh position={[0, wWidth * 0.52, wRad * 0.32]}>
                    <boxGeometry args={[0.015, 0.005, wRad * 0.65]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.08} />
                  </mesh>
                  <mesh position={[0, -wWidth * 0.52, wRad * 0.32]}>
                    <boxGeometry args={[0.015, 0.005, wRad * 0.65]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.08} />
                  </mesh>
                </group>
              ))}
              {/* Central hub cap */}
              <mesh position={[0, wWidth * 0.53, 0]}>
                <cylinderGeometry args={[wRad * 0.15, wRad * 0.15, 0.005, 12]} />
                <meshStandardMaterial color="#0f172a" metalness={0.7} />
              </mesh>
              <mesh position={[0, -wWidth * 0.53, 0]}>
                <cylinderGeometry args={[wRad * 0.15, wRad * 0.15, 0.005, 12]} />
                <meshStandardMaterial color="#0f172a" metalness={0.7} />
              </mesh>
            </group>
          );
        }

        case 'ecu':
          return (
            <group>
              {/* Industrial Aluminum ECU housing */}
              <mesh castShadow>
                <boxGeometry args={[0.18, height, width]} />
                <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} wireframe={isGhost} transparent={isGhost} />
              </mesh>
              {/* Heat Sink Fins on top */}
              {!isGhost && Array.from({ length: 7 }).map((_, i) => (
                <mesh key={i} position={[(i - 3) * 0.02, height * 0.58, 0]}>
                  <boxGeometry args={[0.006, 0.018, width * 0.88]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.95} />
                </mesh>
              ))}
              {/* Industrial Mounting Bracket under the ECU */}
              <mesh position={[0, -height * 0.56, 0]}>
                <boxGeometry args={[0.22, 0.006, width * 1.08]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.92} wireframe={isGhost} transparent={isGhost} />
              </mesh>
              {/* Side Port Connectors: CAN, Power, Sensor Harnesses */}
              {!isGhost && (
                <group>
                  {/* CAN Connector DB9 on front side */}
                  <mesh position={[0.091, 0, width * 0.2]}>
                    <boxGeometry args={[0.005, 0.02, 0.04]} />
                    <meshStandardMaterial color="#64748b" metalness={0.98} />
                  </mesh>
                  {/* Power Connector Plug on back side */}
                  <mesh position={[-0.091, 0, -width * 0.2]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.01, 0.01, 0.01, 8]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.5} />
                  </mesh>
                  {/* Wiring Harness Connector blocks */}
                  <mesh position={[0, 0, width * 0.505]}>
                    <boxGeometry args={[0.08, height * 0.8, 0.01]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.8} />
                  </mesh>
                  <mesh position={[0, 0, -width * 0.505]}>
                    <boxGeometry args={[0.08, height * 0.8, 0.01]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.8} />
                  </mesh>
                </group>
              )}
              {/* 3 Status LEDs on top */}
              {!isGhost && (
                <group position={[0.06, height * 0.51, width * 0.35]}>
                  {/* Green breathing led */}
                  <mesh>
                    <sphereGeometry args={[0.006, 8, 8]} />
                    <meshBasicMaterial color="#22c55e" transparent opacity={0.6 + Math.sin(Date.now() / 250) * 0.4} />
                  </mesh>
                  {/* Orange flickering CAN tx/rx led */}
                  <mesh position={[-0.016, 0, 0]}>
                    <sphereGeometry args={[0.006, 8, 8]} />
                    <meshBasicMaterial 
                      color="#f97316" 
                      transparent 
                      opacity={simulating ? (0.3 + Math.sin(Date.now() / 60) * 0.7) : 0.1} 
                    />
                  </mesh>
                  {/* Red warning alarm led */}
                  <mesh position={[-0.032, 0, 0]}>
                    <sphereGeometry args={[0.006, 8, 8]} />
                    <meshBasicMaterial 
                      color="#ef4444" 
                      transparent 
                      opacity={placedSensors.some(s => s.status === 'warning') ? (0.4 + Math.sin(Date.now() / 80) * 0.6) : 0.0} 
                    />
                  </mesh>
                </group>
              )}
            </group>
          );

        case 'suspensionArm':
          // Render a double-wishbone A-arm configuration
          const armLen = length;
          return (
            <group>
              {/* Upper Control Wishbone Arm (V-Shape cylinders) */}
              <mesh position={[0, 0.05, armLen/2]} rotation={[0.2, 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.008, 0.008, armLen * 0.8, 8]} />
                {materialComponent}
              </mesh>
              <mesh position={[0, 0.05, -armLen/2]} rotation={[-0.2, -0.6, 0]} castShadow>
                <cylinderGeometry args={[0.008, 0.008, armLen * 0.8, 8]} />
                {materialComponent}
              </mesh>
              {/* Lower Control Wishbone Arm (sturdier V-shape below) */}
              <mesh position={[0, -0.05, armLen/2]} rotation={[-0.1, 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.012, 0.012, armLen * 0.8, 8]} />
                {materialComponent}
              </mesh>
              <mesh position={[0, -0.05, -armLen/2]} rotation={[0.1, -0.6, 0]} castShadow>
                <cylinderGeometry args={[0.012, 0.012, armLen * 0.8, 8]} />
                {materialComponent}
              </mesh>
              {/* Vertical steering knuckle connecting ball joints */}
              {!isGhost && (
                <mesh position={[armLen * 0.35, 0, 0]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.16, 8]} />
                  <meshStandardMaterial color="#475569" metalness={0.92} />
                </mesh>
              )}
            </group>
          );

        case 'chassisRail':
          // Render as a realistic rectangular hollow steel tube
          return (
            <group>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[length, radius * 2, radius * 2]} />
                {materialComponent}
              </mesh>
              {/* Structural battery box mounting brackets */}
              {!isGhost && Array.from({ length: 4 }).map((_, i) => (
                <mesh key={i} position={[(i - 1.5) * (length * 0.25), 0, comp.id === 'leftRail' ? -radius : radius]}>
                  <boxGeometry args={[0.05, 0.01, 0.02]} />
                  <meshStandardMaterial color="#334155" metalness={0.9} />
                </mesh>
              ))}

              {/* Gate 1 Acoustic Resonance Spectroscopy (ARS) Concentric wave overlay */}
              {stampingStrike && activeTab === 'stamping' && (() => {
                // Approximate strike waves propagating from center of the sill
                const waveColor = gate1Status === 'nominal' || materialType === 'mmc' ? '#10b981' : '#f43f5e';
                const pulseTime = ((Date.now() % 2000) / 2000) * 2.0; // 2 seconds cycles
                
                return [0.2, 0.6, 1.0].map((delay, wIdx) => {
                  const t = (pulseTime - delay);
                  if (t < 0 || t > 1.2) return null;
                  const wRadius = t * (length / 2);
                  const wOpacity = 1.0 - (t / 1.2);
                  
                  return (
                    <group key={wIdx}>
                      <mesh position={[wRadius, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <torusGeometry args={[radius * 2.5, 0.005, 8, 20]} />
                        <meshBasicMaterial color={waveColor} transparent opacity={wOpacity} depthWrite={false} />
                      </mesh>
                      <mesh position={[-wRadius, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <torusGeometry args={[radius * 2.5, 0.005, 8, 20]} />
                        <meshBasicMaterial color={waveColor} transparent opacity={wOpacity} depthWrite={false} />
                      </mesh>
                    </group>
                  );
                });
              })()}

              {/* Gate 1 Microcrack defect plane overlay */}
              {gate1Status === 'microcrack_detected' && materialType !== 'mmc' && activeTab === 'stamping' && (
                <mesh position={[0.25, radius * 1.02, 0]} rotation={[Math.PI / 2, 0, 0.3]}>
                  <planeGeometry args={[0.08, 0.018]} />
                  <meshBasicMaterial color="#f43f5e" transparent opacity={0.6 + Math.sin(Date.now() / 90) * 0.4} />
                </mesh>
              )}

              {/* Gate 5 Silicon Carbide (SiCp) ceramic nanoparticles inside the alloy lattice */}
              {materialType === 'mmc' && (activeTab === 'mmc' || activeTab === 'stamping') && (() => {
                const particlesCount = 20;
                const seedVal = comp.id === 'leftRail' ? 1234 : 5678;
                const points: [number, number, number][] = [];
                for (let p = 0; p < particlesCount; p++) {
                  const px = ((p * 13 + seedVal) % 100) / 100 * (length - 0.1) - (length / 2 - 0.05);
                  const py = ((p * 19 + seedVal) % 100) / 100 * (radius * 1.6) - radius * 0.8;
                  const pz = ((p * 29 + seedVal) % 100) / 100 * (radius * 1.6) - radius * 0.8;
                  points.push([px, py, pz]);
                }
                return points.map((pPos, pIdx) => (
                  <mesh key={pIdx} position={pPos}>
                    <sphereGeometry args={[0.004, 4, 4]} />
                    <meshBasicMaterial 
                      color="#10b981" 
                      transparent 
                      opacity={0.6 + Math.sin(Date.now() / 150 + pIdx) * 0.3} 
                    />
                  </mesh>
                ));
              })()}
            </group>
          );

        case 'crossMember':
          // Render as cylindrical structural sleeve beam
          return (
            <group rotation={[0, 0, Math.PI / 2]}>
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[radius, radius, length, 12]} />
                {materialComponent}
              </mesh>
              {/* Connecting collar collars at ends */}
              {!isGhost && (
                <group>
                  <mesh position={[0, length / 2 - 0.02, 0]}>
                    <cylinderGeometry args={[radius * 1.25, radius * 1.25, 0.04, 12]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.95} />
                  </mesh>
                  <mesh position={[0, -length / 2 + 0.02, 0]}>
                    <cylinderGeometry args={[radius * 1.25, radius * 1.25, 0.04, 12]} />
                    <meshStandardMaterial color="#1e293b" metalness={0.95} />
                  </mesh>
                </group>
              )}
            </group>
          );

        case 'axle':
          // Axle steel shaft with CV joint rubber bellows
          return (
            <group rotation={[0, 0, Math.PI / 2]}>
              {/* Axle steel shaft */}
              <mesh castShadow>
                <cylinderGeometry args={[radius, radius, length, 12]} />
                {materialComponent}
              </mesh>
              {/* CV Joint Rubber Bellows on both ends */}
              {!isGhost && (
                <group>
                  <mesh position={[0, length / 2 - 0.06, 0]}>
                    <cylinderGeometry args={[radius * 1.8, radius, 0.05, 8]} />
                    <meshStandardMaterial color="#18181b" roughness={0.8} />
                  </mesh>
                  <mesh position={[0, -length / 2 + 0.06, 0]}>
                    <cylinderGeometry args={[radius * 1.8, radius, 0.05, 8]} />
                    <meshStandardMaterial color="#18181b" roughness={0.8} />
                  </mesh>
                </group>
              )}
            </group>
          );

        default:
          return (
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[radius, radius, length, 12]} />
              {materialComponent}
            </mesh>
          );
      }
    };

    const compStatic = componentStaticData[comp.id] || { baseStress: 60 };
    const materialSpec = materialSpecs[comp.material] || materialSpecs.steel;
    const computedStress = (compStatic.baseStress + comp.appliedLoad * 24.5) * (vehicleStructure.wheelbase / 2.8) / ((vehicleStructure.chassisThickness / 0.04) * (vehicleStructure.chassisThickness / 0.04));
    const calculatedFoS = materialSpec.yieldStrength / computedStress;

    const isMajorComponent = (compId: string) => {
      return [
        'leftRail',
        'batteryBox',
        'frontMotor',
        'rearMotor',
        'frontLeftWheel',
        'frontLeftShock',
        'steeringRack',
        'edgeController'
      ].includes(compId);
    };

    const getComponentStudyLabelName = (compId: string) => {
      switch (compId) {
        case 'leftRail': return 'Chassis Spaceframe';
        case 'batteryBox': return 'HV Battery Enclosure';
        case 'frontMotor': return 'Front Induction Motor';
        case 'rearMotor': return 'Rear Traction Motor';
        case 'frontLeftWheel': return 'EV Tires & Alloys';
        case 'frontLeftShock': return 'Suspension Struts';
        case 'steeringRack': return 'Steering Rack Column';
        case 'edgeController': return 'Edge AI ECU Controller';
        default: return '';
      }
    };

    const elementContent = (
      <group 
        ref={setPartGroup} 
        position={explodedPos} 
        rotation={comp.rotation} 
        scale={renderedScale}
        onClick={(e) => handlePlacementClick(e, comp.id)}
        onPointerOver={(e) => handlePointerOver(e, comp.id)}
        onPointerOut={handlePointerOut}
        onPointerMove={(e) => handlePointerMove(e, comp.id)}
      >
        {renderGeometry()}

        {/* Floating study billboard labels in structural study mode */}
        {viewTheme === 'study' && isMajorComponent(comp.id) && (
          <Html distanceFactor={4.8} position={[0, comp.type === 'batteryTray' ? 0.38 : 0.25, 0]} center>
            <div className="study-billboard">
              {getComponentStudyLabelName(comp.id)}
            </div>
          </Html>
        )}

        {viewTheme !== 'realistic' && (isSelected || (isHovered && !activePlacingSensor)) && (
          <Html distanceFactor={4.5} position={[0, comp.type === 'batteryTray' ? 0.3 : 0.2, 0]} center>
            <div className="floating-label">
              <div className="floating-label-header">
                <span>{comp.name}</span>
                <span style={{ 
                  color: renderedColor, 
                  textShadow: `0 0 5px ${renderedColor}`
                }}>
                  {comp.type.toUpperCase()}
                </span>
              </div>
              <div className="floating-label-body">
                <span>Load: {comp.appliedLoad.toFixed(1)} kN</span>
                <span>Material: {materialSpec.name.split(' ')[0]}</span>
                <span>FoS: {calculatedFoS.toFixed(2)}</span>
              </div>
            </div>
          </Html>
        )}
      </group>
    );

    if (isSelected && viewTheme !== 'realistic' && activeTab === 'stamping') {
      return (
        <group>
          <group ref={setPartGroup} position={explodedPos} rotation={comp.rotation} scale={renderedScale}>
            {renderGeometry()}
          </group>
          <TransformControls 
            object={partGroup || undefined} 
            mode={transformMode}
            onObjectChange={() => {
              if (partGroup) {
                const pos = partGroup.position.toArray() as [number, number, number];
                const rot = partGroup.rotation.toArray().slice(0, 3) as [number, number, number];
                const scl = partGroup.scale.toArray() as [number, number, number];
                handleComponentChange(comp.id, { position: pos, rotation: rot, scale: scl });
              }
            }}
          />
        </group>
      );
    }

    return elementContent;
  };

  const SUVBody = () => {
    if (activeTab === 'twin' && !visibleLayers.body) return null;
    const exp = explosionVal.current;

    // Body dimensions matching wheelbase and track width
    const bt = vehicleStructure.chassisThickness;
    const trackWidth = (vehicleStructure.batteryScaleX / 2 + 0.08 + bt) * 2 + 0.44; // approx 1.6 - 1.8m
    const bodyW = trackWidth - 0.15; // slightly narrower than wheels track

    // Offset positions for exploded view
    const leftPanelZ = bodyW / 2 + exp * 0.8;
    const rightPanelZ = -bodyW / 2 - exp * 0.8;
    const upperYOffset = exp * 1.0;
    const frontXOffset = exp * 0.5;
    const rearXOffset = -exp * 0.5;

    // Materials based on theme
    let glassColor = '#38bdf8';
    let glassTransmission = 0.85;
    let glassOpacity = opacityVal.current;

    if (viewTheme === 'study') {
      glassTransmission = 0.1;
      glassOpacity = 0.06;
    } else if (viewTheme === 'engineering') {
      if (colorMode === 'dark') {
        glassColor = '#1e293b';
        glassTransmission = 0.6;
        glassOpacity = 0.12;
      } else {
        glassColor = '#ffffff';
        glassTransmission = 0.5;
        glassOpacity = 0.12;
      }
    }

    const bodyGlassMat = (
      <meshPhysicalMaterial 
        color={glassColor} 
        roughness={0.05} 
        metalness={0.1}
        transmission={glassTransmission}
        thickness={1.2}
        ior={1.5}
        clearcoat={1.0}
        clearcoatRoughness={0.02}
        transparent 
        opacity={glassOpacity}
      />
    );

    const darkTrimMat = (
      <meshStandardMaterial 
        color="#18181b" 
        roughness={0.4} 
        transparent 
        opacity={glassOpacity} 
      />
    );

    const bodySolidMat = (
      <meshStandardMaterial 
        color="#080c1a" 
        roughness={0.5} 
        metalness={0.8}
        transparent 
        opacity={0.35} 
      />
    );

    const bodyWireframeMat = (
      <meshBasicMaterial 
        color="#00f0ff" 
        wireframe
        transparent 
        opacity={0.9} 
      />
    );

    const isTwin = activeTab === 'twin';

    const RenderPanel = ({ children, position, rotation, castShadow = true, receiveShadow = true }: { children: React.ReactNode; position: [number, number, number]; rotation?: [number, number, number]; castShadow?: boolean; receiveShadow?: boolean }) => {
      if (isTwin) {
        return (
          <group position={position} rotation={rotation}>
            <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
              {children}
              {bodySolidMat}
            </mesh>
            <mesh>
              {children}
              {bodyWireframeMat}
            </mesh>
          </group>
        );
      } else {
        return (
          <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
            {children}
            {bodyGlassMat}
          </mesh>
        );
      }
    };

    // Create the side panels using THREE.Shape
    const sideShape = React.useMemo(() => {
      const shape = new THREE.Shape();
      // Start at rear bumper bottom
      shape.moveTo(-1.9, 0.25);
      // Up to rear light panel
      shape.lineTo(-1.9, 0.72);
      // Slope up D-pillar
      shape.lineTo(-1.4, 1.25);
      // Roofline
      shape.lineTo(0.2, 1.25);
      // Windshield A-pillar slope
      shape.lineTo(0.9, 0.78);
      // Hood line
      shape.lineTo(1.85, 0.62);
      // Front grille top corner
      shape.lineTo(1.9, 0.25);
      
      // Cutout front wheel arch: center 1.4, radius 0.35, angle 0 to PI
      shape.lineTo(1.75, 0.25);
      shape.absarc(1.4, 0.25, 0.35, 0, Math.PI, false);
      
      // Side sill
      shape.lineTo(1.05, 0.25);
      shape.lineTo(-1.05, 0.25);
      
      // Cutout rear wheel arch: center -1.4, radius 0.35, angle 0 to PI
      shape.absarc(-1.4, 0.25, 0.35, 0, Math.PI, false);
      shape.lineTo(-1.75, 0.25);
      
      // Close shape
      shape.lineTo(-1.9, 0.25);

      // Add window cutouts
      const frontWindow = new THREE.Path();
      frontWindow.moveTo(0.12, 1.14);
      frontWindow.lineTo(0.8, 0.82);
      frontWindow.lineTo(0.8, 0.68);
      frontWindow.lineTo(0.12, 0.68);
      frontWindow.lineTo(0.12, 1.14);
      shape.holes.push(frontWindow);

      const rearWindow = new THREE.Path();
      rearWindow.moveTo(-0.8, 1.14);
      rearWindow.lineTo(-0.02, 1.14);
      rearWindow.lineTo(-0.02, 0.68);
      rearWindow.lineTo(-0.8, 0.68);
      rearWindow.lineTo(-0.8, 1.14);
      shape.holes.push(rearWindow);

      return shape;
    }, []);

    const extrudeSettings = {
      depth: 0.02,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.005,
      bevelThickness: 0.005
    };

    return (
      <group>
        {/* Left Side Panel */}
        <RenderPanel position={[0, 0, leftPanelZ]}>
          <extrudeGeometry args={[sideShape, extrudeSettings]} />
        </RenderPanel>

        {/* Right Side Panel */}
        <RenderPanel position={[0, 0, rightPanelZ - 0.02]}>
          <extrudeGeometry args={[sideShape, extrudeSettings]} />
        </RenderPanel>

        {/* Hood */}
        <RenderPanel position={[1.375, 0.69 + upperYOffset, 0]} rotation={[0, 0, 0.11]}>
          <boxGeometry args={[0.9, 0.015, bodyW]} />
        </RenderPanel>

        {/* Windshield */}
        <RenderPanel position={[0.55, 0.99 + upperYOffset, 0]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.95, 0.015, bodyW]} />
        </RenderPanel>

        {/* Roof Panel */}
        <RenderPanel position={[-0.6, 1.25 + upperYOffset, 0]}>
          <boxGeometry args={[1.6, 0.015, bodyW]} />
        </RenderPanel>

        {/* Sloping Tailgate Glass */}
        <RenderPanel position={[-1.65, 0.98 + upperYOffset, 0]} rotation={[0, 0, -0.85]}>
          <boxGeometry args={[0.75, 0.015, bodyW]} />
        </RenderPanel>

        {/* Rear Lower Gate */}
        <RenderPanel position={[-1.9, 0.48 + upperYOffset, 0]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[0.48, 0.015, bodyW]} />
        </RenderPanel>

        {/* Front Grille Assembly */}
        <group position={[1.9 + frontXOffset, 0.42 + upperYOffset, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.02, 0.35, bodyW]} />
            {darkTrimMat}
          </mesh>
          {/* Glowing Grille LED line */}
          <mesh position={[0.01, 0.05, 0]}>
            <boxGeometry args={[0.01, 0.02, bodyW - 0.15]} />
            <meshStandardMaterial 
              color={viewTheme === 'realistic' ? '#ffffff' : '#00f0ff'} 
              emissive={viewTheme === 'realistic' ? '#ffffff' : '#00f0ff'} 
              emissiveIntensity={2.0} 
              transparent
              opacity={opacityVal.current}
            />
          </mesh>
          {/* Headlights */}
          <mesh position={[0.012, 0.12, bodyW / 2 - 0.15]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial 
              color="#ffffff" 
              emissive="#ffffff" 
              emissiveIntensity={3.0} 
              transparent 
              opacity={opacityVal.current} 
            />
          </mesh>
          <mesh position={[0.012, 0.12, -bodyW / 2 + 0.15]}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshStandardMaterial 
              color="#ffffff" 
              emissive="#ffffff" 
              emissiveIntensity={3.0} 
              transparent 
              opacity={opacityVal.current} 
            />
          </mesh>
        </group>

        {/* Rear Taillight lightbar */}
        <group position={[-1.9 + rearXOffset, 0.72 + upperYOffset, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.02, 0.1, bodyW]} />
            {darkTrimMat}
          </mesh>
          <mesh position={[-0.01, 0.0, 0]}>
            <boxGeometry args={[0.005, 0.015, bodyW - 0.1]} />
            <meshStandardMaterial 
              color="#f43f5e" 
              emissive="#f43f5e" 
              emissiveIntensity={2.5} 
              transparent 
              opacity={opacityVal.current} 
            />
          </mesh>
        </group>
      </group>
    );
  };

  const SimForceArrows = () => {
    if (activeTab !== 'twin') return null;

    const gc = vehicleStructure.groundClearance;


    let frontMagnitude = 1.0;
    let rearMagnitude = 1.0;

    if (driveProfile === 'braking') {
      frontMagnitude = 1.7;
      rearMagnitude = 0.4;
    } else if (driveProfile === 'acceleration') {
      frontMagnitude = 0.4;
      rearMagnitude = 1.6;
    } else if (driveProfile === 'slalom') {
      frontMagnitude = 1.0 + Math.sin(Date.now() / 200) * 0.4;
      rearMagnitude = 1.0 - Math.sin(Date.now() / 200) * 0.4;
    }

    const Arrow = ({ pos, dir, label, scale = 1.0, color = '#f97316' }: { pos: [number, number, number]; dir: [number, number, number]; label: string; scale?: number; color?: string }) => {
      const len = 0.35 * scale;
      const rad = 0.015;
      
      const arrowGroup = useRef<THREE.Group>(null);
      useFrame(() => {
        if (arrowGroup.current) {
          const scaleOsc = 1.0 + Math.sin(Date.now() / 80) * 0.05;
          arrowGroup.current.scale.set(1, scaleOsc, 1);
        }
      });

      return (
        <group ref={arrowGroup} position={pos} rotation={dir[0] === 0 && dir[2] === 0 ? (dir[1] < 0 ? [0, 0, 0] : [Math.PI, 0, 0]) : [0, 0, 0]}>
          <mesh position={[0, -len/2, 0]}>
            <cylinderGeometry args={[rad, rad, len, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <mesh position={[0, -len, 0]}>
            <coneGeometry args={[rad * 2.2, 0.08, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
          <Html distanceFactor={4} position={[0, -len * 1.3, 0]} center>
            <div style={{
              background: 'rgba(5, 8, 16, 0.92)',
              border: `1px solid ${color}`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              color: '#fff',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)'
            }}>
              {label}
            </div>
          </Html>
        </group>
      );
    };

    return (
      <group>
        <Arrow 
          pos={[vehicleStructure.batteryOffsetZ, gc + 0.15, 0]} 
          dir={[0, -1, 0]} 
          label={`${(3.5 * (driveProfile === 'slalom' ? 1.0 : 1.2)).toFixed(1)} kN [BATT Load]`} 
          scale={1.2}
          color="#f43f5e"
        />

        <Arrow 
          pos={[wb / 2, gc + 0.35, railZ]} 
          dir={[0, 1, 0]} 
          label={`${(2.2 * frontMagnitude).toFixed(1)} kN [Susp LH-Front]`} 
          scale={frontMagnitude}
          color="#10b981"
        />
        <Arrow 
          pos={[wb / 2, gc + 0.35, -railZ]} 
          dir={[0, 1, 0]} 
          label={`${(2.2 * frontMagnitude).toFixed(1)} kN [Susp RH-Front]`} 
          scale={frontMagnitude}
          color="#10b981"
        />

        <Arrow 
          pos={[-wb / 2, gc + 0.35, railZ]} 
          dir={[0, 1, 0]} 
          label={`${(2.5 * rearMagnitude).toFixed(1)} kN [Susp LH-Rear]`} 
          scale={rearMagnitude}
          color="#10b981"
        />
        <Arrow 
          pos={[-wb / 2, gc + 0.35, -railZ]} 
          dir={[0, 1, 0]} 
          label={`${(2.5 * rearMagnitude).toFixed(1)} kN [Susp RH-Rear]`} 
          scale={rearMagnitude}
          color="#10b981"
        />
      </group>
    );
  };

  const ecuComponent = components.find(c => c.id === 'edgeController');
  const ecuPos = ecuComponent ? getExplodedPosition(ecuComponent, explosionVal.current) : [0.0, vehicleStructure.groundClearance + 0.08, 0.0] as [number, number, number];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={viewMode === 'realistic' ? 0.5 : 0.12} />
      </mesh>

      <SUVBody />

      {viewMode !== 'realistic' && (
        <group position={[0, vehicleStructure.groundClearance, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0.6, 0, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 1.2, 4]} />
            <meshBasicMaterial color="#f43f5e" />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 1.2, 4]} />
            <meshBasicMaterial color="#10b981" />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.6]}>
            <cylinderGeometry args={[0.004, 0.004, 1.2, 4]} />
            <meshBasicMaterial color="#00f0ff" />
          </mesh>
          
          <Html position={[1.3, 0, 0]} center distanceFactor={4.5}>
            <span style={{ color: '#f43f5e', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 'bold' }}>X-AXIS</span>
          </Html>
          <Html position={[0, 1.3, 0]} center distanceFactor={4.5}>
            <span style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 'bold' }}>Y-AXIS</span>
          </Html>
          <Html position={[0, 0, 1.3]} center distanceFactor={4.5}>
            <span style={{ color: '#00f0ff', fontFamily: 'var(--font-mono)', fontSize: '9px', fontWeight: 'bold' }}>Z-AXIS</span>
          </Html>
        </group>
      )}

      <SimForceArrows />

      {components.map(comp => (
        <DynamicCADPart key={comp.id} comp={comp} />
      ))}

      {placedSensors.map((sensor, sIdx) => {
        const parent = components.find(c => c.id === sensor.parentComponent);
        if (!parent) return null;

        const isSelected = selectedSensorId === sensor.id;
        
        let color = '#00f0ff';
        let cableColor = 'rgba(0, 240, 255, 0.4)';
        if (colorMode === 'light') {
          color = sensor.status === 'warning' ? '#b91c1c' : '#dc2626';
          cableColor = 'rgba(15, 23, 42, 0.6)';
        } else {
          color = sensor.status === 'warning' ? '#f43f5e' : '#00f0ff';
          cableColor = color;
        }

        const serialNo = `${sensorSpecs[sensor.type]?.snPrefix || 'SN-TM-'}${sensor.id.split('-')[1] || '0021'}`;

        const sensorOffsetPos: [number, number, number] = [
          sensor.position[0],
          sensor.position[1] + (1.0 - (parent.assembled ? 1.0 : 0.0)) * 0.0,
          sensor.position[2]
        ];

        const cablePath = getCablePathPoints(sensorOffsetPos, ecuPos);
        const flatPoints = new Float32Array(cablePath.flatMap(p => p));

        const ledOn = !simulating || (Math.sin(Date.now() / (sensor.status === 'warning' ? 80 : 250)) > 0);

        return (
          <group key={sensor.id}>
            <group position={sensorOffsetPos}>
              {/* Bracket */}
              <mesh>
                <cylinderGeometry args={[0.045, 0.05, 0.012, 8]} />
                <meshStandardMaterial color={colorMode === 'light' ? '#94a3b8' : '#64748b'} metalness={0.9} roughness={0.2} />
              </mesh>
              
              <mesh position={[0, 0.015, 0]} onClick={(e) => {
                e.stopPropagation();
                setSelectedSensorId(sensor.id);
                setSelectedComponentId(null);
              }}>
                {sensor.type === 'LoadCell' ? (
                  <cylinderGeometry args={[0.038, 0.038, 0.035, 12]} />
                ) : sensor.type === 'StrainGauge' ? (
                  <boxGeometry args={[0.05, 0.005, 0.03]} />
                ) : sensor.type === 'IMU' ? (
                  <boxGeometry args={[0.048, 0.03, 0.048]} />
                ) : sensor.type === 'Accelerometer' ? (
                  <cylinderGeometry args={[0.026, 0.026, 0.036, 6]} />
                ) : sensor.type === 'TemperatureSensor' ? (
                  <cylinderGeometry args={[0.014, 0.014, 0.05, 8]} />
                ) : (
                  <boxGeometry args={[0.035, 0.035, 0.035]} />
                )}
                <meshStandardMaterial 
                  color={sensor.type === 'IMU' ? '#0284c7' : sensor.type === 'StrainGauge' ? '#d97706' : (colorMode === 'light' ? '#475569' : '#334155')}
                  metalness={0.88}
                  roughness={0.2}
                />
              </mesh>

              {/* Blinking sensor LED */}
              <mesh position={[0, 0.038, 0.008]}>
                <sphereGeometry args={[0.005, 8, 8]} />
                <meshBasicMaterial color={ledOn ? color : (colorMode === 'light' ? '#cbd5e1' : '#0f172a')} />
              </mesh>

              {viewTheme !== 'realistic' && (isSelected || hoveredComponentId === sensor.parentComponent) && (
                <Html distanceFactor={4} position={[0, 0.2, 0]} center>
                  <div className="floating-label" style={{ border: `1px solid ${color}` }}>
                    <div className="floating-label-header">
                      <span>{sensor.name}</span>
                      <span style={{ color }}>{sensor.type.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}</span>
                    </div>
                    <div className="floating-label-body" style={{ minWidth: '150px' }}>
                      <span>S/N: {serialNo}</span>
                      <span>Val: <b style={{ color }}>{sensor.liveValue.toFixed(2)}</b></span>
                      <span>Rate: {sensor.samplingRate} Hz</span>
                    </div>
                  </div>
                </Html>
              )}
            </group>

            {parent.assembled && (
              <line>
                <bufferGeometry attach="geometry">
                  <float32BufferAttribute 
                    attach="attributes-position"
                    args={[flatPoints, 3]}
                  />
                </bufferGeometry>
                <lineBasicMaterial attach="material" color={cableColor} linewidth={1.5} transparent opacity={0.6} />
              </line>
            )}

            {simulating && parent.assembled && (
              <mesh>
                <sphereGeometry args={[0.012, 8, 8]} />
                <meshBasicMaterial color={color} />
                <PacketPulse 
                  cablePath={cablePath} 
                  sIdx={sIdx} 
                  speedFactor={sensor.samplingRate / 100}
                  color={color}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Assembly snapping nodes helper */}
      {activePlacingComponent && (
        <group>
          {components.map(c => {
            if (c.assembled) return null;
            const [cx, cy, cz] = getExplodedPosition(c, explosionVal.current);
            return (
              <mesh key={`snap-${c.id}`} position={[cx, cy, cz]} onClick={(e) => handlePlacementClick(e, c.id)}>
                <torusGeometry args={[0.15, 0.008, 4, 16]} />
                <meshBasicMaterial color="#00f0ff" transparent opacity={0.42} />
              </mesh>
            );
          })}
        </group>
      )}

      {activePlacingSensor && (
        <group>
          {components.filter(c => c.type === 'chassisRail' || c.type === 'crossMember').map(rail => {
            const exp = explosionVal.current;
            const [rx, ry, rz] = getExplodedPosition(rail, exp);
            const len = rail.dimensions.length || 2.0;

            return Array.from({ length: 5 }).map((_, idx) => {
              const xPos = rx + (idx - 2) * (len / 4.8);
              return (
                <mesh key={`${rail.id}-${idx}`} position={[xPos, ry, rz]} onClick={(e) => handlePlacementClick(e, rail.id)}>
                  <torusGeometry args={[0.052, 0.005, 4, 12]} />
                  <meshBasicMaterial color="#00f0ff" transparent opacity={0.4} />
                </mesh>
              );
            });
          })}
        </group>
      )}

      {(activePlacingSensor || activePlacingComponent) && ghostPos && (
        <group position={ghostPos}>
          <mesh>
            <sphereGeometry args={[activePlacingComponent ? 0.06 : 0.04, 12, 12]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.65} />
          </mesh>
          <mesh>
            <sphereGeometry args={[activePlacingComponent ? 0.12 : 0.07, 12, 12]} />
            <meshBasicMaterial color="#00f0ff" transparent opacity={0.2} wireframe />
          </mesh>
        </group>
      )}

      {/* Clickable Inspection Joint Nodes */}
      {viewTheme !== 'realistic' && (
        <group>
          {/* Joint 1: Left Sill Stamping Joint */}
          <JointNode 
            id="joint_stamping"
            name="Sill Stamping Structural Joint (ST1)"
            position={[0.4, 0.22, 0.52]}
            status={gate1Status === 'microcrack_detected' && materialType !== 'mmc' ? 'anomaly' : 'nominal'}
            onClick={onJointClick}
          />
          {/* Joint 2: Flange Welding Joint */}
          <JointNode 
            id="joint_welding"
            name="Flange Weld Seam Joint (ST2)"
            position={[-0.45, 0.22, 0.42]}
            status={gate2Status === 'cold_weld_detected' ? 'anomaly' : 'nominal'}
            onClick={onJointClick}
          />
          {/* Joint 3: Battery Marriage Joint (Bolt 4) */}
          <JointNode 
            id="joint_marriage"
            name="Battery Marriage Mount Bolt #4 (ST3)"
            position={[0.0, 0.08, 0.42]}
            status={gate3Status === 'uneven_load_detected' ? 'anomaly' : 'nominal'}
            onClick={onJointClick}
          />
        </group>
      )}
    </group>
  );
};

// Clickable joint sub-component helper
const JointNode = ({ 
  id, 
  name, 
  position, 
  status, 
  onClick 
}: { 
  id: string; 
  name: string; 
  position: [number, number, number]; 
  status: 'nominal' | 'anomaly'; 
  onClick?: (joint: { id: string; name: string; status: 'nominal' | 'anomaly'; event: any }) => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Animate pulse
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const scale = 1.0 + Math.sin(time * (status === 'anomaly' ? 8 : 3)) * 0.15;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  const color = status === 'anomaly' ? '#ef4444' : '#10b981';

  return (
    <group position={position}>
      {/* Interactive click target */}
      <mesh 
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.({ id, name, status, event: e });
        }}
      >
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={status === 'anomaly' ? 2.5 : 1.0} 
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      
      {/* Outer pulsing halo */}
      <mesh scale={[1.5, 1.5, 1.5]}>
        <sphereGeometry args={[0.065, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={status === 'anomaly' ? 0.25 : 0.12} 
          wireframe
        />
      </mesh>
    </group>
  );
};

// Component helper for packet animations along the cable path
const PacketPulse = ({ cablePath, sIdx, speedFactor, color }: { cablePath: [number, number, number][]; sIdx: number; speedFactor: number; color: string }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current && cablePath && cablePath.length > 1) {
      const t = ((Date.now() / 1500) * speedFactor + sIdx * 0.15) % 1.0;
      const pos = interpolatePath(cablePath, t);
      meshRef.current.position.set(pos[0], pos[1], pos[2]);
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.012, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} roughness={0.1} />
    </mesh>
  );
};

// Bezier routing interpolator helper
const interpolatePath = (points: [number, number, number][], t: number) => {
  const numSegments = points.length - 1;
  const scaledT = t * numSegments;
  const segmentIdx = Math.min(numSegments - 1, Math.floor(scaledT));
  const localT = scaledT - segmentIdx;
  
  const p1 = points[segmentIdx];
  const p2 = points[segmentIdx + 1];
  
  return [
    p1[0] + (p2[0] - p1[0]) * localT,
    p1[1] + (p2[1] - p1[1]) * localT,
    p1[2] + (p2[2] - p1[2]) * localT
  ];
};

export default CarModel;