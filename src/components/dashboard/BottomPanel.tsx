import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Terminal, 
  Trash2,
  LineChart
} from 'lucide-react';
import type { Sensor } from '../../App';

interface ConsoleLogEntry {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'system';
  timestamp: string;
}

interface BottomPanelProps {
  collapsed?: boolean;
  leftOffset?: string;
  rightOffset?: string;
  onCollapseToggle?: () => void;
  activeTab: 'sen' | 'stamping' | 'welding' | 'marriage' | 'twin' | 'mmc';
  simulating: boolean;
  setSimulating: (sim: boolean) => void;
  timelineVal: number;
  setTimelineVal: (val: number) => void;
  consoleLogs: ConsoleLogEntry[];
  clearConsoleLogs: () => void;
  addConsoleLog: (text: string, type?: 'info' | 'warning' | 'system') => void;
  placedSensors: Sensor[];
  viewTheme: 'engineering' | 'realistic' | 'study';
  
  // Custom states
  boltTensions: number[];
  materialType: 'steel' | 'aluminum' | 'mmc';
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  collapsed,
  leftOffset,
  rightOffset,
  onCollapseToggle,
  // ... other props
  activeTab,
  simulating,
  setSimulating,
  timelineVal,
  setTimelineVal,
  consoleLogs,
  clearConsoleLogs,
  addConsoleLog,
  placedSensors,
  viewTheme
}) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [chartHistory, setChartHistory] = useState<number[]>(Array(24).fill(25));

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Telemetry rolling charts history update loop
  useEffect(() => {
    if (simulating) {
      setChartHistory(prev => {
        const activeVal = placedSensors.length > 0 
          ? placedSensors[0].liveValue 
          : 25 + Math.sin(Date.now() / 100) * 12 + Math.random() * 4;
        
        return [...prev.slice(1), activeVal];
      });
    }
  }, [timelineVal, simulating, placedSensors]);

  const handlePlayToggle = () => {
    setSimulating(!simulating);
    addConsoleLog(
      simulating ? 'FEA physics simulation paused.' : 'Active stress solver & dynamic modal frequencies analyzer initialized.',
      simulating ? 'system' : 'info'
    );
  };

  const handleReset = () => {
    setSimulating(false);
    setTimelineVal(0);
    addConsoleLog('Simulation cycle reset to baseline (frame 0).', 'system');
  };

  const formatTime = (frame: number) => {
    const totalSeconds = frame / 30;
    return totalSeconds.toFixed(2) + "s";
  };

  // Build SVG Path from rolling values
  const buildSvgPath = () => {
    const width = 160;
    const height = 32;
    const maxVal = Math.max(...chartHistory, 60);
    const minVal = Math.min(...chartHistory, 0);
    const range = maxVal - minVal || 1;

    const points = chartHistory.map((val, idx) => {
      const x = (idx / (chartHistory.length - 1)) * width;
      const y = height - ((val - minVal) / range) * height;
      return x.toFixed(1) + "," + y.toFixed(1);
    });

    return "M " + points.join(" L ");
  };

  return (
    <div className={"bottom-container" + (collapsed ? " collapsed" : "")} style={{ left: leftOffset, right: rightOffset }}>
      {/* Playback & Timeline Controls */}
      <div className="bottom-controls-bar">
        <div className="play-controls">
          <button 
            className={"play-btn " + (simulating ? "active" : "")}
            onClick={handlePlayToggle}
            title={simulating ? "Pause Simulation" : "Run Simulation"}
          >
            {simulating ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
          </button>
          
          <button 
            className="play-btn"
            onClick={handleReset}
            title="Reset Simulation"
          >
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="timeline-slider-container">
          <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.04em' }}>
            {activeTab === 'twin' ? 'SWEEP SOLVER' : 'CYCLE SCRUB'}
          </span>
          
          <input 
            type="range" 
            className="cad-slider"
            min="0" 
            max="100" 
            step="1"
            value={timelineVal}
            onChange={(e) => {
              setTimelineVal(parseInt(e.target.value));
              if (simulating) setSimulating(false);
            }}
          />

          <div style={{ minWidth: '220px', textAlign: 'right', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end', fontSize: '10px' }}>
            {activeTab === 'twin' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '6px' }}>
                <LineChart size={12} style={{ color: 'var(--accent-green)' }} />
                <svg width="60" height="15" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <path d={buildSvgPath().replace(/32/g, '15')} fill="none" stroke="var(--accent-green)" strokeWidth="1" />
                </svg>
              </div>
            )}
            
            <span>FRAME: <b style={{ color: 'var(--accent-cyan)' }}>{timelineVal}%</b></span>
            <span>|</span>
            <span style={{ minWidth: '40px' }}>{formatTime(timelineVal)}</span>
            <span>|</span>
            <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{viewTheme.toUpperCase()} MODE</span>
          </div>
        </div>
      </div>

      {/* Terminal Logging Panel */}
      <div className="console-container">
        <div className="console-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} style={{ color: 'var(--accent-cyan)' }} />
            <span>TATA MOTORS R&D - DIAGNOSTIC DAQ STREAM</span>
          </div>
          <button 
            onClick={onCollapseToggle}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              marginRight: '12px'
            }}
            title="Hide Telemetry Panel"
          >
            <span>▼ HIDE</span>
          </button>
          <button 
            onClick={clearConsoleLogs}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px'
            }}
            title="Clear Console Logs"
          >
            <Trash2 size={10} />
            CLEAR
          </button>
        </div>

        <div className="console-body">
          {consoleLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
              Diagnostics terminal idle. Ready for events...
            </div>
          ) : (
            consoleLogs.map((log) => (
              <div key={log.id} className={"console-line " + log.type}>
                <span className="console-line-timestamp">[{log.timestamp}]</span>
                <span className="console-line-text">
                  {log.type === 'warning' ? '🚨 ' : log.type === 'system' ? '⚙️ ' : 'ℹ️ '}
                  {log.text}
                </span>
              </div>
            ))
          )}
          <div ref={consoleEndRef} />
        </div>
      </div>
    </div>
  );
};
export default BottomPanel;