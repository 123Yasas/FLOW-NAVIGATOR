"""
FlowNavigator - Main Flask Application Backend
Tech Stack:
- Backend: Flask
- ML: Python (Random Forest via scikit-learn)
- Database: MongoDB (pymongo + mongomock fallback)
- People Counting: VL53L0X ToF Sensors
- Controller: ESP32 (Wi-Fi + REST API)
- Frontend: HTML + CSS + JavaScript
- Maps: Google Maps Platform
- Deployment: Vercel Ready
"""

import os
import datetime
from flask import Flask, jsonify, request, render_template, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Internal modules
from database import db
from ml.predictor import predictor

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

PORT = int(os.getenv("PORT", 5000))
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# Global system state
SYSTEM_STATE = {
    "emergency_mode": False,
    "emergency_message": "🚨 EMERGENCY EVACUATION ACTIVE - FOLLOW GREEN ILLUMINATED PATHWAYS TO PARKING & EXITS",
    "active_venue_id": "palani-gathering"
}

# ==================== CORE FRONTEND ROUTES ====================

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/kiosk")
def kiosk():
    return render_template("index.html")

# ==================== ADMIN AUTHENTICATION ====================

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    
    if username == "admin" and password == "admin123":
        return jsonify({
            "success": True,
            "role": "admin",
            "token": "fn_admin_session_token_authenticated",
            "message": "Authentication successful"
        })
    return jsonify({
        "success": False,
        "message": "Invalid credentials. Use admin / admin123"
    }), 401

# ==================== REST API ENDPOINTS ====================

@app.route("/api/health", methods=["GET"])
def health():
    db_status = db.get_status()
    ml_status = predictor.get_model_info()
    return jsonify({
        "status": "healthy",
        "service": "FlowNavigator Central Dispatcher",
        "timestamp": datetime.datetime.now().isoformat(),
        "database": db_status,
        "machine_learning": {
            "algorithm": ml_status.get("algorithm"),
            "status": ml_status.get("status"),
            "accuracy": ml_status.get("accuracy"),
            "r2_score": ml_status.get("r2_score")
        },
        "system": SYSTEM_STATE
    })

# --- Venues ---
@app.route("/api/venues", methods=["GET"])
def get_venues():
    venues = db.get_venues()
    return jsonify({"venues": venues, "active_venue_id": SYSTEM_STATE["active_venue_id"]})

# --- Zones & Live Predictions ---
@app.route("/api/zones", methods=["GET"])
def get_zones():
    venue_id = request.args.get("venue_id", SYSTEM_STATE["active_venue_id"])
    zones = db.get_zones(venue_id)
    
    # Enrich each zone with live Random Forest prediction
    enriched_zones = []
    for zone in zones:
        prediction = predictor.predict_zone(zone)
        zone_copy = dict(zone)
        zone_copy["prediction"] = prediction
        # If in emergency mode, mark safe evacuation paths
        if SYSTEM_STATE["emergency_mode"]:
            if zone_copy.get("is_evacuation_path"):
                zone_copy["emergency_guidance"] = "ACTIVE EVACUATION ARTERY"
            else:
                zone_copy["emergency_guidance"] = "RESTRICTED - REDIRECT TO EXITS"
        enriched_zones.append(zone_copy)
        
    return jsonify({"zones": enriched_zones, "emergency_mode": SYSTEM_STATE["emergency_mode"]})

# --- Routes & Google Maps Paths ---
@app.route("/api/routes", methods=["GET"])
def get_routes():
    routes = db.get_routes()
    # In emergency mode, highlight evacuation routes
    if SYSTEM_STATE["emergency_mode"]:
        for r in routes:
            if "Bypass" in r["name"] or "Parking" in r["name"]:
                r["tag"] = "EVACUATION_ROUTE"
                r["color"] = "#10b981"
                r["explainable_reason"] = "DESIGNATED RAPID EVACUATION CORRIDOR TO OPEN SAFETY GROUNDS."
            else:
                r["tag"] = "AVOID"
                r["color"] = "#ef4444"
                r["explainable_reason"] = "SANCTUM CLOSED DURING EVACUATION. PROCEED TO EXTERIOR."
    return jsonify({"routes": routes})

# --- Sensors (ESP32 + VL53L0X ToF) ---
@app.route("/api/sensors", methods=["GET"])
def get_sensors():
    sensors = db.get_sensors()
    return jsonify({"sensors": sensors})

@app.route("/api/sensors/telemetry", methods=["POST"])
def sensor_telemetry():
    """
    Primary ingestion endpoint for ESP32 edge microcontrollers.
    Receives JSON with VL53L0X distance readings and headcount delta.
    """
    data = request.get_json() or {}
    sensor_id = data.get("sensor_id")
    if not sensor_id:
        return jsonify({"error": "sensor_id is required"}), 400

    people_in = int(data.get("people_in", 0))
    people_out = int(data.get("people_out", 0))
    current_count = int(data.get("current_count", max(0, people_in - people_out)))
    tof_a = data.get("tof_distance_mm_a")
    tof_b = data.get("tof_distance_mm_b")
    battery_pct = data.get("battery_pct", 95)
    signal_dbm = data.get("signal_dbm", -55)
    zone_id = data.get("zone_id", "zone-a")

    # Update sensor in MongoDB
    db.update_sensor_telemetry(
        sensor_id=sensor_id,
        people_in=people_in,
        people_out=people_out,
        current_count=current_count,
        tof_dist_a=tof_a,
        tof_dist_b=tof_b,
        battery_pct=battery_pct,
        signal_dbm=signal_dbm
    )

    # Calculate real-time entry and exit rates
    zone = db.get_zone(zone_id)
    if zone:
        old_count = zone.get("current_count", 0)
        entry_rate = zone.get("entry_rate", 35)
        exit_rate = zone.get("exit_rate", 30)
        
        # Recalculate zone status based on capacity
        capacity = max(1, zone.get("capacity", 800))
        ratio = current_count / capacity
        if ratio >= 0.9:
            status = "CRITICAL"
        elif ratio >= 0.75:
            status = "HIGH"
        elif ratio >= 0.5:
            status = "MODERATE"
        else:
            status = "SAFE"

        db.update_zone_count(zone_id, current_count, entry_rate, exit_rate, status)

    return jsonify({
        "status": "success",
        "message": f"Telemetry processed for {sensor_id}",
        "current_count": current_count,
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route("/api/sensors/simulate", methods=["POST"])
def simulate_sensor_tick():
    """
    Interactive endpoint for the UI dashboard to simulate ESP32 + VL53L0X
    pedestrian detections (entry, exit, or burst noise).
    """
    data = request.get_json() or {}
    sensor_id = data.get("sensor_id", "SENSOR-ESP32-001")
    event_type = data.get("event", "entry") # 'entry', 'exit', or 'burst'
    
    sensor = db.get_sensor(sensor_id)
    if not sensor:
        sensor = {
            "people_in": 500,
            "people_out": 250,
            "current_count": 250,
            "zone_id": "zone-a"
        }

    people_in = sensor.get("people_in", 0)
    people_out = sensor.get("people_out", 0)

    if event_type == "entry":
        people_in += 1
        tof_a, tof_b = 380, 1100  # Sensor A triggered first
    elif event_type == "exit":
        people_out += 1
        tof_a, tof_b = 1150, 420  # Sensor B triggered first
    elif event_type == "burst":
        people_in += 15
        tof_a, tof_b = 310, 330
    else:
        tof_a, tof_b = 1200, 1200

    current_count = max(0, people_in - people_out)

    db.update_sensor_telemetry(
        sensor_id=sensor_id,
        people_in=people_in,
        people_out=people_out,
        current_count=current_count,
        tof_dist_a=tof_a,
        tof_dist_b=tof_b
    )

    zone_id = sensor.get("zone_id", "zone-a")
    zone = db.get_zone(zone_id)
    if zone:
        cap = zone.get("capacity", 800)
        ratio = current_count / cap
        st = "CRITICAL" if ratio > 0.9 else "HIGH" if ratio > 0.75 else "MODERATE" if ratio > 0.5 else "SAFE"
        db.update_zone_count(zone_id, current_count, status=st)

    return jsonify({
        "status": "success",
        "sensor_id": sensor_id,
        "event": event_type,
        "current_count": current_count,
        "people_in": people_in,
        "people_out": people_out,
        "tof_a": tof_a,
        "tof_b": tof_b
    })

# --- ML & Random Forest Predictions ---
@app.route("/api/predict/zone", methods=["POST"])
def predict_zone():
    data = request.get_json() or {}
    prediction = predictor.predict_zone(data)
    # Log prediction to MongoDB
    db.log_prediction({
        "timestamp": datetime.datetime.now().isoformat(),
        "input": data,
        "prediction": prediction
    })
    return jsonify(prediction)

@app.route("/api/predict/model-info", methods=["GET"])
def model_info():
    info = predictor.get_model_info()
    return jsonify(info)

# --- Analytics Trends ---
@app.route("/api/analytics/trends", methods=["GET"])
def get_analytics():
    # Generate continuous trend points
    now = datetime.datetime.now()
    trends = []
    base_crowd = 9000
    for i in range(12, 0, -1):
        t = now - datetime.timedelta(hours=i)
        time_str = t.strftime("%H:%M")
        factor = 1.0 + (0.3 * (1 if 8 <= t.hour <= 12 or 16 <= t.hour <= 20 else -0.1))
        crowd = int(base_crowd * factor + (i * 280))
        trends.append({
            "time": time_str,
            "total_crowd": crowd,
            "entries": int(180 * factor),
            "exits": int(140 * factor),
            "route_a_wait": round(15 * factor, 1),
            "route_b_wait": round(10 * factor, 1),
            "route_c_wait": round(5 * factor, 1),
            "route_d_wait": round(7 * factor, 1)
        })
    return jsonify({"trends": trends})

# --- Alerts & Emergency ---
@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    alerts = db.get_alerts()
    return jsonify({"alerts": alerts})

@app.route("/api/emergency/toggle", methods=["POST"])
def toggle_emergency():
    data = request.get_json() or {}
    SYSTEM_STATE["emergency_mode"] = data.get("active", not SYSTEM_STATE["emergency_mode"])
    
    if SYSTEM_STATE["emergency_mode"]:
        new_alert = {
            "id": f"alert-emergency-{int(datetime.datetime.now().timestamp())}",
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
            "title": "🚨 EMERGENCY VENUE EVACUATION BROADCAST",
            "message": "Immediate evacuation triggered. All turnstiles opened outward. Express egress channels activated.",
            "severity": "emergency",
            "read": False,
            "resolved": False
        }
        db.add_alert(new_alert)

    return jsonify({
        "status": "success",
        "emergency_mode": SYSTEM_STATE["emergency_mode"]
    })

# --- Pre-Event Smart Planner (AI + Heuristic) ---
@app.route("/api/planner/generate", methods=["POST"])
def generate_event_plan():
    data = request.get_json() or {}
    expected_crowd = int(data.get("expected_crowd", 15000))
    zones_count = int(data.get("zones_count", 6))
    entrances = int(data.get("entrances_count", 3))
    exits = int(data.get("exits_count", 4))
    event_name = data.get("event_name", "Grand Annual Festival")
    
    # Compute optimal sensor placement and safe throughput
    sensors_needed = entrances * 2 + exits * 2 + (zones_count * 2)
    safe_hourly_throughput = (entrances * 1800) + (exits * 2200)
    risk_level = "HIGH" if expected_crowd > 25000 else "MEDIUM" if expected_crowd > 10000 else "LOW"
    
    plan = {
        "event_name": event_name,
        "risk_assessment": {
            "overall_risk_level": risk_level,
            "summary": f"Calculated capacity profile for {expected_crowd:,} attendees across {zones_count} designated zones.",
            "high_risk_zones": ["Sanctum Portal", "Central Staircase", "Main Turnstile Plaza"]
        },
        "recommended_sensors_count": sensors_needed,
        "sensor_placements": [
            {"location": "Main Entrance Gate A & B", "reason": "Dual VL53L0X ToF for high-accuracy doorway influx counting."},
            {"location": "Inner Sanctum Chokepoint", "reason": "Sub-millimeter ToF monitoring for anti-crush surge detection."},
            {"location": "South Bypass Egress Arteries", "reason": "Monitor diversion lane absorption capacity."}
        ],
        "suggested_route_distribution": [
            {"route_name": "Route C Express Bypass", "allocation_percentage": 50, "note": "Primary guided flow"},
            {"route_name": "Route B West Corridor", "allocation_percentage": 35, "note": "Secondary managed corridor"},
            {"route_name": "Route A Direct Core", "allocation_percentage": 15, "note": "Throttled access only"}
        ],
        "staff_deployment": [
            {"area": "Main Plaza Turnstiles", "personnel_needed": 6, "primary_task": "Queue marshalling & gate balancing"},
            {"area": "Sanctum Bottleneck", "personnel_needed": 8, "primary_task": "Surge dampening & barrier control"},
            {"area": "Emergency Medical Bay", "personnel_needed": 4, "primary_task": "First-aid readiness & hydration"}
        ]
    }
    return jsonify(plan)

# --- Google Maps Configuration ---
@app.route("/api/maps/config", methods=["GET"])
def maps_config():
    return jsonify({
        "google_maps_api_key": GOOGLE_MAPS_API_KEY,
        "has_custom_key": bool(GOOGLE_MAPS_API_KEY and GOOGLE_MAPS_API_KEY != "MY_GOOGLE_MAPS_API_KEY"),
        "default_center": {
            "lat": 10.4534,
            "lng": 77.5186,
            "name": "Palani Pilgrimage Grounds"
        },
        "venues_coordinates": [
            {"id": "palani-gathering", "name": "Palani Pilgrimage", "lat": 10.4534, "lng": 77.5186, "zoom": 17},
            {"id": "meenakshi-temple", "name": "Meenakshi Temple", "lat": 9.9195, "lng": 78.1193, "zoom": 17},
            {"id": "chennai-stadium", "name": "Jawaharlal Nehru Stadium", "lat": 13.0827, "lng": 80.2707, "zoom": 17},
            {"id": "central-transit-hub", "name": "Central Metro Hub", "lat": 13.0837, "lng": 80.2755, "zoom": 17}
        ]
    })

if __name__ == "__main__":
    print(f"==================================================")
    print(f"  FlowNavigator Server running on http://127.0.0.1:{PORT}")
    print(f"  Tech Stack:")
    print(f"  - Sensors: VL53L0X ToF Sensors")
    print(f"  - Controller: ESP32 (Wi-Fi + REST API)")
    print(f"  - ML/Prediction: Python Random Forest")
    print(f"  - Backend: Flask")
    print(f"  - Database: MongoDB")
    print(f"  - Frontend: HTML + CSS + JavaScript")
    print(f"  - Maps: Google Maps Platform")
    print(f"  - Deployment: Vercel Ready")
    print(f"==================================================")
    app.run(host="0.0.0.0", port=PORT, debug=True)
