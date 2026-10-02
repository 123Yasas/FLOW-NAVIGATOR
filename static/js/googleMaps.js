/**
 * FlowNavigator - Google Maps Platform & Venue Spatial Navigator
 * Features:
 * - Real Google Maps JS API dynamic integration
 * - Distinct, venue-specific layouts & pathways for all 4 venues:
 *   1. Palani Pilgrimage Grounds (Hilltop steps, Ropeway, Valley parking)
 *   2. Meenakshi Temple Complex (4 Gopuram towers, concentric concentric corridors, Lotus Tank)
 *   3. Jawaharlal Nehru Stadium (Oval track, grandstand bays, turnstiles)
 *   4. Central Metro & Rail Junction (Platform decks, escalator funnels, concourse)
 * - Color-coded crowd flow lines (Green: Recommended, Yellow: Moderate, Red: Chokepoint)
 */

const GoogleMapsManager = {
  apiKey: '',
  isLoaded: false,
  mapInstances: {},
  currentVenueId: 'palani-gathering',

  venueConfigs: {
    'palani-gathering': {
      name: 'Palani Pilgrimage Grounds',
      city: 'Palani, Tamil Nadu',
      lat: 10.4534,
      lng: 77.5186,
      zoom: 17,
      zones: [
        { id: 'zone-a', name: 'Zone A: Foothill Plaza', lat: 10.4528, lng: 77.5178, color: '#10b981', count: 245 },
        { id: 'zone-b', name: 'Zone B: Bazaar Arcade', lat: 10.4532, lng: 77.5182, color: '#f59e0b', count: 650 },
        { id: 'zone-c', name: 'Zone C: Hilltop Sanctum', lat: 10.4542, lng: 77.5192, color: '#ef4444', count: 780 },
        { id: 'zone-d', name: 'Zone D: South Bypass', lat: 10.4530, lng: 77.5190, color: '#10b981', count: 310 },
        { id: 'zone-f', name: 'Zone F: Vehicle Parking', lat: 10.4520, lng: 77.5165, color: '#10b981', count: 820 },
        { id: 'zone-h', name: 'Zone H: Steps & Ropeway', lat: 10.4550, lng: 77.5195, color: '#ef4444', count: 880 }
      ]
    },
    'meenakshi-temple': {
      name: 'Meenakshi Temple Complex',
      city: 'Madurai, Tamil Nadu',
      lat: 9.9195,
      lng: 78.1193,
      zoom: 17,
      zones: [
        { id: 'zone-a', name: 'East Gopuram Entrance Gate', lat: 9.9190, lng: 78.1185, color: '#10b981', count: 410 },
        { id: 'zone-b', name: 'South Chitra Walkway', lat: 9.9192, lng: 78.1190, color: '#f59e0b', count: 720 },
        { id: 'zone-c', name: 'Inner Sanctum Chokepoint', lat: 9.9202, lng: 78.1200, color: '#ef4444', count: 850 },
        { id: 'zone-d', name: 'Thousand Pillar Hall', lat: 9.9198, lng: 78.1196, color: '#10b981', count: 330 },
        { id: 'zone-f', name: 'West Tower Parking Bay', lat: 9.9185, lng: 78.1175, color: '#10b981', count: 590 }
      ]
    },
    'chennai-stadium': {
      name: 'Jawaharlal Nehru Stadium Complex',
      city: 'Chennai',
      lat: 13.0827,
      lng: 80.2707,
      zoom: 17,
      zones: [
        { id: 'zone-a', name: 'North Turnstiles Gate 1', lat: 13.0822, lng: 80.2698, color: '#10b981', count: 620 },
        { id: 'zone-b', name: 'Concourse Ring Walkway', lat: 13.0825, lng: 80.2703, color: '#f59e0b', count: 840 },
        { id: 'zone-c', name: 'VIP & Players Tunnel Gate', lat: 13.0833, lng: 80.2713, color: '#ef4444', count: 910 },
        { id: 'zone-d', name: 'Grandstand Lower Tier', lat: 13.0828, lng: 80.2708, color: '#10b981', count: 450 },
        { id: 'zone-f', name: 'East Grounds Parking Area', lat: 13.0815, lng: 80.2688, color: '#10b981', count: 710 }
      ]
    },
    'central-transit-hub': {
      name: 'Central Metro & Rail Junction Hub',
      city: 'Central Hub',
      lat: 13.0837,
      lng: 80.2755,
      zoom: 17,
      zones: [
        { id: 'zone-a', name: 'Main Concourse Turnstiles', lat: 13.0832, lng: 80.2748, color: '#10b981', count: 380 },
        { id: 'zone-b', name: 'Platform 1/2 Long-Haul Track', lat: 13.0835, lng: 80.2752, color: '#f59e0b', count: 690 },
        { id: 'zone-c', name: 'Escalator Interchange Tube', lat: 13.0842, lng: 80.2760, color: '#ef4444', count: 890 },
        { id: 'zone-d', name: 'Suburban Line Skywalk', lat: 13.0838, lng: 80.2756, color: '#10b981', count: 290 },
        { id: 'zone-f', name: 'Bus Terminal Egress Bay', lat: 13.0825, lng: 80.2740, color: '#10b981', count: 540 }
      ]
    }
  },

  init: async function() {
    try {
      const resp = await fetch('/api/maps/config');
      const data = await resp.json();
      this.apiKey = localStorage.getItem('flow_google_maps_key') || data.google_maps_api_key || '';
      
      if (this.apiKey && this.apiKey !== 'MY_GOOGLE_MAPS_API_KEY') {
        this.loadGoogleMapsScript(this.apiKey);
      } else {
        this.renderVenueSchematic('googleMapDiv', this.currentVenueId);
        this.renderVenueSchematic('googleMapAdminDiv', this.currentVenueId);
      }
    } catch (e) {
      this.renderVenueSchematic('googleMapDiv', this.currentVenueId);
      this.renderVenueSchematic('googleMapAdminDiv', this.currentVenueId);
    }
  },

  loadGoogleMapsScript: function(key) {
    if (window.google && window.google.maps) {
      this.isLoaded = true;
      this.mountMaps();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=visualization&callback=GoogleMapsManager.onMapsLoaded`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      this.renderVenueSchematic('googleMapDiv', this.currentVenueId);
      this.renderVenueSchematic('googleMapAdminDiv', this.currentVenueId);
    };
    window.GoogleMapsManager = this;
    document.head.appendChild(script);
  },

  onMapsLoaded: function() {
    this.isLoaded = true;
    this.mountMaps();
  },

  mountMaps: function() {
    const venue = this.venueConfigs[this.currentVenueId] || this.venueConfigs['palani-gathering'];
    this.mountSingleMap('googleMapDiv', venue);
    this.mountSingleMap('googleMapAdminDiv', venue);
  },

  mountSingleMap: function(elemId, venue) {
    const el = document.getElementById(elemId);
    if (!el) return;

    if (!window.google || !window.google.maps) {
      this.renderVenueSchematic(elemId, this.currentVenueId);
      return;
    }

    const darkStyle = [
      { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#090d16' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0284c7' }] }
    ];

    const map = new google.maps.Map(el, {
      center: { lat: venue.lat, lng: venue.lng },
      zoom: venue.zoom,
      styles: darkStyle,
      disableDefaultUI: false,
      zoomControl: true
    });

    this.mapInstances[elemId] = map;

    // Draw venue markers
    venue.zones.forEach(z => {
      new google.maps.Circle({
        strokeColor: z.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: z.color,
        fillOpacity: 0.25,
        map: map,
        center: { lat: z.lat, lng: z.lng },
        radius: 35
      });

      new google.maps.Marker({
        position: { lat: z.lat, lng: z.lng },
        map: map,
        title: `${z.name} (${z.count} people)`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: z.color,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff'
        }
      });
    });

    // Draw route polylines
    if (venue.zones.length >= 3) {
      // Route C (Green recommended)
      new google.maps.Polyline({
        path: [
          { lat: venue.zones[0].lat, lng: venue.zones[0].lng },
          { lat: venue.zones[3].lat, lng: venue.zones[3].lng },
          { lat: venue.zones[2].lat, lng: venue.zones[2].lng }
        ],
        strokeColor: '#10b981',
        strokeOpacity: 1.0,
        strokeWeight: 6,
        map: map
      });

      // Route A (Red bottleneck)
      new google.maps.Polyline({
        path: [
          { lat: venue.zones[0].lat, lng: venue.zones[0].lng },
          { lat: venue.zones[1].lat, lng: venue.zones[1].lng },
          { lat: venue.zones[2].lat, lng: venue.zones[2].lng }
        ],
        strokeColor: '#ef4444',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map: map
      });
    }
  },

  /**
   * Venue-Specific Architectural Visual Schematics
   * Each venue has its own distinct layout, buildings, pathways, and geometry!
   */
  renderVenueSchematic: function(elemId, venueId) {
    const el = document.getElementById(elemId);
    if (!el) return;

    const v = this.venueConfigs[venueId] || this.venueConfigs['palani-gathering'];
    let svgContent = '';

    if (venueId === 'meenakshi-temple') {
      // Meenakshi Temple: Quadrangle concentric fortress layout with 4 Gopurams & Golden Lotus Tank
      svgContent = `
        <!-- Meenakshi Temple Outer Quadrilateral Walls -->
        <rect x="120" y="50" width="560" height="400" rx="6" fill="rgba(15, 23, 42, 0.6)" stroke="#3b82f6" stroke-width="2" stroke-dasharray="6,4"/>
        <rect x="200" y="110" width="400" height="280" rx="4" fill="rgba(30, 41, 59, 0.5)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>

        <!-- 4 Iconic Gopuram Towers -->
        <rect x="360" y="38" width="80" height="24" rx="3" fill="#f59e0b" stroke="#fff" stroke-width="1.5"/>
        <text x="375" y="54" fill="#000" font-size="10" font-weight="900">NORTH TOWER</text>

        <rect x="360" y="438" width="80" height="24" rx="3" fill="#10b981" stroke="#fff" stroke-width="1.5"/>
        <text x="378" y="454" fill="#000" font-size="10" font-weight="900">SOUTH TOWER</text>

        <rect x="108" y="210" width="24" height="80" rx="3" fill="#10b981" stroke="#fff" stroke-width="1.5"/>
        <text x="114" y="255" fill="#000" font-size="9" font-weight="900" transform="rotate(-90 120 250)">EAST MAIN GATE</text>

        <rect x="668" y="210" width="24" height="80" rx="3" fill="#3b82f6" stroke="#fff" stroke-width="1.5"/>
        <text x="674" y="255" fill="#000" font-size="9" font-weight="900" transform="rotate(90 680 250)">WEST TOWER</text>

        <!-- Golden Lotus Tank (Teppakulam) -->
        <rect x="230" y="270" width="130" height="90" rx="4" fill="rgba(2, 132, 199, 0.25)" stroke="#0284c7" stroke-width="2"/>
        <text x="245" y="320" fill="#38bdf8" font-size="11" font-weight="bold">Golden Lotus Tank</text>

        <!-- Route A (Choked Corridor to Sanctum) -->
        <path d="M 140,250 L 280,210 L 440,190" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
        <text x="240" y="195" fill="#ef4444" font-size="10" font-weight="bold">Direct Corridor: 850 ppl (CHOKED)</text>

        <!-- Route C (Recommended Express Bypass via South Corridor) -->
        <path d="M 140,250 L 220,380 L 480,380 L 520,240 L 440,190" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round"/>
        <text x="270" y="405" fill="#10b981" font-size="11" font-weight="bold">✔ RECOMMENDED: SOUTH CHITRA CORRIDOR (6m WAIT)</text>

        <!-- Inner Sanctum -->
        <g transform="translate(440, 190)">
          <circle r="30" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="3"/>
          <circle r="10" fill="#ef4444"/>
          <text x="36" y="5" fill="#ef4444" font-size="12" font-weight="bold">Main Sanctum Sanctorum</text>
          <text x="36" y="20" fill="#fca5a5" font-size="10">850 / 800 (106% CRITICAL)</text>
        </g>
      `;
    } else if (venueId === 'chennai-stadium') {
      // Nehru Stadium: Oval track, football pitch, concentric concourses, turnstiles
      svgContent = `
        <!-- Stadium Outer Perimeter Ring -->
        <ellipse cx="400" cy="250" rx="340" ry="180" fill="rgba(15, 23, 42, 0.7)" stroke="#3b82f6" stroke-width="2"/>
        <ellipse cx="400" cy="250" rx="270" ry="135" fill="rgba(30, 41, 59, 0.5)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>

        <!-- Running Track & Central Football Pitch -->
        <ellipse cx="400" cy="250" rx="180" ry="85" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" stroke-width="2"/>
        <rect x="310" y="205" width="180" height="90" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="1.5"/>
        <circle cx="400" cy="250" r="25" fill="none" stroke="#fff" stroke-width="1"/>
        <text x="365" y="254" fill="#a7f3d0" font-size="11" font-weight="bold">CENTRAL PITCH</text>

        <!-- North Gate 1 Turnstiles -->
        <g transform="translate(160, 250)">
          <circle r="22" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="2"/>
          <circle r="8" fill="#10b981"/>
          <text x="-50" y="-30" fill="#fff" font-size="11" font-weight="bold">North Gate 1 Turnstiles</text>
        </g>

        <!-- Player / VIP Tunnel Chokepoint -->
        <g transform="translate(400, 115)">
          <circle r="24" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" stroke-width="2.5"/>
          <circle r="9" fill="#ef4444"/>
          <text x="30" y="5" fill="#ef4444" font-size="11" font-weight="bold">VIP & Grandstand Tunnel Gate</text>
        </g>

        <!-- Recommended Egress Lane (Green) -->
        <path d="M 160,250 C 220,360 480,360 620,250" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round"/>
        <text x="270" y="385" fill="#10b981" font-size="11" font-weight="bold">✔ RECOMMENDED: SOUTH CONCOURSE PROMENADE (4m)</text>

        <!-- Direct Choked Tunnel Route (Red) -->
        <path d="M 160,250 C 240,150 340,120 400,115" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
        <text x="230" y="150" fill="#ef4444" font-size="10" font-weight="bold">VIP Tunnel: High Density (28m Delay)</text>
      `;
    } else if (venueId === 'central-transit-hub') {
      // Central Metro: Multi-track platforms, concourse mezzanine, escalator tubes
      svgContent = `
        <!-- Train Station Platforms (Parallel Tracks) -->
        <rect x="80" y="90" width="640" height="25" rx="3" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="95" y="106" fill="#94a3b8" font-size="10" font-weight="bold">PLATFORM 1: INTERCITY EXPRESS</text>

        <rect x="80" y="150" width="640" height="25" rx="3" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="95" y="166" fill="#94a3b8" font-size="10" font-weight="bold">PLATFORM 2: REGIONAL FAST LINE</text>

        <rect x="80" y="350" width="640" height="25" rx="3" fill="#1e293b" stroke="#334155" stroke-width="1"/>
        <text x="95" y="366" fill="#94a3b8" font-size="10" font-weight="bold">PLATFORM 3: SUBURBAN METRO CONNECTOR</text>

        <!-- Central Concourse & Ticket Turnstiles -->
        <rect x="140" y="210" width="180" height="100" rx="8" fill="rgba(30, 41, 59, 0.7)" stroke="#10b981" stroke-width="2"/>
        <text x="160" y="250" fill="#fff" font-size="12" font-weight="bold">Main Concourse</text>
        <text x="160" y="270" fill="#10b981" font-size="10">Automated Fare Gates</text>

        <!-- Escalator Interchange Tube (Chokepoint) -->
        <g transform="translate(540, 240)">
          <rect x="-60" y="-30" width="120" height="60" rx="6" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" stroke-width="2.5"/>
          <text x="-48" y="-5" fill="#ef4444" font-size="11" font-weight="bold">Escalator Tube</text>
          <text x="-48" y="12" fill="#fca5a5" font-size="9">Transfer Bottleneck (890 ppl)</text>
        </g>

        <!-- Route A (Choked Escalator) -->
        <path d="M 320,260 L 480,240" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/>
        <text x="350" y="235" fill="#ef4444" font-size="10" font-weight="bold">Escalator Funnel (Choked)</text>

        <!-- Route C (Recommended Skywalk Bypass) -->
        <path d="M 230,310 L 230,410 L 540,410 L 540,300" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round"/>
        <text x="280" y="430" fill="#10b981" font-size="11" font-weight="bold">✔ RECOMMENDED: SOUTH SKYWALK DECK (3m WAIT)</text>
      `;
    } else {
      // Palani Gathering: Hilltop temple steps, ropeway, foothill plaza, bypass ramp
      svgContent = `
        <!-- Hillside elevation lines -->
        <path d="M 40,400 Q 400,280 760,400" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
        <path d="M 80,320 Q 400,180 720,320" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>

        <!-- Route A (Direct Staircase - Choked) -->
        <path d="M 120,380 L 320,240 L 520,120" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round" opacity="0.85"/>
        <text x="280" y="270" fill="#ef4444" font-size="11" font-weight="bold">ROUTE A: DIRECT STAIRCASE (92% CHOKED)</text>

        <!-- Route B (West Arcade Corridor) -->
        <path d="M 120,380 L 260,160 L 520,120" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" opacity="0.8" stroke-dasharray="4,4"/>
        <text x="180" y="190" fill="#f59e0b" font-size="11" font-weight="bold">ROUTE B: WEST ARCADE (15m)</text>

        <!-- Route C (North Express Lane - RECOMMENDED FAST PATH) -->
        <path d="M 120,380 L 380,410 L 640,320 L 520,120" fill="none" stroke="#10b981" stroke-width="7" stroke-linecap="round"/>
        <text x="350" y="435" fill="#10b981" font-size="12" font-weight="bold">✔ RECOMMENDED: ROUTE C (EXPRESS BYPASS - 6m WAIT)</text>

        <!-- Ropeway Cable Line (Zone H) -->
        <line x1="120" y1="380" x2="680" y2="100" stroke="#06b6d4" stroke-width="3" stroke-dasharray="8,6"/>
        <text x="560" y="105" fill="#38bdf8" font-size="10" font-weight="bold">HILLTOP ROPEWAY (880 ppl)</text>

        <!-- Zone A: Entrance Plaza -->
        <g transform="translate(120, 380)">
          <circle r="24" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="2"/>
          <circle r="8" fill="#10b981"/>
          <text x="32" y="5" fill="#fff" font-size="12" font-weight="bold">Zone A (Entrance)</text>
          <text x="32" y="20" fill="#94a3b8" font-size="10">245 people</text>
        </g>

        <!-- Zone C: Hilltop Sanctum -->
        <g transform="translate(520, 120)">
          <circle r="28" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" stroke-width="2.5"/>
          <circle r="9" fill="#ef4444"/>
          <text x="35" y="5" fill="#ef4444" font-size="13" font-weight="bold">Zone C: Hilltop Sanctum</text>
          <text x="35" y="22" fill="#fca5a5" font-size="10">780 / 800 (97.5% CRITICAL)</text>
        </g>
      `;
    }

    el.innerHTML = `
      <div class="vector-map-canvas" style="display:flex; flex-direction:column; justify-content:space-between; padding:1.5rem; position:relative;">
        <svg viewBox="0 0 800 500" style="width:100%; height:100%; position:absolute; inset:0;" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          ${svgContent}
        </svg>

        <!-- Dynamic Label Overlay -->
        <div style="position:relative; z-index:5; pointer-events:none; display:flex; justify-content:space-between; align-items:flex-start;">
          <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:0.5rem 0.85rem; border-radius:8px; border:1px solid rgba(255,255,255,0.1);">
            <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">ACTIVE VENUE MAP</div>
            <div style="font-size:0.95rem; font-weight:800; color:#fff;">${v.name} (${v.city})</div>
          </div>
          <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:0.4rem 0.75rem; border-radius:8px; border:1px solid rgba(16,185,129,0.3); font-size:0.75rem; color:#10b981; font-weight:700;">
            ● Live Flow Overlay
          </div>
        </div>
      </div>
    `;
  },

  switchVenue: function(venueId) {
    this.currentVenueId = venueId;
    const v = this.venueConfigs[venueId];
    if (v) {
      const coordEl = document.getElementById('mapCoordDisplay');
      if (coordEl) coordEl.textContent = `${v.lat.toFixed(4)}° N, ${v.lng.toFixed(4)}° E`;

      const titleEl = document.getElementById('adminMapHeaderTitle');
      if (titleEl) titleEl.textContent = `${v.name} - Spatial Flow Layout`;

      const badgeEl = document.getElementById('currentVenueNameBadge');
      if (badgeEl) badgeEl.textContent = v.name;

      if (this.isLoaded && window.google) {
        this.mountSingleMap('googleMapDiv', v);
        this.mountSingleMap('googleMapAdminDiv', v);
      } else {
        this.renderVenueSchematic('googleMapDiv', venueId);
        this.renderVenueSchematic('googleMapAdminDiv', venueId);
      }
    }
  }
};

window.GoogleMapsManager = GoogleMapsManager;
