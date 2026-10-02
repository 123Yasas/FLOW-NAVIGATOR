"""
FlowNavigator - MongoDB Database Interface
Handles MongoDB connection (Atlas / local) with automatic mongomock fallback.
Stores:
- Venues
- Zones
- Sensors (ESP32 + VL53L0X ToF telemetry)
- Routes
- Predictions (Random Forest inference logs)
- Alerts & Emergency States
"""

import os
import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Environment configuration
MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI") or "mongodb://localhost:27017/flownavigator"
DB_NAME = os.getenv("MONGO_DB_NAME", "flownavigator")

class MongoDatabase:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mock = False
        self.connect()
        self.seed_initial_data()

    def connect(self):
        """Attempts real MongoDB connection; falls back to mongomock if unavailable."""
        try:
            # 1.5s timeout for fast fallback if local mongod is not running
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
            # Test connection
            client.admin.command('ping')
            self.client = client
            self.db = client[DB_NAME]
            self.is_mock = False
            print(f"[MongoDB] Connected to real MongoDB server: {MONGO_URI.split('@')[-1]}")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            print(f"[MongoDB] Real MongoDB connection not available ({e}). Initializing high-fidelity in-memory MongoDB fallback.")
            try:
                import mongomock
                self.client = mongomock.MongoClient()
                self.db = self.client[DB_NAME]
                self.is_mock = True
            except Exception as ex:
                print(f"[MongoDB] mongomock error: {ex}")
                self.is_mock = True

    def get_status(self):
        return {
            "connected": True,
            "is_mock": self.is_mock,
            "engine": "In-Memory PyMongo (mongomock)" if self.is_mock else "MongoDB Cluster",
            "database_name": DB_NAME,
            "collections": list(self.db.list_collection_names()) if self.db is not None else []
        }

    def seed_initial_data(self):
        """Seeds initial venues, zones, sensors, and routes if collections are empty."""
        if self.db is None:
            return

        # 1. Venues
        if self.db.venues.count_documents({}) == 0:
            initial_venues = [
                {
                    "id": "palani-gathering",
                    "name": "Palani Pilgrimage Gathering Grounds",
                    "category": "Pilgrimage & Heritage Site",
                    "city": "Palani, Tamil Nadu",
                    "total_capacity": 25000,
                    "current_total_crowd": 12450,
                    "active_zones_count": 8,
                    "lat": 10.4534,
                    "lng": 77.5186
                },
                {
                    "id": "meenakshi-temple",
                    "name": "Meenakshi Sundareswarar Temple Complex",
                    "category": "Heritage Festival",
                    "city": "Madurai, Tamil Nadu",
                    "total_capacity": 35000,
                    "current_total_crowd": 19800,
                    "active_zones_count": 12,
                    "lat": 9.9195,
                    "lng": 78.1193
                },
                {
                    "id": "chennai-stadium",
                    "name": "Jawaharlal Nehru Stadium Complex",
                    "category": "Sports & Concert Venue",
                    "city": "Chennai",
                    "total_capacity": 40000,
                    "current_total_crowd": 28200,
                    "active_zones_count": 10,
                    "lat": 13.0827,
                    "lng": 80.2707
                },
                {
                    "id": "central-transit-hub",
                    "name": "Central Metro & Rail Junction Terminal",
                    "category": "Transit Terminal",
                    "city": "Central Hub",
                    "total_capacity": 18000,
                    "current_total_crowd": 11200,
                    "active_zones_count": 6,
                    "lat": 13.0837,
                    "lng": 80.2755
                }
            ]
            self.db.venues.insert_many(initial_venues)

        # 2. Zones
        if self.db.zones.count_documents({}) == 0:
            initial_zones = [
                {
                    "id": "zone-a",
                    "code": "ZONE A",
                    "name": "Main Entrance Plaza",
                    "venue_id": "palani-gathering",
                    "capacity": 800,
                    "current_count": 245,
                    "entry_rate": 42,
                    "exit_rate": 38,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.2,
                    "description": "Primary entry point with security turnstiles & queue bays.",
                    "lat": 10.4528,
                    "lng": 77.5178,
                    "x": 15,
                    "y": 50
                },
                {
                    "id": "zone-b",
                    "code": "ZONE B",
                    "name": "West Courtyard & Shopping Arcade",
                    "venue_id": "palani-gathering",
                    "capacity": 800,
                    "current_count": 650,
                    "entry_rate": 58,
                    "exit_rate": 40,
                    "status": "HIGH",
                    "access_restricted": False,
                    "is_evacuation_path": False,
                    "bottleneck_proximity": 0.65,
                    "description": "Bustling bazaar walkway and prasadam distribution counter.",
                    "lat": 10.4532,
                    "lng": 77.5182,
                    "x": 35,
                    "y": 30
                },
                {
                    "id": "zone-c",
                    "code": "ZONE C",
                    "name": "North Shrine Corridor",
                    "venue_id": "palani-gathering",
                    "capacity": 800,
                    "current_count": 780,
                    "entry_rate": 65,
                    "exit_rate": 25,
                    "status": "CRITICAL",
                    "access_restricted": True,
                    "is_evacuation_path": False,
                    "bottleneck_proximity": 0.95,
                    "description": "Narrow inner temple corridor leading directly to the main sanctum.",
                    "lat": 10.4542,
                    "lng": 77.5192,
                    "x": 65,
                    "y": 25
                },
                {
                    "id": "zone-d",
                    "code": "ZONE D",
                    "name": "South Express Bypass Walkway",
                    "venue_id": "palani-gathering",
                    "capacity": 800,
                    "current_count": 310,
                    "entry_rate": 30,
                    "exit_rate": 35,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.25,
                    "description": "Spacious outer bypass corridor with direct exit pathways.",
                    "lat": 10.4530,
                    "lng": 77.5190,
                    "x": 45,
                    "y": 70
                },
                {
                    "id": "zone-e",
                    "code": "ZONE E",
                    "name": "Food Court & Dining Pavilion",
                    "venue_id": "palani-gathering",
                    "capacity": 1200,
                    "current_count": 710,
                    "entry_rate": 40,
                    "exit_rate": 35,
                    "status": "MODERATE",
                    "access_restricted": False,
                    "is_evacuation_path": False,
                    "bottleneck_proximity": 0.4,
                    "description": "Annadhanam dining hall and public water stations.",
                    "lat": 10.4538,
                    "lng": 77.5175,
                    "x": 25,
                    "y": 75
                },
                {
                    "id": "zone-f",
                    "code": "ZONE F",
                    "name": "Multi-Level Car & Bus Parking",
                    "venue_id": "palani-gathering",
                    "capacity": 1500,
                    "current_count": 820,
                    "entry_rate": 25,
                    "exit_rate": 30,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.15,
                    "description": "Northern vehicle parking lot and transit shuttle pickup.",
                    "lat": 10.4520,
                    "lng": 77.5165,
                    "x": 10,
                    "y": 85
                },
                {
                    "id": "zone-g",
                    "code": "ZONE G",
                    "name": "Emergency Medical Bay & First Aid",
                    "venue_id": "palani-gathering",
                    "capacity": 400,
                    "current_count": 95,
                    "entry_rate": 10,
                    "exit_rate": 12,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.1,
                    "description": "First responder post with ambulances and nursing stations.",
                    "lat": 10.4545,
                    "lng": 77.5180,
                    "x": 80,
                    "y": 60
                },
                {
                    "id": "zone-h",
                    "code": "ZONE H",
                    "name": "Hilltop Ropeway & Staircases",
                    "venue_id": "palani-gathering",
                    "capacity": 1000,
                    "current_count": 880,
                    "entry_rate": 70,
                    "exit_rate": 30,
                    "status": "CRITICAL",
                    "access_restricted": False,
                    "is_evacuation_path": False,
                    "bottleneck_proximity": 0.9,
                    "description": "Main staircase steps and ropeway boarding queue.",
                    "lat": 10.4550,
                    "lng": 77.5195,
                    "x": 85,
                    "y": 20
                }
            ]
            self.db.zones.insert_many(initial_zones)

        # 3. Sensors: ESP32 with VL53L0X ToF Sensors
        if self.db.sensors.count_documents({}) == 0:
            initial_sensors = [
                {
                    "id": "SENSOR-ESP32-001",
                    "zone_id": "zone-a",
                    "zone_name": "Main Entrance Plaza Gate 1",
                    "controller": "ESP32-WROOM-32D",
                    "sensor_type": "VL53L0X Time-of-Flight (ToF)",
                    "communication": "Wi-Fi 802.11 b/g/n + REST API",
                    "people_in": 540,
                    "people_out": 295,
                    "current_count": 245,
                    "status": "ONLINE",
                    "battery_pct": 98,
                    "signal_dbm": -54,
                    "tof_distance_mm_a": 420,
                    "tof_distance_mm_b": 1150,
                    "firmware_version": "v3.2.0-ESP32-VL53L0X",
                    "last_ping": datetime.datetime.now().isoformat()
                },
                {
                    "id": "SENSOR-ESP32-002",
                    "zone_id": "zone-a",
                    "zone_name": "Main Entrance Plaza Gate 2",
                    "controller": "ESP32-WROOM-32D",
                    "sensor_type": "VL53L0X Time-of-Flight (ToF)",
                    "communication": "Wi-Fi 802.11 b/g/n + REST API",
                    "people_in": 480,
                    "people_out": 235,
                    "current_count": 245,
                    "status": "ONLINE",
                    "battery_pct": 94,
                    "signal_dbm": -58,
                    "tof_distance_mm_a": 510,
                    "tof_distance_mm_b": 1200,
                    "firmware_version": "v3.2.0-ESP32-VL53L0X",
                    "last_ping": datetime.datetime.now().isoformat()
                },
                {
                    "id": "SENSOR-ESP32-003",
                    "zone_id": "zone-b",
                    "zone_name": "West Courtyard Portal",
                    "controller": "ESP32-WROOM-32D",
                    "sensor_type": "VL53L0X Time-of-Flight (ToF)",
                    "communication": "Wi-Fi 802.11 b/g/n + REST API",
                    "people_in": 1240,
                    "people_out": 590,
                    "current_count": 650,
                    "status": "ONLINE",
                    "battery_pct": 89,
                    "signal_dbm": -62,
                    "tof_distance_mm_a": 380,
                    "tof_distance_mm_b": 410,
                    "firmware_version": "v3.2.0-ESP32-VL53L0X",
                    "last_ping": datetime.datetime.now().isoformat()
                },
                {
                    "id": "SENSOR-ESP32-004",
                    "zone_id": "zone-c",
                    "zone_name": "North Shrine Choke Point",
                    "controller": "ESP32-WROOM-32D",
                    "sensor_type": "VL53L0X Time-of-Flight (ToF)",
                    "communication": "Wi-Fi 802.11 b/g/n + REST API",
                    "people_in": 1820,
                    "people_out": 1040,
                    "current_count": 780,
                    "status": "WARNING",
                    "battery_pct": 74,
                    "signal_dbm": -71,
                    "tof_distance_mm_a": 290,
                    "tof_distance_mm_b": 310,
                    "firmware_version": "v3.2.0-ESP32-VL53L0X",
                    "last_ping": datetime.datetime.now().isoformat()
                },
                {
                    "id": "SENSOR-ESP32-005",
                    "zone_id": "zone-d",
                    "zone_name": "South Bypass Gate",
                    "controller": "ESP32-WROOM-32D",
                    "sensor_type": "VL53L0X Time-of-Flight (ToF)",
                    "communication": "Wi-Fi 802.11 b/g/n + REST API",
                    "people_in": 620,
                    "people_out": 310,
                    "current_count": 310,
                    "status": "ONLINE",
                    "battery_pct": 96,
                    "signal_dbm": -52,
                    "tof_distance_mm_a": 890,
                    "tof_distance_mm_b": 1100,
                    "firmware_version": "v3.2.0-ESP32-VL53L0X",
                    "last_ping": datetime.datetime.now().isoformat()
                },
                {
                    "id": "SENSOR-ESP32-006",
                    "zone_id": "zone-h",
                    "zone_name": "Hilltop Steps Staircase Influx",
                    "controller": "ESP32-WROOM-32D",
                    "sensor_type": "VL53L0X Time-of-Flight (ToF)",
                    "communication": "Wi-Fi 802.11 b/g/n + REST API",
                    "people_in": 2100,
                    "people_out": 1220,
                    "current_count": 880,
                    "status": "ONLINE",
                    "battery_pct": 82,
                    "signal_dbm": -67,
                    "tof_distance_mm_a": 340,
                    "tof_distance_mm_b": 355,
                    "firmware_version": "v3.2.0-ESP32-VL53L0X",
                    "last_ping": datetime.datetime.now().isoformat()
                }
            ]
            self.db.sensors.insert_many(initial_sensors)

        # 4. Routes
        if self.db.routes.count_documents({}) == 0:
            initial_routes = [
                {
                    "id": "route-a",
                    "name": "Route A - Direct Shrine Pathway",
                    "start_zone_id": "zone-a",
                    "destination_zone_id": "zone-c",
                    "destination_name": "Main Shrine / Sanctum",
                    "distance_meters": 300,
                    "occupancy_percentage": 92,
                    "estimated_wait_minutes": 28,
                    "estimated_walk_minutes": 7,
                    "status": "CRITICAL",
                    "tag": "AVOID",
                    "color": "#ef4444",
                    "description": "Direct route via North Shrine Corridor. Severe chokepoint at sanctum entrance.",
                    "path_zones": ["zone-a", "zone-c"],
                    "explainable_reason": "Heavy bottleneck at sanctum entrance gate (92% occupancy). High crush delay risk."
                },
                {
                    "id": "route-b",
                    "name": "Route B - West Arcade Corridor",
                    "start_zone_id": "zone-a",
                    "destination_zone_id": "zone-c",
                    "destination_name": "Main Shrine / Sanctum",
                    "distance_meters": 420,
                    "occupancy_percentage": 68,
                    "estimated_wait_minutes": 15,
                    "estimated_walk_minutes": 10,
                    "status": "MODERATE",
                    "tag": "MODERATE",
                    "color": "#eab308",
                    "description": "Alternative route through the West Bazaar Arcade. Moderate queue build-up.",
                    "path_zones": ["zone-a", "zone-b", "zone-c"],
                    "explainable_reason": "Secondary arcade lane. Moderate crowd movement near prasadam distribution counters."
                },
                {
                    "id": "route-c",
                    "name": "Route C - North Express Queue",
                    "start_zone_id": "zone-a",
                    "destination_zone_id": "zone-c",
                    "destination_name": "Main Shrine / Sanctum",
                    "distance_meters": 380,
                    "occupancy_percentage": 34,
                    "estimated_wait_minutes": 6,
                    "estimated_walk_minutes": 8,
                    "status": "SAFE",
                    "tag": "RECOMMENDED",
                    "color": "#22c55e",
                    "description": "Widened express lane with fast-moving turnstiles and zero choke points.",
                    "path_zones": ["zone-a", "zone-d", "zone-c"],
                    "explainable_reason": "Primary recommended lane. Lowest queue pressure (34% density) with sub-6 minute wait."
                },
                {
                    "id": "route-d",
                    "name": "Route D - South Bypass Lane",
                    "start_zone_id": "zone-a",
                    "destination_zone_id": "zone-f",
                    "destination_name": "Exit & Parking Grounds",
                    "distance_meters": 450,
                    "occupancy_percentage": 42,
                    "estimated_wait_minutes": 8,
                    "estimated_walk_minutes": 6,
                    "status": "SAFE",
                    "tag": "RECOMMENDED",
                    "color": "#22c55e",
                    "description": "Spacious south bypass corridor directly connecting to parking and transport.",
                    "path_zones": ["zone-a", "zone-d", "zone-f"],
                    "explainable_reason": "Unobstructed outer corridor with dedicated egress lanes directly to parking and shuttles."
                }
            ]
            self.db.routes.insert_many(initial_routes)

        # 5. Alerts
        if self.db.alerts.count_documents({}) == 0:
            initial_alerts = [
                {
                    "id": "alert-1",
                    "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                    "title": "North Shrine Bottleneck (Zone C)",
                    "message": "Zone C density exceeded 95% capacity. Random Forest predicts surge in 15 mins. Automatic diversion recommended.",
                    "severity": "critical",
                    "zone_id": "zone-c",
                    "read": False,
                    "resolved": False,
                    "recommended_action": "Divert pilgrim flow to Route C North Express Queue."
                },
                {
                    "id": "alert-2",
                    "timestamp": datetime.datetime.now().strftime("%H:%M:%S"),
                    "title": "ToF Sensor Influx Spike (Zone H)",
                    "message": "VL53L0X ToF sensor registered 70 persons/min influx on Hilltop steps. Gate 2 metering activated.",
                    "severity": "high",
                    "zone_id": "zone-h",
                    "read": False,
                    "resolved": False,
                    "recommended_action": "Enable queue staggering turnstiles at Hilltop base."
                }
            ]
            self.db.alerts.insert_many(initial_alerts)

    # Helper query methods
    def get_venues(self):
        return list(self.db.venues.find({}, {"_id": 0}))

    def get_zones(self, venue_id=None):
        query = {"venue_id": venue_id} if venue_id else {}
        return list(self.db.zones.find(query, {"_id": 0}))

    def get_zone(self, zone_id):
        return self.db.zones.find_one({"id": zone_id}, {"_id": 0})

    def update_zone_count(self, zone_id, current_count, entry_rate=None, exit_rate=None, status=None):
        update_fields = {"current_count": current_count}
        if entry_rate is not None:
            update_fields["entry_rate"] = entry_rate
        if exit_rate is not None:
            update_fields["exit_rate"] = exit_rate
        if status is not None:
            update_fields["status"] = status
        self.db.zones.update_one({"id": zone_id}, {"$set": update_fields})

    def get_sensors(self):
        return list(self.db.sensors.find({}, {"_id": 0}))

    def get_sensor(self, sensor_id):
        return self.db.sensors.find_one({"id": sensor_id}, {"_id": 0})

    def update_sensor_telemetry(self, sensor_id, people_in, people_out, current_count, tof_dist_a=None, tof_dist_b=None, battery_pct=None, signal_dbm=None):
        update_data = {
            "people_in": people_in,
            "people_out": people_out,
            "current_count": current_count,
            "last_ping": datetime.datetime.now().isoformat(),
            "status": "ONLINE"
        }
        if tof_dist_a is not None:
            update_data["tof_distance_mm_a"] = tof_dist_a
        if tof_dist_b is not None:
            update_data["tof_distance_mm_b"] = tof_dist_b
        if battery_pct is not None:
            update_data["battery_pct"] = battery_pct
        if signal_dbm is not None:
            update_data["signal_dbm"] = signal_dbm

        self.db.sensors.update_one({"id": sensor_id}, {"$set": update_data}, upsert=True)

        # Log into sensor_telemetry history collection
        log_entry = {
            "sensor_id": sensor_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "people_in": people_in,
            "people_out": people_out,
            "current_count": current_count,
            "tof_dist_a": tof_dist_a,
            "tof_dist_b": tof_dist_b
        }
        self.db.sensor_telemetry_logs.insert_one(log_entry)

    def get_routes(self):
        return list(self.db.routes.find({}, {"_id": 0}))

    def get_alerts(self):
        return list(self.db.alerts.find({}, {"_id": 0}))

    def add_alert(self, alert_dict):
        self.db.alerts.insert_one(alert_dict)

    def log_prediction(self, prediction_dict):
        self.db.predictions.insert_one(prediction_dict)

# Global database instance
db = MongoDatabase()
