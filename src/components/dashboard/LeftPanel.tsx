import React from 'react';
import { 
  Layers, 
  Tv,
  AlertTriangle,
  Zap,
  Shield,
  FileCheck,
  Cpu,
  Play,
  CheckCircle
} from 'lucide-react';
import type { VehicleComponent, Sensor } from '../../App';

interface LeftPanelProps {
  collapsed?: boolean;
  activeTab: 'sen' | 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc';
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  selectedSensorId: string | null;
  setSelectedSensorId: (id: string | null) => void;
  activePlacingSensor: string | null;
  setActivePlacingSensor: (type: string | null) => void;
  activePlacingComponent: string | null;
  setActivePlacingComponent: (type: string | null) => void;
  placedSensors: Sensor[];
  components: VehicleComponent[];
  setComponents: React.Dispatch<React.SetStateAction<VehicleComponent[]>>;
  addConsoleLog: (text: string, type?: 'info' | 'warning' | 'system') => void;
  driveProfile?: 'static' | 'braking' | 'acceleration' | 'slalom' | 'pothole' | 'side_impact';
  setDriveProfile?: (profile: 'static' | 'braking' | 'acceleration' | 'slalom' | 'pothole' | 'side_impact') => void;

  // Custom states for Gates 1-5
  gate1Status: 'nominal' | 'microcrack_detected';
  setGate1Status: (status: 'nominal' | 'microcrack_detected') => void;
  gate2Status: 'nominal' | 'cold_weld_detected';
  setGate2Status: (status: 'nominal' | 'cold_weld_detected') => void;
  gate3Status: 'nominal' | 'uneven_load_detected';
  setGate3Status: (status: 'nominal' | 'uneven_load_detected') => void;
  
  stampingStrike: boolean;
  setStampingStrike: (strike: boolean) => void;
  weldInspect: boolean;
  setWeldInspect: (inspect: boolean) => void;
  ultrasonicPulse: boolean;
  setUltrasonicPulse: (pulse: boolean) => void;

  mmcConcentration: number;
  setMmcConcentration: (val: number) => void;
  sillThickness: number;
  setSillThickness: (val: number) => void;
  materialType: 'steel' | 'aluminum' | 'mmc';
  setMaterialType: (type: 'steel' | 'aluminum' | 'mmc') => void;

  boltTensions: number[];
  setBoltTensions: React.Dispatch<React.SetStateAction<number[]>>;
  selectedBolt: number | null;
  setSelectedBolt: (index: number | null) => void;

  // SEN props
  senLoadVal?: number;
  setSenLoadVal?: (val: number) => void;
  senVibeVal?: number;
  setSenVibeVal?: (val: number) => void;
  senDistVal?: number;
  setSenDistVal?: (val: number) => void;
  senInspectionState?: 'idle' | 'running' | 'complete';
  triggerSenInspection?: () => void;
  senResult?: 'none' | 'pass' | 'fail';
  simulating?: boolean;
  visibleLayers?: { spaceframe: boolean; body: boolean; battery: boolean; powertrain: boolean; interior: boolean; };
  setVisibleLayers?: React.Dispatch<React.SetStateAction<{ spaceframe: boolean; body: boolean; battery: boolean; powertrain: boolean; interior: boolean; }>>;
  dismantleFactor?: number;
  setDismantleFactor?: (val: number) => void;
  setViewMode?: (mode: 'realistic' | 'structural' | 'exploded') => void;
}



export const LeftPanel: React.FC<LeftPanelProps> = ({
  collapsed,
  // ... other props
  activeTab,
  gate1Status,
  setGate1Status,
  gate2Status,
  setGate2Status,
  gate3Status,
  setGate3Status,
  stampingStrike,
  setStampingStrike,
  weldInspect,
  setWeldInspect,
  ultrasonicPulse,
  setUltrasonicPulse,
  mmcConcentration,
  setMmcConcentration,
  sillThickness,
  setSillThickness,
  materialType,
  setMaterialType,
  boltTensions,
  setBoltTensions,
  selectedBolt,
  setSelectedBolt,
  addConsoleLog,
  driveProfile = 'static',
  setDriveProfile,

  // SEN props
  senLoadVal,
  simulating = false,
  visibleLayers = { spaceframe: true, body: true, battery: true, powertrain: true, interior: true },
  setVisibleLayers,
  dismantleFactor = 0.0,
  setDismantleFactor,
  setViewMode,
  setSenLoadVal,
  senVibeVal,
  setSenVibeVal,
  senDistVal,
  setSenDistVal,
  senInspectionState,
  triggerSenInspection,
  senResult
}) => {

  // Gate 1 (Stamping) - Strike handler
  const handleStrikeSill = () => {
    setStampingStrike(true);
    addConsoleLog('🔨 Striking longitudinal sill sill boxframe...', 'info');
    
    setTimeout(() => {
      setStampingStrike(false);
      if (materialType === 'mmc') {
        setGate1Status('nominal');
        addConsoleLog('🔊 ARS Result: High acoustic dampening. Acoustic signature clear. 0% anomaly propagation.', 'system');
      } else {
        addConsoleLog('🔊 ARS Result: Secondary peak detected at 14.2 kHz. Internal micro-fissure present!', 'warning');
      }
    }, 1200);
  };

  // Gate 2 (Welding) - Weld inspect handler
  const handleWeldInspect = () => {
    setWeldInspect(true);
    addConsoleLog('📸 Laser profiling & IR thermal cameras checking weld beads...', 'info');
    
    setTimeout(() => {
      setWeldInspect(false);
      if (materialType === 'mmc') {
        setGate2Status('nominal');
        addConsoleLog('📸 Weld Analysis: Complete material fusion. Temperature decay rate profile nominal.', 'system');
      } else {
        addConsoleLog('📸 Weld Analysis: Quick temperature drop detected at Node #4. Air pocket/Cold weld present.', 'warning');
      }
    }, 1500);
  };

  // Gate 3 (Marriage) - Bolt calibrate handler
  const handleBoltCalibrate = () => {
    setUltrasonicPulse(true);
    addConsoleLog('⚡ Ultrasonic transducers calibrating bolt elongation directly...', 'info');
    
    setTimeout(() => {
      setUltrasonicPulse(false);
      setBoltTensions([
        24.0, 24.2, 23.9, 24.1, 24.0, 24.3, 24.0, 24.1, 23.9, 24.2, 24.0, 24.1
      ]);
      setGate3Status('nominal');
      addConsoleLog('⚡ Marriage Status: Uniform bolt clamp tension achieved at 24.0 kN. Defect neutralized.', 'system');
    }, 2000);
  };

  // SVG ARS Graph builder
  const renderArsGraph = () => {
    const points = [];
    const isMmc = materialType === 'mmc';
    const isCrack = gate1Status === 'microcrack_detected' && !isMmc;
    
    for (let x = 0; x <= 200; x++) {
      let y = 10;
      // Base frequency peak (18 kHz equivalent)
      y += Math.exp(-Math.pow((x - 120) / 10, 2)) * 60;
      
      // Secondary crack signature peak around 14 kHz
      if (isCrack) {
        y += Math.exp(-Math.pow((x - 70) / 8, 2)) * 25;
      }
      
      // Noise
      y += Math.sin(x * 0.8) * 2;
      
      // Damping reduction if MMC is active
      if (isMmc) {
        y = 10 + (y - 10) * 0.55;
      }
      
      points.push(`${x},${90 - y}`);
    }
    return points.join(' ');
  };

  // SVG Thermal Cooling Graph builder
  const renderWeldGraph = () => {
    const points = [];
    const isMmc = materialType === 'mmc';
    const isCold = gate2Status === 'cold_weld_detected' && !isMmc;
    
    for (let x = 0; x <= 200; x++) {
      let y = 0;
      if (x < 40) {
        // Heating peak
        y = (x / 40) * 80;
      } else {
        // Cooling decay
        const decayFactor = isCold ? 0.035 : 0.015;
        y = 80 * Math.exp(-(x - 40) * decayFactor);
        
        // Cold weld drop
        if (isCold && x > 70 && x < 120) {
          y -= 15 * Math.sin((x - 70) / 50 * Math.PI);
        }
      }
      // Noise
      y += (Math.random() - 0.5) * 1.5;
      points.push(`${x},${90 - y}`);
    }
    return points.join(' ');
  };

  return (
    <div className={"sidebar-panel" + (collapsed ? " collapsed" : "")}>
      {/* ================= SHIELD EDGE NODE (SEN) TAB ================= */}
      {activeTab === 'sen' && (
        <>
          <div className="panel-header">
            <h3>
              <Cpu size={14} className="app-logo" style={{ color: 'var(--accent-cyan)' }} />
              SEN Inspection Inputs
            </h3>
            <span className="app-subtitle" style={{ color: 'var(--accent-cyan)' }}>TEST CONTROLS</span>
          </div>
          <div className="tree-container-scroll" style={{ flex: '1', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <p className="helper-text" style={{ marginBottom: '4px' }}>
              Configure simulated EV battery-to-chassis assembly variables to test the edge node quality inspection loop:
            </p>

            <div className="control-item">
              <div className="control-label-row">
                <span>Battery Box Load (kN)</span>
                <span className="control-val" style={{ color: (senLoadVal! >= 2.0 && senLoadVal! <= 4.5) ? 'var(--accent-green)' : 'var(--accent-magenta)', fontWeight: 'bold' }}>
                  {senLoadVal?.toFixed(1)} kN
                </span>
              </div>
              <input 
                type="range" 
                className="cad-slider"
                min="0.0" 
                max="10.0" 
                step="0.1" 
                value={senLoadVal} 
                onChange={(e) => setSenLoadVal!(parseFloat(e.target.value))} 
                disabled={senInspectionState === 'running'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>0.0 kN</span>
                <span>Limits: 2.0 - 4.5 kN</span>
                <span>10.0 kN</span>
              </div>
            </div>

            <div className="control-item" style={{ marginTop: '10px' }}>
              <div className="control-label-row">
                <span>Joint Vibration (g)</span>
                <span className="control-val" style={{ color: (senVibeVal! < 0.3) ? 'var(--accent-green)' : 'var(--accent-magenta)', fontWeight: 'bold' }}>
                  {senVibeVal?.toFixed(3)} g
                </span>
              </div>
              <input 
                type="range" 
                className="cad-slider"
                min="0.00" 
                max="2.00" 
                step="0.01" 
                value={senVibeVal} 
                onChange={(e) => setSenVibeVal!(parseFloat(e.target.value))} 
                disabled={senInspectionState === 'running'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>0.0 g</span>
                <span>Limit: &lt; 0.300 g</span>
                <span>2.0 g</span>
              </div>
            </div>

            <div className="control-item" style={{ marginTop: '10px' }}>
              <div className="control-label-row">
                <span>Clearance Distance (mm)</span>
                <span className="control-val" style={{ color: (senDistVal! >= 35.0 && senDistVal! <= 45.0) ? 'var(--accent-green)' : 'var(--accent-magenta)', fontWeight: 'bold' }}>
                  {senDistVal?.toFixed(0)} mm
                </span>
              </div>
              <input 
                type="range" 
                className="cad-slider"
                min="10" 
                max="80" 
                step="1" 
                value={senDistVal} 
                onChange={(e) => setSenDistVal!(parseInt(e.target.value))} 
                disabled={senInspectionState === 'running'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span>10 mm</span>
                <span>Limits: 35 - 45 mm</span>
                <span>80 mm</span>
              </div>
            </div>

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--panel-border)', paddingTop: '16px' }}>
              <button 
                className="action-btn"
                onClick={triggerSenInspection}
                disabled={senInspectionState === 'running'}
                style={{
                  width: '100%',
                  background: (senInspectionState === 'running') ? 'var(--bg-darker)' : 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                  border: 'none',
                  color: '#fff',
                  padding: '10px',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.15)',
                  transition: 'all 0.2s'
                }}
              >
                <Play size={13} fill="currentColor" />
                <span>{senInspectionState === 'running' ? 'SWEEPING SENSORS...' : 'RUN INSPECTION CYCLE'}</span>
              </button>
            </div>

            {senInspectionState === 'complete' && (
              <div style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '6px',
                background: senResult === 'pass' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${senResult === 'pass' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {senResult === 'pass' ? (
                  <>
                    <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 'bold' }}>INSPECTION PASS: Nominals Validated</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle size={16} style={{ color: 'var(--accent-magenta)' }} fill="rgba(244, 63, 94, 0.1)" />
                    <span style={{ fontSize: '10px', color: 'var(--accent-magenta)', fontWeight: 'bold' }}>INSPECTION FAIL: Defect Detected!</span>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= STAMPING TAB (GATE 1) ================= */}
      {activeTab === 'stamping' && (
        <>
          <div className="panel-header">
            <h3>
              <Layers size={14} className="app-logo" />
              Gate 1: Stamping Precision
            </h3>
            <span className="app-subtitle">ARS INSPECTOR</span>
          </div>

          <div className="tree-container-scroll" style={{ flex: '1', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <p className="helper-text">
              Process-Integrated Acoustic Resonance Spectroscopy (ARS). Strike the sill frame to check for stamping micro-fissures.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Active Material
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className={`action-text-btn ${materialType !== 'mmc' ? 'assemble' : ''}`}
                  onClick={() => {
                    setMaterialType('steel');
                    setGate1Status('microcrack_detected');
                    addConsoleLog('Material reset to Standard Steel. Micro-fissures vulnerable under stamping load.', 'info');
                  }}
                  style={{ flex: 1, fontSize: '10px', padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Standard Steel
                </button>
                <button 
                  className={`action-text-btn ${materialType === 'mmc' ? 'assemble' : ''}`}
                  onClick={() => {
                    setMaterialType('mmc');
                    setGate1Status('nominal');
                    addConsoleLog('Upgraded structure to Al-SiCp Metal Matrix Composite. Fissures resolved.', 'info');
                  }}
                  style={{ flex: 1, fontSize: '10px', padding: '8px', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  Al-SiCp MMC
                </button>
              </div>
            </div>

            {/* Quality Status Block */}
            <div style={{ 
              background: gate1Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green-dim)' : 'var(--accent-magenta-dim)',
              border: `1px solid ${gate1Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)'}`,
              padding: '12px',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                <AlertTriangle size={14} style={{ color: gate1Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)' }} />
                <span>
                  STATUS: {gate1Status === 'nominal' || materialType === 'mmc' ? 'PASS (NOMINAL)' : 'FAIL (ANOMALY DETECTED)'}
                </span>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                {gate1Status === 'nominal' || materialType === 'mmc'
                  ? 'No micro-structural fissures detected in sill stamping.'
                  : 'Undetected micro-cracks present in longitudinal sills. Structural risk.'
                }
              </span>
            </div>

            {/* Hammer Strike Trigger */}
            <button 
              className="technical-action-btn"
              onClick={handleStrikeSill}
              disabled={stampingStrike}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, var(--accent-cyan-dim), rgba(0,240,255,0.25))',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer',
                boxShadow: stampingStrike ? 'none' : 'var(--shadow-neon)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Zap size={14} fill={stampingStrike ? 'currentColor' : 'none'} className={stampingStrike ? 'logo-float' : ''} />
              {stampingStrike ? 'STRIKING CHASSIS SILL...' : 'STRIKE SILL & CAPTURE ARS'}
            </button>

            {/* ARS Frequency Plot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="tree-cat-header">Acoustic Resonance Signature</div>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '10px', height: '110px', position: 'relative' }}>
                <svg width="100%" height="90" viewBox="0 0 200 90" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="70" x2="200" y2="70" stroke="rgba(255,255,255,0.08)" strokeDasharray="3" />
                  <line x1="0" y1="45" x2="200" y2="45" stroke="rgba(255,255,255,0.08)" strokeDasharray="3" />
                  <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.08)" strokeDasharray="3" />
                  
                  {/* Frequency Spectrum Line */}
                  <polyline
                    fill="none"
                    stroke={gate1Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)'}
                    strokeWidth="1.5"
                    points={renderArsGraph()}
                  />
                </svg>
                {/* Labels */}
                <div style={{ position: 'absolute', bottom: '4px', left: '8px', fontSize: '8px', color: 'var(--text-muted)' }}>10 kHz</div>
                <div style={{ position: 'absolute', bottom: '4px', right: '8px', fontSize: '8px', color: 'var(--text-muted)' }}>24 kHz</div>
                {gate1Status === 'microcrack_detected' && materialType !== 'mmc' && (
                  <div style={{ position: 'absolute', top: '24px', left: '50px', fontSize: '8px', color: 'var(--accent-magenta)', fontWeight: 'bold' }}>
                    ⚠️ Fissure Peak (14.2kHz)
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= WELDING TAB (GATE 2) ================= */}
      {activeTab === 'welding' && (
        <>
          <div className="panel-header">
            <h3>
              <Layers size={14} className="app-logo" />
              Gate 2: Welding Integrity
            </h3>
            <span className="app-subtitle">ROBOTIC WELD POOL</span>
          </div>

          <div className="tree-container-scroll" style={{ flex: '1', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <p className="helper-text">
              In-Process Laser Specular Profiling and Thermal Imaging. Monitors weld bead heat dissipation to identify internal air pockets.
            </p>

            {/* Quality Status Block */}
            <div style={{ 
              background: gate2Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green-dim)' : 'var(--accent-magenta-dim)',
              border: `1px solid ${gate2Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)'}`,
              padding: '12px',
              borderRadius: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 'bold' }}>
                <AlertTriangle size={14} style={{ color: gate2Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)' }} />
                <span>
                  WELD STATUS: {gate2Status === 'nominal' || materialType === 'mmc' ? 'NOMINAL' : 'COLD WELD / AIR GAP'}
                </span>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                {gate2Status === 'nominal' || materialType === 'mmc'
                  ? 'Complete weld pool fusion and nominal cooling rates verified.'
                  : 'Voltage drop detected at weld tip. High porosity cold weld in joint #4.'
                }
              </span>
            </div>

            <button 
              className="technical-action-btn"
              onClick={handleWeldInspect}
              disabled={weldInspect}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, var(--accent-cyan-dim), rgba(0,240,255,0.25))',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {weldInspect ? 'SWEEPING LASER SCANNER...' : 'SCAN ROBOTIC FLANGE WELDS'}
            </button>

            {/* Weld cooling plot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="tree-cat-header">Weld Pool Cooling Decay Curve</div>
              <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '10px', height: '110px', position: 'relative' }}>
                <svg width="100%" height="90" viewBox="0 0 200 90" preserveAspectRatio="none">
                  <line x1="0" y1="60" x2="200" y2="60" stroke="rgba(255,255,255,0.08)" strokeDasharray="3" />
                  <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,0.08)" strokeDasharray="3" />
                  
                  <polyline
                    fill="none"
                    stroke={gate2Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)'}
                    strokeWidth="1.5"
                    points={renderWeldGraph()}
                  />
                </svg>
                <div style={{ position: 'absolute', bottom: '4px', left: '8px', fontSize: '8px', color: 'var(--text-muted)' }}>0s (strike)</div>
                <div style={{ position: 'absolute', bottom: '4px', right: '8px', fontSize: '8px', color: 'var(--text-muted)' }}>6s (cool)</div>
                {gate2Status === 'cold_weld_detected' && materialType !== 'mmc' && (
                  <div style={{ position: 'absolute', top: '50px', left: '72px', fontSize: '8px', color: 'var(--accent-magenta)', fontWeight: 'bold' }}>
                    ⚠️ Rapid Cool Drop (Air pocket)
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= MARRIAGE TAB (GATE 3) ================= */}
      {activeTab === 'marriage' && (
        <>
          <div className="panel-header">
            <h3>
              <Layers size={14} className="app-logo" />
              Gate 3: Battery Marriage
            </h3>
            <span className="app-subtitle">ULTRASONIC TENSION</span>
          </div>

          <div className="tree-container-scroll" style={{ flex: '1', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <p className="helper-text">
              Sends ultrasonic waves down the mounting bolt axes to measure elongation. Torque checks can be deceived by thread burrs.
            </p>

            {/* Quality Status Block */}
            <div style={{ 
              background: gate3Status === 'nominal' ? 'var(--accent-green-dim)' : 'var(--accent-magenta-dim)',
              border: `1px solid ${gate3Status === 'nominal' ? 'var(--accent-green)' : 'var(--accent-magenta)'}`,
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '11px'
            }}>
              <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Shield size={13} style={{ color: gate3Status === 'nominal' ? 'var(--accent-green)' : 'var(--accent-magenta)' }} />
                <span>CLAMP UNIFORMITY: {gate3Status === 'nominal' ? 'NOMINAL' : 'UNBALANCED TENSION'}</span>
              </div>
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                {gate3Status === 'nominal'
                  ? 'All 12 mounting points clamping loads balanced within ±5% tolerance.'
                  : 'Bolt #4 clamp load is loose (8.4 kN) due to thread burr torque feedback.'
                }
              </span>
            </div>

            {/* 12 Bolts tension grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="tree-cat-header">12-Bolt Clamping Load (Tension)</div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                background: 'rgba(0,0,0,0.3)',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {boltTensions.map((tension, idx) => {
                  const isSelected = selectedBolt === idx;
                  const isLow = tension < 15.0;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedBolt(idx)}
                      style={{
                        padding: '6px 4px',
                        background: isSelected ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? 'var(--accent-cyan)' : isLow ? 'var(--accent-magenta)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '3px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontSize: '8px', color: 'var(--text-muted)', marginBottom: '2px' }}>Bolt {idx + 1}</div>
                      <div style={{ 
                        fontSize: '9px', 
                        fontWeight: 'bold', 
                        color: isLow ? 'var(--accent-magenta)' : 'var(--accent-green)',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {tension.toFixed(1)} kN
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tension/Torque Inspector details */}
            {selectedBolt !== null && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '4px',
                padding: '8px 12px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontWeight: 'bold', color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>BOLT #{selectedBolt + 1} DETAILED STATS</span>
                  <button onClick={() => setSelectedBolt(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '9px' }}>CLOSE</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Rotational Torque:</span>
                  <span style={{ fontWeight: 'bold' }}>24.0 N·m (OK Limit)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ultrasonic Measured Tension:</span>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: boltTensions[selectedBolt] < 15 ? 'var(--accent-magenta)' : 'var(--accent-green)'
                  }}>
                    {boltTensions[selectedBolt].toFixed(2)} kN
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Thread Quality / Burr:</span>
                  <span>{selectedBolt === 3 && gate3Status !== 'nominal' ? '⚠️ Burred Thread Detected' : 'Nominal'}</span>
                </div>
              </div>
            )}

            <button 
              className="technical-action-btn"
              onClick={handleBoltCalibrate}
              disabled={ultrasonicPulse}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, var(--accent-green-dim), rgba(16,185,129,0.25))',
                border: '1px solid var(--accent-green)',
                color: 'var(--accent-green)',
                fontSize: '11px',
                fontWeight: 'bold',
                borderRadius: '4px',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              {ultrasonicPulse ? 'RE-ALIGNING CLAMP LOAD...' : 'RUN ULTRASONIC BALANCING'}
            </button>
          </div>
        </>
      )}

      {/* ================= DIGITAL TWIN & FEA (GATE 4) ================= */}
      {activeTab === 'twin' && (
        <>
          <div className="panel-header">
            <h3>
              <Tv size={14} className="app-logo" />
              Gate 4: Digital Twin & FEA
            </h3>
            <span className="app-subtitle">SIMULATION HUD</span>
          </div>

          <div className="tree-container-scroll" style={{ flex: '1', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            
            {/* Real-time Telemetry Dashboard (Moved to Left Side) */}
            {(() => {
              // Dynamic values that fluctuate during simulation
              const speed = simulating 
                ? (88.0 + Math.sin(Date.now() / 250) * 0.3).toFixed(1) 
                : "88.0";
              
              const power = simulating
                ? (() => {
                    let basePower = 345;
                    if (driveProfile === 'braking') basePower = -85;
                    else if (driveProfile === 'acceleration') basePower = 482;
                    else if (driveProfile === 'slalom') basePower = 220;
                    else if (driveProfile === 'pothole') basePower = 110;
                    else if (driveProfile === 'side_impact') basePower = 0;
                    return (basePower + Math.sin(Date.now() / 180) * 4.5).toFixed(0);
                  })()
                : (() => {
                    let basePower = 345;
                    if (driveProfile === 'braking') basePower = -85;
                    else if (driveProfile === 'acceleration') basePower = 482;
                    else if (driveProfile === 'slalom') basePower = 220;
                    else if (driveProfile === 'pothole') basePower = 110;
                    else if (driveProfile === 'side_impact') basePower = 0;
                    return basePower.toString();
                  })();
                
              const soc = simulating
                ? (74.2 - (Date.now() % 50000) / 10000).toFixed(2)
                : "74.20";
                
              const temp = simulating
                ? (65.0 + Math.sin(Date.now() / 600) * 0.6).toFixed(1)
                : "65.0";

              const torqueFL = simulating ? Math.round(450 + Math.sin(Date.now() / 80) * 6) : 450;
              const torqueFR = simulating ? Math.round(461 + Math.cos(Date.now() / 80) * 5) : 461;
              const torqueRL = simulating ? Math.round(610 + Math.sin(Date.now() / 70) * 8) : 610;
              const torqueRR = simulating ? Math.round(610 + Math.cos(Date.now() / 70) * 8) : 610;

              const travelFront = simulating 
                ? (12.5 + Math.sin(Date.now() / 120) * 0.4).toFixed(1)
                : "12.5";
              const travelRear = simulating 
                ? (15.1 + Math.cos(Date.now() / 100) * 0.3).toFixed(1)
                : "15.1";

              // Dynamic wave path for System Integrity graph
              const points: string[] = [];
              const width = 260;
              const segments = 22;
              for (let i = 0; i <= segments; i++) {
                const x = (i / segments) * width;
                const t = Date.now() / 150;
                const y = 25 + Math.sin(t + i * 0.5) * 12 + Math.cos(t * 0.6 + i * 0.8) * 6;
                points.push(`${x},${y}`);
              }
              const pathD = `M 0,25 ${points.map(p => `L ${p}`).join(' ')}`;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Flashing VEHICLE STATUS ACTIVE Header */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                        display: 'inline-block',
                        animation: simulating ? 'pulse 1.2s infinite' : 'none'
                      }} />
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        letterSpacing: '0.08em',
                        color: '#10b981',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        [VEHICLE STATUS: ACTIVE]
                      </span>
                    </div>
                    <span style={{ fontSize: '8px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>TELEMETRY OK</span>
                  </div>

                  {/* Parameters Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Speed</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{speed}</span>
                        <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>km/h</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Drivetrain Power</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{power}</span>
                        <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>kW</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Battery SoC</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>{soc}%</span>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Motor Temp</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}>{temp}</span>
                        <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }}>°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Wheel Torque Block */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '8px 10px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Wheel Torques</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>FL:</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{torqueFL} Nm</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>FR:</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{torqueFR} Nm</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>RL:</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{torqueRL} Nm</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>RR:</span>
                        <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{torqueRR} Nm</span>
                      </div>
                    </div>
                  </div>

                  {/* Suspension Travel */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Suspension Travel</span>
                      <div style={{ display: 'flex', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: '#fff' }}>
                        <span>Front: <b style={{ color: 'var(--accent-cyan)' }}>{travelFront} mm</b></span>
                        <span>Rear: <b style={{ color: 'var(--accent-cyan)' }}>{travelRear} mm</b></span>
                      </div>
                    </div>
                  </div>

                  {/* System Integrity Oscilloscope */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '8px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>System Integrity Graph</span>
                      <span style={{ fontSize: '8px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>99.2% OK</span>
                    </div>
                    <div style={{ width: '100%', height: '35px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                        <path d={pathD} fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>

                  {/* QA Manufacturing Data */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '8px 10px', borderLeft: '3px solid var(--accent-cyan)' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>QA Manufacturing Benchmark</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'var(--font-mono)', fontSize: '9px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Clamping Force:</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>24.2 N·m</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Vibration Frequency:</span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>588 Hz</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* 3D Layers View Control */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '10px' }}>
              <div className="tree-cat-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <Layers size={11} style={{ color: 'var(--accent-cyan)' }} />
                <span>3D VIEWPORT LAYERS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                {[
                  { key: 'spaceframe', label: 'Chassis Spaceframe' },
                  { key: 'body', label: 'Body Panels' },
                  { key: 'battery', label: 'Battery Pack' },
                  { key: 'powertrain', label: 'Powertrain & Motors' },
                  { key: 'interior', label: 'Cabin Interior' }
                ].map(layer => (
                  <label key={layer.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '10px', color: 'var(--text-secondary)' }}>
                    <input 
                      type="checkbox" 
                      checked={visibleLayers[layer.key as keyof typeof visibleLayers]}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setVisibleLayers && setVisibleLayers(prev => ({ ...prev, [layer.key]: val }));
                        addConsoleLog(`Toggled layer "${layer.label}" visibility ${val ? 'ON' : 'OFF'}.`, 'system');
                      }}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
                    />
                    <span>{layer.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dismantle Assembly Slider */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', borderRadius: '4px', padding: '10px' }}>
              <div className="control-label-row">
                <span className="tree-cat-header" style={{ margin: 0 }}>DISMANTLE LEVEL</span>
                <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(dismantleFactor * 100)}%
                </span>
              </div>
              <input 
                type="range"
                className="cad-slider"
                min="0.0"
                max="1.0"
                step="0.02"
                value={dismantleFactor}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDismantleFactor && setDismantleFactor(val);
                  if (val > 0.05) {
                    setViewMode && setViewMode('exploded');
                  } else {
                    setViewMode && setViewMode('structural');
                  }
                }}
              />
              <p style={{ fontSize: '8px', color: 'var(--text-muted)', margin: 0, fontStyle: 'italic' }}>
                Slide to dismantle and explode internal component layers to inspect individual welds and spaceframe joints.
              </p>
            </div>

            {/* Simulation Scenario select */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="tree-cat-header">Simulation Scenarios</div>
              {[
                { id: 'static', name: 'Static Gravity Load', desc: 'Stationary battery gravity load distribution.' },
                { id: 'braking', name: 'Emergency Braking', desc: 'Severe front axle weight transfer nose dive.' },
                { id: 'acceleration', name: 'Hard Acceleration (Launch)', desc: 'Rearward traction load and squat.' },
                { id: 'slalom', name: 'Slalom Chicane Sweep', desc: 'Asymmetrical lateral dynamic twist.' },
                { id: 'pothole', name: 'High-Velocity Pothole Impact', desc: 'Extreme vertical sill compression spikes.' },
                { id: 'side_impact', name: 'Chassis Side-Impact Crash', desc: 'Dynamic structural crush resistance test.' }
              ].map(profile => (
                <div 
                  key={profile.id}
                  className={`tree-node ${driveProfile === profile.id ? 'active' : ''}`}
                  onClick={() => setDriveProfile && setDriveProfile(profile.id as any)}
                  style={{ padding: '6px 8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <div className="profile-dot" style={{ 
                    background: driveProfile === profile.id ? 'var(--accent-cyan)' : 'var(--text-muted)' 
                  }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 'bold' }}>{profile.name}</span>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{profile.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quality thread warning logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div className="tree-cat-header">Digital Twin Risk Diagnostics</div>
              <div style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {materialType !== 'mmc' && gate1Status === 'microcrack_detected' && (
                  <div style={{ color: 'var(--accent-magenta)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>⚠️ STAMPING CRACK PROPAGATION: Longitudinal sills risk cracking under dynamic road chicanes.</span>
                  </div>
                )}
                {gate3Status === 'uneven_load_detected' && (
                  <div style={{ color: 'var(--accent-magenta)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: '1px' }} />
                    <span>⚠️ TORSIONAL TWIST EXCEEDED: Unbalanced battery tray bolts create localized twisting stress.</span>
                  </div>
                )}
                {materialType === 'mmc' && gate1Status === 'nominal' && gate3Status === 'nominal' && (
                  <div style={{ color: 'var(--accent-green)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Shield size={12} style={{ flexShrink: 0 }} />
                    <span>✅ INTEGRITY VERIFIED: Advanced Al-SiCp spaceframe isolates stresses. Failure probability: &lt;0.001%.</span>
                  </div>
                )}
                {materialType !== 'mmc' && gate1Status === 'nominal' && gate3Status === 'nominal' && (
                  <div style={{ color: 'var(--accent-green)', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Shield size={12} style={{ flexShrink: 0 }} />
                    <span>✅ PASS: Normal alloy frame checking complete. Structural failure probability: 0.14%.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Birth Certificate Generation button */}
            <button 
              className="technical-action-btn"
              onClick={() => {
                const results = `
VIN: VIN-TATA-ACTIEV-${Math.floor(100000 + Math.random() * 900000)}
[G1 STAMPING ARS]: ${materialType === 'mmc' ? 'PASSED (MMC INFUSED)' : gate1Status === 'nominal' ? 'PASSED' : 'WARNING (FISSURES)'}
[G2 WELDING THERMAL]: ${gate2Status === 'nominal' || materialType === 'mmc' ? 'PASSED' : 'WARNING (COLD WELD)'}
[G3 MARRIAGE ULTRASONIC]: ${gate3Status === 'nominal' ? 'PASSED' : 'WARNING (LOOSE BOLTS)'}
[ALLOY SYSTEM]: ${materialType.toUpperCase()}
[RIGIDITY INDEX]: ${materialType === 'mmc' ? '32,500 N-m/deg' : '26,800 N-m/deg'}
[RESULT]: ${gate1Status === 'nominal' && gate2Status === 'nominal' && gate3Status === 'nominal' ? 'NOMINAL BIRTH SECURED' : 'QUALITY DISCREPANCY REGISTERED'}
                `;
                addConsoleLog('Birth Certificate exported successfully.', 'system');
                alert(results);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px',
                background: 'var(--accent-cyan-dim)',
                border: '1px solid var(--accent-cyan)',
                color: 'var(--accent-cyan)',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              <FileCheck size={13} />
              EXPORT VIN BIRTH CERTIFICATE
            </button>
          </div>
        </>
      )}

      {/* ================= MMC MATERIAL INNOVATION (GATE 5) ================= */}
      {activeTab === 'mmc' && (
        <>
          <div className="panel-header">
            <h3>
              <Layers size={14} className="app-logo" />
              Gate 5: MMC Innovation
            </h3>
            <span className="app-subtitle">AL-SICP MMC STUDY</span>
          </div>

          <div className="tree-container-scroll" style={{ flex: '1', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
            <p className="helper-text">
              Infusing aluminum alloy with Silicon Carbide (SiC) ceramic nanoparticles (5% to 10% volume) halts crack propagation and dampens shockwaves.
            </p>

            {/* Slider parameters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="control-item">
                <div className="control-label-row">
                  <span>SiC Nanoparticle Volume</span>
                  <span className="control-val" style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
                    {mmcConcentration.toFixed(1)}%
                  </span>
                </div>
                <input 
                  type="range"
                  className="cad-slider"
                  min="5.0"
                  max="10.0"
                  step="0.5"
                  value={mmcConcentration}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setMmcConcentration(val);
                    if (val >= 5.0) {
                      setGate1Status('nominal');
                    }
                  }}
                />
              </div>

              <div className="control-item">
                <div className="control-label-row">
                  <span>Sill Wall Thickness</span>
                  <span className="control-val">{sillThickness.toFixed(1)} mm</span>
                </div>
                <input 
                  type="range"
                  className="cad-slider"
                  min="2.0"
                  max="4.0"
                  step="0.1"
                  value={sillThickness}
                  onChange={(e) => setSillThickness(parseFloat(e.target.value))}
                />
              </div>
            </div>

            {/* Mechanical Benefits readouts */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '4px',
              padding: '10px 14px',
              fontSize: '11px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '4px'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                MMC MECHANICAL ADVANTAGES
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Weight Reduction (Chassis sills):</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                  {((4.0 - sillThickness) / 4.0 * 15 + 5).toFixed(1)}% lightened
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Compressive Yield Strength:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>480 MPa (Double standard Al)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Crack Propagation Resistance:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-green)' }}>INFINITE (Nanoparticle blocking)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Thermal transfer shield:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>+120% insulation vs Steel sills</span>
              </div>
            </div>

            <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
              ℹ️ Silicon Carbide nanoparticles act as physical barrier nodes. If a micro-fissure initiates during stamping, it hits a SiC node and immediately terminates.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
export default LeftPanel;