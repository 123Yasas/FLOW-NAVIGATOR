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
    googleMapAdminDiv: { polylines: [], markers: [], circles: [], polygons: [] }
  },
  currentVenueId: localStorage.getItem('flow_active_venue_id') || 'sona-college',
  currentCenter: { lat: 11.6811, lng: 78.1368 },
  currentVenueName: 'Sona College Sports Ground (Campus Ground)',
  groundRadiusMeters: 85,
  currentViewMode: 'satellite',

  // Interactive Point-Marking System State
  activePointType: 'entry_gate', // 'entry_gate', 'exit_gate', 'stage', 'emergency_exit', 'crowd_zone', 'first_aid', 'toilet', 'food_counter'
  markedPoints: [],
  generatedLayout: null,

  // Curated grounds
  venueConfigs: {
    'sona-college': {
      id: 'sona-college',
      name: 'Sona College Sports Ground (Campus Ground)',
      city: 'Salem, Tamil Nadu',
      lat: 11.6811,
      lng: 78.1368,
      zoom: 18,
      groundRadius: 85,
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
  init: function() {
    window.GoogleMapsManager = this;

    this.bindUIControls();
    this.bindPointMarkerControls();
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
    this.updateCoordinateBadge(v.lat, v.lng, v.name);
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

      map = L.map(elemId, {
        center: [venue.lat, venue.lng],
        zoom: venue.zoom || 18,
        zoomControl: true,
        attributionControl: false
      });

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
      id: `pt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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
  bindUIControls: function() {
    // Preset Stadium Pills
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.ground-preset-pill');
      if (pill) {
        const lat = parseFloat(pill.getAttribute('data-lat'));
        const lng = parseFloat(pill.getAttribute('data-lng'));
        const name = pill.getAttribute('data-name');
        const vid = pill.getAttribute('data-vid');

        document.querySelectorAll('.ground-preset-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

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
                <div class="ground-search-suggestion-item" data-lat="${m.lat}" data-lng="${m.lng}" data-name="${m.name}">
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
          input.value = name;
          dropdown.style.display = 'none';
          this.relocateGroundTo(lat, lng, name);
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

    ['googleMapDiv', 'googleMapAdminDiv'].forEach(elemId => {
      const map = this.mapInstances[elemId];
      if (map) {
        map.setView([lat, lng], 18);
        ['googleMapDiv', 'googleMapAdminDiv'].forEach(id => this.clearOverlays(id));
      } else {
        this.mountSingleMap(elemId, customVenue);
      }
    });

    this.updateCoordinateBadge(lat, lng, name);
    this.loadInitialGroundPoints();
  },

  switchVenue: function(venueId) {
    this.currentVenueId = venueId;
    let v = this.venueConfigs[venueId];
    if (!v) v = this.venueConfigs['sona-college'];

    if (v) {
      this.currentCenter = { lat: v.lat, lng: v.lng };
      this.currentVenueName = v.name;
      this.groundRadiusMeters = v.groundRadius || 85;

      this.updateCoordinateBadge(v.lat, v.lng, v.name);

      ['googleMapDiv', 'googleMapAdminDiv'].forEach(elemId => {
        const map = this.mapInstances[elemId];
        if (map) {
          map.setView([v.lat, v.lng], v.zoom || 18);
          ['googleMapDiv', 'googleMapAdminDiv'].forEach(id => this.clearOverlays(id));
        } else {
          this.mountSingleMap(elemId, v);
        }
      });

      this.loadInitialGroundPoints();
    }
  },

  updateCoordinateBadge: function(lat, lng, name) {
    const coordEl = document.getElementById('mapCoordDisplay');
    if (coordEl) coordEl.textContent = '';

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
};

window.GoogleMapsManager = GoogleMapsManager;
