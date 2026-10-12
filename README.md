# 🧭 FlowNavigator - Intelligent Crowd Guidance & Safety System

> **Next-Generation AI + IoT Crowd Management & Directional Routing Platform**  
> Complete implementation adhering to the official **FlowNavigator Tech Stack Architecture**.

---

## 🔒 Final FlowNavigator Tech Stack

| Component | Technology | Role & Implementation |
| :--- | :--- | :--- |
| **People Counting** | **VL53L0X ToF Sensors** | High-precision dual Time-of-Flight infrared laser distance sensors for sub-millimeter doorway pedestrian counting (entry/exit directional state machine). |
| **Controller** | **ESP32** | 240MHz dual-core microcontroller with Wi-Fi 802.11 b/g/n, handling I2C bus with XSHUT address multiplexing (`0x30` / `0x31`) and edge debouncing. |
| **Communication** | **Wi-Fi + REST API** | HTTP/1.1 REST JSON telemetry payloads transmitted from ESP32 edge nodes directly to Flask `/api/sensors/telemetry`. |
| **Prediction** | **Random Forest** | Scikit-Learn `RandomForestClassifier` (Congestion Risk: SAFE, MODERATE, HIGH, CRITICAL; 91.7% accuracy) & `RandomForestRegressor` (Queue wait time; R² = 0.978). |
| **ML** | **Python** | Full training pipeline (`ml/train_model.py`), saved model artifacts (`.joblib`), and low-latency inference module (`ml/predictor.py`). |
| **Backend** | **Flask** | Robust Python REST API server (`app.py`) with CORS, routing engine, emergency broadcasting, and static asset dispatcher. |
| **Database** | **MongoDB** | Real-time NoSQL data persistence via `pymongo` with automatic `mongomock` in-memory fallback. Collections: `venues`, `zones`, `sensors`, `routes`, `alerts`, `predictions`. |
| **Frontend** | **HTML + CSS + JavaScript** | Ultra-rich modern UI with custom glassmorphism, responsive grid layouts, animations, Senior Citizen Mode, and zero framework bloat. |
| **Maps & Routing** | **Google Maps Platform** | Google Maps JavaScript API with dynamic custom route polylines, crowd-aware heatmaps, live zone markers, and instant vector GIS twin fallback. |
| **Deployment** | **Vercel** | Production serverless configuration via `vercel.json` and WSGI handler `api/index.py`. |

---

## 🚀 Running the Project Locally

### 1. Prerequisites
- **Python 3.10+** (Python 3.13 supported)
- **MongoDB** (Local `mongodb://localhost:27017` or MongoDB Atlas; falls back to in-memory PyMongo automatically if not running)

### 2. Start the Application
Simply run:
```bash
python app.py
```
Or using npm:
```bash
npm start
```

### 3. Open in Browser
Visit:
👉 **[http://localhost:5000](http://localhost:5000)** or **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🌟 Key Features & Views

### 1. Citizen & Visitor Guidance View
- **Real-Time Crowd Density Gauge**: Visual circular meter indicating venue safety level (Safe, Moderate, Heavy, Critical).
- **Crowd-Aware Route Finder**: Select starting gate and destination to receive live path guidance:
  - **Route C (North Express Lane)**: **Recommended** (sub-6 min wait time, 34% density).
  - **Route A (Direct Shrine)**: **Choked Bottleneck** (28+ min delays, 92% density — avoid).
- **Senior Citizen Accessibility Mode**: High-contrast layout, enlarged typography, and audio voice prompts via Web Speech API.
- **Google Maps GIS Twin**: Interactive map displaying venue layout, zone density circles, and color-coded route polylines.

### 2. Command & Control Admin Dashboard
- **Overview**: Real-time crowd headcounts, active sensor count, surge alerts, and hourly ingress/egress trend chart.
- **Live Zone Digital Twin**: Grid of venue zones with live occupancy progress bars, net flow rates, and risk badges.
- **Google Maps Platform Explorer**: Geospatial GIS overview with satellite/terrain toggles and route overlays.
- **Random Forest ML Studio**: Interactive sliders for Headcount, Capacity, Influx Rate, and Bottleneck proximity to test real-time predictions and inspect Gini Feature Importances.
- **IoT Sensors & ESP32 Fleet**: Real-time telemetry table plus an **Interactive ESP32 Simulator** allowing you to test pedestrian entry/exit triggers and inspect raw HTTP POST JSON packets.
- **Smart Pre-Event Planner**: Computes required VL53L0X sensor counts, optimal staff deployment, and choke risk analysis.
- **MongoDB Explorer**: Live inspect collections (`venues`, `zones`, `sensors`, `routes`, `alerts`, `predictions`).

### 3. Public Kiosk Mode
- Full-screen high-contrast outdoor digital signage mode (`/kiosk`) for railway terminals and festival gates showing "WHICH GATE TO TAKE" with green/red status and QR code for mobile routing.

---

## 📡 REST API Specifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check, MongoDB connection status, and ML model metadata |
| `GET` | `/api/zones` | Real-time zone headcount, capacity, and attached Random Forest predictions |
| `GET` | `/api/routes` | Crowd-aware route recommendations with estimated wait/walk times |
| `GET` | `/api/sensors` | ESP32 + VL53L0X sensor node registry and hardware telemetry |
| `POST` | `/api/sensors/telemetry` | **ESP32 Ingestion**: Accepts distance readings and headcount increments |
| `POST` | `/api/sensors/simulate` | Interactive simulator trigger for pedestrian entry/exit |
| `POST` | `/api/predict/zone` | Runs Random Forest inference on custom feature inputs |
| `GET` | `/api/predict/model-info` | Returns model accuracy, R² score, and feature importances |
| `POST` | `/api/emergency/toggle` | Activates venue-wide evacuation protocol and unlocks exit corridors |
| `POST` | `/api/planner/generate` | Generates AI and heuristic pre-event safety plans |

---

## 🔌 ESP32 + VL53L0X Hardware Firmware

The production Arduino C++ sketch is available in:
📁 [`firmware/esp32_vl53l0x_counter.ino`](file:///c:/Users/HP/OneDrive/Desktop/projects/FLOW-NAVIGATOR/firmware/esp32_vl53l0x_counter.ino)

### Wiring Pinout Summary:
- **I2C Bus**: ESP32 GPIO 21 (SDA), GPIO 22 (SCL)
- **Sensor A XSHUT**: GPIO 16 (Address `0x30`)
- **Sensor B XSHUT**: GPIO 17 (Address `0x31`)
- **Power**: 3.3V DC & Common Ground

See [`firmware/README.md`](file:///c:/Users/HP/OneDrive/Desktop/projects/FLOW-NAVIGATOR/firmware/README.md) for full circuit schematics and calibration steps.

---

## 🌐 Deployment to Vercel

The project is pre-configured for one-command deployment to Vercel:
```bash
npx vercel
```
Or connect your GitHub repository to Vercel; `vercel.json` and `api/index.py` handle serverless execution automatically!
