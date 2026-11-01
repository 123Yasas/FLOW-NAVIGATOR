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
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
            client.admin.command('ping')
            self.client = client
            self.db = client[DB_NAME]
            self.is_mock = False
            print(f"[MongoDB] Connected to real MongoDB server: Database '{DB_NAME}'")
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            print(f"[MongoDB] Real MongoDB connection not available ({e}). Initializing high-fidelity in-memory MongoDB fallback.")
            import mongomock
            self.client = mongomock.MongoClient()
            self.db = self.client[DB_NAME]
            self.is_mock = True

    def get_status(self):
        return {
            "connected": True,
            "is_mock": self.is_mock,
            "engine": "In-Memory PyMongo (mongomock)" if self.is_mock else "MongoDB Cluster",
            "active_mode": "real",
            "active_database": self.db.name if self.db is not None else None,
            "collections": list(self.db.list_collection_names()) if self.db is not None else []
        }

    def seed_initial_data(self):
        """Seeds real venue topology, live hardware sensor station, and routing layouts with clean zero initial metrics."""
        if self.db is None:
            return

        # 1. Venues (Live Real Mode - Clean Zero Counts)
        if self.db.venues.count_documents({}) == 0:
            initial_venues = [
                {
                    "id": "sona-college",
                    "name": "Sona College of Technology (Campus Ground)",
                    "category": "College Campus & Grounds",
                    "city": "Salem, Tamil Nadu",
                    "total_capacity": 10,
                    "current_total_crowd": 0,
                    "active_zones_count": 4,
                    "lat": 11.677193,
                    "lng": 78.123532
                },
                {
                    "id": "palani-gathering",
                    "name": "Palani Pilgrimage Gathering Grounds",
                    "category": "Pilgrimage & Heritage Site",
                    "city": "Palani, Tamil Nadu",
                    "total_capacity": 25000,
                    "current_total_crowd": 0,
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
                    "current_total_crowd": 0,
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
                    "current_total_crowd": 0,
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
                    "current_total_crowd": 0,
                    "active_zones_count": 6,
                    "lat": 13.0837,
                    "lng": 80.2755
                }
            ]
            self.db.venues.insert_many(initial_venues)

        # 2. Zones (Live Real Mode - Clean Zero Initial Headcounts)
        if self.db.zones.count_documents({}) == 0:
            initial_zones = [
                # Sona College Campus Zones (Live ESP32 Hardware Deployment)
                {
                    "id": "zone-a-sona-college",
                    "code": "ZONE A",
                    "name": "Sona Main Entrance Gate (ESP32-S3 Live)",
                    "venue_id": "sona-college",
                    "capacity": 10,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.1,
                    "description": "Active ESP32-S3 Dual VL53L0X ToF laser counter station (Capacity: 10 max).",
                    "lat": 11.677800,
                    "lng": 78.123200
                },
                {
                    "id": "zone-b-sona-college",
                    "code": "ZONE B",
                    "name": "Innovation & Food Court Walkway",
                    "venue_id": "sona-college",
                    "capacity": 8,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.2,
                    "description": "Recommended alternative pathway (Venue B recommended threshold: 8 people).",
                    "lat": 11.677200,
                    "lng": 78.123900
                },
                {
                    "id": "zone-c-sona-college",
                    "code": "ZONE C",
                    "name": "Central Auditorium Concourse",
                    "venue_id": "sona-college",
                    "capacity": 10,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": False,
                    "bottleneck_proximity": 0.5,
                    "description": "Main indoor auditorium entrance lobby.",
                    "lat": 11.677193,
                    "lng": 78.123532
                },
                {
                    "id": "zone-d-sona-college",
                    "code": "ZONE D",
                    "name": "Campus Open Sports Quad",
                    "venue_id": "sona-college",
                    "capacity": 25,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.1,
                    "description": "Open grass quad and emergency assembly ground.",
                    "lat": 11.676600,
                    "lng": 78.123500
                },

                # Palani Gathering Zones
                {
                    "id": "zone-a",
                    "code": "ZONE A",
                    "name": "Main Entrance Plaza",
                    "venue_id": "palani-gathering",
                    "capacity": 800,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
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
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
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
                    "capacity": 600,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": False,
                    "bottleneck_proximity": 0.85,
                    "description": "Narrow gateway corridor approaching the sanctum sanctorum.",
                    "lat": 10.4538,
                    "lng": 77.5185,
                    "x": 55,
                    "y": 25
                },
                {
                    "id": "zone-d",
                    "code": "ZONE D",
                    "name": "South Outer Circumambulation Bypass",
                    "venue_id": "palani-gathering",
                    "capacity": 1000,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.15,
                    "description": "Wide arterial perimeter path connecting entrance to east terraces.",
                    "lat": 10.4530,
                    "lng": 77.5190,
                    "x": 55,
                    "y": 75
                },
                {
                    "id": "zone-e",
                    "code": "ZONE E",
                    "name": "East Annadhanam Dining Pavilion",
                    "venue_id": "palani-gathering",
                    "capacity": 1200,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.3,
                    "description": "Community kitchen and high-volume dining hall.",
                    "lat": 10.4542,
                    "lng": 77.5192,
                    "x": 75,
                    "y": 45
                },
                {
                    "id": "zone-f",
                    "code": "ZONE F",
                    "name": "North Parking & Shuttle Terminal",
                    "venue_id": "palani-gathering",
                    "capacity": 1500,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.1,
                    "description": "Exterior transport bay for buses, shuttles, and passenger cars.",
                    "lat": 10.4548,
                    "lng": 77.5180,
                    "x": 20,
                    "y": 15
                },
                {
                    "id": "zone-g",
                    "code": "ZONE G",
                    "name": "Medical First Aid & Lost Child Station",
                    "venue_id": "palani-gathering",
                    "capacity": 200,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
                    "access_restricted": False,
                    "is_evacuation_path": True,
                    "bottleneck_proximity": 0.1,
                    "description": "Emergency triage facility staffed by Red Cross and paramedics.",
                    "lat": 10.4535,
                    "lng": 77.5188,
                    "x": 45,
                    "y": 55
                },
                {
                    "id": "zone-h",
                    "code": "ZONE H",
                    "name": "Hilltop Ropeway & Staircases",
                    "venue_id": "palani-gathering",
                    "capacity": 1000,
                    "current_count": 0,
                    "entry_rate": 0,
                    "exit_rate": 0,
                    "status": "SAFE",
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

        # 3. Sensors (Live Real Mode: Real ESP32 Hardware Stations Only)
        if self.db.sensors.count_documents({}) == 0:
            initial_sensors = [
                {
                    "id": "ESP32-S3-VL53L0X-GATE",
                    "zone_id": "zone-a-sona-college",
                    "zone_name": "Sona College Main Gate",
                    "venue_id": "sona-college",
                    "controller": "ESP32-S3 DevKit",
                    "sensor_type": "Dual VL53L0X Time-of-Flight (ToF)",
                    "communication": "Wi-Fi 802.11 b/g/n + REST API",
                    "ip_address": "192.168.31.168",
                    "people_in": 0,
                    "people_out": 0,
                    "current_count": 0,
                    "status": "ONLINE",
                    "battery_pct": 100,
                    "signal_dbm": -42,
                    "tof_distance_mm_a": 450,
                    "tof_distance_mm_b": 450,
                    "firmware_version": "v4.2.0-ESP32-S3-DualI2C",
                    "last_ping": datetime.datetime.now().isoformat()
                }
            ]
            self.db.sensors.insert_many(initial_sensors)

        # 4. Routes (Clean Initial Zero-Wait Metrics)
        if self.db.routes.count_documents({}) == 0:
            initial_routes = [
                {
                    "id": "route-sona-main",
                    "name": "Sona Gate A - Direct Campus Entry",
                    "venue_id": "sona-college",
                    "start_zone_id": "zone-a-sona-college",
                    "destination_zone_id": "zone-c-sona-college",
                    "destination_name": "Central Auditorium Concourse",
                    "distance_meters": 120,
                    "occupancy_percentage": 0,
                    "estimated_wait_minutes": 0,
                    "estimated_walk_minutes": 2,
                    "status": "SAFE",
                    "tag": "RECOMMENDED",
                    "color": "#10b981",
                    "description": "Direct campus entrance monitored by ESP32-S3 ToF laser counter.",
                    "path_zones": ["zone-a-sona-college", "zone-c-sona-college"],
                    "explainable_reason": "Gate A OPEN: Normal direct entry monitored by ESP32 VL53L0X sensors."
                },
                {
                    "id": "route-sona-diversion",
                    "name": "Sona Gate B - Innovation Walkway Diversion",
                    "venue_id": "sona-college",
                    "start_zone_id": "zone-b-sona-college",
                    "destination_zone_id": "zone-c-sona-college",
                    "destination_name": "Central Auditorium Concourse",
                    "distance_meters": 180,
                    "occupancy_percentage": 0,
                    "estimated_wait_minutes": 0,
                    "estimated_walk_minutes": 3,
                    "status": "SAFE",
                    "tag": "ALTERNATIVE",
                    "color": "#0284c7",
                    "description": "Secondary diversion path active when Gate A capacity threshold is reached.",
                    "path_zones": ["zone-b-sona-college", "zone-c-sona-college"],
                    "explainable_reason": "Automated diversion corridor active when main area reaches threshold."
                },
                {
                    "id": "route-a",
                    "name": "Route A - Direct Shrine Pathway",
                    "venue_id": "palani-gathering",
                    "start_zone_id": "zone-a",
                    "destination_zone_id": "zone-c",
                    "destination_name": "Main Shrine / Sanctum",
                    "distance_meters": 300,
                    "occupancy_percentage": 0,
                    "estimated_wait_minutes": 0,
                    "estimated_walk_minutes": 7,
                    "status": "SAFE",
                    "tag": "RECOMMENDED",
                    "color": "#10b981",
                    "description": "Direct route via North Shrine Corridor.",
                    "path_zones": ["zone-a", "zone-c"],
                    "explainable_reason": "Direct corridor clear. Telemetry monitored live."
                },
                {
                    "id": "route-b",
                    "name": "Route B - West Arcade Corridor",
                    "venue_id": "palani-gathering",
                    "start_zone_id": "zone-a",
                    "destination_zone_id": "zone-c",
                    "destination_name": "Main Shrine / Sanctum",
                    "distance_meters": 420,
                    "occupancy_percentage": 0,
                    "estimated_wait_minutes": 0,
                    "estimated_walk_minutes": 10,
                    "status": "SAFE",
                    "tag": "ALTERNATIVE",
                    "color": "#0284c7",
                    "description": "Alternative route through the West Bazaar Arcade.",
                    "path_zones": ["zone-a", "zone-b", "zone-c"],
                    "explainable_reason": "Secondary arcade lane."
                },
                {
                    "id": "route-c",
                    "name": "Route C - North Express Queue",
                    "venue_id": "palani-gathering",
                    "start_zone_id": "zone-a",
                    "destination_zone_id": "zone-c",
                    "destination_name": "Main Shrine / Sanctum",
                    "distance_meters": 380,
                    "occupancy_percentage": 0,
                    "estimated_wait_minutes": 0,
                    "estimated_walk_minutes": 8,
                    "status": "SAFE",
                    "tag": "RECOMMENDED",
                    "color": "#10b981",
                    "description": "Wide outer perimeter lane with queue stanchions.",
                    "path_zones": ["zone-a", "zone-f", "zone-c"],
                    "explainable_reason": "Fast bypass corridor."
                },
                {
                    "id": "route-evac",
                    "name": "EMERGENCY EVACUATION ROUTE",
                    "venue_id": "palani-gathering",
                    "start_zone_id": "zone-c",
                    "destination_zone_id": "zone-f",
                    "destination_name": "North Parking Ground",
                    "distance_meters": 450,
                    "occupancy_percentage": 0,
                    "estimated_wait_minutes": 0,
                    "estimated_walk_minutes": 5,
                    "status": "SAFE",
                    "tag": "EVACUATION",
                    "color": "#10b981",
                    "description": "Primary emergency egress path directly to exterior parking bays.",
                    "path_zones": ["zone-c", "zone-d", "zone-f"],
                    "explainable_reason": "Emergency evacuation path."
                }
            ]
            self.db.routes.insert_many(initial_routes)

        # 5. Alerts (Live Real Mode - Empty Clean Slate)
        # Alerts are dynamically triggered by live telemetry threshold violations
        if self.db.alerts.count_documents({}) == 0:
            pass

    # Helper query methods
    def get_venues(self):
        return list(self.db.venues.find({}, {"_id": 0}))

    def add_venue(self, venue_dict, zones_list=None):
        """Adds or updates a custom venue and inserts its default zones in the active DB."""
        if not venue_dict or not venue_dict.get("id"):
            return False
        self.db.venues.update_one({"id": venue_dict["id"]}, {"$set": venue_dict}, upsert=True)
        if zones_list:
            for z in zones_list:
                self.db.zones.update_one({"id": z["id"]}, {"$set": z}, upsert=True)
        return True

    def update_venue(self, venue_id, update_fields):
        """Updates specific fields of a venue in active DB."""
        if not venue_id or not update_fields:
            return False
        res = self.db.venues.update_one({"id": venue_id}, {"$set": update_fields})
        return res.modified_count > 0 or res.matched_count > 0

    def delete_venue(self, venue_id):
        """Deletes a venue and associated zones from active DB."""
        if not venue_id:
            return False
        self.db.venues.delete_one({"id": venue_id})
        self.db.zones.delete_many({"venue_id": venue_id})
        return True

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

    def get_sensors(self, venue_id=None):
        if not venue_id:
            return list(self.db.sensors.find({}, {"_id": 0}))
        # Find sensors matching this venue_id directly or through its zones
        zones = self.get_zones(venue_id)
        zone_ids = [z.get("id") for z in zones if z.get("id")]
        query = {
            "$or": [
                {"venue_id": venue_id},
                {"zone_id": {"$in": zone_ids}}
            ]
        }
        matching = list(self.db.sensors.find(query, {"_id": 0}))
        # Fallback to all sensors if venue has no dedicated sensors assigned yet
        return matching if matching else list(self.db.sensors.find({}, {"_id": 0}))

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

    def get_routes(self, venue_id=None):
        if not venue_id:
            return list(self.db.routes.find({}, {"_id": 0}))
        matching = list(self.db.routes.find({"venue_id": venue_id}, {"_id": 0}))
        return matching if matching else list(self.db.routes.find({}, {"_id": 0}))

    def get_alerts(self):
        return list(self.db.alerts.find({}, {"_id": 0}))

    def add_alert(self, alert_dict):
        self.db.alerts.insert_one(alert_dict)

    def log_prediction(self, prediction_dict):
        self.db.predictions.insert_one(prediction_dict)

# Global database instance
db = MongoDatabase()
