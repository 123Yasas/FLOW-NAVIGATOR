/**
 * FlowNavigator - Architectural CAD Floor Plan & Barricade Generator
 * Generates dynamic, scalable CAD blueprints matching NFPA 101 crowd safety standards.
 * Dynamically recomputes barricade compartments (4, 10, 20, 32 boxes),
 * scales perimeter & access roads, and positions dedicated facility blocks (Food Court, Medical, Water, Security).
 */

const CadPlanner = {
  state: {
    unit: 'm', // 'm' or 'ft'
    length: 300,
    width: 190,
    expectedCrowd: 12000,
    foodCourtEnabled: true,
    medicalEnabled: true,
    waterEnabled: true,
    securityHubEnabled: true,
    sideStageEnabled: true,
    sanitationEnabled: true,
    
    // Layers
    showDimensions: true,
    showBarricades: true,
    showFlowArrows: true,
    showAmenities: true,

    // Pan & Zoom
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,

    selectedElement: null
  },

  init: function() {
    this.bindControls();
    this.bindPanZoom();
    this.render();
  },

  bindControls: function() {
    // Inputs
    const lenInput = document.getElementById('cadInputLength');
    const widInput = document.getElementById('cadInputWidth');
    const crowdInput = document.getElementById('cadInputCrowd');
    const unitSelect = document.getElementById('cadUnitSelect');

    if (lenInput) {
      lenInput.addEventListener('input', (e) => {
        this.state.length = Math.max(50, parseInt(e.target.value) || 300);
        this.render();
      });
    }

    if (widInput) {
      widInput.addEventListener('input', (e) => {
        this.state.width = Math.max(30, parseInt(e.target.value) || 190);
        this.render();
      });
    }

    if (crowdInput) {
      crowdInput.addEventListener('input', (e) => {
        this.state.expectedCrowd = Math.max(500, parseInt(e.target.value) || 12000);
        this.render();
      });
    }

    if (unitSelect) {
      unitSelect.addEventListener('change', (e) => {
        this.state.unit = e.target.value;
        this.render();
      });
    }

    // Facility toggles
    const facilities = [
      { id: 'cadToggleFoodCourt', key: 'foodCourtEnabled' },
      { id: 'cadToggleMedical', key: 'medicalEnabled' },
      { id: 'cadToggleWater', key: 'waterEnabled' },
      { id: 'cadToggleSecurity', key: 'securityHubEnabled' },
      { id: 'cadToggleSideStage', key: 'sideStageEnabled' },
      { id: 'cadToggleSanitation', key: 'sanitationEnabled' }
    ];

    facilities.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) {
        el.addEventListener('click', () => {
          this.state[f.key] = !this.state[f.key];
          el.classList.toggle('active', this.state[f.key]);
          this.render();
        });
      }
    });

    // Layer toggles
    const layers = [
      { id: 'cadLayerDims', key: 'showDimensions' },
      { id: 'cadLayerBarricades', key: 'showBarricades' },
      { id: 'cadLayerFlow', key: 'showFlowArrows' },
      { id: 'cadLayerAmenities', key: 'showAmenities' }
    ];

    layers.forEach(l => {
      const el = document.getElementById(l.id);
      if (el) {
        el.addEventListener('click', () => {
          this.state[l.key] = !this.state[l.key];
          el.classList.toggle('active', this.state[l.key]);
          this.render();
        });
      }
    });

    // Presets
    document.querySelectorAll('.cad-preset-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const crowd = parseInt(btn.dataset.crowd);
        const len = parseInt(btn.dataset.len);
        const wid = parseInt(btn.dataset.wid);

        document.querySelectorAll('.cad-preset-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.state.expectedCrowd = crowd;
        this.state.length = len;
        this.state.width = wid;

        if (lenInput) lenInput.value = len;
        if (widInput) widInput.value = wid;
        if (crowdInput) crowdInput.value = crowd;

        this.render();
      });
    });

    // Zoom Buttons
    const zoomInBtn = document.getElementById('cadZoomInBtn');
    const zoomOutBtn = document.getElementById('cadZoomOutBtn');
    const zoomResetBtn = document.getElementById('cadZoomResetBtn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => this.setZoom(this.state.zoom + 0.15));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => this.setZoom(this.state.zoom - 0.15));
    if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => {
      this.state.zoom = 1.0;
      this.state.panX = 0;
      this.state.panY = 0;
      this.applyTransform();
    });

    // Download SVG
    const dlBtn = document.getElementById('cadDownloadSvgBtn');
    if (dlBtn) dlBtn.addEventListener('click', () => this.downloadSvg());
  },

  setZoom: function(val) {
    this.state.zoom = Math.max(0.5, Math.min(2.5, val));
    this.applyTransform();
  },

  bindPanZoom: function() {
    const wrap = document.getElementById('cadViewportWrap');
    if (!wrap) return;

    wrap.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.state.isDragging = true;
        this.state.dragStartX = e.clientX - this.state.panX;
        this.state.dragStartY = e.clientY - this.state.panY;
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.state.isDragging) {
        this.state.panX = e.clientX - this.state.dragStartX;
        this.state.panY = e.clientY - this.state.dragStartY;
        this.applyTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      this.state.isDragging = false;
    });

    wrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      this.setZoom(this.state.zoom + delta);
    }, { passive: false });
  },

  applyTransform: function() {
    const svgGroup = document.getElementById('cadMainSvgGroup');
    if (svgGroup) {
      svgGroup.setAttribute('transform', `translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoom})`);
    }
  },

  calculateMetrics: function() {
    const isM = this.state.unit === 'm';
    const lenM = isM ? this.state.length : Math.round(this.state.length * 0.3048);
    const widM = isM ? this.state.width : Math.round(this.state.width * 0.3048);
    const totalAreaM2 = lenM * widM;
    const totalAreaSqFt = Math.round(totalAreaM2 * 10.7639);

    // NFPA 101 Standard: Safe standing crowd density is 1.4 m² / person (or 15 sq.ft / person)
    const netUsableFactor = 0.65; // accounts for stages, corridors, barricade buffers
    const safeCapacity = Math.floor((totalAreaM2 * netUsableFactor) / 1.4);
    const occupancyLoadPct = Math.round((this.state.expectedCrowd / safeCapacity) * 100);
    const spacePerPersonM2 = (totalAreaM2 / this.state.expectedCrowd).toFixed(1);

    // Dynamic Barricade Box Count
    // Scaled based on crowd count:
    // < 4,000 -> 4 to 6 boxes
    // 4,000 - 15,000 -> 10 to 12 boxes (matching user's reference diagram!)
    // 15,000 - 30,000 -> 20 boxes
    // > 30,000 -> 28 to 32 boxes
    let barricadeBoxesCount = 10;
    if (this.state.expectedCrowd <= 4000) {
      barricadeBoxesCount = 4;
    } else if (this.state.expectedCrowd <= 8000) {
      barricadeBoxesCount = 6;
    } else if (this.state.expectedCrowd <= 16000) {
      barricadeBoxesCount = 10;
    } else if (this.state.expectedCrowd <= 28000) {
      barricadeBoxesCount = 16;
    } else if (this.state.expectedCrowd <= 45000) {
      barricadeBoxesCount = 20;
    } else {
      barricadeBoxesCount = 28;
    }

    // Road widths based on crowd scale
    let perimeterRoadWidthM = 8.0;
    let accessRoadWidthM = 10.0;
    if (this.state.expectedCrowd > 30000) {
      perimeterRoadWidthM = 12.0;
      accessRoadWidthM = 15.0;
    } else if (this.state.expectedCrowd < 5000) {
      perimeterRoadWidthM = 6.0;
      accessRoadWidthM = 8.0;
    }

    const egressMins = (this.state.expectedCrowd / (4 * 750)).toFixed(1);

    return {
      lenM,
      widM,
      totalAreaM2,
      totalAreaSqFt,
      safeCapacity,
      occupancyLoadPct,
      spacePerPersonM2,
      barricadeBoxesCount,
      perimeterRoadWidthM,
      accessRoadWidthM,
      egressMins
    };
  },

  render: function() {
    const metrics = this.calculateMetrics();
    this.updateStatsHud(metrics);
    this.renderBlueprintSvg(metrics);
  },

  updateStatsHud: function(m) {
    const areaEl = document.getElementById('cadStatArea');
    const capEl = document.getElementById('cadStatCapacity');
    const boxesEl = document.getElementById('cadStatBoxes');
    const densityEl = document.getElementById('cadStatDensity');
    const evacEl = document.getElementById('cadStatEvac');

    if (areaEl) areaEl.textContent = this.state.unit === 'm' ? `${m.totalAreaM2.toLocaleString()} m²` : `${m.totalAreaSqFt.toLocaleString()} sq.ft`;
    if (capEl) capEl.textContent = `${m.safeCapacity.toLocaleString()} (${m.occupancyLoadPct}%)`;
    if (boxesEl) boxesEl.textContent = `${m.barricadeBoxesCount} Holding Compartments`;
    if (densityEl) densityEl.textContent = `${m.spacePerPersonM2} m²/person`;
    if (evacEl) evacEl.textContent = `${m.egressMins} mins`;
  },

  renderBlueprintSvg: function(m) {
    const svg = document.getElementById('cadSvgViewport');
    if (!svg) return;

    // Viewbox coordinates: 1400 x 850
    const viewW = 1400;
    const viewH = 850;

    // Outer margin for dimension arrows
    const margin = 80;
    const arenaW = viewW - (margin * 2);
    const arenaH = viewH - (margin * 2);

    let elementsSvg = '';

    // ==========================================
    // 1. DIMENSION LINES (CAD BLUEPRINT MARKINGS)
    // ==========================================
    if (this.state.showDimensions) {
      elementsSvg += `
        <!-- Top Dimension: Perimeter Road Width -->
        <g stroke="#38bdf8" fill="#38bdf8" stroke-width="1.5" font-family="monospace" font-size="11" font-weight="bold">
          <line x1="${margin}" y1="35" x2="${viewW - margin}" y2="35" marker-start="url(#cad-arrow-start)" marker-end="url(#cad-arrow-end)"/>
          <line x1="${margin}" y1="25" x2="${margin}" y2="45"/>
          <line x1="${viewW - margin}" y1="25" x2="${viewW - margin}" y2="45"/>
          <rect x="550" y="24" width="300" height="22" fill="#060913" rx="4"/>
          <text x="700" y="39" text-anchor="middle" fill="#38bdf8" stroke="none">
            ${m.perimeterRoadWidthM.toFixed(2)}M WIDE PERIMETER ROAD (${m.lenM}M OVERALL)
          </text>

          <!-- Bottom Dimension: Main Access Road -->
          <line x1="${margin}" y1="815" x2="${viewW - margin}" y2="815" marker-start="url(#cad-arrow-start)" marker-end="url(#cad-arrow-end)"/>
          <line x1="${margin}" y1="805" x2="${margin}" y2="825"/>
          <line x1="${viewW - margin}" y1="805" x2="${viewW - margin}" y2="825"/>
          <rect x="540" y="804" width="320" height="22" fill="#060913" rx="4"/>
          <text x="700" y="819" text-anchor="middle" fill="#38bdf8" stroke="none">
            ${m.accessRoadWidthM.toFixed(2)}M WIDE ACCESS ROAD (MAIN ENTRANCE)
          </text>

          <!-- Left Dimension: Overall Width -->
          <line x1="35" y1="${margin}" x2="35" y2="${viewH - margin}" marker-start="url(#cad-arrow-start)" marker-end="url(#cad-arrow-end)"/>
          <line x1="25" y1="${margin}" x2="45" y2="${margin}"/>
          <line x1="25" y1="${viewH - margin}" x2="45" y2="${viewH - margin}"/>
          <text x="30" y="425" text-anchor="middle" fill="#38bdf8" stroke="none" transform="rotate(-90 30 425)">
            ${m.widM}M VENUE WIDTH
          </text>
        </g>
      `;
    }

    // ==========================================
    // 2. PERIMETER ROAD & VENUE BOUNDARY
    // ==========================================
    elementsSvg += `
      <!-- Venue Perimeter Road Boundary -->
      <rect x="${margin}" y="${margin}" width="${arenaW}" height="${arenaH}" rx="14" fill="rgba(15, 23, 42, 0.4)" stroke="#a855f7" stroke-width="3"/>
      <rect x="${margin + 20}" y="${margin + 20}" width="${arenaW - 40}" height="${arenaH - 40}" rx="10" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="6,4"/>
    `;

    // Directional flow arrows along perimeter
    if (this.state.showFlowArrows) {
      elementsSvg += `
        <!-- Flow Arrows Along Perimeter Roads -->
        <g stroke="#22c55e" fill="#22c55e" stroke-width="2">
          <!-- Top Road Arrows (Eastward) -->
          <line x1="380" y1="${margin + 10}" x2="440" y2="${margin + 10}" marker-end="url(#cad-flow-arrow)"/>
          <line x1="880" y1="${margin + 10}" x2="940" y2="${margin + 10}" marker-end="url(#cad-flow-arrow)"/>
          
          <!-- Bottom Road Arrows (Westward) -->
          <line x1="440" y1="${viewH - margin - 10}" x2="380" y2="${viewH - margin - 10}" marker-end="url(#cad-flow-arrow)"/>
          <line x1="940" y1="${viewH - margin - 10}" x2="880" y2="${viewH - margin - 10}" marker-end="url(#cad-flow-arrow)"/>

          <!-- Left Road Arrows (Northward) -->
          <line x1="${margin + 10}" y1="520" x2="${margin + 10}" y2="460" marker-end="url(#cad-flow-arrow)"/>

          <!-- Right Road Arrows (Northward) -->
          <line x1="${viewW - margin - 10}" y1="520" x2="${viewW - margin - 10}" marker-end="url(#cad-flow-arrow)"/>
        </g>
      `;
    }

    // ==========================================
    // 3. STAGES (LEFT SECTOR)
    // ==========================================
    const stageLeft = margin + 35;
    const stageTop = margin + 80;

    // Major Stage (Green)
    elementsSvg += `
      <g class="cad-element-interactive" onclick="CadPlanner.selectObstacle('stage-major')">
        <rect x="${stageLeft}" y="260" width="105" height="260" rx="6" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="2.5"/>
        <rect x="${stageLeft + 15}" y="290" width="75" height="200" rx="4" fill="rgba(34, 197, 94, 0.25)" stroke="#22c55e" stroke-width="1.5"/>
        <text x="${stageLeft + 52}" y="380" fill="#4ade80" font-size="12" font-weight="900" text-anchor="middle" font-family="sans-serif">
          MAJOR STAGE
        </text>
        <text x="${stageLeft + 52}" y="400" fill="#a7f3d0" font-size="10" font-weight="bold" text-anchor="middle">
          (GREEN)
        </text>
      </g>
    `;

    // Side Stage (Orange) - If toggled
    if (this.state.sideStageEnabled) {
      elementsSvg += `
        <g class="cad-element-interactive" onclick="CadPlanner.selectObstacle('stage-side')">
          <rect x="${stageLeft + 80}" y="${stageTop}" width="130" height="75" rx="5" fill="rgba(249, 115, 22, 0.15)" stroke="#f97316" stroke-width="2"/>
          <text x="${stageLeft + 145}" y="${stageTop + 38}" fill="#fb923c" font-size="11" font-weight="900" text-anchor="middle" font-family="sans-serif">
            SIDE STAGE
          </text>
          <text x="${stageLeft + 145}" y="${stageTop + 54}" fill="#fed7aa" font-size="9" font-weight="bold" text-anchor="middle">
            (ORANGE)
          </text>
        </g>
      `;
    }

    // ==========================================
    // 4. DYNAMIC BARRICADE BOXES (CENTER SECTOR)
    // ==========================================
    if (this.state.showBarricades) {
      // Calculate layout grid for barricade boxes
      // Arranged in 2 horizontal rows, across N columns
      const totalBoxes = m.barricadeBoxesCount;
      const cols = Math.ceil(totalBoxes / 2);
      
      const gridStartX = stageLeft + 160;
      const gridEndX = viewW - margin - 380;
      const gridW = gridEndX - gridStartX;
      const boxW = (gridW - (cols * 18)) / cols;

      const rowTopY = margin + 40;
      const rowH = 265;
      const rowBottomY = margin + 345;

      const perBoxCap = Math.round(this.state.expectedCrowd / totalBoxes);

      for (let i = 0; i < totalBoxes; i++) {
        const colIdx = Math.floor(i / 2);
        const rowIdx = i % 2; // 0 for top row, 1 for bottom row

        const bx = gridStartX + (colIdx * (boxW + 18));
        const by = rowIdx === 0 ? rowTopY : rowBottomY;

        let boxTitle = "HEAVY-DUTY BARRICADE";
        if (colIdx % 3 === 1) boxTitle = "MULTI-SEGMENT CROWD CONTROL";
        if (colIdx % 3 === 2) boxTitle = "MULTI-DUTY CROWD CONTROL";

        elementsSvg += `
          <g class="cad-element-interactive" onclick="CadPlanner.selectObstacle('barricade-${i+1}', '${boxTitle}', ${perBoxCap})">
            <!-- Barricade Pen Outer Border -->
            <rect x="${bx}" y="${by}" width="${boxW}" height="${rowH}" rx="6" fill="rgba(239, 68, 68, 0.06)" stroke="#ef4444" stroke-width="2.5" stroke-dasharray="8,4"/>
            
            <!-- Steel barrier cross-hatch marks -->
            <line x1="${bx}" y1="${by + 4}" x2="${bx + boxW}" y2="${by + 4}" stroke="#ef4444" stroke-width="2"/>
            <line x1="${bx}" y1="${by + rowH - 4}" x2="${bx + boxW}" y2="${by + rowH - 4}" stroke="#ef4444" stroke-width="2"/>
            
            <!-- Holding Pen Label -->
            <text x="${bx + (boxW / 2)}" y="${by + (rowH / 2) - 15}" fill="#fca5a5" font-size="10" font-weight="900" text-anchor="middle" font-family="sans-serif">
              BOX ${i + 1}
            </text>
            <text x="${bx + (boxW / 2)}" y="${by + (rowH / 2) + 2}" fill="#ffffff" font-size="9" font-weight="bold" text-anchor="middle" font-family="sans-serif">
              ${boxTitle}
            </text>
            <text x="${bx + (boxW / 2)}" y="${by + (rowH / 2) + 20}" fill="#94a3b8" font-size="9" font-family="monospace" text-anchor="middle">
              Cap: ${perBoxCap.toLocaleString()} ppl
            </text>
          </g>
        `;
      }

      // Central Safety Egress Artery between top and bottom barricade rows
      elementsSvg += `
        <line x1="${gridStartX - 20}" y1="380" x2="${gridEndX + 20}" y2="380" stroke="#3b82f6" stroke-width="3" stroke-dasharray="6,4"/>
        <text x="${(gridStartX + gridEndX) / 2}" y="374" fill="#60a5fa" font-size="10" font-weight="bold" text-anchor="middle">
          CENTRAL ARTERIAL SAFETY CORRIDOR (6M CLEARANCE)
        </text>
      `;
    }

    // ==========================================
    // 5. CENTRAL SECURITY HUB
    // ==========================================
    if (this.state.securityHubEnabled) {
      const hubX = viewW - margin - 355;
      const hubY = 340;

      elementsSvg += `
        <g class="cad-element-interactive" onclick="CadPlanner.selectObstacle('security-hub')">
          <rect x="${hubX}" y="${hubY}" width="75" height="80" rx="6" fill="#0f172a" stroke="#fff" stroke-width="2"/>
          <rect x="${hubX + 6}" y="${hubY + 6}" width="63" height="68" rx="4" fill="rgba(59, 130, 246, 0.25)" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="${hubX + 37}" y="${hubY + 38}" fill="#fff" font-size="11" font-weight="900" text-anchor="middle">
            HUB
          </text>
          <text x="${hubX + 37}" y="${hubY + 54}" fill="#93c5fd" font-size="8" font-weight="bold" text-anchor="middle">
            SECURITY
          </text>
        </g>
      `;
    }

    // ==========================================
    // 6. FACILITIES (RIGHT SECTOR)
    // ==========================================
    if (this.state.showAmenities) {
      const rightX = viewW - margin - 260;

      // 6A. Medical & First Aid Station
      if (this.state.medicalEnabled) {
        elementsSvg += `
          <g class="cad-element-interactive" onclick="CadPlanner.selectObstacle('medical-station')">
            <rect x="${rightX}" y="${margin + 35}" width="235" height="150" rx="8" fill="rgba(6, 182, 212, 0.12)" stroke="#06b6d4" stroke-width="2"/>
            <text x="${rightX + 117}" y="${margin + 55}" fill="#22d3ee" font-size="11" font-weight="900" text-anchor="middle">
              MEDICAL & FIRST AID STATION
            </text>
            
            <!-- Red Cross Icon -->
            <rect x="${rightX + 160}" y="${margin + 70}" width="45" height="45" rx="4" fill="#dc2626"/>
            <rect x="${rightX + 178}" y="${margin + 75}" width="9" height="35" fill="#fff"/>
            <rect x="${rightX + 165}" y="${margin + 88}" width="35" height="9" fill="#fff"/>
            
            <!-- Ambulance Bay & Egress -->
            <rect x="${rightX + 20}" y="${margin + 75}" width="120" height="40" rx="4" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)" stroke-dasharray="4,3"/>
            <text x="${rightX + 80}" y="${margin + 98}" fill="#fff" font-size="9" font-weight="bold" text-anchor="middle">
              AMBULANCE EGRESS
            </text>
          </g>
        `;
      }

      // 6B. Dedicated Food Court & Dining Pavilion (USER SPECIFIC REQUEST)
      if (this.state.foodCourtEnabled) {
        elementsSvg += `
          <g class="cad-element-interactive" onclick="CadPlanner.selectObstacle('food-court')">
            <rect x="${rightX}" y="285" width="235" height="185" rx="8" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" stroke-width="2.5"/>
            <text x="${rightX + 117}" y="310" fill="#fbbf24" font-size="11" font-weight="900" text-anchor="middle">
              FOOD COURT & REFRESHMENTS
            </text>
            
            <!-- Food Pavilion Stalls Grid -->
            <rect x="${rightX + 15}" y="325" width="95" height="60" rx="4" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="1"/>
            <text x="${rightX + 62}" y="358" fill="#fde68a" font-size="9" font-weight="bold" text-anchor="middle">
              DINING AREA
            </text>

            <rect x="${rightX + 125}" y="325" width="95" height="60" rx="4" fill="rgba(245, 158, 11, 0.2)" stroke="#f59e0b" stroke-width="1"/>
            <text x="${rightX + 172}" y="358" fill="#fde68a" font-size="9" font-weight="bold" text-anchor="middle">
              FOOD STALLS
            </text>

            <rect x="${rightX + 15}" y="400" width="205" height="55" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(245, 158, 11, 0.3)"/>
            <text x="${rightX + 117}" y="432" fill="#fff" font-size="9" text-anchor="middle">
              Dedicated Queue & Service Lanes
            </text>
          </g>
        `;
      }

      // 6C. Public Water & Hydration Stations
      if (this.state.waterEnabled) {
        const waterY = this.state.foodCourtEnabled ? 490 : 300;
        elementsSvg += `
          <g class="cad-element-interactive" onclick="CadPlanner.selectObstacle('water-station')">
            <rect x="${rightX}" y="${waterY}" width="235" height="110" rx="8" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" stroke-width="2"/>
            <text x="${rightX + 117}" y="${waterY + 25}" fill="#7dd3fc" font-size="11" font-weight="900" text-anchor="middle">
              PUBLIC WATER STATIONS
            </text>
            
            <!-- Water Drop Icon Grid -->
            <g transform="translate(${rightX + 35}, ${waterY + 40})">
              ${[0, 40, 80, 120].map(ox => `
                <circle cx="${ox + 15}" cy="18" r="14" fill="rgba(56, 189, 248, 0.25)" stroke="#38bdf8" stroke-width="1.5"/>
                <text x="${ox + 15}" y="22" fill="#fff" font-size="12" text-anchor="middle">💧</text>
              `).join('')}
            </g>
            <text x="${rightX + 117}" y="${waterY + 95}" fill="#94a3b8" font-size="9" text-anchor="middle">
              High-Capacity Potable Water Dispensers
            </text>
          </g>
        `;
      }

      // 6D. Sanitation / Restroom Bays
      if (this.state.sanitationEnabled) {
        const sanY = 620;
        elementsSvg += `
          <g class="cad-element-interactive" onclick="CadPlanner.selectObstacle('sanitation')">
            <rect x="${rightX}" y="${sanY}" width="235" height="90" rx="8" fill="rgba(168, 85, 247, 0.12)" stroke="#a855f7" stroke-width="2"/>
            <text x="${rightX + 117}" y="${sanY + 25}" fill="#c084fc" font-size="11" font-weight="900" text-anchor="middle">
              PUBLIC RESTROOM BAYS
            </text>
            <text x="${rightX + 117}" y="${sanY + 55}" fill="#fff" font-size="14" text-anchor="middle">
              🚻 🚻 🚻 🚻
            </text>
            <text x="${rightX + 117}" y="${sanY + 75}" fill="#94a3b8" font-size="8" text-anchor="middle">
              Staggered Queue Access
            </text>
          </g>
        `;
      }
    }

    svg.innerHTML = `
      <defs>
        <!-- Arrowhead Marker for CAD Dimensions -->
        <marker id="cad-arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8"/>
        </marker>
        <marker id="cad-arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 2 L 8 5 L 0 8 z" fill="#38bdf8"/>
        </marker>
        <marker id="cad-flow-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 2 L 8 5 L 0 8 z" fill="#22c55e"/>
        </marker>
        <pattern id="cad-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
        </pattern>
      </defs>

      <!-- Background Grid -->
      <rect width="100%" height="100%" fill="url(#cad-grid)" />

      <!-- Transformable Group -->
      <g id="cadMainSvgGroup" transform="translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoom})">
        ${elementsSvg}
      </g>
    `;
  },

  selectObstacle: function(id, label, cap) {
    const detailsEl = document.getElementById('cadObstacleDetails');
    if (!detailsEl) return;

    let title = label || "Architectural Zone";
    let specs = "Custom designed crowd control barrier.";
    let safeCap = cap ? `${cap.toLocaleString()} attendees` : "1,200 attendees";

    if (id === 'stage-major') {
      title = "Major Stage (Green)";
      specs = "Primary performance / presentation platform with 2.5m elevation and dual acoustic wings.";
      safeCap = "Perimeter Buffer: 5,000 capacity";
    } else if (id === 'stage-side') {
      title = "Side Stage (Orange)";
      specs = "Secondary announcement & acoustic satellite stage with emergency broadcast relays.";
      safeCap = "1,800 capacity";
    } else if (id === 'food-court') {
      title = "Food Court & Dining Pavilion";
      specs = "Dedicated refreshment zone equipped with separated queue barriers and hydration access.";
      safeCap = "2,500 simultaneous visitors";
    } else if (id === 'medical-station') {
      title = "Medical & First Aid Station";
      specs = "Emergency responder station with triage beds, resuscitation gear, and dedicated ambulance lane.";
      safeCap = "Rapid Care: 50 simultaneous beds";
    } else if (id === 'water-station') {
      title = "Public Water & Hydration Pods";
      specs = "4x continuous high-capacity potable water dispensers with non-slip drainage mats.";
      safeCap = "Throughput: 120 visitors / min";
    } else if (id === 'security-hub') {
      title = "Security & CCTV Command Hub";
      specs = "Elevated crowd observation tower with direct radio links to local emergency services.";
      safeCap = "Operations Command: 12 officers";
    }

    detailsEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:1.25rem;">
        <div>
          <span style="font-size:0.72rem; color:var(--accent-cyan); font-weight:800; text-transform:uppercase;">INSPECTED SECTOR</span>
          <div style="font-size:1.1rem; font-weight:800; color:var(--text-main);">${title}</div>
        </div>
        <div style="border-left:1px solid var(--border-subtle); padding-left:1.25rem;">
          <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">SAFE HOLDING CAPACITY</span>
          <div style="font-size:1rem; font-weight:800; color:var(--color-safe);">${safeCap}</div>
        </div>
        <div style="border-left:1px solid var(--border-subtle); padding-left:1.25rem; max-width:450px;">
          <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">SPECIFICATIONS & SAFETY DIRECTIVE</span>
          <div style="font-size:0.8rem; color:var(--text-muted);">${specs}</div>
        </div>
      </div>
    `;
  },

  downloadSvg: function() {
    const svg = document.getElementById('cadSvgViewport');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FlowNavigator_Event_Layout_Plan_${this.state.expectedCrowd}_attendees.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

window.CadPlanner = CadPlanner;
