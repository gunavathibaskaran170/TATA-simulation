/*
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
