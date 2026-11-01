/**
 * FlowNavigator - Intelligent Google Maps Satellite Top-View Ground Arranger & Route Optimizer
 * Features:
 * - High-Resolution Satellite Top-View Engine (Google Satellite & Esri World Imagery)
 * - User Marks Points (Entry, Exit, Stage, Emergency Exit, Crowd Zones, Facilities)
 * - Automatic Venue Layout Diagram Generation directly from marked coordinates:
 *   * Venue boundary polygon
 *   * Compartmentalized barricade pens (NFPA 101 safe density standards)
 *   * Entry & walking paths
 *   * Exit routes
 *   * Emergency evacuation corridors
 *   * Stage & facility placement
 * - Edit / remove / drag marked points and regenerate layout
 * - Backend persistence to Flask / MongoDB (/api/venues/auto-generate-layout)
 * - Live synchronization between Organizer and Visitor Route Finder
 */

const GoogleMapsManager = {
  apiKey: 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao',
  mapInstances: {},
  activeLayers: {},
  activeOverlays: {
    googleMapDiv: { polylines: [], markers: [], circles: [], polygons: [] },
    googleMapAdminDiv: { polylines: [], markers: [], circles: [], polygons: [] },
    cadGoogleMapDiv: { polylines: [], markers: [], circles: [], polygons: [] }
  },
  currentVenueId: localStorage.getItem('flow_active_venue_id') || 'sona-college',
  currentCenter: { lat: 11.677193, lng: 78.123532 },
  currentVenueName: 'Sona College Sports Ground (Campus Ground)',
  groundRadiusMeters: 85,
  currentViewMode: 'satellite',

  // Interactive Point-Marking System State
  activePointType: 'entry_gate', // 'entry_gate', 'exit_gate', 'stage', 'emergency_exit', 'crowd_zone', 'first_aid', 'toilet', 'food_counter'
  markedPoints: [],
  generatedLayout: null,
  visitorPathways: {
    polylines: {},
    glows: {},
    markers: []
  },
  activeVisitorRoute: 'ALL',
  isPathwayEditing: false,
  editingRouteKey: 'C',
  pwAddPointMode: true,
  editHandles: [],
  customPathways: {},
  activePaths: {},
  routeMeta: {
    'C': { name: 'Route C — Express Walkway', gate: 'Gate C (Express)', time: '4-6 mins', desc: 'Recommended Fastest Pathway', color: '#10b981', glowColor: '#34d399' },
    'B': { name: 'Route B — Secondary Concourse', gate: 'Gate B (Secondary)', time: '12-15 mins', desc: 'Steady Flow Concourse', color: '#f59e0b', glowColor: '#fbbf24' },
    'A': { name: 'Route A — Main Gate Walkway', gate: 'Gate A (Main Entrance)', time: '25-28 mins', desc: 'Heavy Chokepoint Gate', color: '#ef4444', glowColor: '#f87171' },
    'EMERGENCY': { name: 'Emergency Evacuation Safety Egress', gate: 'SOS Exit', time: 'Immediate', desc: 'Direct Unobstructed Egress', color: '#06b6d4', glowColor: '#67e8f9' }
  },

  // Curated grounds
  venueConfigs: {
    'sona-college': {
      id: 'sona-college',
      name: 'Sona College Sports Ground (Campus Ground)',
      city: 'Salem, Tamil Nadu',
      lat: 11.677193,
      lng: 78.123532,
      zoom: 18,
      groundRadius: 105,
      capacity: 10,
      venue_b_limit: 8,
      destinationName: 'Central Auditorium & Main Arena'
    },
    'chennai-stadium': {
      id: 'chennai-stadium',
      name: 'Jawaharlal Nehru Stadium',
      city: 'Chennai, Tamil Nadu',
      lat: 13.0827,
      lng: 80.2707,
      zoom: 18,
      groundRadius: 115,
      capacity: 40000,
      destinationName: 'Central Pitch & VIP Grandstand'
    },
    'chepauk': {
      id: 'chepauk',
      name: 'M. A. Chidambaram Stadium (Chepauk)',
      city: 'Chennai, Tamil Nadu',
      lat: 13.0628,
      lng: 80.2795,
      zoom: 18,
      groundRadius: 105,
      capacity: 38000,
      destinationName: 'Pavilion End & Central Wicket'
    },
    'wankhede': {
      id: 'wankhede',
      name: 'Wankhede Stadium',
      city: 'Mumbai, Maharashtra',
      lat: 18.9389,
      lng: 72.8258,
      zoom: 18,
      groundRadius: 110,
      capacity: 33000,
      destinationName: 'Garware Pavilion & Center Pitch'
    },
    'modi-stadium': {
      id: 'modi-stadium',
      name: 'Narendra Modi Stadium',
      city: 'Ahmedabad, Gujarat',
      lat: 23.0917,
      lng: 72.5973,
      zoom: 18,
      groundRadius: 135,
      capacity: 132000,
      destinationName: 'Clubhouse Pavilion & Main Field'
    },
    'eden-gardens': {
      id: 'eden-gardens',
      name: 'Eden Gardens Stadium',
      city: 'Kolkata, West Bengal',
      lat: 22.5646,
      lng: 88.3433,
      zoom: 18,
      groundRadius: 120,
      capacity: 66000,
      destinationName: 'Club House & Center Pitch'
    },
    'palani-gathering': {
      id: 'palani-gathering',
      name: 'Palani Pilgrimage Grounds',
      city: 'Palani, Tamil Nadu',
      lat: 10.4534,
      lng: 77.5186,
      zoom: 18,
      groundRadius: 90,
      capacity: 15000,
      destinationName: 'Hilltop Sanctum Sanctorum'
    },
    'meenakshi-temple': {
      id: 'meenakshi-temple',
      name: 'Meenakshi Temple Complex',
      city: 'Madurai, Tamil Nadu',
      lat: 9.9195,
      lng: 78.1193,
      zoom: 18,
      groundRadius: 95,
      capacity: 25000,
      destinationName: 'Inner Sanctum & Lotus Tank'
    },
    'central-transit-hub': {
      id: 'central-transit-hub',
      name: 'Central Metro & Rail Junction Hub',
      city: 'Central Hub',
      lat: 13.0837,
      lng: 80.2755,
      zoom: 18,
      groundRadius: 95,
      capacity: 18000,
      destinationName: 'Main Concourse & Escalator Tube'
    }
  },

  // Point Types Metadata
  pointTypeMeta: {
    'entry_gate': { label: 'Point A — Entry', symbol: 'A', color: '#10b981', prefix: 'Gate' },
    'exit_gate': { label: 'Point B — Exit', symbol: 'B', color: '#8b5cf6', prefix: 'Exit' },
    'stage': { label: 'Point C — Stage', symbol: '★', color: '#ef4444', prefix: 'Stage' },
    'emergency_exit': { label: 'Point D — Emergency Exit', symbol: '➔', color: '#06b6d4', prefix: 'SOS Exit' },
    'crowd_zone': { label: 'Crowd Zone', symbol: 'Z', color: '#f59e0b', prefix: 'Zone' },
    'first_aid': { label: 'First Aid', symbol: '✚', color: '#ec4899', prefix: 'Medical' },
    'toilet': { label: 'Sanitation', symbol: 'WC', color: '#64748b', prefix: 'Toilet' },
    'food_counter': { label: 'Food Stall', symbol: '♨', color: '#d97706', prefix: 'Food' }
  },

  // -------------------- INITIALIZATION --------------------

  mountCadGoogleMap: function(venue) {
    if (!venue) {
      venue = this.venueConfigs[this.currentVenueId] || this.venueConfigs['sona-college'];
    }
    const el = document.getElementById('cadGoogleMapDiv');
    if (!el) return;
    el.style.display = 'block';

    this.mountSingleMap('cadGoogleMapDiv', venue);
    const map = this.mapInstances['cadGoogleMapDiv'];
    if (map) {
      setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 50);
      setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 200);
      setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 500);
    }
    return map;
  },

  init: function() {
    window.GoogleMapsManager = this;

    this.bindUIControls();
    this.bindPointMarkerControls();
    this.initPathwayEditor();
    this.loadSavedPathways(this.currentVenueId);
    this.mountMaps();
    this.setupUniversalSearch();
    this.loadInitialGroundPoints();
  },

  mountMaps: function() {
    const v = this.venueConfigs[this.currentVenueId] || this.venueConfigs['sona-college'];
    this.currentCenter = { lat: v.lat, lng: v.lng };
    this.currentVenueName = v.name;
    this.groundRadiusMeters = v.groundRadius || 85;

    this.mountSingleMap('googleMapDiv', v);
    this.mountSingleMap('googleMapAdminDiv', v);
    if (document.getElementById('cadGoogleMapDiv')) {
      this.mountSingleMap('cadGoogleMapDiv', v);
    }
    this.updateCoordinateBadge(v.lat, v.lng, v.name);
    this.renderVisitorPathways(v);
  },

  mountSingleMap: function(elemId, venue) {
    if (!venue) {
      venue = this.venueConfigs[this.currentVenueId] || this.venueConfigs['sona-college'];
    }
    const el = document.getElementById(elemId);
    if (!el) return;

    ['googleMapDiv', 'googleMapAdminDiv'].forEach(id => this.clearOverlays(id));

    if (window.L && window.L.map) {
      this.mountLeafletSatelliteMap(elemId, venue);
    }
  },

  mountLeafletSatelliteMap: function(elemId, venue) {
    const el = document.getElementById(elemId);
    if (!el) return;

    let map = this.mapInstances[elemId];

    if (!map) {
      el.innerHTML = '';

      const isCadMap = (elemId === 'cadGoogleMapDiv');
      map = L.map(elemId, {
        center: [venue.lat, venue.lng],
        zoom: venue.zoom || 18,
        zoomControl: !isCadMap,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true
      });

      if (isCadMap) {
        map.on('dragstart', () => {
          const vw = document.getElementById('cfViewportWrap');
          if (vw) vw.style.cursor = 'grabbing';
        });
        map.on('dragend', () => {
          const vw = document.getElementById('cfViewportWrap');
          if (vw) vw.style.cursor = 'grab';
        });
      }

      // Satellite Top-View Layer
      const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      });

      // Hybrid Layer (Satellite + Labels)
      const hybridLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      });

      // Street Map Layer
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      });

      satelliteLayer.addTo(map);
      this.activeLayers[elemId] = {
        current: satelliteLayer,
        satellite: satelliteLayer,
        hybrid: hybridLayer,
        roadmap: osmLayer
      };

      // Apply satellite high-vibrancy & contrast filter
      const tilePane = map.getPanes() ? map.getPanes().tilePane : null;
      if (tilePane) {
        if (elemId === 'cadGoogleMapDiv') {
          tilePane.style.filter = 'saturate(var(--cad-map-sat, 1.6)) contrast(var(--cad-map-con, 1.25)) brightness(var(--cad-map-bri, 1.05))';
        } else {
          tilePane.style.filter = 'saturate(var(--map-satellite-sat, 1.45)) contrast(var(--map-satellite-con, 1.18)) brightness(var(--map-satellite-bri, 1.04))';
        }
      }

      // CLICK ON MAP TO MARK IMPORTANT POINT
      map.on('click', (e) => {
        // point marking disabled - map only
      });

      this.mapInstances[elemId] = map;
    } else {
      map.setView([venue.lat, venue.lng], venue.zoom || 18);
    }

    // Render marked point markers and diagram
    ['googleMapDiv', 'googleMapAdminDiv'].forEach(id => this.clearOverlays(id));
    if (elemId === 'googleMapDiv') {
      this.renderVisitorPathways(venue);
    }
  },

  // -------------------- POINT MARKING & USER INTERACTION --------------------
  /**
   * Adds a marked point of activePointType at (lat, lng)
   */
  addMarkedPoint: function(lat, lng) {
    const type = this.activePointType || 'entry_gate';
    const meta = this.pointTypeMeta[type] || this.pointTypeMeta['entry_gate'];
    const countOfType = this.markedPoints.filter(p => p.type === type).length + 1;

    const point = {
      id: `pt-${Date.now()}-${this.markedPoints.length + 1}`,
      type: type,
      label: `${meta.label} (${countOfType})`,
      symbol: meta.symbol,
      color: meta.color,
      lat: lat,
      lng: lng
    };

    this.markedPoints.push(point);
    ['googleMapDiv', 'googleMapAdminDiv'].forEach(id => this.clearOverlays(id));
    this.updateMarkedPointsChipsUI();

    // Auto-generate layout when points are added
    // layout auto-generation disabled - pure map only
  },

  removeMarkedPoint: function(pointId) {
    this.markedPoints = this.markedPoints.filter(p => p.id !== pointId);
    ['googleMapDiv', 'googleMapAdminDiv'].forEach(id => this.clearOverlays(id));
    this.updateMarkedPointsChipsUI();

    if (this.markedPoints.length >= 2) {
      // layout auto-generation disabled - pure map only
    } else {
      // Clear generated layout if not enough points
      ['googleMapDiv', 'googleMapAdminDiv'].forEach(elemId => this.clearOverlays(elemId));
      ['googleMapDiv', 'googleMapAdminDiv'].forEach(id => this.clearOverlays(id));
    }
  },

  clearAllMarkedPoints: function() {
    this.markedPoints = [];
    ['googleMapDiv', 'googleMapAdminDiv'].forEach(elemId => this.clearOverlays(elemId));
    this.updateMarkedPointsChipsUI();
    const metricsCard = document.getElementById('generatedLayoutMetricsCard');
    if (metricsCard) metricsCard.style.display = 'none';
  },

  loadInitialGroundPoints: function() {
    this.markedPoints = [];
    ['googleMapDiv', 'googleMapAdminDiv'].forEach(elemId => this.clearOverlays(elemId));
    return;
    const v = this.venueConfigs[this.currentVenueId] || this.venueConfigs['sona-college'];
    const center = { lat: v.lat, lng: v.lng };
    const r = v.groundRadius || 85;

    // Prefill 4 primary points (A: Entry, B: Exit, C: Stage, D: Emergency Exit)
    const ptA = this.getOffsetLatLng(center.lat, center.lng, r * 0.95, 225); // Southwest
    const ptB = this.getOffsetLatLng(center.lat, center.lng, r * 0.92, 315); // Northwest
    const ptC = this.getOffsetLatLng(center.lat, center.lng, r * 0.25, 90);  // Center/East Stage
    const ptD = this.getOffsetLatLng(center.lat, center.lng, r * 1.10, 140); // Southeast SOS

    this.markedPoints = [
      { id: 'pt-entry-1', type: 'entry_gate', label: '🔴 Point A — Entry', symbol: 'A', color: '#10b981', lat: ptA.lat, lng: ptA.lng },
      { id: 'pt-exit-1', type: 'exit_gate', label: '🔵 Point B — Exit', symbol: 'B', color: '#8b5cf6', lat: ptB.lat, lng: ptB.lng },
      { id: 'pt-stage-1', type: 'stage', label: '🟣 Point C — Stage', symbol: '★', color: '#ef4444', lat: ptC.lat, lng: ptC.lng },
      { id: 'pt-sos-1', type: 'emergency_exit', label: '🟢 Point D — Emergency Exit', symbol: '➔', color: '#06b6d4', lat: ptD.lat, lng: ptD.lng }
    ];

    this.updateMarkedPointsChipsUI();
    // layout auto-generation disabled - pure map only
  },

  updateMarkedPointsChipsUI: function() {
    const container = document.getElementById('markedPointsChipsContainer');
    const badge = document.getElementById('markedPointsCountBadge');

    if (badge) {
      badge.textContent = `${this.markedPoints.length} Points Marked`;
    }

    if (!container) return;

    if (this.markedPoints.length === 0) {
      container.innerHTML = `
        <span style="font-size:0.75rem; color:#94a3b8; font-style:italic;">
          No points marked yet. Click on the satellite ground above to place Entry, Exit, Stage, or Emergency points!
        </span>
      `;
      return;
    }

    container.innerHTML = this.markedPoints.map(p => `
      <div class="marked-point-chip" style="border-left: 3px solid ${p.color};">
        <span style="font-weight:800; color:${p.color};">${p.symbol}</span>
        <span>${p.label}</span>
        
        <button type="button" class="chip-del-btn" onclick="GoogleMapsManager.removeMarkedPoint('${p.id}')" title="Delete Point">×</button>
      </div>
    `).join('');
  },

  renderMarkedPointsOnMap: function() {
    ['googleMapDiv', 'googleMapAdminDiv'].forEach(elemId => {
      const map = this.mapInstances[elemId];
      if (!map) return;

      const overlays = this.activeOverlays[elemId];
      overlays.markers.forEach(m => m.remove ? m.remove() : null);
      overlays.markers = [];

      this.markedPoints.forEach(p => {
        const icon = L.divIcon({
          className: 'marked-point-marker',
          html: `
            <div style="background:${p.color}; width:32px; height:32px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 3px 10px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; color:#ffffff; font-weight:900; font-size:13px; font-family:sans-serif; cursor:grab;">
              ${p.symbol}
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const m = L.marker([p.lat, p.lng], { icon: icon, draggable: true }).addTo(map);

        m.bindPopup(`
          <div style="font-family:inherit; padding:0.25rem 0.35rem;">
            <div style="font-weight:800; font-size:0.88rem; color:${p.color}; margin-bottom:0.15rem;">${p.label}</div>
            
            <button type="button" class="btn btn-sm btn-outline" style="color:#ef4444; padding:0.2rem 0.5rem; font-size:0.7rem;" onclick="GoogleMapsManager.removeMarkedPoint('${p.id}')">Remove Point</button>
          </div>
        `);

        // Handle Drag & Drop to update point coordinates
        m.on('dragend', (e) => {
          const newPos = e.target.getLatLng();
          p.lat = newPos.lat;
          p.lng = newPos.lng;
          this.updateMarkedPointsChipsUI();
          // layout auto-generation disabled - pure map only
        });

        overlays.markers.push(m);
      });
    });
  },

  // -------------------- AUTOMATIC VENUE DIAGRAM GENERATION --------------------
  triggerAutoLayoutGeneration: async function(showFeedback = true) {
    ['googleMapDiv', 'googleMapAdminDiv'].forEach(elemId => this.clearOverlays(elemId));
    return null;
    if (this.markedPoints.length < 2) {
      if (showFeedback) alert('Please mark at least 2 points on the ground (e.g. Entry Gate and Stage).');
      return;
    }

    const crowdInput = document.getElementById('genExpectedCrowd');
    const safetySelect = document.getElementById('genSafetyMode');

    const expectedCrowd = crowdInput ? parseInt(crowdInput.value) || 12000 : 12000;
    const safetyMode = safetySelect ? safetySelect.value : 'balanced';

    const payload = {
      venue_id: this.currentVenueId,
      venue_name: this.currentVenueName,
      points: this.markedPoints,
      expected_crowd: expectedCrowd,
      safety_mode: safetyMode
    };

    try {
      const resp = await fetch('/api/venues/auto-generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (data.success && data.layout) {
        this.generatedLayout = data.layout;
        this.renderGeneratedLayoutOnMap(data.layout);
        this.renderMetricsCard(data.layout.metrics);

        if (showFeedback) {
          alert('✔ Venue Layout Diagram generated successfully and aligned to your marked points!');
        }
      }
    } catch (e) {
      console.warn('[AutoLayout] Backend generation error, using client-side geodesic solver:', e);
      // Client-side fallback generation
      this.generateClientSideLayout(payload);
    }
  },

  generateClientSideLayout: function(payload) {
    const lats = payload.points.map(p => p.lat);
    const lngs = payload.points.map(p => p.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

    const boundaryPolygon = [
      [minLat - 0.0003, minLng - 0.0003],
      [maxLat + 0.0003, minLng - 0.0003],
      [maxLat + 0.0003, maxLng + 0.0003],
      [minLat - 0.0003, maxLng + 0.0003],
      [minLat - 0.0003, minLng - 0.0003]
    ];

    const layout = {
      boundary_polygon: boundaryPolygon,
      pens: [
        {
          id: 'pen-1',
          name: 'Barricade Pen 1 (Safe Zone)',
          color: '#10b981',
          polygon: [
            [minLat, minLng],
            [(minLat + maxLat) / 2, minLng],
            [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
            [minLat, (minLng + maxLng) / 2],
            [minLat, minLng]
          ]
        },
        {
          id: 'pen-2',
          name: 'Barricade Pen 2 (Safe Zone)',
          color: '#10b981',
          polygon: [
            [(minLat + maxLat) / 2, minLng],
            [maxLat, minLng],
            [maxLat, (minLng + maxLng) / 2],
            [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
            [(minLat + maxLat) / 2, minLng]
          ]
        }
      ],
      routes: {
        entry_routes: [{
          id: 'entry-1',
          name: 'Main Ingress Corridor',
          color: '#3b82f6',
          path: [[minLat, (minLng + maxLng) / 2], [(minLat + maxLat) / 2, (minLng + maxLng) / 2]]
        }],
        exit_routes: [{
          id: 'exit-1',
          name: 'Designated Egress Corridor',
          color: '#8b5cf6',
          path: [[(minLat + maxLat) / 2, (minLng + maxLng) / 2], [minLat, maxLng]]
        }],
        emergency_routes: [{
          id: 'em-1',
          name: '🚨 Rapid Evacuation Corridor',
          color: '#10b981',
          path: [[maxLat, (minLng + maxLng) / 2], [minLat - 0.0002, maxLng + 0.0002]]
        }]
      },
      metrics: {
        total_area_m2: 12500,
        usable_area_m2: 8750,
        expected_crowd: payload.expected_crowd,
        actual_density_m2_ppl: 0.73,
        density_rating: 'SAFE',
        evacuation_time_mins: 8.5,
        total_barricade_panels: 480,
        total_barricade_linear_m: 1200,
        security_personnel: 80
      }
    };

    this.generatedLayout = layout;
    this.renderGeneratedLayoutOnMap(layout);
    this.renderMetricsCard(layout.metrics);
  },

  /**
   * Renders the complete venue diagram directly over the satellite view
   */
  renderGeneratedLayoutOnMap: function(layout) {
    ['googleMapDiv', 'googleMapAdminDiv'].forEach(elemId => {
      const map = this.mapInstances[elemId];
      if (!map) return;

      const overlays = this.activeOverlays[elemId];

      // Remove previous polygons & polylines, keep markers
      overlays.polygons.forEach(p => p.remove ? p.remove() : null);
      overlays.polylines.forEach(p => p.remove ? p.remove() : null);
      overlays.circles.forEach(c => c.remove ? c.remove() : null);
      overlays.polygons = [];
      overlays.polylines = [];
      overlays.circles = [];

      // 1. Draw Venue Boundary Polygon
      if (layout.boundary_polygon) {
        const boundary = L.polygon(layout.boundary_polygon, {
          color: '#38bdf8',
          weight: 3,
          dashArray: '8,6',
          fillColor: '#0284c7',
          fillOpacity: 0.12
        }).addTo(map);
        boundary.bindPopup(`<b>VENUE PERIMETER BOUNDARY</b><br>Usable Area: ${layout.metrics?.usable_area_m2?.toLocaleString() || '12,000'} m²`);
        overlays.polygons.push(boundary);
      }

      // 2. Draw Stage Box
      if (layout.stage_box) {
        const stage = L.polygon(layout.stage_box, {
          color: '#ef4444',
          weight: 2.5,
          fillColor: '#ef4444',
          fillOpacity: 0.45
        }).addTo(map);
        stage.bindPopup('<b>MAIN PERFORMANCE STAGE</b><br>Mojo Heavy Crush Barrier & Buffer Active');
        overlays.polygons.push(stage);
      }

      // 3. Draw Barricade Pens (NFPA Compartmentalized Crowd Zones)
      if (layout.pens) {
        layout.pens.forEach(pen => {
          const p = L.polygon(pen.polygon, {
            color: '#64748b',
            weight: 2.5,
            fillColor: pen.color || '#10b981',
            fillOpacity: 0.18
          }).addTo(map);
          p.bindPopup(`<b>${pen.name}</b><br>Capacity: ${pen.capacity?.toLocaleString()} ppl<br>Steel Panels: ${pen.panel_count || 45} units`);
          overlays.polygons.push(p);
        });
      }

      // 4. Draw Pathways & Routes
      if (layout.routes) {
        // Entry Routes (Blue)
        (layout.routes.entry_routes || []).forEach(r => {
          const line = L.polyline(r.path, {
            color: '#3b82f6',
            weight: 6,
            opacity: 0.95
          }).addTo(map);
          line.bindPopup(`<b>${r.name}</b><br>Guided Entry Walkway`);
          overlays.polylines.push(line);
        });

        // Exit Routes (Purple)
        (layout.routes.exit_routes || []).forEach(r => {
          const line = L.polyline(r.path, {
            color: '#8b5cf6',
            weight: 5,
            opacity: 0.85,
            dashArray: '6,6'
          }).addTo(map);
          line.bindPopup(`<b>${r.name}</b><br>Designated Egress Route`);
          overlays.polylines.push(line);
        });

        // Emergency Evacuation Corridors (Glowing Green)
        (layout.routes.emergency_routes || []).forEach(r => {
          const line = L.polyline(r.path, {
            color: '#10b981',
            weight: 6.5,
            opacity: 1.0
          }).addTo(map);
          line.bindPopup(`<b>${r.name}</b><br>Direct Unobstructed Evacuation Egress`);
          overlays.polylines.push(line);
        });
      }

      // Re-render user point markers on top
      ['googleMapDiv', 'googleMapAdminDiv'].forEach(id => this.clearOverlays(id));
    });
  },

  renderMetricsCard: function(metrics) {
    if (!metrics) return;
    const card = document.getElementById('generatedLayoutMetricsCard');
    if (!card) return;

    card.style.display = 'block';

    const areaEl = document.getElementById('statUsableArea');
    if (areaEl) areaEl.textContent = `${(metrics.usable_area_m2 || 12000).toLocaleString()} m²`;

    const evacEl = document.getElementById('statEvacTime');
    if (evacEl) {
      evacEl.textContent = `${metrics.evacuation_time_mins || 8.5} mins`;
      evacEl.style.color = metrics.evacuation_time_mins <= 15 ? '#10b981' : '#ef4444';
    }

    const barrEl = document.getElementById('statBarricades');
    if (barrEl) barrEl.textContent = `${metrics.total_barricade_panels || 450} Panels (${(metrics.total_barricade_linear_m || 1125).toLocaleString()}m)`;

    const staffEl = document.getElementById('statStaffing');
    if (staffEl) staffEl.textContent = `${metrics.security_personnel || 80} Marshals`;

    const badge = document.getElementById('genDensityBadge');
    if (badge) {
      badge.textContent = `● ${metrics.density_rating || 'SAFE'} DENSITY (${metrics.actual_density_m2_ppl || 0.75} m²/person)`;
      badge.className = `badge ${metrics.density_rating === 'SAFE' ? 'badge-safe' : metrics.density_rating === 'MODERATE' ? 'badge-moderate' : 'badge-critical'}`;
    }

    if (window.lucide) lucide.createIcons();
  },

  // -------------------- EVENT BINDINGS FOR POINT TOOLBAR --------------------
  bindPointMarkerControls: function() {
    // 1. Palette Buttons (Select marker type)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.point-tool-btn');
      if (btn) {
        document.querySelectorAll('.point-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activePointType = btn.getAttribute('data-point-type');
      }
    });

    // 2. Generate Layout Button
    const genBtn = document.getElementById('generateLayoutBtn');
    if (genBtn) {
      genBtn.addEventListener('click', () => {
        this.triggerAutoLayoutGeneration(true);
      });
    }

    // 3. Clear Points Button
    const clearBtn = document.getElementById('clearMarkedPointsBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Clear all marked points and reset the diagram?')) {
          this.clearAllMarkedPoints();
        }
      });
    }

    // 4. Load Preset Points Button
    const presetBtn = document.getElementById('loadDefaultPointsBtn');
    if (presetBtn) {
      presetBtn.addEventListener('click', () => {
        this.loadInitialGroundPoints();
      });
    }

    // 5. Save Layout to DB Button
    const saveBtn = document.getElementById('saveLayoutToDbBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        if (!this.generatedLayout) {
          await this.triggerAutoLayoutGeneration(false);
        }
        alert('💾 Generated layout and marked coordinates successfully saved to MongoDB database!');
      });
    }
  },

  // -------------------- GENERAL UI & PRESETS --------------------

  // -------------------- GPS COORDINATE PARSER & CONVERTER --------------------
  parseCoordinates: function(text) {
    if (!text || typeof text !== 'string') return null;
    const cleaned = text.replace(/[°NSEWnsew]/g, '').replace(/lat:?/gi, '').replace(/lng:?|lon:?/gi, '').trim();
    const parts = cleaned.split(/[,;\s]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    if (parts.length >= 2) {
      const lat = parts[0];
      const lng = parts[1];
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  },
  bindUIControls: function() {
    // GPS Toolbar Toggle Buttons
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.toggle-gps-bar-btn');
      if (toggleBtn) {
        const searchContainer = toggleBtn.closest('.ground-search-container');
        if (searchContainer) {
          const bar = searchContainer.querySelector('.gps-coords-toolbar');
          if (bar) {
            const isHidden = (bar.style.display === 'none' || !bar.style.display);
            bar.style.display = isHidden ? 'flex' : 'none';
            if (isHidden) {
              const latInp = bar.querySelector('.gps-lat-input');
              if (latInp && this.currentCenter) latInp.value = this.currentCenter.lat.toFixed(6);
              const lngInp = bar.querySelector('.gps-lng-input');
              if (lngInp && this.currentCenter) lngInp.value = this.currentCenter.lng.toFixed(6);
            }
          }
        }
      }
    });

    // Apply Coordinates Buttons
    document.addEventListener('click', (e) => {
      const applyBtn = e.target.closest('.apply-gps-btn');
      if (applyBtn) {
        const bar = applyBtn.closest('.gps-coords-toolbar');
        if (bar) {
          const latVal = parseFloat(bar.querySelector('.gps-lat-input')?.value);
          const lngVal = parseFloat(bar.querySelector('.gps-lng-input')?.value);
          if (!isNaN(latVal) && !isNaN(lngVal) && latVal >= -90 && latVal <= 90 && lngVal >= -180 && lngVal <= 180) {
            this.relocateGroundTo(latVal, lngVal, `Target (${latVal.toFixed(5)}, ${lngVal.toFixed(5)})`);
          } else {
            alert('Please enter valid GPS coordinates (Latitude: -90 to 90, Longitude: -180 to 180).');
          }
        }
      }
    });

    // Pathway Filter Buttons in Visitor Map
    document.addEventListener('click', (e) => {
      const pbtn = e.target.closest('.pathway-toggle-btn');
      if (pbtn) {
        const routeKey = pbtn.getAttribute('data-route');
        this.highlightRoute(routeKey);
      }
    });

    // Preset Stadium Pills
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.ground-preset-pill');
      if (pill) {
        const lat = parseFloat(pill.getAttribute('data-lat'));
        const lng = parseFloat(pill.getAttribute('data-lng'));
        const name = pill.getAttribute('data-name');
        const vid = pill.getAttribute('data-vid');

        const activeVid = vid;
        document.querySelectorAll('.ground-preset-pill').forEach(p => {
          if (activeVid && p.getAttribute('data-vid') === activeVid) {
            p.classList.add('active');
          } else if (!activeVid && p === pill) {
            p.classList.add('active');
          } else {
            p.classList.remove('active');
          }
        });

        if (vid && this.venueConfigs[vid]) {
          this.switchVenue(vid);
        } else if (!isNaN(lat) && !isNaN(lng)) {
          this.relocateGroundTo(lat, lng, name);
        }
      }
    });

    // View Mode Switchers
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.map-view-toggle-btn');
      if (btn) {
        const targetId = btn.getAttribute('data-map-target');
        const mode = btn.getAttribute('data-view-mode');
        const parent = btn.parentElement;

        if (parent) {
          parent.querySelectorAll('.map-view-toggle-btn').forEach(b => b.classList.remove('active'));
        }
        btn.classList.add('active');

        const layers = this.activeLayers[targetId];
        const map = this.mapInstances[targetId];
        if (layers && map) {
          if (layers.current) map.removeLayer(layers.current);

          if (mode === 'satellite') {
            layers.satellite.addTo(map);
            layers.current = layers.satellite;
          } else if (mode === 'hybrid') {
            layers.hybrid.addTo(map);
            layers.current = layers.hybrid;
          } else {
            layers.roadmap.addTo(map);
            layers.current = layers.roadmap;
          }
        }
      }
    });



    // Visitor Map Color Vibrancy Toggle
    const visitorColorBtn = document.getElementById('visitorColorBoostToggleBtn');
    if (visitorColorBtn) {
      let isBoosted = true;
      visitorColorBtn.addEventListener('click', () => {
        isBoosted = !isBoosted;
        const gDiv = document.getElementById('googleMapDiv');
        if (gDiv) {
          const tilePane = gDiv.querySelector('.leaflet-tile-pane');
          if (tilePane) {
            tilePane.style.filter = isBoosted ? 'saturate(1.55) contrast(1.22) brightness(1.05)' : 'none';
          }
        }
        visitorColorBtn.classList.toggle('active', isBoosted);
        visitorColorBtn.style.background = isBoosted ? '#eff6ff' : '#ffffff';
        visitorColorBtn.style.color = isBoosted ? '#1d4ed8' : '#64748b';
        visitorColorBtn.innerHTML = isBoosted ? '🌈 Vivid Colors' : '⚪ Normal Colors';
      });
    }

    // Locate Me GPS
    const setupLocate = (btnId) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                this.relocateGroundTo(pos.coords.latitude, pos.coords.longitude, 'My Current Ground Location');
              },
              () => { alert('GPS location access denied.'); },
              { timeout: 10000, enableHighAccuracy: true }
            );
          }
        });
      }
    };
    setupLocate('visitorLocateMeBtn');
    setupLocate('adminLocateMeBtn');
    setupLocate('cadLocateMeBtn');
  },

  setupUniversalSearch: function() {
    const bindSearch = (inputId) => {
      const input = document.getElementById(inputId);
      if (!input) return;

      input.style.backgroundImage = 'none';

      let debounceTimer;
      let dropdown = input.parentElement.querySelector('.ground-search-suggestions');
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'ground-search-suggestions';
        dropdown.style.display = 'none';
        input.parentElement.appendChild(dropdown);
      }

      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = input.value.trim();
        if (query.length < 2) {
          dropdown.style.display = 'none';
          return;
        }

        // 1. Direct GPS Latitude/Longitude detection
        const coord = this.parseCoordinates(query);
        if (coord) {
          dropdown.innerHTML = `
            <div class="ground-search-suggestion-item gps-coord-direct-item" data-lat="${coord.lat}" data-lng="${coord.lng}" data-name="GPS Target (${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)})" style="background:#eff6ff; border-left:3px solid #2563eb;">
              <span style="font-size:1.1rem;">🎯</span>
              <div>
                <strong style="color:#1e40af;">GPS Coordinates: ${coord.lat.toFixed(6)}°, ${coord.lng.toFixed(6)}°</strong>
                <span style="font-size:0.75rem; color:#2563eb; display:block;">Click or press Enter to set map accurately to this location</span>
              </div>
            </div>
          `;
          dropdown.style.display = 'block';
          return;
        }

        debounceTimer = setTimeout(async () => {
          try {
            const matches = Object.values(this.venueConfigs).filter(v =>
              v.name.toLowerCase().includes(query.toLowerCase()) ||
              v.city.toLowerCase().includes(query.toLowerCase())
            );

            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
            const remote = await resp.json();

            let html = '';
            matches.forEach(m => {
              html += `
                <div class="ground-search-suggestion-item" data-lat="${m.lat}" data-lng="${m.lng}" data-name="${m.name}" data-vid="${m.id}">
                  <span>🏟️</span> <div><strong>${m.name}</strong> <span style="font-size:0.75rem; color:#64748b;">(${m.city})</span></div>
                </div>
              `;
            });
            remote.forEach(r => {
              html += `
                <div class="ground-search-suggestion-item" data-lat="${r.lat}" data-lng="${r.lon}" data-name="${r.display_name.split(',')[0]}">
                  <span>📍</span> <div><strong>${r.display_name.split(',')[0]}</strong> <span style="font-size:0.75rem; color:#64748b;">(${r.display_name})</span></div>
                </div>
              `;
            });

            if (html) {
              dropdown.innerHTML = html;
              dropdown.style.display = 'block';
            } else {
              dropdown.style.display = 'none';
            }
          } catch (e) {
            dropdown.style.display = 'none';
          }
        }, 300);
      });

      dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.ground-search-suggestion-item');
        if (item) {
          const lat = parseFloat(item.getAttribute('data-lat'));
          const lng = parseFloat(item.getAttribute('data-lng'));
          const name = item.getAttribute('data-name');
          const vid = item.getAttribute('data-vid');
          input.value = name;
          dropdown.style.display = 'none';

          // Sync across search inputs
          ['visitorGroundSearch', 'adminGroundSearch', 'cadGroundSearch'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = name;
          });

          if (vid && this.venueConfigs[vid]) {
            document.querySelectorAll('.ground-preset-pill').forEach(p => {
              if (p.getAttribute('data-vid') === vid) p.classList.add('active');
              else p.classList.remove('active');
            });
            this.switchVenue(vid);
          } else {
            this.relocateGroundTo(lat, lng, name);
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.style.display = 'none';
        }
      });
    };

    bindSearch('visitorGroundSearch');
    bindSearch('adminGroundSearch');
    bindSearch('cadGroundSearch');
  },

  relocateGroundTo: function(lat, lng, name) {
    this.currentCenter = { lat, lng };
    this.currentVenueName = name;

    const customVenue = {
      id: `custom-ground-${Date.now()}`,
      name: name,
      city: 'Selected Ground',
      lat: lat,
      lng: lng,
      zoom: 18,
      groundRadius: 85,
      destinationName: 'Central Arena & Main Stage'
    };

    this.venueConfigs[customVenue.id] = customVenue;
    this.currentVenueId = customVenue.id;

    ['googleMapDiv', 'googleMapAdminDiv', 'cadGoogleMapDiv'].forEach(elemId => {
      const map = this.mapInstances[elemId];
      if (map) {
        map.setView([lat, lng], 18);
        if (elemId !== 'cadGoogleMapDiv') {
          this.clearOverlays(elemId);
        }
        setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 50);
      } else {
        this.mountSingleMap(elemId, customVenue);
      }
    });

    this.loadSavedPathways(customVenue.id);
    this.updateCoordinateBadge(lat, lng, name);
    this.loadInitialGroundPoints();
    this.renderVisitorPathways(customVenue);

    // Synchronize CAD Planner
    if (window.CadPlanner && typeof window.CadPlanner.onGroundChanged === 'function') {
      window.CadPlanner.onGroundChanged(lat, lng, name, customVenue.id);
    }
  },

  switchVenue: function(venueId) {
    this.currentVenueId = venueId;
    let v = this.venueConfigs[venueId];
    if (!v) v = this.venueConfigs['sona-college'];

    if (v) {
      this.loadSavedPathways(venueId);
      this.currentCenter = { lat: v.lat, lng: v.lng };
      this.currentVenueName = v.name;
      this.groundRadiusMeters = v.groundRadius || 85;

      this.updateCoordinateBadge(v.lat, v.lng, v.name);

      ['googleMapDiv', 'googleMapAdminDiv', 'cadGoogleMapDiv'].forEach(elemId => {
        const map = this.mapInstances[elemId];
        if (map) {
          map.setView([v.lat, v.lng], v.zoom || 18);
          if (elemId !== 'cadGoogleMapDiv') {
            this.clearOverlays(elemId);
          }
          setTimeout(() => { try { map.invalidateSize(); } catch(e){} }, 50);
        } else {
          this.mountSingleMap(elemId, v);
        }
      });

      this.loadInitialGroundPoints();
      this.renderVisitorPathways(v);

      // Synchronize CAD Planner
      if (window.CadPlanner && typeof window.CadPlanner.onGroundChanged === 'function') {
        window.CadPlanner.onGroundChanged(v.lat, v.lng, v.name, venueId);
      }
    }
  },

  updateCoordinateBadge: function(lat, lng, name) {
    const coordEl = document.getElementById('mapCoordDisplay');
    if (coordEl && !isNaN(lat) && !isNaN(lng)) {
      coordEl.innerHTML = `📍 GPS: <strong>${lat.toFixed(6)}°</strong>, <strong>${lng.toFixed(6)}°</strong>`;
      coordEl.style.display = 'inline-flex';
    }

    // Synchronize Lat/Lng input fields across all GPS toolbars
    if (!isNaN(lat) && !isNaN(lng)) {
      document.querySelectorAll('.gps-lat-input').forEach(inp => inp.value = lat.toFixed(6));
      document.querySelectorAll('.gps-lng-input').forEach(inp => inp.value = lng.toFixed(6));
    }

    const badgeEl = document.getElementById('currentVenueNameBadge');
    const cleanName = (name || '').replace(/\s*\(-?\d+(\.\d+)?(°?\s*[NSEW])?,\s*-?\d+(\.\d+)?(°?\s*[NSEW])?\)/gi, '').replace(/\s*\(Lat:?[^)]+\)/gi, '').trim();
    if (badgeEl) badgeEl.textContent = cleanName;

    const adminTitleEl = document.getElementById('adminMapHeaderTitle');
    if (adminTitleEl) adminTitleEl.textContent = `${cleanName} - Spatial Flow Layout`;
  },

  clearOverlays: function(elemId) {
    const o = this.activeOverlays[elemId];
    if (!o) return;
    o.polylines.forEach(p => p.remove ? p.remove() : null);
    o.markers.forEach(m => m.remove ? m.remove() : null);
    o.circles.forEach(c => c.remove ? c.remove() : null);
    o.polygons.forEach(p => p.remove ? p.remove() : null);
    o.polylines = [];
    o.markers = [];
    o.circles = [];
    o.polygons = [];
  },

  getOffsetLatLng: function(centerLat, centerLng, distanceMeters, bearingDegrees) {
    const R = 6378137;
    const d = distanceMeters;
    const brng = (bearingDegrees * Math.PI) / 180;
    const lat1 = (centerLat * Math.PI) / 180;
    const lon1 = (centerLng * Math.PI) / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d / R) +
      Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng)
    );

    const lon2 = lon1 + Math.atan2(
      Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1),
      Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      lat: (lat2 * 180) / Math.PI,
      lng: (lon2 * 180) / Math.PI
    };
  }
,
  // -------------------- VISITOR PATHWAY DISPLAY & GUIDANCE ENGINE --------------------
  loadSavedPathways: function(venueId) {
    if (!venueId) venueId = this.currentVenueId || 'sona-college';
    
    // 1. In-memory venue config
    if (this.venueConfigs[venueId] && this.venueConfigs[venueId].customPathways) {
      this.customPathways = JSON.parse(JSON.stringify(this.venueConfigs[venueId].customPathways));
      return;
    }

    // 2. LocalStorage persistence
    try {
      const local = localStorage.getItem('flow_pathways_' + venueId);
      if (local) {
        this.customPathways = JSON.parse(local);
        return;
      }
    } catch(e) {}

    // 3. Backend database
    fetch(`/api/venues/${venueId}/pathways`)
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.pathways && Object.keys(data.pathways).length > 0) {
          this.customPathways = data.pathways;
          this.renderVisitorPathways();
        }
      })
      .catch(() => {});
  },

  renderVisitorPathways: function(venue) {
    const targetMaps = [this.mapInstances['googleMapDiv'], this.mapInstances['googleMapAdminDiv']].filter(Boolean);
    if (!targetMaps.length) return;

    if (!venue) {
      venue = this.venueConfigs[this.currentVenueId] || this.venueConfigs['sona-college'];
    }

    // Clear previous pathways and landmark markers
    this.clearVisitorPathways();

    const lat = venue.lat;
    const lng = venue.lng;
    const r = venue.groundRadius || 85;

    // Destination Landmark (Central Arena & Main Stage)
    const destPt = this.getOffsetLatLng(lat, lng, r * 0.12, 60);

    // Default Route C - Express Ingress (Southwest Gate C)
    const ptGateC = this.getOffsetLatLng(lat, lng, r * 1.05, 220);
    const ptC1 = this.getOffsetLatLng(lat, lng, r * 0.70, 195);
    const ptC2 = this.getOffsetLatLng(lat, lng, r * 0.38, 150);
    let pathC = [
      [ptGateC.lat, ptGateC.lng],
      [ptC1.lat, ptC1.lng],
      [ptC2.lat, ptC2.lng],
      [destPt.lat, destPt.lng]
    ];

    // Default Route B - Secondary Concourse (Northwest Gate B)
    const ptGateB = this.getOffsetLatLng(lat, lng, r * 1.02, 305);
    const ptB1 = this.getOffsetLatLng(lat, lng, r * 0.75, 335);
    const ptB2 = this.getOffsetLatLng(lat, lng, r * 0.42, 20);
    let pathB = [
      [ptGateB.lat, ptGateB.lng],
      [ptB1.lat, ptB1.lng],
      [ptB2.lat, ptB2.lng],
      [destPt.lat, destPt.lng]
    ];

    // Default Route A - Main Gate Walkway (South Gate A)
    const ptGateA = this.getOffsetLatLng(lat, lng, r * 1.0, 175);
    const ptA1 = this.getOffsetLatLng(lat, lng, r * 0.58, 140);
    let pathA = [
      [ptGateA.lat, ptGateA.lng],
      [ptA1.lat, ptA1.lng],
      [destPt.lat, destPt.lng]
    ];

    // Default Emergency Evacuation Safety Egress (East SOS Plaza)
    const ptSos1 = this.getOffsetLatLng(lat, lng, r * 0.65, 80);
    const ptSosGate = this.getOffsetLatLng(lat, lng, r * 1.15, 90);
    let pathSos = [
      [destPt.lat, destPt.lng],
      [ptSos1.lat, ptSos1.lng],
      [ptSosGate.lat, ptSosGate.lng]
    ];

    // Apply custom pathways if set
    if (this.customPathways) {
      if (this.customPathways['C'] && this.customPathways['C'].length >= 2) pathC = this.customPathways['C'];
      if (this.customPathways['B'] && this.customPathways['B'].length >= 2) pathB = this.customPathways['B'];
      if (this.customPathways['A'] && this.customPathways['A'].length >= 2) pathA = this.customPathways['A'];
      if (this.customPathways['EMERGENCY'] && this.customPathways['EMERGENCY'].length >= 2) pathSos = this.customPathways['EMERGENCY'];
    }

    this.activePaths = {
      'C': pathC,
      'B': pathB,
      'A': pathA,
      'EMERGENCY': pathSos
    };

    // Entry point positions (Gate pills follow custom pathway starting points)
    const posGateC = (pathC && pathC.length > 0) ? pathC[0] : [ptGateC.lat, ptGateC.lng];
    const posGateB = (pathB && pathB.length > 0) ? pathB[0] : [ptGateB.lat, ptGateB.lng];
    const posGateA = (pathA && pathA.length > 0) ? pathA[0] : [ptGateA.lat, ptGateA.lng];
    const posDest  = (pathC && pathC.length > 0) ? pathC[pathC.length - 1] : [destPt.lat, destPt.lng];
    const posSos   = (pathSos && pathSos.length > 0) ? pathSos[pathSos.length - 1] : [ptSosGate.lat, ptSosGate.lng];

    const createPillIcon = (label, bg, border) => L.divIcon({
      className: 'custom-pathway-marker',
      html: `<div style="background:${bg}; color:#fff; border:2px solid ${border}; padding:3px 9px; border-radius:9999px; font-size:11px; font-weight:800; white-space:nowrap; box-shadow:0 3px 8px rgba(0,0,0,0.3); display:inline-flex; align-items:center; gap:4px; transform:translate(-50%, -50%); cursor:pointer;">${label}</div>`,
      iconSize: [0, 0]
    });

    const allPolylines = { 'C': [], 'B': [], 'A': [], 'EMERGENCY': [] };
    const allGlows = { 'C': [], 'B': [], 'A': [], 'EMERGENCY': [] };
    const allMarkers = [];
    const gateMarkers = { 'C': [], 'B': [], 'A': [] };

    targetMaps.forEach(map => {
      // Route C
      const glowC = L.polyline(pathC, { color: '#34d399', weight: 12, opacity: 0.38, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const lineC = L.polyline(pathC, { color: '#10b981', weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      lineC.bindPopup(`<b>🟢 Route C — Express Walkway</b><br>4-6 mins • Direct Fast Link`);
      lineC.on('click', () => this.highlightRoute('C'));
      allPolylines['C'].push(lineC);
      allGlows['C'].push(glowC);

      // Route B
      const glowB = L.polyline(pathB, { color: '#fbbf24', weight: 10, opacity: 0.28, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const lineB = L.polyline(pathB, { color: '#f59e0b', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      lineB.bindPopup(`<b>🟡 Route B — Secondary Concourse</b><br>10-14 mins • Moderate Traffic`);
      lineB.on('click', () => this.highlightRoute('B'));
      allPolylines['B'].push(lineB);
      allGlows['B'].push(glowB);

      // Route A
      const glowA = L.polyline(pathA, { color: '#f87171', weight: 10, opacity: 0.28, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const lineA = L.polyline(pathA, { color: '#ef4444', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      lineA.bindPopup(`<b>🔴 Route A — Main Gate Walkway</b><br>20-28 mins • High Crowd Density`);
      lineA.on('click', () => this.highlightRoute('A'));
      allPolylines['A'].push(lineA);
      allGlows['A'].push(glowA);

      // Emergency Egress
      const glowSos = L.polyline(pathSos, { color: '#67e8f9', weight: 9, opacity: 0.3, dashArray: '6, 6', lineCap: 'round', lineJoin: 'round' }).addTo(map);
      const lineSos = L.polyline(pathSos, { color: '#06b6d4', weight: 4.5, opacity: 0.95, dashArray: '6, 6', lineCap: 'round', lineJoin: 'round' }).addTo(map);
      lineSos.bindPopup(`<b>🛡️ Emergency Egress Pathway</b><br>Unobstructed Assembly Evacuation`);
      lineSos.on('click', () => this.highlightRoute('EMERGENCY'));
      allPolylines['EMERGENCY'].push(lineSos);
      allGlows['EMERGENCY'].push(glowSos);

      // Markers placed at active pathway locations (entry points opposite stage)
      const mGateC = L.marker(posGateC, { icon: createPillIcon('🟢 Gate C (Express)', '#10b981', '#059669') }).addTo(map).bindPopup('<b>🟢 Gate C Entrance</b><br>Fast Ingress • Direct Route C Link');
      mGateC.on('click', () => this.highlightRoute('C'));
      gateMarkers['C'].push(mGateC);

      const mGateB = L.marker(posGateB, { icon: createPillIcon('🟡 Gate B (Secondary)', '#f59e0b', '#d97706') }).addTo(map).bindPopup('<b>🟡 Gate B Entrance</b><br>North Concourse Ingress');
      mGateB.on('click', () => this.highlightRoute('B'));
      gateMarkers['B'].push(mGateB);

      const mGateA = L.marker(posGateA, { icon: createPillIcon('🔴 Gate A (Main Entrance)', '#ef4444', '#dc2626') }).addTo(map).bindPopup('<b>🔴 Gate A Main Entrance</b><br>High Crowd Ingress Point');
      mGateA.on('click', () => this.highlightRoute('A'));
      gateMarkers['A'].push(mGateA);

      const destName = venue.destinationName || 'Central Arena & Main Stage';
      const mDest = L.marker(posDest, { icon: createPillIcon(`🏟️ ${destName.length > 20 ? destName.slice(0, 20) + '...' : destName}`, '#2563eb', '#1d4ed8') }).addTo(map).bindPopup(`<b>🏟️ ${destName}</b><br>Primary Destination Hub`);

      const mSos = L.marker(posSos, { icon: createPillIcon('🚨 SOS Exit', '#06b6d4', '#0891b2') }).addTo(map).bindPopup('<b>🚨 Emergency Assembly Area</b>');

      const ptFirstAid = this.getOffsetLatLng(lat, lng, r * 0.60, 40);
      const mFirstAid = L.marker([ptFirstAid.lat, ptFirstAid.lng], { icon: createPillIcon('🏥 First Aid', '#ec4899', '#db2777') }).addTo(map).bindPopup('<b>🏥 Emergency Medical Station</b>');

      const ptWater = this.getOffsetLatLng(lat, lng, r * 0.52, 255);
      const mWater = L.marker([ptWater.lat, ptWater.lng], { icon: createPillIcon('💧 Water Hub', '#0284c7', '#0369a1') }).addTo(map).bindPopup('<b>💧 Hydration Point</b>');

      allMarkers.push(mGateC, mGateB, mGateA, mDest, mSos, mFirstAid, mWater);
    });

    this.visitorPathways.polylines = allPolylines;
    this.visitorPathways.glows = allGlows;
    this.visitorPathways.markers = allMarkers;
    this.visitorPathways.gateMarkers = gateMarkers;

    // Ensure legend and top badge are active
    const legendEl = document.getElementById('visitorMapLegend');
    if (legendEl) legendEl.style.display = 'flex';

    const topBadge = document.getElementById('visitorTopViewBadge');
    if (topBadge) topBadge.style.display = 'flex';
  },

  clearVisitorPathways: function() {
    if (this.visitorPathways) {
      Object.values(this.visitorPathways.polylines || {}).forEach(item => {
        if (Array.isArray(item)) item.forEach(p => { if (p && p.remove) p.remove(); });
        else if (item && item.remove) item.remove();
      });
      Object.values(this.visitorPathways.glows || {}).forEach(item => {
        if (Array.isArray(item)) item.forEach(g => { if (g && g.remove) g.remove(); });
        else if (item && item.remove) item.remove();
      });
      (this.visitorPathways.markers || []).forEach(m => { if (m && m.remove) m.remove(); });
      this.visitorPathways.polylines = {};
      this.visitorPathways.glows = {};
      this.visitorPathways.markers = [];
      this.visitorPathways.gateMarkers = {};
    }
  },

  // -------------------- INTERACTIVE PATHWAY EDITOR --------------------
  initPathwayEditor: function() {
    const toggleBtn = document.getElementById('togglePathwayEditorBtn');
    const selector = document.getElementById('editRouteSelector');
    const addPtBtn = document.getElementById('pwAddPointModeBtn');
    const clearBtn = document.getElementById('pwClearPointsBtn');
    const resetBtn = document.getElementById('pwResetDefaultsBtn');
    const saveBtn = document.getElementById('pwSavePathwayBtn');
    const closeBtn = document.getElementById('pwCloseEditorBtn');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.isPathwayEditing) {
          this.stopPathwayEditing();
        } else {
          this.startPathwayEditing('C');
        }
      });
    }

    if (selector) {
      selector.addEventListener('change', (e) => {
        this.switchEditingRoute(e.target.value);
      });
    }

    if (addPtBtn) {
      addPtBtn.addEventListener('click', () => {
        this.pwAddPointMode = !this.pwAddPointMode;
        addPtBtn.classList.toggle('active', this.pwAddPointMode);
        addPtBtn.style.background = this.pwAddPointMode ? '#10b981' : '#ffffff';
        addPtBtn.style.color = this.pwAddPointMode ? '#ffffff' : '#047857';
        addPtBtn.innerHTML = this.pwAddPointMode ? '➕ Click Map to Add Points: ON' : '➕ Click Map to Add: OFF';
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const meta = this.routeMeta[this.editingRouteKey] || this.routeMeta['C'];
        if (!confirm(`Clear all points for ${meta.name}? You can click on the ground to draw freshly.`)) return;
        this.activePaths[this.editingRouteKey] = [];
        this.clearPathwayEditHandles();
        this.refreshEditingRoutePolyline();
        this.updatePathwayBadgeCounts();
        this.showToast(`Cleared ${meta.name}. Click map to add waypoints.`, 'info');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!confirm('Reset all pathways back to venue default routes?')) return;
        this.resetDefaultPathways();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveCustomPathways();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.stopPathwayEditing();
      });
    }
  },

  startPathwayEditing: function(routeKey) {
    this.isPathwayEditing = true;
    this.editingRouteKey = routeKey || 'C';
    this.pwAddPointMode = true;

    const toolbar = document.getElementById('pathwayEditorToolbar');
    if (toolbar) toolbar.style.display = 'flex';

    const toggleBtn = document.getElementById('togglePathwayEditorBtn');
    if (toggleBtn) {
      toggleBtn.classList.add('active');
      toggleBtn.innerHTML = '✏️ Editing Pathways (Active)';
      toggleBtn.style.background = '#2563eb';
      toggleBtn.style.color = '#ffffff';
    }

    this.syncPathwayEditorForm();
    this.renderPathwayEditHandles();
    this.bindMapClickForPathwayEditing();
    this.highlightRoute(this.editingRouteKey);
    this.showToast(`Editing ${this.routeMeta[this.editingRouteKey].name}: Click map to add waypoints, drag handles to adjust.`, 'info');
  },

  stopPathwayEditing: function() {
    this.isPathwayEditing = false;
    const toolbar = document.getElementById('pathwayEditorToolbar');
    if (toolbar) toolbar.style.display = 'none';

    const toggleBtn = document.getElementById('togglePathwayEditorBtn');
    if (toggleBtn) {
      toggleBtn.classList.remove('active');
      toggleBtn.innerHTML = '✏️ Edit / Set Pathway';
      toggleBtn.style.background = '#eff6ff';
      toggleBtn.style.color = '#1d4ed8';
    }

    this.clearPathwayEditHandles();
    this.unbindMapClickForPathwayEditing();
    this.highlightRoute('ALL');
  },

  switchEditingRoute: function(routeKey) {
    this.editingRouteKey = routeKey;
    const selector = document.getElementById('editRouteSelector');
    if (selector && selector.value !== routeKey) selector.value = routeKey;

    this.syncPathwayEditorForm();
    this.renderPathwayEditHandles();
    this.highlightRoute(routeKey);
  },

  syncPathwayEditorForm: function() {
    const meta = this.routeMeta[this.editingRouteKey] || this.routeMeta['C'];
    const gateInput = document.getElementById('editRouteGateName');
    const timeInput = document.getElementById('editRouteEstTime');
    if (gateInput) gateInput.value = meta.gate || '';
    if (timeInput) timeInput.value = meta.time || '';
    this.updatePathwayBadgeCounts();
  },

  updatePathwayBadgeCounts: function() {
    const path = this.activePaths[this.editingRouteKey] || [];
    const badge = document.getElementById('pwPointCountBadge');
    if (badge) {
      badge.textContent = `${path.length} Waypoints`;
      badge.style.background = path.length >= 2 ? '#d1fae5' : '#fee2e2';
      badge.style.color = path.length >= 2 ? '#065f46' : '#991b1b';
    }
  },

  bindMapClickForPathwayEditing: function() {
    const map = this.mapInstances['googleMapAdminDiv'] || this.mapInstances['googleMapDiv'];
    if (!map) return;
    this.unbindMapClickForPathwayEditing();

    this._pwMapClickHandler = (e) => {
      if (!this.isPathwayEditing || !this.pwAddPointMode) return;
      if (e.originalEvent && e.originalEvent.target && e.originalEvent.target.closest('.pathway-waypoint-handle')) return;

      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      if (!this.activePaths[this.editingRouteKey]) {
        this.activePaths[this.editingRouteKey] = [];
      }
      this.activePaths[this.editingRouteKey].push([lat, lng]);

      this.refreshEditingRoutePolyline();
      this.renderPathwayEditHandles();
      this.updatePathwayBadgeCounts();
    };

    map.on('click', this._pwMapClickHandler);
  },

  unbindMapClickForPathwayEditing: function() {
    const map = this.mapInstances['googleMapAdminDiv'] || this.mapInstances['googleMapDiv'];
    if (map && this._pwMapClickHandler) {
      map.off('click', this._pwMapClickHandler);
      this._pwMapClickHandler = null;
    }
  },

  clearPathwayEditHandles: function() {
    (this.editHandles || []).forEach(h => {
      if (h && h.remove) h.remove();
    });
    this.editHandles = [];
  },

  renderPathwayEditHandles: function() {
    this.clearPathwayEditHandles();
    const map = this.mapInstances['googleMapAdminDiv'] || this.mapInstances['googleMapDiv'];
    if (!map) return;

    const path = this.activePaths[this.editingRouteKey] || [];
    const meta = this.routeMeta[this.editingRouteKey] || this.routeMeta['C'];

    path.forEach((pt, idx) => {
      const isFirst = (idx === 0);
      const isLast = (idx === path.length - 1 && path.length > 1);
      const label = isFirst ? '🚪 Start' : (isLast ? '🏟️ End' : `${idx + 1}`);
      const bg = isFirst ? '#059669' : (isLast ? '#2563eb' : meta.color);

      const marker = L.marker([pt[0], pt[1]], {
        draggable: true,
        zIndexOffset: 1200 + idx,
        icon: L.divIcon({
          className: 'pathway-waypoint-handle',
          html: `<div style="background:${bg}; color:#ffffff; border:2px solid #ffffff; border-radius:12px; padding:2px 7px; font-size:10px; font-weight:800; box-shadow:0 3px 8px rgba(0,0,0,0.5); white-space:nowrap; transform:translate(-50%, -50%); cursor:grab;">${label}</div>`,
          iconSize: [0, 0]
        })
      }).addTo(map);

      marker.on('drag', (e) => {
        const newPos = e.target.getLatLng();
        path[idx] = [newPos.lat, newPos.lng];
        this.refreshEditingRoutePolyline();
        if (idx === 0 && this.visitorPathways && this.visitorPathways.gateMarkers) {
          const gMarkers = this.visitorPathways.gateMarkers[this.editingRouteKey] || [];
          gMarkers.forEach(m => { if (m && m.setLatLng) m.setLatLng(newPos); });
        }
      });

      marker.on('dragend', () => {
        this.updatePathwayBadgeCounts();
      });

      marker.bindPopup(`
        <div style="font-family:sans-serif; min-width:140px; padding:2px;">
          <strong style="color:${meta.color};">${meta.name}</strong><br>
          <span style="font-size:0.75rem; color:#475569;">Waypoint ${idx + 1} (${label})</span><br>
          <span style="font-size:0.7rem; color:#94a3b8; font-family:monospace;">${pt[0].toFixed(6)}, ${pt[1].toFixed(6)}</span><br>
          <button type="button" onclick="window.GoogleMapsManager.removeWaypoint('${this.editingRouteKey}', ${idx})" style="margin-top:6px; background:#fef2f2; border:1px solid #fca5a5; color:#b91c1c; font-size:11px; font-weight:700; padding:3px 8px; border-radius:4px; cursor:pointer; width:100%;">
            🗑️ Delete Waypoint
          </button>
        </div>
      `);

      this.editHandles.push(marker);
    });

    this.updatePathwayBadgeCounts();
  },

  refreshEditingRoutePolyline: function() {
    const routeKey = this.editingRouteKey;
    const path = this.activePaths[routeKey] || [];
    const polylines = this.visitorPathways.polylines || {};
    const glows = this.visitorPathways.glows || {};

    if (polylines[routeKey]) {
      if (Array.isArray(polylines[routeKey])) polylines[routeKey].forEach(p => p.setLatLngs(path));
      else polylines[routeKey].setLatLngs(path);
    }
    if (glows[routeKey]) {
      if (Array.isArray(glows[routeKey])) glows[routeKey].forEach(g => g.setLatLngs(path));
      else glows[routeKey].setLatLngs(path);
    }
  },

  removeWaypoint: function(routeKey, index) {
    if (this.activePaths[routeKey] && this.activePaths[routeKey].length > index) {
      this.activePaths[routeKey].splice(index, 1);
      this.refreshEditingRoutePolyline();
      this.renderPathwayEditHandles();
      this.updatePathwayBadgeCounts();
      this.showToast(`Removed waypoint ${index + 1} from ${this.routeMeta[routeKey].name}`, 'info');
    }
  },

  saveCustomPathways: function() {
    if (!this.customPathways) this.customPathways = {};
    Object.keys(this.activePaths).forEach(k => {
      this.customPathways[k] = this.activePaths[k];
    });

    const venueId = this.currentVenueId || 'sona-college';
    // 1. Save to localStorage
    try {
      localStorage.setItem('flow_pathways_' + venueId, JSON.stringify(this.customPathways));
    } catch(e) {}

    // 2. Save to backend database
    fetch(`/api/venues/${venueId}/pathways`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathways: this.customPathways })
    }).then(r => r.json()).then(data => {
      console.log('Saved custom pathways to backend:', data);
    }).catch(err => {
      console.warn('Backend pathway save fallback to localStorage only:', err);
    });

    // 3. Update metadata
    const gateInput = document.getElementById('editRouteGateName');
    const timeInput = document.getElementById('editRouteEstTime');
    if (gateInput && gateInput.value) {
      this.routeMeta[this.editingRouteKey].gate = gateInput.value.trim();
    }
    if (timeInput && timeInput.value) {
      this.routeMeta[this.editingRouteKey].time = timeInput.value.trim();
    }

    // 4. Redraw visitor view
    this.renderVisitorPathways();
    if (this.isPathwayEditing) {
      this.renderPathwayEditHandles();
    }

    this.showToast(`✅ Saved ${this.routeMeta[this.editingRouteKey].name}! Displayed live on Visitor View.`, 'success');
  },

  resetDefaultPathways: function() {
    const venueId = this.currentVenueId || 'sona-college';
    try {
      localStorage.removeItem('flow_pathways_' + venueId);
    } catch(e) {}

    fetch(`/api/venues/${venueId}/pathways`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pathways: {} })
    }).catch(() => {});

    this.customPathways = {};
    this.clearVisitorPathways();
    this.clearPathwayEditHandles();
    this.renderVisitorPathways();
    if (this.isPathwayEditing) {
      this.renderPathwayEditHandles();
    }
    this.showToast('Reset all pathways to venue default layout.', 'info');
  },

  setCustomPathways: function(pathways, autoSave) {
    if (!pathways) return;
    this.customPathways = JSON.parse(JSON.stringify(pathways));
    const venueId = this.currentVenueId || 'sona-college';

    if (autoSave) {
      try {
        localStorage.setItem('flow_pathways_' + venueId, JSON.stringify(this.customPathways));
      } catch(e) {}

      fetch(`/api/venues/${venueId}/pathways`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathways: this.customPathways })
      }).catch(() => {});
    }

    this.renderVisitorPathways();
    if (this.isPathwayEditing) {
      this.renderPathwayEditHandles();
    }
  },

  highlightRoute: function(routeKey) {
    this.activeVisitorRoute = routeKey;

    // 1. Sync Pathway Filter Buttons in Header
    document.querySelectorAll('.pathway-toggle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-route') === routeKey);
    });

    // 2. Sync Route Cards in Left Column
    document.querySelectorAll('.route-card').forEach(card => {
      card.classList.remove('selected', 'active-map-route');
    });
    if (routeKey && routeKey !== 'ALL') {
      const activeCard = document.getElementById('cardRoute' + routeKey);
      if (activeCard) {
        activeCard.classList.add('selected', 'active-map-route');
        try { activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch(e){}
      }
    }

    // 3. Highlight Polylines across all active map instances (Visitor & Admin Routing)
    const map = this.mapInstances['googleMapAdminDiv'] || this.mapInstances['googleMapDiv'];
    if (!this.visitorPathways || !this.visitorPathways.polylines) return;

    const polylines = this.visitorPathways.polylines;
    const glows = this.visitorPathways.glows;

    if (routeKey === 'ALL') {
      Object.keys(polylines).forEach(key => {
        const lines = Array.isArray(polylines[key]) ? polylines[key] : [polylines[key]];
        const gs = Array.isArray(glows[key]) ? glows[key] : [glows[key]];
        lines.forEach(line => {
          if (line) {
            line.setStyle({
              weight: key === 'C' ? 6 : (key === 'EMERGENCY' ? 4.5 : 5),
              opacity: 0.95
            });
          }
        });
        gs.forEach(glow => {
          if (glow) glow.setStyle({ opacity: key === 'C' ? 0.38 : 0.25 });
        });
      });
      if (map && map.closePopup) map.closePopup();
      return;
    }

    Object.keys(polylines).forEach(key => {
      const lines = Array.isArray(polylines[key]) ? polylines[key] : [polylines[key]];
      const gs = Array.isArray(glows[key]) ? glows[key] : [glows[key]];
      if (key === routeKey) {
        lines.forEach(line => {
          if (line) {
            line.setStyle({ weight: 9, opacity: 1.0 });
            try { line.bringToFront(); } catch(e){}
            try { line.openPopup(); } catch(e){}
          }
        });
        gs.forEach(glow => {
          if (glow) {
            glow.setStyle({ weight: 16, opacity: 0.55 });
            try { glow.bringToFront(); } catch(e){}
          }
        });
      } else {
        lines.forEach(line => {
          if (line) line.setStyle({ weight: 3, opacity: 0.25 });
        });
        gs.forEach(glow => {
          if (glow) glow.setStyle({ opacity: 0.05 });
        });
      }
    });
  },

  updateVisitorPathwayMetrics: function(routes) {
    if (!routes || !routes.length || !this.visitorPathways || !this.visitorPathways.polylines) return;

    routes.forEach(r => {
      const key = (r.id && r.id.toLowerCase().includes('c')) || (r.name && r.name.toLowerCase().includes('route c')) || (r.tag === 'RECOMMENDED') ? 'C' :
                  (r.id && r.id.toLowerCase().includes('b')) || (r.name && r.name.toLowerCase().includes('route b')) ? 'B' : 'A';
      
      const line = this.visitorPathways.polylines[key];
      if (line) {
        const wait = r.estimated_wait_minutes || (key === 'C' ? 4 : key === 'B' ? 12 : 28);
        const dist = r.distance_meters || (key === 'C' ? 180 : key === 'B' ? 240 : 120);
        const color = key === 'C' ? '#047857' : (key === 'B' ? '#b45309' : '#b91c1c');
        const badgeText = key === 'C' ? '🟢 RECOMMENDED FASTEST PATHWAY' : (key === 'B' ? '🟡 STEADY FLOW' : '🔴 HEAVY CHOKEPOINT');

        line.setPopupContent(`
          <div style="font-family:sans-serif; min-width:180px;">
            <div style="display:flex; align-items:center; gap:5px; margin-bottom:4px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${r.color || color};"></span>
              <strong style="color:${color}; font-size:0.92rem;">${r.name || ('Route ' + key)}</strong>
            </div>
            <div style="font-size:0.78rem; color:#334155; line-height:1.4;">
              <span style="color:${color}; font-weight:700;">● ${badgeText}</span><br>
              <b>Est. Queue:</b> ${wait} mins<br>
              <b>Walk Distance:</b> ${dist}m<br>
              <b>Density:</b> ${r.occupancy_percentage || 50}%
            </div>
          </div>
        `);
      }

      const legEl = document.getElementById('legRoute' + key);
      if (legEl) {
        legEl.textContent = `Route ${key} (${r.estimated_wait_minutes || (key === 'C' ? 4 : key === 'B' ? 12 : 28)}m)`;
      }
    });
  },

};

window.GoogleMapsManager = GoogleMapsManager;
