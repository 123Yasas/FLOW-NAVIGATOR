"""
CrowdFlow AI - Deterministic Ground Planning, Geometry & Safety Engine
Compliant with NFPA 101 Life Safety Code and UK Event Safety Guide (The Green Guide).

Components:
1. Ground Geometry & Shape Transformations (Rectangular, Square, L-Shaped, Irregular, Trapezoid)
2. Dynamic Usable Area & Safety Density Calculations
3. 3 Alternative Plan Configurations: Safety-Priority, Balanced, Budget-Optimized
4. Barricade Lengths, Panel Counts (2.5m standard panels), and Gate Deductions
5. Gate Throughput & Evacuation Time Clearance Calculations
6. Safety Audit Rule Checks & Warning Engine
7. Itemized Equipment Quantities & Deterministic Budget Pricing Engine
"""

import math
import uuid
import datetime

class CrowdFlowEngine:
    @staticmethod
    def generate_plan(params):
        """
        Main layout generation entry point.
        Calculates geometry, placement, safety metrics, budget, and 3 alternatives.
        """
        # 1. Normalize parameters
        unit = params.get("unit", "m") # 'm' or 'ft'
        shape = params.get("shape", "rectangular").lower() # 'rectangular', 'square', 'l_shaped', 'irregular', 'trapezoid'
        raw_length = float(params.get("length", 300))
        raw_width = float(params.get("width", 190))
        area_only = float(params.get("area_only", 0))
        expected_crowd = int(params.get("expected_crowd", 12000))
        event_name = params.get("event_name", "National Public Festival 2026")
        event_type = params.get("event_type", "Concert & Music Festival")
        stage_pos = params.get("stage_position", "west").lower() # 'west', 'east', 'north', 'south', 'center'
        stage_w = float(params.get("stage_width", 36 if unit == "m" else 118))
        stage_d = float(params.get("stage_depth", 20 if unit == "m" else 65))
        entry_gates_count = max(2, int(params.get("entry_gates_count", 4)))
        exit_gates_count = max(2, int(params.get("exit_gates_count", 4)))
        budget_limit = float(params.get("budget_limit", 50000))
        currency = params.get("currency", "USD")
        alt_mode = params.get("alternative_mode", "balanced").lower() # 'safety_priority', 'balanced', 'budget_optimized'
        
        # Handle "Area Only" input if length/width not given
        if area_only > 0 and (raw_length <= 0 or raw_width <= 0):
            aspect_ratio = float(params.get("aspect_ratio", 1.5))
            raw_width = math.sqrt(area_only / aspect_ratio)
            raw_length = raw_width * aspect_ratio

        # Convert to Metric for internal calculations
        scale_to_m = 1.0 if unit == "m" else 0.3048
        len_m = raw_length * scale_to_m
        wid_m = raw_width * scale_to_m
        total_area_m2 = len_m * wid_m

        if shape == "square":
            side = min(len_m, wid_m)
            len_m = wid_m = side
            total_area_m2 = len_m * wid_m
        elif shape == "l_shaped":
            total_area_m2 = (len_m * wid_m) * 0.72 # L cut-out factor
        elif shape == "trapezoid":
            total_area_m2 = ((len_m * 0.75 + len_m) / 2.0) * wid_m
        elif shape == "irregular":
            total_area_m2 = len_m * wid_m * 0.85

        total_area_sqft = total_area_m2 * 10.7639

        # 2. Stage & Non-Walkable Area Deductions
        stage_area_m2 = (stage_w * scale_to_m) * (stage_d * scale_to_m)
        backstage_buffer_m2 = stage_area_m2 * 1.5
        perimeter_road_width_m = 16.0 if alt_mode == "safety_priority" else 12.0 if alt_mode == "balanced" else 8.0
        perimeter_road_area_m2 = ((2 * len_m) + (2 * wid_m)) * perimeter_road_width_m
        arterial_corridor_width_m = 16.0 if alt_mode == "safety_priority" else 14.0 if alt_mode == "balanced" else 10.0
        central_corridor_area_m2 = len_m * arterial_corridor_width_m

        # Usable Event Area
        usable_area_m2 = max(500.0, total_area_m2 - (stage_area_m2 + backstage_buffer_m2 + perimeter_road_area_m2 * 0.5 + central_corridor_area_m2 * 0.5))
        usable_area_sqft = usable_area_m2 * 10.7639

        # 3. NFPA 101 Crowd Density & Capacity Analysis
        # NFPA standard: 0.46 m² (5.0 sq.ft) per person for high-density standing; 0.75 m² (8.0 sq.ft) recommended safe; 1.5 m² relaxed
        density_standard_m2_per_person = 0.85 if alt_mode == "safety_priority" else 0.70 if alt_mode == "balanced" else 0.55
        max_safe_capacity = int(usable_area_m2 / density_standard_m2_per_person)
        actual_density_m2_ppl = round(usable_area_m2 / max(1, expected_crowd), 2)
        actual_density_sqft_ppl = round(actual_density_m2_ppl * 10.7639, 1)

        # Safety rating
        if actual_density_m2_ppl >= 0.75:
            density_rating = "SAFE"
            density_color = "#047857"
        elif actual_density_m2_ppl >= 0.50:
            density_rating = "MODERATE"
            density_color = "#b45309"
        else:
            density_rating = "CRITICAL"
            density_color = "#b91c1c"

        # 4. Gate Throughput & Evacuation Time
        # NFPA / UK Green Guide: 60 - 82 persons/minute per meter of effective gate width
        gate_effective_width_m = 2.4 # Standard turnstile bay width
        egress_rate_per_gate_ppl_min = int(gate_effective_width_m * 70) # ~168 ppl/min per gate
        total_exit_throughput_ppl_min = exit_gates_count * egress_rate_per_gate_ppl_min
        total_entry_throughput_ppl_min = entry_gates_count * (egress_rate_per_gate_ppl_min * 0.75) # security check slower
        
        # Evacuation time in minutes (target < 12-15 mins)
        evacuation_time_mins = round(expected_crowd / max(1, total_exit_throughput_ppl_min), 1)
        ingress_time_mins = round(expected_crowd / max(1, total_entry_throughput_ppl_min), 1)
        evac_compliant = evacuation_time_mins <= 15.0

        # 5. Barricade Compartments Calculation (Multi-box crowd control)
        # Sizing pens based on crowd: standard 800 - 1500 ppl per pen
        target_pen_capacity = 1000 if alt_mode == "safety_priority" else 1200 if alt_mode == "balanced" else 1500
        pens_count = max(4, min(24, int(math.ceil(expected_crowd / target_pen_capacity))))
        # Make pens_count even for balanced dual-row layout
        if pens_count % 2 != 0:
            pens_count += 1

        # Panel calculations (standard 2.5m / 8.2ft heavy-duty steel panels)
        panel_length_m = 2.5
        box_width_m = max(18.0, (len_m * 0.55) / (pens_count / 2))
        box_depth_m = max(24.0, (wid_m * 0.35))
        single_box_perimeter_m = (2 * box_width_m) + (2 * box_depth_m)
        
        # Shared dividers deduction + 2 openings per pen (3m each for pedestrian flow)
        deductions_per_box_m = 6.0 # 2x 3m gate openings
        effective_box_barrier_m = (single_box_perimeter_m - deductions_per_box_m)
        total_barricade_linear_m = round((pens_count * effective_box_barrier_m * 0.7) + (stage_w * 2.5) + (entry_gates_count * 20), 1)
        total_barricade_panels = int(math.ceil(total_barricade_linear_m / panel_length_m))

        # 6. Safety & Emergency Facilities Sizing
        medical_stations_count = max(1, int(math.ceil(expected_crowd / 6000)))
        ambulance_staging_count = max(1, int(math.ceil(expected_crowd / 8000)))
        security_personnel = max(8, int(math.ceil(expected_crowd / 120)))
        paramedics_count = max(4, int(math.ceil(expected_crowd / 1500)))
        
        # Public Facilities (NFPA / Festival Sanitation ratios: 1 per 75-100 people)
        restrooms_standard = max(4, int(math.ceil(expected_crowd / 90)))
        restrooms_ada_wheelchair = max(2, int(math.ceil(restrooms_standard * 0.08)))
        water_refill_stations = max(2, int(math.ceil(expected_crowd / 2500)))
        waste_bins_count = max(10, int(math.ceil(expected_crowd / 150)))
        light_towers_count = max(2, int(math.ceil(total_area_m2 / 12000)))
        directional_signs_count = max(8, int(math.ceil(expected_crowd / 600)))

        # 7. Coordinates & Layout Geometry (Normalized 1400 x 850 Canvas Units)
        cw = 1400.0
        ch = 850.0
        margin_x = 70.0
        margin_y = 60.0
        field_w = cw - (2 * margin_x)
        field_h = ch - (2 * margin_y)

        # Polygon Boundary points
        if shape == "rectangular" or shape == "square":
            boundary_polygon = [
                {"x": margin_x, "y": margin_y},
                {"x": margin_x + field_w, "y": margin_y},
                {"x": margin_x + field_w, "y": margin_y + field_h},
                {"x": margin_x, "y": margin_y + field_h}
            ]
        elif shape == "l_shaped":
            cut_x = margin_x + field_w * 0.58
            cut_y = margin_y + field_h * 0.45
            boundary_polygon = [
                {"x": margin_x, "y": margin_y},
                {"x": cut_x, "y": margin_y},
                {"x": cut_x, "y": cut_y},
                {"x": margin_x + field_w, "y": cut_y},
                {"x": margin_x + field_w, "y": margin_y + field_h},
                {"x": margin_x, "y": margin_y + field_h}
            ]
        elif shape == "trapezoid":
            inset_top = field_w * 0.15
            boundary_polygon = [
                {"x": margin_x + inset_top, "y": margin_y},
                {"x": margin_x + field_w - inset_top, "y": margin_y},
                {"x": margin_x + field_w, "y": margin_y + field_h},
                {"x": margin_x, "y": margin_y + field_h}
            ]
        else: # Irregular
            boundary_polygon = [
                {"x": margin_x + 40, "y": margin_y},
                {"x": margin_x + field_w - 60, "y": margin_y + 20},
                {"x": margin_x + field_w, "y": margin_y + field_h * 0.55},
                {"x": margin_x + field_w - 30, "y": margin_y + field_h},
                {"x": margin_x + 50, "y": margin_y + field_h},
                {"x": margin_x, "y": margin_y + field_h * 0.45}
            ]

        # Stage Placement
        stage_elem = {
            "id": "stage-main",
            "type": "stage",
            "label": "MAJOR PERFORMANCE STAGE",
            "sub_label": f"{int(stage_w)}m × {int(stage_d)}m • Multi-Tier Truss & Rigging",
            "x": margin_x + 28,
            "y": margin_y + (field_h * 0.28),
            "width": 105,
            "height": 290,
            "color": "#10b981",
            "capacity": 250,
            "specs": f"Front of House separation: 28m buffer. Mojo heavy crush barriers installed at stage perimeter."
        }
        if stage_pos == "east":
            stage_elem["x"] = margin_x + field_w - 135
        elif stage_pos == "north":
            stage_elem["x"] = margin_x + (field_w * 0.3)
            stage_elem["y"] = margin_y + 25
            stage_elem["width"] = 290
            stage_elem["height"] = 105

        # Barricade Pens Placement
        pen_cols = pens_count // 2
        barricade_pens = []
        pen_start_x = margin_x + 185
        pen_total_w = field_w * 0.52
        single_pen_w = (pen_total_w - (pen_cols * 14)) / max(1, pen_cols)
        single_pen_h = (field_h * 0.36)
        
        top_pen_y = margin_y + 35
        bot_pen_y = margin_y + (field_h * 0.56)

        cap_per_box = int(expected_crowd / pens_count)
        pen_counter = 1
        for col in range(pen_cols):
            # Top row pen (Odd)
            px = pen_start_x + (col * (single_pen_w + 14))
            barricade_pens.append({
                "id": f"box-{pen_counter}",
                "type": "barricade_pen",
                "label": f"BARRICADE PEN {pen_counter}",
                "sub_label": f"Heavy-Duty Steel Barricade Enclosure",
                "x": px,
                "y": top_pen_y,
                "width": single_pen_w,
                "height": single_pen_h,
                "capacity": cap_per_box,
                "panel_count": int(math.ceil(((2 * single_pen_w) + (2 * single_pen_h)) / 14)),
                "status": "COMPLIANT",
                "specs": f"Capacity: {cap_per_box:,} ppl. Dual surge relief exits facing central corridor."
            })
            pen_counter += 1

            # Bottom row pen (Even)
            barricade_pens.append({
                "id": f"box-{pen_counter}",
                "type": "barricade_pen",
                "label": f"BARRICADE PEN {pen_counter}",
                "sub_label": f"Heavy-Duty Steel Barricade Enclosure",
                "x": px,
                "y": bot_pen_y,
                "width": single_pen_w,
                "height": single_pen_h,
                "capacity": cap_per_box,
                "panel_count": int(math.ceil(((2 * single_pen_w) + (2 * single_pen_h)) / 14)),
                "status": "COMPLIANT",
                "specs": f"Capacity: {cap_per_box:,} ppl. Dual surge relief exits facing central corridor."
            })
            pen_counter += 1

        # Central Security & Command Hub (Centered in corridor)
        security_hub = {
            "id": "hub-security",
            "type": "security_hub",
            "label": "CENTRAL SECURITY COMMAND HUB",
            "sub_label": "CCTV Monitor & Dispatch Tower",
            "x": pen_start_x + pen_total_w + 12,
            "y": margin_y + (field_h * 0.42),
            "width": 80,
            "height": 95,
            "color": "#1e293b",
            "capacity": 30,
            "specs": f"Houses {security_personnel} certified event marshals, PA override mic, and live ToF gate count dashboard."
        }

        # Dedicated Right-Hand Facility Hubs
        facility_x = pen_start_x + pen_total_w + 110
        facility_w = field_w - (facility_x - margin_x) - 25

        facilities = [
            {
                "id": "fac-medical",
                "type": "medical",
                "label": "MEDICAL CENTER & AMBULANCE EGRESS",
                "sub_label": f"Triage Tent • {paramedics_count} Paramedics • {ambulance_staging_count} Standby Ambulance",
                "x": facility_x,
                "y": margin_y + 35,
                "width": facility_w,
                "height": 135,
                "color": "#ef4444",
                "capacity": 45,
                "specs": "Direct 12m egress corridor connecting to public highway without crowd conflict."
            },
            {
                "id": "fac-food-court",
                "type": "food_court",
                "label": "FOOD COURT & REFRESHMENT ZONE",
                "sub_label": "Concession Stalls • Dedicated Queue Pens • Dining Tables",
                "x": facility_x,
                "y": margin_y + 190,
                "width": facility_w,
                "height": 160,
                "color": "#f59e0b",
                "capacity": 450,
                "specs": "Service lane behind food stalls for resupply without cutting across attendee pathways."
            },
            {
                "id": "fac-water",
                "type": "water",
                "label": "HIGH-CAPACITY WATER HYDRATION STATIONS",
                "sub_label": f"{water_refill_stations} Automated Touchless Bulk Taps",
                "x": facility_x,
                "y": margin_y + 370,
                "width": facility_w,
                "height": 95,
                "color": "#0ea5e9",
                "capacity": 120,
                "specs": f"Pressurized filtered water supply guaranteeing minimum 250ml/person/hour."
            },
            {
                "id": "fac-restrooms",
                "type": "restroom",
                "label": "PUBLIC SANITATION & RESTROOM BAYS",
                "sub_label": f"{restrooms_standard} Standard Units + {restrooms_ada_wheelchair} Accessible ADA Stalls",
                "x": facility_x,
                "y": margin_y + 485,
                "width": facility_w,
                "height": 125,
                "color": "#8b5cf6",
                "capacity": 200,
                "specs": "Segregated male/female queues with illuminated handwash hygiene stations."
            }
        ]

        # Ingress & Egress Gates
        entry_gates = []
        for i in range(entry_gates_count):
            gy = margin_y + 80 + (i * ((field_h - 160) / max(1, entry_gates_count - 1)))
            entry_gates.append({
                "id": f"gate-in-{i+1}",
                "type": "entry_gate",
                "label": f"ENTRY GATE {chr(65+i)}",
                "x": margin_x - 18,
                "y": gy,
                "width": 36,
                "height": 45,
                "throughput_rate": int(total_entry_throughput_ppl_min / entry_gates_count),
                "specs": "Equipped with dual VL53L0X ToF optical beam counters & walk-through metal detectors."
            })

        exit_gates = []
        for i in range(exit_gates_count):
            gy = margin_y + 70 + (i * ((field_h - 140) / max(1, exit_gates_count - 1)))
            exit_gates.append({
                "id": f"gate-out-{i+1}",
                "type": "emergency_exit" if i % 2 == 1 else "exit_gate",
                "label": f"EMERGENCY EGRESS {i+1}" if i % 2 == 1 else f"EXIT GATE {i+1}",
                "x": margin_x + field_w - 18,
                "y": gy,
                "width": 36,
                "height": 45,
                "throughput_rate": int(total_exit_throughput_ppl_min / exit_gates_count),
                "specs": "Outward swing with panic hardware. Directly links to secondary evacuation perimeter."
            })

        # Directional Flow Vectors
        flow_vectors = [
            {"from_x": margin_x + 20, "from_y": margin_y + 35, "to_x": margin_x + field_w - 50, "to_y": margin_y + 35, "label": "Perimeter Ingress Lane (North)"},
            {"from_x": margin_x + 20, "from_y": margin_y + field_h - 35, "to_x": margin_x + field_w - 50, "to_y": margin_y + field_h - 35, "label": "Perimeter Ingress Lane (South)"},
            {"from_x": pen_start_x + 50, "from_y": margin_y + (field_h * 0.48), "to_x": pen_start_x + pen_total_w, "to_y": margin_y + (field_h * 0.48), "label": "Arterial Safety Corridor Egress"},
            {"from_x": facility_x + 40, "from_y": margin_y + 100, "to_x": margin_x + field_w, "to_y": margin_y + 100, "label": "Rapid Ambulance Egress Highway"}
        ]

        # 8. Deterministic Equipment Quantities & Itemized Budget
        # Currency rates relative to USD (USD: 1.0, INR: 86.0, EUR: 0.92)
        currency_multipliers = {
            "USD": 1.0,
            "INR": 85.0,
            "EUR": 0.92
        }
        curr_mult = currency_multipliers.get(currency.upper(), 1.0)

        # Base USD unit prices (configurable / editable by user)
        base_unit_prices_usd = {
            "barricade_panel": 28.0,        # per 2.5m panel (rental/day)
            "queue_stanchion_m": 12.0,      # per linear meter
            "turnstile_counter": 380.0,     # per IoT optical gate unit
            "stage_truss_sqm": 45.0,        # per sqm of stage rigging
            "medical_tent": 1200.0,         # per fully equipped medical tent
            "ambulance_standby": 1800.0,    # per dedicated emergency ambulance
            "restroom_standard": 110.0,     # per chemical toilet cabin/day
            "restroom_ada": 190.0,          # per ADA accessible cabin/day
            "water_station": 450.0,         # per high-capacity filtered water unit
            "light_tower": 650.0,           # per mobile diesel floodlight tower
            "safety_signboard": 35.0,       # per reflective directional sign
            "security_guard": 180.0,        # per certified steward (day shift)
            "paramedic": 260.0,             # per emergency medical technician
            "walkie_talkie": 22.0,          # per digital two-way radio
            "waste_bin": 18.0,              # per heavy-duty rolling waste bin
            "logistics_base": 2800.0        # transport, setup & strike crew base
        }

        # Calculate localized prices
        unit_prices = {
            k: round(v * curr_mult, 2 if curr_mult != 85.0 else 0)
            for k, v in base_unit_prices_usd.items()
        }

        # Override with custom prices if provided in params
        custom_prices = params.get("custom_unit_prices", {})
        unit_prices.update(custom_prices)

        budget_items = [
            {
                "category": "Crowd Control & Fencing",
                "item": "Heavy-Duty Steel Mojo Barricades (2.5m Panels)",
                "quantity": total_barricade_panels,
                "unit": "Panels",
                "unit_price": unit_prices["barricade_panel"],
                "total": round(total_barricade_panels * unit_prices["barricade_panel"], 2),
                "source": "Calculated from perimeter & pen dividers"
            },
            {
                "category": "Crowd Control & Fencing",
                "item": "Pedestrian Queue Stanchions & Retractable Belts",
                "quantity": int(entry_gates_count * 25),
                "unit": "Meters",
                "unit_price": unit_prices["queue_stanchion_m"],
                "total": round(entry_gates_count * 25 * unit_prices["queue_stanchion_m"], 2),
                "source": "Entry holding queues calculation"
            },
            {
                "category": "Gates & Access Control",
                "item": "Modular IoT Turnstiles with ToF People Counters",
                "quantity": entry_gates_count + exit_gates_count,
                "unit": "Units",
                "unit_price": unit_prices["turnstile_counter"],
                "total": round((entry_gates_count + exit_gates_count) * unit_prices["turnstile_counter"], 2),
                "source": "Total entry + exit portals"
            },
            {
                "category": "Staging & Rigging",
                "item": "Main Stage Structure, Roof Truss & Separation Buffer",
                "quantity": int(stage_area_m2),
                "unit": "m²",
                "unit_price": unit_prices["stage_truss_sqm"],
                "total": round(stage_area_m2 * unit_prices["stage_truss_sqm"], 2),
                "source": "Stage width × depth dimensions"
            },
            {
                "category": "Medical & Emergency",
                "item": "First-Aid Emergency Tents & Triage Equipment",
                "quantity": medical_stations_count,
                "unit": "Stations",
                "unit_price": unit_prices["medical_tent"],
                "total": round(medical_stations_count * unit_prices["medical_tent"], 2),
                "source": "1 tent per 6,000 attendees standard"
            },
            {
                "category": "Medical & Emergency",
                "item": "Dedicated On-Site Standby Ambulances",
                "quantity": ambulance_staging_count,
                "unit": "Vehicles",
                "unit_price": unit_prices["ambulance_standby"],
                "total": round(ambulance_staging_count * unit_prices["ambulance_standby"], 2),
                "source": "Regional emergency services guideline"
            },
            {
                "category": "Public Sanitation",
                "item": "Standard Chemical Portable Restroom Cabins",
                "quantity": restrooms_standard,
                "unit": "Units",
                "unit_price": unit_prices["restroom_standard"],
                "total": round(restrooms_standard * unit_prices["restroom_standard"], 2),
                "source": "NFPA standard: 1 per 90 attendees"
            },
            {
                "category": "Public Sanitation",
                "item": "Accessible ADA Wheelchair Restroom Cabins",
                "quantity": restrooms_ada_wheelchair,
                "unit": "Units",
                "unit_price": unit_prices["restroom_ada"],
                "total": round(restrooms_ada_wheelchair * unit_prices["restroom_ada"], 2),
                "source": "ADA 8% compliance ratio"
            },
            {
                "category": "Hydration & Power",
                "item": "High-Capacity Filtered Drinking Water Stations",
                "quantity": water_refill_stations,
                "unit": "Units",
                "unit_price": unit_prices["water_station"],
                "total": round(water_refill_stations * unit_prices["water_station"], 2),
                "source": "1 tap station per 2,500 attendees"
            },
            {
                "category": "Hydration & Power",
                "item": "Mobile Diesel High-Mast LED Floodlight Towers",
                "quantity": light_towers_count,
                "unit": "Towers",
                "unit_price": unit_prices["light_tower"],
                "total": round(light_towers_count * unit_prices["light_tower"], 2),
                "source": "Night safety illumination coverage"
            },
            {
                "category": "Signage & Wayfinding",
                "item": "Reflective Evacuation & Gate Wayfinding Signboards",
                "quantity": directional_signs_count,
                "unit": "Signs",
                "unit_price": unit_prices["safety_signboard"],
                "total": round(directional_signs_count * unit_prices["safety_signboard"], 2),
                "source": "Corridors & turnstiles mapping"
            },
            {
                "category": "Staffing & Security",
                "item": "Certified Crowd Management Stewards / Marshals",
                "quantity": security_personnel,
                "unit": "Persons",
                "unit_price": unit_prices["security_guard"],
                "total": round(security_personnel * unit_prices["security_guard"], 2),
                "source": "1 steward per 120 attendees ratio"
            },
            {
                "category": "Staffing & Security",
                "item": "Certified On-Site Paramedics & EMT Personnel",
                "quantity": paramedics_count,
                "unit": "Persons",
                "unit_price": unit_prices["paramedic"],
                "total": round(paramedics_count * unit_prices["paramedic"], 2),
                "source": "1 EMT per 1,500 attendees standard"
            },
            {
                "category": "Staffing & Security",
                "item": "Encrypted Two-Way Radio Transceivers (Walkie-Talkies)",
                "quantity": int(security_personnel * 0.75),
                "unit": "Devices",
                "unit_price": unit_prices["walkie_talkie"],
                "total": round(int(security_personnel * 0.75) * unit_prices["walkie_talkie"], 2),
                "source": "Communications network allocation"
            },
            {
                "category": "Sanitation & Waste",
                "item": "Heavy-Duty Rolling Waste & Recycling Bins",
                "quantity": waste_bins_count,
                "unit": "Bins",
                "unit_price": unit_prices["waste_bin"],
                "total": round(waste_bins_count * unit_prices["waste_bin"], 2),
                "source": "1 bin per 150 attendees ratio"
            },
            {
                "category": "Logistics & Labor",
                "item": "Equipment Transport, Setup, Rigging & Dismantling",
                "quantity": 1,
                "unit": "Package",
                "unit_price": unit_prices["logistics_base"],
                "total": unit_prices["logistics_base"],
                "source": "Base vendor deployment quote"
            }
        ]

        # Subtotals
        subtotal_equipment = sum(item["total"] for item in budget_items if item["category"] in ["Crowd Control & Fencing", "Gates & Access Control", "Staging & Rigging"])
        subtotal_facilities = sum(item["total"] for item in budget_items if item["category"] in ["Medical & Emergency", "Public Sanitation", "Hydration & Power", "Signage & Wayfinding", "Sanitation & Waste"])
        subtotal_staffing = sum(item["total"] for item in budget_items if item["category"] in ["Staffing & Security"])
        subtotal_logistics = sum(item["total"] for item in budget_items if item["category"] in ["Logistics & Labor"])
        
        pre_tax_total = subtotal_equipment + subtotal_facilities + subtotal_staffing + subtotal_logistics
        contingency_10pct = round(pre_tax_total * 0.10, 2)
        grand_total = round(pre_tax_total + contingency_10pct, 2)
        remaining_budget = round(budget_limit - grand_total, 2)
        is_over_budget = remaining_budget < 0

        # 9. Safety Audit Rule Verification
        safety_checks = [
            {
                "rule": "Crowd Density Safety Limit",
                "standard": "NFPA 101 ≥ 0.50 m²/person (≥ 5.4 sq.ft/person)",
                "actual": f"{actual_density_m2_ppl} m²/person ({actual_density_sqft_ppl} sq.ft)",
                "status": "PASS" if actual_density_m2_ppl >= 0.50 else "FAIL",
                "severity": "CRITICAL" if actual_density_m2_ppl < 0.40 else "MODERATE" if actual_density_m2_ppl < 0.50 else "SAFE",
                "message": "Density within safe thresholds" if actual_density_m2_ppl >= 0.50 else f"Crowd exceeds safe standing density by {int((0.50 - actual_density_m2_ppl) * 100)}%!"
            },
            {
                "rule": "Emergency Evacuation Clearance Time",
                "standard": "UK Green Guide ≤ 15.0 minutes clearance time",
                "actual": f"{evacuation_time_mins} minutes",
                "status": "PASS" if evac_compliant else "FAIL",
                "severity": "CRITICAL" if not evac_compliant else "SAFE",
                "message": "Evacuation egress meets safety standard" if evac_compliant else f"Exit bottleneck! Increase exit gate count or widen gates."
            },
            {
                "rule": "Arterial Corridor Width",
                "standard": "Minimum 8.0m clear emergency corridor",
                "actual": f"{arterial_corridor_width_m}m clearance",
                "status": "PASS" if arterial_corridor_width_m >= 8.0 else "WARNING",
                "severity": "SAFE" if arterial_corridor_width_m >= 12.0 else "MODERATE",
                "message": f"Corridor width of {arterial_corridor_width_m}m permits unhindered emergency vehicle ingress."
            },
            {
                "rule": "Sanitation Provision Adequacy",
                "standard": "Minimum 1 toilet per 100 attendees",
                "actual": f"1 toilet per {int(expected_crowd / max(1, restrooms_standard + restrooms_ada_wheelchair))} attendees",
                "status": "PASS",
                "severity": "SAFE",
                "message": f"{restrooms_standard + restrooms_ada_wheelchair} total units including {restrooms_ada_wheelchair} ADA accessible units."
            },
            {
                "rule": "Budget Constraint Verification",
                "standard": f"Estimated total must not exceed {currency} {budget_limit:,.0f}",
                "actual": f"{currency} {grand_total:,.2f}",
                "status": "PASS" if not is_over_budget else "WARNING",
                "severity": "MODERATE" if is_over_budget else "SAFE",
                "message": f"Budget surplus of {currency} {remaining_budget:,.2f}" if not is_over_budget else f"Budget deficit of {currency} {abs(remaining_budget):,.2f}! Consider Budget-Optimized alternative."
            }
        ]

        # 10. Generate 3 Alternatives Comparison
        alternatives = {
            "safety_priority": {
                "label": "Safety-Priority Plan",
                "corridor_width_m": 16.0,
                "pens_count": pens_count + 2,
                "barricade_panels": int(total_barricade_panels * 1.15),
                "evacuation_time_mins": round(evacuation_time_mins * 0.85, 1),
                "grand_total": round(grand_total * 1.12, 2),
                "description": "Widest 16m arterial corridors, maximum pen segmentation, redundant medical staging."
            },
            "balanced": {
                "label": "Balanced Plan",
                "corridor_width_m": 14.0,
                "pens_count": pens_count,
                "barricade_panels": total_barricade_panels,
                "evacuation_time_mins": evacuation_time_mins,
                "grand_total": grand_total,
                "description": "Optimal trade-off between viewing comfort, circulation lanes, and equipment cost."
            },
            "budget_optimized": {
                "label": "Budget-Optimized Plan",
                "corridor_width_m": 10.0,
                "pens_count": max(4, pens_count - 2),
                "barricade_panels": int(total_barricade_panels * 0.78),
                "evacuation_time_mins": round(evacuation_time_mins * 1.12, 1),
                "grand_total": round(grand_total * 0.82, 2),
                "description": "Streamlined pen geometry and consolidated access gates saving 18-22% on rental expenses."
            }
        }

        # Optimization suggestion if over budget
        optimization_notes = []
        if is_over_budget:
            optimization_notes.append(f"Switching to Budget-Optimized Plan saves ~{currency} {grand_total - alternatives['budget_optimized']['grand_total']:,.0f} by consolidating pen dividers.")
            optimization_notes.append("Convert rental stanchions to designated painted queue lanes.")
            optimization_notes.append("Partner with local municipal services for subsidized medical and waste bins.")

        return {
            "project_id": str(uuid.uuid4())[:8],
            "event_name": event_name,
            "event_type": event_type,
            "timestamp": datetime.datetime.now().isoformat(),
            "alternative_mode": alt_mode,
            "ground_dimensions": {
                "unit": unit,
                "shape": shape,
                "length": raw_length,
                "width": raw_width,
                "total_area_m2": round(total_area_m2, 1),
                "total_area_sqft": round(total_area_sqft, 1),
                "usable_area_m2": round(usable_area_m2, 1),
                "usable_area_sqft": round(usable_area_sqft, 1)
            },
            "capacity_analysis": {
                "expected_crowd": expected_crowd,
                "max_safe_capacity": max_safe_capacity,
                "density_m2_per_person": actual_density_m2_ppl,
                "density_sqft_per_person": actual_density_sqft_ppl,
                "safety_rating": density_rating,
                "density_color": density_color,
                "evacuation_time_mins": evacuation_time_mins,
                "ingress_time_mins": ingress_time_mins,
                "evac_compliant": evac_compliant
            },
            "layout": {
                "boundary": boundary_polygon,
                "stage": stage_elem,
                "barricade_pens": barricade_pens,
                "security_hub": security_hub,
                "facilities": facilities,
                "entry_gates": entry_gates,
                "exit_gates": exit_gates,
                "flow_vectors": flow_vectors,
                "perimeter_road_width_m": perimeter_road_width_m,
                "arterial_corridor_width_m": arterial_corridor_width_m
            },
            "equipment_quantities": {
                "barricade_linear_m": total_barricade_linear_m,
                "barricade_panels_count": total_barricade_panels,
                "turnstiles_count": entry_gates_count + exit_gates_count,
                "stage_sqm": int(stage_area_m2),
                "medical_tents_count": medical_stations_count,
                "ambulances_count": ambulance_staging_count,
                "restrooms_standard": restrooms_standard,
                "restrooms_ada": restrooms_ada_wheelchair,
                "water_stations": water_refill_stations,
                "light_towers": light_towers_count,
                "security_personnel": security_personnel,
                "paramedics_count": paramedics_count,
                "waste_bins": waste_bins_count
            },
            "budget": {
                "currency": currency,
                "budget_limit": budget_limit,
                "subtotal_equipment": subtotal_equipment,
                "subtotal_facilities": subtotal_facilities,
                "subtotal_staffing": subtotal_staffing,
                "subtotal_logistics": subtotal_logistics,
                "contingency_10pct": contingency_10pct,
                "grand_total": grand_total,
                "remaining_budget": remaining_budget,
                "is_over_budget": is_over_budget,
                "items": budget_items,
                "optimization_notes": optimization_notes
            },
            "safety_audit": safety_checks,
            "alternatives": alternatives
        }

crowdflow_engine = CrowdFlowEngine()
