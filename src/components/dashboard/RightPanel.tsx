import React from 'react';
import { 
  Sliders, 
  SlidersHorizontal,
  Cpu,
  Shield,
  Activity
} from 'lucide-react';
import type { VehicleComponent, Sensor, VehicleStructure } from '../../App';

interface RightPanelProps {
  collapsed?: boolean;
  driveProfile?: 'static' | 'braking' | 'acceleration' | 'slalom' | 'pothole' | 'side_impact';
  activeTab: 'sen' | 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc';
  selectedComponentId: string | null;
  setSelectedComponentId: (id: string | null) => void;
  selectedSensorId: string | null;
  setSelectedSensorId: (id: string | null) => void;
  vehicleStructure: VehicleStructure;
  setVehicleStructure: React.Dispatch<React.SetStateAction<VehicleStructure>>;
  placedSensors: Sensor[];
  setPlacedSensors: React.Dispatch<React.SetStateAction<Sensor[]>>;
  addConsoleLog: (text: string, type?: 'info' | 'warning' | 'system') => void;
  setFocusTargetId: (id: string | null) => void;
  simulating: boolean;
  components: VehicleComponent[];
  setComponents: React.Dispatch<React.SetStateAction<VehicleComponent[]>>;
  transformMode: 'translate' | 'rotate' | 'scale';
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;

  // Custom states
  materialType: 'steel' | 'aluminum' | 'mmc';
  setMaterialType: (type: 'steel' | 'aluminum' | 'mmc') => void;
  mmcConcentration: number;
  setMmcConcentration: (val: number) => void;
  sillThickness: number;
  setSillThickness: (val: number) => void;
  boltTensions: number[];
  setBoltTensions: React.Dispatch<React.SetStateAction<number[]>>;
  selectedBolt: number | null;
  setSelectedBolt: (index: number | null) => void;
  gate1Status: 'nominal' | 'microcrack_detected';
  gate2Status: 'nominal' | 'cold_weld_detected';
  gate3Status: 'nominal' | 'uneven_load_detected';

  // SEN props
  senLoadVal?: number;
  senVibeVal?: number;
  senDistVal?: number;
  senInspectionState?: 'idle' | 'running' | 'complete';
}

const componentStaticData: Record<string, {
  name: string;
  baseWeight: number;
  baseStress: number;
  desc: string;
}> = {
  leftRail: { name: '🛤️ Left Longitudinal Sill', baseWeight: 35.4, baseStress: 120, desc: 'Primary left chassis load-bearing longitudinal box sills.' },
  rightRail: { name: '🛤️ Right Longitudinal Sill', baseWeight: 35.4, baseStress: 120, desc: 'Primary right chassis load-bearing longitudinal box sills.' },
  frontCrossMember: { name: '🔗 Front Cross Member', baseWeight: 10.5, baseStress: 85, desc: 'Front bumper structural support member.' },
  midCrossMember: { name: '🔗 Middle Cross Member', baseWeight: 14.2, baseStress: 105, desc: 'Sub-assembly battery tray support member.' },
  rearCrossMember: { name: '🔗 Rear Cross Member', baseWeight: 9.8, baseStress: 75, desc: 'Rear chassis frame support link.' },
  batteryBox: { name: '🔋 Battery Pack Enclosure', baseWeight: 40.0, baseStress: 55, desc: 'Structural containment box for battery modules, bolted directly to chassis sills.' },
  edgeController: { name: '🧠 NVIDIA Jetson Orin Controller', baseWeight: 1.8, baseStress: 10, desc: 'Core Edge AI Embedded ECU executing real-time ARS wave processing.' },
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
  yieldStrength: number; // MPa
  elasticModulus: number; // GPa
  density: number; // kg/m^3
  costFactor: number;
  weightFactor: number;
}> = {
  steel: { name: 'Steel AISI 4130', yieldStrength: 460, elasticModulus: 205, density: 7850, costFactor: 1.0, weightFactor: 1.0 },
  aluminum: { name: 'Aluminum 6061-T6', yieldStrength: 276, elasticModulus: 68.9, density: 2700, costFactor: 2.1, weightFactor: 0.35 },
  carbon: { name: 'Carbon Fiber CFRP', yieldStrength: 600, elasticModulus: 150, density: 1600, costFactor: 5.5, weightFactor: 0.20 },
  titanium: { name: 'Titanium Grade 5', yieldStrength: 880, elasticModulus: 113.8, density: 4430, costFactor: 6.8, weightFactor: 0.56 },
  lithium: { name: 'Lithium Pack Assembly', yieldStrength: 200, elasticModulus: 50, density: 2200, costFactor: 8.5, weightFactor: 0.60 },
  mmc: { name: 'Al-SiCp MMC (10% SiC)', yieldStrength: 480, elasticModulus: 98.5, density: 2850, costFactor: 4.2, weightFactor: 0.30 }
};

export const RightPanel: React.FC<RightPanelProps> = ({
  collapsed,
  activeTab,
  driveProfile = 'static',
  selectedComponentId,
  setSelectedComponentId,
  components,
  setComponents,
  addConsoleLog,
  simulating,

  // Custom states
  materialType,
  setMaterialType,
  mmcConcentration,
  sillThickness,
  boltTensions,
  selectedBolt,
  setSelectedBolt,
  gate1Status,
  gate2Status,
  gate3Status,

  // SEN props
  senLoadVal,
  senVibeVal,
  senDistVal,
  senInspectionState
}) => {

  // SHIELD Edge Node (SEN) Inspector
  const renderSenInspector = () => {
    const isLoadOk = (senLoadVal! >= 2.0 && senLoadVal! <= 4.5);
    const isVibeOk = (senVibeVal! < 0.3);
    const isDistOk = (senDistVal! >= 35.0 && senDistVal! <= 45.0);
    const isPass = isLoadOk && isVibeOk && isDistOk;

    return (
      <div className="panel-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span className="section-title">SEN Telemetry Dashboard</span>
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
            COM4 BRIDGE
          </span>
        </div>

        <div className="inspector-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Edge Computing Decisions
            </span>
            <div style={{
              marginTop: '6px',
              padding: '12px',
              borderRadius: '4px',
              background: senInspectionState === 'idle' 
                ? 'rgba(59, 130, 246, 0.08)' 
                : senInspectionState === 'running' 
                  ? 'rgba(234, 179, 8, 0.08)' 
                  : isPass ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
              border: '1px solid var(--panel-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Inspection Mode:</span>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 'bold',
                  color: senInspectionState === 'idle' 
                    ? 'var(--accent-cyan)' 
                    : senInspectionState === 'running' 
                      ? 'var(--accent-yellow)' 
                      : isPass ? 'var(--accent-green)' : 'var(--accent-magenta)'
                }}>
                  {senInspectionState === 'idle' && 'STANDBY'}
                  {senInspectionState === 'running' && 'RUNNING SWEEP'}
                  {senInspectionState === 'complete' && (isPass ? 'PASS (NOMINAL)' : 'FAIL (ANOMALY)')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Buzzer Alarm:</span>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: (!isPass && senInspectionState === 'complete') ? 'var(--accent-magenta)' : 'var(--text-muted)' }}>
                  {(!isPass && senInspectionState === 'complete') ? 'ACTIVE (PULSED)' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '10px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Edge Sensor Status
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <div className="spec-row">
                <span className="spec-label">HX711 Load Cell:</span>
                <span className="spec-val" style={{ color: isLoadOk ? 'var(--accent-green)' : 'var(--accent-magenta)', fontWeight: 'bold' }}>
                  {isLoadOk ? 'NOMINAL' : 'ANOMALY (LOAD ERROR)'}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-label">MPU6050 Vibration:</span>
                <span className="spec-val" style={{ color: isVibeOk ? 'var(--accent-green)' : 'var(--accent-magenta)', fontWeight: 'bold' }}>
                  {isVibeOk ? 'NOMINAL' : 'EXCESSIVE FAULT'}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-label">HC-SR04 Clearance:</span>
                <span className="spec-val" style={{ color: isDistOk ? 'var(--accent-green)' : 'var(--accent-magenta)', fontWeight: 'bold' }}>
                  {isDistOk ? 'NOMINAL' : 'ALIGNMENT FAULT'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '10px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Node I/O Port Mapping
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>UART Baud Rate:</span>
                <span style={{ color: '#fff' }}>115200 bps</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>I2C Address List:</span>
                <span style={{ color: '#fff' }}>0x3C (OLED), 0x68 (IMU)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>HX711 Pins:</span>
                <span style={{ color: '#fff' }}>D2 (DOUT), D3 (SCK)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ultrasonic Pins:</span>
                <span style={{ color: '#fff' }}>D4 (TRIG), D5 (ECHO)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Gate 1 Inspector (Stamping)
  const renderStampingInspector = () => {
    if (selectedComponentId === 'leftRail' || selectedComponentId === 'rightRail') {
      const comp = components.find(c => c.id === selectedComponentId);
      if (!comp) return null;
      const compStatic = componentStaticData[comp.id] || { name: comp.name, baseWeight: 35, desc: '' };
      const materialSpec = materialSpecs[comp.material] || materialSpecs.steel;
      
      return (
        <div className="panel-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span className="section-title">{comp.name}</span>
            <button className="text-action-btn" onClick={() => setSelectedComponentId(null)} style={{ fontSize: '9px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              CLOSE
            </button>
          </div>
          
          <div className="inspector-group">
            <div className="spec-row">
              <span className="spec-label">Sill Stamping Precision</span>
              <span className="spec-val" style={{ color: gate1Status === 'nominal' || comp.material === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)', fontWeight: 'bold' }}>
                {gate1Status === 'nominal' || comp.material === 'mmc' ? 'NOMINAL' : '⚠️ MICRO-CRACK DETECTED'}
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Wall Thickness</span>
              <span className="spec-val">{sillThickness.toFixed(1)} mm</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Material Alloy Class</span>
              <span className="spec-val" style={{ color: 'var(--accent-cyan)' }}>{materialSpec.name}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Est. Sill Weight</span>
              <span className="spec-val">{(compStatic.baseWeight * materialSpec.weightFactor * (sillThickness / 4.0)).toFixed(1)} kg</span>
            </div>
            
            <p className="helper-text" style={{ margin: '10px 0' }}>
              {comp.material === 'mmc' 
                ? 'Infused with SiC nanoparticles. Acoustic wave strikes show exceptional self-damping, stopping stamping fissure propagation.'
                : compStatic.desc
              }
            </p>
            
            <div className="control-item" style={{ marginTop: '16px' }}>
              <div className="control-label-row">
                <span>Alloy Material Spec</span>
              </div>
              <select 
                className="technical-select"
                value={comp.material}
                onChange={(e) => {
                  const mat = e.target.value as any;
                  setComponents(prev => prev.map(c => c.id === comp.id ? { ...c, material: mat } : c));
                  if (mat === 'mmc') {
                    setMaterialType('mmc');
                  } else {
                    setMaterialType(mat);
                  }
                  addConsoleLog(`Changed longitudinal sill material to ${materialSpecs[mat]?.name}`, 'info');
                }}
                style={{
                  width: '100%',
                  background: 'var(--bg-darker)',
                  border: '1px solid var(--panel-border)',
                  color: '#fff',
                  padding: '6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)'
                }}
              >
                <option value="steel">Steel AISI 4130</option>
                <option value="aluminum">Aluminum 6061-T6</option>
                <option value="mmc">Al-SiCp MMC (10% SiC)</option>
              </select>
            </div>

            <div className="control-item" style={{ marginTop: '14px' }}>
              <div className="control-label-row">
                <span>Point Load Force</span>
                <span className="control-val">{comp.appliedLoad.toFixed(1)} kN</span>
              </div>
              <input 
                type="range"
                className="cad-slider"
                min="0.0"
                max="8.0"
                step="0.2"
                value={comp.appliedLoad}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setComponents(prev => prev.map(c => c.id === comp.id ? { ...c, appliedLoad: val } : c));
                }}
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="panel-body">
        <p className="helper-text" style={{ marginBottom: '16px' }}>
          Select Left or Right longitudinal sills in the viewport to inspect structural alloy properties, adjust point loads, or upgrade material classes to Al-SiCp MMCs.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '30px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          <SlidersHorizontal size={24} />
          <span style={{ fontSize: '10px' }}>No Longitudinal Sill Selected</span>
        </div>
      </div>
    );
  };

  // Gate 2 Inspector (Robotic Welding)
  const renderWeldingInspector = () => {
    if (selectedComponentId === 'batteryBox') {
      return (
        <div className="panel-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span className="section-title">Weld Bead Inspector</span>
            <button className="text-action-btn" onClick={() => setSelectedComponentId(null)} style={{ fontSize: '9px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              CLOSE
            </button>
          </div>

          <div className="inspector-group">
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '12px', marginBottom: '6px' }}>Robotic Marriage Weld Pool</h4>
            <p className="helper-text" style={{ marginBottom: '12px' }}>
              Robotic welding of flanges attaches the battery pack structure to longitudinal rails. IR cameras monitor the cooling decay rate profile.
            </p>

            <div className="spec-row">
              <span className="spec-label">Welding Status</span>
              <span className="spec-val" style={{ 
                color: gate2Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)', 
                fontWeight: 'bold' 
              }}>
                {gate2Status === 'nominal' || materialType === 'mmc' ? 'NOMINAL BEAD FUSION' : '⚠️ COLD WELD VULNERABILITY'}
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Weld Joint Porosity</span>
              <span className="spec-val">{gate2Status === 'nominal' || materialType === 'mmc' ? '0.04%' : '4.82% (High)'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Weld Pool Peak Temp</span>
              <span className="spec-val">1420 °C</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Weld Tip Voltage</span>
              <span className="spec-val" style={{ color: gate2Status === 'nominal' || materialType === 'mmc' ? 'var(--accent-green)' : 'var(--accent-magenta)' }}>
                {gate2Status === 'nominal' || materialType === 'mmc' ? '24.0 V (Nominal)' : '18.2 V (Voltage Drop!)'}
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Alloy Thermal Insulation</span>
              <span className="spec-val">
                {materialType === 'mmc' ? 'Excellent (+120%)' : 'Standard'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="panel-body">
        <p className="helper-text">
          Select the Battery Pack Enclosure directly in the 3D viewport to inspect the laser-bead alignment and thermal scan profiles of the robotic mounting welds.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '30px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          <Activity size={24} />
          <span style={{ fontSize: '10px' }}>Select Battery Enclosure to Inspect Welds</span>
        </div>
      </div>
    );
  };

  // Gate 3 Inspector (Battery Marriage)
  const renderMarriageInspector = () => {
    if (selectedBolt !== null) {
      const tension = boltTensions[selectedBolt];
      const isLow = tension < 15.0;
      // Calculate physical bolt elongation based on tension (Hooke's Law approximation)
      const elongation = (tension / 24.0) * 0.12; 
      const transitTime = 40.0 + elongation * 68.0; // microseconds ultrasonic transit time

      return (
        <div className="panel-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <span className="section-title">Bolt Tension Transducer</span>
            <button className="text-action-btn" onClick={() => setSelectedBolt(null)} style={{ fontSize: '9px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              CLOSE
            </button>
          </div>

          <div className="inspector-group">
            <h4 style={{ color: 'var(--accent-cyan)', fontSize: '12px', marginBottom: '6px' }}>Bolt #{selectedBolt + 1} Clamping Load</h4>
            <div className="spec-row">
              <span className="spec-label">Elongation (Ultrasonic)</span>
              <span className="spec-val" style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{elongation.toFixed(3)} mm</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Wave Transit Time</span>
              <span className="spec-val" style={{ fontFamily: 'var(--font-mono)' }}>{transitTime.toFixed(2)} μs</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Torque Check Feedback</span>
              <span className="spec-val" style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>24.0 N·m (OK Limit)</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Actual Axis Tension</span>
              <span className="spec-val" style={{ 
                color: isLow ? 'var(--accent-magenta)' : 'var(--accent-green)', 
                fontWeight: 'bold' 
              }}>
                {tension.toFixed(2)} kN
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Tension Integrity</span>
              <span className="spec-val" style={{ color: isLow ? 'var(--accent-magenta)' : 'var(--accent-green)' }}>
                {isLow ? '⚠️ LOOSE (Deceptive Torque!)' : 'NOMINAL LOAD'}
              </span>
            </div>

            <p className="helper-text" style={{ marginTop: '10px' }}>
              {selectedBolt === 3 && gate3Status !== 'nominal'
                ? 'IMPORTANT: A thread burr created frictional resistance registering as "fully tightened" on torque tools, but the bolt is loose, creating torsional twisting.'
                : 'Ultrasonic wave travel time directly measures physical elongation, guaranteeing uniform clamping load.'
              }
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="panel-body">
        <p className="helper-text">
          Select any bolt node in the Left tension grid (or click them directly in the battery marriage exploded view) to inspect direct elongation measurements and ultrasonic wave transit times.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '35px 10px', color: 'var(--text-muted)', textAlign: 'center' }}>
          <Cpu size={24} />
          <span style={{ fontSize: '10px' }}>No Bolt Selected for Inspection</span>
        </div>
      </div>
    );
  };

  // Gate 4 Inspector (Digital Twin & FEA)
  const renderTwinInspector = () => {
    // Dynamic values that fluctuate during simulation
    const speed = simulating 
      ? (88.0 + Math.sin(Date.now() / 250) * 0.3).toFixed(1) 
      : "88.0";
    
    let basePower = 345;
    if (driveProfile === 'braking') {
      basePower = -85;
    } else if (driveProfile === 'acceleration') {
      basePower = 482;
    } else if (driveProfile === 'slalom') {
      basePower = 220;
    } else if (driveProfile === 'pothole') {
      basePower = 110;
    } else if (driveProfile === 'side_impact') {
      basePower = 0;
    }

    const power = simulating
      ? (basePower + Math.sin(Date.now() / 180) * 4.5).toFixed(0)
      : basePower.toString();
      
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
      // Synthesize a complex waveform
      const y = 25 + Math.sin(t + i * 0.5) * 12 + Math.cos(t * 0.6 + i * 0.8) * 6;
      points.push(`${x},${y}`);
    }
    const pathD = `M 0,25 ${points.map(p => `L ${p}`).join(' ')}`;

    return (
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', overflowY: 'auto' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="section-title">Technical Twin HUD</span>
          <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
            FEA SYNCED
          </span>
        </div>

        {/* Flashing VEHICLE STATUS ACTIVE Header */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '6px',
          padding: '10px 12px',
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
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.08em',
              color: '#10b981',
              fontFamily: 'var(--font-mono)'
            }}>
              [VEHICLE STATUS: ACTIVE]
            </span>
          </div>
          <span style={{ fontSize: '9px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>TELEMETRY OK</span>
        </div>

        {/* Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          
          {/* Speed box */}
          <div style={{
            background: 'rgba(10, 15, 30, 0.7)',
            border: '1px solid var(--panel-border)',
            borderRadius: '4px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Current Speed
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {speed}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>km/h</span>
            </div>
          </div>

          {/* Drivetrain Power box */}
          <div style={{
            background: 'rgba(10, 15, 30, 0.7)',
            border: '1px solid var(--panel-border)',
            borderRadius: '4px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Drivetrain Power
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {power}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>kW</span>
            </div>
          </div>

          {/* Battery SoC box */}
          <div style={{
            background: 'rgba(10, 15, 30, 0.7)',
            border: '1px solid var(--panel-border)',
            borderRadius: '4px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Battery SoC
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                {soc}%
              </span>
            </div>
          </div>

          {/* Motor Temp box */}
          <div style={{
            background: 'rgba(10, 15, 30, 0.7)',
            border: '1px solid var(--panel-border)',
            borderRadius: '4px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Motor Temperature
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-yellow)', fontFamily: 'var(--font-mono)' }}>
                {temp}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>°C</span>
            </div>
          </div>

        </div>

        {/* Wheel Torque Block */}
        <div style={{
          background: 'rgba(10, 15, 30, 0.7)',
          border: '1px solid var(--panel-border)',
          borderRadius: '4px',
          padding: '10px 12px'
        }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
            Wheel Torque Distribution
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
            <div className="spec-row">
              <span className="spec-label" style={{ color: 'var(--text-secondary)' }}>Front Left:</span>
              <span className="spec-val" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{torqueFL} Nm</span>
            </div>
            <div className="spec-row">
              <span className="spec-label" style={{ color: 'var(--text-secondary)' }}>Front Right:</span>
              <span className="spec-val" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{torqueFR} Nm</span>
            </div>
            <div className="spec-row">
              <span className="spec-label" style={{ color: 'var(--text-secondary)' }}>Rear Left:</span>
              <span className="spec-val" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{torqueRL} Nm</span>
            </div>
            <div className="spec-row">
              <span className="spec-label" style={{ color: 'var(--text-secondary)' }}>Rear Right:</span>
              <span className="spec-val" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>{torqueRR} Nm</span>
            </div>
          </div>
        </div>

        {/* Suspension Travel */}
        <div style={{
          background: 'rgba(10, 15, 30, 0.7)',
          border: '1px solid var(--panel-border)',
          borderRadius: '4px',
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '4px' }}>
              Suspension Travel
            </span>
            <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#fff' }}>
              <span>Front: <b style={{ color: 'var(--accent-cyan)' }}>{travelFront} mm</b></span>
              <span>Rear: <b style={{ color: 'var(--accent-cyan)' }}>{travelRear} mm</b></span>
            </div>
          </div>
          <div style={{ width: '40px', height: '14px', border: '1px solid var(--panel-border)', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: '45%', height: '100%', background: 'var(--accent-cyan)', opacity: 0.6 }} />
            <div style={{ width: '55%', height: '100%', background: 'var(--accent-purple)', opacity: 0.6 }} />
          </div>
        </div>

        {/* System Integrity Oscilloscope */}
        <div style={{
          background: 'rgba(10, 15, 30, 0.7)',
          border: '1px solid var(--panel-border)',
          borderRadius: '4px',
          padding: '10px 12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              System Integrity Waveform
            </span>
            <span style={{ fontSize: '9px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>99.2% COHERENT</span>
          </div>
          <div style={{ width: '100%', height: '50px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
            {/* Grid background lines */}
            <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.03)' }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.03)' }} />
            
            <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
              <path 
                d={pathD} 
                fill="none" 
                stroke="var(--accent-cyan)" 
                strokeWidth="1.5" 
              />
            </svg>
          </div>
        </div>

        {/* QA Manufacturing Data */}
        <div style={{
          background: 'rgba(10, 15, 30, 0.7)',
          border: '1px solid var(--panel-border)',
          borderRadius: '4px',
          padding: '10px 12px',
          borderLeft: '3px solid var(--accent-cyan)'
        }}>
          <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
            QA Manufacturing Benchmark
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Clamping Force:</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>24.2 N·m</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Vibration Frequency:</span>
              <span style={{ color: '#fff', fontWeight: 'bold' }}>588 Hz</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Deflection Tolerance:</span>
              <span style={{ color: 'var(--accent-green)' }}>&lt; 0.50 mm (PASS)</span>
            </div>
          </div>
        </div>

      </div>
    );
  };

  // Gate 5 Inspector (MMC Material Innovation)
  const renderMmcInspector = () => {
    const isMmc = materialType === 'mmc';
    const density = isMmc ? 2850 : 2700;
    const yieldStrength = isMmc ? 480 : 276;
    const elasticity = isMmc ? 98.5 : 68.9;

    return (
      <div className="panel-body">
        <div style={{ marginBottom: '14px' }}>
          <span className="section-title">Al-SiCp MMC Materials Desk</span>
        </div>

        <div className="inspector-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', padding: '12px', borderRadius: '4px' }}>
            <div style={{
              width: '45px',
              height: '45px',
              borderRadius: '50%',
              border: '4px solid',
              borderColor: isMmc ? 'var(--accent-green)' : 'var(--accent-magenta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '11px',
              color: isMmc ? 'var(--accent-green)' : 'var(--accent-magenta)'
            }}>
              {isMmc ? `${mmcConcentration.toFixed(0)}%` : '0%'}
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={12} style={{ color: isMmc ? 'var(--accent-green)' : 'var(--accent-magenta)' }} />
                Silicon Carbide Nano-infusion
              </div>
              <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Ceramic reinforcement particulate volume</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="spec-row">
              <span className="spec-label">Alloy Compressive Yield</span>
              <span className="spec-val" style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{yieldStrength} MPa</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Modulus of Elasticity</span>
              <span className="spec-val" style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>{elasticity} GPa</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Material Density</span>
              <span className="spec-val">{density} kg/m³</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Crack Propagation Stop</span>
              <span className="spec-val" style={{ color: isMmc ? 'var(--accent-green)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                {isMmc ? 'ACTIVE (BLOCKING)' : 'VULNERABLE'}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '10px', marginTop: '4px' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Micro-Crack Particulate Barrier
            </span>
            <div style={{
              height: '80px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px dashed var(--panel-border)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              padding: '10px',
              lineHeight: '1.3',
              fontStyle: 'italic',
              marginTop: '6px'
            }}>
              {isMmc 
                ? 'Ceramic SiC nanoparticles act as pin-point obstacle barriers, blocking stamp fissures from expanding.'
                : 'Standard metal matrix offers no micro-structural obstacle barriers. Cracks propagate freely.'
              }
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={"sidebar-panel right" + (collapsed ? " collapsed" : "")}>
      <div className="panel-header">
        <h3>
          <Sliders size={14} className="app-logo" />
          {activeTab === 'sen' && 'SEN Telemetry'}
          {activeTab === 'stamping' && 'Stamping Inspector'}
          {activeTab === 'welding' && 'Welding Integrity'}
          {activeTab === 'marriage' && 'Elongation Transducer'}
          {activeTab === 'twin' && 'Digital Twin FEA'}
          {activeTab === 'mmc' && 'MMC Material Specs'}
        </h3>
      </div>
      
      {activeTab === 'sen' && renderSenInspector()}
      {activeTab === 'stamping' && renderStampingInspector()}
      {activeTab === 'welding' && renderWeldingInspector()}
      {activeTab === 'marriage' && renderMarriageInspector()}
      {activeTab === 'twin' && renderTwinInspector()}
      {activeTab === 'mmc' && renderMmcInspector()}
    </div>
  );
};
export default RightPanel;