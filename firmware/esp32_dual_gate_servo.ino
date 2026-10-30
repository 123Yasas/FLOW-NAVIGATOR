// =========================================================================
// FlowNavigator ESP32-S3 Dual VL53L0X Counter + Dual-Gate Servo (GPIO 4)
// Target: ESP32 / ESP32-S3
// Endpoint: /api/crowd
// =========================================================================
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <VL53L0X.h>
#include <ESP32Servo.h> // Library Manager: ESP32Servo by Kevin Harrington

// --- Network Configuration ---
const char* ssid = "SVVT AirFiber";
const char* password = "YOUR_WIFI_PASSWORD";
// Set to your computer's local IP running python app.py:
const char* SERVER_URL = "http://10.150.41.155:5000/api/crowd";

// --- Servo Configuration (GPIO 4) ---
const int SERVO_PIN = 4;           // Servo Signal Pin set to GPIO 4
const int GATE_A_OPEN_ANGLE = 0;   // Venue A OPEN, Venue B CLOSED
const int GATE_B_OPEN_ANGLE = 90;  // Venue A CLOSED, Venue B OPEN (Diverted to Venue B)
Servo gateServo;

// --- Sensors & I2C ---
TwoWire I2C_Entry = TwoWire(0);
TwoWire I2C_Exit = TwoWire(1);
VL53L0X entrySensor;
VL53L0X exitSensor;

// --- Crowd & Gate State ---
int startingPeople = 0;
int crowd = startingPeople;
int entryCount = 0;
int exitCount = 0;
const int CAPACITY = 10;
const int VENUE_B_LIMIT = 8;
const int DETECTION_LIMIT_MM = 50;

bool entryDetected = false;
bool exitDetected = false;
String lastEvent = "STARTED";
String gateStatus = "GATE_A_OPEN";

unsigned long lastUpload = 0;
const unsigned long UPLOAD_INTERVAL = 2000;

// Updates the servo barrier position based on crowd count
void updateGatePosition() {
  if (crowd >= CAPACITY) {
    // Venue A reached capacity -> CLOSE Venue A Gate, OPEN Venue B Gate
    gateServo.write(GATE_B_OPEN_ANGLE);
    gateStatus = "GATE_A_CLOSED_GATE_B_OPEN";
  } else {
    // Venue A has available capacity -> OPEN Venue A Gate, CLOSE Venue B Gate
    gateServo.write(GATE_A_OPEN_ANGLE);
    gateStatus = "GATE_A_OPEN_GATE_B_CLOSED";
  }
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.println("\n[FlowNavigator] Initializing Dual Gate System with Servo on GPIO 4...");

  // Setup ESP32 PWM timers for Servo
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  gateServo.setPeriodHertz(50);             // Standard 50Hz servo
  gateServo.attach(SERVO_PIN, 500, 2400);   // Attach to GPIO 4

  // Set initial gate state
  updateGatePosition();

  // Setup I2C Buses for dual sensors
  I2C_Entry.begin(8, 9);
  I2C_Entry.setClock(100000);
  I2C_Exit.begin(10, 11);
  I2C_Exit.setClock(100000);

  entrySensor.setBus(&I2C_Entry);
  exitSensor.setBus(&I2C_Exit);
  entrySensor.setTimeout(1000);
  exitSensor.setTimeout(1000);

  if (!entrySensor.init()) { Serial.println("ERROR: Entry sensor failed!"); while (1) { delay(1000); } }
  if (!exitSensor.init()) { Serial.println("ERROR: Exit sensor failed!"); while (1) { delay(1000); } }

  entrySensor.setMeasurementTimingBudget(50000);
  exitSensor.setMeasurementTimingBudget(50000);
  entrySensor.startContinuous(100);
  exitSensor.startContinuous(100);

  // Setup Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n[Wi-Fi] Connected! IP: " + WiFi.localIP().toString());
}

void loop() {
  uint16_t entryDistance = entrySensor.readRangeContinuousMillimeters();
  bool entryTimeout = entrySensor.timeoutOccurred();
  uint16_t exitDistance = exitSensor.readRangeContinuousMillimeters();
  bool exitTimeout = exitSensor.timeoutOccurred();

  // --- Person Entry Logic ---
  if (!entryTimeout && entryDistance != 65535) {
    if (entryDistance < DETECTION_LIMIT_MM && !entryDetected) {
      entryDetected = true;
      if (crowd < CAPACITY) {
        crowd++;
        entryCount++;
        lastEvent = "PERSON_ENTERED";
      } else {
        lastEvent = "ENTRY_BLOCKED_VENUE_A_FULL";
      }
      // Instantly move gate servo when count changes
      updateGatePosition();
    }
    if (entryDistance >= DETECTION_LIMIT_MM) {
      entryDetected = false;
    }
  }

  // --- Person Exit Logic ---
  if (!exitTimeout && exitDistance != 65535) {
    if (exitDistance < DETECTION_LIMIT_MM && !exitDetected) {
      exitDetected = true;
      if (crowd > 0) {
        crowd--;
        exitCount++;
        lastEvent = "PERSON_EXITED";
      } else {
        lastEvent = "EXIT_IGNORED";
      }
      // Instantly move gate servo when count changes
      updateGatePosition();
    }
    if (exitDistance >= DETECTION_LIMIT_MM) {
      exitDetected = false;
    }
  }

  // Status computation
  String status = (crowd >= CAPACITY) ? "NO_ENTRY_ALLOWED" : (crowd >= VENUE_B_LIMIT ? "RECOMMEND_VENUE_B" : "ENTRY_ALLOWED");

  // --- Send Telemetry to Flask Backend ---
  if (millis() - lastUpload >= UPLOAD_INTERVAL) {
    lastUpload = millis();

    float entryCM = (!entryTimeout && entryDistance != 65535) ? entryDistance / 10.0 : -1.0;
    float exitCM = (!exitTimeout && exitDistance != 65535) ? exitDistance / 10.0 : -1.0;

    Serial.printf("Entry: %.1f cm | Exit: %.1f cm | Crowd: %d/%d | Gate: %s | Status: %s\n",
                  entryCM, exitCM, crowd, CAPACITY, gateStatus.c_str(), status.c_str());

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      if (http.begin(SERVER_URL)) {
        http.setTimeout(1500);
        http.addHeader("Content-Type", "application/json");

        String payload = "{\"sensor_id\":\"ESP32-S3-VL53L0X-GATE\","
                         "\"zone_id\":\"zone-a-sona-college\","
                         "\"venue_id\":\"sona-college\","
                         "\"entryCount\":" + String(entryCount) + ","
                         "\"exitCount\":" + String(exitCount) + ","
                         "\"currentCrowd\":" + String(crowd) + ","
                         "\"capacity\":" + String(CAPACITY) + ","
                         "\"entryDistanceCm\":" + String(entryCM, 1) + ","
                         "\"exitDistanceCm\":" + String(exitCM, 1) + ","
                         "\"status\":\"" + status + "\","
                         "\"gateStatus\":\"" + gateStatus + "\","
                         "\"lastEvent\":\"" + lastEvent + "\"}";

        int responseCode = http.POST(payload);
        Serial.print("Backend HTTP Response: ");
        Serial.println(responseCode);
        http.end();
      }
    } else {
      Serial.println("[Wi-Fi] Not connected.");
    }
  }

  delay(50);
}

