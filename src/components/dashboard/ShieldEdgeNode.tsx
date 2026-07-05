import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Terminal, 
  Copy, 
  Check, 
  BookOpen, 
  FileText, 
  Play, 
  HelpCircle
} from 'lucide-react';

interface ShieldEdgeNodeProps {
  loadVal: number;
  vibeVal: number;
  distVal: number;
  inspectionState: 'idle' | 'running' | 'complete';
  result: 'none' | 'pass' | 'fail';
  serialLogs: string[];
  setSerialLogs: React.Dispatch<React.SetStateAction<string[]>>;
  triggerInspection: () => void;
  hardwareConnected: boolean;
  connectHardware: () => void;
}

export const ShieldEdgeNode: React.FC<ShieldEdgeNodeProps> = ({
  loadVal,
  vibeVal,
  distVal,
  inspectionState,
  result,
  serialLogs,
  setSerialLogs,
  triggerInspection,
  hardwareConnected,
  connectHardware
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sim' | 'code' | 'bom' | 'doc'>('sim');
  const [copiedCode, setCopiedCode] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);
  const serialEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Auto-scroll serial monitor
  useEffect(() => {
    if (serialEndRef.current) {
      serialEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs]);

  // Animate signals when inspection is running
  useEffect(() => {
    let interval: any;
    if (inspectionState === 'running') {
      interval = setInterval(() => {
        setPulseCount(p => (p + 1) % 4);
      }, 300);
    } else {
      setPulseCount(0);
    }
    return () => clearInterval(interval);
  }, [inspectionState]);

  // Web Audio API Buzzer sound
  const playBuzzerSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Triple beep
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + i * 0.25); // A5 note
        
        gain.gain.setValueAtTime(0, now + i * 0.25);
        gain.gain.linearRampToValueAtTime(0.15, now + i * 0.25 + 0.02);
        gain.gain.setValueAtTime(0.15, now + i * 0.25 + 0.15);
        gain.gain.linearRampToValueAtTime(0, now + i * 0.25 + 0.18);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.25);
        osc.stop(now + i * 0.25 + 0.2);
      }
    } catch (e) {
      console.warn("AudioContext failed to initialize: ", e);
    }
  };

  // Play buzzer sound on fail
  useEffect(() => {
    if (result === 'fail' && inspectionState === 'complete') {
      playBuzzerSound();
    }
  }, [result, inspectionState]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(arduinoCodeString);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClearSerial = () => {
    setSerialLogs([]);
  };

  const arduinoCodeString = `/*
 * Tata Motors R&D - EV Engineering Studio Hardware Integration
 * Aligned DAQ Node Firmware for Arduino Uno
 * 
 * Hardware Mappings (Aligned with sketch.ino):
 * - HX711 Load Cell:    DOUT = Pin 2,  CLK = Pin 3
 * - HC-SR04 Ultrasonic: TRIG = Pin 4,  ECHO = Pin 5
 * - Push Button:        Pin 7 (Active High)
 * - Buzzer:             Pin 8
 * - RGB LED:            RED = Pin 9, GREEN = Pin 10, BLUE = Pin 11
 * - MPU6050 IMU:        I2C (SDA = A4, SCL = A5)
 * - SSD1306 OLED:       I2C (SDA = A4, SCL = A5)
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "HX711.h"

// OLED configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// MPU6050 I2C Address
#define MPU6050_ADDR 0x68

// HX711 configuration
#define LOADCELL_DOUT_PIN 2
#define LOADCELL_SCK_PIN  3
HX711 scale;

// Pin Definitions
const int TRIG_PIN = 4;
const int ECHO_PIN = 5;
const int BUTTON_PIN = 7;
const int BUZZER_PIN = 8;
const int RED_PIN = 9;
const int GREEN_PIN = 10;
const int BLUE_PIN = 11;

unsigned long lastSendTime = 0;
const unsigned long sendInterval = 100; // Send telemetry at 10 Hz (100ms)

bool remoteAlarmActive = false;

void setup() {
  // Initialize Serial communication at 9600 baud to match sketch.ino
  Serial.begin(9600);
  while (!Serial) delay(10); 

  // Configure pin modes
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  // Initialize RGB LED (off)
  setRGBColor(0, 0, 0);
  noTone(BUZZER_PIN);

  // Welcome sound alert
  tone(BUZZER_PIN, 2000, 100);
  delay(150);
  tone(BUZZER_PIN, 2500, 150);

  // Initialize SSD1306 OLED display
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("{\"status\":\"error\",\"message\":\"SSD1306 failed\"}"));
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println(F("TATA MOTORS R&D"));
  display.println(F("EV Studio DAQ Node"));
  display.println(F("Initializing..."));
  display.display();

  // Initialize MPU6050 via Raw I2C to avoid library dependencies
  Wire.begin();
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B); // PWR_MGMT_1 register
  Wire.write(0x00); // Wake up MPU6050
  Wire.endTransmission(true);

  // Initialize HX711 Load Cell
  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);
  scale.set_scale(420.0f); // Calibrate load cell scale
  scale.tare();            // Zero the scale

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("TATA MOTORS R&D"));
  display.println(F("DAQ NODE ONLINE"));
  display.display();
  delay(1000);
}

void loop() {
  // 1. Listen for incoming Serial commands from Digital Twin PC app
  if (Serial.available() > 0) {
    String incoming = Serial.readStringUntil('\n');
    incoming.trim();
    if (incoming.indexOf("ALARM_ON") >= 0) {
      remoteAlarmActive = true;
    } else if (incoming.indexOf("ALARM_OFF") >= 0) {
      remoteAlarmActive = false;
      noTone(BUZZER_PIN);
      setRGBColor(0, 0, 0);
    }
  }

  // Read Ultrasonic distance
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  float distanceCm = (duration > 0) ? (duration * 0.034 / 2.0) : 400.0;

  // Read MPU6050 Accel values via raw I2C
  int16_t raw_ax, raw_ay, raw_az;
  readMPU6050(&raw_ax, &raw_ay, &raw_az);
  // Convert raw values to Gs (MPU6050 defaults to +/- 2G scale, sensitivity 16384 LSB/g)
  float ax = (float)raw_ax / 16384.0;
  float ay = (float)raw_ay / 16384.0;
  float az = (float)raw_az / 16384.0;

  // Read HX711 Load Cell Weight
  float weightGrams = 0;
  if (scale.is_ready()) {
    weightGrams = scale.get_units(2); // Average of 2 readings
  }

  // Read User Push Button
  int buttonState = digitalRead(BUTTON_PIN);

  // 2. Local Safety Alerts Logic
  // Sound alarm if collision is imminent (< 10 cm) or if remote alarm is triggered
  bool localAlarm = (distanceCm < 10.0 && distanceCm > 0.1);
  if (localAlarm || remoteAlarmActive) {
    setRGBColor(255, 0, 0); // Red
    int freq = localAlarm ? map(constrain(distanceCm, 2, 10), 2, 10, 3000, 1000) : 1000;
    tone(BUZZER_PIN, freq);
  } else {
    setRGBColor(0, 255, 0); // Green standby state
    noTone(BUZZER_PIN);
  }

  // 3. Update OLED Display
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println(F("TATA DAQ TELEMETRY"));
  display.print(F("Dist: ")); display.print(distanceCm, 1); display.println(F(" cm"));
  display.print(F("Accel: ")); display.print(az, 2); display.println(F(" g"));
  display.print(F("Weight: ")); display.print(weightGrams, 1); display.println(F(" g"));
  display.print(F("Status: ")); 
  if (localAlarm) display.println(F("COLLISION WARNING"));
  else if (remoteAlarmActive) display.println(F("DT REMOTE ALARM"));
  else display.println(F("NOMINAL"));
  display.display();

  // 4. Output JSON telemetry packet to Serial
  unsigned long currentTime = millis();
  if (currentTime - lastSendTime >= sendInterval) {
    lastSendTime = currentTime;
    
    Serial.print(F("{\"distance\":"));
    Serial.print(distanceCm, 2);
    Serial.print(F(",\"ax\":"));
    Serial.print(ax, 3);
    Serial.print(F(",\"ay\":"));
    Serial.print(ay, 3);
    Serial.print(F(",\"az\":"));
    Serial.print(az, 3);
    Serial.print(F(",\"weight\":"));
    Serial.print(weightGrams, 2);
    Serial.print(F(",\"button\":"));
    Serial.print(buttonState);
    Serial.print(F(",\"alarm\":"));
    Serial.print((localAlarm || remoteAlarmActive) ? 1 : 0);
    Serial.println(F("}"));
  }
}

void readMPU6050(int16_t* ax, int16_t* ay, int16_t* az) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B); // Starting register for accel data
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6050_ADDR, 6, true);
  
  *ax = (Wire.read() << 8) | Wire.read();
  *ay = (Wire.read() << 8) | Wire.read();
  *az = (Wire.read() << 8) | Wire.read();
}

void setRGBColor(int red, int green, int blue) {
  analogWrite(RED_PIN, red);
  analogWrite(GREEN_PIN, green);
  analogWrite(BLUE_PIN, blue);
}
`;

  return (
    <div className="sen-container">
      {/* Tab Navigation inside Shield Edge Node */}
      <div className="sen-nav">
        <button 
          className={`sen-nav-btn ${activeSubTab === 'sim' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sim')}
        >
          <Cpu size={14} />
          <span>Interactive Board Simulation</span>
        </button>
        <button 
          className={`sen-nav-btn ${activeSubTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('code')}
        >
          <Terminal size={14} />
          <span>Arduino Sketch (C++)</span>
        </button>
        <button 
          className={`sen-nav-btn ${activeSubTab === 'bom' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('bom')}
        >
          <FileText size={14} />
          <span>Bill of Materials (BOM)</span>
        </button>
        <button 
          className={`sen-nav-btn ${activeSubTab === 'doc' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('doc')}
        >
          <BookOpen size={14} />
          <span>SEN Documentation</span>
        </button>
      </div>

      <div className="sen-body">
        {/* ================= SIMULATION VIEW ================= */}
        {activeSubTab === 'sim' && (
          <div className="sen-sim-grid">
            <div className="sen-board-wrapper">
              <div className="board-header-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <h4>SHIELD Edge Node Wiring Layout</h4>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Proof-of-concept schematic circuit with hardware component sections
                    </span>
                  </div>
                  <button 
                    onClick={connectHardware}
                    style={{
                      background: hardwareConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 240, 255, 0.12)',
                      border: `1px solid ${hardwareConnected ? '#10b981' : '#00f0ff'}`,
                      color: hardwareConnected ? '#10b981' : '#00f0ff',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: hardwareConnected ? '0 0 10px rgba(16,185,129,0.2)' : '0 0 10px rgba(0,240,255,0.2)'
                    }}
                  >
                    <span>{hardwareConnected ? '🔌 DISCONNECT TATA NODE' : '🔌 CONNECT TATA DAQ NODE'}</span>
                  </button>
                </div>
                <div className="badge-row" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <div className="badge-section inspection">Sensors</div>
                  <div className="badge-section controller">Controller</div>
                  <div className="badge-section alert">Alerts</div>
                  <div className="badge-section display">Display</div>
                </div>
              </div>

              {/* Interactive SVG Wiring Board */}
              <div className="svg-board-container">
                <svg viewBox="0 0 1000 600" width="100%" height="100%">
                  {/* Bounding Boxes for Sections */}
                  {/* Inspection Sensors Section */}
                  <rect x="15" y="15" width="280" height="420" rx="8" fill="rgba(6, 182, 212, 0.02)" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="30" y="38" fill="var(--accent-cyan)" fontSize="11" fontWeight="bold" letterSpacing="0.05em">1. INSPECTION SENSORS</text>
                  
                  {/* Controller Section */}
                  <rect x="315" y="15" width="370" height="570" rx="8" fill="rgba(168, 85, 247, 0.02)" stroke="rgba(168, 85, 247, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="330" y="38" fill="var(--accent-purple)" fontSize="11" fontWeight="bold" letterSpacing="0.05em">2. EDGE CONTROLLER</text>

                  {/* Display Section */}
                  <rect x="705" y="15" width="280" height="230" rx="8" fill="rgba(234, 179, 8, 0.02)" stroke="rgba(234, 179, 8, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="720" y="38" fill="var(--accent-yellow)" fontSize="11" fontWeight="bold" letterSpacing="0.05em">3. OLED DISPLAY MODULE</text>

                  {/* Alert System Section */}
                  <rect x="705" y="260" width="280" height="325" rx="8" fill="rgba(244, 63, 94, 0.02)" stroke="rgba(244, 63, 94, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="720" y="283" fill="var(--accent-magenta)" fontSize="11" fontWeight="bold" letterSpacing="0.05em">4. ALERT ALARMS (OUTPUTS)</text>

                  {/* Input Control Section */}
                  <rect x="15" y="450" width="280" height="135" rx="8" fill="rgba(34, 197, 94, 0.02)" stroke="rgba(34, 197, 94, 0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="30" y="473" fill="var(--accent-green)" fontSize="11" fontWeight="bold" letterSpacing="0.05em">5. MANUAL START TRIGGER</text>

                  {/* WIRING CONNECTIONS (SVG PATHS) */}
                  {/* Ground connections (GND Bus) - Black */}
                  <path d="M 120 180 L 120 200 L 290 200 L 290 560 L 375 560" fill="none" stroke="#000000" strokeWidth="2" opacity="0.6" />
                  <path d="M 120 330 L 120 340 L 290 340" fill="none" stroke="#000000" strokeWidth="2" opacity="0.6" />
                  <path d="M 120 110 L 120 120 L 290 120" fill="none" stroke="#000000" strokeWidth="2" opacity="0.6" />
                  <path d="M 190 560 L 290 560" fill="none" stroke="#000000" strokeWidth="2" opacity="0.6" />
                  <path d="M 740 180 L 700 180 L 700 350 L 590 350 L 590 310" fill="none" stroke="#000000" strokeWidth="2" opacity="0.6" />
                  <path d="M 740 430 L 700 430 L 700 350" fill="none" stroke="#000000" strokeWidth="2" opacity="0.6" />
                  <path d="M 740 520 L 700 520 L 700 350" fill="none" stroke="#000000" strokeWidth="2" opacity="0.6" />

                  {/* 5V Power connections - Red */}
                  <path d="M 110 70 L 60 70 L 60 410 L 410 410 L 410 310" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />
                  <path d="M 110 160 L 60 160" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />
                  <path d="M 110 310 L 60 310" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />
                  <path d="M 740 160 L 680 160 L 680 395 L 430 395 L 430 310" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />

                  {/* Sensor Specific Data wires */}
                  {/* Load Cell (HX711) -> Arduino pins D2, D3 - Orange/Green */}
                  <path d="M 230 70 L 270 70 L 270 230 L 500 230 L 500 70" 
                    fill="none" 
                    stroke={inspectionState === 'running' && pulseCount % 2 === 0 ? 'var(--accent-green)' : '#f97316'} 
                    strokeWidth="2" 
                    className={inspectionState === 'running' ? 'animated-wire' : ''} 
                  />
                  <path d="M 230 90 L 260 90 L 260 220 L 515 220 L 515 70" 
                    fill="none" 
                    stroke={inspectionState === 'running' && pulseCount % 2 === 0 ? 'var(--accent-green)' : '#22c55e'} 
                    strokeWidth="2" 
                    className={inspectionState === 'running' ? 'animated-wire' : ''} 
                  />
                  
                  {/* MPU6050 (I2C) -> Arduino pins A4 (SDA), A5 (SCL) - Blue/Yellow */}
                  <path d="M 230 160 L 280 160 L 280 270 L 590 270 L 590 70" 
                    fill="none" 
                    stroke={inspectionState === 'running' ? 'var(--accent-cyan)' : '#eab308'} 
                    strokeWidth="2" 
                    className={inspectionState === 'running' ? 'animated-wire' : ''}
                  />
                  <path d="M 230 180 L 285 180 L 285 260 L 605 260 L 605 70" 
                    fill="none" 
                    stroke={inspectionState === 'running' ? 'var(--accent-cyan)' : '#3b82f6'} 
                    strokeWidth="2" 
                    className={inspectionState === 'running' ? 'animated-wire' : ''}
                  />

                  {/* SSD1306 OLED (I2C) -> Arduino pins A4, A5 (shares bus) - Blue/Yellow */}
                  <path d="M 740 100 L 660 100 L 660 270 L 590 270" 
                    fill="none" 
                    stroke={inspectionState === 'running' || inspectionState === 'complete' ? 'var(--accent-cyan)' : '#eab308'} 
                    strokeWidth="2" 
                  />
                  <path d="M 740 120 L 650 120 L 650 260 L 605 260" 
                    fill="none" 
                    stroke={inspectionState === 'running' || inspectionState === 'complete' ? 'var(--accent-cyan)' : '#3b82f6'} 
                    strokeWidth="2" 
                  />

                  {/* HC-SR04 (Ultrasonic) -> Arduino pins D4, D5 - Brown/Purple */}
                  <path d="M 230 310 L 275 310 L 275 250 L 530 250 L 530 70" 
                    fill="none" 
                    stroke={inspectionState === 'running' && pulseCount % 2 === 1 ? 'var(--accent-green)' : '#a855f7'} 
                    strokeWidth="2" 
                    className={inspectionState === 'running' ? 'animated-wire' : ''}
                  />
                  <path d="M 230 330 L 280 330 L 280 240 L 545 240 L 545 70" 
                    fill="none" 
                    stroke={inspectionState === 'running' && pulseCount % 2 === 1 ? 'var(--accent-green)' : '#ec4899'} 
                    strokeWidth="2" 
                    className={inspectionState === 'running' ? 'animated-wire' : ''}
                  />

                  {/* Active Buzzer -> Arduino pin D8 - Pink */}
                  <path d="M 740 410 L 670 410 L 670 190 L 590 190 L 590 70" 
                    fill="none" 
                    stroke={result === 'fail' && inspectionState === 'complete' ? 'var(--accent-magenta)' : '#ec4899'} 
                    strokeWidth="2" 
                  />

                  {/* RGB LED -> Arduino pins D6, D9, D10 - Colored paths */}
                  <path d="M 740 500 L 680 500 L 680 180 L 560 180 L 560 70" 
                    fill="none" 
                    stroke={inspectionState === 'complete' ? (result === 'pass' ? '#10b981' : '#f43f5e') : '#ef4444'} 
                    strokeWidth="2" 
                  />
                  <path d="M 740 540 L 690 540 L 690 170 L 620 170 L 620 70" 
                    fill="none" 
                    stroke={inspectionState === 'complete' && result === 'pass' ? '#10b981' : '#10b981'} 
                    strokeWidth="2" 
                  />
                  <path d="M 740 560 L 695 560 L 695 160 L 635 160 L 635 70" 
                    fill="none" 
                    stroke={inspectionState === 'idle' ? 'var(--accent-cyan)' : '#3b82f6'} 
                    strokeWidth="2" 
                  />

                  {/* Push Button -> Arduino pin D7 - Cyan wire */}
                  <path d="M 190 540 L 265 540 L 265 210 L 575 210 L 575 70" 
                    fill="none" 
                    stroke={inspectionState === 'running' ? 'var(--accent-green)' : '#06b6d4'} 
                    strokeWidth="2" 
                  />

                  {/* DRAWING BOARD SYMBOLS & HOUSINGS */}
                  
                  {/* ARDUINO UNO BOARD */}
                  <g transform="translate(330, 80)">
                    {/* Blue PCB Body */}
                    <rect x="0" y="0" width="340" height="210" rx="8" fill="#1b2a4a" stroke="#2563eb" strokeWidth="2.5" />
                    
                    {/* Board copper outlines / circuits */}
                    <path d="M 10 30 L 120 30 M 10 180 L 320 180 M 320 30 L 320 100" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none"/>
                    <rect x="180" y="90" width="60" height="80" rx="4" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                    
                    {/* USB Connector */}
                    <rect x="-15" y="20" width="45" height="40" rx="2" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
                    <text x="-5" y="45" fill="#475569" fontSize="9" fontWeight="bold" fontFamily="monospace">USB</text>
                    
                    {/* Power DC Jack */}
                    <rect x="-10" y="130" width="50" height="50" rx="2" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <rect x="-10" y="145" width="20" height="20" fill="#334155" />
                    
                    {/* Microcontroller ATmega328P Chip */}
                    <rect x="180" y="115" width="90" height="30" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                    <line x1="190" y1="115" x2="190" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="200" y1="115" x2="200" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="210" y1="115" x2="210" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="220" y1="115" x2="220" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="230" y1="115" x2="230" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="240" y1="115" x2="240" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="250" y1="115" x2="250" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="260" y1="115" x2="260" y2="110" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="190" y1="145" x2="190" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="200" y1="145" x2="200" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="210" y1="145" x2="210" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="220" y1="145" x2="220" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="230" y1="145" x2="230" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="240" y1="145" x2="240" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="250" y1="145" x2="250" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="260" y1="145" x2="260" y2="150" stroke="#94a3b8" strokeWidth="1.5" />
                    <text x="195" y="133" fill="#64748b" fontSize="8" fontFamily="monospace" fontWeight="bold">ATMEGA328P</text>
                    
                    {/* Reset Button */}
                    <rect x="10" y="5" width="20" height="20" fill="#475569" stroke="#334155" />
                    <circle cx="20" cy="15" r="6" fill="#ef4444" />
                    
                    {/* Headers - Female Sockets */}
                    {/* Digital Headers (Top Pin Row) */}
                    <rect x="60" y="-15" width="260" height="15" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    {/* Individual Pins */}
                    {Array.from({ length: 14 }).map((_, i) => (
                      <g key={i}>
                        <rect x={65 + i * 18} y={-10} width="10" height="6" fill="#1e293b" />
                        <circle cx={70 + i * 18} cy={-7} r="2" fill="#94a3b8" />
                        <text x={70 + i * 18} y={-18} fill="var(--text-muted)" fontSize="7" textAnchor="middle" fontFamily="monospace">
                          {13 - i}
                        </text>
                      </g>
                    ))}
                    
                    {/* Power Headers (Bottom Left Pin Row) */}
                    <rect x="50" y="210" width="130" height="15" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    {['RESET', '3.3V', '5V', 'GND', 'GND', 'VIN'].map((lbl, i) => (
                      <g key={i}>
                        <rect x={55 + i * 20} y={214} width="10" height="6" fill="#1e293b" />
                        <circle cx={60 + i * 20} cy={217} r="2" fill="#94a3b8" />
                        <text x={60 + i * 20} y={235} fill="var(--text-muted)" fontSize="7" textAnchor="middle" fontFamily="monospace">
                          {lbl}
                        </text>
                      </g>
                    ))}
                    
                    {/* Analog Headers (Bottom Right Pin Row) */}
                    <rect x="210" y="210" width="110" height="15" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    {['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map((lbl, i) => (
                      <g key={i}>
                        <rect x={215 + i * 17} y={214} width="10" height="6" fill="#1e293b" />
                        <circle cx={220 + i * 17} cy={217} r="2" fill="#94a3b8" />
                        <text x={220 + i * 17} y={235} fill="var(--text-muted)" fontSize="7" textAnchor="middle" fontFamily="monospace">
                          {lbl}
                        </text>
                      </g>
                    ))}
                    
                    {/* Board text labels */}
                    <text x="170" y="55" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="sans-serif" letterSpacing="1">ARDUINO</text>
                    <text x="170" y="70" fill="var(--accent-cyan)" fontSize="10" fontWeight="bold" fontFamily="monospace">UNO R3</text>
                    <text x="170" y="170" fill="var(--text-muted)" fontSize="8" fontFamily="sans-serif">SHIELD EDGE CONTROLLER</text>
                  </g>

                  {/* SENSOR 1: LOAD CELL + HX711 */}
                  <g transform="translate(110, 50)">
                    {/* HX711 Breakout Green Board */}
                    <rect x="0" y="0" width="120" height="60" rx="4" fill="#065f46" stroke="#059669" strokeWidth="1.5" />
                    <text x="60" y="20" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">HX711 AMPLIFIER</text>
                    
                    {/* Load Cell Side Connections */}
                    <line x1="0" y1="20" x2="-20" y2="20" stroke="#eab308" strokeWidth="1.5" />
                    <line x1="0" y1="40" x2="-20" y2="40" stroke="#ef4444" strokeWidth="1.5" />
                    
                    {/* Load Cell Body */}
                    <g transform="translate(-80, 5)">
                      <rect x="0" y="0" width="60" height="50" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
                      <circle cx="15" cy="15" r="4" fill="#334155" />
                      <circle cx="45" cy="35" r="4" fill="#334155" />
                      <line x1="10" y1="25" x2="50" y2="25" stroke="#ef4444" strokeWidth="1" />
                      <text x="30" y="47" fill="#1e293b" fontSize="6" fontWeight="bold" textAnchor="middle">LOAD CELL</text>
                      
                      {/* Weight Force Arrow animation */}
                      {inspectionState === 'running' && (
                        <g>
                          <path d="M 30 -5 L 30 10 M 27 6 L 30 10 L 33 6" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" className="alert-pulse" />
                        </g>
                      )}
                    </g>
                    
                    {/* Pins details */}
                    <circle cx="120" cy="20" r="2.5" fill="#f97316" /><text x="110" y="22" fill="#fff" fontSize="6" textAnchor="end">DT (D2)</text>
                    <circle cx="120" cy="40" r="2.5" fill="#22c55e" /><text x="110" y="42" fill="#fff" fontSize="6" textAnchor="end">SCK (D3)</text>
                  </g>

                  {/* SENSOR 2: MPU6050 */}
                  <g transform="translate(110, 130)">
                    {/* MPU6050 Board */}
                    <rect x="0" y="0" width="120" height="70" rx="4" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="1.5" />
                    <text x="60" y="20" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle">MPU6050 IMU</text>
                    <text x="60" y="32" fill="var(--accent-cyan)" fontSize="7" textAnchor="middle">(Vibration Sensor)</text>
                    
                    {/* Pins */}
                    <circle cx="120" cy="30" r="2.5" fill="#eab308" /><text x="110" y="32" fill="#fff" fontSize="6" textAnchor="end">SDA (A4)</text>
                    <circle cx="120" cy="50" r="2.5" fill="#3b82f6" /><text x="110" y="52" fill="#fff" fontSize="6" textAnchor="end">SCL (A5)</text>
                    
                    {/* Vibration lines */}
                    {inspectionState === 'running' && (
                      <g className="alert-pulse" stroke="var(--accent-cyan)" strokeWidth="1" fill="none">
                        <path d="M 5 -5 L 10 5 L 15 -5" />
                        <path d="M -5 -5 L -10 5 L -15 -5" />
                      </g>
                    )}
                  </g>

                  {/* SENSOR 3: HC-SR04 */}
                  <g transform="translate(110, 280)">
                    {/* Board body */}
                    <rect x="0" y="0" width="120" height="80" rx="4" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="1.5" />
                    <text x="60" y="70" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">HC-SR04 DISTANCE</text>
                    
                    {/* Ultrasonic Transmitter / Receiver barrels */}
                    <circle cx="35" cy="35" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
                    <circle cx="35" cy="35" r="10" fill="#475569" />
                    <text x="35" y="38" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">T</text>
                    
                    <circle cx="85" cy="35" r="20" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
                    <circle cx="85" cy="35" r="10" fill="#475569" />
                    <text x="85" y="38" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">R</text>
                    
                    {/* Pins */}
                    <circle cx="120" cy="30" r="2.5" fill="#a855f7" /><text x="110" y="32" fill="#fff" fontSize="6" textAnchor="end">TRIG (D4)</text>
                    <circle cx="120" cy="50" r="2.5" fill="#ec4899" /><text x="110" y="52" fill="#fff" fontSize="6" textAnchor="end">ECHO (D5)</text>

                    {/* Wave lines animation */}
                    {inspectionState === 'running' && (
                      <g className="alert-pulse" stroke="var(--accent-cyan)" strokeWidth="1.5" fill="none">
                        <path d="M -5 20 A 15 15 0 0 0 -5 50" />
                        <path d="M -15 10 A 25 25 0 0 0 -15 60" />
                      </g>
                    )}
                  </g>

                  {/* DISPLAY MODULE: SSD1306 OLED */}
                  <g transform="translate(740, 50)">
                    {/* Blue PCB */}
                    <rect x="0" y="0" width="220" height="150" rx="6" fill="#1e1e24" stroke="#4b5563" strokeWidth="2" />
                    <text x="110" y="18" fill="var(--accent-yellow)" fontSize="9" fontWeight="bold" textAnchor="middle">SSD1306 I2C OLED</text>
                    
                    {/* Screen frame */}
                    <rect x="15" y="30" width="190" height="100" rx="3" fill="#000" stroke="#374151" strokeWidth="1.5" />
                    
                    {/* Interactive OLED Screen rendering */}
                    <g transform="translate(25, 42)">
                      {inspectionState === 'idle' && (
                        <>
                          <text x="5" y="15" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">SHIELD SEN [v1.0]</text>
                          <text x="5" y="35" fill="#fbbf24" fontSize="8" fontFamily="monospace">Ready for Inspection</text>
                          <text x="5" y="55" fill="#94a3b8" fontSize="8" fontFamily="monospace">Press button...</text>
                        </>
                      )}
                      
                      {inspectionState === 'running' && (
                        <>
                          <text x="5" y="15" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">SHIELD</text>
                          <text x="5" y="35" fill="#fbbf24" fontSize="9" fontFamily="monospace" className="alert-pulse">Inspection Running...</text>
                          <rect x="5" y="48" width="130" height="6" fill="#334155" rx="2" />
                          <rect x="5" y="48" width={pulseCount * 40 + 10} height="6" fill="#38bdf8" rx="2" />
                        </>
                      )}
                      
                      {inspectionState === 'complete' && (
                        <>
                          <text x="0" y="12" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">SHIELD SEN REPORT</text>
                          <text x="0" y="28" fill="#fff" fontSize="8" fontFamily="monospace">Load: {loadVal.toFixed(1)} kN {loadVal >= 2.0 && loadVal <= 4.5 ? "OK" : "ERR"}</text>
                          <text x="0" y="40" fill="#fff" fontSize="8" fontFamily="monospace">Vibr: {vibeVal.toFixed(2)} g  {vibeVal < 0.3 ? "OK" : "ERR"}</text>
                          <text x="0" y="52" fill="#fff" fontSize="8" fontFamily="monospace">Dist: {distVal.toFixed(0)} mm {distVal >= 35.0 && distVal <= 45.0 ? "OK" : "ERR"}</text>
                          
                          {result === 'pass' ? (
                            <text x="110" y="70" fill="#10b981" fontSize="12" fontFamily="monospace" fontWeight="bold">PASS</text>
                          ) : (
                            <text x="110" y="70" fill="#ef4444" fontSize="12" fontFamily="monospace" fontWeight="bold" className="alert-pulse">FAIL</text>
                          )}
                        </>
                      )}
                    </g>
                  </g>

                  {/* ALERTER 1: RGB LED */}
                  <g transform="translate(740, 480)">
                    {/* RGB Module Board */}
                    <rect x="0" y="0" width="100" height="90" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
                    <text x="50" y="16" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">RGB STATUS LED</text>
                    
                    {/* LED body */}
                    <path d="M 40 55 L 40 40 A 10 10 0 0 1 60 40 L 60 55 Z" 
                      fill={inspectionState === 'complete' 
                        ? (result === 'pass' ? '#10b981' : '#f43f5e') 
                        : (inspectionState === 'running' ? '#eab308' : '#3b82f6')} 
                      stroke="#94a3b8" 
                      strokeWidth="1" 
                    />
                    <rect x="35" y="55" width="30" height="4" fill="#cbd5e1" />
                    
                    {/* Led legs */}
                    <line x1="42" y1="59" x2="42" y2="80" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="47" y1="59" x2="47" y2="80" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="53" y1="59" x2="53" y2="80" stroke="#94a3b8" strokeWidth="1" />
                    <line x1="58" y1="59" x2="58" y2="80" stroke="#94a3b8" strokeWidth="1" />
                    
                    {/* Glowing effect */}
                    {inspectionState === 'complete' && (
                      <circle cx="50" cy="45" r="25" 
                        fill={result === 'pass' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'} 
                        className="alert-pulse" 
                      />
                    )}
                    {inspectionState === 'running' && (
                      <circle cx="50" cy="45" r="20" fill="rgba(234, 179, 8, 0.2)" className="alert-pulse" />
                    )}
                  </g>

                  {/* ALERTER 2: ACTIVE BUZZER */}
                  <g transform="translate(740, 310)">
                    {/* Buzzer Module Board */}
                    <rect x="0" y="0" width="100" height="130" rx="4" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
                    <text x="50" y="16" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">ACTIVE BUZZER</text>
                    
                    {/* Buzzer Cylinder */}
                    <circle cx="50" cy="65" r="28" fill="#1e1e1e" stroke="#334155" strokeWidth="2" />
                    <circle cx="50" cy="65" r="8" fill="#000" />
                    <text x="50" y="48" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle">+</text>
                    
                    {/* Pins */}
                    <line x1="42" y1="93" x2="42" y2="120" stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1="58" y1="93" x2="58" y2="120" stroke="#94a3b8" strokeWidth="1.5" />
                    
                    {/* Sound Waves */}
                    {result === 'fail' && inspectionState === 'complete' && (
                      <g className="alert-pulse" stroke="#f43f5e" strokeWidth="1.5" fill="none">
                        <path d="M 85 50 A 20 20 0 0 1 85 80" />
                        <path d="M 93 40 A 32 32 0 0 1 93 90" strokeWidth="1" />
                        <path d="M 15 50 A 20 20 0 0 0 15 80" />
                        <path d="M 7 40 A 32 32 0 0 0 7 90" strokeWidth="1" />
                      </g>
                    )}
                  </g>

                  {/* BUTTON: MANUAL START */}
                  <g transform="translate(110, 480)">
                    <rect x="0" y="0" width="120" height="80" rx="4" fill="#15803d" stroke="#22c55e" strokeWidth="1.5" />
                    <text x="60" y="18" fill="#fff" fontSize="8" fontWeight="bold" textAnchor="middle">MANUAL TRIGGER</text>
                    
                    {/* Tactile Button Body */}
                    <g transform="translate(35, 25)" cursor="pointer" onClick={triggerInspection}>
                      <rect x="0" y="0" width="50" height="40" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                      <circle cx="25" cy="20" r="12" fill={inspectionState === 'running' ? '#b91c1c' : '#ef4444'} stroke="#7f1d1d" strokeWidth="1.5" />
                      <circle cx="25" cy="20" r="4" fill="#f87171" opacity="0.3" />
                      {/* Press effect */}
                      {inspectionState === 'running' && (
                        <circle cx="25" cy="20" r="14" fill="none" stroke="#fff" opacity="0.5" strokeWidth="1" />
                      )}
                    </g>
                  </g>
                </svg>
              </div>

              {/* Action triggering instruction manually outside board */}
              <div className="board-actions-bar">
                <button 
                  className="trigger-action-btn"
                  onClick={triggerInspection}
                  disabled={inspectionState === 'running'}
                >
                  <Play size={13} fill="currentColor" />
                  <span>{inspectionState === 'running' ? 'Inspection In Progress...' : 'Start Quality Inspection'}</span>
                </button>

                <div className="test-state-pill">
                  <span>Current State: </span>
                  <b className={`state-label ${inspectionState}`}>
                    {inspectionState === 'idle' && 'READY'}
                    {inspectionState === 'running' && 'RUNNING'}
                    {inspectionState === 'complete' && `COMPLETE [${result.toUpperCase()}]`}
                  </b>
                </div>
              </div>
            </div>

            {/* Simulated Serial Monitor Console */}
            <div className="serial-monitor-panel">
              <div className="serial-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={12} style={{ color: 'var(--accent-cyan)' }} />
                  <span>SEN Serial Monitor - COM4 (115200 baud)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="serial-btn" onClick={handleClearSerial}>
                    CLEAR
                  </button>
                </div>
              </div>
              <div className="serial-logs">
                {serialLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px' }}>
                    Serial stream idle. Start inspection to stream data...
                  </div>
                ) : (
                  serialLogs.map((log, i) => (
                    <div key={i} className="serial-line">
                      {log}
                    </div>
                  ))
                )}
                <div ref={serialEndRef} />
              </div>
              <div className="serial-footer">
                <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
                  Raw sensor output streams over hardware UART bridge
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= ARDUINO CODE VIEW ================= */}
        {activeSubTab === 'code' && (
          <div className="code-viewer-panel">
            <div className="code-header">
              <span className="code-title">shield_sen.ino (C++ Arduino Sketch)</span>
              <button className="copy-code-btn" onClick={handleCopyCode}>
                {copiedCode ? <Check size={12} style={{ color: 'var(--accent-green)' }} /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copied!' : 'Copy Sketch'}</span>
              </button>
            </div>
            <pre className="code-content">
              <code>{arduinoCodeString}</code>
            </pre>
          </div>
        )}

        {/* ================= BILL OF MATERIALS (BOM) ================= */}
        {activeSubTab === 'bom' && (
          <div className="bom-panel">
            <div className="bom-header-bar">
              <h4>Hackathon Hardware Bill of Materials (BOM)</h4>
              <span className="bom-price">Est. Budget: $42.70</span>
            </div>
            
            <table className="bom-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Quantity</th>
                  <th>Est. Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Purpose / System Segment</th>
                  <th>Uno Pin Connections</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="comp-name">Arduino Uno R3 Board</td>
                  <td>1</td>
                  <td>$15.00</td>
                  <td>$15.00</td>
                  <td>Central Controller & Edge AI node processing decisions</td>
                  <td>Host Processor</td>
                </tr>
                <tr>
                  <td className="comp-name">HX711 Load Cell Amplifier</td>
                  <td>1</td>
                  <td>$3.50</td>
                  <td>$3.50</td>
                  <td>24-bit ADC scaling raw strain gauge signals</td>
                  <td>DOUT (D2), SCK (D3)</td>
                </tr>
                <tr>
                  <td className="comp-name">Aluminum Bar Load Cell (5kg)</td>
                  <td>1</td>
                  <td>$6.00</td>
                  <td>$6.00</td>
                  <td>Transducer measuring mechanical torque / load weight</td>
                  <td>Connected to HX711 inputs</td>
                </tr>
                <tr>
                  <td className="comp-name">MPU6050 Accelerometer / Gyro</td>
                  <td>1</td>
                  <td>$4.50</td>
                  <td>$4.50</td>
                  <td>Inertial Measurement Unit measuring structural vibration</td>
                  <td>SDA (A4), SCL (A5)</td>
                </tr>
                <tr>
                  <td className="comp-name">HC-SR04 Ultrasonic Distance Sensor</td>
                  <td>1</td>
                  <td>$3.00</td>
                  <td>$3.00</td>
                  <td>Clearance checker for battery-to-chassis gap</td>
                  <td>TRIG (D4), ECHO (D5)</td>
                </tr>
                <tr>
                  <td className="comp-name">SSD1306 0.96" OLED Display (I2C)</td>
                  <td>1</td>
                  <td>$5.00</td>
                  <td>$5.00</td>
                  <td>Displays real-time sensor metrics and inspection status</td>
                  <td>SDA (A4), SCL (A5) [Shared]</td>
                </tr>
                <tr>
                  <td className="comp-name">Common Cathode RGB LED</td>
                  <td>1</td>
                  <td>$0.50</td>
                  <td>$0.50</td>
                  <td>Pass (Green), Fail (Red), Standby (Blue) indicator</td>
                  <td>R (D6), G (D9), B (D10) [GND Cathode]</td>
                </tr>
                <tr>
                  <td className="comp-name">Active Buzzer (5V)</td>
                  <td>1</td>
                  <td>$1.00</td>
                  <td>$1.00</td>
                  <td>Audible warning alarm triggered on FAIL anomaly result</td>
                  <td>VCC (D8), GND</td>
                </tr>
                <tr>
                  <td className="comp-name">Tactile Push Button</td>
                  <td>1</td>
                  <td>$0.20</td>
                  <td>$0.20</td>
                  <td>Manual override button starting inspection sweep</td>
                  <td>Pin (D7), GND [Internal pull-up]</td>
                </tr>
                <tr>
                  <td className="comp-name">Breadboard (830pts) & Jumpers</td>
                  <td>1</td>
                  <td>$4.00</td>
                  <td>$4.00</td>
                  <td>Component structural routing and wire interconnects</td>
                  <td>Breadboard Bus Links</td>
                </tr>
              </tbody>
            </table>

            <div className="bom-note">
              <HelpCircle size={14} />
              <span>
                <b>Student Hackathon Budget Friendly:</b> Pricing averages online retail. Sub-assemblies can be wired directly with breadboard jumpers without solder.
              </span>
            </div>
          </div>
        )}

        {/* ================= DOCUMENTATION ================= */}
        {activeSubTab === 'doc' && (
          <div className="doc-panel">
            <div className="doc-content">
              <h3>SHIELD Edge Node (SEN) System Architecture</h3>
              <p>
                The <b>SHIELD Edge Node (SEN)</b> serves as a localized quality assurance sentinel on the EV battery-to-chassis assembly line (also known as the "Marriage" station). It aggregates multiple physical telemetry vectors, analyzing mechanical limits locally, and triggers safety defense protocols if defects propagate.
              </p>

              <hr />

              <h4>1. Pin Mapping Configuration Table</h4>
              <table className="doc-pinout-table">
                <thead>
                  <tr>
                    <th>Arduino Pin</th>
                    <th>Hardware Component</th>
                    <th>Signal Mode</th>
                    <th>Wiring Color Code</th>
                    <th>Function</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>D2</b></td>
                    <td>HX711 Amplifier</td>
                    <td>Input (Digital Data)</td>
                    <td>Orange</td>
                    <td>Data transfer (DOUT) from load cell ADC</td>
                  </tr>
                  <tr>
                    <td><b>D3</b></td>
                    <td>HX711 Amplifier</td>
                    <td>Output (Clock)</td>
                    <td>Green</td>
                    <td>Serial clock (SCK) synchronizing data transfer</td>
                  </tr>
                  <tr>
                    <td><b>D4</b></td>
                    <td>HC-SR04 Sensor</td>
                    <td>Output (Trigger Pulse)</td>
                    <td>Purple</td>
                    <td>Transmits 10μs ultrasonic trigger signal</td>
                  </tr>
                  <tr>
                    <td><b>D5</b></td>
                    <td>HC-SR04 Sensor</td>
                    <td>Input (Echo Pulse)</td>
                    <td>Pink</td>
                    <td>Receives reflection travel duration pulse</td>
                  </tr>
                  <tr>
                    <td><b>D6</b></td>
                    <td>RGB LED (Red Pin)</td>
                    <td>Output (PWM)</td>
                    <td>Red</td>
                    <td>Controls Red brightness (Active on FAIL)</td>
                  </tr>
                  <tr>
                    <td><b>D7</b></td>
                    <td>Push Button</td>
                    <td>Input (Internal Pullup)</td>
                    <td>Cyan</td>
                    <td>Registers button press (LOW state when pressed)</td>
                  </tr>
                  <tr>
                    <td><b>D8</b></td>
                    <td>Active Buzzer</td>
                    <td>Output (Digital)</td>
                    <td>Magenta</td>
                    <td>Triggers loud 5V alert sound waves on FAIL</td>
                  </tr>
                  <tr>
                    <td><b>D9</b></td>
                    <td>RGB LED (Green Pin)</td>
                    <td>Output (PWM)</td>
                    <td>Green</td>
                    <td>Controls Green brightness (Active on PASS)</td>
                  </tr>
                  <tr>
                    <td><b>D10</b></td>
                    <td>RGB LED (Blue Pin)</td>
                    <td>Output (PWM)</td>
                    <td>Blue</td>
                    <td>Controls Blue brightness (Active on STANDBY)</td>
                  </tr>
                  <tr>
                    <td><b>A4 (SDA)</b></td>
                    <td>SSD1306 OLED & MPU6050</td>
                    <td>Bi-directional I2C Data</td>
                    <td>Yellow</td>
                    <td>Shared Serial Data Bus for Display & IMU</td>
                  </tr>
                  <tr>
                    <td><b>A5 (SCL)</b></td>
                    <td>SSD1306 OLED & MPU6050</td>
                    <td>I2C Clock</td>
                    <td>Blue</td>
                    <td>Shared Serial Clock Bus</td>
                  </tr>
                </tbody>
              </table>

              <hr />

              <h4>2. Quality Inspection Threshold Ranges</h4>
              <p>
                The SEN evaluates incoming vectors against strict tolerances configured inside the firmware parameters:
              </p>
              <ul>
                <li>
                  <b>Mechanical Load Cell (HX711):</b> <code>2.0 kN to 4.5 kN</code>.
                  <br />
                  <small>Measures uniform compression weight of the battery enclosure. Low load indicates missing modules/bolts, high load indicates over-tensioning stress.</small>
                </li>
                <li>
                  <b>Structural Vibration (MPU6050):</b> <code>&lt; 0.3g</code>.
                  <br />
                  <small>Detects micro-slip assembly vibration. Vibration above limits denotes loose structural clamping or gantry alignment chatter.</small>
                </li>
                <li>
                  <b>Clearance Distance (HC-SR04):</b> <code>35.0 mm to 45.0 mm</code>.
                  <br />
                  <small>Validates correct battery-to-chassis air clearance gap. Out of limit points to structural cross-member buckling or tilt misalignment.</small>
                </li>
              </ul>

              <hr />

              <h4>3. Defect Mitigating Action Chain</h4>
              <p>
                When a defect triggers a <b>FAIL</b> decision:
              </p>
              <ol>
                <li>The RGB LED switches immediately from Blue (standby) / Yellow (running) to Solid Red.</li>
                <li>The SSD1306 OLED displays a breakdown of metrics, highlighting the anomaly with <code>"ERR"</code>.</li>
                <li>The Active Buzzer is pulsed 3 times via Digital output Pin 8, notifying line operators immediately.</li>
                <li>The node streams an automated Incident Anomaly report over Serial to the factory Digital Twin SCADA database.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
