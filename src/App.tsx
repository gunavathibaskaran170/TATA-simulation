import React, { useState, useEffect, useRef } from 'react';
import { LeftPanel } from './components/dashboard/LeftPanel';
import { RightPanel } from './components/dashboard/RightPanel';
import { BottomPanel } from './components/dashboard/BottomPanel';
import { ThreeCanvas } from './components/3d/ThreeCanvas';
import { ShieldEdgeNode } from './components/dashboard/ShieldEdgeNode';
import { ShieldControlCenter } from './components/dashboard/ShieldControlCenter';
import { Wrench, Sun, Moon } from 'lucide-react';
import './App.css';

export interface Sensor {
  id: string;
  type: string;
  name: string;
  position: [number, number, number];
  parentComponent: string;
  samplingRate: number;
  threshold: number;
  status: 'normal' | 'warning';
  liveValue: number;
}

export interface VehicleStructure {
  wheelbase: number;
  groundClearance: number;
  chassisThickness: number;
  batteryScaleX: number;
  batteryScaleY: number;
  batteryScaleZ: number;
  batteryOffsetZ: number;
  suspensionHeight: number;
}

export interface VehicleComponent {
  id: string;
  name: string;
  type: 'chassisRail' | 'crossMember' | 'batteryTray' | 'suspensionArm' | 'shockAbsorber' | 'wheel' | 'axle'
      | 'batteryModules' | 'frontMotor' | 'rearMotor' | 'steeringRack' | 'brakeSystem' | 'seats' | 'dashboard' | 'doors' | 'hood' | 'roof' | 'bumpers' | 'ecu';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material: 'steel' | 'aluminum' | 'carbon' | 'titanium' | 'lithium' | 'mmc';
  appliedLoad: number;
  dimensions: {
    length?: number;
    radius?: number;
    width?: number;
    height?: number;
  };
  manuallyMoved?: boolean;
  isStatic?: boolean;
  assembled?: boolean;
}

export interface ConsoleLogEntry {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'system';
  timestamp: string;
}

export const getDefaultComponents = (struct: VehicleStructure): VehicleComponent[] => {
  const defaultList: Omit<VehicleComponent, 'position' | 'dimensions'>[] = [
    // Chassis rails (always assembled by default in Stage 1)
    { id: 'leftRail', name: '🛤️ Left Longitudinal Sill', type: 'chassisRail', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rightRail', name: '🛤️ Right Longitudinal Sill', type: 'chassisRail', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'frontCrossMember', name: '🔗 Front Cross Member', type: 'crossMember', rotation: [0, 0, Math.PI / 2], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'midCrossMember', name: '🔗 Middle Cross Member', type: 'crossMember', rotation: [0, 0, Math.PI / 2], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rearCrossMember', name: '🔗 Rear Cross Member', type: 'crossMember', rotation: [0, 0, Math.PI / 2], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    
    // Battery tray (assembled)
    { id: 'batteryBox', name: '🔋 Battery Pack Enclosure', type: 'batteryTray', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 3.5, manuallyMoved: false, isStatic: true, assembled: true },
    
    // Edge AI Controller (ECU) - starts assembled for routing
    { id: 'edgeController', name: '🧠 NVIDIA Jetson Orin Controller', type: 'ecu', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },

    // Powertrain modules (assembled by default)
    { id: 'batteryModules', name: '⚡ HV Lithium Battery Modules', type: 'batteryModules', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'lithium', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'frontMotor', name: '⚙️ Front Motor & Inverter', type: 'frontMotor', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 1.5, manuallyMoved: false, isStatic: false, assembled: true },
    { id: 'rearMotor', name: '⚙️ Rear High-Torque Motor', type: 'rearMotor', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 2.0, manuallyMoved: false, isStatic: false, assembled: true },
    
    // Suspension, axles and steering (assembled by default)
    { id: 'frontAxle', name: '🔩 Front Axle Shaft', type: 'axle', rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rearAxle', name: '🔩 Rear Axle Shaft', type: 'axle', rotation: [Math.PI / 2, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'frontLeftWheel', name: '🛞 Front Left Wheel', type: 'wheel', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'frontRightWheel', name: '🛞 Front Right Wheel', type: 'wheel', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rearLeftWheel', name: '🛞 Rear Left Wheel', type: 'wheel', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rearRightWheel', name: '🛞 Rear Right Wheel', type: 'wheel', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    
    { id: 'frontLeftSuspensionArm', name: '📐 Front Left Control Arm', type: 'suspensionArm', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'frontRightSuspensionArm', name: '📐 Front Right Control Arm', type: 'suspensionArm', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rearLeftSuspensionArm', name: '📐 Rear Left Control Arm', type: 'suspensionArm', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rearRightSuspensionArm', name: '📐 Rear Right Control Arm', type: 'suspensionArm', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    
    { id: 'frontLeftShock', name: '🌀 Front Left Coilovers', type: 'shockAbsorber', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'frontRightShock', name: '🌀 Front Right Coilovers', type: 'shockAbsorber', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rearLeftShock', name: '🌀 Rear Left Coilovers', type: 'shockAbsorber', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'rearRightShock', name: '🌀 Rear Right Coilovers', type: 'shockAbsorber', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    
    { id: 'steeringRack', name: '🏎️ Steering Assembly & Column', type: 'steeringRack', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'brakeSystem', name: '🛑 Ventilated Brake System', type: 'brakeSystem', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'steel', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    
    // Cabin interior & body panels (assembled by default)
    { id: 'cabinSeats', name: '💺 R&D Lightweight Seats', type: 'seats', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'carbon', appliedLoad: 1.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'dashboard', name: '🖥️ R&D Dash & Instrument Cluster', type: 'dashboard', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'cabinDoors', name: '🚪 Reinforced Side Doors', type: 'doors', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'carbon', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'hood', name: '🚘 Front Ventilated Hood', type: 'hood', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'carbon', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'roof', name: '🏠 Panoramic Carbon Roof Panel', type: 'roof', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'carbon', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true },
    { id: 'bumpers', name: '🛡️ Impact Absorbing Bumpers', type: 'bumpers', rotation: [0, 0, 0], scale: [1, 1, 1], material: 'aluminum', appliedLoad: 0.0, manuallyMoved: false, isStatic: true, assembled: true }
  ];

  const gc = struct.groundClearance;
  const wb = struct.wheelbase;
  const bt = struct.chassisThickness;
  const batW = struct.batteryScaleX;
  const batH = struct.batteryScaleY;
  const batL = struct.batteryScaleZ;
  const batOffZ = struct.batteryOffsetZ;
  const railZ = batW / 2 + 0.08 + bt;

  return defaultList.map(comp => {
    let pos: [number, number, number] = [0, gc, 0];
    let dims: Record<string, number> = {};

    switch (comp.id) {
      case 'leftRail':
        pos = [0, gc, railZ];
        dims = { length: wb - 0.7, radius: bt };
        break;
      case 'rightRail':
        pos = [0, gc, -railZ];
        dims = { length: wb - 0.7, radius: bt };
        break;
      case 'frontCrossMember':
        pos = [wb / 2 - 0.35, gc, 0];
        dims = { length: railZ * 2, radius: bt * 0.9 };
        break;
      case 'midCrossMember':
        pos = [batOffZ, gc, 0];
        dims = { length: railZ * 2, radius: bt * 0.95 };
        break;
      case 'rearCrossMember':
        pos = [-wb / 2 + 0.35, gc, 0];
        dims = { length: railZ * 2, radius: bt * 0.9 };
        break;
      case 'batteryBox':
        pos = [batOffZ, gc, 0];
        dims = { width: batW, height: batH, length: batL };
        break;
      case 'edgeController':
        // Mounted on top of the mid cross member
        pos = [batOffZ, gc + bt + 0.03, 0];
        dims = { width: 0.15, height: 0.05, length: 0.22 };
        break;
      case 'batteryModules':
        pos = [batOffZ, gc, 0];
        dims = { width: batW - 0.1, height: batH - 0.05, length: batL - 0.1 };
        break;
      case 'frontMotor':
        pos = [wb / 2 - 0.75, gc + 0.05, 0];
        dims = { length: 0.35, radius: 0.18 };
        break;
      case 'rearMotor':
        pos = [-wb / 2 + 0.75, gc + 0.05, 0];
        dims = { length: 0.4, radius: 0.2 };
        break;
      case 'frontAxle':
        pos = [wb / 2, 0.32, 0];
        dims = { length: railZ * 2 + 0.2, radius: 0.022 };
        break;
      case 'rearAxle':
        pos = [-wb / 2, 0.32, 0];
        dims = { length: railZ * 2 + 0.2, radius: 0.025 };
        break;
      case 'frontLeftWheel':
        pos = [wb / 2, 0.32, railZ + 0.10];
        dims = { radius: 0.32, width: 0.22 };
        break;
      case 'frontRightWheel':
        pos = [wb / 2, 0.32, -(railZ + 0.10)];
        dims = { radius: 0.32, width: 0.22 };
        break;
      case 'rearLeftWheel':
        pos = [-wb / 2, 0.32, railZ + 0.10];
        dims = { radius: 0.32, width: 0.22 };
        break;
      case 'rearRightWheel':
        pos = [-wb / 2, 0.32, -(railZ + 0.10)];
        dims = { radius: 0.32, width: 0.22 };
        break;
      case 'frontLeftSuspensionArm':
        pos = [wb / 2, gc + 0.05, railZ + 0.05];
        dims = { length: 0.3, radius: 0.012 };
        break;
      case 'frontRightSuspensionArm':
        pos = [wb / 2, gc + 0.05, -(railZ + 0.05)];
        dims = { length: 0.3, radius: 0.012 };
        break;
      case 'rearLeftSuspensionArm':
        pos = [-wb / 2, gc + 0.05, railZ + 0.05];
        dims = { length: 0.3, radius: 0.012 };
        break;
      case 'rearRightSuspensionArm':
        pos = [-wb / 2, gc + 0.05, -(railZ + 0.05)];
        dims = { length: 0.3, radius: 0.012 };
        break;
      case 'frontLeftShock':
        pos = [wb / 2, gc + 0.1, railZ + 0.08];
        dims = { height: 0.32, radius: 0.02 };
        break;
      case 'frontRightShock':
        pos = [wb / 2, gc + 0.1, -(railZ + 0.08)];
        dims = { height: 0.32, radius: 0.02 };
        break;
      case 'rearLeftShock':
        pos = [-wb / 2, gc + 0.1, railZ + 0.08];
        dims = { height: 0.32, radius: 0.02 };
        break;
      case 'rearRightShock':
        pos = [-wb / 2, gc + 0.1, -(railZ + 0.08)];
        dims = { height: 0.32, radius: 0.02 };
        break;
      case 'steeringRack':
        pos = [wb / 2 - 0.45, gc + 0.18, 0];
        dims = { length: 0.5, radius: 0.02 };
        break;
      case 'brakeSystem':
        pos = [0, 0.32, 0]; // Mounted directly on hubs
        dims = { radius: 0.15, width: 0.02 };
        break;
      case 'cabinSeats':
        pos = [0, gc + 0.15, 0];
        dims = { width: 0.9, height: 0.5, length: 0.5 };
        break;
      case 'dashboard':
        pos = [0.4, gc + 0.41, 0];
        dims = { width: 1.2, height: 0.2, length: 0.15 };
        break;
      case 'cabinDoors':
        pos = [0, gc + 0.33, 0];
        dims = { width: 0.02, height: 0.6, length: 1.2 };
        break;
      case 'hood':
        pos = [wb / 2 - 0.8, gc + 0.33, 0];
        dims = { width: 1.4, height: 0.02, length: 0.9 };
        break;
      case 'roof':
        pos = [-0.1, gc + 0.65, 0];
        dims = { width: 1.3, height: 0.02, length: 1.3 };
        break;
      case 'bumpers':
        pos = [0, gc + 0.08, 0];
        dims = { width: 1.5, height: 0.12, length: 0.1 };
        break;
    }

    return {
      ...comp,
      position: pos,
      dimensions: dims
    } as VehicleComponent;
  });
};

export const updateComponentPositionsFromSliders = (struct: VehicleStructure, currentComponents: VehicleComponent[]) => {
  const gc = struct.groundClearance;
  const wb = struct.wheelbase;
  const bt = struct.chassisThickness;
  const batW = struct.batteryScaleX;
  const batH = struct.batteryScaleY;
  const batL = struct.batteryScaleZ;
  const batOffZ = struct.batteryOffsetZ;
  const railZ = batW / 2 + 0.08 + bt;

  return currentComponents.map(comp => {
    if (comp.manuallyMoved) return comp;

    let pos = [...comp.position] as [number, number, number];
    let dims = { ...comp.dimensions };

    switch (comp.id) {
      case 'leftRail':
        pos = [0, gc, railZ];
        dims.length = wb - 0.7;
        dims.radius = bt;
        break;
      case 'rightRail':
        pos = [0, gc, -railZ];
        dims.length = wb - 0.7;
        dims.radius = bt;
        break;
      case 'frontCrossMember':
        pos = [wb / 2 - 0.35, gc, 0];
        dims.length = railZ * 2;
        dims.radius = bt * 0.9;
        break;
      case 'midCrossMember':
        pos = [batOffZ, gc, 0];
        dims.length = railZ * 2;
        dims.radius = bt * 0.95;
        break;
      case 'rearCrossMember':
        pos = [-wb / 2 + 0.35, gc, 0];
        dims.length = railZ * 2;
        dims.radius = bt * 0.9;
        break;
      case 'batteryBox':
        pos = [batOffZ, gc, 0];
        dims.width = batW;
        dims.height = batH;
        dims.length = batL;
        break;
      case 'edgeController':
        pos = [batOffZ, gc + bt + 0.03, 0];
        break;
      case 'batteryModules':
        pos = [batOffZ, gc, 0];
        dims.width = batW - 0.1;
        dims.height = batH - 0.05;
        dims.length = batL - 0.1;
        break;
      case 'frontMotor':
        pos = [wb / 2 - 0.75, gc + 0.05, 0];
        break;
      case 'rearMotor':
        pos = [-wb / 2 + 0.75, gc + 0.05, 0];
        break;
      case 'frontAxle':
        pos = [wb / 2, 0.32, 0];
        dims.length = railZ * 2 + 0.2;
        break;
      case 'rearAxle':
        pos = [-wb / 2, 0.32, 0];
        dims.length = railZ * 2 + 0.2;
        break;
      case 'frontLeftWheel':
        pos = [wb / 2, 0.32, railZ + 0.10];
        break;
      case 'frontRightWheel':
        pos = [wb / 2, 0.32, -(railZ + 0.10)];
        break;
      case 'rearLeftWheel':
        pos = [-wb / 2, 0.32, railZ + 0.10];
        break;
      case 'rearRightWheel':
        pos = [-wb / 2, 0.32, -(railZ + 0.10)];
        break;
      case 'frontLeftSuspensionArm':
        pos = [wb / 2, gc + 0.05, railZ + 0.05];
        break;
      case 'frontRightSuspensionArm':
        pos = [wb / 2, gc + 0.05, -(railZ + 0.05)];
        break;
      case 'rearLeftSuspensionArm':
        pos = [-wb / 2, gc + 0.05, railZ + 0.05];
        break;
      case 'rearRightSuspensionArm':
        pos = [-wb / 2, gc + 0.05, -(railZ + 0.05)];
        break;
      case 'frontLeftShock':
        pos = [wb / 2, gc + 0.1, railZ + 0.08];
        break;
      case 'frontRightShock':
        pos = [wb / 2, gc + 0.1, -(railZ + 0.08)];
        break;
      case 'rearLeftShock':
        pos = [-wb / 2, gc + 0.1, railZ + 0.08];
        break;
      case 'rearRightShock':
        pos = [-wb / 2, gc + 0.1, -(railZ + 0.08)];
        break;
      case 'steeringRack':
        pos = [wb / 2 - 0.45, gc + 0.18, 0];
        break;
      case 'cabinSeats':
        pos = [0, gc + batH / 2 + 0.04, 0];
        break;
      case 'dashboard':
        pos = [0.4, gc + 0.41, 0];
        break;
      case 'cabinDoors':
        pos = [0, gc + 0.33, 0];
        break;
      case 'hood':
        pos = [wb / 2 - 0.8, gc + 0.33, 0];
        break;
      case 'roof':
        pos = [-0.1, gc + 0.65, 0];
        break;
      case 'bumpers':
        pos = [0, gc + 0.08, 0];
        break;
    }

    return {
      ...comp,
      position: pos,
      dimensions: dims
    };
  });
};

export const App: React.FC = () => {
  // Active workflow stage tab
  const [activeTab, setActiveTab] = useState<'shield' | 'sen' | 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc'>('shield');
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState<boolean>(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState<boolean>(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState<boolean>(false);
  const [driveProfile, setDriveProfile] = useState<'static' | 'braking' | 'acceleration' | 'slalom' | 'pothole' | 'side_impact'>('static');

  // SHIELD Edge Node (SEN) States
  const [senLoadVal, setSenLoadVal] = useState<number>(3.5); // Default 3.5 kN
  const [senVibeVal, setSenVibeVal] = useState<number>(0.12); // Default 0.12g
  const [senDistVal, setSenDistVal] = useState<number>(40.0); // Default 40.0 mm
  const [senInspectionState, setSenInspectionState] = useState<'idle' | 'running' | 'complete'>('idle');
  const [hardwareConnected, setHardwareConnected] = useState<boolean>(false);
  const serialReaderRef = useRef<any>(null);
  const serialPortRef = useRef<any>(null);
  const [senResult, setSenResult] = useState<'none' | 'pass' | 'fail'>('none');
  const [senSerialLogs, setSenSerialLogs] = useState<string[]>([]);
  const senInspectionCountRef = useRef<number>(0);
  
  // Serial throttling refs
  const lastSerialUpdateRef = useRef<number>(0);
  const pendingSerialDataRef = useRef<{ vibe?: number; load?: number; dist?: number }>({});

  // Quality Testing Ecosystem parameters
  const [gate1Status, setGate1Status] = useState<'nominal' | 'microcrack_detected'>('microcrack_detected');
  const [gate2Status, setGate2Status] = useState<'nominal' | 'cold_weld_detected'>('cold_weld_detected');
  const [gate3Status, setGate3Status] = useState<'nominal' | 'uneven_load_detected'>('uneven_load_detected');

  // Interactive triggers
  const [stampingStrike, setStampingStrike] = useState(false);
  const [weldInspect, setWeldInspect] = useState(false);
  const [ultrasonicPulse, setUltrasonicPulse] = useState(false);

  // MMC material parameters
  const [mmcConcentration, setMmcConcentration] = useState(7.5); // 7.5% SiCp
  const [sillThickness, setSillThickness] = useState(3.0); // 3.0mm default wall thickness
  const [materialType, setMaterialType] = useState<'steel' | 'aluminum' | 'mmc'>('steel');

  // Marriage station bolt tension values (12 bolts)
  const [boltTensions, setBoltTensions] = useState<number[]>([
    24.2, 23.8, 24.5, 8.4, 24.0, 24.1, 23.9, 24.4, 24.0, 23.7, 24.3, 24.1
  ]);
  const [selectedBolt, setSelectedBolt] = useState<number | null>(null);

  // Visible Layers & Dismantle Factor for Digital Twin
  const [visibleLayers, setVisibleLayers] = useState({
    spaceframe: true,
    body: true,
    battery: true,
    powertrain: true,
    interior: true
  });
  const [dismantleFactor, setDismantleFactor] = useState<number>(0.0);

  // Global EV Parametric States
  const [vehicleStructure, setVehicleStructure] = useState<VehicleStructure>({
    wheelbase: 2.80,
    groundClearance: 0.20,
    chassisThickness: 0.04,
    batteryScaleX: 1.10,
    batteryScaleY: 0.22,
    batteryScaleZ: 1.60,
    batteryOffsetZ: 0.00,
    suspensionHeight: 0.15
  });

  // Dynamic components state
  const [components, setComponents] = useState<VehicleComponent[]>(() => getDefaultComponents(vehicleStructure));

  // Placed Sensors state - Custom fit for the Quality Gates
  const [placedSensors, setPlacedSensors] = useState<Sensor[]>([
    {
      id: 'SN-ARS1',
      type: 'ARS',
      name: 'Acoustic Resonance Sensor',
      position: [0.0, 0.20, 0.67],
      parentComponent: 'leftRail',
      samplingRate: 500,
      threshold: 80.0,
      status: 'normal',
      liveValue: 0.0
    },
    {
      id: 'SN-THERM2',
      type: 'Thermal',
      name: 'Infrared Thermal Scanner',
      position: [0.0, 0.20, 0.0],
      parentComponent: 'batteryBox',
      samplingRate: 250,
      threshold: 120.0,
      status: 'normal',
      liveValue: 24.5
    },
    {
      id: 'SN-ULTRA3',
      type: 'Ultrasonic',
      name: 'Ultrasonic Tension Tool',
      position: [0.0, 0.20, 0.0],
      parentComponent: 'midCrossMember',
      samplingRate: 100,
      threshold: 24.0,
      status: 'normal',
      liveValue: 24.2
    }
  ]);

  // UI Selection States
  const [activePlacingSensor, setActivePlacingSensor] = useState<string | null>(null);
  const [activePlacingComponent, setActivePlacingComponent] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [focusTargetId, setFocusTargetId] = useState<string | null>(null);

  // View modes & Gizmo modes
  const [viewMode, setViewMode] = useState<'realistic' | 'structural' | 'exploded'>('structural');
  const [viewTheme, setViewTheme] = useState<'engineering' | 'realistic' | 'study'>('engineering');
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark');
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

  // Simulation & Timeline state
  const [simulating, setSimulating] = useState<boolean>(false);
  const [timelineVal, setTimelineVal] = useState<number>(0);

  // Engineering Log Console State
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([
    { id: '1', text: 'EV Quality Testing Ecosystem Workstation Initialized successfully.', type: 'system', timestamp: '00:00:00' },
    { id: '2', text: 'Stamping, Welding, and Marriage feedback loops online.', type: 'info', timestamp: '00:00:01' }
  ]);

  const addConsoleLog = (text: string, type: 'info' | 'warning' | 'system' = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    setConsoleLogs(prev => [
      ...prev,
      { id: Date.now().toString(), text, type, timestamp }
    ]);
  };

  const clearConsoleLogs = () => {
    setConsoleLogs([]);
  };

  const sendSerialCommand = async (cmd: string) => {
    if (serialPortRef.current && serialPortRef.current.writable) {
      try {
        const writer = serialPortRef.current.writable.getWriter();
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(cmd + "\n"));
        writer.releaseLock();
      } catch (e) {
        console.error("Failed to write serial command:", e);
      }
    }
  };

  const connectHardware = async () => {
    if (hardwareConnected) {
      try {
        if (serialReaderRef.current) {
          await serialReaderRef.current.cancel();
        }
        if (serialPortRef.current) {
          await serialPortRef.current.close();
        }
      } catch (e) {
        console.error(e);
      }
      setHardwareConnected(false);
      addConsoleLog("Hardware DAQ Node disconnected.", "system");
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      serialPortRef.current = port;
      setHardwareConnected(true);
      addConsoleLog("Hardware DAQ Node connected successfully!", "system");

      const textDecoder = new TextDecoderStream();
      port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      serialReaderRef.current = reader;

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
              const data = JSON.parse(trimmed);
              let hasNewData = false;
              if (data.az !== undefined) {
                pendingSerialDataRef.current.vibe = Math.abs(data.az - 1.0);
                hasNewData = true;
              }
              if (data.weight !== undefined) {
                pendingSerialDataRef.current.load = data.weight / 100.0;
                hasNewData = true;
              }
              if (data.distance !== undefined) {
                pendingSerialDataRef.current.dist = data.distance * 10.0;
                hasNewData = true;
              }
              if (data.button === 1 && senInspectionState !== 'running') {
                triggerSenInspection();
              }

              if (hasNewData) {
                const now = performance.now();
                // Throttle state updates to 30fps (every 33ms) to prevent render lag
                if (now - lastSerialUpdateRef.current >= 33) {
                  if (pendingSerialDataRef.current.vibe !== undefined) setSenVibeVal(pendingSerialDataRef.current.vibe);
                  if (pendingSerialDataRef.current.load !== undefined) setSenLoadVal(pendingSerialDataRef.current.load);
                  if (pendingSerialDataRef.current.dist !== undefined) setSenDistVal(pendingSerialDataRef.current.dist);
                  lastSerialUpdateRef.current = now;
                  pendingSerialDataRef.current = {};
                }
              }

              setSenSerialLogs(prev => [...prev.slice(-30), `[SERIAL IN]: ${trimmed}`]);
            } catch (e) {
              // Parse error
            }
          }
        }
      }
    } catch (err) {
      console.error("Web Serial connection failed:", err);
      addConsoleLog("Web Serial connection failed. Choose device port.", "warning");
      setHardwareConnected(false);
    }
  };

  // Bidirectional feedback to trigger physical buzzer & LED
  useEffect(() => {
    if (hardwareConnected) {
      if (senResult === 'fail') {
        sendSerialCommand("ALARM_ON");
      } else if (senResult === 'pass') {
        sendSerialCommand("ALARM_OFF");
      }
    }
  }, [senResult, hardwareConnected]);

  const triggerSenInspection = () => {
    if (senInspectionState === 'running') return;
    
    setSenInspectionState('running');
    setSenResult('none');
    senInspectionCountRef.current += 1;
    
    const count = senInspectionCountRef.current;
    const timestamp = Date.now() % 1000000;
    
    setSenSerialLogs([
      `================================================`,
      `SHIELD EDGE NODE (SEN) - INSPECTION REPORT #${count}`,
      `Timestamp: ${timestamp} ms`,
      `------------------------------------------------`,
      `Initializing sensor readings...`
    ]);

    setTimeout(() => {
      setSenSerialLogs(prev => [
        ...prev,
        `Reading Load Cell (HX711)...`,
        `Load Cell (HX711):   ${senLoadVal.toFixed(2)} kN`
      ]);
    }, 400);

    setTimeout(() => {
      setSenSerialLogs(prev => [
        ...prev,
        `Reading Accelerometer (MPU6050)...`,
        `Vibration (MPU6050): ${senVibeVal.toFixed(3)} g`
      ]);
    }, 800);

    setTimeout(() => {
      setSenSerialLogs(prev => [
        ...prev,
        `Reading Distance (HC-SR04)...`,
        `Distance (HC-SR04):  ${senDistVal.toFixed(1)} mm`,
        `------------------------------------------------`,
        `Analyzing values against thresholds...`
      ]);
    }, 1200);

    setTimeout(() => {
      const isLoadOk = (senLoadVal >= 2.0 && senLoadVal <= 4.5);
      const isVibeOk = (senVibeVal < 0.3);
      const isDistOk = (senDistVal >= 35.0 && senDistVal <= 45.0);
      const isPass = isLoadOk && isVibeOk && isDistOk;
      
      setSenResult(isPass ? 'pass' : 'fail');
      setSenInspectionState('complete');
      
      setSenSerialLogs(prev => [
        ...prev,
        `Analysis Results:`,
        `  - Load Check:       ${isLoadOk ? 'PASS' : 'FAIL (Threshold: 2.0 - 4.5 kN)'}`,
        `  - Vibration Check:  ${isVibeOk ? 'PASS' : 'FAIL (Threshold: < 0.3 g)'}`,
        `  - Distance Check:   ${isDistOk ? 'PASS' : 'FAIL (Threshold: 35.0 - 45.0 mm)'}`,
        `------------------------------------------------`,
        `FINAL RESULT: ${isPass ? 'PASS' : 'FAIL'}`,
        isPass 
          ? `SYSTEM STATUS: GREEN LED ON, BUZZER OFF`
          : `SYSTEM STATUS: RED LED ON, BUZZER ACTIVATED [Beep-Beep-Beep]`,
        `================================================`
      ]);

      if (!isPass) {
        if (!isLoadOk) setGate3Status('uneven_load_detected');
        addConsoleLog(`SEN Anomaly Alert: Inspection #${count} failed.`, 'warning');
      } else {
        addConsoleLog(`SEN Success: Inspection #${count} passed.`, 'system');
      }
    }, 1800);
  };

  const handleTabChange = (tab: 'shield' | 'sen' | 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc') => {
    setActiveTab(tab);
    if (tab === 'shield') {
      addConsoleLog('SHIELD Control Center SCADA Dashboard loaded. Real-time monitoring active.', 'system');
    } else if (tab === 'sen') {
      addConsoleLog('SHIELD Edge Node (SEN) Interface loaded. Ready for hardware inspections.', 'system');
    } else if (tab === 'stamping') {
      setViewMode('structural');
      if (viewTheme === 'realistic') setViewTheme('engineering');
      addConsoleLog('Gate 1: Component Stamping precision checks. ARS sensor active.', 'system');
    } else if (tab === 'welding') {
      setViewMode('structural');
      if (viewTheme === 'realistic') setViewTheme('engineering');
      addConsoleLog('Gate 2: Robotic Welding verification active. Laser & Thermal scanning online.', 'system');
    } else if (tab === 'marriage') {
      setViewMode('exploded');
      if (viewTheme === 'realistic') setViewTheme('engineering');
      addConsoleLog('Gate 3: Battery Marriage bolt tensioning station active. Ultrasonic nut-runners synced.', 'system');
    } else if (tab === 'twin') {
      setViewMode('structural');
      if (viewTheme === 'realistic') setViewTheme('engineering');
      addConsoleLog('Gate 4: Digital Twin and FEA stress solver online.', 'system');
    } else if (tab === 'mmc') {
      setViewMode('realistic');
      setViewTheme('realistic');
      addConsoleLog('Gate 5: Al-SiCp MMC Material Innovation diagnostics loaded.', 'system');
    }
  };

  // Adjust coordinates of default components when sliders scale geometry
  useEffect(() => {
    setComponents(prev => updateComponentPositionsFromSliders(vehicleStructure, prev));
  }, [vehicleStructure]);

  // Adjust coordinates of sensors dynamically as components move or sliders scale geometry
  useEffect(() => {
    setPlacedSensors(prevSensors => prevSensors.map(sensor => {
      const parent = components.find(c => c.id === sensor.parentComponent);
      if (!parent) return sensor;

      // Keep sensor snapped relative to parent
      // If parent is rail/member, recalculate or update its position
      const gc = vehicleStructure.groundClearance;
      const wb = vehicleStructure.wheelbase;
      const bt = vehicleStructure.chassisThickness;
      const railZ = vehicleStructure.batteryScaleX / 2 + 0.08 + bt;
      
      let [x, y, z] = sensor.position;
      
      if (sensor.parentComponent === 'leftRail') {
        z = railZ;
        x = Math.max(-wb/2 + 0.4, Math.min(wb/2 - 0.4, x));
        y = gc;
      } else if (sensor.parentComponent === 'rightRail') {
        z = -railZ;
        x = Math.max(-wb/2 + 0.4, Math.min(wb/2 - 0.4, x));
        y = gc;
      } else if (sensor.parentComponent === 'frontCrossMember') {
        x = wb / 2 - 0.35;
        y = gc;
      } else if (sensor.parentComponent === 'midCrossMember') {
        x = vehicleStructure.batteryOffsetZ;
        y = gc;
      } else if (sensor.parentComponent === 'rearCrossMember') {
        x = -wb / 2 + 0.35;
        y = gc;
      } else if (sensor.parentComponent === 'batteryBox') {
        x = vehicleStructure.batteryOffsetZ;
        y = gc;
        z = Math.max(-vehicleStructure.batteryScaleX/2, Math.min(vehicleStructure.batteryScaleX/2, z));
      } else {
        // Parent component was dragged dynamically
        // Snap sensor to parent component absolute position if it was moved manually
        if (parent.manuallyMoved) {
          x = parent.position[0];
          y = parent.position[1];
          z = parent.position[2];
        }
      }
      
      return {
        ...sensor,
        position: [x, y, z]
      };
    }));
  }, [vehicleStructure, components]);

  // Simulation telemetry engine update loop
  useEffect(() => {
    let interval: any;
    if (simulating) {
      interval = setInterval(() => {
        // Increment timeline scrubber
        setTimelineVal(prev => (prev >= 100 ? 0 : prev + 1));
        
        // Update live values
        setPlacedSensors(prevSensors => prevSensors.map(sensor => {
          const parentComp = components.find(c => c.id === sensor.parentComponent);
          const compLoad = parentComp ? parentComp.appliedLoad : 0.0;
          const thicknessFactor = vehicleStructure.chassisThickness / 0.04;
          
          let baseValue = 0;
          let noise = 0;
          
          if (sensor.type === 'StrainGauge') {
            const flexMultiplier = (vehicleStructure.wheelbase / 2.8) / (thicknessFactor * thicknessFactor);
            baseValue = (25 + compLoad * 32) * flexMultiplier;
            noise = (Math.sin(Date.now() / 60) * 14 + (Math.random() - 0.5) * 6) * flexMultiplier;
          } else if (sensor.type === 'Accelerometer' || sensor.type === 'VibrationSensor') {
            baseValue = 1.0 + (compLoad * 0.5);
            noise = Math.sin(Date.now() / 30) * 4.2 + (Math.random() - 0.5) * 1.8;
          } else if (sensor.type === 'LoadCell') {
            baseValue = compLoad;
            noise = Math.sin(Date.now() / 80) * (compLoad * 0.12 + 0.2) + (Math.random() - 0.5) * 0.15;
          } else if (sensor.type === 'TemperatureSensor' || sensor.type === 'Thermal') {
            baseValue = 24.0 + (sensor.parentComponent === 'batteryBox' ? 24 : 6) + (compLoad * 2.8);
            noise = Math.sin(Date.now() / 300) * 0.4 + (Math.random() - 0.5) * 0.2;
          } else if (sensor.type === 'IMU') {
            baseValue = 0.01;
            noise = Math.sin(Date.now() / 45) * 1.2 + (Math.random() - 0.5) * 0.4;
          }
          
          const liveValue = Math.max(0, baseValue + noise);
          const isWarning = liveValue >= sensor.threshold;
          
          return {
            ...sensor,
            liveValue,
            status: isWarning ? 'warning' : 'normal'
          };
        }));
      }, 60);
    }
    return () => clearInterval(interval);
  }, [simulating, components, vehicleStructure]);

  // Scrub timeline updates when simulator is paused
  useEffect(() => {
    if (!simulating) {
      setPlacedSensors(prevSensors => prevSensors.map(sensor => {
        const parentComp = components.find(c => c.id === sensor.parentComponent);
        const compLoad = parentComp ? parentComp.appliedLoad : 0.0;
        const thicknessFactor = vehicleStructure.chassisThickness / 0.04;
        
        let baseValue = 0;
        const scrubFactor = Math.sin((timelineVal / 100) * Math.PI * 2);
        
        if (sensor.type === 'StrainGauge') {
          const flexMultiplier = (vehicleStructure.wheelbase / 2.8) / (thicknessFactor * thicknessFactor);
          baseValue = (25 + compLoad * 32) * flexMultiplier + scrubFactor * 12 * flexMultiplier;
        } else if (sensor.type === 'Accelerometer' || sensor.type === 'VibrationSensor') {
          baseValue = 1.0 + Math.abs(scrubFactor) * 2.2;
        } else if (sensor.type === 'LoadCell') {
          baseValue = compLoad + scrubFactor * (compLoad * 0.1);
        } else if (sensor.type === 'TemperatureSensor' || sensor.type === 'Thermal') {
          baseValue = 24.0 + (sensor.parentComponent === 'batteryBox' ? 24 : 6) + scrubFactor * 1.5;
        } else if (sensor.type === 'IMU') {
          baseValue = Math.abs(scrubFactor) * 0.9;
        }
        
        const liveValue = Math.max(0, baseValue);
        
        return {
          ...sensor,
          liveValue,
          status: liveValue >= sensor.threshold ? 'warning' : 'normal'
        };
      }));
    }
  }, [timelineVal, simulating, components, vehicleStructure]);

  // Log warning logs to bottom panel console on state transition
  const previousStatuses = useRef<Record<string, string>>({});
  
  useEffect(() => {
    placedSensors.forEach(sensor => {
      const prevStatus = previousStatuses.current[sensor.id];
      if (sensor.status === 'warning' && prevStatus !== 'warning') {
        addConsoleLog(`🚨 CRITICAL THRESHOLD: Sensor "${sensor.name}" triggered alarm! Value: ${sensor.liveValue.toFixed(1)}`, 'warning');
      } else if (sensor.status === 'normal' && prevStatus === 'warning') {
        addConsoleLog(`Sensor "${sensor.name}" resolved back to nominal operating margins.`, 'system');
      }
      previousStatuses.current[sensor.id] = sensor.status;
    });
  }, [placedSensors]);

  // Engage/cancel snap modes logs
  useEffect(() => {
    if (activePlacingSensor) {
      addConsoleLog(`Raycast placement active. Select position on chassis frame to mount ${activePlacingSensor.replace(/([A-Z])/g, ' $1').trim()}.`, 'system');
    }
  }, [activePlacingSensor]);

  useEffect(() => {
    if (activePlacingComponent) {
      addConsoleLog(`Chassis assembly mode: Drag & drop to snap ${activePlacingComponent.replace(/([A-Z])/g, ' $1').trim()} onto rails.`, 'system');
    }
  }, [activePlacingComponent]);

  return (
    <div id="root" className={colorMode === 'light' ? 'theme-light' : ''}>
      {/* CAD Station Header */}
      <header className="app-header">
        <div className="app-title-group">
          <div className="app-logo">
            <Wrench size={18} />
          </div>
          <div>
            <h1 className="app-title">SHIELD EDGE NODE (SEN)</h1>
            <p className="app-subtitle">STRUCTURAL HEALTH INTELLIGENCE FOR EV LINE DEFENSE</p>
          </div>
        </div>

        {/* Theme Switcher & Color Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Style Selector */}
          <div className="mode-switcher">
            <button 
              className={`mode-btn ${viewTheme === 'engineering' ? 'active' : ''}`}
              onClick={() => {
                setViewTheme('engineering');
                if (viewMode === 'realistic') setViewMode('structural');
                addConsoleLog('Engineering Theme active: High-contrast inspection.', 'system');
              }}
            >
              ENGINEERING
            </button>
            <button 
              className={`mode-btn ${viewTheme === 'realistic' ? 'active' : ''}`}
              onClick={() => {
                setViewTheme('realistic');
                setViewMode('realistic');
                addConsoleLog('Realistic SUV Mode active: Glossy automotive paint.', 'system');
              }}
            >
              REALISTIC SUV
            </button>
            <button 
              className={`mode-btn ${viewTheme === 'study' ? 'active' : ''}`}
              onClick={() => {
                setViewTheme('study');
                if (viewMode === 'realistic') setViewMode('structural');
                addConsoleLog('Structural Study Mode active: Exposed chassis with billboard labels.', 'system');
              }}
            >
              STRUCTURAL STUDY
            </button>
          </div>

          {/* Color Mode Toggle */}
          <button
            className="mode-btn"
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--panel-border)',
              borderRadius: '30px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
            onClick={() => {
              const newMode = colorMode === 'dark' ? 'light' : 'dark';
              setColorMode(newMode);
              addConsoleLog(`Color scheme switched to ${newMode.toUpperCase()} mode.`, 'system');
            }}
            title="Toggle Light/Dark Theme"
          >
            {colorMode === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>
              {colorMode === 'dark' ? 'LIGHT' : 'DARK'}
            </span>
          </button>
        </div>

        <div className="app-status">
          <div className={`status-dot ${simulating ? 'simulating' : ''}`} />
          <span>{simulating ? 'FEA TELEMETRY ONLINE' : 'CAD MODEL READY'}</span>
        </div>
      </header>

      {/* Workflow Stage Tabs */}
      <div className="workflow-tabs-bar">
        <button 
          className={`workflow-tab-btn ${activeTab === 'shield' ? 'active' : ''}`}
          onClick={() => handleTabChange('shield')}
        >
          <span className="tab-title">SHIELD CONTROL CENTER</span>
        </button>
        <button 
          className={`workflow-tab-btn ${activeTab === 'sen' ? 'active' : ''}`}
          onClick={() => handleTabChange('sen')}
        >
          <span className="tab-title">SHIELD EDGE NODE</span>
        </button>
        <button 
          className={`workflow-tab-btn ${activeTab === 'stamping' ? 'active' : ''}`}
          onClick={() => handleTabChange('stamping')}
        >
          <span className="tab-title">STAMPING CHECK</span>
        </button>
        <button 
          className={`workflow-tab-btn ${activeTab === 'welding' ? 'active' : ''}`}
          onClick={() => handleTabChange('welding')}
        >
          <span className="tab-title">WELD VERIFY</span>
        </button>
        <button 
          className={`workflow-tab-btn ${activeTab === 'marriage' ? 'active' : ''}`}
          onClick={() => handleTabChange('marriage')}
        >
          <span className="tab-title">BATTERY MARRIAGE</span>
        </button>
        <button 
          className={`workflow-tab-btn ${activeTab === 'twin' ? 'active' : ''}`}
          onClick={() => handleTabChange('twin')}
        >
          <span className="tab-title">DIGITAL TWIN & FEA</span>
        </button>
        <button 
          className={`workflow-tab-btn ${activeTab === 'mmc' ? 'active' : ''}`}
          onClick={() => handleTabChange('mmc')}
        >
          <span className="tab-title">MMC INNOVATION</span>
        </button>
      </div>

      {/* Main CAD Workspace Layout */}
      <div className="studio-workspace" style={{ padding: activeTab === 'shield' ? '0' : '' }}>
        {/* Left Side: Trees & Library */}
        {activeTab !== 'shield' && activeTab !== 'sen' && (
          <LeftPanel 
            collapsed={leftPanelCollapsed}
            activeTab={activeTab as 'sen' | 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc'}
            selectedComponentId={selectedComponentId}
            setSelectedComponentId={setSelectedComponentId}
            selectedSensorId={selectedSensorId}
            setSelectedSensorId={setSelectedSensorId}
            activePlacingSensor={activePlacingSensor}
            setActivePlacingSensor={setActivePlacingSensor}
            activePlacingComponent={activePlacingComponent}
            setActivePlacingComponent={setActivePlacingComponent}
            placedSensors={placedSensors}
            components={components}
            setComponents={setComponents}
            addConsoleLog={addConsoleLog}
            driveProfile={driveProfile}
            setDriveProfile={setDriveProfile}
            // Custom states for Gates 1-5
            gate1Status={gate1Status}
            setGate1Status={setGate1Status}
            gate2Status={gate2Status}
            setGate2Status={setGate2Status}
            gate3Status={gate3Status}
            setGate3Status={setGate3Status}
            stampingStrike={stampingStrike}
            setStampingStrike={setStampingStrike}
            weldInspect={weldInspect}
            setWeldInspect={setWeldInspect}
            ultrasonicPulse={ultrasonicPulse}
            setUltrasonicPulse={setUltrasonicPulse}
            mmcConcentration={mmcConcentration}
            setMmcConcentration={setMmcConcentration}
            sillThickness={sillThickness}
            setSillThickness={setSillThickness}
            materialType={materialType}
            setMaterialType={setMaterialType}
            boltTensions={boltTensions}
            setBoltTensions={setBoltTensions}
            selectedBolt={selectedBolt}
            setSelectedBolt={setSelectedBolt}
            // SEN props
            senLoadVal={senLoadVal}
            setSenLoadVal={setSenLoadVal}
            senVibeVal={senVibeVal}
            setSenVibeVal={setSenVibeVal}
            senDistVal={senDistVal}
            setSenDistVal={setSenDistVal}
            senInspectionState={senInspectionState}
            triggerSenInspection={triggerSenInspection}
            senResult={senResult}
            simulating={simulating}
            visibleLayers={visibleLayers}
            setVisibleLayers={setVisibleLayers}
            dismantleFactor={dismantleFactor}
            setDismantleFactor={setDismantleFactor}
          />
        )}

        {/* Center: WebGL CAD Viewport, Shield Edge Node, or SHIELD Control Center */}
        {activeTab === 'shield' ? (
          <ShieldControlCenter 
            colorMode={colorMode}
            gate1Status={gate1Status}
            setGate1Status={setGate1Status}
            gate2Status={gate2Status}
            setGate2Status={setGate2Status}
            gate3Status={gate3Status}
            setGate3Status={setGate3Status}
            boltTensions={boltTensions}
            setBoltTensions={setBoltTensions}
            addConsoleLog={addConsoleLog}
            materialType={materialType}
            setMaterialType={setMaterialType}
            mmcConcentration={mmcConcentration}
            senLoadVal={senLoadVal}
            senVibeVal={senVibeVal}
            senDistVal={senDistVal}
            hardwareConnected={hardwareConnected}
            setSenLoadVal={setSenLoadVal}
            setSenVibeVal={setSenVibeVal}
            setSenDistVal={setSenDistVal}
          />
        ) : activeTab === 'sen' ? (
          <ShieldEdgeNode 
            loadVal={senLoadVal}
            vibeVal={senVibeVal}
            distVal={senDistVal}
            inspectionState={senInspectionState}
            result={senResult}
            serialLogs={senSerialLogs}
            setSerialLogs={setSenSerialLogs}
            triggerInspection={triggerSenInspection}
            hardwareConnected={hardwareConnected}
            connectHardware={connectHardware}
          />
        ) : (
          <ThreeCanvas 
            activeTab={activeTab as 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc'}
            driveProfile={driveProfile}
            vehicleStructure={vehicleStructure}
            placedSensors={placedSensors}
            setPlacedSensors={setPlacedSensors}
            components={components}
            setComponents={setComponents}
            activePlacingSensor={activePlacingSensor}
            setActivePlacingSensor={setActivePlacingSensor}
            activePlacingComponent={activePlacingComponent}
            setActivePlacingComponent={setActivePlacingComponent}
            selectedComponentId={selectedComponentId}
            setSelectedComponentId={setSelectedComponentId}
            selectedSensorId={selectedSensorId}
            setSelectedSensorId={setSelectedSensorId}
            focusTargetId={focusTargetId}
            setFocusTargetId={setFocusTargetId}
            addConsoleLog={addConsoleLog}
            simulating={simulating}
            timelineVal={timelineVal}
            viewMode={viewMode}
            setViewMode={setViewMode}
            transformMode={transformMode}
            setTransformMode={setTransformMode}
            viewTheme={viewTheme}
            colorMode={colorMode}
            // Custom states for Gates 1-5 3D Rendering
            stampingStrike={stampingStrike}
            weldInspect={weldInspect}
            ultrasonicPulse={ultrasonicPulse}
            boltTensions={boltTensions}
            selectedBolt={selectedBolt}
            setSelectedBolt={setSelectedBolt}
            materialType={materialType}
            mmcConcentration={mmcConcentration}
            sillThickness={sillThickness}
            gate1Status={gate1Status}
            gate2Status={gate2Status}
            gate3Status={gate3Status}
            visibleLayers={visibleLayers}
            dismantleFactor={dismantleFactor}
          />
        )}

        {/* Bottom Playback & Scrubber overlaying canvas */}
        {activeTab !== 'shield' && activeTab !== 'sen' && (
          <BottomPanel 
            collapsed={bottomPanelCollapsed}
            leftOffset={leftPanelCollapsed ? '16px' : '346px'}
            rightOffset={rightPanelCollapsed ? '16px' : '346px'}
            onCollapseToggle={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
            activeTab={activeTab as 'sen' | 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc'}
            simulating={simulating}
            setSimulating={setSimulating}
            timelineVal={timelineVal}
            setTimelineVal={setTimelineVal}
            consoleLogs={consoleLogs}
            clearConsoleLogs={clearConsoleLogs}
            addConsoleLog={addConsoleLog}
            placedSensors={placedSensors}
            viewTheme={viewTheme}
            // Custom states
            boltTensions={boltTensions}
            materialType={materialType}
          />
        )}

        {/* Right Side: FEA and Sensor settings inspectors */}
        {activeTab !== 'shield' && activeTab !== 'sen' && activeTab !== 'twin' && (
          <RightPanel 
            collapsed={rightPanelCollapsed}
            activeTab={activeTab as 'sen' | 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc'}
            selectedComponentId={selectedComponentId}
            setSelectedComponentId={setSelectedComponentId}
            selectedSensorId={selectedSensorId}
            setSelectedSensorId={setSelectedSensorId}
            vehicleStructure={vehicleStructure}
            setVehicleStructure={setVehicleStructure}
            placedSensors={placedSensors}
            setPlacedSensors={setPlacedSensors}
            addConsoleLog={addConsoleLog}
            setFocusTargetId={setFocusTargetId}
            simulating={simulating}
            components={components}
            setComponents={setComponents}
            transformMode={transformMode}
            setTransformMode={setTransformMode}
            driveProfile={driveProfile}
            // Custom states
            materialType={materialType}
            setMaterialType={setMaterialType}
            mmcConcentration={mmcConcentration}
            setMmcConcentration={setMmcConcentration}
            sillThickness={sillThickness}
            setSillThickness={setSillThickness}
            boltTensions={boltTensions}
            setBoltTensions={setBoltTensions}
            selectedBolt={selectedBolt}
            setSelectedBolt={setSelectedBolt}
            gate1Status={gate1Status}
            gate2Status={gate2Status}
            gate3Status={gate3Status}
            // SEN props
            senLoadVal={senLoadVal}
            senVibeVal={senVibeVal}
            senDistVal={senDistVal}
            senInspectionState={senInspectionState}
          />
        )}

        {/* Floating Workspace Panel Toggles */}
        {activeTab !== 'shield' && activeTab !== 'sen' && (
          <>
            {/* Left panel chevron */}
            <button 
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              style={{
                position: 'absolute',
                left: leftPanelCollapsed ? '4px' : '314px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 100,
                width: '16px',
                height: '38px',
                background: 'rgba(10, 15, 30, 0.85)',
                border: '1px solid var(--panel-border)',
                borderRadius: '0 6px 6px 0',
                color: 'var(--accent-cyan)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(8px)'
              }}
              title={leftPanelCollapsed ? "Expand Left Panel" : "Collapse Left Panel"}
            >
              <span>{leftPanelCollapsed ? '▶' : '◀'}</span>
            </button>

            {/* Right panel chevron */}
            {activeTab !== 'twin' && (
              <button 
                onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                style={{
                  position: 'absolute',
                  right: rightPanelCollapsed ? '4px' : '314px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 100,
                  width: '16px',
                  height: '38px',
                  background: 'rgba(10, 15, 30, 0.85)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '6px 0 0 6px',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)'
                }}
                title={rightPanelCollapsed ? "Expand Right Panel" : "Collapse Right Panel"}
              >
                <span>{rightPanelCollapsed ? '◀' : '▶'}</span>
              </button>
            )}

            {/* Bottom panel restore tab */}
            {bottomPanelCollapsed && (
              <button
                onClick={() => setBottomPanelCollapsed(false)}
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 100,
                  width: '140px',
                  height: '24px',
                  background: 'rgba(10, 15, 30, 0.85)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '6px 6px 0 0',
                  color: 'var(--accent-cyan)',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 -4px 10px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span>▲ EXPAND TELEMETRY</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default App;
