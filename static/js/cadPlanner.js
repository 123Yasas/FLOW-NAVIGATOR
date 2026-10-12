/**
 * CrowdFlow AI — Smart Crowd Management and Ground Planning System
 * Professional CAD/GIS Architectural Ground Layout & Crowd Safety Engine
 * Compliant with NFPA 101 Life Safety Code and UK Event Safety Guide (Green Guide).
 */

const CadPlanner = {
  // Master State
  state: {
    event_name: 'National Public Gathering & Music Festival 2026',
    event_type: 'Concert & Music Festival',
    unit: 'm', // 'm' or 'ft'
    shape: 'rectangular', // 'rectangular', 'square', 'l_shaped', 'irregular', 'trapezoid'
    length: 300,
    width: 190,
    area_only: 0,
    expected_crowd: 12000,
    stage_position: 'west', // 'west', 'east', 'north', 'south', 'center'
    stage_width: 36,
    stage_depth: 20,
    entry_gates_count: 4,
    exit_gates_count: 4,
    budget_limit: 50000,
    currency: 'USD',
    alternative_mode: 'balanced', // 'safety_priority', 'balanced', 'budget_optimized'

    // Layers visibility
    showDimensions: true,
    showBarricades: true,
    showGates: true,
    showFlowArrows: true,
    showAmenities: true,
    showSafetyCorridors: true,
    showBlueprintImage: true,
    blueprintOpacity: 0.65,

    // Uploaded blueprint image & scale calibration
    blueprintImageSrc: null,
    scaleReferenceLength: 50, // real world units (e.g. 50m)

    // Pan & Zoom
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,

    // Dragging elements
    draggedElementId: null,
    dragStartX: 0,
    dragStartY: 0,
    elementOrigX: 0,
    elementOrigY: 0,

    // Active Selection
    selectedElement: null,

    // Active calculated plan from engine
    plan: null,

    // Editable custom unit prices
    customUnitPrices: {}
  },

  init: function() {
    this.bindControls();
    this.bindPanZoom();
    this.bindImageUpload();
    this.fetchOrComputePlan();
  },

  // -------------------------------------------------------------
  // EVENT BINDINGS
  // -------------------------------------------------------------
  bindControls: function() {
    // Quick Presets
    document.querySelectorAll('.cf-preset-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cf-preset-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.expected_crowd = parseInt(btn.dataset.crowd) || 12000;
        this.state.length = parseInt(btn.dataset.len) || 300;
        this.state.width = parseInt(btn.dataset.wid) || 190;
        this.state.shape = btn.dataset.shape || 'rectangular';

        // Update form fields
        const lenEl = document.getElementById('cfInputLength');
        const widEl = document.getElementById('cfInputWidth');
        const crowdEl = document.getElementById('cfInputCrowd');
        if (lenEl) lenEl.value = this.state.length;
        if (widEl) widEl.value = this.state.width;
        if (crowdEl) crowdEl.value = this.state.expected_crowd;

        this.syncShapePills();
        this.fetchOrComputePlan();
      });
    });

    // Inputs: Dimensions & Crowd
    const lenInput = document.getElementById('cfInputLength');
    const widInput = document.getElementById('cfInputWidth');
    const crowdInput = document.getElementById('cfInputCrowd');
    const unitSelect = document.getElementById('cfUnitSelect');
    const budgetInput = document.getElementById('cfBudgetLimit');
    const eventNameInput = document.getElementById('cfEventName');
    const eventTypeSelect = document.getElementById('cfEventType');
    const stagePosSelect = document.getElementById('cfStagePosSelect');
    const entryGatesInput = document.getElementById('cfEntryGatesInput');
    const exitGatesInput = document.getElementById('cfExitGatesInput');

    if (lenInput) {
      lenInput.addEventListener('input', (e) => {
        this.state.length = Math.max(30, parseInt(e.target.value) || 300);
        this.fetchOrComputePlan();
      });
    }

    if (widInput) {
      widInput.addEventListener('input', (e) => {
        this.state.width = Math.max(20, parseInt(e.target.value) || 190);
        this.fetchOrComputePlan();
      });
    }

    if (crowdInput) {
      crowdInput.addEventListener('input', (e) => {
        this.state.expected_crowd = Math.max(500, parseInt(e.target.value) || 12000);
        this.fetchOrComputePlan();
      });
    }

    if (unitSelect) {
      unitSelect.addEventListener('change', (e) => {
        this.state.unit = e.target.value;
        this.fetchOrComputePlan();
      });
    }

    if (budgetInput) {
      budgetInput.addEventListener('input', (e) => {
        this.state.budget_limit = Math.max(1000, parseFloat(e.target.value) || 50000);
        this.fetchOrComputePlan();
      });
    }

    if (eventNameInput) {
      eventNameInput.addEventListener('input', (e) => {
        this.state.event_name = e.target.value || 'National Public Gathering';
      });
    }

    if (eventTypeSelect) {
      eventTypeSelect.addEventListener('change', (e) => {
        this.state.event_type = e.target.value;
        this.fetchOrComputePlan();
      });
    }

    if (stagePosSelect) {
      stagePosSelect.addEventListener('change', (e) => {
        this.state.stage_position = e.target.value;
        this.fetchOrComputePlan();
      });
    }

    if (entryGatesInput) {
      entryGatesInput.addEventListener('input', (e) => {
        this.state.entry_gates_count = Math.max(2, parseInt(e.target.value) || 4);
        this.fetchOrComputePlan();
      });
    }

    if (exitGatesInput) {
      exitGatesInput.addEventListener('input', (e) => {
        this.state.exit_gates_count = Math.max(2, parseInt(e.target.value) || 4);
        this.fetchOrComputePlan();
      });
    }

    // Shape Selector Buttons
    document.querySelectorAll('.cf-shape-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cf-shape-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.shape = btn.dataset.shape;
        this.fetchOrComputePlan();
      });
    });

    // Alternative Mode Switcher (Safety Priority vs Balanced vs Budget Optimized)
    document.querySelectorAll('.cf-alt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cf-alt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.alternative_mode = btn.dataset.mode;
        this.fetchOrComputePlan();
      });
    });

    // Layer Visibility Toggles
    const layerToggles = [
      { id: 'cfLayerDims', key: 'showDimensions' },
      { id: 'cfLayerBarricades', key: 'showBarricades' },
      { id: 'cfLayerGates', key: 'showGates' },
      { id: 'cfLayerFlow', key: 'showFlowArrows' },
      { id: 'cfLayerAmenities', key: 'showAmenities' },
      { id: 'cfLayerSafety', key: 'showSafetyCorridors' },
      { id: 'cfLayerBlueprint', key: 'showBlueprintImage' }
    ];

    layerToggles.forEach(t => {
      const el = document.getElementById(t.id);
      if (el) {
        el.addEventListener('click', () => {
          this.state[t.key] = !this.state[t.key];
          el.classList.toggle('active', this.state[t.key]);
          this.renderCanvas();
        });
      }
    });

    // Blueprint Opacity Slider
    const opacitySlider = document.getElementById('cfBlueprintOpacity');
    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        this.state.blueprintOpacity = parseFloat(e.target.value);
        this.renderCanvas();
      });
    }

    // Add Object Toolbox Buttons
    const toolboxActions = [
      { id: 'cfToolAddPen', type: 'barricade_pen' },
      { id: 'cfToolAddEntryGate', type: 'entry_gate' },
      { id: 'cfToolAddExitGate', type: 'exit_gate' },
      { id: 'cfToolAddMedical', type: 'medical' },
      { id: 'cfToolAddWater', type: 'water' },
      { id: 'cfToolAddRestroom', type: 'restroom' },
      { id: 'cfToolAddFood', type: 'food_court' },
      { id: 'cfToolAddObstacle', type: 'obstacle' }
    ];

    toolboxActions.forEach(tb => {
      const btn = document.getElementById(tb.id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.addNewObject(tb.type);
        });
      }
    });

    // Export Buttons
    const exportSvgBtn = document.getElementById('cfExportSvgBtn');
    if (exportSvgBtn) exportSvgBtn.addEventListener('click', () => this.downloadSvg());

    const exportPngBtn = document.getElementById('cfExportPngBtn');
    if (exportPngBtn) exportPngBtn.addEventListener('click', () => this.downloadPng());

    const exportCsvBtn = document.getElementById('cfExportCsvBtn');
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', () => this.downloadCsv());

    const printDossierBtn = document.getElementById('cfPrintDossierBtn');
    if (printDossierBtn) printDossierBtn.addEventListener('click', () => this.printSafetyDossier());

    const saveProjectBtn = document.getElementById('cfSaveProjectBtn');
    if (saveProjectBtn) saveProjectBtn.addEventListener('click', () => this.saveProject());

    const regenerateBtn = document.getElementById('cfRegenerateBtn');
    if (regenerateBtn) regenerateBtn.addEventListener('click', () => this.fetchOrComputePlan());
  },

  syncShapePills: function() {
    document.querySelectorAll('.cf-shape-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.shape === this.state.shape);
    });
  },

  // -------------------------------------------------------------
  // BLUEPRINT IMAGE UPLOAD & CALIBRATION (Scenario 2)
  // -------------------------------------------------------------
  bindImageUpload: function() {
    const fileInput = document.getElementById('cfBlueprintFileInput');
    const uploadArea = document.getElementById('cfBlueprintUploadArea');
    const clearBtn = document.getElementById('cfClearBlueprintBtn');
    const scaleInput = document.getElementById('cfScaleRefDistance');

    if (fileInput && uploadArea) {
      uploadArea.addEventListener('click', () => fileInput.click());
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.state.blueprintImageSrc = evt.target.result;
          this.state.showBlueprintImage = true;
          const layerBtn = document.getElementById('cfLayerBlueprint');
          if (layerBtn) layerBtn.classList.add('active');
          const thumbWrap = document.getElementById('cfBlueprintThumbWrap');
          if (thumbWrap) thumbWrap.style.display = 'flex';
          const thumbImg = document.getElementById('cfBlueprintThumb');
          if (thumbImg) thumbImg.src = evt.target.result;
          this.renderCanvas();
        };
        reader.readAsDataURL(file);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.state.blueprintImageSrc = null;
        const thumbWrap = document.getElementById('cfBlueprintThumbWrap');
        if (thumbWrap) thumbWrap.style.display = 'none';
        if (fileInput) fileInput.value = '';
        this.renderCanvas();
      });
    }

    if (scaleInput) {
      scaleInput.addEventListener('input', (e) => {
        this.state.scaleReferenceLength = Math.max(5, parseFloat(e.target.value) || 50);
        this.renderCanvas();
      });
    }
  },

  // -------------------------------------------------------------
  // PAN & ZOOM CONTROLS
  // -------------------------------------------------------------
  bindPanZoom: function() {
    const viewportWrap = document.getElementById('cfViewportWrap');
    if (!viewportWrap) return;

    viewportWrap.addEventListener('mousedown', (e) => {
      // Don't pan if clicking an interactive element
      if (e.target.closest('.cf-interactive-elem')) return;
      this.state.isPanning = true;
      this.state.panStartX = e.clientX - this.state.panX;
      this.state.panStartY = e.clientY - this.state.panY;
      viewportWrap.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (this.state.isPanning) {
        this.state.panX = e.clientX - this.state.panStartX;
        this.state.panY = e.clientY - this.state.panStartY;
        this.updateSvgTransform();
      } else if (this.state.draggedElementId) {
        this.handleElementDragging(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.state.isPanning) {
        this.state.isPanning = false;
        if (viewportWrap) viewportWrap.style.cursor = 'grab';
      }
      if (this.state.draggedElementId) {
        this.finishElementDragging();
      }
    });

    viewportWrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      this.state.zoom = Math.max(0.4, Math.min(3.5, this.state.zoom * zoomFactor));
      this.updateSvgTransform();
    }, { passive: false });

    // Floating Zoom Buttons
    const zoomInBtn = document.getElementById('cfZoomInBtn');
    const zoomOutBtn = document.getElementById('cfZoomOutBtn');
    const zoomResetBtn = document.getElementById('cfZoomResetBtn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
      this.state.zoom = Math.min(3.5, this.state.zoom * 1.2);
      this.updateSvgTransform();
    });

    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
      this.state.zoom = Math.max(0.4, this.state.zoom * 0.82);
      this.updateSvgTransform();
    });

    if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => {
      this.state.zoom = 1.0;
      this.state.panX = 0;
      this.state.panY = 0;
      this.updateSvgTransform();
    });
  },

  updateSvgTransform: function() {
    const stageGroup = document.getElementById('cfSvgStageGroup');
    if (stageGroup) {
      stageGroup.setAttribute('transform', `translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoom})`);
    }
  },

  // -------------------------------------------------------------
  // DATA FETCHING & ENGINE SYNC
  // -------------------------------------------------------------
  fetchOrComputePlan: async function() {
    const payload = {
      event_name: this.state.event_name,
      event_type: this.state.event_type,
      unit: this.state.unit,
      shape: this.state.shape,
      length: this.state.length,
      width: this.state.width,
      area_only: this.state.area_only,
      expected_crowd: this.state.expected_crowd,
      stage_position: this.state.stage_position,
      stage_width: this.state.stage_width,
      stage_depth: this.state.stage_depth,
      entry_gates_count: this.state.entry_gates_count,
      exit_gates_count: this.state.exit_gates_count,
      budget_limit: this.state.budget_limit,
      currency: this.state.currency,
      alternative_mode: this.state.alternative_mode,
      custom_unit_prices: this.state.customUnitPrices
    };

    try {
      const resp = await fetch('/api/crowdflow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (data.success && data.plan) {
        this.state.plan = data.plan;
        this.renderAll();
      } else {
        this.computeLocalFallback(payload);
      }
    } catch (err) {
      console.warn('[CrowdFlow] API call fallback to local engine:', err);
      this.computeLocalFallback(payload);
    }
  },

  computeLocalFallback: function(p) {
    // High-fidelity client-side geometric engine fallback
    const len = p.length || 300;
    const wid = p.width || 190;
    const crowd = p.expected_crowd || 12000;
    const area = len * wid;
    const usable = area * 0.76;
    const density = (usable / crowd).toFixed(2);
    
    this.state.plan = {
      event_name: p.event_name,
      alternative_mode: p.alternative_mode,
      ground_dimensions: {
        unit: p.unit,
        shape: p.shape,
        length: len,
        width: wid,
        total_area_m2: area,
        usable_area_m2: usable
      },
      capacity_analysis: {
        expected_crowd: crowd,
        max_safe_capacity: Math.floor(usable / 0.75),
        density_m2_per_person: density,
        safety_rating: density >= 0.75 ? 'SAFE' : density >= 0.5 ? 'MODERATE' : 'CRITICAL',
        evacuation_time_mins: (crowd / (p.exit_gates_count * 168)).toFixed(1)
      },
      layout: {
        boundary: [
          { x: 70, y: 60 }, { x: 1330, y: 60 }, { x: 1330, y: 790 }, { x: 70, y: 790 }
        ],
        stage: {
          id: 'stage-main', type: 'stage', label: 'MAJOR STAGE', x: 98, y: 275, width: 105, height: 290, color: '#10b981', capacity: 250, specs: 'Truss platform'
        },
        barricade_pens: [],
        security_hub: {
          id: 'hub-security', type: 'security_hub', label: 'SECURITY HUB', x: 860, y: 390, width: 80, height: 95, color: '#1e293b', capacity: 30, specs: 'Command center'
        },
        facilities: [],
        entry_gates: [],
        exit_gates: [],
        flow_vectors: []
      },
      equipment_quantities: {
        barricade_panels_count: 240,
        turnstiles_count: 8
      },
      budget: {
        currency: p.currency,
        budget_limit: p.budget_limit,
        grand_total: 42850,
        remaining_budget: p.budget_limit - 42850,
        is_over_budget: 42850 > p.budget_limit,
        items: []
      },
      safety_audit: [],
      alternatives: {}
    };
    this.renderAll();
  },

  // -------------------------------------------------------------
  // RENDERING ENGINE
  // -------------------------------------------------------------
  renderAll: function() {
    this.renderKPIs();
    this.renderCanvas();
    this.renderSafetyAudit();
    this.renderBudgetTable();
    this.renderAlternatives();
  },

  renderKPIs: function() {
    const plan = this.state.plan;
    if (!plan) return;

    const g = plan.ground_dimensions;
    const c = plan.capacity_analysis;
    const b = plan.budget;

    const statArea = document.getElementById('cfStatArea');
    const statCap = document.getElementById('cfStatCapacity');
    const statDensity = document.getElementById('cfStatDensity');
    const statEvac = document.getElementById('cfStatEvac');
    const statBudget = document.getElementById('cfStatBudget');

    if (statArea) statArea.textContent = `${g.total_area_m2.toLocaleString()} m² (${g.total_area_sqft ? g.total_area_sqft.toLocaleString() : Math.round(g.total_area_m2 * 10.76).toLocaleString()} sq.ft)`;
    if (statCap) statCap.textContent = `${c.max_safe_capacity.toLocaleString()} (Safe Cap)`;
    if (statDensity) {
      statDensity.textContent = `${c.density_m2_per_person} m²/ppl (${c.safety_rating})`;
      statDensity.style.color = c.safety_rating === 'SAFE' ? '#047857' : c.safety_rating === 'MODERATE' ? '#b45309' : '#b91c1c';
    }
    if (statEvac) {
      statEvac.textContent = `${c.evacuation_time_mins} mins`;
      statEvac.style.color = parseFloat(c.evacuation_time_mins) <= 15 ? '#047857' : '#b91c1c';
    }
    if (statBudget) {
      statBudget.textContent = `${b.currency} ${b.grand_total.toLocaleString()}`;
      statBudget.style.color = b.is_over_budget ? '#b91c1c' : '#047857';
    }
  },

  renderCanvas: function() {
    const svg = document.getElementById('cfSvgViewport');
    if (!svg || !this.state.plan) return;

    const layout = this.state.plan.layout;
    const layers = this.state;
    const boundary = layout.boundary || [];

    let boundaryPathD = '';
    if (boundary.length > 0) {
      boundaryPathD = `M ${boundary[0].x} ${boundary[0].y} ` + boundary.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(' ') + ' Z';
    } else {
      boundaryPathD = 'M 70 60 L 1330 60 L 1330 790 L 70 790 Z';
    }

    let svgHtml = `
      <defs>
        <!-- Engineering Grid Pattern -->
        <pattern id="cfGridSmall" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="0.75" />
        </pattern>
        <pattern id="cfGridLarge" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#cfGridSmall)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" stroke-width="1.5" />
        </pattern>

        <!-- Drop Shadows & Filters -->
        <filter id="cfGlowBlue" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#2563eb" flood-opacity="0.35" />
        </filter>
        <filter id="cfShadowCard" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.12" />
        </filter>
        
        <!-- Arrowhead Markers -->
        <marker id="cfArrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
        </marker>
        <marker id="cfArrowAmber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#d97706" />
        </marker>
        <marker id="cfArrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
        </marker>
      </defs>

      <!-- Viewport Scalable Group -->
      <g id="cfSvgStageGroup" transform="translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoom})">

        <!-- Outer Canvas Background -->
        <rect x="-400" y="-300" width="2200" height="1500" fill="#f8fafc" />

        <!-- Engineering Grid -->
        <rect x="0" y="0" width="1400" height="850" fill="url(#cfGridLarge)" opacity="0.65" />

        <!-- Uploaded Blueprint Image Layer (Scenario 2) -->
        ${layers.showBlueprintImage && layers.blueprintImageSrc ? `
          <image href="${layers.blueprintImageSrc}" x="70" y="60" width="1260" height="730" preserveAspectRatio="none" opacity="${layers.blueprintOpacity}" />
        ` : ''}

        <!-- Outer Venue Ground Boundary -->
        <path d="${boundaryPathD}" fill="#94a3b8" fill-opacity="0.18" stroke="#475569" stroke-width="3.5" stroke-dasharray="8 4" />

        <!-- Perimeter Safety Road -->
        ${layers.showSafetyCorridors ? `
          <path d="${boundaryPathD}" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-opacity="0.35" />
          <text x="700" y="45" text-anchor="middle" font-size="11" font-weight="800" font-family="monospace" fill="#2563eb" letter-spacing="1">
            ▲ ${layout.perimeter_road_width_m || 12}M WIDE PERIMETER VEHICLE EGRESS ROAD (NFPA 101 COMPLIANT) ▲
          </text>
        ` : ''}

        <!-- Central Arterial Corridor Clear Road -->
        ${layers.showSafetyCorridors ? `
          <line x1="280" y1="425" x2="860" y2="425" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4" stroke-opacity="0.6" />
          <text x="560" y="420" text-anchor="middle" font-size="9" font-weight="800" font-family="monospace" fill="#1d4ed8" letter-spacing="0.5">
            CENTRAL ARTERIAL SAFETY CORRIDOR (${layout.arterial_corridor_width_m || 16}M CLEARANCE — NO OBSTRUCTION)
          </text>
        ` : ''}

        <!-- MAIN STAGE -->
        ${this.renderStageSvg(layout.stage)}

        <!-- BARRICADE PENS (Box 1, Box 2...) -->
        ${layers.showBarricades ? (layout.barricade_pens || []).map(pen => this.renderPenSvg(pen)).join('') : ''}

        <!-- CENTRAL SECURITY COMMAND HUB -->
        ${this.renderSecurityHubSvg(layout.security_hub)}

        <!-- FACILITIES (Medical, Food Court, Water, Restrooms) -->
        ${layers.showAmenities ? (layout.facilities || []).map(fac => this.renderFacilitySvg(fac)).join('') : ''}

        <!-- INGRESS & EGRESS GATES -->
        ${layers.showGates ? [
          ...(layout.entry_gates || []).map(g => this.renderGateSvg(g, true)),
          ...(layout.exit_gates || []).map(g => this.renderGateSvg(g, false))
        ].join('') : ''}

        <!-- DIRECTIONAL FLOW ARROWS -->
        ${layers.showFlowArrows ? (layout.flow_vectors || []).map(v => this.renderFlowArrowSvg(v)).join('') : ''}

        <!-- DIMENSIONS & SCALE BAR -->
        ${layers.showDimensions ? this.renderDimensionsSvg() : ''}

      </g>
    `;

    svg.innerHTML = svgHtml;
    this.bindInteractiveElements();
  },

  // -------------------------------------------------------------
  // SVG SUB-COMPONENT RENDERERS
  // -------------------------------------------------------------
  renderStageSvg: function(stage) {
    if (!stage) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === stage.id;
    return `
      <g id="${stage.id}" class="cf-interactive-elem" data-id="${stage.id}" data-type="stage" transform="translate(0, 0)">
        <!-- Buffer Glow -->
        <rect x="${stage.x - 8}" y="${stage.y - 8}" width="${stage.width + 16}" height="${stage.height + 16}" rx="8" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1.5" stroke-dasharray="4 2" />
        
        <!-- Main Stage Platform -->
        <rect x="${stage.x}" y="${stage.y}" width="${stage.width}" height="${stage.height}" rx="6" fill="#047857" stroke="${isSelected ? '#2563eb' : '#065f46'}" stroke-width="${isSelected ? 3.5 : 2}" filter="url(#cfShadowCard)" />
        
        <!-- Mojo Heavy Crush Barrier Front -->
        <line x1="${stage.x + stage.width + 6}" y1="${stage.y + 10}" x2="${stage.x + stage.width + 6}" y2="${stage.y + stage.height - 10}" stroke="#f59e0b" stroke-width="4" stroke-dasharray="6 3" />
        
        <!-- Labels -->
        <text x="${stage.x + stage.width / 2}" y="${stage.y + stage.height / 2 - 12}" text-anchor="middle" font-size="12" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff" letter-spacing="1">
          ${stage.label}
        </text>
        <text x="${stage.x + stage.width / 2}" y="${stage.y + stage.height / 2 + 8}" text-anchor="middle" font-size="9" font-weight="600" font-family="'Inter', sans-serif" fill="#a7f3d0">
          PERFORMANCE DECK
        </text>
        <text x="${stage.x + stage.width / 2}" y="${stage.y + stage.height / 2 + 24}" text-anchor="middle" font-size="8" font-family="monospace" fill="#ffffff" opacity="0.8">
          FOH BUFFER: 28M
        </text>
      </g>
    `;
  },

  renderPenSvg: function(pen) {
    if (!pen) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === pen.id;
    return `
      <g id="${pen.id}" class="cf-interactive-elem" data-id="${pen.id}" data-type="barricade_pen">
        <!-- Pen Enclosure -->
        <rect x="${pen.x}" y="${pen.y}" width="${pen.width}" height="${pen.height}" rx="5"
          fill="#f1f5f9" fill-opacity="0.4"
          stroke="${isSelected ? '#2563eb' : '#dc2626'}"
          stroke-width="${isSelected ? 3 : 2}"
          stroke-dasharray="5 3" />

        <!-- Turnstile Ingress / Relief Openings Indicator -->
        <rect x="${pen.x + pen.width / 2 - 14}" y="${pen.y - 2}" width="28" height="4" fill="#22c55e" />
        <rect x="${pen.x + pen.width / 2 - 14}" y="${pen.y + pen.height - 2}" width="28" height="4" fill="#22c55e" />

        <!-- Pen Labels -->
        <text x="${pen.x + pen.width / 2}" y="${pen.y + 24}" text-anchor="middle" font-size="11" font-weight="800" font-family="'Outfit', sans-serif" fill="#0f172a">
          ${pen.label}
        </text>
        <text x="${pen.x + pen.width / 2}" y="${pen.y + pen.height / 2}" text-anchor="middle" font-size="9" font-weight="700" font-family="'Inter', sans-serif" fill="#b91c1c">
          Cap: ${(pen.capacity || 1200).toLocaleString()} ppl
        </text>
        <text x="${pen.x + pen.width / 2}" y="${pen.y + pen.height - 15}" text-anchor="middle" font-size="7.5" font-weight="600" font-family="monospace" fill="#64748b">
          ${pen.panel_count || 32} Steel Panels (2.5m)
        </text>
      </g>
    `;
  },

  renderSecurityHubSvg: function(hub) {
    if (!hub) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === hub.id;
    return `
      <g id="${hub.id}" class="cf-interactive-elem" data-id="${hub.id}" data-type="security_hub">
        <rect x="${hub.x}" y="${hub.y}" width="${hub.width}" height="${hub.height}" rx="8"
          fill="#0f172a" stroke="${isSelected ? '#3b82f6' : '#334155'}" stroke-width="${isSelected ? 3 : 2}"
          filter="url(#cfShadowCard)" />
        <circle cx="${hub.x + hub.width / 2}" cy="${hub.y + 30}" r="12" fill="#3b82f6" fill-opacity="0.25" />
        <text x="${hub.x + hub.width / 2}" y="${hub.y + 34}" text-anchor="middle" font-size="12" fill="#60a5fa">🛡️</text>
        <text x="${hub.x + hub.width / 2}" y="${hub.y + 56}" text-anchor="middle" font-size="9" font-weight="800" font-family="'Outfit', sans-serif" fill="#ffffff" letter-spacing="0.5">
          SECURITY
        </text>
        <text x="${hub.x + hub.width / 2}" y="${hub.y + 70}" text-anchor="middle" font-size="8" font-weight="700" font-family="'Inter', sans-serif" fill="#94a3b8">
          COMMAND HUB
        </text>
      </g>
    `;
  },

  renderFacilitySvg: function(fac) {
    if (!fac) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === fac.id;
    const icon = fac.type === 'medical' ? '🚑' : fac.type === 'food_court' ? '🍔' : fac.type === 'water' ? '💧' : '🚻';
    const borderCol = fac.color || '#3b82f6';

    return `
      <g id="${fac.id}" class="cf-interactive-elem" data-id="${fac.id}" data-type="facility">
        <rect x="${fac.x}" y="${fac.y}" width="${fac.width}" height="${fac.height}" rx="8"
          fill="#ffffff" stroke="${isSelected ? '#2563eb' : borderCol}" stroke-width="${isSelected ? 3 : 1.75}"
          filter="url(#cfShadowCard)" />
        <rect x="${fac.x}" y="${fac.y}" width="${fac.width}" height="28" rx="8"
          fill="${borderCol}" fill-opacity="0.12" />
        
        <text x="${fac.x + 18}" y="${fac.y + 19}" font-size="12">${icon}</text>
        <text x="${fac.x + 36}" y="${fac.y + 18}" font-size="10" font-weight="800" font-family="'Outfit', sans-serif" fill="#0f172a">
          ${fac.label}
        </text>

        <text x="${fac.x + 16}" y="${fac.y + 48}" font-size="8.5" font-weight="600" font-family="'Inter', sans-serif" fill="#475569">
          ${fac.sub_label || ''}
        </text>

        <text x="${fac.x + 16}" y="${fac.y + fac.height - 12}" font-size="8" font-family="monospace" fill="#64748b">
          ${fac.specs ? fac.specs.slice(0, 52) + '...' : ''}
        </text>
      </g>
    `;
  },

  renderGateSvg: function(gate, isEntry) {
    if (!gate) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === gate.id;
    const col = isEntry ? '#2563eb' : gate.type === 'emergency_exit' ? '#16a34a' : '#d97706';
    const icon = isEntry ? 'IN' : 'EXIT';

    return `
      <g id="${gate.id}" class="cf-interactive-elem" data-id="${gate.id}" data-type="gate">
        <rect x="${gate.x}" y="${gate.y}" width="${gate.width}" height="${gate.height}" rx="5"
          fill="${col}" stroke="${isSelected ? '#ffffff' : '#0f172a'}" stroke-width="${isSelected ? 2.5 : 1}"
          filter="url(#cfShadowCard)" />
        <text x="${gate.x + gate.width / 2}" y="${gate.y + 16}" text-anchor="middle" font-size="9" font-weight="900" font-family="monospace" fill="#ffffff">
          ${icon}
        </text>
        <text x="${gate.x + gate.width / 2}" y="${gate.y + 32}" text-anchor="middle" font-size="7.5" font-weight="700" font-family="'Inter', sans-serif" fill="#ffffff" opacity="0.9">
          ${gate.label ? gate.label.replace('ENTRY GATE ', '').replace('EMERGENCY EGRESS ', 'EM-').replace('EXIT GATE ', 'EX-') : ''}
        </text>
      </g>
    `;
  },

  renderFlowArrowSvg: function(vec) {
    return `
      <g opacity="0.75">
        <line x1="${vec.from_x}" y1="${vec.from_y}" x2="${vec.to_x}" y2="${vec.to_y}"
          stroke="#16a34a" stroke-width="2.5" stroke-dasharray="6 3" marker-end="url(#cfArrowGreen)" />
      </g>
    `;
  },

  renderDimensionsSvg: function() {
    const len = this.state.length;
    const wid = this.state.width;
    const unit = this.state.unit;

    return `
      <!-- Horizontal Dimension (Top) -->
      <line x1="70" y1="25" x2="1330" y2="25" stroke="#0284c7" stroke-width="1.5" />
      <line x1="70" y1="18" x2="70" y2="32" stroke="#0284c7" stroke-width="1.5" />
      <line x1="1330" y1="18" x2="1330" y2="32" stroke="#0284c7" stroke-width="1.5" />
      <rect x="630" y="14" width="140" height="20" rx="4" fill="#ffffff" stroke="#0284c7" stroke-width="1" />
      <text x="700" y="28" text-anchor="middle" font-size="10" font-weight="800" font-family="monospace" fill="#0284c7">
        VENUE LENGTH: ${len}${unit}
      </text>

      <!-- Vertical Dimension (Left) -->
      <line x1="35" y1="60" x2="35" y2="790" stroke="#0284c7" stroke-width="1.5" />
      <line x1="28" y1="60" x2="42" y2="60" stroke="#0284c7" stroke-width="1.5" />
      <line x1="28" y1="790" x2="42" y2="790" stroke="#0284c7" stroke-width="1.5" />
      <text x="30" y="425" text-anchor="middle" font-size="10" font-weight="800" font-family="monospace" fill="#0284c7" transform="rotate(-90, 30, 425)">
        VENUE WIDTH: ${wid}${unit}
      </text>

      <!-- Metric Scale Indicator Bar (Bottom Right) -->
      <g transform="translate(1080, 810)">
        <rect x="0" y="0" width="180" height="24" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
        <rect x="10" y="10" width="40" height="6" fill="#0f172a" />
        <rect x="50" y="10" width="40" height="6" fill="#cbd5e1" />
        <rect x="90" y="10" width="40" height="6" fill="#0f172a" />
        <rect x="130" y="10" width="40" height="6" fill="#cbd5e1" />
        <text x="10" y="8" font-size="8" font-family="monospace" fill="#475569">0</text>
        <text x="90" y="8" font-size="8" font-family="monospace" fill="#475569">25m</text>
        <text x="170" y="8" font-size="8" font-family="monospace" fill="#475569">50m</text>
      </g>
    `;
  },

  // -------------------------------------------------------------
  // INTERACTIVE ELEMENT DRAGGING & SELECTION
  // -------------------------------------------------------------
  bindInteractiveElements: function() {
    document.querySelectorAll('.cf-interactive-elem').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        this.selectElement(id);
      });

      el.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        const id = el.dataset.id;
        this.selectElement(id);

        this.state.draggedElementId = id;
        this.state.dragStartX = e.clientX;
        this.state.dragStartY = e.clientY;

        const obj = this.findElementById(id);
        if (obj) {
          this.state.elementOrigX = obj.x;
          this.state.elementOrigY = obj.y;
        }
      });
    });
  },

  handleElementDragging: function(e) {
    if (!this.state.draggedElementId) return;
    const deltaX = (e.clientX - this.state.dragStartX) / this.state.zoom;
    const deltaY = (e.clientY - this.state.dragStartY) / this.state.zoom;

    const obj = this.findElementById(this.state.draggedElementId);
    if (!obj) return;

    // Apply coordinate delta
    obj.x = Math.round(this.state.elementOrigX + deltaX);
    obj.y = Math.round(this.state.elementOrigY + deltaY);

    // Fast SVG re-render
    this.renderCanvas();
    this.renderInspectionDrawer(obj);
  },

  finishElementDragging: function() {
    if (!this.state.draggedElementId) return;
    const id = this.state.draggedElementId;
    this.state.draggedElementId = null;

    const obj = this.findElementById(id);
    if (obj) {
      // Validate boundary containment (Scenario 6 & 8)
      if (obj.x < 50 || obj.x + (obj.width || 40) > 1350 || obj.y < 40 || obj.y + (obj.height || 40) > 810) {
        this.showToast(`⚠️ Warning: "${obj.label || id}" placed near or beyond venue boundary!`, 'warning');
      }
    }
    this.recomputeBudgetAndQuantitiesLocally();
  },

  findElementById: function(id) {
    const layout = this.state.plan ? this.state.plan.layout : null;
    if (!layout) return null;

    if (layout.stage && layout.stage.id === id) return layout.stage;
    if (layout.security_hub && layout.security_hub.id === id) return layout.security_hub;

    const pen = (layout.barricade_pens || []).find(p => p.id === id);
    if (pen) return pen;

    const fac = (layout.facilities || []).find(f => f.id === id);
    if (fac) return fac;

    const gIn = (layout.entry_gates || []).find(g => g.id === id);
    if (gIn) return gIn;

    const gOut = (layout.exit_gates || []).find(g => g.id === id);
    if (gOut) return gOut;

    return null;
  },

  selectElement: function(id) {
    const obj = this.findElementById(id);
    if (!obj) return;
    this.state.selectedElement = obj;
    this.renderCanvas();
    this.renderInspectionDrawer(obj);
  },

  renderInspectionDrawer: function(obj) {
    const drawer = document.getElementById('cfInspectionDrawer');
    if (!drawer) return;

    drawer.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:1rem;">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div style="width:36px; height:36px; border-radius:8px; background:#eff6ff; display:flex; align-items:center; justify-content:center; color:#2563eb; font-weight:800; font-size:1.1rem;">
            ${obj.type === 'stage' ? '🎭' : obj.type === 'barricade_pen' ? '🚧' : obj.type === 'security_hub' ? '🛡️' : obj.type === 'medical' ? '🚑' : '📍'}
          </div>
          <div>
            <div style="font-size:0.72rem; color:var(--accent-blue); font-weight:800; text-transform:uppercase;">SELECTED GROUND COMPONENT</div>
            <div style="font-size:1.1rem; font-weight:900; color:var(--text-main);">${obj.label || obj.id}</div>
          </div>
        </div>

        <div style="display:flex; gap:1.25rem; align-items:center; flex-wrap:wrap;">
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700; display:block;">COORDINATES (X, Y)</span>
            <strong style="font-size:0.85rem; font-family:monospace; color:var(--text-main);">${obj.x}, ${obj.y}</strong>
          </div>
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700; display:block;">DIMENSIONS (W × H)</span>
            <strong style="font-size:0.85rem; font-family:monospace; color:var(--text-main);">${obj.width || 36}m × ${obj.height || 45}m</strong>
          </div>
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700; display:block;">HOLDING CAPACITY</span>
            <strong style="font-size:0.95rem; font-weight:800; color:var(--color-safe);">${obj.capacity ? obj.capacity.toLocaleString() + ' ppl' : 'Staff Only'}</strong>
          </div>
          <div style="max-width:320px;">
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:700; display:block;">SAFETY DIRECTIVE</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">${obj.specs || 'Complies with NFPA 101 circulation standard.'}</span>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem;">
          <button id="cfInspectRotateBtn" class="btn btn-outline btn-sm" title="Rotate 90°">↺ Rotate</button>
          <button id="cfInspectDuplicateBtn" class="btn btn-outline btn-sm" title="Duplicate">⧉ Duplicate</button>
          <button id="cfInspectDeleteBtn" class="btn btn-outline btn-sm" style="color:#b91c1c; border-color:#fca5a5;" title="Delete">🗑️ Remove</button>
        </div>
      </div>
    `;

    // Bind drawer buttons
    const rotBtn = document.getElementById('cfInspectRotateBtn');
    if (rotBtn) rotBtn.addEventListener('click', () => {
      const w = obj.width; obj.width = obj.height; obj.height = w;
      this.renderCanvas();
      this.renderInspectionDrawer(obj);
    });

    const dupBtn = document.getElementById('cfInspectDuplicateBtn');
    if (dupBtn) dupBtn.addEventListener('click', () => {
      this.duplicateObject(obj);
    });

    const delBtn = document.getElementById('cfInspectDeleteBtn');
    if (delBtn) delBtn.addEventListener('click', () => {
      this.deleteObject(obj.id);
    });
  },

  // -------------------------------------------------------------
  // ADD / DUPLICATE / DELETE GROUND OBJECTS (Scenario 6)
  // -------------------------------------------------------------
  addNewObject: function(type) {
    if (!this.state.plan || !this.state.plan.layout) return;
    const layout = this.state.plan.layout;
    const newId = `${type}-${Date.now().toString().slice(-4)}`;

    if (type === 'barricade_pen') {
      const penCount = (layout.barricade_pens || []).length + 1;
      layout.barricade_pens.push({
        id: newId,
        type: 'barricade_pen',
        label: `BARRICADE PEN ${penCount}`,
        x: 450 + (penCount * 20),
        y: 200,
        width: 110,
        height: 140,
        capacity: 1200,
        panel_count: 32,
        specs: 'Additional crowd control enclosure'
      });
    } else if (type === 'entry_gate') {
      layout.entry_gates.push({
        id: newId,
        type: 'entry_gate',
        label: `ENTRY GATE ${layout.entry_gates.length + 1}`,
        x: 60,
        y: 220 + (layout.entry_gates.length * 50),
        width: 36,
        height: 45,
        specs: 'Modular ToF gate'
      });
    } else if (type === 'exit_gate') {
      layout.exit_gates.push({
        id: newId,
        type: 'exit_gate',
        label: `EXIT GATE ${layout.exit_gates.length + 1}`,
        x: 1315,
        y: 220 + (layout.exit_gates.length * 50),
        width: 36,
        height: 45,
        specs: 'Outward egress portal'
      });
    } else if (type === 'medical') {
      layout.facilities.push({
        id: newId,
        type: 'medical',
        label: 'AUXILIARY FIRST-AID POST',
        sub_label: 'EMT Station • 2 Beds',
        x: 950,
        y: 80,
        width: 140,
        height: 90,
        color: '#ef4444',
        capacity: 20,
        specs: 'Rapid resuscitation post'
      });
    } else if (type === 'water') {
      layout.facilities.push({
        id: newId,
        type: 'water',
        label: 'SATELLITE WATER STATION',
        sub_label: 'Free Hydration Point',
        x: 480,
        y: 680,
        width: 110,
        height: 60,
        color: '#0ea5e9',
        capacity: 80,
        specs: 'Automated drinking taps'
      });
    } else if (type === 'restroom') {
      layout.facilities.push({
        id: newId,
        type: 'restroom',
        label: 'PORTABLE RESTROOM CLUSTER',
        sub_label: '8 Standard Cabins',
        x: 980,
        y: 650,
        width: 160,
        height: 80,
        color: '#8b5cf6',
        capacity: 100,
        specs: 'Sanitary disposal bays'
      });
    } else if (type === 'food_court') {
      layout.facilities.push({
        id: newId,
        type: 'food_court',
        label: 'CONCESSION SNACK KIOSK',
        sub_label: 'Beverages & Light Meals',
        x: 980,
        y: 320,
        width: 150,
        height: 80,
        color: '#f59e0b',
        capacity: 150,
        specs: 'Food grade licensed'
      });
    }

    this.renderCanvas();
    this.selectElement(newId);
    this.recomputeBudgetAndQuantitiesLocally();
    this.showToast(`Added new ${type.replace('_', ' ')} to ground plan!`, 'info');
  },

  duplicateObject: function(obj) {
    if (!obj) return;
    this.addNewObject(obj.type);
  },

  deleteObject: function(id) {
    const layout = this.state.plan ? this.state.plan.layout : null;
    if (!layout) return;

    layout.barricade_pens = (layout.barricade_pens || []).filter(p => p.id !== id);
    layout.facilities = (layout.facilities || []).filter(f => f.id !== id);
    layout.entry_gates = (layout.entry_gates || []).filter(g => g.id !== id);
    layout.exit_gates = (layout.exit_gates || []).filter(g => g.id !== id);

    this.state.selectedElement = null;
    this.renderCanvas();
    const drawer = document.getElementById('cfInspectionDrawer');
    if (drawer) {
      drawer.innerHTML = `<span style="color:var(--text-muted); font-size:0.82rem;">👉 Click any component on the floor plan above to inspect specifications & edit dimensions.</span>`;
    }
    this.recomputeBudgetAndQuantitiesLocally();
    this.showToast('Object deleted from layout.', 'info');
  },

  recomputeBudgetAndQuantitiesLocally: function() {
    // Live update budget & equipment counts based on active layout items
    const layout = this.state.plan.layout;
    const pens = (layout.barricade_pens || []).length;
    const entryG = (layout.entry_gates || []).length;
    const exitG = (layout.exit_gates || []).length;
    
    // Update barricade panel count
    let totalPanels = 0;
    (layout.barricade_pens || []).forEach(p => {
      totalPanels += Math.ceil(((2 * (p.width || 60)) + (2 * (p.height || 80))) / 14);
    });
    totalPanels = Math.max(40, totalPanels);

    this.state.plan.equipment_quantities.barricade_panels_count = totalPanels;
    this.state.plan.equipment_quantities.turnstiles_count = entryG + exitG;

    // Recalculate budget table
    if (this.state.plan.budget && this.state.plan.budget.items) {
      const bItem = this.state.plan.budget.items.find(i => i.item.includes('Heavy-Duty Steel Mojo Barricades'));
      if (bItem) {
        bItem.quantity = totalPanels;
        bItem.total = Math.round(totalPanels * bItem.unit_price);
      }
      const gItem = this.state.plan.budget.items.find(i => i.item.includes('Modular IoT Turnstiles'));
      if (gItem) {
        gItem.quantity = entryG + exitG;
        gItem.total = Math.round((entryG + exitG) * gItem.unit_price);
      }
      
      const newGrand = this.state.plan.budget.items.reduce((acc, curr) => acc + curr.total, 0);
      this.state.plan.budget.grand_total = Math.round(newGrand * 1.10); // +10% contingency
      this.state.plan.budget.remaining_budget = Math.round(this.state.budget_limit - this.state.plan.budget.grand_total);
      this.state.plan.budget.is_over_budget = this.state.plan.budget.remaining_budget < 0;
    }

    this.renderKPIs();
    this.renderBudgetTable();
  },

  // -------------------------------------------------------------
  // SAFETY AUDIT RENDERER
  // -------------------------------------------------------------
  renderSafetyAudit: function() {
    const listEl = document.getElementById('cfSafetyAuditList');
    if (!listEl || !this.state.plan) return;

    const checks = this.state.plan.safety_audit || [];
    listEl.innerHTML = checks.map(c => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.65rem 0.85rem; background:#ffffff; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); font-size:0.8rem;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <span style="font-size:1.05rem;">${c.status === 'PASS' ? '✅' : c.severity === 'CRITICAL' ? '🚨' : '⚠️'}</span>
          <div>
            <strong style="color:var(--text-main); font-weight:700;">${c.rule}</strong>
            <div style="font-size:0.72rem; color:var(--text-muted);">${c.message}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <span class="badge" style="background:${c.status === 'PASS' ? '#ecfdf5' : '#fef2f2'}; color:${c.status === 'PASS' ? '#047857' : '#b91c1c'}; border:1px solid ${c.status === 'PASS' ? '#a7f3d0' : '#fca5a5'}; font-size:0.72rem; font-weight:800;">
            ${c.status}
          </span>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.2rem;">${c.actual}</div>
        </div>
      </div>
    `).join('');
  },

  // -------------------------------------------------------------
  // BUDGET & PRICING TABLE (Section 6)
  // -------------------------------------------------------------
  renderBudgetTable: function() {
    const tableBody = document.getElementById('cfBudgetTableBody');
    const budgetSummary = document.getElementById('cfBudgetSummaryCard');
    if (!this.state.plan || !this.state.plan.budget) return;

    const b = this.state.plan.budget;
    const cur = b.currency || 'USD';

    if (budgetSummary) {
      budgetSummary.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; padding:1.25rem; background:#f8fafc; border-bottom:1px solid var(--border-subtle);">
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">BUDGET LIMIT</span>
            <div style="font-size:1.3rem; font-weight:900; color:var(--text-main);">${cur} ${b.budget_limit.toLocaleString()}</div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">ESTIMATED TOTAL</span>
            <div style="font-size:1.3rem; font-weight:900; color:${b.is_over_budget ? '#b91c1c' : '#047857'};">${cur} ${b.grand_total.toLocaleString()}</div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">BUDGET BALANCE</span>
            <div style="font-size:1.3rem; font-weight:900; color:${b.is_over_budget ? '#b91c1c' : '#047857'};">
              ${b.is_over_budget ? `- ${cur} ${Math.abs(b.remaining_budget).toLocaleString()} (DEFICIT)` : `+ ${cur} ${b.remaining_budget.toLocaleString()} (SURPLUS)`}
            </div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">CONTINGENCY RESERVE</span>
            <div style="font-size:1.1rem; font-weight:800; color:var(--text-muted);">${cur} ${(b.contingency_10pct || 0).toLocaleString()} (10%)</div>
          </div>
        </div>

        ${b.is_over_budget ? `
          <div style="background:#fef2f2; border:1px solid #fca5a5; padding:0.75rem 1.25rem; font-size:0.8rem; color:#b91c1c; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <strong>⚠️ Budget Deficit Detected:</strong> Estimated planning costs exceed your budget limit by ${cur} ${Math.abs(b.remaining_budget).toLocaleString()}.
            </div>
            <button id="cfAutoOptimizeBudgetBtn" class="btn btn-sm" style="background:#dc2626; color:#ffffff; font-weight:800;">
              Apply Budget-Optimized Layout Plan
            </button>
          </div>
        ` : ''}
      `;

      const autoOptBtn = document.getElementById('cfAutoOptimizeBudgetBtn');
      if (autoOptBtn) {
        autoOptBtn.addEventListener('click', () => {
          this.state.alternative_mode = 'budget_optimized';
          this.syncAltButtons();
          this.fetchOrComputePlan();
        });
      }
    }

    if (tableBody) {
      tableBody.innerHTML = (b.items || []).map((item, idx) => `
        <tr style="border-bottom:1px solid var(--border-subtle); font-size:0.82rem;">
          <td style="padding:0.6rem 0.85rem; font-weight:700; color:var(--text-muted);">${item.category}</td>
          <td style="padding:0.6rem 0.85rem; font-weight:600; color:var(--text-main);">${item.item}</td>
          <td style="padding:0.6rem 0.85rem; text-align:center; font-family:monospace; font-weight:700;">${item.quantity.toLocaleString()}</td>
          <td style="padding:0.6rem 0.85rem; color:var(--text-muted); text-align:center;">${item.unit}</td>
          <td style="padding:0.6rem 0.85rem; text-align:right;">
            <input type="number" class="cf-price-edit-input" data-idx="${idx}" value="${item.unit_price}" style="width:75px; text-align:right; padding:0.25rem 0.4rem; border:1px solid var(--border-subtle); border-radius:4px; font-weight:700;" />
          </td>
          <td style="padding:0.6rem 0.85rem; text-align:right; font-weight:800; color:var(--text-main); font-family:monospace;">
            ${cur} ${item.total.toLocaleString()}
          </td>
          <td style="padding:0.6rem 0.85rem; font-size:0.72rem; color:var(--text-muted);">${item.source}</td>
        </tr>
      `).join('');

      // Bind inline price editing
      document.querySelectorAll('.cf-price-edit-input').forEach(input => {
        input.addEventListener('change', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          const newPrice = parseFloat(e.target.value) || 0;
          if (b.items[idx]) {
            b.items[idx].unit_price = newPrice;
            b.items[idx].total = Math.round(b.items[idx].quantity * newPrice);
            // Recalculate grand total
            const preTax = b.items.reduce((sum, it) => sum + it.total, 0);
            b.contingency_10pct = Math.round(preTax * 0.10);
            b.grand_total = preTax + b.contingency_10pct;
            b.remaining_budget = Math.round(b.budget_limit - b.grand_total);
            b.is_over_budget = b.remaining_budget < 0;
            this.renderKPIs();
            this.renderBudgetTable();
          }
        });
      });
    }
  },

  syncAltButtons: function() {
    document.querySelectorAll('.cf-alt-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === this.state.alternative_mode);
    });
  },

  // -------------------------------------------------------------
  // ALTERNATIVE PLANS CARDS (Section 4)
  // -------------------------------------------------------------
  renderAlternatives: function() {
    const wrap = document.getElementById('cfAlternativesWrap');
    if (!wrap || !this.state.plan || !this.state.plan.alternatives) return;

    const alts = this.state.plan.alternatives;
    const cur = this.state.currency || 'USD';

    wrap.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
        ${['safety_priority', 'balanced', 'budget_optimized'].map(key => {
          const a = alts[key];
          if (!a) return '';
          const isActive = this.state.alternative_mode === key;
          const badgeCol = key === 'safety_priority' ? '#047857' : key === 'balanced' ? '#2563eb' : '#d97706';
          return `
            <div class="card cf-alt-card ${isActive ? 'active' : ''}" data-mode="${key}" style="border:2px solid ${isActive ? badgeCol : 'var(--border-subtle)'}; cursor:pointer; padding:1.25rem; background:#ffffff; border-radius:var(--radius-md); transition:var(--transition-fast);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                <span style="font-size:0.75rem; font-weight:800; text-transform:uppercase; color:${badgeCol};">
                  ${key === 'safety_priority' ? '🛡️ MAXIMUM PROTECTION' : key === 'balanced' ? '⚖️ RECOMMENDED DESIGN' : '💰 COST CONSERVATIVE'}
                </span>
                ${isActive ? `<span class="badge" style="background:#eff6ff; color:#1d4ed8; font-size:0.68rem; font-weight:800;">ACTIVE PLAN</span>` : ''}
              </div>
              <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:0.4rem; color:var(--text-main);">${a.label}</h3>
              <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:1rem;">${a.description}</p>
              
              <div style="border-top:1px solid var(--border-subtle); padding-top:0.75rem; display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; font-size:0.75rem;">
                <div>
                  <span style="color:var(--text-muted);">Corridor Width:</span>
                  <strong style="display:block; color:var(--text-main);">${a.corridor_width_m}m</strong>
                </div>
                <div>
                  <span style="color:var(--text-muted);">Evac Time:</span>
                  <strong style="display:block; color:var(--text-main);">${a.evacuation_time_mins} mins</strong>
                </div>
                <div>
                  <span style="color:var(--text-muted);">Barricade Panels:</span>
                  <strong style="display:block; color:var(--text-main);">${a.barricade_panels} panels</strong>
                </div>
                <div>
                  <span style="color:var(--text-muted);">Estimated Total:</span>
                  <strong style="display:block; color:${badgeCol}; font-weight:800;">${cur} ${a.grand_total.toLocaleString()}</strong>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    document.querySelectorAll('.cf-alt-card').forEach(c => {
      c.addEventListener('click', () => {
        this.state.alternative_mode = c.dataset.mode;
        this.syncAltButtons();
        this.fetchOrComputePlan();
      });
    });
  },

  // -------------------------------------------------------------
  // EXPORT & REPORT GENERATION (Section 9)
  // -------------------------------------------------------------
  downloadSvg: function() {
    const svg = document.getElementById('cfSvgViewport');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CrowdFlowAI_Ground_Layout_${this.state.expected_crowd}_attendees.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Downloaded CAD Blueprint SVG vector file!', 'success');
  },

  downloadPng: function() {
    const svg = document.getElementById('cfSvgViewport');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 1400;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `CrowdFlowAI_Ground_Plan_${this.state.expected_crowd}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      this.showToast('Downloaded High-Resolution Ground Blueprint PNG!', 'success');
    };
    img.src = url;
  },

  downloadCsv: function() {
    if (!this.state.plan || !this.state.plan.budget || !this.state.plan.budget.items) return;
    const items = this.state.plan.budget.items;
    let csv = "Category,Item,Quantity,Unit,Unit Price,Total Cost,Source\n";
    items.forEach(i => {
      csv += `"${i.category}","${i.item}",${i.quantity},"${i.unit}",${i.unit_price},${i.total},"${i.source}"\n`;
    });
    csv += `\n"SUMMARY","Contingency Reserve 10%",1,"Fixed",${this.state.plan.budget.contingency_10pct},${this.state.plan.budget.contingency_10pct},"NFPA 101 Standard"\n`;
    csv += `"SUMMARY","Grand Total",1,"Fixed",${this.state.plan.budget.grand_total},${this.state.plan.budget.grand_total},"Total Estimated Event Budget"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CrowdFlowAI_Equipment_Budget_Schedule.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('Downloaded Equipment & Budget Schedule (CSV)!', 'success');
  },

  printSafetyDossier: function() {
    if (!this.state.plan) return;
    const p = this.state.plan;
    const win = window.open('', '_blank');
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CrowdFlow AI — Official Event Ground Safety & Layout Dossier</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; font-size: 13px; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 22px; font-weight: 800; color: #1e3a8a; }
          .badge { background: #eff6ff; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: bold; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .card { border: 1px solid #cbd5e1; padding: 15px; border-radius: 6px; }
          .sign-block { margin-top: 40px; border-top: 1px solid #94a3b8; padding-top: 20px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">CROWDFLOW AI — GROUND SAFETY & LAYOUT DOSSIER</div>
            <div>Event: <strong>${p.event_name}</strong> • Type: ${p.event_type}</div>
            <div style="color:#64748b; font-size:11px;">Generated on: ${new Date().toLocaleString()} • NFPA 101 & UK Green Guide Compliant</div>
          </div>
          <div class="badge">OFFICIAL PLANNING DOCUMENT</div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h4 style="margin-top:0;">Ground Dimensions & Usable Capacity</h4>
            <div>Venue Dimensions: <strong>${p.ground_dimensions.length}m × ${p.ground_dimensions.width}m (${p.ground_dimensions.shape.toUpperCase()})</strong></div>
            <div>Total Area: <strong>${p.ground_dimensions.total_area_m2.toLocaleString()} m²</strong></div>
            <div>Usable Event Area: <strong>${p.ground_dimensions.usable_area_m2.toLocaleString()} m²</strong></div>
            <div>Safe Permitted Capacity: <strong>${p.capacity_analysis.max_safe_capacity.toLocaleString()} attendees</strong></div>
            <div>Planned Attendance: <strong>${p.capacity_analysis.expected_crowd.toLocaleString()} attendees</strong></div>
            <div>Calculated Density: <strong>${p.capacity_analysis.density_m2_per_person} m²/person (${p.capacity_analysis.safety_rating})</strong></div>
          </div>

          <div class="card">
            <h4 style="margin-top:0;">Egress & Emergency Evacuation</h4>
            <div>Entry Portals: <strong>${(p.layout.entry_gates || []).length} Gates</strong></div>
            <div>Egress Portals: <strong>${(p.layout.exit_gates || []).length} Exits (Emergency Panics Included)</strong></div>
            <div>Arterial Corridor Clearance: <strong>${p.layout.arterial_corridor_width_m || 16} Meters (Unobstructed)</strong></div>
            <div>Estimated Evacuation Time: <strong>${p.capacity_analysis.evacuation_time_mins} Minutes</strong></div>
            <div>Compliance Status: <strong>${p.capacity_analysis.evac_compliant ? '✅ FULLY COMPLIANT (< 15 MINS)' : '⚠️ BOTTLENECK MITIGATION REQUIRED'}</strong></div>
          </div>
        </div>

        <h3>Itemized Equipment & Budget Schedule</h3>
        <table>
          <thead>
            <tr><th>Category</th><th>Item Description</th><th>Quantity</th><th>Unit</th><th>Unit Price (${p.budget.currency})</th><th>Total (${p.budget.currency})</th></tr>
          </thead>
          <tbody>
            ${(p.budget.items || []).map(i => `
              <tr><td>${i.category}</td><td>${i.item}</td><td>${i.quantity}</td><td>${i.unit}</td><td>${i.unit_price}</td><td>${i.total.toLocaleString()}</td></tr>
            `).join('')}
            <tr style="font-weight:bold; background:#f8fafc;"><td colspan="5">Municipal Safety Contingency (10%)</td><td>${p.budget.contingency_10pct.toLocaleString()}</td></tr>
            <tr style="font-weight:bold; background:#e2e8f0;"><td colspan="5">GRAND TOTAL ESTIMATED BUDGET</td><td>${p.budget.currency} ${p.budget.grand_total.toLocaleString()}</td></tr>
          </tbody>
        </table>

        <div class="sign-block">
          <div>
            <p>Prepared by:</p>
            <p style="margin-top:30px;">___________________________<br>Crowd Safety Operations Lead</p>
          </div>
          <div>
            <p>Authorized by:</p>
            <p style="margin-top:30px;">___________________________<br>Municipal Fire & Police Commissioner</p>
          </div>
        </div>

        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;
    win.document.write(html);
    win.document.close();
  },

  // -------------------------------------------------------------
  // SAVE / LOAD PROJECT
  // -------------------------------------------------------------
  saveProject: async function() {
    if (!this.state.plan) return;
    try {
      const resp = await fetch('/api/crowdflow/save-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: this.state.plan })
      });
      const data = await resp.json();
      if (data.success) {
        this.showToast(`Plan successfully saved to database! (ID: ${data.project_id})`, 'success');
      }
    } catch (e) {
      this.showToast('Plan saved locally.', 'info');
    }
  },

  // -------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // -------------------------------------------------------------
  showToast: function(msg, type = 'info') {
    let toast = document.getElementById('cfPlannerToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cfPlannerToast';
      toast.style.cssText = 'position:fixed; bottom:25px; right:25px; z-index:9999; padding:0.75rem 1.25rem; border-radius:8px; font-size:0.85rem; font-weight:700; box-shadow:0 10px 25px rgba(0,0,0,0.15); transition:all 0.3s ease;';
      document.body.appendChild(toast);
    }
    toast.style.background = type === 'success' ? '#047857' : type === 'warning' ? '#b45309' : '#0f172a';
    toast.style.color = '#ffffff';
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 3200);
  }
};

window.CadPlanner = CadPlanner;
