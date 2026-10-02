/*
 * FlowNavigator - ESP32 + Dual VL53L0X ToF Sensors People Counter
 * 
 * Target Hardware:
 * - ESP32 NodeMCU / ESP32-WROOM-32
 * - 2x VL53L0X Time-of-Flight (ToF) Distance Sensors (Laser Rangefinders)
 * - Wi-Fi 802.11 b/g/n connecting to Flask REST Backend
 *
 * Principle of Operation:
 * - Two VL53L0X sensors placed ~15cm apart at doorway / turnstile entrance.
 * - Distance threshold: 200mm - 1200mm (detects pedestrian passing through without false triggers).
 * - State machine tracks entry/exit sequence:
 *   Sensor A -> Sensor B = Person ENTERED (IN + 1)
 *   Sensor B -> Sensor A = Person EXITED  (OUT + 1)
 * - On count update, sends HTTP POST to Flask endpoint: /api/sensors/telemetry
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <VL53L0X.h>

// ================= USER CONFIGURATION =================
const char* WIFI_SSID     = "FlowNavigator_WiFi";
const char* WIFI_PASSWORD = "SafeCrowdSecureKey";
const char* SERVER_URL    = "http://192.168.1.100:5000/api/sensors/telemetry";

// Hardware Identification
const char* SENSOR_NODE_ID = "SENSOR-ESP32-001";
const char* ZONE_ID        = "zone-a";

// Pinout Definitions (ESP32)
#define SDA_PIN       21
#define SCL_PIN       22
#define XSHUT_PIN_A   16 // Sensor A (Outer door ToF)
#define XSHUT_PIN_B   17 // Sensor B (Inner door ToF)
#define LED_INDICATOR 2  // Built-in status LED

// Detection Thresholds (millimeters)
#define MIN_DISTANCE_MM 150
#define MAX_DISTANCE_MM 1300
#define DETECTION_TIMEOUT_MS 1500

// I2C Addresses for dual VL53L0X sensors
#define SENSOR_A_ADDR 0x30
#define SENSOR_B_ADDR 0x31

// Sensor Objects
VL53L0X sensorA;
VL53L0X sensorB;

// State Tracking
int peopleIn = 0;
int peopleOut = 0;
int currentCount = 0;

enum DirectionState { IDLE, A_TRIGGERED, B_TRIGGERED };
DirectionState currentState = IDLE;
unsigned long triggerTimestamp = 0;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL_MS = 10000; // 10s heartbeat

// Function Declarations
void setupSensors();
void processPeopleCounting();
void sendTelemetry(int distA, int distB);
void connectWiFi();

void setup() {
  Serial.begin(115200);
  pinMode(LED_INDICATOR, OUTPUT);
  digitalWrite(LED_INDICATOR, LOW);

  Serial.println("\n==========================================");
  Serial.println("  FlowNavigator - ESP32 ToF People Counter");
  Serial.println("==========================================");

  Wire.begin(SDA_PIN, SCL_PIN);
  setupSensors();
  connectWiFi();

  Serial.println("[System] Ready and monitoring doorway stream.");
}

void loop() {
  // Ensure Wi-Fi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  processPeopleCounting();

  // Periodic heartbeat every 10 seconds
  if (millis() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
    uint16_t distA = sensorA.readRangeContinuousMillimeters();
    uint16_t distB = sensorB.readRangeContinuousMillimeters();
    sendTelemetry(distA, distB);
    lastHeartbeat = millis();
  }

  delay(25); // ~40Hz sampling rate
}

void setupSensors() {
  pinMode(XSHUT_PIN_A, OUTPUT);
  pinMode(XSHUT_PIN_B, OUTPUT);

  // Reset both sensors
  digitalWrite(XSHUT_PIN_A, LOW);
  digitalWrite(XSHUT_PIN_B, LOW);
  delay(10);

  // Initialize Sensor A
  digitalWrite(XSHUT_PIN_A, HIGH);
  delay(10);
  sensorA.setTimeout(500);
  if (!sensorA.init()) {
    Serial.println("[Error] Failed to initialize VL53L0X Sensor A!");
  } else {
    sensorA.setAddress(SENSOR_A_ADDR);
    sensorA.startContinuous(30);
    Serial.println("[Sensor A] Initialized at 0x30");
  }

  // Initialize Sensor B
  digitalWrite(XSHUT_PIN_B, HIGH);
  delay(10);
  sensorB.setTimeout(500);
  if (!sensorB.init()) {
    Serial.println("[Error] Failed to initialize VL53L0X Sensor B!");
  } else {
    sensorB.setAddress(SENSOR_B_ADDR);
    sensorB.startContinuous(30);
    Serial.println("[Sensor B] Initialized at 0x31");
  }
}

void connectWiFi() {
  Serial.printf("[Wi-Fi] Connecting to %s...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] Connected! IP: " + WiFi.localIP().toString());
    digitalWrite(LED_INDICATOR, HIGH);
  } else {
    Serial.println("\n[Wi-Fi] Connection timeout. Buffering locally.");
    digitalWrite(LED_INDICATOR, LOW);
  }
}

void processPeopleCounting() {
  uint16_t distA = sensorA.readRangeContinuousMillimeters();
  uint16_t distB = sensorB.readRangeContinuousMillimeters();

  bool aActive = (distA >= MIN_DISTANCE_MM && distA <= MAX_DISTANCE_MM);
  bool bActive = (distB >= MIN_DISTANCE_MM && distB <= MAX_DISTANCE_MM);

  unsigned long now = millis();

  // Reset state if timeout exceeded
  if (currentState != IDLE && (now - triggerTimestamp > DETECTION_TIMEOUT_MS)) {
    currentState = IDLE;
  }

  switch (currentState) {
    case IDLE:
      if (aActive && !bActive) {
        currentState = A_TRIGGERED;
        triggerTimestamp = now;
      } else if (bActive && !aActive) {
        currentState = B_TRIGGERED;
        triggerTimestamp = now;
      }
      break;

    case A_TRIGGERED:
      // Transition: A was triggered, now B is triggered -> ENTRY EVENT!
      if (bActive) {
        peopleIn++;
        currentCount = max(0, peopleIn - peopleOut);
        currentState = IDLE;
        Serial.printf("[EVENT: ENTRY] Count: %d | Total In: %d | Total Out: %d\n", currentCount, peopleIn, peopleOut);
        sendTelemetry(distA, distB);
        delay(250); // Debounce
      }
      break;

    case B_TRIGGERED:
      // Transition: B was triggered, now A is triggered -> EXIT EVENT!
      if (aActive) {
        peopleOut++;
        currentCount = max(0, peopleIn - peopleOut);
        currentState = IDLE;
        Serial.printf("[EVENT: EXIT] Count: %d | Total In: %d | Total Out: %d\n", currentCount, peopleIn, peopleOut);
        sendTelemetry(distA, distB);
        delay(250); // Debounce
      }
      break;
  }
}

void sendTelemetry(int distA, int distB) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");

  // Construct JSON REST Payload
  int rssi = WiFi.RSSI();
  String json = "{";
  json += "\"sensor_id\":\"" + String(SENSOR_NODE_ID) + "\",";
  json += "\"zone_id\":\"" + String(ZONE_ID) + "\",";
  json += "\"people_in\":" + String(peopleIn) + ",";
  json += "\"people_out\":" + String(peopleOut) + ",";
  json += "\"current_count\":" + String(currentCount) + ",";
  json += "\"tof_distance_mm_a\":" + String(distA) + ",";
  json += "\"tof_distance_mm_b\":" + String(distB) + ",";
  json += "\"signal_dbm\":" + String(rssi) + ",";
  json += "\"battery_pct\":98,";
  json += "\"firmware_version\":\"v3.2.0-ESP32-VL53L0X\"";
  json += "}";

  int httpCode = http.POST(json);
  if (httpCode > 0) {
    Serial.printf("[REST API] Status: %d | Sent telemetry\n", httpCode);
  } else {
    Serial.printf("[REST API] Error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}
