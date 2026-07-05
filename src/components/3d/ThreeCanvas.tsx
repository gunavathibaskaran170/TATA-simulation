import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { CarModel } from './CarModel';
import { EvChassisModel } from './EvChassisModel';
import { 
  Maximize2, 
  Compass, 
  Move, 
  RotateCw, 
  Maximize,
  Focus,
  RotateCcw
} from 'lucide-react';
import type { VehicleComponent, Sensor, VehicleStructure } from '../../App';

interface ThreeCanvasProps {
  driveProfile?: 'static' | 'braking' | 'acceleration' | 'slalom' | 'pothole' | 'side_impact';
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
  focusTargetId: string | null;
  setFocusTargetId: (id: string | null) => void;
  addConsoleLog: (text: string, type?: 'info' | 'warning' | 'system') => void;
  simulating: boolean;
  timelineVal: number;
  viewMode: 'realistic' | 'structural' | 'exploded';
  setViewMode: (mode: 'realistic' | 'structural' | 'exploded') => void;
  transformMode: 'translate' | 'rotate' | 'scale';
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  viewTheme: 'engineering' | 'realistic' | 'study';
  colorMode: 'dark' | 'light';

  // Custom states
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

// Function to compute component centers
export const getComponentCenter = (component: VehicleComponent): [number, number, number] => {
  return component.position;
};

// Interpolates Camera focus & Presets
const CameraController = ({ 
  focusTargetId, 
  setFocusTargetId, 
  components,
  presetView,
  setPresetView
}: { 
  focusTargetId: string | null; 
  setFocusTargetId: (id: string | null) => void;
  components: VehicleComponent[];
  presetView: string | null;
  setPresetView: (view: string | null) => void;
}) => {
  const controlsRef = useRef<any>(null);
  
  const targetLookAt = useRef(new THREE.Vector3(0, 0.4, 0));
  const targetCamPos = useRef(new THREE.Vector3(4.5, 2.5, 4.5));
  const [transitioning, setTransitioning] = useState(false);

  // Triggered on component focus click
  useEffect(() => {
    if (focusTargetId) {
      const component = components.find(c => c.id === focusTargetId);
      if (component) {
        const center = getComponentCenter(component);
        targetLookAt.current.set(center[0], center[1], center[2]);
        // Offset camera position relative to component center
        targetCamPos.current.set(center[0] + 1.8, center[1] + 1.0, center[2] + 2.0);
        setTransitioning(true);
      }
      setFocusTargetId(null);
    }
  }, [focusTargetId, components, setFocusTargetId]);

  // Triggered on Preset View click
  useEffect(() => {
    if (presetView) {
      if (presetView === 'iso') {
        targetLookAt.current.set(0, 0.4, 0);
        targetCamPos.current.set(4.5, 2.5, 4.5);
      } else if (presetView === 'twin') {
        targetLookAt.current.set(0, 0.4, 0);
        targetCamPos.current.set(4.5, 2.0, -4.5); // angled looking forward & to the left, viewing the right side
      } else if (presetView === 'front') {
        targetLookAt.current.set(0, 0.4, 0);
        targetCamPos.current.set(6.0, 0.4, 0.001); // offset slightly Z to prevent camera gymbal lock
      } else if (presetView === 'rear') {
        targetLookAt.current.set(0, 0.4, 0);
        targetCamPos.current.set(-6.0, 0.4, 0);
      } else if (presetView === 'side') {
        targetLookAt.current.set(0, 0.4, 0);
        targetCamPos.current.set(0, 0.4, 6.0);
      } else if (presetView === 'top') {
        targetLookAt.current.set(0, 0.2, 0);
        targetCamPos.current.set(0.001, 7.0, 0);
      } else if (presetView === 'bottom') {
        targetLookAt.current.set(0, 0.2, 0);
        targetCamPos.current.set(0.001, -5.0, 0);
      }
      setTransitioning(true);
      setPresetView(null);
    }
  }, [presetView, setPresetView]);

  useFrame((state) => {
    if (transitioning && controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      state.camera.position.lerp(targetCamPos.current, 0.08);
      controlsRef.current.update();
      
      const distLook = controlsRef.current.target.distanceTo(targetLookAt.current);
      const distCam = state.camera.position.distanceTo(targetCamPos.current);
      if (distLook < 0.02 && distCam < 0.02) {
        setTransitioning(false);
      }
    }
  });

  return (
    <OrbitControls 
      ref={controlsRef} 
      enableDamping 
      dampingFactor={0.05} 
      minDistance={1.0} 
      maxDistance={15}
      target={[0, 0.4, 0]}
    />
  );
};

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  activeTab,
  driveProfile = 'static',
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
  focusTargetId,
  setFocusTargetId,
  addConsoleLog,
  simulating,
  timelineVal,
  viewMode,
  transformMode,
  setTransformMode,
  viewTheme,
  colorMode,
  
  // Custom props
  stampingStrike,
  weldInspect,
  ultrasonicPulse,
  boltTensions,
  selectedBolt,
  setSelectedBolt,
  materialType,
  mmcConcentration,
  sillThickness,
  gate1Status,
  gate2Status,
  gate3Status,
  visibleLayers = { spaceframe: true, body: true, battery: true, powertrain: true, interior: true },
  dismantleFactor = 0.0
}) => {
  const [presetView, setPresetView] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-align camera when entering the Digital Twin tab
  useEffect(() => {
    if (activeTab === 'twin') {
      setPresetView('twin');
    }
  }, [activeTab]);

  interface JointTooltipData {
    id: string;
    name: string;
    status: 'nominal' | 'anomaly';
    x: number;
    y: number;
  }
  const [jointTooltip, setJointTooltip] = useState<JointTooltipData | null>(null);

  const handleJointClick = (joint: { id: string; name: string; status: 'nominal' | 'anomaly'; event: any }) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? (joint.event.clientX - rect.left) : joint.event.clientX;
    const y = rect ? (joint.event.clientY - rect.top) : joint.event.clientY;
    
    setJointTooltip({
      id: joint.id,
      name: joint.name,
      status: joint.status,
      x,
      y
    });
  };

  const getJointHistory = (id: string) => {
    switch (id) {
      case 'joint_stamping':
        return {
          title: 'ARS Acoustic Resonance Trend',
          unit: 'Hz',
          history: [
            { run: 'Run #38', val: 420, label: 'NOMINAL' },
            { run: 'Run #39', val: 418, label: 'NOMINAL' },
            { run: 'Run #40', val: 421, label: 'NOMINAL' },
            { run: 'Run #41', val: 382, label: 'ANOMALY' },
            { run: 'Run #42 (Active)', val: gate1Status === 'nominal' || materialType === 'mmc' ? 420 : 380, label: gate1Status === 'nominal' || materialType === 'mmc' ? 'NOMINAL' : 'MICROCRACK' }
          ],
          recommendation: gate1Status === 'nominal' || materialType === 'mmc'
            ? 'Continue Production: Sill structural rigidity matches nominal signature.'
            : 'Rework Required: Acoustic decay limit exceeded. Route chassis sill for reinforcement.'
        };
      case 'joint_welding':
        return {
          title: 'IR Seam Cooling Decays',
          unit: '°C/s',
          history: [
            { run: 'Run #38', val: 18.2, label: 'NOMINAL' },
            { run: 'Run #39', val: 17.9, label: 'NOMINAL' },
            { run: 'Run #40', val: 31.4, label: 'VOID ANOMALY' },
            { run: 'Run #41', val: 18.0, label: 'NOMINAL' },
            { run: 'Run #42 (Active)', val: gate2Status === 'nominal' ? 18.5 : 33.0, label: gate2Status === 'nominal' ? 'NOMINAL' : 'COLD WELD' }
          ],
          recommendation: gate2Status === 'nominal'
            ? 'Continue Production: Weld seam penetration holds specification limits.'
            : 'Immediate Line Stop: Void gap detected in joint ST2. Clean laser emitter head.'
        };
      case 'joint_marriage':
        return {
          title: 'Bolting Fastening Torque Profile',
          unit: 'kN',
          history: [
            { run: 'Run #38', val: 15.1, label: 'NOMINAL' },
            { run: 'Run #39', val: 14.8, label: 'NOMINAL' },
            { run: 'Run #40', val: 15.3, label: 'NOMINAL' },
            { run: 'Run #41', val: 11.2, label: 'ANOMALY' },
            { run: 'Run #42 (Active)', val: gate3Status === 'nominal' ? 15.0 : 11.8, label: gate3Status === 'nominal' ? 'NOMINAL' : 'LOOSE CLAMP' }
          ],
          recommendation: gate3Status === 'nominal'
            ? 'Continue Production: Underbody lock bolts achieved target 15 kN tension.'
            : 'Rework Required: Mount clamp #4 holds insufficient preload. Initiate retorque.'
        };
      default:
        return null;
    }
  };

  // Placement coordinates for snapping ghost rendering
  const [ghostPos, setGhostPos] = useState<[number, number, number] | null>(null);
  const [ghostComp, setGhostComp] = useState<string | null>(null);

  // Clear ghost indicators if placement mode is deactivated
  useEffect(() => {
    if (!activePlacingSensor && !activePlacingComponent) {
      setGhostPos(null);
      setGhostComp(null);
    }
  }, [activePlacingSensor, activePlacingComponent]);

  return (
    <div ref={containerRef} className="canvas-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Raycast Snap Mode Notification Indicator */}
      {(activePlacingSensor || activePlacingComponent) && (
        <div className="ghost-indicator">
          <Maximize2 size={12} />
          <span>
            {activePlacingSensor 
              ? `RAYCAST SENSOR PLACEMENT: Hover over chassis rails to snap sensor ghost node`
              : `CAD ASSEMBLY SNAP: Hover over chassis to place new structural component`
            }
          </span>
        </div>
      )}

      {/* CAD Gizmo mode selector toolbar overlaying WebGL */}
      {selectedComponentId && viewMode !== 'realistic' && (
        <div className="canvas-hud-toolbar" title="CAD Transform Gizmo Mode">
          <button 
            className={`hud-tool-btn ${transformMode === 'translate' ? 'active' : ''}`}
            onClick={() => setTransformMode('translate')}
            title="Translate Gizmo (Move)"
          >
            <Move size={14} />
          </button>
          <button 
            className={`hud-tool-btn ${transformMode === 'rotate' ? 'active' : ''}`}
            onClick={() => setTransformMode('rotate')}
            title="Rotate Gizmo (Turn)"
          >
            <RotateCw size={14} />
          </button>
          <button 
            className={`hud-tool-btn ${transformMode === 'scale' ? 'active' : ''}`}
            onClick={() => setTransformMode('scale')}
            title="Scale Gizmo (Size)"
          >
            <Maximize size={14} />
          </button>
        </div>
      )}

      {/* R3F Canvas */}
      <Canvas 
        shadows 
        camera={{ position: [4.5, 2.5, 4.5], fov: 45 }}
        style={{ background: 'var(--bg-darker)' }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      >
        <color attach="background" args={[colorMode === 'light' ? '#f1f5f9' : '#030406']} />

        {/* Unified 3-point Studio Setup */}
        <ambientLight intensity={1.5} color="#94A3B8" />
        <directionalLight position={[12, 18, 12]} intensity={3.5} color="#FFFFFF" castShadow />
        <directionalLight position={[-12, -8, -12]} intensity={2.8} color="#00F0FF" />
        
        {/* Dynamic Studio HDR reflections in Realistic vehicle mode */}
        {viewTheme === 'realistic' && <Environment preset="city" />}
        
        {/* Floor grid helper shown only in structural/exploded/engineering modes */}
        {viewTheme !== 'realistic' && (
          <Grid 
            position={[0, 0, 0]}
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor={colorMode === 'light' ? '#cbd5e1' : '#1e293b'}
            sectionSize={2}
            sectionThickness={1.0}
            sectionColor={colorMode === 'light' ? '#94a3b8' : '#334155'}
            fadeDistance={12}
            fadeStrength={1}
            infiniteGrid
          />
        )}

        {/* Dynamic parametric components & SUV model */}
        {['stamping', 'welding', 'marriage'].includes(activeTab) ? (
          <group>
            <EvChassisModel 
              activeStation={activeTab === 'stamping' ? 1 : activeTab === 'welding' ? 2 : 3}
              hasFailed={gate1Status === 'microcrack_detected' || gate2Status === 'cold_weld_detected' || gate3Status === 'uneven_load_detected'}
              failStation={gate1Status === 'microcrack_detected' ? 1 : gate2Status === 'cold_weld_detected' ? 2 : gate3Status === 'uneven_load_detected' ? 3 : 0}
              gate1Status={gate1Status}
              gate2Status={gate2Status}
              gate3Status={gate3Status}
              materialType={materialType}
              onJointClick={(id, name, status, event) => handleJointClick({ id, name, status, event })}
              clamping={boltTensions.reduce((a, b) => a + b, 0) / boltTensions.length}
              frequency={gate1Status === 'microcrack_detected' ? 380 : 420}
              clearance={gate2Status === 'cold_weld_detected' ? 7.5 : 12.0}
              coolingRate={gate2Status === 'cold_weld_detected' ? 33.0 : 18.5}
              isInteractive={true}
            />
          </group>
        ) : (
          <CarModel 
            onJointClick={handleJointClick}
            activeTab={activeTab}
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
            simulating={simulating}
            timelineVal={timelineVal}
            ghostPos={ghostPos}
            setGhostPos={setGhostPos}
            ghostComp={ghostComp}
            setGhostComp={setGhostComp}
            viewMode={viewMode}
            transformMode={transformMode}
            addConsoleLog={addConsoleLog}
            viewTheme={viewTheme}
            colorMode={colorMode}
            
            // Forward custom states to CarModel
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

        {/* Camera Lerper and Auto Focus */}
        <CameraController 
          focusTargetId={focusTargetId}
          setFocusTargetId={setFocusTargetId}
          components={components}
          presetView={presetView}
          setPresetView={setPresetView}
        />
      </Canvas>

      {/* Preset CAD camera controls overlay */}
      <div className="view-overlay-tools">
        <button 
          className="overlay-btn" 
          onClick={() => setPresetView('iso')} 
          title="Isometric View (ISO)"
        >
          <Compass size={15} />
        </button>
        <button 
          className="overlay-btn" 
          onClick={() => setPresetView('top')} 
          title="Top Ortho View"
        >
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>TOP</span>
        </button>
        <button 
          className="overlay-btn" 
          onClick={() => setPresetView('front')} 
          title="Front Profile View"
        >
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>FRNT</span>
        </button>
        <button 
          className="overlay-btn" 
          onClick={() => setPresetView('rear')} 
          title="Rear Profile View"
        >
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>REAR</span>
        </button>
        <button 
          className="overlay-btn" 
          onClick={() => setPresetView('side')} 
          title="Side Profile View"
        >
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>SIDE</span>
        </button>
        <button 
          className="overlay-btn" 
          onClick={() => setPresetView('bottom')} 
          title="Bottom Floor View"
        >
          <span style={{ fontSize: '9px', fontWeight: 'bold' }}>BTTM</span>
        </button>
        <button 
          className="overlay-btn" 
          onClick={() => {
            if (selectedComponentId) {
              setFocusTargetId(selectedComponentId);
            } else {
              addConsoleLog('Select a component in the tree to focus camera.', 'warning');
            }
          }} 
          title="Focus Selected Part"
        >
          <Focus size={15} />
        </button>
        <button 
          className="overlay-btn" 
          onClick={() => setPresetView('iso')} 
          title="Reset Camera Workstation"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      {jointTooltip && (
        <div 
          className="joint-tooltip-card border-glow"
          style={{
            position: 'absolute',
            left: `${Math.min(jointTooltip.x, (containerRef.current?.clientWidth || 800) - 285)}px`,
            top: `${Math.min(jointTooltip.y, (containerRef.current?.clientHeight || 600) - 235)}px`,
            zIndex: 15,
            width: '270px',
            background: 'var(--panel-bg)',
            backdropFilter: 'blur(12px)',
            border: `1.5px solid ${jointTooltip.status === 'anomaly' ? 'var(--accent-magenta)' : 'var(--accent-green)'}`,
            borderRadius: '8px',
            padding: '12px',
            boxShadow: `var(--shadow-lg), 0 0 15px ${jointTooltip.status === 'anomaly' ? 'var(--accent-magenta-dim)' : 'var(--accent-green-dim)'}`,
            pointerEvents: 'auto',
            animation: 'label-entrance 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '4px' }}>
            <span style={{ fontSize: '9.5px', fontWeight: 'bold', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              {jointTooltip.name}
            </span>
            <button 
              onClick={() => setJointTooltip(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                padding: '0 4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Telemetry Trend */}
          {(() => {
            const data = getJointHistory(jointTooltip.id);
            if (!data) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  HISTORICAL DATA ({data.title})
                </div>
                
                {/* SVG Mini Chart */}
                <div style={{ height: '52px', position: 'relative', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', border: '1px solid var(--panel-border)' }}>
                  <svg width="100%" height="100%" viewBox="0 0 240 52">
                    {/* Grid lines */}
                    <line x1="0" y1="13" x2="240" y2="13" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="26" x2="240" y2="26" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    <line x1="0" y1="39" x2="240" y2="39" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    
                    {/* Line Path */}
                    {(() => {
                      const points = data.history.map((h, idx) => {
                        const x = 20 + idx * 50;
                        const maxVal = Math.max(...data.history.map(x => x.val));
                        const minVal = Math.min(...data.history.map(x => x.val));
                        const range = maxVal - minVal || 1;
                        const y = 42 - ((h.val - minVal) / range) * 30;
                        return { x, y, run: h.run, val: h.val, label: h.label };
                      });
                      
                      const pathD = points.reduce((acc, p, idx) => {
                        return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                      }, '');
                      
                      return (
                        <>
                          <path d={pathD} fill="none" stroke={jointTooltip.status === 'anomaly' ? 'var(--accent-magenta)' : 'var(--accent-green)'} strokeWidth="2" />
                          {points.map((p, idx) => (
                            <g key={idx}>
                              <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r={idx === 4 ? 4 : 3} 
                                fill={p.label.includes('ANOMALY') || p.label.includes('MICROCRACK') || p.label.includes('VOID') || p.label.includes('SLIP') || p.label.includes('UNDER') ? '#ef4444' : '#10b981'} 
                                stroke="#fff"
                                strokeWidth="1"
                              />
                              <text x={p.x} y={p.y - 6} fill="var(--text-primary)" fontSize="6" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
                                {p.val.toFixed(0)}{data.unit}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Recommendations */}
                <div style={{
                  background: jointTooltip.status === 'anomaly' ? 'var(--accent-magenta-dim)' : 'var(--accent-green-dim)',
                  border: `1px solid ${jointTooltip.status === 'anomaly' ? 'var(--accent-magenta)' : 'var(--accent-green)'}`,
                  borderRadius: '4px',
                  padding: '6px 8px',
                  fontSize: '8.5px',
                  color: jointTooltip.status === 'anomaly' ? 'var(--accent-magenta)' : 'var(--accent-green)',
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 'bold',
                  lineHeight: '1.2'
                }}>
                  <div style={{ fontSize: '7.5px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '3px' }}>
                    AI ROUTING RECOMMENDATION:
                  </div>
                  {data.recommendation}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
export default ThreeCanvas;
