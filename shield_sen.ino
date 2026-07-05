/*
 * SHIELD - Structural Health Intelligence for EV Line Defense
 * Firmware for SHIELD Edge Node (SEN)
 * 
 * Target Board: Arduino Uno
 * Description: Quality inspection station measuring mechanical load, 
 *              vibration, and battery-to-chassis clearance.
 * 
 * Pin Mapping:
 *   D2  -> HX711 DOUT (Data)
 *   D3  -> HX711 SCK (Clock)
 *   D4  -> HC-SR04 TRIG (Trigger Pulse)
 *   D5  -> HC-SR04 ECHO (Echo Pulse)
 *   D6  -> RGB LED Red Pin
 *   D7  -> Tactile Push Button (Start Inspection)
 *   D8  -> Active Buzzer Positive Terminal
 *   D9  -> RGB LED Green Pin
 *   D10 -> RGB LED Blue Pin
 *   A4  -> I2C SDA (Shared between SSD1306 OLED & MPU6050)
 *   A5  -> I2C SCL (Shared between SSD1306 OLED & MPU6050)
 */

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include "HX711.h"

// Pin Definitions
#define HX711_DOUT   2    // HX711 Data pin
#define HX711_SCK    3    // HX711 Clock pin
#define US_TRIG      4    // HC-SR04 Trig pin
#define US_ECHO      5    // HC-SR04 Echo pin
#define RGB_RED      6    // RGB LED Red Pin
#define BTN_START    7    // Start Push Button
#define BUZZER       8    // Active Buzzer output
#define RGB_GREEN    9    // RGB LED Green Pin
#define RGB_BLUE     10   // RGB LED Blue Pin

// OLED Display parameters
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// MPU6050 Accelerometer
Adafruit_MPU6050 mpu;

// HX711 Load Cell
HX711 scale;

// Inspection Threshold Limits (Standard EV manufacturing tolerances)
const float MIN_LOAD_KG = 4.0;      // Minimum nominal battery clamp load (kg)
const float MAX_LOAD_KG = 6.0;      // Maximum nominal battery clamp load (kg)
const float MAX_VIBRATION_G = 0.15; // Max allowable net vibration amplitude (g)
const float MIN_DISTANCE_CM = 4.5;  // Minimum nominal battery clearance distance (cm)
const float MAX_DISTANCE_CM = 5.5;  // Maximum nominal battery clearance distance (cm)

// System States
enum SystemState {
  STATE_BOOT,
  STATE_IDLE,
  STATE_INSPECTING,
  STATE_RESULT
};

SystemState currentState = STATE_BOOT;

// Timer and state tracking variables
unsigned long stateStartTime = 0;
unsigned long lastTelemetryTime = 0;
unsigned long lastBlinkTime = 0;
unsigned int inspectionCount = 0;

const unsigned long INSPECTION_DURATION_MS = 4000; // 4-second scan simulation
const unsigned long RESULT_DURATION_MS = 5000;     // 5-second result lock display

// Final inspection readings
float finalLoadKg = 0.0;
float finalVibrationG = 0.0;
float finalDistanceCm = 0.0;
bool finalResultPass = false;

// Serial Communication settings
String serialInputBuffer = "";
bool externalAlarmActive = false;

// Function Declarations
float getLoadCellReading();
float getVibrationReading();
float getDistanceReading();
void showBootScreen();
void showIdleScreen();
void updateInspectingScreen(int percent);
void showResultScreen();
void generateSerialReport();
void sendTelemetryJSON(bool buttonPressed);
void handleSerialCommands();
void processCommand(String cmd);
void setRGBColor(bool r, bool g, bool b);
void drawProgressBar(int x, int y, int w, int h, int percent);

void setup() {
  // Initialize Serial Interface (high speed for fast DAQ telemetry transfer)
  Serial.begin(115200);
  
  // Configure pin modes
  pinMode(BTN_START, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  pinMode(RGB_RED, OUTPUT);
  pinMode(RGB_GREEN, OUTPUT);
  pinMode(RGB_BLUE, OUTPUT);
  
  // Turn off output devices initially
  setRGBColor(false, false, false);
  digitalWrite(BUZZER, LOW);

  // Initialize SSD1306 OLED Screen
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("{\"error\":\"OLED_init_failed\"}"));
    while (1);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // Show boot initialization sequence
  showBootScreen();
  delay(2000); // 2-second boot welcome delay

  // Initialize MPU6050 Accelerometer
  if (!mpu.begin()) {
    Serial.println(F("{\"error\":\"MPU6050_init_failed\"}"));
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("INIT ERROR:");
    display.println("MPU6050 IMU disconnected");
    display.display();
    while (1) delay(10);
  }
  mpu.setAccelerometerRange(MPU6050_RANGE_2_G);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);

  // Initialize HX711 Load Cell
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(420.0f); // Calibration scaling factor
  scale.tare();            // Offset baseline tare

  // Transition to IDLE/Standby State
  currentState = STATE_IDLE;
  stateStartTime = millis();
}

void loop() {
  // Process any incoming Serial Command instructions from the host App
  handleSerialCommands();

  // Pulse Buzzer if external host alarm is active
  if (externalAlarmActive) {
    digitalWrite(BUZZER, (millis() / 250) % 2 == 0 ? HIGH : LOW);
  }

  // State Machine logic
  switch (currentState) {
    
    case STATE_IDLE: {
      // RGB LED Standby Color: Pulsing Blue
      setRGBColor(false, false, (millis() / 500) % 2 == 0);
      
      // Update screen
      showIdleScreen();

      // Periodically transmit real-time telemetry packets (every 150ms)
      if (millis() - lastTelemetryTime >= 150) {
        lastTelemetryTime = millis();
        sendTelemetryJSON(false);
      }

      // Check if start push-button is pressed (low active)
      if (digitalRead(BTN_START) == LOW) {
        delay(50); // Button debounce delay
        if (digitalRead(BTN_START) == LOW) {
          // Send final trigger JSON to host app, then start scan cycle
          sendTelemetryJSON(true);
          inspectionCount++;
          currentState = STATE_INSPECTING;
          stateStartTime = millis();
          digitalWrite(BUZZER, HIGH); // Confirm click beep
          delay(100);
          digitalWrite(BUZZER, LOW);
        }
      }
      break;
    }

    case STATE_INSPECTING: {
      // Disable external alarm during inspection to avoid noise
      externalAlarmActive = false;

      unsigned long elapsed = millis() - stateStartTime;
      int percent = (int)((elapsed * 100) / INSPECTION_DURATION_MS);
      
      if (percent > 100) percent = 100;

      // Animate RGB LED: Alternate Green/Blue blinking
      if (millis() - lastBlinkTime >= 150) {
        lastBlinkTime = millis();
        static bool alt = false;
        alt = !alt;
        setRGBColor(false, alt, !alt);
      }

      // Render progress indicator on OLED
      updateInspectingScreen(percent);

      // Continuously output real-time sensor measurements over Serial
      if (millis() - lastTelemetryTime >= 150) {
        lastTelemetryTime = millis();
        sendTelemetryJSON(false);
      }

      // Conclude scan simulation
      if (elapsed >= INSPECTION_DURATION_MS) {
        // Collect final sensor values for decision matrix
        finalLoadKg = getLoadCellReading();
        finalVibrationG = getVibrationReading();
        finalDistanceCm = getDistanceReading();

        // Compare against predefined limits
        bool loadOk = (finalLoadKg >= MIN_LOAD_KG && finalLoadKg <= MAX_LOAD_KG);
        bool vibrationOk = (finalVibrationG <= MAX_VIBRATION_G);
        bool distanceOk = (finalDistanceCm >= MIN_DISTANCE_CM && finalDistanceCm <= MAX_DISTANCE_CM);
        
        finalResultPass = (loadOk && vibrationOk && distanceOk);

        // Turn off indicator LEDs
        setRGBColor(false, false, false);
        
        // Print report and transition to results display
        generateSerialReport();
        currentState = STATE_RESULT;
        stateStartTime = millis();
      }
      break;
    }

    case STATE_RESULT: {
      // Update result display
      showResultScreen();

      // Sound active buzzer on FAILURE
      if (!finalResultPass) {
        unsigned long elapsedResult = millis() - stateStartTime;
        // Beep rapidly 3 times (150ms ON, 150ms OFF)
        if (elapsedResult < 900) {
          int beepPhase = elapsedResult / 150;
          digitalWrite(BUZZER, (beepPhase % 2 == 0) ? HIGH : LOW);
        } else {
          digitalWrite(BUZZER, LOW);
        }
      }

      // Stay on result screen for predefined display duration
      if (millis() - stateStartTime >= RESULT_DURATION_MS) {
        digitalWrite(BUZZER, LOW);
        setRGBColor(false, false, false);
        currentState = STATE_IDLE;
        stateStartTime = millis();
      }
      break;
    }
  }
}

/* ==========================================
 *          SENSOR ACCESS FUNCTIONS
 * ========================================== */

// Read Load Cell (HX711), return scaled load force (kg)
float getLoadCellReading() {
  float rawWeight = scale.get_units(2); // Average of 2 readings
  if (rawWeight < 0.0) rawWeight = 0.0;
  return rawWeight;
}

// Read Accelerometer (MPU6050), return net vibration amplitude (g)
float getVibrationReading() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  
  // Convert acceleration to g-force along Z-axis
  float az_g = a.acceleration.z / 9.80665;
  
  // Vibration amplitude represents absolute offset from baseline gravity
  float vibration = abs(az_g - 1.0);
  if (vibration < 0.0) vibration = 0.0;
  return vibration;
}

// Read Ultrasonic Sensor (HC-SR04), return measured distance (cm)
float getDistanceReading() {
  // Fire 10-microsecond trigger pulse
  digitalWrite(US_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(US_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(US_TRIG, LOW);

  // Read response pulse travel duration
  long duration = pulseIn(US_ECHO, HIGH, 30000); // 30ms timeout (approx 5m range limit)
  if (duration == 0) return 99.9;              // Out of range check
  
  // Calculate distance in centimeters
  float distanceCm = (duration * 0.0343) / 2.0;
  return distanceCm;
}

/* ==========================================
 *          OLED INTERFACE DRAWINGS
 * ========================================== */

// 1. Boot screen display
void showBootScreen() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(28, 12);
  display.println(F("SHIELD"));
  display.setTextSize(1);
  display.setCursor(8, 38);
  display.println(F("System Initializing..."));
  display.drawFastHLine(0, 52, 128, SSD1306_WHITE);
  display.display();
}

// 2. Idle standby screen
void showIdleScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("====================="));
  display.setCursor(16, 10);
  display.println(F("SHIELD EDGE NODE"));
  display.setCursor(16, 20);
  display.println(F("Inspection Ready"));
  display.setCursor(0, 30);
  display.println(F("====================="));
  
  display.setCursor(14, 48);
  display.println(F("PRESS START BUTTON"));
  display.display();
}

// 3. Inspection scanning progress screen
void updateInspectingScreen(int percent) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("SHIELD INSPECTION"));
  display.setCursor(0, 12);
  display.println(F("Scanning EV chassis..."));
  
  // Draw bar graphics
  drawProgressBar(6, 28, 116, 14, percent);
  
  display.setCursor(50, 48);
  display.print(percent);
  display.println(F("%"));
  display.display();
}

// 4. Inspection outcome display screen
void showResultScreen() {
  display.clearDisplay();
  display.setTextSize(1);
  
  if (finalResultPass) {
    setRGBColor(false, true, false); // Solid Green for PASS
    display.setCursor(0, 0);
    display.println(F("SHIELD RESULT: PASS"));
    display.println(F("---------------------"));
    display.print(F("Load: ")); display.print(finalLoadKg, 2); display.println(F(" kg"));
    display.print(F("Vibe: ")); display.print(finalVibrationG, 3); display.println(F(" g"));
    display.print(F("Dist: ")); display.print(finalDistanceCm, 2); display.println(F(" cm"));
    display.println(F("---------------------"));
    display.setCursor(30, 54);
    display.println(F("STATUS NOMINAL"));
  } else {
    setRGBColor(true, false, false); // Solid Red for FAIL
    display.setCursor(0, 0);
    display.println(F("SHIELD RESULT: FAIL"));
    display.println(F("---------------------"));
    display.print(F("Load: ")); display.print(finalLoadKg, 2); display.println(F(" kg"));
    display.print(F("Vibe: ")); display.print(finalVibrationG, 3); display.println(F(" g"));
    display.print(F("Dist: ")); display.print(finalDistanceCm, 2); display.println(F(" cm"));
    display.println(F("---------------------"));
    display.setCursor(18, 54);
    display.println(F("DEFECT DETECTED"));
  }
  display.display();
}

// Draw a filled graphical progress bar frame
void drawProgressBar(int x, int y, int w, int h, int percent) {
  display.drawRect(x, y, w, h, SSD1306_WHITE);
  if (percent > 0) {
    int fillW = (w - 4) * percent / 100;
    if (fillW < 0) fillW = 0;
    display.fillRect(x + 2, y + 2, fillW, h - 4, SSD1306_WHITE);
  }
}

/* ==========================================
 *          SERIAL MONITORING
 * ========================================== */

// Print structured report to Serial Monitor
void generateSerialReport() {
  Serial.println(F("=================================="));
  Serial.println(F("SHIELD Edge Node"));
  
  Serial.print(F("Inspection ID : "));
  if (inspectionCount < 10) Serial.print(F("000"));
  else if (inspectionCount < 100) Serial.print(F("00"));
  else if (inspectionCount < 1000) Serial.print(F("0"));
  Serial.println(inspectionCount);
  Serial.println();

  Serial.print(F("Load Force : "));
  Serial.print(finalLoadKg, 2);
  Serial.println(F(" kg"));

  Serial.print(F("Vibration : "));
  if (finalVibrationG <= MAX_VIBRATION_G) {
    Serial.println(F("Normal"));
  } else {
    Serial.println(F("High (Abnormal)"));
  }

  Serial.print(F("Distance : "));
  Serial.print(finalDistanceCm, 2);
  Serial.println(F(" cm"));
  Serial.println();

  Serial.print(F("Structural Integrity : "));
  if (finalResultPass) {
    Serial.println(F("PASS"));
  } else {
    Serial.println(F("FAIL"));
  }
  Serial.println(F("=================================="));
}

// Transmit serial JSON status telemetry packet
void sendTelemetryJSON(bool buttonPressed) {
  float curLoad = getLoadCellReading();
  float curVib = getVibrationReading();
  float curDist = getDistanceReading();

  // Convert acceleration amplitude to absolute gravity value for host parser
  float az_g = curVib + 1.0;
  
  // Scale load cell reading back to weight units expected by host parser
  int weightVal = (int)(curLoad * 100);

  Serial.print(F("{\"weight\":"));
  Serial.print(weightVal);
  Serial.print(F(",\"az\":"));
  Serial.print(az_g, 3);
  Serial.print(F(",\"distance\":"));
  Serial.print(curDist, 2);
  Serial.print(F(",\"button\":"));
  Serial.print(buttonPressed ? 1 : 0);
  Serial.println(F("}"));
}

// Handle serial buffer bytes
void handleSerialCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (serialInputBuffer.length() > 0) {
        processCommand(serialInputBuffer);
        serialInputBuffer = "";
      }
    } else {
      serialInputBuffer += c;
    }
  }
}

// Process bidirectional host commands
void processCommand(String cmd) {
  cmd.trim();
  if (cmd == "ALARM_ON") {
    externalAlarmActive = true;
    setRGBColor(true, false, false); // Force red warning
  } else if (cmd == "ALARM_OFF") {
    externalAlarmActive = false;
    digitalWrite(BUZZER, LOW);
    setRGBColor(false, true, false); // Green status confirmation
    delay(100);
    setRGBColor(false, false, false);
  }
}

/* ==========================================
 *          RGB LED CONTROL
 * ========================================== */

// Fast helper to set state of digital RGB pins
void setRGBColor(bool r, bool g, bool b) {
  digitalWrite(RGB_RED, r ? HIGH : LOW);
  digitalWrite(RGB_GREEN, g ? HIGH : LOW);
  digitalWrite(RGB_BLUE, b ? HIGH : LOW);
}
