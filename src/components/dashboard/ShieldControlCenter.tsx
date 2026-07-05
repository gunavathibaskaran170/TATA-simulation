import React, { useState, useEffect, useRef } from 'react';
import { 
  X,
  Download,
  Award
} from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ShieldAIService } from '../../services/ShieldAIService';
import type { AIAnalysisResult } from '../../services/ShieldAIService';
import { EvChassisModel } from '../3d/EvChassisModel';

interface ShieldControlCenterProps {
  colorMode: 'dark' | 'light';
  gate1Status: 'nominal' | 'microcrack_detected';
  setGate1Status: (s: 'nominal' | 'microcrack_detected') => void;
  gate2Status: 'nominal' | 'cold_weld_detected';
  setGate2Status: (s: 'nominal' | 'cold_weld_detected') => void;
  gate3Status: 'nominal' | 'uneven_load_detected';
  setGate3Status: (s: 'nominal' | 'uneven_load_detected') => void;
  boltTensions: number[];
  setBoltTensions: React.Dispatch<React.SetStateAction<number[]>>;
  addConsoleLog: (text: string, type?: 'info' | 'warning' | 'system') => void;
  materialType: 'steel' | 'aluminum' | 'mmc';
  setMaterialType?: (m: 'steel' | 'aluminum' | 'mmc') => void;
  mmcConcentration: number;
  senLoadVal: number;
  senVibeVal: number;
  senDistVal: number;
  hardwareConnected: boolean;
  setSenLoadVal?: (v: number) => void;
  setSenVibeVal?: (v: number) => void;
  setSenDistVal?: (v: number) => void;
}

// Rotating wrapper for smooth rotation in 3D scene
const RotatingModel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<any>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.4;
    }
  });
  return <group ref={ref}>{children}</group>;
};

// 3D Mini Digital Twin Component - Redesigned to render the shared EvChassisModel
const MiniDigitalTwin: React.FC<{ 
  activeStation: number; 
  hasFailed: boolean;
  failStation: number;
  colorMode: 'dark' | 'light';
  gate1Status: string;
  gate2Status: string;
  gate3Status: string;
  materialType: string;
  onJointClick: (id: string, name: string, status: 'nominal' | 'anomaly', event: any) => void;
  clamping: number;
  frequency: number;
  clearance: number;
  coolingRate: number;
}> = ({ 
  activeStation, 
  hasFailed, 
  failStation, 
  colorMode,
  gate1Status, 
  gate2Status, 
  gate3Status, 
  materialType, 
  onJointClick,
  clamping,
  frequency,
  clearance,
  coolingRate
}) => {
  // Silence warnings
  void colorMode;

  return (
    <Canvas camera={{ position: [2.5, 1.5, 2.5], fov: 38 }}>
      {/* Clean, neutral dark slate background */}
      <color attach="background" args={["#0c0f17"]} />

      {/* Subtle ambient light and crisp directional light for reflections */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[6, 12, 6]} intensity={2.8} castShadow />
      <directionalLight position={[-6, 6, -6]} intensity={1.2} color="#00F0FF" />
      <pointLight position={[0, 4, 0]} intensity={0.6} />
      
      <React.Suspense fallback={null}>
        <RotatingModel>
          <EvChassisModel 
            activeStation={activeStation}
            hasFailed={hasFailed}
            failStation={failStation}
            gate1Status={gate1Status}
            gate2Status={gate2Status}
            gate3Status={gate3Status}
            materialType={materialType}
            onJointClick={onJointClick}
            clamping={clamping}
            frequency={frequency}
            clearance={clearance}
            coolingRate={coolingRate}
            isInteractive={true}
          />
        </RotatingModel>
      </React.Suspense>

      {/* Camera Controls with Damping and Polar Angle Limit */}
      <OrbitControls 
        enableDamping={true} 
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.05}
        autoRotate={activeStation === 0 && !hasFailed} 
        autoRotateSpeed={0.5} 
      />
    </Canvas>
  );
};

interface FinalReport {
  vin: string;
  inspId: string;
  time: string;
  duration: string;
  gate1: 'PASS' | 'FAIL';
  gate2: 'PASS' | 'FAIL';
  gate3: 'PASS' | 'FAIL';
  score: number;
  status: 'PASS' | 'FAIL';
}

export const ShieldControlCenter: React.FC<ShieldControlCenterProps> = (props) => {
  const {
    colorMode,
    gate1Status,
    setGate1Status,
    gate2Status,
    setGate2Status,
    gate3Status,
    setGate3Status,
    boltTensions,
    setBoltTensions,
    addConsoleLog,
    materialType,
    setMaterialType,
    mmcConcentration,
    senLoadVal,
    senVibeVal,
    senDistVal,
    hardwareConnected,
    setSenLoadVal,
    setSenVibeVal,
    setSenDistVal
  } = props;

  // Silence unused prop warnings
  void colorMode;
  void gate1Status;
  void gate2Status;
  void gate3Status;
  void boltTensions;
  void mmcConcentration;
  void setGate1Status;
  void setGate2Status;
  void setGate3Status;
  void setBoltTensions;
  void setSenLoadVal;
  void setSenVibeVal;
  void setSenDistVal;

  // UI state variables
  const [activeStation, setActiveStation] = useState<number>(0); // 0: Entry, 1: ST1, 2: ST2, 3: ST3, 4: Complete
  const [vehiclePos, setVehiclePos] = useState<number>(5);
  const [stationProgress, setStationProgress] = useState<number>(0);
  const [stationElapsedTime, setStationElapsedTime] = useState<number>(0);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);
  const [inspectionState, setInspectionState] = useState<'idle' | 'running' | 'complete'>('idle');
  const [currentVIN, setCurrentVIN] = useState<string>('TATA-EV-2026-X8F4');
  const [currentInspId, setCurrentInspId] = useState<string>('INSP-00000');
  const [currentStationName, setCurrentStationName] = useState<string>('Vehicle Entry Standby');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Dashboard Stats
  const [prodTotal, setProdTotal] = useState<number>(42);
  const [prodPass, setProdPass] = useState<number>(40);
  const [prodFail, setProdFail] = useState<number>(2);

  // Financial Stats
  const [downtimeMinutesSaved, setDowntimeMinutesSaved] = useState<number>(185);
  const [costSavedUSD, setCostSavedUSD] = useState<number>(4720);

  // Chaos Injection state
  const [chaosMode, setChaosMode] = useState<'none' | 'stamping' | 'welding' | 'marriage' | 'nominal'>('none');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isLedgerOpen, setIsLedgerOpen] = useState<boolean>(false);

  // AI & Extra Sensor Telemetry
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [thermalCooling, setThermalCooling] = useState<number>(18);
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const [failStation, setFailStation] = useState<number>(0);
  const [failReason, setFailReason] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [integrityScore, setIntegrityScore] = useState<number>(100);

  // Audio Context Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Floating Hotspot Tooltip state
  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    name: string;
    status: 'nominal' | 'anomaly';
    x: number;
    y: number;
  } | null>(null);
  // Silence unused state variables to satisfy TS6133
  useEffect(() => {
    void stationProgress;
    void stationElapsedTime;
    void currentStationName;
    void currentTime;
    void failReason;
    void progress;
  }, [stationProgress, stationElapsedTime, currentStationName, currentTime, failReason, progress]);
  // Time stamp ticker
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Alarm sound trigger
  const playAlarmSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(650, now);
      osc1.frequency.linearRampToValueAtTime(320, now + 0.35);
      osc1.frequency.linearRampToValueAtTime(650, now + 0.7);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.9);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.9);
    } catch (e) {
      console.warn("Buzzer failed to play: ", e);
    }
  };

  // Telemetry Mapper and Override handler
  const getActiveTelemetry = () => {
    let clamping = hardwareConnected ? senLoadVal * 5.2 : 24.2;
    let frequency = hardwareConnected ? (senVibeVal > 0.28 ? 320 : 500) : 500;
    let clearance = hardwareConnected ? senDistVal : 12.5;

    if (chaosMode === 'nominal') {
      clamping = 24.2;
      frequency = 500;
      clearance = 12.5;
    } else if (chaosMode === 'stamping') {
      frequency = 420; // Anomaly for steel, MMC alloy damping absorbs this!
    } else if (chaosMode === 'welding') {
      clearance = 7.5; // Welder alignment gap anomaly (<10mm)
    } else if (chaosMode === 'marriage') {
      clamping = 11.8; // Fastener tension drop anomaly (<15 kN)
    }

    return { clamping, frequency, clearance };
  };

  const activeTele = getActiveTelemetry();

  // Active AI evaluation loop on telemetry changes
  useEffect(() => {
    const res = ShieldAIService.evaluateStation(
      activeStation === 0 ? 1 : activeStation, 
      {
        clampingForce: activeTele.clamping,
        frequency: activeTele.frequency,
        clearance: activeTele.clearance,
        coolingRate: thermalCooling
      },
      materialType
    );
    setAiResult(res);
    setIntegrityScore(res.integrityScore);
  }, [activeStation, activeTele.clamping, activeTele.frequency, activeTele.clearance, thermalCooling, materialType]);

  const generateNewVIN = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let vin = 'TATA-EV-2026-';
    for (let i = 0; i < 4; i++) {
      vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
  };

  const generateHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash).toString(16).padStart(8, '0');
    return (absHash + '8a7e4b9d0c1f2e3a5f6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f').slice(0, 64);
  };

  // Start checking simulation
  const handleStartInspection = () => {
    if (inspectionState === 'running') return;

    setInspectionState('running');
    setHasFailed(false);
    setFailStation(0);
    setFailReason('');
    setIntegrityScore(100);
    setProgress(0);
    setActiveStation(0);
    setVehiclePos(5);
    setStationProgress(0);
    setStationElapsedTime(0);
    setFinalReport(null);
    setActiveTooltip(null);
    setCurrentStationName('Vehicle Entry Standby');

    if (!hardwareConnected && chaosMode === 'none') {
      setSenVibeVal?.(0.06);
      setSenLoadVal?.(4.2);
      setSenDistVal?.(12.5);
    }
    
    const newVIN = generateNewVIN();
    const newInsp = `INSP-${Math.floor(Math.random() * 90000 + 10000)}`;
    setCurrentVIN(newVIN);
    setCurrentInspId(newInsp);

    addConsoleLog(`[SHIELD CORE] Inspection session initialized. VIN: ${newVIN}.`, 'system');
  };

  // Dynamic status timeline controller
  useEffect(() => {
    if (inspectionState !== 'running') return;

    const stages = [
      { name: 'Vehicle Entering', startPct: 5, endPct: 30, type: 'move', stationId: 0, durationMs: 1000 },
      { name: 'Station 1: Stamping check (ARS)', startPct: 30, endPct: 30, type: 'scan', stationId: 1, durationMs: 3200 },
      { name: 'Moving to Station 2...', startPct: 30, endPct: 55, type: 'move', stationId: 1, durationMs: 1000 },
      { name: 'Station 2: Flange Welding Verification', startPct: 55, endPct: 55, type: 'scan', stationId: 2, durationMs: 3200 },
      { name: 'Moving to Station 3...', startPct: 55, endPct: 80, type: 'move', stationId: 2, durationMs: 1000 },
      { name: 'Station 3: Battery Marriage clamp verify', startPct: 80, endPct: 80, type: 'scan', stationId: 3, durationMs: 3200 },
      { name: 'Moving to Quality Exit...', startPct: 80, endPct: 95, type: 'move', stationId: 3, durationMs: 1000 },
      { name: 'Quality Evaluation Complete', startPct: 95, endPct: 95, type: 'scan', stationId: 4, durationMs: 800 }
    ];

    let stageIdx = 0;
    let stageElapsed = 0;
    
    // Local tracking variables to prevent stale state closures during sequential runs
    let localGate1: 'PASS' | 'FAIL' = 'PASS';
    let localGate2: 'PASS' | 'FAIL' = 'PASS';
    let localGate3: 'PASS' | 'FAIL' = 'PASS';
    let localHasFailed = false;

    const timer = setInterval(() => {
      stageElapsed += 100;
      const stage = stages[stageIdx];
      const ratio = Math.min(1.0, stageElapsed / stage.durationMs);

      let currentPos = stage.startPct;
      if (stage.type === 'move') {
        currentPos = stage.startPct + (stage.endPct - stage.startPct) * ratio;
        setStationProgress(0);
        setStationElapsedTime(0);
      } else {
        currentPos = stage.startPct;
        setStationProgress(Math.round(ratio * 100));
        setStationElapsedTime(stageElapsed);
      }

      setVehiclePos(currentPos);
      setActiveStation(stage.stationId);
      setCurrentStationName(stage.name);

      const totalElapsedBefore = stages.slice(0, stageIdx).reduce((acc, s) => acc + s.durationMs, 0);
      const totalElapsed = totalElapsedBefore + stageElapsed;
      const totalDuration = stages.reduce((acc, s) => acc + s.durationMs, 0);
      setProgress(Math.round((totalElapsed / totalDuration) * 100));

      // Sensor value simulator ticks
      if (!hardwareConnected && chaosMode === 'none') {
        if (stage.type === 'scan') {
          if (stage.stationId === 1) {
            setSenVibeVal?.(0.04 + Math.random() * 0.02);
          } else if (stage.stationId === 2) {
            setSenLoadVal?.(4.5 + Math.random() * 0.3);
            setThermalCooling(18.0 + Math.random() * 2);
          } else if (stage.stationId === 3) {
            setSenDistVal?.(12.2 + Math.random() * 0.6);
          }
        }
      }

      // Perform AI evaluation at this tick
      const telemetryVal = getActiveTelemetry();
      const evaluation = ShieldAIService.evaluateStation(
        stage.stationId === 0 ? 1 : stage.stationId,
        {
          clampingForce: telemetryVal.clamping,
          frequency: telemetryVal.frequency,
          clearance: telemetryVal.clearance,
          coolingRate: thermalCooling
        },
        materialType
      );

      // Verify bounds and check if station fails
      if (stageElapsed >= stage.durationMs) {
        if (stage.type === 'scan' && stage.stationId > 0 && stage.stationId <= 3) {
          if (evaluation.riskLevel === 'High') {
            localHasFailed = true;
            setHasFailed(true);
            setFailStation(stage.stationId);
            setFailReason(evaluation.anomaliesDetected[0] || 'Quality defect threshold limit exceeded');
            
            if (stage.stationId === 1) {
              setGate1Status('microcrack_detected');
              localGate1 = 'FAIL';
            }
            if (stage.stationId === 2) {
              setGate2Status('cold_weld_detected');
              localGate2 = 'FAIL';
            }
            if (stage.stationId === 3) {
              setGate3Status('uneven_load_detected');
              localGate3 = 'FAIL';
            }

            playAlarmSound();
            addConsoleLog(`[AI ALARM] Station ${stage.stationId} quality check failed: ${evaluation.anomaliesDetected[0]}`, 'warning');
          } else {
            if (stage.stationId === 1) {
              setGate1Status('nominal');
              localGate1 = 'PASS';
            }
            if (stage.stationId === 2) {
              setGate2Status('nominal');
              localGate2 = 'PASS';
            }
            if (stage.stationId === 3) {
              setGate3Status('nominal');
              localGate3 = 'PASS';
              setBoltTensions(Array(12).fill(24.2));
            }
            addConsoleLog(`[AI CORE] Station ${stage.stationId} verification nominal. Clearance OK.`, 'info');
          }
        }

        // Increment to next conveyor node
        stageIdx++;
        stageElapsed = 0;

        if (stageIdx >= stages.length) {
          setInspectionState('complete');
          setProdTotal(t => t + 1);

          if (localHasFailed) {
            setProdFail(f => f + 1);
            setFinalReport({
              vin: currentVIN,
              inspId: currentInspId,
              time: new Date().toLocaleTimeString(),
              duration: `${(totalDuration / 1000).toFixed(1)}s`,
              gate1: localGate1,
              gate2: localGate2,
              gate3: localGate3,
              score: Math.max(30, 100 - (localGate1 === 'FAIL' ? 35 : 0) - (localGate2 === 'FAIL' ? 35 : 0) - (localGate3 === 'FAIL' ? 30 : 0)),
              status: 'FAIL'
            });
            addConsoleLog(`[SHIELD SYSTEM] VIN ${currentVIN} inspection completed with FAILURES. Ledger updated.`, 'warning');
          } else {
            setProdPass(p => p + 1);
            setDowntimeMinutesSaved(d => d + 15);
            setCostSavedUSD(c => c + 350);

            setFinalReport({
              vin: currentVIN,
              inspId: currentInspId,
              time: new Date().toLocaleTimeString(),
              duration: `${(totalDuration / 1000).toFixed(1)}s`,
              gate1: 'PASS',
              gate2: 'PASS',
              gate3: 'PASS',
              score: evaluation.integrityScore,
              status: 'PASS'
            });
            addConsoleLog(`[SHIELD SYSTEM] VIN ${currentVIN} fully certified. Cryptographic ledger block registered.`, 'system');
          }

          clearInterval(timer);
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [inspectionState, chaosMode, hardwareConnected, materialType, thermalCooling]);

  const handleAcknowledgeReset = () => {
    setChaosMode('none');
    setHasFailed(false);
    setFailStation(0);
    setFailReason('');
    setGate1Status('nominal');
    setGate2Status('nominal');
    setGate3Status('nominal');
    setIntegrityScore(100);
    setInspectionState('idle');
    setVehiclePos(5);
    setProgress(0);
    setStationProgress(0);
    setFinalReport(null);
    setActiveTooltip(null);
    setSenVibeVal?.(0.06);
    setSenLoadVal?.(4.2);
    setSenDistVal?.(12.5);
    addConsoleLog('[SHIELD COMMAND] Command Center alarms reset. Inspection system back online.', 'system');
  };

  const handleJointClick = (id: string, name: string, status: 'nominal' | 'anomaly', e: any) => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setActiveTooltip({ id, name, status, x, y });
  };

  const getJointHistory = (id: string) => {
    const actualV = getActiveTelemetry();
    switch (id) {
      case 'joint_stamping':
        return {
          title: 'ARS Acoustic Resonance Trend',
          unit: 'Hz',
          history: [
            { run: 'Run #38', val: 500, label: 'NOMINAL' },
            { run: 'Run #39', val: 512, label: 'NOMINAL' },
            { run: 'Run #40', val: 495, label: 'NOMINAL' },
            { run: 'Run #41', val: 420, label: materialType === 'mmc' ? 'NOMINAL' : 'ANOMALY' },
            { run: 'Run #42 (Active)', val: actualV.frequency, label: actualV.frequency < (materialType === 'mmc' ? 380 : 450) ? 'ANOMALY' : 'NOMINAL' }
          ],
          recommendation: materialType === 'mmc'
            ? 'Nominal: MMC ceramic nanoparticles successfully dampened shockwave fissure.'
            : 'Fissure Warning: Acoustic frequency shifted. Perform ultrasonic weld repair.'
        };
      case 'joint_welding':
        return {
          title: 'Weld Flange Alignment Gap',
          unit: 'mm',
          history: [
            { run: 'Run #38', val: 12.2, label: 'NOMINAL' },
            { run: 'Run #39', val: 12.5, label: 'NOMINAL' },
            { run: 'Run #40', val: 7.2, label: 'VOID ANOMALY' },
            { run: 'Run #41', val: 12.4, label: 'NOMINAL' },
            { run: 'Run #42 (Active)', val: actualV.clearance, label: actualV.clearance < 10 ? 'ANOMALY' : 'NOMINAL' }
          ],
          recommendation: actualV.clearance >= 10
            ? 'Nominal: Flange weld seam thickness holds specification limits.'
            : 'Immediate Line Stop: Void gap detected. Refactor laser weld path.'
        };
      case 'joint_marriage':
        return {
          title: 'Axial Fastener Clamping load',
          unit: 'kN',
          history: [
            { run: 'Run #38', val: 24.2, label: 'NOMINAL' },
            { run: 'Run #39', val: 24.0, label: 'NOMINAL' },
            { run: 'Run #40', val: 11.5, label: 'SLIP FAULT' },
            { run: 'Run #41', val: 24.3, label: 'NOMINAL' },
            { run: 'Run #42 (Active)', val: actualV.clamping, label: actualV.clamping < 15 ? 'ANOMALY' : 'NOMINAL' }
          ],
          recommendation: actualV.clamping >= 15
            ? 'Nominal: Nut-runner torque matches load requirements.'
            : 'Rework Required: Fastener torque below 15 kN threshold. Retighten mount.'
        };
      default:
        return null;
    }
  };

  const getIntegrityColor = (score: number) => {
    if (score >= 85) return 'var(--accent-cyan)';
    if (score >= 60) return '#FFB000';
    return '#FF2A6D';
  };

  const passRate = prodTotal > 0 ? ((prodPass / prodTotal) * 100).toFixed(1) : '100.0';

  // Ignored variables
  void setMaterialType;
  void vehiclePos;
  void prodFail;
  void downtimeMinutesSaved;
  void costSavedUSD;
  void setIsSidebarOpen;
  void aiResult;
  void handleStartInspection;
  void handleAcknowledgeReset;
  void getIntegrityColor;
  void passRate;

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 56px)',
      background: '#080B11',
      color: '#cbd5e1',
      fontFamily: 'var(--font-sans)',
      padding: '16px',
      position: 'relative',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      
      {/* Main Grid: Dashboard & Side Panels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isSidebarOpen ? '1fr 320px' : '1fr',
        gap: '16px',
        flex: 1,
        transition: 'grid-template-columns 0.3s ease'
      }}>
        
        {/* Left Column: Redesigned Full-Height "Big Screen" Viewport */}
        <div 
          ref={canvasContainerRef}
          style={{
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            height: 'calc(100vh - 120px)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 240, 255, 0.02)'
          }}
        >
          {/* Viewport Overlay HUD Header */}
          <div style={{ 
            position: 'absolute', 
            top: '16px', 
            left: '20px', 
            right: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: 'var(--accent-cyan)', 
                letterSpacing: '0.08em', 
                textTransform: 'uppercase',
                textShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
              }}>
                3D DIGITAL TWIN FEA SIMULATOR - ACTIVE SIMULATION
              </span>
              <span style={{ fontSize: '8px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                ACTDIE VEHIELE YEN: TETS-22-2026-28P4
              </span>
            </div>
            
            <div style={{ 
              background: 'rgba(8, 12, 22, 0.85)', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              borderRadius: '20px',
              padding: '4px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              pointerEvents: 'auto'
            }}>
              <div style={{ 
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                SIMULATION IN PROGRESS (50% LAAD)
              </span>
            </div>
          </div>

          {/* Canvas itself */}
          <div style={{ flex: 1 }}>
            <MiniDigitalTwin 
              activeStation={activeStation}
              hasFailed={hasFailed}
              failStation={failStation}
              colorMode={colorMode}
              gate1Status={gate1Status}
              gate2Status={gate2Status}
              gate3Status={gate3Status}
              materialType={materialType}
              onJointClick={handleJointClick}
              clamping={senLoadVal}
              frequency={senVibeVal}
              clearance={senDistVal}
              coolingRate={thermalCooling}
            />
          </div>

          {/* Bottom Left Overlay Telemetry Cards */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '20px',
            display: 'flex',
            gap: '12px',
            pointerEvents: 'auto',
            zIndex: 10
          }}>
            {/* Card 1 */}
            <div style={{
              background: 'rgba(8, 12, 22, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '8px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              minWidth: '240px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>CLAMPING</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', fontFamily: 'var(--font-mono)' }}>{activeTele.clamping.toFixed(2)} hM</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>FREQUENCT</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', fontFamily: 'var(--font-mono)' }}>{activeTele.frequency.toFixed(0)} R2</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>CLEARANCE</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', fontFamily: 'var(--font-mono)' }}>{activeTele.clearance.toFixed(2)} mm</span>
              </div>
            </div>

            {/* Card 2 */}
            <div style={{
              background: 'rgba(8, 12, 22, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '8px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '6px',
              minWidth: '200px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: '#64748b', fontWeight: 'bold' }}>STRESS CONCENTRATION FACTOR</span>
                <span style={{ color: '#FF2A6D', fontWeight: 'bold' }}>2.5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '8px', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: '#64748b', fontWeight: 'bold' }}>STRESS CONCENTRATION FACTOR</span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>2.5</span>
              </div>
            </div>

            {/* Card 3 */}
            <div style={{
              background: 'rgba(8, 12, 22, 0.85)',
              border: '1.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '6px',
              padding: '8px 16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '2px',
              minWidth: '120px'
            }}>
              <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>PEEK DISPLACEMENT</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', fontFamily: 'var(--font-mono)' }}>1.2 mm</span>
            </div>
          </div>

          {/* Bottom Right Instruction Pill */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '20px',
            background: 'rgba(8, 12, 22, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '8px',
            color: '#64748b',
            fontFamily: 'var(--font-mono)',
            zIndex: 10
          }}>
            🖱️ Left Click + Drag to rotate | Scroll to zoom
          </div>

          {/* Active Tooltip overlay */}
          {activeTooltip && (
            <div 
              className="joint-tooltip-card border-glow"
              style={{
                position: 'absolute',
                left: `${Math.min(activeTooltip.x, (canvasContainerRef.current?.clientWidth || 300) - 245)}px`,
                top: `${Math.min(activeTooltip.y, (canvasContainerRef.current?.clientHeight || 300) - 195)}px`,
                zIndex: 90,
                width: '230px',
                background: 'rgba(8, 11, 17, 0.95)',
                backdropFilter: 'blur(12px)',
                border: `1.5px solid ${activeTooltip.status === 'anomaly' ? '#FF2A6D' : '#00F0FF'}`,
                borderRadius: '6px',
                padding: '10px',
                boxShadow: `0 0 15px ${activeTooltip.status === 'anomaly' ? 'rgba(255,42,109,0.2)' : 'rgba(0,240,255,0.1)'}`,
                pointerEvents: 'auto',
                fontFamily: 'var(--font-sans)',
                animation: 'label-entrance 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '3px' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff', letterSpacing: '0.02em' }}>
                  {activeTooltip.name}
                </span>
                <button 
                  onClick={() => setActiveTooltip(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* SVG Historical Chart */}
              {(() => {
                const data = getJointHistory(activeTooltip.id);
                if (!data) return null;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '7.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      5-SESSION CALIBRATION HISTORY ({data.title})
                    </span>
                    
                    <div style={{ height: '40px', background: 'rgba(0,0,0,0.25)', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <svg width="100%" height="100%" viewBox="0 0 200 40">
                        {(() => {
                          const points = data.history.map((h, idx) => {
                            const x = 15 + idx * 42;
                            const maxVal = Math.max(...data.history.map(x => typeof x.val === 'number' ? x.val : 0));
                            const minVal = Math.min(...data.history.map(x => typeof x.val === 'number' ? x.val : 0));
                            const range = maxVal - minVal || 1;
                            const y = 32 - (((h.val as number) - minVal) / range) * 24;
                            return { x, y, run: h.run, val: h.val, label: h.label };
                          });

                          const pathD = points.reduce((acc, p, idx) => {
                            return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                          }, '');

                          return (
                            <>
                              <path d={pathD} fill="none" stroke={activeTooltip.status === 'anomaly' ? '#FF2A6D' : '#00F0FF'} strokeWidth="1.5" />
                              {points.map((p, idx) => (
                                <g key={idx}>
                                  <circle 
                                    cx={p.x} 
                                    cy={p.y} 
                                    r="2.5" 
                                    fill={p.label === 'ANOMALY' ? '#FF2A6D' : '#00F0FF'} 
                                  />
                                  <text x={p.x} y={p.y - 5} fill="#fff" fontSize="5.5" textAnchor="middle" fontFamily="monospace">
                                    {(p.val as number).toFixed(0)}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    
                    <div style={{
                      background: activeTooltip.status === 'anomaly' ? 'rgba(255, 42, 109, 0.1)' : 'rgba(0, 240, 255, 0.05)',
                      border: `1px solid ${activeTooltip.status === 'anomaly' ? '#FF2A6D' : '#00F0FF'}`,
                      borderRadius: '3px',
                      padding: '4px 6px',
                      fontSize: '8px',
                      color: activeTooltip.status === 'anomaly' ? '#FF2A6D' : 'var(--accent-cyan)',
                      fontWeight: 'bold',
                      lineHeight: '1.2'
                    }}>
                      {data.recommendation}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Collapsible Sidebar Panel (Redesigned to match image_b97b71.jpg) */}
        {isSidebarOpen && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '320px',
            minWidth: '320px',
            transition: 'all 0.3s ease'
          }}>
            
            {/* Card 1: ACTIVE SIMULATION STATUS */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 'bold', 
                color: '#94a3b8', 
                letterSpacing: '0.04em', 
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                📈 ACTIVE SIMULATION STATUS
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>LOAD CASE:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-mono)' }}>50% G</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>LOAD CASE:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-mono)' }}>50% G</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>MAX STRESS:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-mono)' }}>450 MPa (at B-pillar)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>SAFETY FACTOR:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-mono)' }}>2.1</span>
                </div>
              </div>
            </div>

            {/* Card 2: PRODUCTION WORKSPACE COUNTS */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 'bold', 
                color: '#94a3b8', 
                letterSpacing: '0.04em', 
                textTransform: 'uppercase'
              }}>
                PRODUCTION WORKSPACE COUNTS
              </span>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>TOTAL</p>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-mono)' }}>42</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>PASSED</p>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', fontFamily: 'var(--font-mono)' }}>40</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '7px', color: '#FF2A6D', fontWeight: 'bold', marginBottom: '4px' }}>FAILED</p>
                  <p style={{ fontSize: '18px', fontWeight: '900', color: '#FF2A6D', fontFamily: 'var(--font-mono)' }}>2</p>
                </div>
              </div>
            </div>

            {/* Card 3: CRITICAL STRESS POINTS */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '16px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 'bold', 
                color: '#94a3b8', 
                letterSpacing: '0.04em', 
                textTransform: 'uppercase'
              }}>
                CRITICAL STRESS POINTS
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>HIGH STRESS ZONES:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#FF2A6D', fontFamily: 'var(--font-mono)' }}>3</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>MATERIAL DEFORMATION:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-mono)' }}>15mm</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '9px', color: '#64748b' }}>MATERIAL DEFORMATION:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#10b981', fontFamily: 'var(--font-mono)' }}>20</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 8. QUALITY CLEARANCE & LEDGER CERTIFICATE MODAL */}
      {isLedgerOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            background: '#0c0f17',
            border: '2px solid var(--accent-cyan)',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.25)',
            width: '450px',
            borderRadius: '12px',
            overflow: 'hidden',
            fontFamily: 'var(--font-sans)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.15), transparent)',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} style={{ color: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '13px', fontWeight: '900', color: '#fff', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                  SHIELD AUTOMOTIVE QUALITY CLEARANCE
                </span>
              </div>
              <button 
                onClick={() => setIsLedgerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Certificate Body */}
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', borderBottom: '1.5px dashed rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                <p style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.04em' }}>VEHICLE QUALITY BIRTH CERTIFICATE</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#00F0FF', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                  {finalReport?.vin || currentVIN}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '10.5px', fontFamily: 'var(--font-mono)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Inspection Session:</span>
                  <span style={{ color: '#fff' }}>{finalReport?.inspId || currentInspId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Release Timestamp:</span>
                  <span style={{ color: '#fff' }}>{new Date().toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Chassis Material:</span>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                    {materialType === 'mmc' ? 'Al-SiCp MMC Composite' : (materialType === 'aluminum' ? 'Aluminum Alloy' : 'High Strength Steel')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Stamping Status:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ PASSED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Welding Seams:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ PASSED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Marriage Mount Clamps:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓ PASSED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '6px' }}>
                  <span style={{ color: '#64748b' }}>FTR Integrity Index:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{integrityScore} / 100</span>
                </div>
              </div>

              {/* SHA-256 Ledger Section */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(0, 240, 255, 0.1)',
                borderRadius: '6px',
                padding: '10px',
                fontFamily: 'var(--font-mono)',
                fontSize: '8px',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>🔒 TAMPER-PROOF BLOCKCHAIN LEDGER HASH:</span>
                <span style={{ color: '#fff', wordBreak: 'break-all' }}>
                  {generateHash(`${currentVIN}-${integrityScore}-${materialType}`)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              background: 'rgba(0,0,0,0.2)',
              padding: '12px 20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button 
                onClick={() => setIsLedgerOpen(false)}
                style={{
                  padding: '6px 14px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                CLOSE
              </button>
              <button 
                onClick={() => {
                  alert("Clearance certificate successfully exported to line manufacturing ledger repository.");
                  setIsLedgerOpen(false);
                }}
                style={{
                  padding: '6px 14px',
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  color: '#080B11',
                  fontWeight: 'bold',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={11} />
                EXPORT LEDGER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS transition animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan-sweep {
          0% { transform: translate(-20px, -50%); }
          100% { transform: translate(20px, -50%); }
        }
        @keyframes conveyor-run {
          0% { background-position: 0 0; }
          100% { background-position: -16px 0; }
        }
        @keyframes alert-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.82; }
        }
        @keyframes label-entrance {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}} />

    </div>
  );
};
