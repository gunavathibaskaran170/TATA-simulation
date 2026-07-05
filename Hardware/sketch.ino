// Smart EV Manufacturing Inspection Prototype
// Arduino Uno + HX711 Load Cell + MPU6050 IMU + HC-SR04 + SSD1306 OLED + RGB LED + Buzzer + Button

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "HX711.h"

// Pin Definitions
#define HX711_DT_PIN 2
#define HX711_SCK_PIN 3
#define TRIG_PIN 4
#define ECHO_PIN 5
#define BUTTON_PIN 7
#define BUZZER_PIN 8
#define RED_PIN 9
#define GREEN_PIN 10
#define BLUE_PIN 11

// OLED Display
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// HX711 Load Cell
HX711 scale;

// MPU6050 I2C Address
#define MPU6050_ADDR 0x68

// Thresholds
#define LOAD_MIN 50.0       // Minimum load in grams
#define LOAD_MAX 500.0      // Maximum load in grams
#define VIBRATION_MAX 2000  // Maximum vibration (accel magnitude)
#define DISTANCE_MIN 5.0    // Minimum distance in cm
#define DISTANCE_MAX 15.0   // Maximum distance in cm

// Button Debounce
bool lastReading = LOW;
bool stableState = LOW;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY = 50;

// Inspection State
bool inspectionRunning = false;
bool inspectionComplete = false;
bool passStatus = false;

// Sensor Values
float loadValue = 0.0;
float vibrationMagnitude = 0.0;
float distance = 0.0;

void setup() {
  Serial.begin(9600);
  Serial.println("EV Manufacturing Inspection System");
  Serial.println("==================================");
  
  // Pin Modes
  pinMode(BUTTON_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Initialize RGB LED (off)
  setRGBColor(0, 0, 0);
  noTone(BUZZER_PIN);
  
  // Initialize OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;);
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("EV Inspection");
  display.println("System Ready");
  display.println("");
  display.println("Press START");
  display.display();
  
  // Initialize HX711
  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);
  scale.set_scale(420.0);  // Calibration factor
  scale.tare();
  Serial.println("HX711 initialized and tared");
  
  // Initialize MPU6050
  Wire.begin();
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x6B);  // PWR_MGMT_1 register
  Wire.write(0x00);  // Wake up MPU6050
  Wire.endTransmission(true);
  Serial.println("MPU6050 initialized");
  
  Serial.println("\nPress START button to begin inspection...\n");
}

void loop() {
  // Button Debounce
  bool reading = digitalRead(BUTTON_PIN);
  if (reading != lastReading) {
    lastDebounceTime = millis();
  }
  
  if (millis() - lastDebounceTime > DEBOUNCE_DELAY) {
    if (reading != stableState) {
      stableState = reading;
      if (stableState == HIGH && !inspectionRunning) {
        // Start inspection on button press
        startInspection();
      }
    }
  }
  lastReading = reading;
  
  // Run inspection if active
  if (inspectionRunning) {
    runInspection();
  }
}

void startInspection() {
  inspectionRunning = true;
  inspectionComplete = false;
  
  Serial.println("\n========== INSPECTION STARTED ==========");
  
  // Clear display
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("INSPECTING...");
  display.display();
  
  // Turn off LEDs and buzzer
  setRGBColor(0, 0, 0);
  noTone(BUZZER_PIN);
}

void runInspection() {
  // Read Load Cell
  loadValue = scale.get_units(10);
  Serial.print("Load: ");
  Serial.print(loadValue);
  Serial.println(" g");
  
  // Read MPU6050 (Vibration)
  int16_t ax, ay, az;
  readMPU6050(&ax, &ay, &az);
  vibrationMagnitude = sqrt((float)ax * ax + (float)ay * ay + (float)az * az);
  Serial.print("Vibration Magnitude: ");
  Serial.println(vibrationMagnitude);
  
  // Read HC-SR04 (Distance)
  distance = readUltrasonic();
  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.println(" cm");
  
  // Evaluate Pass/Fail
  bool loadPass = (loadValue >= LOAD_MIN && loadValue <= LOAD_MAX);
  bool vibrationPass = (vibrationMagnitude <= VIBRATION_MAX);
  bool distancePass = (distance >= DISTANCE_MIN && distance <= DISTANCE_MAX);
  
  passStatus = loadPass && vibrationPass && distancePass;
  
  Serial.println("\n--- INSPECTION RESULTS ---");
  Serial.print("Load: ");
  Serial.println(loadPass ? "PASS" : "FAIL");
  Serial.print("Vibration: ");
  Serial.println(vibrationPass ? "PASS" : "FAIL");
  Serial.print("Distance: ");
  Serial.println(distancePass ? "PASS" : "FAIL");
  Serial.print("\nOVERALL: ");
  Serial.println(passStatus ? "PASS" : "FAIL");
  Serial.println("========================================\n");
  
  // Display Results on OLED
  display.clearDisplay();
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.print("Load: ");
  display.print(loadValue, 1);
  display.println(" g");
  display.print("Vib: ");
  display.println((int)vibrationMagnitude);
  display.print("Dist: ");
  display.print(distance, 1);
  display.println(" cm");
  display.println("");
  display.setTextSize(2);
  if (passStatus) {
    display.println("PASS");
  } else {
    display.println("FAIL");
  }
  display.display();
  
  // Set LED and Buzzer
  if (passStatus) {
    setRGBColor(0, 255, 0);  // Green
    noTone(BUZZER_PIN);
  } else {
    setRGBColor(255, 0, 0);  // Red
    tone(BUZZER_PIN, 1000);  // 1kHz alarm
  }
  
  inspectionRunning = false;
  inspectionComplete = true;
}

void readMPU6050(int16_t* ax, int16_t* ay, int16_t* az) {
  Wire.beginTransmission(MPU6050_ADDR);
  Wire.write(0x3B);  // Starting register for accel data
  Wire.endTransmission(false);
  Wire.requestFrom(MPU6050_ADDR, 6, true);
  
  *ax = (Wire.read() << 8) | Wire.read();
  *ay = (Wire.read() << 8) | Wire.read();
  *az = (Wire.read() << 8) | Wire.read();
}

float readUltrasonic() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  float dist = duration * 0.034 / 2.0;
  
  if (dist == 0 || dist > 400) {
    dist = 400;  // Out of range
  }
  
  return dist;
}

void setRGBColor(int red, int green, int blue) {
  analogWrite(RED_PIN, red);
  analogWrite(GREEN_PIN, green);
  analogWrite(BLUE_PIN, blue);
}
