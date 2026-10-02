# FlowNavigator IoT Edge Counter - Hardware & Firmware Guide

## 📌 Technology Stack Specifications
- **People Counting Sensor**: STMicroelectronics VL53L0X Time-of-Flight (ToF) Laser Distance Sensors (I2C)
- **Edge Microcontroller**: Espressif ESP32-WROOM-32 / NodeMCU-32S
- **Communication Protocol**: Wi-Fi (802.11 b/g/n) + REST JSON API
- **Backend Ingestion**: Flask `/api/sensors/telemetry`

---

## ⚡ Circuit & Wiring Schematic

### ESP32 to Dual VL53L0X Connection Table

| ESP32 Pin | Sensor A (Outer ToF) | Sensor B (Inner ToF) | Function |
| :--- | :--- | :--- | :--- |
| **3V3** | VIN | VIN | 3.3V DC Power |
| **GND** | GND | GND | Common Ground |
| **GPIO 21** | SDA | SDA | Shared I2C Data Line |
| **GPIO 22** | SCL | SCL | Shared I2C Clock Line |
| **GPIO 16** | XSHUT | — | Hardware Shutdown / Address Pin (A) |
| **GPIO 17** | — | XSHUT | Hardware Shutdown / Address Pin (B) |
| **GPIO 2** | Built-in LED | — | Connection & Trigger Indicator |

> [!NOTE]
> Since both VL53L0X sensors boot with the default I2C address `0x29`, the ESP32 keeps both `XSHUT` pins LOW, activates Sensor A to change its address to `0x30`, then boots Sensor B and assigns it `0x31`. This enables simultaneous sub-millimeter tracking on a single I2C bus!

---

## 🔄 Bidirectional People Counting Algorithm

```
        OUTSIDE (Corridor / Plaza)
  =======================================
          [ Sensor A (0x30) ]
                 ↕ ~15 cm
          [ Sensor B (0x31) ]
  =======================================
        INSIDE (Sanctum / Zone Hall)

Sequence:
• Person Entering: Triggers A first -> then B ==> people_in++ (Count + 1)
• Person Exiting:  Triggers B first -> then A ==> people_out++ (Count - 1)
```

---

## 📡 REST API Telemetry Format

The ESP32 sends real-time HTTP POST requests:
- **Endpoint**: `http://<FLASK_IP>:5000/api/sensors/telemetry`
- **Method**: `POST`
- **Content-Type**: `application/json`

```json
{
  "sensor_id": "SENSOR-ESP32-001",
  "zone_id": "zone-a",
  "people_in": 541,
  "people_out": 295,
  "current_count": 246,
  "tof_distance_mm_a": 412,
  "tof_distance_mm_b": 1180,
  "signal_dbm": -54,
  "battery_pct": 98,
  "firmware_version": "v3.2.0-ESP32-VL53L0X"
}
```
