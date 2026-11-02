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
    budget_limit: 4250000,
    currency: 'INR',
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

    // Pathway Drawing & Editing on CAD
    showPathways: true,
    pathwayEditMode: false,
    activeRouteKey: 'C',
    pwAddPointMode: true,
    cadPathways: {
      'C': [],
      'B': [],
      'A': [],
      'EMERGENCY': []
    },
    isDraggingWaypoint: false,
    draggedWaypointIndex: null,
    draggedWaypointRoute: null,

    // Google Maps API Ground Underlay Layer
    showGoogleMaps: true,
    googleMapType: 'satellite', // 'satellite', 'hybrid', 'roadmap'
    cadBlendOpacity: 0.75,
    mapInteractionMode: 'cad', // 'cad' (edit CAD layout) or 'map' (pan satellite ground)
    isSpacePressed: false,
    mapRotationDeg: 0,
    cadRotationDeg: 0,
    svgDarkness: 0.55, // 0.0 to 0.85 (darkness / contrast scrim)
    textRotationMode: 'auto', // 'auto' (turns based on CAD rotation to stay upright), 'cad' (locked to CAD layout)
    textRotationOffset: 0, // 0, 90, 180, 270 (additional manual turn offset)
    mapSaturation: 1.6,
    mapContrast: 1.25,
    mapBrightness: 1.05,
    isMapDragging: false,
    mapDragLastX: 0,
    mapDragLastY: 0,

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

  pathwayMeta: {
    'C': { name: 'Route C — Express Walkway', color: '#10b981', glow: '#34d399', strokeWidth: 5.5, strokeDash: '', gateLabel: 'Gate C (Express)', exitLabel: 'Exit EX-1 (North Egress)', icon: '🟢', bg: '#059669', badgeBg: '#047857' },
    'B': { name: 'Route B — Secondary Walkway', color: '#f59e0b', glow: '#fbbf24', strokeWidth: 5.5, strokeDash: '', gateLabel: 'Gate B (Secondary)', exitLabel: 'Exit EX-2 (Mid Egress)', icon: '🟡', bg: '#d97706', badgeBg: '#78350f' },
    'A': { name: 'Route A — Main Entrance', color: '#ef4444', glow: '#f87171', strokeWidth: 5.5, strokeDash: '', gateLabel: 'Gate A (Main Entrance)', exitLabel: 'Exit EX-4 (South Egress)', icon: '🔴', bg: '#dc2626', badgeBg: '#7f1d1d' },
    'EMERGENCY': { name: 'Emergency SOS Egress', color: '#dc2626', glow: '#ef4444', strokeWidth: 6, strokeDash: '8 4', gateLabel: 'SOS Evacuation Corridor', exitLabel: 'SOS Exit (EX-1)', icon: '🚨', bg: '#e11d48', badgeBg: '#881337' }
  },

  init: function() {
    this.bindControls();
    this.bindPanZoom();
    this.bindImageUpload();

    const gm = window.GoogleMapsManager;
    const vid = gm ? (gm.currentVenueId || 'sona-college') : 'sona-college';
    const v = gm && gm.venueConfigs ? (gm.venueConfigs[vid] || gm.venueConfigs['sona-college']) : null;
    let savedMapRot = v && v.mapRotationDeg !== undefined ? v.mapRotationDeg : 0;
    let savedCadRot = 0;
    try {
      const mr = localStorage.getItem('cad_map_rot_' + vid);
      if (mr !== null) savedMapRot = parseInt(mr, 10) || 0;
      const cr = localStorage.getItem('cad_layout_rot_' + vid);
      if (cr !== null) savedCadRot = parseInt(cr, 10) || 0;
    } catch(e) {}

    this.state.mapRotationDeg = savedMapRot;
    this.state.cadRotationDeg = savedCadRot;

    this.loadCadPathways();
    this.saveCadPathways(false);
    this.fetchOrComputePlan();
    this.setCadRotation(savedCadRot, false);
    this.setMapRotation(savedMapRot, false);
  },

  // -------------------------------------------------------------
  // EVENT BINDINGS
  // -------------------------------------------------------------
  toggleBarricadeLimitSimulation: function(penId) {
    const layout = this.state.plan ? this.state.plan.layout : null;
    if (!layout || !layout.barricade_pens || !layout.barricade_pens.length) {
      this.showToast('No barricade pens in current layout', 'warning');
      return;
    }

    const pen = penId ? layout.barricade_pens.find(p => p.id === penId) : layout.barricade_pens[0];
    if (!pen) return;

    const cap = pen.capacity || 1200;
    const isExceeded = (pen.current_occupancy > cap) || pen.is_limit_exceeded;

    if (isExceeded) {
      pen.current_occupancy = Math.round(cap * 0.75);
      pen.is_limit_exceeded = false;
      this.showToast(`✅ Barricade "${pen.label}" restored to normal capacity (${pen.current_occupancy} ppl). Standard pathway restored!`, 'success');
    } else {
      pen.current_occupancy = Math.round(cap * 1.15);
      pen.is_limit_exceeded = true;
      this.showToast(`🚨 Barricade "${pen.label}" LIMIT EXCEEDED (115%)! Barrier altered & pathway dynamically rerouted!`, 'error');
    }

    // Update pathways to connect or alter around barricade
    this.state.cadPathways = this.getDefaultCadPathways();
    this.renderCanvas();
    if (this.state.selectedElement && this.state.selectedElement.id === pen.id) {
      this.renderInspectionDrawer(pen);
    }
    this.saveCadPathways(true);

    // Sync button text
    const btn = document.getElementById('cfSimulateBarricadeLimitBtn');
    if (btn) {
      btn.innerHTML = pen.is_limit_exceeded ? '🚨 Barricade Limit Exceeded (Altered Route Active)' : '⚡ Barricade Limit: Normal';
      btn.style.color = pen.is_limit_exceeded ? '#dc2626' : '#b45309';
      btn.style.background = pen.is_limit_exceeded ? '#fee2e2' : 'transparent';
    }
  },

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

    const currencySelect = document.getElementById('cfCurrencySelect');
    const currencyHeaderSelect = document.getElementById('cfCurrencySelectHeader');

    const onCurrencyChange = (newCurrency) => {
      if (this.state.currency === newCurrency) return;
      const oldCurrency = this.state.currency;
      this.state.currency = newCurrency;
      if (currencySelect) currencySelect.value = newCurrency;
      if (currencyHeaderSelect) currencyHeaderSelect.value = newCurrency;

      // Update Budget Limit label
      const budgetLabel = document.getElementById('cfBudgetLimitLabel');
      const symbols = { 'INR': '₹', 'USD': '$', 'EUR': '€' };
      const curSym = symbols[newCurrency] || newCurrency;
      if (budgetLabel) {
        budgetLabel.textContent = `BUDGET LIMIT (${newCurrency} ${curSym})`;
      }

      // Convert current budget limit appropriately
      const rates = { 'USD': 1.0, 'INR': 85.0, 'EUR': 0.92 };
      const fromRate = rates[oldCurrency] || 1.0;
      const toRate = rates[newCurrency] || 1.0;
      if (budgetInput && this.state.budget_limit) {
        const converted = Math.round((this.state.budget_limit / fromRate) * toRate);
        this.state.budget_limit = converted;
        budgetInput.value = converted;
      }

      // Clear custom edited prices when switching currency so engine recalculates in target currency
      this.state.customUnitPrices = {};
      this.fetchOrComputePlan();
    };

    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => onCurrencyChange(e.target.value));
    }
    if (currencyHeaderSelect) {
      currencyHeaderSelect.addEventListener('change', (e) => onCurrencyChange(e.target.value));
    }

    if (budgetInput) {
      budgetInput.addEventListener('input', (e) => {
        this.state.budget_limit = Math.max(100, parseFloat(e.target.value) || 4250000);
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

    // HUD Map Toggle Button
    const hudMapToggleBtn = document.getElementById('cfHudMapToggleBtn');
    if (hudMapToggleBtn) {
      hudMapToggleBtn.addEventListener('click', () => {
        this.toggleGoogleMaps();
      });
    }

    // Google Maps API Layer Toggle
    const gmapsLayerBtn = document.getElementById('cfLayerGoogleMaps');
    if (gmapsLayerBtn) {
      gmapsLayerBtn.addEventListener('click', () => {
        this.toggleGoogleMaps();
      });
    }

    // Direct Load Google Maps Ground Button in Column 2
    const directMapsBtn = document.getElementById('cfLoadGoogleMapsDirectBtn');
    if (directMapsBtn) {
      directMapsBtn.addEventListener('click', () => {
        this.toggleGoogleMaps(true);
        this.showToast('Loaded Real Venue Ground via Google Maps API', 'info');
      });
    }

    // CAD Blend Opacity Slider
    const blendSlider = document.getElementById('cfCadBlendSlider');
    if (blendSlider) {
      blendSlider.addEventListener('input', (e) => {
        this.state.cadBlendOpacity = parseFloat(e.target.value);
        this.renderCanvas();
      });
    }

    // Map Interaction Mode Switchers (Edit CAD vs Drag Google Map)
    const modeEditCadBtn = document.getElementById('cfModeEditCadBtn');
    if (modeEditCadBtn) {
      modeEditCadBtn.addEventListener('click', () => {
        this.setMapInteractionMode('cad');
      });
    }

    const modeDragMapBtn = document.getElementById('cfModeDragMapBtn');
    if (modeDragMapBtn) {
      modeDragMapBtn.addEventListener('click', () => {
        this.setMapInteractionMode('map');
      });
    }

    const hudDragMapBtn = document.getElementById('cfHudDragMapBtn');
    if (hudDragMapBtn) {
      hudDragMapBtn.addEventListener('click', () => {
        const nextMode = this.state.mapInteractionMode === 'map' ? 'cad' : 'map';
        this.setMapInteractionMode(nextMode);
      });
    }

    const floatingDragMapBtn = document.getElementById('cfFloatingDragMapBtn');
    if (floatingDragMapBtn) {
      floatingDragMapBtn.addEventListener('click', () => {
        const nextMode = this.state.mapInteractionMode === 'map' ? 'cad' : 'map';
        this.setMapInteractionMode(nextMode);
      });
    }

    // Directional Nudge Map Buttons (Rotation-Aware)
    const panUpBtn = document.getElementById('cfPanMapUpBtn');
    if (panUpBtn) panUpBtn.addEventListener('click', () => this.panMapByOffset(0, -60));

    const panDownBtn = document.getElementById('cfPanMapDownBtn');
    if (panDownBtn) panDownBtn.addEventListener('click', () => this.panMapByOffset(0, 60));

    const panLeftBtn = document.getElementById('cfPanMapLeftBtn');
    if (panLeftBtn) panLeftBtn.addEventListener('click', () => this.panMapByOffset(-60, 0));

    const panRightBtn = document.getElementById('cfPanMapRightBtn');
    if (panRightBtn) panRightBtn.addEventListener('click', () => this.panMapByOffset(60, 0));

    // Satellite Map Rotation Controls
    const mapRotateCcwBtn = document.getElementById('cfMapRotateCcwBtn');
    if (mapRotateCcwBtn) mapRotateCcwBtn.addEventListener('click', () => this.rotateMapBy(-90));

    const mapRotateCwBtn = document.getElementById('cfMapRotateCwBtn');
    if (mapRotateCwBtn) mapRotateCwBtn.addEventListener('click', () => this.rotateMapBy(90));

    const mapRotateResetBtn = document.getElementById('cfMapRotateResetBtn');
    if (mapRotateResetBtn) mapRotateResetBtn.addEventListener('click', () => this.setMapRotation(0));

    const mapRotSlider = document.getElementById('cfMapRotationContinuousSlider');
    if (mapRotSlider) {
      mapRotSlider.addEventListener('input', (e) => {
        this.setMapRotation(Number(e.target.value));
      });
    }

    const floatingMapRotateBtn = document.getElementById('cfFloatingMapRotateBtn');
    if (floatingMapRotateBtn) {
      floatingMapRotateBtn.addEventListener('click', () => this.rotateMapBy(90));
    }

    // CAD Layout Rotation Controls
    const cadRotateCcwBtn = document.getElementById('cfRotateCcwBtn');
    if (cadRotateCcwBtn) cadRotateCcwBtn.addEventListener('click', () => this.rotateCadBy(-90));

    const cadRotateCwBtn = document.getElementById('cfRotateCwBtn');
    if (cadRotateCwBtn) cadRotateCwBtn.addEventListener('click', () => this.rotateCadBy(90));

    const cadRotateResetBtn = document.getElementById('cfRotateResetBtn');
    if (cadRotateResetBtn) cadRotateResetBtn.addEventListener('click', () => this.setCadRotation(0));

    const cadRotSlider = document.getElementById('cfMapRotationSlider');
    if (cadRotSlider) {
      cadRotSlider.addEventListener('input', (e) => {
        this.setCadRotation(Number(e.target.value));
      });
    }

    const floatingRotateBtn = document.getElementById('cfFloatingRotateBtn');
    if (floatingRotateBtn) {
      floatingRotateBtn.addEventListener('click', () => this.rotateCadBy(90));
    }

    // Text Orientation Controls
    const textAutoBtn = document.getElementById('cfTextAutoBtn');
    if (textAutoBtn) textAutoBtn.addEventListener('click', () => this.setTextRotationMode('auto'));

    const textTurn90Btn = document.getElementById('cfTextTurn90Btn');
    if (textTurn90Btn) textTurn90Btn.addEventListener('click', () => this.rotateTextBy(90));

    const textCadLockBtn = document.getElementById('cfTextCadLockBtn');
    if (textCadLockBtn) textCadLockBtn.addEventListener('click', () => this.setTextRotationMode('cad'));

    const floatingTextRotateBtn = document.getElementById('cfFloatingTextRotateBtn');
    if (floatingTextRotateBtn) floatingTextRotateBtn.addEventListener('click', () => this.rotateTextBy(90));

    // Satellite Color Vibrancy & Boost Controls
    const colorNormalBtn = document.getElementById('cfColorNormalBtn');
    if (colorNormalBtn) colorNormalBtn.addEventListener('click', () => this.setMapColorBoost(1.0, 1.0, 1.0));

    const colorVividBtn = document.getElementById('cfColorVividBtn');
    if (colorVividBtn) colorVividBtn.addEventListener('click', () => this.setMapColorBoost(1.6, 1.25, 1.05));

    const colorUltraBtn = document.getElementById('cfColorUltraBtn');
    if (colorUltraBtn) colorUltraBtn.addEventListener('click', () => this.setMapColorBoost(2.0, 1.35, 1.08));

    const satSlider = document.getElementById('cfColorSaturationSlider');
    if (satSlider) {
      satSlider.addEventListener('input', (e) => {
        const sat = parseFloat(e.target.value);
        const con = 1.0 + (sat - 1.0) * 0.4;
        const bri = 1.0 + (sat - 1.0) * 0.08;
        this.setMapColorBoost(sat, con, bri);
      });
    }

    // CAD Darkness Controls
    const darkDeepBtn = document.getElementById('cfDarknessDeepBtn');
    if (darkDeepBtn) darkDeepBtn.addEventListener('click', () => this.setSvgDarkness(0.70));

    const darkDarkBtn = document.getElementById('cfDarknessDarkBtn');
    if (darkDarkBtn) darkDarkBtn.addEventListener('click', () => this.setSvgDarkness(0.55));

    const darkMediumBtn = document.getElementById('cfDarknessMediumBtn');
    if (darkMediumBtn) darkMediumBtn.addEventListener('click', () => this.setSvgDarkness(0.30));

    const darkSlider = document.getElementById('cfSvgDarknessSlider');
    if (darkSlider) {
      darkSlider.addEventListener('input', (e) => {
        this.setSvgDarkness(parseFloat(e.target.value));
      });
    }

    // Spacebar shortcut to temporarily drag ground map while holding Spacebar
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.code === 'Space' && !this.state.isSpacePressed) {
        const cadTab = document.getElementById('tab-event-planner');
        if (cadTab && (cadTab.classList.contains('active') || cadTab.style.display !== 'none')) {
          e.preventDefault();
          this.state.isSpacePressed = true;
          this.setMapInteractionMode('map');
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' && this.state.isSpacePressed) {
        this.state.isSpacePressed = false;
        const cadTab = document.getElementById('tab-event-planner');
        if (cadTab && (cadTab.classList.contains('active') || cadTab.style.display !== 'none')) {
          this.setMapInteractionMode('cad');
        }
      }
    });

    // Backward-compat for legacy modeBtn
    const modeBtn = document.getElementById('cfMapInteractionModeBtn');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        const newMode = this.state.mapInteractionMode === 'cad' ? 'map' : 'cad';
        this.setMapInteractionMode(newMode);
      });
    }

    // Center Map on Venue Button
    const centerBtn = document.getElementById('cfSyncVenueMapBtn');
    if (centerBtn) {
      centerBtn.addEventListener('click', () => {
        this.centerGoogleMapOnActiveVenue();
      });
    }

    // Sync CAD layout directly into Visitor Navigation Pathways
    const syncPwBtn = document.getElementById('cfSyncToVisitorPathwaysBtn');
    if (syncPwBtn) {
      syncPwBtn.addEventListener('click', () => {
        this.syncCadLayoutToVisitorPathways();
      });
    }

    // Map View Mode Switchers in CAD (Satellite, Hybrid, Road)
    ['cfMapModeSat', 'cfMapModeHyb', 'cfMapModeRoad'].forEach(btnId => {
      const b = document.getElementById(btnId);
      if (b) {
        b.addEventListener('click', () => {
          const mode = b.getAttribute('data-view-mode') || 'satellite';
          this.state.googleMapType = mode;
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

    // CAD Pathway Layer & Draw/Edit Mode Controls
    const pwModeBtn = document.getElementById('cfModePathwayBtn');
    if (pwModeBtn) {
      pwModeBtn.addEventListener('click', () => {
        this.setPathwayInteractionMode(!this.state.pathwayEditMode);
      });
    }

    const floatingPwBtn = document.getElementById('cfFloatingPathwayBtn');
    if (floatingPwBtn) {
      floatingPwBtn.addEventListener('click', () => {
        this.setPathwayInteractionMode(!this.state.pathwayEditMode);
      });
    }

    const layerPw = document.getElementById('cfLayerPathways');
    if (layerPw) {
      layerPw.addEventListener('click', () => {
        this.state.showPathways = !this.state.showPathways;
        layerPw.classList.toggle('active', this.state.showPathways);
        layerPw.style.background = this.state.showPathways ? '#059669' : '';
        layerPw.style.color = this.state.showPathways ? '#ffffff' : '';
        layerPw.style.borderColor = this.state.showPathways ? '#047857' : '';
        this.renderCanvas();
        this.showToast(`Pathways Layer ${this.state.showPathways ? 'Visible' : 'Hidden'}`, 'info');
      });
    }

    // Pathway Editor Toolbar buttons
    document.querySelectorAll('.cf-pw-route-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.getAttribute('data-route');
        if (route) this.switchActiveRoute(route);
      });
    });

    const pwAddPointBtn = document.getElementById('cfPwAddPointBtn');
    if (pwAddPointBtn) {
      pwAddPointBtn.addEventListener('click', () => {
        this.state.pwAddPointMode = !this.state.pwAddPointMode;
        pwAddPointBtn.classList.toggle('active', this.state.pwAddPointMode);
        pwAddPointBtn.style.background = this.state.pwAddPointMode ? '#2563eb' : 'transparent';
        pwAddPointBtn.style.color = this.state.pwAddPointMode ? '#ffffff' : '#94a3b8';
        pwAddPointBtn.style.borderColor = this.state.pwAddPointMode ? '#3b82f6' : '#475569';
        pwAddPointBtn.textContent = this.state.pwAddPointMode ? '➕ Click Canvas to Add: ON' : '➕ Click Canvas to Add: OFF';
        const vw = document.getElementById('cfViewportWrap');
        if (vw && this.state.mapInteractionMode === 'pathway') {
          vw.style.cursor = this.state.pwAddPointMode ? 'crosshair' : 'grab';
        }
      });
    }

    const pwUndoBtn = document.getElementById('cfPwUndoPointBtn');
    if (pwUndoBtn) {
      pwUndoBtn.addEventListener('click', () => {
        const activeKey = this.state.activeRouteKey || 'C';
        if (this.state.cadPathways[activeKey] && this.state.cadPathways[activeKey].length > 0) {
          this.state.cadPathways[activeKey].pop();
          this.updatePathwayBadgeCounts();
          this.renderCanvas();
          this.saveCadPathways(false);
          this.showToast(`Undid last waypoint from ${this.pathwayMeta[activeKey].name}`, 'info');
        }
      });
    }

    const pwClearBtn = document.getElementById('cfPwClearRouteBtn');
    if (pwClearBtn) {
      pwClearBtn.addEventListener('click', () => {
        const activeKey = this.state.activeRouteKey || 'C';
        const meta = this.pathwayMeta[activeKey];
        if (!confirm(`Clear all waypoints for ${meta.name}? You can click on the CAD canvas to redraw freshly.`)) return;
        this.state.cadPathways[activeKey] = [];
        this.updatePathwayBadgeCounts();
        this.renderCanvas();
        this.saveCadPathways(true);
        this.showToast(`Cleared ${meta.name}. Click canvas to add waypoints.`, 'info');
      });
    }

    const pwAutoBtn = document.getElementById('cfPwAutoRouteBtn');
    if (pwAutoBtn) {
      pwAutoBtn.addEventListener('click', () => {
        this.autoRouteActiveRoute();
      });
    }

    const pwSaveSyncBtn = document.getElementById('cfPwSaveSyncBtn');
    if (pwSaveSyncBtn) {
      pwSaveSyncBtn.addEventListener('click', () => {
        this.saveCadPathways(true);
      });
    }

    const simLimitBtn = document.getElementById('cfSimulateBarricadeLimitBtn');
    if (simLimitBtn) {
      simLimitBtn.addEventListener('click', () => {
        this.toggleBarricadeLimitSimulation();
      });
    }

    const pwSimLimitBtn = document.getElementById('cfPwSimLimitBtn');
    if (pwSimLimitBtn) {
      pwSimLimitBtn.addEventListener('click', () => {
        this.toggleBarricadeLimitSimulation();
      });
    }

    const pwCloseBtn = document.getElementById('cfPwCloseBtn');
    if (pwCloseBtn) {
      pwCloseBtn.addEventListener('click', () => {
        this.setPathwayInteractionMode(false);
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
      // If Drag Map mode is active, handle ground dragging with rotation-awareness
      if (this.state.mapInteractionMode === 'map') {
        this.state.isMapDragging = true;
        this.state.mapDragLastX = e.clientX;
        this.state.mapDragLastY = e.clientY;
        viewportWrap.style.cursor = 'grabbing';
        return;
      }
      // Check if user clicked a pathway waypoint handle
      const handle = e.target.closest('.cf-pathway-handle');
      if (handle) {
        e.stopPropagation();
        this.state.isDraggingWaypoint = true;
        this.state.draggedWaypointRoute = handle.getAttribute('data-route');
        this.state.draggedWaypointIndex = parseInt(handle.getAttribute('data-index'));
        viewportWrap.style.cursor = 'grabbing';
        return;
      }

      // If in Pathway Edit Mode and user clicks on canvas to append point
      if (this.state.mapInteractionMode === 'pathway') {
        if (this.state.pwAddPointMode && !e.target.closest('.cf-interactive-elem') && !e.target.closest('.cad-zoom-controls') && !e.target.closest('.cad-floating-hud')) {
          const pt = this.clientToSvgPoint(e.clientX, e.clientY);
          const activeKey = this.state.activeRouteKey || 'C';
          if (!this.state.cadPathways[activeKey]) this.state.cadPathways[activeKey] = [];
          this.state.cadPathways[activeKey].push(pt);
          this.updatePathwayBadgeCounts();
          this.renderCanvas();
          this.saveCadPathways(false);
          this.showToast(`Added waypoint #${this.state.cadPathways[activeKey].length} to ${this.pathwayMeta[activeKey].name}`, 'info');
        }
        return;
      }

      if (e.target.closest('.cf-interactive-elem')) return;
      this.state.isPanning = true;
      this.state.panStartX = e.clientX - this.state.panX;
      this.state.panStartY = e.clientY - this.state.panY;
      viewportWrap.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (this.state.mapInteractionMode === 'map') {
        if (this.state.isMapDragging && window.GoogleMapsManager && window.GoogleMapsManager.mapInstances['cadGoogleMapDiv']) {
          const map = window.GoogleMapsManager.mapInstances['cadGoogleMapDiv'];
          const dx = e.clientX - this.state.mapDragLastX;
          const dy = e.clientY - this.state.mapDragLastY;
          this.state.mapDragLastX = e.clientX;
          this.state.mapDragLastY = e.clientY;

          // Pan satellite map accounting for current map rotation
          const mapDeg = this.state.mapRotationDeg || 0;
          const mapRad = mapDeg * (Math.PI / 180);
          const rotDx = dx * Math.cos(-mapRad) - dy * Math.sin(-mapRad);
          const rotDy = dx * Math.sin(-mapRad) + dy * Math.cos(-mapRad);
          map.panBy([-rotDx, -rotDy], { animate: false });
        }
        return;
      }
      if (this.state.isDraggingWaypoint && this.state.draggedWaypointRoute) {
        const pt = this.clientToSvgPoint(e.clientX, e.clientY);
        const route = this.state.draggedWaypointRoute;
        const idx = this.state.draggedWaypointIndex;
        if (this.state.cadPathways[route] && this.state.cadPathways[route][idx]) {
          this.state.cadPathways[route][idx] = pt;
          this.renderCanvas();
        }
        return;
      }
      if (this.state.isPanning) {
        this.state.panX = e.clientX - this.state.panStartX;
        this.state.panY = e.clientY - this.state.panStartY;
        this.updateSvgTransform();
      } else if (this.state.draggedElementId) {
        this.handleElementDragging(e);
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.state.mapInteractionMode === 'map') {
        this.state.isMapDragging = false;
        if (viewportWrap) viewportWrap.style.cursor = 'grab';
        return;
      }
      if (this.state.isDraggingWaypoint) {
        this.state.isDraggingWaypoint = false;
        this.state.draggedWaypointIndex = null;
        this.state.draggedWaypointRoute = null;
        if (viewportWrap) viewportWrap.style.cursor = (this.state.mapInteractionMode === 'pathway' && this.state.pwAddPointMode) ? 'crosshair' : 'grab';
        this.saveCadPathways(true);
        return;
      }
      if (this.state.isPanning) {
        this.state.isPanning = false;
        if (viewportWrap) viewportWrap.style.cursor = 'grab';
      }
      if (this.state.draggedElementId) {
        this.finishElementDragging();
      }
    });

    viewportWrap.addEventListener('contextmenu', (e) => {
      const handle = e.target.closest('.cf-pathway-handle');
      if (handle) {
        e.preventDefault();
        e.stopPropagation();
        const route = handle.getAttribute('data-route');
        const idx = parseInt(handle.getAttribute('data-index'));
        if (this.state.cadPathways[route] && this.state.cadPathways[route].length > idx) {
          this.state.cadPathways[route].splice(idx, 1);
          this.updatePathwayBadgeCounts();
          this.renderCanvas();
          this.saveCadPathways(true);
          this.showToast(`Deleted waypoint from ${this.pathwayMeta[route].name}`, 'info');
        }
      }
    });

    viewportWrap.addEventListener('wheel', (e) => {
      // If Drag Map mode is active, allow Leaflet map to zoom the satellite tiles
      if (this.state.mapInteractionMode === 'map') {
        if (window.GoogleMapsManager && window.GoogleMapsManager.mapInstances['cadGoogleMapDiv']) {
          const map = window.GoogleMapsManager.mapInstances['cadGoogleMapDiv'];
          if (e.deltaY < 0) map.zoomIn();
          else map.zoomOut();
        }
        return;
      }
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      this.state.zoom = Math.max(0.4, Math.min(3.5, this.state.zoom * zoomFactor));
      this.updateSvgTransform();
    }, { passive: false });

    // Floating Zoom Buttons (controls CAD zoom or Satellite Map zoom depending on active mode)
    const zoomInBtn = document.getElementById('cfZoomInBtn');
    const zoomOutBtn = document.getElementById('cfZoomOutBtn');
    const zoomResetBtn = document.getElementById('cfZoomResetBtn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
      if (this.state.mapInteractionMode === 'map' && window.GoogleMapsManager && window.GoogleMapsManager.mapInstances['cadGoogleMapDiv']) {
        window.GoogleMapsManager.mapInstances['cadGoogleMapDiv'].zoomIn();
      } else {
        this.state.zoom = Math.min(3.5, this.state.zoom * 1.2);
        this.updateSvgTransform();
      }
    });

    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
      if (this.state.mapInteractionMode === 'map' && window.GoogleMapsManager && window.GoogleMapsManager.mapInstances['cadGoogleMapDiv']) {
        window.GoogleMapsManager.mapInstances['cadGoogleMapDiv'].zoomOut();
      } else {
        this.state.zoom = Math.max(0.4, this.state.zoom * 0.82);
        this.updateSvgTransform();
      }
    });

    if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => {
      if (this.state.mapInteractionMode === 'map') {
        this.centerGoogleMapOnActiveVenue();
      } else {
        this.state.zoom = 1.0;
        this.state.panX = 0;
        this.state.panY = 0;
        this.updateSvgTransform();
      }
    });
  },

  updateSvgTransform: function() {
    const stageGroup = document.getElementById('cfSvgStageGroup');
    if (stageGroup) {
      stageGroup.setAttribute('transform', `translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoom}) rotate(${this.state.cadRotationDeg || 0}, 700, 425)`);
    }
    this.updateRotatableTexts();
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
        this.loadCadPathways();
        this.renderAll();
      } else {
        this.computeLocalFallback(payload);
        this.loadCadPathways();
        this.renderAll();
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
        stage: (function() {
          // Stage x depends on stage_position; default west (left)
          const sp = p.stage_position || 'west';
          if (sp === 'east') return { id:'stage-main', type:'stage', label:'MAJOR STAGE', x:1125, y:275, width:105, height:290, color:'#10b981', capacity:250, specs:'Truss platform' };
          if (sp === 'north') return { id:'stage-main', type:'stage', label:'MAJOR STAGE', x:490, y:65, width:290, height:105, color:'#10b981', capacity:250, specs:'Truss platform' };
          if (sp === 'south') return { id:'stage-main', type:'stage', label:'MAJOR STAGE', x:490, y:675, width:290, height:105, color:'#10b981', capacity:250, specs:'Truss platform' };
          return { id:'stage-main', type:'stage', label:'MAJOR STAGE', x:98, y:275, width:105, height:290, color:'#10b981', capacity:250, specs:'Truss platform' };
        })(),
        barricade_pens: (function() {
          const pens = [];
          const penCols = 3;
          const penStartX = 255;
          const singlePenW = 195;
          const singlePenH = 245;
          const topPenY = 95;
          const botPenY = 475;
          let counter = 1;
          for (let col = 0; col < penCols; col++) {
            const px = penStartX + (col * (singlePenW + 20));
            // Top row pen (Odd)
            pens.push({
              id: `box-${counter}`,
              type: 'barricade_pen',
              label: `BARRICADE PEN ${counter}`,
              x: px,
              y: topPenY,
              width: singlePenW,
              height: singlePenH,
              capacity: 1200,
              current_occupancy: 920,
              is_limit_exceeded: false,
              status: 'COMPLIANT',
              panel_count: 42,
              specs: 'Capacity: 1,200 ppl. Dual surge relief exits facing central corridor.'
            });
            counter++;
            // Bottom row pen (Even)
            pens.push({
              id: `box-${counter}`,
              type: 'barricade_pen',
              label: `BARRICADE PEN ${counter}`,
              x: px,
              y: botPenY,
              width: singlePenW,
              height: singlePenH,
              capacity: 1200,
              current_occupancy: 890,
              is_limit_exceeded: false,
              status: 'COMPLIANT',
              panel_count: 42,
              specs: 'Capacity: 1,200 ppl. Dual surge relief exits facing central corridor.'
            });
            counter++;
          }
          return pens;
        })(),
        security_hub: {
          id: 'hub-security', type: 'security_hub', label: 'SECURITY HUB', x: 860, y: 390, width: 80, height: 95, color: '#1e293b', capacity: 30, specs: 'Command center'
        },
        facilities: [],
        // Entry gates are placed OPPOSITE to stage; exit gates on the stage side
        entry_gates: (function() {
          const sp = p.stage_position || 'west';
          const n = Math.max(2, parseInt(p.entry_gates_count || 4));
          const gates = [];
          // Boundary: x 70–1330 (width 1260), y 60–790 (height 730)
          const fieldW = 1260, fieldH = 730;
          const marginX = 70, marginY = 60;
          const labels = ['C','B','A','D','E','F'];
          for (let i = 0; i < n; i++) {
            const gy = marginY + 80 + (i * ((fieldH - 160) / Math.max(1, n - 1)));
            const gx = marginX + 80 + (i * ((fieldW - 160) / Math.max(1, n - 1)));
            let x, y, w = 36, h = 45;
            if (sp === 'east')  { x = marginX - 18; y = gy; }           // stage right → entries left
            else if (sp === 'north') { x = gx; y = marginY + fieldH - 18; w=45; h=36; } // stage top → entries bottom
            else if (sp === 'south') { x = gx; y = marginY - 18;         w=45; h=36; } // stage bottom → entries top
            else { x = marginX + fieldW - 18; y = gy; }                  // stage west → entries EAST (right)
            gates.push({ id:`gate-in-${i+1}`, type:'entry_gate', label:`ENTRY GATE ${labels[i]||i+1}`, x, y, width:w, height:h, specs:'Dual VL53L0X ToF counters' });
          }
          return gates;
        })(),
        exit_gates: (function() {
          const sp = p.stage_position || 'west';
          const n = Math.max(2, parseInt(p.exit_gates_count || 4));
          const gates = [];
          const fieldW = 1260, fieldH = 730;
          const marginX = 70, marginY = 60;
          for (let i = 0; i < n; i++) {
            const gy = marginY + 70 + (i * ((fieldH - 140) / Math.max(1, n - 1)));
            const gx = marginX + 70 + (i * ((fieldW - 140) / Math.max(1, n - 1)));
            let x, y, w = 36, h = 45;
            if (sp === 'east')  { x = marginX + fieldW - 18; y = gy; }  // stage right → exits right (stage side)
            else if (sp === 'north') { x = gx; y = marginY - 18;        w=45; h=36; } // stage top → exits top
            else if (sp === 'south') { x = gx; y = marginY + fieldH - 18; w=45; h=36; }
            else { x = marginX - 18; y = gy; }                           // stage west → exits WEST (stage side)
            const isEmergency = i % 2 === 1;
            gates.push({ id:`gate-out-${i+1}`, type:isEmergency?'emergency_exit':'exit_gate', label:isEmergency?`EMERGENCY EGRESS ${i+1}`:`EXIT GATE ${i+1}`, x, y, width:w, height:h, specs:'Outward panic hardware egress' });
          }
          return gates;
        })(),
        flow_vectors: []
      },
      equipment_quantities: {
        barricade_panels_count: 240,
        turnstiles_count: 8
      },
      budget: {
        currency: p.currency || 'INR',
        budget_limit: p.budget_limit || 4250000,
        grand_total: p.currency === 'USD' ? 42850 : 3642250,
        remaining_budget: (p.budget_limit || 4250000) - (p.currency === 'USD' ? 42850 : 3642250),
        is_over_budget: (p.currency === 'USD' ? 42850 : 3642250) > (p.budget_limit || 4250000),
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
      const curCode = (b.currency || this.state.currency || 'INR').toUpperCase();
      const symMap = { 'INR': '₹', 'USD': '$', 'EUR': '€' };
      const curDisplay = symMap[curCode] ? `${symMap[curCode]}` : curCode;
      const formattedTotal = curCode === 'INR' ? b.grand_total.toLocaleString('en-IN') : b.grand_total.toLocaleString();
      statBudget.textContent = `${curDisplay} ${formattedTotal}`;
      statBudget.style.color = b.is_over_budget ? '#b91c1c' : '#047857';
    }
  },


  // -------------------------------------------------------------
  // GOOGLE MAPS API INTEGRATION FOR CAD GROUND PLANNER
  // -------------------------------------------------------------
  toggleGoogleMaps: function(enable) {
    if (enable === undefined) enable = !this.state.showGoogleMaps;
    this.state.showGoogleMaps = enable;

    const layerBtn = document.getElementById('cfLayerGoogleMaps');
    if (layerBtn) layerBtn.classList.toggle('active', enable);

    const controls = document.getElementById('cfGoogleMapsControls');
    if (controls) controls.style.display = enable ? 'inline-flex' : 'none';

    const hudBtn = document.getElementById('cfHudMapToggleBtn');
    if (hudBtn) {
      hudBtn.innerHTML = enable ? '🛰️ Google Maps Satellite: ON' : '🛰️ Google Maps: OFF';
      hudBtn.style.background = enable ? '#1d4ed8' : '#475569';
    }

    const hudBadge = document.getElementById('cfGoogleMapsHudBadge');
    if (hudBadge) hudBadge.style.display = enable ? 'inline-block' : 'none';

    const mapDiv = document.getElementById('cadGoogleMapDiv');
    if (mapDiv) {
      mapDiv.style.display = enable ? 'block' : 'none';
      if (enable && window.GoogleMapsManager) {
        window.GoogleMapsManager.mountCadGoogleMap();
        this.setMapRotation(this.state.mapRotationDeg || 0);
        this.setCadRotation(this.state.cadRotationDeg || 0);
        this.setMapColorBoost(this.state.mapSaturation || 1.6, this.state.mapContrast || 1.25, this.state.mapBrightness || 1.05);
      }
    }

    this.renderCanvas();
  },

  getTextRotationAngle: function() {
    const cadDeg = this.state.cadRotationDeg || 0;
    const mode = this.state.textRotationMode || 'auto';
    const offset = this.state.textRotationOffset || 0;

    if (mode === 'cad') {
      return offset;
    }
    // In 'auto' mode, counter-rotate so texts are upright relative to screen (+ optional offset)
    return -cadDeg + offset;
  },

  setTextRotationMode: function(mode) {
    this.state.textRotationMode = mode;
    this.updateRotatableTexts();
    const modeDesc = mode === 'auto' ? 'Upright (Auto)' : 'CAD-Aligned';
    this.showToast(`Text orientation set to: ${modeDesc}`, 'info');
  },

  rotateTextBy: function(deltaDeg) {
    this.state.textRotationOffset = ((this.state.textRotationOffset + deltaDeg) % 360 + 360) % 360;
    this.updateRotatableTexts();
    this.showToast(`Text turned +${deltaDeg}° (Total: ${this.state.textRotationOffset}°)`, 'info');
  },

  resetTextRotation: function() {
    this.state.textRotationMode = 'auto';
    this.state.textRotationOffset = 0;
    this.updateRotatableTexts();
    this.showToast('Text orientation reset to Upright (Auto)', 'info');
  },

  updateRotatableTexts: function() {
    const rot = this.getTextRotationAngle();
    const rotTexts = document.querySelectorAll('.cf-rotatable-text');
    rotTexts.forEach(el => {
      const cx = parseFloat(el.getAttribute('data-cx') || 0);
      const cy = parseFloat(el.getAttribute('data-cy') || 0);
      const baseAngle = parseFloat(el.getAttribute('data-base-angle') || 0);
      el.setAttribute('transform', `rotate(${rot + baseAngle}, ${cx}, ${cy})`);
    });
    this.updateTextControlsUi();
  },

  updateTextControlsUi: function() {
    const autoBtn = document.getElementById('cfTextAutoBtn');
    const cadLockBtn = document.getElementById('cfTextCadLockBtn');
    const badge = document.getElementById('cfTextAngleBadge');

    if (autoBtn) {
      if (this.state.textRotationMode === 'auto' && !this.state.textRotationOffset) {
        autoBtn.classList.add('active');
        autoBtn.style.background = '#2563eb';
        autoBtn.style.color = '#fff';
      } else {
        autoBtn.classList.remove('active');
        autoBtn.style.background = '';
        autoBtn.style.color = '';
      }
    }

    if (cadLockBtn) {
      if (this.state.textRotationMode === 'cad') {
        cadLockBtn.classList.add('active');
        cadLockBtn.style.background = '#2563eb';
        cadLockBtn.style.color = '#fff';
      } else {
        cadLockBtn.classList.remove('active');
        cadLockBtn.style.background = '';
        cadLockBtn.style.color = '';
      }
    }

    if (badge) {
      if (this.state.textRotationMode === 'cad') {
        badge.textContent = `CAD (${this.state.cadRotationDeg}°)`;
        badge.style.background = '#fef3c7';
        badge.style.color = '#b45309';
      } else if (this.state.textRotationOffset) {
        badge.textContent = `Turned (${this.state.textRotationOffset}°)`;
        badge.style.background = '#e0e7ff';
        badge.style.color = '#3730a3';
      } else {
        badge.textContent = 'Upright (0°)';
        badge.style.background = '#d1fae5';
        badge.style.color = '#059669';
      }
    }

    const hudBadge = document.getElementById('cfHudRotationBadge');
    if (hudBadge) {
      const hasRot = ((this.state.cadRotationDeg || 0) !== 0 || (this.state.mapRotationDeg || 0) !== 0 || (this.state.textRotationOffset || 0) !== 0);
      hudBadge.style.display = hasRot ? 'inline-flex' : 'none';
      hudBadge.textContent = `🌍 Map: ${this.state.mapRotationDeg || 0}° • 🔄 CAD: ${this.state.cadRotationDeg || 0}° • 🔤 Text: ${this.state.textRotationMode === 'auto' ? (this.state.textRotationOffset ? `+${this.state.textRotationOffset}°` : 'Upright') : 'CAD-Lock'}`;
    }
  },

  setCadRotation: function(deg, autoSave = true) {
    deg = Math.round(((deg % 360) + 360) % 360);
    this.state.cadRotationDeg = deg;

    const gm = window.GoogleMapsManager;
    const vid = gm ? (gm.currentVenueId || 'sona-college') : 'sona-college';
    try {
      localStorage.setItem('cad_layout_rot_' + vid, String(deg));
    } catch(e) {}

    // Apply rotation purely to the CAD SVG layer around center (700, 425)
    this.updateSvgTransform();
    this.updateRotatableTexts();

    const badge = document.getElementById('cfRotationBadge');
    if (badge) badge.textContent = `${deg}°`;

    const slider = document.getElementById('cfMapRotationSlider');
    if (slider && Number(slider.value) !== deg) slider.value = deg;

    this.updateTextControlsUi();

    if (autoSave && this.state.cadPathways) {
      this.saveCadPathways(false);
    }
  },

  rotateCadBy: function(deltaDeg) {
    this.setCadRotation((this.state.cadRotationDeg || 0) + deltaDeg, true);
    this.showToast(`Rotated CAD layout to ${this.state.cadRotationDeg}°`, 'info');
  },

  setMapRotation: function(deg, autoSave = true) {
    deg = Math.round(((deg % 360) + 360) % 360);
    this.state.mapRotationDeg = deg;

    const gm = window.GoogleMapsManager;
    const vid = gm ? (gm.currentVenueId || 'sona-college') : 'sona-college';
    try {
      localStorage.setItem('cad_map_rot_' + vid, String(deg));
    } catch(e) {}

    const mapDiv = document.getElementById('cadGoogleMapDiv');
    if (mapDiv) {
      mapDiv.style.top = '0px';
      mapDiv.style.left = '0px';
      mapDiv.style.width = '100%';
      mapDiv.style.height = '100%';
      mapDiv.style.transformOrigin = '50% 50%';
      if (deg === 0) {
        mapDiv.style.transform = 'none';
      } else {
        const vw = document.getElementById('cfViewportWrap');
        const w = vw ? vw.clientWidth : 1400;
        const h = vw ? vw.clientHeight : 850;
        const scale = Math.max(1.5, Math.ceil((Math.hypot(w, h) / Math.min(w, h)) * 10) / 10);
        mapDiv.style.transform = `scale(${scale}) rotate(${deg}deg)`;
      }
    }

    const badge = document.getElementById('cfMapRotationBadge');
    if (badge) badge.textContent = `${deg}°`;

    const slider = document.getElementById('cfMapRotationContinuousSlider');
    if (slider && Number(slider.value) !== deg) slider.value = deg;

    this.updateTextControlsUi();

    if (autoSave && this.state.cadPathways) {
      this.saveCadPathways(false);
    }
  },

  rotateMapBy: function(deltaDeg) {
    this.setMapRotation((this.state.mapRotationDeg || 0) + deltaDeg, true);
    this.showToast(`Rotated Satellite Map to ${this.state.mapRotationDeg}°`, 'info');
  },

  setSvgDarkness: function(val) {
    val = Math.max(0, Math.min(0.9, typeof val === 'number' ? val : (parseFloat(val) || 0.55)));
    this.state.svgDarkness = val;

    const badge = document.getElementById('cfSvgDarknessBadge');
    if (badge) badge.textContent = `${Math.round(val * 100)}%`;

    const slider = document.getElementById('cfSvgDarknessSlider');
    if (slider && Math.abs(parseFloat(slider.value) - val) > 0.01) slider.value = val;

    document.querySelectorAll('.cad-dark-btn').forEach(btn => {
      const btnVal = parseFloat(btn.dataset.darkVal);
      const isMatch = Math.abs(btnVal - val) < 0.08;
      btn.classList.toggle('active', isMatch);
      if (isMatch) {
        btn.style.background = '#1e293b';
        btn.style.color = '#ffffff';
        btn.style.borderColor = '#0f172a';
      } else {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.borderColor = '';
      }
    });

    this.renderCanvas();
  },

  setMapColorBoost: function(sat, con, bri) {
    sat = typeof sat === 'number' ? sat : (this.state.mapSaturation || 1.6);
    con = typeof con === 'number' ? con : (this.state.mapContrast || 1.25);
    bri = typeof bri === 'number' ? bri : (this.state.mapBrightness || 1.05);

    this.state.mapSaturation = sat;
    this.state.mapContrast = con;
    this.state.mapBrightness = bri;

    const mapDiv = document.getElementById('cadGoogleMapDiv');
    if (mapDiv) {
      mapDiv.style.setProperty('--cad-map-sat', sat);
      mapDiv.style.setProperty('--cad-map-con', con);
      mapDiv.style.setProperty('--cad-map-bri', bri);
      const tilePane = mapDiv.querySelector('.leaflet-tile-pane');
      if (tilePane) {
        tilePane.style.filter = `saturate(${sat}) contrast(${con}) brightness(${bri})`;
      }
    }

    const visitorMapDiv = document.getElementById('googleMapDiv');
    if (visitorMapDiv) {
      visitorMapDiv.style.setProperty('--cad-map-sat', sat);
      visitorMapDiv.style.setProperty('--cad-map-con', con);
      visitorMapDiv.style.setProperty('--cad-map-bri', bri);
      const vTilePane = visitorMapDiv.querySelector('.leaflet-tile-pane');
      if (vTilePane) {
        vTilePane.style.filter = `saturate(${sat}) contrast(${con}) brightness(${bri})`;
      }
    }

    const satSlider = document.getElementById('cfColorSaturationSlider');
    if (satSlider && Math.abs(Number(satSlider.value) - sat) > 0.05) {
      satSlider.value = sat.toFixed(1);
    }
    const colorValBadge = document.getElementById('cfColorValBadge');
    if (colorValBadge) {
      colorValBadge.textContent = `${Math.round(sat * 100)}%`;
    }

    ['cfColorNormalBtn', 'cfColorVividBtn', 'cfColorUltraBtn'].forEach(btnId => {
      const b = document.getElementById(btnId);
      if (b) {
        const mode = b.getAttribute('data-color-mode');
        const isActive = (mode === 'normal' && sat <= 1.1) ||
                         (mode === 'vivid' && sat > 1.1 && sat <= 1.7) ||
                         (mode === 'ultra' && sat > 1.7);
        b.classList.toggle('active', isActive);
        if (isActive) {
          b.style.background = '#2563eb';
          b.style.color = '#ffffff';
          b.style.borderColor = '#1d4ed8';
          b.style.fontWeight = '800';
        } else {
          b.style.background = 'transparent';
          b.style.color = '#1e40af';
          b.style.borderColor = '#bfdbfe';
          b.style.fontWeight = '500';
        }
      }
    });
  },

  panMapByOffset: function(deltaX, deltaY) {
    if (window.GoogleMapsManager && window.GoogleMapsManager.mapInstances['cadGoogleMapDiv']) {
      const map = window.GoogleMapsManager.mapInstances['cadGoogleMapDiv'];
      const mapDeg = this.state.mapRotationDeg || 0;
      const mapRad = mapDeg * (Math.PI / 180);
      const rotDx = deltaX * Math.cos(-mapRad) - deltaY * Math.sin(-mapRad);
      const rotDy = deltaX * Math.sin(-mapRad) + deltaY * Math.cos(-mapRad);
      map.panBy([rotDx, rotDy], { animate: true, duration: 0.25 });
      this.showToast('Shifted satellite ground map', 'info');
    }
  },

  setMapInteractionMode: function(mode) {
    this.state.mapInteractionMode = mode;
    const editBtn = document.getElementById('cfModeEditCadBtn');
    const dragBtn = document.getElementById('cfModeDragMapBtn');
    const hudBtn = document.getElementById('cfHudDragMapBtn');
    const floatBtn = document.getElementById('cfFloatingDragMapBtn');
    const statusText = document.getElementById('cfHudStatusText');
    const legacyBtn = document.getElementById('cfMapInteractionModeBtn');
    const svg = document.getElementById('cfSvgViewport');
    const viewportWrap = document.getElementById('cfViewportWrap');
    const mapDiv = document.getElementById('cadGoogleMapDiv');

    if (mode === 'map') {
      // Map Drag Mode Active
      if (editBtn) {
        editBtn.style.background = 'transparent';
        editBtn.style.color = '#1e40af';
        editBtn.style.boxShadow = 'none';
        editBtn.classList.remove('active');
      }
      if (dragBtn) {
        dragBtn.style.background = '#2563eb';
        dragBtn.style.color = '#ffffff';
        dragBtn.style.boxShadow = '0 1px 3px rgba(37,99,235,0.4)';
        dragBtn.classList.add('active');
      }
      if (hudBtn) {
        hudBtn.innerHTML = '✋ Drag Map: ACTIVE (Click & Drag Ground)';
        hudBtn.style.background = '#10b981';
        hudBtn.style.borderColor = '#059669';
      }
      if (floatBtn) {
        floatBtn.style.background = '#2563eb';
        floatBtn.style.color = '#ffffff';
        floatBtn.style.border = '2px solid #60a5fa';
      }
      if (statusText) {
        statusText.textContent = '✋ DRAG MAP ACTIVE • CLICK & DRAG ANYWHERE TO PAN GROUND • SCROLL TO ZOOM MAP';
      }
      if (legacyBtn) {
        legacyBtn.innerHTML = '✋ Drag Map: ON';
        legacyBtn.style.background = '#2563eb';
        legacyBtn.style.color = '#ffffff';
      }
      if (svg) svg.style.pointerEvents = 'none';
      if (viewportWrap) viewportWrap.style.cursor = 'grab';
      if (mapDiv) mapDiv.style.pointerEvents = 'auto';

      if (window.GoogleMapsManager && window.GoogleMapsManager.mapInstances['cadGoogleMapDiv']) {
        const m = window.GoogleMapsManager.mapInstances['cadGoogleMapDiv'];
        if (m.dragging) m.dragging.enable();
        if (m.scrollWheelZoom) m.scrollWheelZoom.enable();
        setTimeout(() => { try { m.invalidateSize(); } catch(e){} }, 50);
      }

      this.showToast('✋ Drag Google Map Active: Click & drag anywhere on the ground to move satellite view (or scroll to zoom).', 'success');
    } else {
      // CAD Edit Mode Active
      if (editBtn) {
        editBtn.style.background = '#ffffff';
        editBtn.style.color = '#1e40af';
        editBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.08)';
        editBtn.classList.add('active');
      }
      if (dragBtn) {
        dragBtn.style.background = 'transparent';
        dragBtn.style.color = '#1e40af';
        dragBtn.style.boxShadow = 'none';
        dragBtn.classList.remove('active');
      }
      if (hudBtn) {
        hudBtn.innerHTML = '✋ Drag Map: OFF';
        hudBtn.style.background = '#475569';
        hudBtn.style.borderColor = 'rgba(255,255,255,0.4)';
      }
      if (floatBtn) {
        floatBtn.style.background = '#ffffff';
        floatBtn.style.color = '#0f172a';
        floatBtn.style.border = '1px solid var(--border-subtle)';
      }
      if (statusText) {
        statusText.textContent = 'DRAG CANVAS TO PAN • SCROLL TO ZOOM • DRAG OBJECTS TO EDIT';
      }
      if (legacyBtn) {
        legacyBtn.innerHTML = '✏️ Edit CAD';
        legacyBtn.style.background = '';
        legacyBtn.style.color = '';
      }
      if (svg) svg.style.pointerEvents = 'auto';
      if (viewportWrap) viewportWrap.style.cursor = 'default';

      this.showToast('✏️ CAD Editing Active: Drag gates, pens & amenities.', 'info');
    }
  },

  centerGoogleMapOnActiveVenue: function() {
    if (window.GoogleMapsManager) {
      const v = window.GoogleMapsManager.venueConfigs[window.GoogleMapsManager.currentVenueId] || window.GoogleMapsManager.venueConfigs['sona-college'];
      const map = window.GoogleMapsManager.mapInstances['cadGoogleMapDiv'];
      if (map && v) {
        map.setView([v.lat, v.lng], v.zoom || 18);
        setTimeout(() => map.invalidateSize(), 50);
        this.showToast(`Centered Google Maps on ${v.name}`, 'success');
      }
    }
  },

  syncCadLayoutToVisitorPathways: function() {
    if (!window.GoogleMapsManager) {
      this.showToast('Google Maps Manager not initialized', 'error');
      return;
    }

    const gm = window.GoogleMapsManager;
    const v = gm.venueConfigs[gm.currentVenueId] || gm.venueConfigs['sona-college'];
    const lat = v.lat;
    const lng = v.lng;
    const r = v.groundRadius || 85;

    const plan = this.state.plan;
    const layout = plan ? plan.layout : null;

    let pathC, pathB, pathA, pathSos;

    if (layout) {
      const stage = layout.stage || { x: 100, y: 345, width: 75, height: 160 };
      const stageCenter = { x: stage.x + (stage.width || 75) / 2, y: stage.y + (stage.height || 160) / 2 };

      const cadToGps = (cadX, cadY) => this.cadToGps(cadX, cadY);

      const stageGps = cadToGps(stageCenter.x, stageCenter.y);
      const gates = layout.entry_gates || [];
      // Default gate fallback: entries on the EAST (right) side — opposite the default west stage
      const gC = gates[0] || { x: 1330, y: 180 };
      const gB = gates[1] || { x: 1330, y: 390 };
      const gA = gates[2] || { x: 1330, y: 600 };

      const exits = layout.exit_gates || [];
      // Exit gates on the WEST (stage side) by default
      const ex1 = exits[0] || { x: 70, y: 200 };

      const gpsGC = cadToGps(gC.x, gC.y);
      const gpsGB = cadToGps(gB.x, gB.y);
      const gpsGA = cadToGps(gA.x, gA.y);
      const gpsEx = cadToGps(ex1.x, ex1.y);

      const corridorMid = cadToGps(570, 425);

      pathC = [gpsGC, [ (gpsGC[0] + corridorMid[0]) / 2, (gpsGC[1] + corridorMid[1]) / 2 ], corridorMid, stageGps];
      pathB = [gpsGB, [ (gpsGB[0] + stageGps[0]) / 2, (gpsGB[1] + stageGps[1]) / 2 ], stageGps];
      pathA = [gpsGA, [ (gpsGA[0] + stageGps[0]) / 2, (gpsGA[1] + stageGps[1]) / 2 ], stageGps];
      const defaultPaths = this.getDefaultCadPathways();
      const cadSos = (this.state.cadPathways && this.state.cadPathways['EMERGENCY'] && this.state.cadPathways['EMERGENCY'].length >= 3)
        ? this.state.cadPathways['EMERGENCY']
        : defaultPaths['EMERGENCY'];
      pathSos = cadSos.map(pt => cadToGps(pt.x, pt.y));
    } else {
      pathC = [
        [gm.getOffsetLatLng(lat, lng, r * 1.05, 220).lat, gm.getOffsetLatLng(lat, lng, r * 1.05, 220).lng],
        [gm.getOffsetLatLng(lat, lng, r * 0.55, 180).lat, gm.getOffsetLatLng(lat, lng, r * 0.55, 180).lng],
        [gm.getOffsetLatLng(lat, lng, r * 0.12, 60).lat, gm.getOffsetLatLng(lat, lng, r * 0.12, 60).lng]
      ];
      pathB = [
        [gm.getOffsetLatLng(lat, lng, r * 1.02, 305).lat, gm.getOffsetLatLng(lat, lng, r * 1.02, 305).lng],
        [gm.getOffsetLatLng(lat, lng, r * 0.45, 15).lat, gm.getOffsetLatLng(lat, lng, r * 0.45, 15).lng],
        [gm.getOffsetLatLng(lat, lng, r * 0.12, 60).lat, gm.getOffsetLatLng(lat, lng, r * 0.12, 60).lng]
      ];
      pathA = [
        [gm.getOffsetLatLng(lat, lng, r * 1.0, 175).lat, gm.getOffsetLatLng(lat, lng, r * 1.0, 175).lng],
        [gm.getOffsetLatLng(lat, lng, r * 0.12, 60).lat, gm.getOffsetLatLng(lat, lng, r * 0.12, 60).lng]
      ];
      pathSos = [
        [gm.getOffsetLatLng(lat, lng, r * 0.12, 60).lat, gm.getOffsetLatLng(lat, lng, r * 0.12, 60).lng],
        [gm.getOffsetLatLng(lat, lng, r * 1.15, 90).lat, gm.getOffsetLatLng(lat, lng, r * 1.15, 90).lng]
      ];
    }

    const newPathways = {
      'C': pathC,
      'B': pathB,
      'A': pathA,
      'EMERGENCY': pathSos
    };

    gm.setCustomPathways(newPathways, true);
    this.showToast('✅ Converted CAD layout into Visitor Navigation Pathways! Saved and active on Visitor Map.', 'success');
  },

  getGoogleMapsStaticUrl: function() {
    let lat = 11.677193;
    let lng = 78.123532;
    let zoom = 18;
    if (window.GoogleMapsManager) {
      const v = window.GoogleMapsManager.venueConfigs[window.GoogleMapsManager.currentVenueId] || window.GoogleMapsManager.venueConfigs['sona-college'];
      if (v) {
        lat = v.lat;
        lng = v.lng;
        zoom = v.zoom || 18;
      }
    }
    const mapType = this.state.googleMapType || 'satellite';
    const apiKey = (window.GoogleMapsManager && window.GoogleMapsManager.apiKey) ? window.GoogleMapsManager.apiKey : 'AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao';
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=1260x730&scale=2&maptype=${mapType}&key=${apiKey}`;
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
      <g id="cfSvgStageGroup" transform="translate(${this.state.panX}, ${this.state.panY}) scale(${this.state.zoom}) rotate(${this.state.cadRotationDeg || 0}, 700, 425)">

        <!-- Dark Contrast Scrim for Darker, High-Visibility CAD Blueprint -->
        ${this.state.showGoogleMaps ? `
          <rect id="cfSvgDarknessRect" x="-400" y="-300" width="2200" height="1500" fill="#090d16" fill-opacity="${(this.state.svgDarkness !== undefined ? this.state.svgDarkness : 0.55)}" />
        ` : `
          <rect id="cfSvgDarknessRect" x="-400" y="-300" width="2200" height="1500" fill="#090d16" fill-opacity="${(this.state.svgDarkness !== undefined ? Math.max(0.12, this.state.svgDarkness * 0.4) : 0.22)}" />
        `}

        <!-- Engineering Grid -->
        <rect x="0" y="0" width="1400" height="850" fill="url(#cfGridLarge)" opacity="${this.state.showGoogleMaps ? '0.28' : '0.65'}" />

        <!-- Note: Real interactive Google Satellite tiles render directly behind SVG in #cadGoogleMapDiv -->

        <!-- Uploaded Blueprint Image Layer (Scenario 2) -->
        ${layers.showBlueprintImage && layers.blueprintImageSrc ? `
          <image href="${layers.blueprintImageSrc}" x="70" y="60" width="1260" height="730" preserveAspectRatio="none" opacity="${layers.blueprintOpacity}" />
        ` : ''}

        <!-- Outer Venue Ground Boundary (Darker Navy-Black Field Deck) -->
        <path d="${boundaryPathD}" fill="#0f172a" fill-opacity="${Math.max(0.38, (this.state.svgDarkness || 0.55) * 0.78)}" stroke="${this.state.showGoogleMaps ? '#38bdf8' : '#2563eb'}" stroke-width="${this.state.showGoogleMaps ? '4' : '3.5'}" stroke-dasharray="8 4" />

        <!-- Perimeter Safety Road -->
        ${layers.showSafetyCorridors ? `
          <path d="${boundaryPathD}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.5" />
          <g class="cf-rotatable-text" data-cx="700" data-cy="45" transform="rotate(${this.getTextRotationAngle()}, 700, 45)">
            <text x="700" y="45" text-anchor="middle" font-size="11" font-weight="900" font-family="monospace" fill="#60a5fa" letter-spacing="1" pointer-events="none" style="text-shadow: 0 1px 4px rgba(0,0,0,0.9);">
              ▲ ${layout.perimeter_road_width_m || 12}M WIDE PERIMETER VEHICLE EGRESS ROAD (NFPA 101 COMPLIANT) ▲
            </text>
          </g>
        ` : ''}

        <!-- Central Arterial Corridor Clear Road -->
        ${layers.showSafetyCorridors ? `
          <line x1="280" y1="425" x2="860" y2="425" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="6 4" stroke-opacity="0.8" />
          <g class="cf-rotatable-text" data-cx="560" data-cy="420" transform="rotate(${this.getTextRotationAngle()}, 560, 420)">
            <text x="560" y="420" text-anchor="middle" font-size="9.5" font-weight="900" font-family="monospace" fill="#93c5fd" letter-spacing="0.5" pointer-events="none" style="text-shadow: 0 1px 4px rgba(0,0,0,0.9);">
              CENTRAL ARTERIAL SAFETY CORRIDOR (${layout.arterial_corridor_width_m || 16}M CLEARANCE — NO OBSTRUCTION)
            </text>
          </g>
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

        <!-- VISITOR NAVIGATION PATHWAYS (Interactive on CAD) -->
        ${layers.showPathways ? this.renderPathwaysSvg() : ''}

        <!-- DIRECTIONAL FLOW ARROWS -->
        ${layers.showFlowArrows ? (layout.flow_vectors || []).map(v => this.renderFlowArrowSvg(v)).join('') : ''}

        <!-- DIMENSIONS & SCALE BAR -->
        ${layers.showDimensions ? this.renderDimensionsSvg() : ''}

      </g>
    `;

    svg.innerHTML = svgHtml;
    this.bindInteractiveElements();
    this.updateTextControlsUi();
  },

  // -------------------------------------------------------------
  // SVG SUB-COMPONENT RENDERERS
  // -------------------------------------------------------------
  renderStageSvg: function(stage) {
    if (!stage) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === stage.id;
    const cx = stage.x + stage.width / 2;
    const cy = stage.y + stage.height / 2;
    const rot = this.getTextRotationAngle();

    return `
      <g id="${stage.id}" class="cf-interactive-elem" data-id="${stage.id}" data-type="stage" transform="translate(0, 0)">
        <!-- Buffer Glow -->
        <rect x="${stage.x - 8}" y="${stage.y - 8}" width="${stage.width + 16}" height="${stage.height + 16}" rx="8" fill="#10b981" fill-opacity="0.22" stroke="#10b981" stroke-width="2" stroke-dasharray="4 2" />
        
        <!-- Main Stage Platform (Deep Forest Emerald) -->
        <rect x="${stage.x}" y="${stage.y}" width="${stage.width}" height="${stage.height}" rx="6" fill="#064e3b" stroke="${isSelected ? '#38bdf8' : '#059669'}" stroke-width="${isSelected ? 3.5 : 2.5}" filter="url(#cfShadowCard)" />
        
        <!-- Mojo Heavy Crush Barrier Front -->
        <line x1="${stage.x + stage.width + 6}" y1="${stage.y + 10}" x2="${stage.x + stage.width + 6}" y2="${stage.y + stage.height - 10}" stroke="#f59e0b" stroke-width="4.5" stroke-dasharray="6 3" />
        
        <!-- Labels wrapped in rotatable group -->
        <g class="cf-rotatable-text" data-cx="${cx}" data-cy="${cy}" transform="rotate(${rot}, ${cx}, ${cy})">
          <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="12" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff" letter-spacing="1" pointer-events="none" style="text-shadow: 0 1px 4px rgba(0,0,0,0.9);">
            ${stage.label}
          </text>
          <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="9" font-weight="800" font-family="'Inter', sans-serif" fill="#6ee7b7" pointer-events="none">
            PERFORMANCE DECK
          </text>
          <text x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="8" font-family="monospace" fill="#a7f3d0" opacity="0.9" pointer-events="none">
            FOH BUFFER: 28M
          </text>
        </g>
      </g>
    `;
  },

  renderPenSvg: function(pen) {
    if (!pen) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === pen.id;
    const cx = pen.x + pen.width / 2;
    const cy = pen.y + pen.height / 2;
    const rot = this.getTextRotationAngle();

    const cap = pen.capacity || 1200;
    const occ = pen.current_occupancy !== undefined ? pen.current_occupancy : Math.round(cap * 0.75);
    const isExceeded = (occ > cap) || pen.is_limit_exceeded;
    const occPct = Math.round((occ / cap) * 100);

    const strokeCol = isSelected ? '#38bdf8' : (isExceeded ? '#ef4444' : '#f59e0b');
    const strokeWidth = isSelected ? 4 : (isExceeded ? 3.5 : 2.5);
    const strokeDash = isExceeded ? '8 4' : '5 3';
    const bgFill = isExceeded ? '#450a0a' : '#090d16';
    const bgOpacity = isExceeded ? 0.88 : Math.max(0.50, (this.state.svgDarkness || 0.55) * 0.85);

    // Relief gate: if exceeded, it OPENS wide and turns amber/green; if normal, standard width
    const reliefW = isExceeded ? 52 : 28;
    const reliefCol = isExceeded ? '#fbbf24' : '#22c55e';
    const ingressCol = isExceeded ? '#ef4444' : '#22c55e';

    return `
      <g id="${pen.id}" class="cf-interactive-elem cf-barricade-pen" data-id="${pen.id}" data-type="barricade_pen">
        <!-- Pen Enclosure -->
        <rect x="${pen.x}" y="${pen.y}" width="${pen.width}" height="${pen.height}" rx="6"
          fill="${bgFill}"
          fill-opacity="${bgOpacity}"
          stroke="${strokeCol}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeDash}" />

        ${isExceeded ? `
        <!-- Pulsing Warning Aura when limit exceeded -->
        <rect x="${pen.x - 3}" y="${pen.y - 3}" width="${pen.width + 6}" height="${pen.height + 6}" rx="8"
          fill="none" stroke="#ef4444" stroke-width="2" stroke-opacity="0.8">
          <animate attributeName="stroke-opacity" values="0.9;0.25;0.9" dur="1.2s" repeatCount="indefinite" />
        </rect>
        ` : ''}

        <!-- Pathway Ingress Gate (Opening where pathway enters) -->
        <rect x="${cx - 14}" y="${pen.y - 2}" width="28" height="4" fill="${ingressCol}" rx="2" />
        <!-- Surge Relief Opening (Facing central corridor) -->
        <rect x="${cx - reliefW / 2}" y="${pen.y + pen.height - 2}" width="${reliefW}" height="5" fill="${reliefCol}" rx="2" />

        ${isExceeded ? `
        <!-- Altered Barricade Limit Exceeded Alert Banner -->
        <rect x="${pen.x + 6}" y="${pen.y + 6}" width="${pen.width - 12}" height="22" rx="4" fill="#dc2626" />
        <g class="cf-rotatable-text" data-cx="${cx}" data-cy="${pen.y + 17}" transform="rotate(${rot}, ${cx}, ${pen.y + 17})">
          <text x="${cx}" y="${pen.y + 21}" text-anchor="middle" font-size="8.5" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff" pointer-events="none">
            ⚠️ LIMIT EXCEEDED • BARRIER ALTERED
          </text>
        </g>
        ` : ''}

        <!-- Pathway Connection Terminals on Barricade -->
        <circle cx="${pen.x + pen.width}" cy="${pen.y + pen.height / 2}" r="5" fill="${isExceeded ? '#ef4444' : '#10b981'}" stroke="#ffffff" stroke-width="1.5" />
        <circle cx="${pen.x}" cy="${pen.y + pen.height / 2}" r="5" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" />

        <!-- Pen Labels -->
        <g class="cf-rotatable-text" data-cx="${cx}" data-cy="${cy}" transform="rotate(${rot}, ${cx}, ${cy})">
          <text x="${cx}" y="${cy - (isExceeded ? 6 : 14)}" text-anchor="middle" font-size="11" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff" pointer-events="none" style="text-shadow: 0 1px 4px rgba(0,0,0,0.9);">
            ${pen.label}
          </text>
          <text x="${cx}" y="${cy + (isExceeded ? 10 : 2)}" text-anchor="middle" font-size="9" font-weight="800" font-family="'Inter', sans-serif" fill="${isExceeded ? '#fca5a5' : '#38bdf8'}" pointer-events="none">
            Occupancy: ${occ.toLocaleString()} / ${cap.toLocaleString()} ppl (${occPct}%)
          </text>
          <!-- Capacity progress mini-bar -->
          <rect x="${cx - 45}" y="${cy + (isExceeded ? 16 : 10)}" width="90" height="5" rx="2" fill="#1e293b" />
          <rect x="${cx - 45}" y="${cy + (isExceeded ? 16 : 10)}" width="${Math.min(90, Math.round(90 * (occ / cap)))}" height="5" rx="2" fill="${isExceeded ? '#ef4444' : occPct > 85 ? '#f59e0b' : '#10b981'}" />
          <text x="${cx}" y="${cy + (isExceeded ? 32 : 24)}" text-anchor="middle" font-size="7.5" font-weight="700" font-family="monospace" fill="${isExceeded ? '#f87171' : '#94a3b8'}" pointer-events="none">
            ${isExceeded ? '🚪 RELIEF GATE OPEN • REROUTING' : `${pen.panel_count || 42} Steel Panels (2.5m)`}
          </text>
        </g>
      </g>
    `;
  },

  renderSecurityHubSvg: function(hub) {
    if (!hub) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === hub.id;
    const cx = hub.x + hub.width / 2;
    const cy = hub.y + hub.height / 2;
    const rot = this.getTextRotationAngle();

    return `
      <g id="${hub.id}" class="cf-interactive-elem" data-id="${hub.id}" data-type="security_hub">
        <rect x="${hub.x}" y="${hub.y}" width="${hub.width}" height="${hub.height}" rx="8"
          fill="#090d16" stroke="${isSelected ? '#38bdf8' : '#3b82f6'}" stroke-width="${isSelected ? 3.5 : 2.5}"
          filter="url(#cfShadowCard)" />
        <g class="cf-rotatable-text" data-cx="${cx}" data-cy="${cy}" transform="rotate(${rot}, ${cx}, ${cy})">
          <circle cx="${cx}" cy="${cy - 14}" r="13" fill="#3b82f6" fill-opacity="0.35" />
          <text x="${cx}" y="${cy - 9}" text-anchor="middle" font-size="13" fill="#93c5fd" pointer-events="none">🛡️</text>
          <text x="${cx}" y="${cy + 9}" text-anchor="middle" font-size="9" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff" letter-spacing="0.5" pointer-events="none">
            SECURITY
          </text>
          <text x="${cx}" y="${cy + 21}" text-anchor="middle" font-size="8" font-weight="800" font-family="'Inter', sans-serif" fill="#cbd5e1" pointer-events="none">
            COMMAND HUB
          </text>
        </g>
      </g>
    `;
  },

  renderFacilitySvg: function(fac) {
    if (!fac) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === fac.id;
    const icon = fac.type === 'medical' ? '🚑' : fac.type === 'food_court' ? '🍔' : fac.type === 'water' ? '💧' : '🚻';
    const borderCol = fac.color || '#3b82f6';
    const cx = fac.x + fac.width / 2;
    const cy = fac.y + fac.height / 2;
    const rot = this.getTextRotationAngle();

    const shortLabel = fac.label.replace(' & AMBULANCE EGRESS', '').replace(' & REFRESHMENT ZONE', '').replace('HIGH-CAPACITY ', '').replace('PUBLIC ', '');
    const subText = fac.sub_label ? fac.sub_label.split('•')[0].trim() : '';

    return `
      <g id="${fac.id}" class="cf-interactive-elem" data-id="${fac.id}" data-type="facility">
        <!-- Dark Tactical Card Fill -->
        <rect x="${fac.x}" y="${fac.y}" width="${fac.width}" height="${fac.height}" rx="8"
          fill="#090d16" stroke="${isSelected ? '#38bdf8' : borderCol}" stroke-width="${isSelected ? 3.5 : 2}"
          filter="url(#cfShadowCard)" />
        <rect x="${fac.x}" y="${fac.y}" width="${fac.width}" height="28" rx="8"
          fill="${borderCol}" fill-opacity="0.32" />
        
        <g class="cf-rotatable-text" data-cx="${cx}" data-cy="${cy}" transform="rotate(${rot}, ${cx}, ${cy})">
          <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-size="10" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff" pointer-events="none" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
            ${icon} ${shortLabel}
          </text>
          <text x="${cx}" y="${cy + 5}" text-anchor="middle" font-size="8" font-weight="700" font-family="'Inter', sans-serif" fill="#cbd5e1" pointer-events="none">
            ${subText}
          </text>
          <text x="${cx}" y="${cy + 19}" text-anchor="middle" font-size="7.5" font-family="monospace" fill="#94a3b8" pointer-events="none">
            Cap: ${fac.capacity || 100} ppl
          </text>
        </g>
      </g>
    `;
  },

  renderGateSvg: function(gate, isEntry) {
    if (!gate) return '';
    const isSelected = this.state.selectedElement && this.state.selectedElement.id === gate.id;
    const col = isEntry ? '#2563eb' : gate.type === 'emergency_exit' ? '#16a34a' : '#d97706';
    const icon = isEntry ? 'IN' : 'EXIT';
    const cx = gate.x + gate.width / 2;
    const cy = gate.y + gate.height / 2;
    const rot = this.getTextRotationAngle();
    const gateCode = gate.label ? gate.label.replace('ENTRY GATE ', '').replace('EMERGENCY EGRESS ', 'EM-').replace('EXIT GATE ', 'EX-') : '';

    return `
      <g id="${gate.id}" class="cf-interactive-elem" data-id="${gate.id}" data-type="gate">
        <rect x="${gate.x}" y="${gate.y}" width="${gate.width}" height="${gate.height}" rx="5"
          fill="${col}" stroke="${isSelected ? '#ffffff' : '#0f172a'}" stroke-width="${isSelected ? 2.5 : 1}"
          filter="url(#cfShadowCard)" />
        <g class="cf-rotatable-text" data-cx="${cx}" data-cy="${cy}" transform="rotate(${rot}, ${cx}, ${cy})">
          <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="9" font-weight="900" font-family="monospace" fill="#ffffff" pointer-events="none">
            ${icon}
          </text>
          <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="7.5" font-weight="700" font-family="'Inter', sans-serif" fill="#ffffff" opacity="0.9" pointer-events="none">
            ${gateCode}
          </text>
        </g>
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
    const rot = this.getTextRotationAngle();

    return `
      <!-- Horizontal Dimension (Top) -->
      <line x1="70" y1="25" x2="1330" y2="25" stroke="#38bdf8" stroke-width="2" />
      <line x1="70" y1="18" x2="70" y2="32" stroke="#38bdf8" stroke-width="2" />
      <line x1="1330" y1="18" x2="1330" y2="32" stroke="#38bdf8" stroke-width="2" />
      <rect x="630" y="14" width="140" height="20" rx="4" fill="#090d16" stroke="#38bdf8" stroke-width="1.5" />
      <g class="cf-rotatable-text" data-cx="700" data-cy="24" transform="rotate(${rot}, 700, 24)">
        <text x="700" y="28" text-anchor="middle" font-size="10" font-weight="900" font-family="monospace" fill="#38bdf8" pointer-events="none" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
          VENUE LENGTH: ${len}${unit}
        </text>
      </g>

      <!-- Vertical Dimension (Left) -->
      <line x1="35" y1="60" x2="35" y2="790" stroke="#38bdf8" stroke-width="2" />
      <line x1="28" y1="60" x2="42" y2="60" stroke="#38bdf8" stroke-width="2" />
      <line x1="28" y1="790" x2="42" y2="790" stroke="#38bdf8" stroke-width="2" />
      <g class="cf-rotatable-text" data-cx="30" data-cy="425" data-base-angle="-90" transform="rotate(${rot - 90}, 30, 425)">
        <text x="30" y="425" text-anchor="middle" font-size="10" font-weight="900" font-family="monospace" fill="#38bdf8" pointer-events="none" style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);">
          VENUE WIDTH: ${wid}${unit}
        </text>
      </g>

      <!-- Metric Scale Indicator Bar (Bottom Right) -->
      <g class="cf-rotatable-text" data-cx="1170" data-cy="822" transform="rotate(${rot}, 1170, 822)">
        <g transform="translate(1080, 810)">
          <rect x="0" y="0" width="180" height="24" rx="4" fill="#090d16" stroke="#475569" stroke-width="1.5" />
          <rect x="10" y="10" width="40" height="6" fill="#38bdf8" />
          <rect x="50" y="10" width="40" height="6" fill="#334155" />
          <rect x="90" y="10" width="40" height="6" fill="#38bdf8" />
          <rect x="130" y="10" width="40" height="6" fill="#334155" />
          <text x="10" y="8" font-size="8" font-family="monospace" fill="#94a3b8" pointer-events="none">0</text>
          <text x="90" y="8" font-size="8" font-family="monospace" fill="#94a3b8" pointer-events="none">25m</text>
          <text x="170" y="8" font-size="8" font-family="monospace" fill="#94a3b8" pointer-events="none">50m</text>
        </g>
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

  syncPathwaysToMovedComponent: function(obj) {
    if (!obj || !this.state.cadPathways) return;
    const layout = this.state.plan ? this.state.plan.layout : null;
    if (!layout) return;

    if (obj.type === 'entry_gate') {
      const gates = layout.entry_gates || [];
      const idx = gates.findIndex(g => g.id === obj.id);
      const routeKeys = ['C', 'B', 'A'];
      const routeKey = routeKeys[idx] || routeKeys[idx % 3];
      if (routeKey && this.state.cadPathways[routeKey] && this.state.cadPathways[routeKey].length > 0) {
        this.state.cadPathways[routeKey][0] = {
          x: Math.round(obj.x + (obj.width || 36) / 2),
          y: Math.round(obj.y + (obj.height || 45) / 2)
        };
      }
    } else if (obj.type === 'stage') {
      const sp = (this.state.stage_position || 'west').toLowerCase();
      const stageHub = sp === 'east'
        ? { x: Math.round(obj.x - 35), y: Math.round(obj.y + (obj.height || 290) / 2) }
        : { x: Math.round(obj.x + (obj.width || 105) + 35), y: Math.round(obj.y + (obj.height || 290) / 2) };
      ['C', 'B', 'A'].forEach(k => {
        if (this.state.cadPathways[k] && this.state.cadPathways[k].length >= 2) {
          this.state.cadPathways[k][this.state.cadPathways[k].length - 1] = { ...stageHub };
        }
      });
      if (this.state.cadPathways['EMERGENCY'] && this.state.cadPathways['EMERGENCY'].length > 0) {
        this.state.cadPathways['EMERGENCY'][0] = { ...stageHub };
      }
    } else if (obj.type === 'exit_gate' || obj.type === 'emergency_exit') {
      if (this.state.cadPathways['EMERGENCY'] && this.state.cadPathways['EMERGENCY'].length > 1) {
        this.state.cadPathways['EMERGENCY'][this.state.cadPathways['EMERGENCY'].length - 1] = {
          x: Math.round(obj.x + (obj.width || 36) / 2),
          y: Math.round(obj.y + (obj.height || 45) / 2)
        };
      }
    }
  },

  handleElementDragging: function(e) {
    if (!this.state.draggedElementId) return;
    const deltaX = (e.clientX - this.state.dragStartX) / this.state.zoom;
    const deltaY = (e.clientY - this.state.dragStartY) / this.state.zoom;

    const obj = this.findElementById(this.state.draggedElementId);
    if (!obj) return;

    // Convert screen mouse movement to rotated CAD coordinate space
    const deg = this.state.cadRotationDeg || 0;
    const rad = deg * (Math.PI / 180);
    const localDeltaX = deltaX * Math.cos(-rad) - deltaY * Math.sin(-rad);
    const localDeltaY = deltaX * Math.sin(-rad) + deltaY * Math.cos(-rad);

    // Apply coordinate delta
    obj.x = Math.round(this.state.elementOrigX + localDeltaX);
    obj.y = Math.round(this.state.elementOrigY + localDeltaY);

    // Fast SVG re-render and pathway auto-follow
    this.syncPathwaysToMovedComponent(obj);
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
      this.syncPathwaysToMovedComponent(obj);
      this.saveCadPathways(false);
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

    const isGate = (obj.type === 'entry_gate' || obj.type === 'exit_gate' || obj.type === 'emergency_exit');
    const isEntry = (obj.type === 'entry_gate');
    const isPen = (obj.type === 'barricade_pen');
    const penCap = obj.capacity || 1200;
    const penOcc = obj.current_occupancy !== undefined ? obj.current_occupancy : Math.round(penCap * 0.75);
    const isPenExceeded = (penOcc > penCap) || obj.is_limit_exceeded;
    const penOccPct = Math.round((penOcc / penCap) * 100);

    drawer.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; width:100%; flex-wrap:wrap; gap:0.75rem;">
        <div style="display:flex; align-items:center; gap:0.6rem; min-width:240px;">
          <div style="width:36px; height:36px; border-radius:8px; background:${isEntry ? '#ecfdf5' : '#eff6ff'}; display:flex; align-items:center; justify-content:center; color:${isEntry ? '#059669' : '#2563eb'}; font-weight:800; font-size:1.1rem; border:1px solid ${isEntry ? '#a7f3d0' : '#bfdbfe'};">
            ${obj.type === 'stage' ? '🎭' : obj.type === 'barricade_pen' ? '🚧' : obj.type === 'security_hub' ? '🛡️' : obj.type === 'medical' ? '🚑' : isEntry ? '🚪' : '📍'}
          </div>
          <div style="flex:1;">
            <div style="font-size:0.68rem; color:${isEntry ? '#059669' : 'var(--accent-blue)'}; font-weight:800; text-transform:uppercase; display:flex; align-items:center; gap:0.3rem;">
              <span>${isEntry ? 'Ingress Entry Point (Opposite Stage)' : 'Selected Ground Component'}</span>
              <span class="badge" style="font-size:0.62rem; padding:0.1rem 0.4rem; background:${isEntry ? '#d1fae5' : '#e0e7ff'}; color:${isEntry ? '#065f46' : '#3730a3'};">EDITABLE</span>
            </div>
            <input id="cfInspectLabelInput" type="text" value="${obj.label || obj.id}" title="Click to rename this component" style="font-size:0.92rem; font-weight:800; padding:0.2rem 0.45rem; border:1px solid #cbd5e1; border-radius:6px; background:#ffffff; color:var(--text-main); width:100%; max-width:260px;" />
          </div>
        </div>

        <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
          <div>
            <span style="font-size:0.68rem; color:var(--text-muted); font-weight:700; display:block;">X / Y COORDS</span>
            <div style="display:flex; align-items:center; gap:0.25rem;">
              <input id="cfInspectXInput" type="number" value="${obj.x}" title="Horizontal coordinate" style="width:62px; padding:0.2rem 0.35rem; font-size:0.8rem; font-family:monospace; border:1px solid #cbd5e1; border-radius:5px; font-weight:700;" />
              <span style="color:#94a3b8; font-size:0.75rem;">,</span>
              <input id="cfInspectYInput" type="number" value="${obj.y}" title="Vertical coordinate" style="width:62px; padding:0.2rem 0.35rem; font-size:0.8rem; font-family:monospace; border:1px solid #cbd5e1; border-radius:5px; font-weight:700;" />
            </div>
          </div>
          <div>
            <span style="font-size:0.68rem; color:var(--text-muted); font-weight:700; display:block;">W × H (m)</span>
            <div style="display:flex; align-items:center; gap:0.25rem;">
              <input id="cfInspectWInput" type="number" value="${obj.width || 36}" title="Width" style="width:52px; padding:0.2rem 0.35rem; font-size:0.8rem; font-family:monospace; border:1px solid #cbd5e1; border-radius:5px; font-weight:700;" />
              <span style="color:#94a3b8; font-size:0.75rem;">×</span>
              <input id="cfInspectHInput" type="number" value="${obj.height || 45}" title="Height" style="width:52px; padding:0.2rem 0.35rem; font-size:0.8rem; font-family:monospace; border:1px solid #cbd5e1; border-radius:5px; font-weight:700;" />
            </div>
          </div>
          ${isEntry ? `
          <div>
            <button id="cfInspectMoveOppositeBtn" type="button" class="btn btn-outline btn-sm" style="font-size:0.72rem; padding:0.25rem 0.55rem; border-color:#10b981; color:#047857; background:#ecfdf5; font-weight:700;" title="Snap gate to opposite side of stage">
              ↔ Snap Opposite Stage
            </button>
          </div>` : ''}
          ${isPen ? `
          <div style="background:#0f172a; border:1px solid ${isPenExceeded ? '#ef4444' : '#334155'}; border-radius:8px; padding:0.35rem 0.65rem; display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">
            <div>
              <span style="font-size:0.68rem; color:#94a3b8; font-weight:700; display:block;">BARRICADE LIMIT & OCCUPANCY</span>
              <div style="display:flex; align-items:center; gap:0.35rem;">
                <input id="cfInspectPenOccInput" type="number" value="${penOcc}" title="Current crowd in this barricade pen" style="width:68px; padding:0.18rem 0.35rem; font-size:0.8rem; font-family:monospace; border:1px solid ${isPenExceeded ? '#ef4444' : '#64748b'}; border-radius:4px; font-weight:800; background:#1e293b; color:${isPenExceeded ? '#f87171' : '#f1f5f9'};" />
                <span style="color:#94a3b8; font-size:0.75rem;">/</span>
                <input id="cfInspectPenCapInput" type="number" value="${penCap}" title="Capacity Limit" style="width:68px; padding:0.18rem 0.35rem; font-size:0.8rem; font-family:monospace; border:1px solid #64748b; border-radius:4px; font-weight:700; background:#1e293b; color:#94a3b8;" />
                <span style="font-size:0.72rem; font-weight:800; color:${isPenExceeded ? '#ef4444' : '#10b981'};">(${penOccPct}%)</span>
              </div>
            </div>
            <div>
              <input id="cfInspectPenOccSlider" type="range" min="0" max="${Math.round(penCap * 1.5)}" value="${penOcc}" step="20" style="width:110px; cursor:pointer;" title="Adjust crowd level to test limit exceeded alteration" />
            </div>
            <button id="cfInspectToggleLimitBtn" type="button" class="btn btn-sm" style="font-size:0.7rem; padding:0.25rem 0.6rem; font-weight:800; border-radius:6px; background:${isPenExceeded ? '#059669' : '#dc2626'}; color:#ffffff; border:none; cursor:pointer;" title="Toggle limit exceeded state to test barricade alteration & pathway rerouting">
              ${isPenExceeded ? '✅ Restore Normal Limit' : '🚨 Trigger Limit Exceeded'}
            </button>
          </div>
          ` : `
          <div style="max-width:260px;">
            <span style="font-size:0.68rem; color:var(--text-muted); font-weight:700; display:block;">STATUS</span>
            <span style="font-size:0.74rem; color:#047857; font-weight:700;">● Active • Drag anywhere on ground to relocate</span>
          </div>
          `}
        </div>

        <div style="display:flex; gap:0.4rem; align-items:center;">
          <button id="cfInspectRotateBtn" class="btn btn-outline btn-sm" title="Rotate 90°">↺ Rotate</button>
          <button id="cfInspectDuplicateBtn" class="btn btn-outline btn-sm" title="Duplicate">⧉ Duplicate</button>
          <button id="cfInspectDeleteBtn" class="btn btn-outline btn-sm" style="color:#b91c1c; border-color:#fca5a5;" title="Delete">🗑️ Remove</button>
        </div>
      </div>
    `;

    // Live inline input listeners
    const labelInp = document.getElementById('cfInspectLabelInput');
    if (labelInp) {
      labelInp.addEventListener('input', (e) => {
        obj.label = e.target.value;
        this.renderCanvas();
      });
    }

    const xInp = document.getElementById('cfInspectXInput');
    const yInp = document.getElementById('cfInspectYInput');
    const updateCoords = () => {
      const nx = parseInt(xInp.value, 10);
      const ny = parseInt(yInp.value, 10);
      if (!isNaN(nx)) obj.x = nx;
      if (!isNaN(ny)) obj.y = ny;
      this.syncPathwaysToMovedComponent(obj);
      this.renderCanvas();
      this.saveCadPathways(false);
    };
    if (xInp) xInp.addEventListener('change', updateCoords);
    if (yInp) yInp.addEventListener('change', updateCoords);

    const wInp = document.getElementById('cfInspectWInput');
    const hInp = document.getElementById('cfInspectHInput');
    const updateDims = () => {
      const nw = parseInt(wInp.value, 10);
      const nh = parseInt(hInp.value, 10);
      if (!isNaN(nw) && nw > 5) obj.width = nw;
      if (!isNaN(nh) && nh > 5) obj.height = nh;
      this.syncPathwaysToMovedComponent(obj);
      this.renderCanvas();
      this.saveCadPathways(false);
    };
    if (wInp) wInp.addEventListener('change', updateDims);
    if (hInp) hInp.addEventListener('change', updateDims);

    const snapBtn = document.getElementById('cfInspectMoveOppositeBtn');
    if (snapBtn) {
      snapBtn.addEventListener('click', () => {
        const sp = (this.state.stage_position || 'west').toLowerCase();
        if (sp === 'east') { obj.x = 52; }
        else if (sp === 'north') { obj.y = 755; }
        else if (sp === 'south') { obj.y = 62; }
        else { obj.x = 1312; } // west stage -> snap east (opposite)
        xInp.value = obj.x;
        yInp.value = obj.y;
        this.syncPathwaysToMovedComponent(obj);
        this.renderCanvas();
        this.saveCadPathways(true);
        this.showToast(`Relocated ${obj.label} to opposite side of stage!`, 'success');
      });
    }

    // Bind drawer buttons
    const rotBtn = document.getElementById('cfInspectRotateBtn');
    if (rotBtn) rotBtn.addEventListener('click', () => {
      const w = obj.width; obj.width = obj.height; obj.height = w;
      this.syncPathwaysToMovedComponent(obj);
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

    // Barricade Pen Limit & Occupancy Event Listeners
    if (isPen) {
      const occInp = document.getElementById('cfInspectPenOccInput');
      const capInp = document.getElementById('cfInspectPenCapInput');
      const occSlider = document.getElementById('cfInspectPenOccSlider');
      const toggleLimitBtn = document.getElementById('cfInspectToggleLimitBtn');

      const handlePenOccChange = (newVal) => {
        obj.current_occupancy = Math.max(0, parseInt(newVal, 10) || 0);
        obj.is_limit_exceeded = (obj.current_occupancy > (obj.capacity || 1200));
        // Dynamically alter pathways to divert around full barricade
        this.state.cadPathways = this.getDefaultCadPathways();
        this.renderCanvas();
        this.renderInspectionDrawer(obj);
        this.saveCadPathways(false);
        if (obj.is_limit_exceeded) {
          this.showToast(`⚠️ Barricade "${obj.label}" Limit Exceeded (${Math.round(obj.current_occupancy / obj.capacity * 100)}%)! Barrier altered & pathway rerouted.`, 'warning');
        }
      };

      if (occInp) occInp.addEventListener('change', (e) => handlePenOccChange(e.target.value));
      if (occSlider) occSlider.addEventListener('input', (e) => handlePenOccChange(e.target.value));
      if (capInp) capInp.addEventListener('change', (e) => {
        obj.capacity = Math.max(10, parseInt(e.target.value, 10) || 1200);
        handlePenOccChange(obj.current_occupancy);
      });

      if (toggleLimitBtn) {
        toggleLimitBtn.addEventListener('click', () => {
          this.toggleBarricadeLimitSimulation(obj.id);
        });
      }
    }
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
      // Place new entry gate on the side OPPOSITE to the stage
      const _sp2 = (this.state.stage_position || 'west').toLowerCase();
      const _entX = (_sp2 === 'east') ? 52 : 1312; // east-stage→left, else→right (opposite west stage)
      const _entY = (_sp2 === 'north' || _sp2 === 'south') ? 755 : 220 + (layout.entry_gates.length * 50);
      layout.entry_gates.push({
        id: newId,
        type: 'entry_gate',
        label: `ENTRY GATE ${layout.entry_gates.length + 1}`,
        x: _entX,
        y: _entY,
        width: 36,
        height: 45,
        specs: 'Modular ToF gate'
      });
    } else if (type === 'exit_gate') {
      // Exit gate on the SAME side as the stage
      const _sp3 = (this.state.stage_position || 'west').toLowerCase();
      const _extX = (_sp3 === 'east') ? 1312 : 52; // east-stage→right, else→left (same as west stage)
      const _extY = (_sp3 === 'north' || _sp3 === 'south') ? 62 : 220 + (layout.exit_gates.length * 50);
      layout.exit_gates.push({
        id: newId,
        type: 'exit_gate',
        label: `EXIT GATE ${layout.exit_gates.length + 1}`,
        x: _extX,
        y: _extY,
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
    const curCode = (b.currency || this.state.currency || 'INR').toUpperCase();
    const symMap = { 'INR': '₹', 'USD': '$', 'EUR': '€' };
    const curSym = symMap[curCode] || '';
    const curDisplay = curSym ? `${curCode} ${curSym}` : curCode;

    if (budgetSummary) {
      budgetSummary.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; padding:1.25rem; background:#f8fafc; border-bottom:1px solid var(--border-subtle);">
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">BUDGET LIMIT</span>
            <div style="font-size:1.3rem; font-weight:900; color:var(--text-main);">${curDisplay} ${b.budget_limit.toLocaleString()}</div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">ESTIMATED TOTAL</span>
            <div style="font-size:1.3rem; font-weight:900; color:${b.is_over_budget ? '#b91c1c' : '#047857'};">${curDisplay} ${b.grand_total.toLocaleString()}</div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">BUDGET BALANCE</span>
            <div style="font-size:1.3rem; font-weight:900; color:${b.is_over_budget ? '#b91c1c' : '#047857'};">
              ${b.is_over_budget ? `- ${curDisplay} ${Math.abs(b.remaining_budget).toLocaleString()} (DEFICIT)` : `+ ${curDisplay} ${b.remaining_budget.toLocaleString()} (SURPLUS)`}
            </div>
          </div>
          <div>
            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">CONTINGENCY RESERVE</span>
            <div style="font-size:1.1rem; font-weight:800; color:var(--text-muted);">${curDisplay} ${(b.contingency_10pct || 0).toLocaleString()} (10%)</div>
          </div>
        </div>

        ${b.is_over_budget ? `
          <div style="background:#fef2f2; border:1px solid #fca5a5; padding:0.75rem 1.25rem; font-size:0.8rem; color:#b91c1c; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <strong>⚠️ Budget Deficit Detected:</strong> Estimated planning costs exceed your budget limit by ${curDisplay} ${Math.abs(b.remaining_budget).toLocaleString()}.
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
            ${curDisplay} ${item.total.toLocaleString()}
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
    const curCode = (this.state.currency || 'INR').toUpperCase();
    const symMap = { 'INR': '₹', 'USD': '$', 'EUR': '€' };
    const curDisplay = symMap[curCode] ? `${curCode} ${symMap[curCode]}` : curCode;

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
                  <strong style="display:block; color:${badgeCol}; font-weight:800;">${curDisplay} ${a.grand_total.toLocaleString()}</strong>
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
  // VENUE SYNCHRONISATION
  // -------------------------------------------------------------
  setVenue: function(venue) {
    if (!venue) return;
    const name = venue.name || 'Ground Event';
    const cap = parseInt(venue.capacity || venue.total_capacity || 12000);
    const gates = parseInt(venue.gates || 4);

    this.state.event_name = `${name} - Operational Event Layout`;
    this.state.expected_crowd = cap;
    this.state.entry_gates_count = Math.max(2, gates);
    this.state.exit_gates_count = Math.max(2, gates);

    // Sync input fields
    const nameEl = document.getElementById('cfEventName');
    const crowdEl = document.getElementById('cfInputCrowd');
    const entryEl = document.getElementById('cfEntryGatesInput');
    const exitEl = document.getElementById('cfExitGatesInput');

    if (nameEl) nameEl.value = this.state.event_name;
    if (crowdEl) crowdEl.value = this.state.expected_crowd;
    if (entryEl) entryEl.value = this.state.entry_gates_count;
    if (exitEl) exitEl.value = this.state.exit_gates_count;

    // Recalculate plan based on new venue capacity
    this.fetchOrComputePlan();
  },

  // -------------------------------------------------------------
  // GROUND / STADIUM SYNCHRONISATION (CAD & SATELLITE ENGINE)
  // -------------------------------------------------------------
  onGroundChanged: function(lat, lng, name, vid) {
    if (!name) return;

    // Curated Ground and Stadium specs: realistic dimensions & capacities
    const venuePresets = {
      'sona-college': { length: 160, width: 95, crowd: 5000, gates: 4, shape: 'rectangular' },
      'chennai-stadium': { length: 260, width: 180, crowd: 40000, gates: 8, shape: 'rectangular' },
      'chepauk': { length: 220, width: 170, crowd: 38000, gates: 6, shape: 'rectangular' },
      'wankhede': { length: 210, width: 165, crowd: 33000, gates: 6, shape: 'rectangular' },
      'modi-stadium': { length: 320, width: 240, crowd: 132000, gates: 12, shape: 'rectangular' },
      'eden-gardens': { length: 250, width: 190, crowd: 66000, gates: 10, shape: 'rectangular' },
      'palani-gathering': { length: 280, width: 160, crowd: 15000, gates: 6, shape: 'rectangular' }
    };

    const cleanName = name.replace(/\s*\(-?\d+(\.\d+)?.*?\)/gi, '').trim();
    this.state.event_name = `${cleanName} — Ground Arrangement`;

    const nameEl = document.getElementById('cfEventName');
    if (nameEl) nameEl.value = this.state.event_name;

    const cadSearchInput = document.getElementById('cadGroundSearch');
    if (cadSearchInput) cadSearchInput.value = cleanName;

    if (vid && venuePresets[vid]) {
      const p = venuePresets[vid];
      this.state.length = p.length;
      this.state.width = p.width;
      this.state.expected_crowd = p.crowd;
      this.state.entry_gates_count = p.gates;
      this.state.exit_gates_count = p.gates;
      this.state.shape = p.shape || 'rectangular';
    } else {
      let r = 85;
      if (window.GoogleMapsManager && window.GoogleMapsManager.venueConfigs && window.GoogleMapsManager.venueConfigs[vid]) {
        r = window.GoogleMapsManager.venueConfigs[vid].groundRadius || 85;
      }
      this.state.length = Math.max(100, Math.round(r * 2.2));
      this.state.width = Math.max(70, Math.round(r * 1.6));
      this.state.expected_crowd = Math.max(2500, Math.round((this.state.length * this.state.width) * 0.45));
    }

    const lenEl = document.getElementById('cfInputLength');
    const widEl = document.getElementById('cfInputWidth');
    const crowdEl = document.getElementById('cfInputCrowd');
    const entryEl = document.getElementById('cfEntryGatesInput');
    const exitEl = document.getElementById('cfExitGatesInput');
    if (lenEl) lenEl.value = this.state.length;
    if (widEl) widEl.value = this.state.width;
    if (crowdEl) crowdEl.value = this.state.expected_crowd;
    if (entryEl) entryEl.value = this.state.entry_gates_count;
    if (exitEl) exitEl.value = this.state.exit_gates_count;

    this.syncShapePills();

    // Center Google Satellite Underlay in CAD
    if (window.GoogleMapsManager && window.GoogleMapsManager.mapInstances['cadGoogleMapDiv']) {
      const cadMap = window.GoogleMapsManager.mapInstances['cadGoogleMapDiv'];
      cadMap.setView([lat, lng], 18);
      setTimeout(() => { try { cadMap.invalidateSize(); } catch(e){} }, 50);
      setTimeout(() => { try { cadMap.invalidateSize(); } catch(e){} }, 200);
    }

    // Recalculate full 2D CAD architectural plan and safety metrics
    this.fetchOrComputePlan();
    this.showToast(`🏟️ Ground switched: ${cleanName}`, 'success');
  },


  // -------------------------------------------------------------
  // TOAST NOTIFICATIONS
  // -------------------------------------------------------------

  // -------------------------------------------------------------
  // CAD PATHWAY DRAWING, EDITING & BIDIRECTIONAL SYNC ENGINE
  // -------------------------------------------------------------
  getDistanceAndBearing: function(lat1, lon1, lat2, lon2) {
    const R = 6378137;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) -
              Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const bearing = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;

    return { distance, bearing };
  },

  gpsToCad: function(gpsLat, gpsLng) {
    const gm = window.GoogleMapsManager;
    const v = gm ? (gm.venueConfigs[gm.currentVenueId] || gm.venueConfigs['sona-college']) : { lat: 11.677193, lng: 78.123532, groundRadius: 105 };
    const lat = v.lat;
    const lng = v.lng;
    const r = v.groundRadius || 105;

    const { distance, bearing } = this.getDistanceAndBearing(lat, lng, gpsLat, gpsLng);
    const brngRad = (bearing * Math.PI) / 180;
    const normDist = distance / r;
    const rotX = normDist * Math.sin(brngRad);
    const rotY = -normDist * Math.cos(brngRad);

    const netRot = ((this.state.cadRotationDeg || 0) - (this.state.mapRotationDeg || 0));
    const rotRad = netRot * (Math.PI / 180);
    const relX = rotX * Math.cos(-rotRad) - rotY * Math.sin(-rotRad);
    const relY = rotX * Math.sin(-rotRad) + rotY * Math.cos(-rotRad);

    return {
      x: Math.round(700 + relX * 700),
      y: Math.round(425 + relY * 425)
    };
  },

  cadToGps: function(cadX, cadY) {
    const gm = window.GoogleMapsManager;
    const v = gm ? (gm.venueConfigs[gm.currentVenueId] || gm.venueConfigs['sona-college']) : { lat: 11.677193, lng: 78.123532, groundRadius: 105 };
    const lat = v.lat;
    const lng = v.lng;
    const r = v.groundRadius || 105;

    const relX = (cadX - 700) / 700;
    const relY = (cadY - 425) / 425;
    const netRot = ((this.state.cadRotationDeg || 0) - (this.state.mapRotationDeg || 0));
    const rotRad = netRot * (Math.PI / 180);
    const rotX = relX * Math.cos(rotRad) - relY * Math.sin(rotRad);
    const rotY = relX * Math.sin(rotRad) + relY * Math.cos(rotRad);
    const dist = Math.sqrt(rotX * rotX + rotY * rotY) * r;
    const bearing = ((Math.atan2(rotX, -rotY) * 180 / Math.PI) + 360) % 360;
    if (gm && gm.getOffsetLatLng) {
      const pos = gm.getOffsetLatLng(lat, lng, dist, bearing);
      return [pos.lat, pos.lng];
    }
    return [lat, lng];
  },

  getGpsPathways: function() {
    const gpsPathways = {};
    for (const [key, pts] of Object.entries(this.state.cadPathways || {})) {
      if (Array.isArray(pts) && pts.length >= 2) {
        gpsPathways[key] = pts.map(pt => this.cadToGps(pt.x, pt.y));
      }
    }
    return gpsPathways;
  },

  getGpsBoundary: function() {
    const layout = this.state.plan && this.state.plan.layout;
    const boundary = (layout && layout.boundary) || [
      { x: 70, y: 60 }, { x: 1330, y: 60 }, { x: 1330, y: 790 }, { x: 70, y: 790 }
    ];
    return boundary.map(pt => this.cadToGps(pt.x, pt.y));
  },

  getGpsFacilities: function() {
    const layout = this.state.plan && this.state.plan.layout;
    const facs = {};
    if (layout && layout.facilities && layout.facilities.length > 0) {
      layout.facilities.forEach(f => {
        facs[f.type] = {
          id: f.id,
          label: f.label,
          pos: this.cadToGps(f.x + (f.width || 50) / 2, f.y + (f.height || 50) / 2)
        };
      });
    } else {
      // Default standard facility positions from CAD layout
      facs['medical'] = { id: 'fac-medical', label: 'MEDICAL CENTER', pos: this.cadToGps(1110, 180) };
      facs['food_court'] = { id: 'fac-food', label: 'FOOD COURT', pos: this.cadToGps(1110, 360) };
      facs['water'] = { id: 'fac-water', label: 'WATER HYDRATION', pos: this.cadToGps(1110, 560) };
      facs['restroom'] = { id: 'fac-restrooms', label: 'SANITATION & RESTROOMS', pos: this.cadToGps(1110, 700) };
    }
    return facs;
  },

  getGpsBarricades: function() {
    const layout = this.state.plan && this.state.plan.layout;
    if (!layout || !layout.barricade_pens || !layout.barricade_pens.length) {
      return [];
    }

    return layout.barricade_pens.map(pen => {
      const p1 = this.cadToGps(pen.x, pen.y);
      const p2 = this.cadToGps(pen.x + pen.width, pen.y);
      const p3 = this.cadToGps(pen.x + pen.width, pen.y + pen.height);
      const p4 = this.cadToGps(pen.x, pen.y + pen.height);
      const center = this.cadToGps(pen.x + pen.width / 2, pen.y + pen.height / 2);

      const occ = pen.current_occupancy !== undefined ? pen.current_occupancy : 800;
      const cap = pen.capacity || 1200;
      const isExceeded = Boolean(pen.is_limit_exceeded || (occ > cap));

      return {
        id: pen.id,
        label: pen.label || 'BARRICADE PEN',
        polygon: [p1, p2, p3, p4],
        center: center,
        capacity: cap,
        current_occupancy: occ,
        is_limit_exceeded: isExceeded,
        status: isExceeded ? 'ALTERED' : (pen.status || 'COMPLIANT'),
        panel_count: pen.panel_count || 42,
        specs: pen.specs || 'Steel Mojo Barricades'
      };
    });
  },

  clientToSvgPoint: function(clientX, clientY) {
    const svg = document.getElementById('cfSvgViewport');
    const stageGroup = document.getElementById('cfSvgStageGroup');
    if (!svg || !stageGroup) return { x: 700, y: 425 };

    if (svg.createSVGPoint && stageGroup.getScreenCTM) {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = stageGroup.getScreenCTM();
      if (ctm) {
        const transformed = pt.matrixTransform(ctm.inverse());
        return {
          x: Math.round(transformed.x),
          y: Math.round(transformed.y)
        };
      }
    }

    const rect = svg.getBoundingClientRect();
    const scaleX = 1400 / rect.width;
    const scaleY = 850 / rect.height;
    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;
    x = (x - this.state.panX) / this.state.zoom;
    y = (y - this.state.panY) / this.state.zoom;
    const deg = this.state.cadRotationDeg || 0;
    const rad = deg * (Math.PI / 180);
    const dx = x - 700;
    const dy = y - 425;
    const rx = dx * Math.cos(-rad) - dy * Math.sin(-rad);
    const ry = dx * Math.sin(-rad) + dy * Math.cos(-rad);
    return {
      x: Math.round(700 + rx),
      y: Math.round(425 + ry)
    };
  },

  getDefaultCadPathways: function() {
    const layout = (this.state.plan && this.state.plan.layout) ? this.state.plan.layout : {};
    const stage = layout.stage || { x: 98, y: 265, width: 105, height: 290 };
    const sp = (this.state.stage_position || 'west').toLowerCase();

    // Stage Front Audience Hub (facing crowd)
    const stageHub = sp === 'east'
      ? { x: Math.round(stage.x - 35), y: Math.round(stage.y + (stage.height || 290) / 2) }
      : { x: Math.round(stage.x + (stage.width || 105) + 35), y: Math.round(stage.y + (stage.height || 290) / 2) };

    const gates = layout.entry_gates || [];
    const exits = layout.exit_gates || [];
    const pens = layout.barricade_pens || [];

    const getCenter = (obj, fallback) => {
      if (!obj) return fallback;
      const w = obj.width || 36;
      const h = obj.height || 45;
      return {
        x: Math.round(obj.x + w / 2),
        y: Math.round(obj.y + h / 2)
      };
    };

    // Sort entry gates along Y axis (top to bottom)
    const sortedGates = [...gates].sort((a, b) => a.y - b.y);

    // Gate C (Express / Top), Gate B (Secondary / Middle), Gate A (Main Entrance / Bottom)
    const matchGate = (letter, fallback) => {
      return sortedGates.find(g => {
        const lbl = (g.label || '').toUpperCase();
        return lbl.endsWith(' ' + letter) || lbl.includes('GATE ' + letter) || lbl.includes('(' + letter + ')');
      }) || fallback;
    };
    const gateC = matchGate('C', sortedGates[0]);
    const gateB = matchGate('B', sortedGates[Math.floor(sortedGates.length / 2)] || sortedGates[0]);
    const gateA = matchGate('A', sortedGates[sortedGates.length - 1]);

    const gC = getCenter(gateC, { x: 1330, y: 160 });
    const gB = getCenter(gateB, { x: 1330, y: 350 });
    const gA = getCenter(gateA, { x: 1330, y: 540 });

    // Separate barricade pens: Top row (y < stageHub.y) and Bottom row (y >= stageHub.y)
    // Sorted from East (nearest entries) to West (nearest stage)
    const topPens = pens.filter(p => (p.y + (p.height || 260) / 2) < stageHub.y).sort((a, b) => b.x - a.x);
    const botPens = pens.filter(p => (p.y + (p.height || 260) / 2) >= stageHub.y).sort((a, b) => b.x - a.x);

    const penTopIngress = topPens[0];
    const penTopEgress = topPens[topPens.length - 1] || penTopIngress;
    const penBotIngress = botPens[0];
    const penBotEgress = botPens[botPens.length - 1] || penBotIngress;

    // Barricade Capacity Limit Exceeded Check
    const isTopLimitExceeded = topPens.some(p => p.is_limit_exceeded || (p.current_occupancy > p.capacity));
    const isBotLimitExceeded = botPens.some(p => p.is_limit_exceeded || (p.current_occupancy > p.capacity));

    // ── ROUTE C (GREEN): Entry Gate C -> Top Barricades -> Stage Front Hub ────
    let pathC;
    if (penTopIngress && !isTopLimitExceeded) {
      // Normal pathway: connected directly through top barricade pens
      const topPenY = Math.round(penTopIngress.y + penTopIngress.height / 2);
      pathC = [
        { x: gC.x, y: gC.y },
        { x: Math.round(gC.x * 0.45 + (penTopIngress.x + penTopIngress.width) * 0.55), y: topPenY },
        { x: Math.round(penTopIngress.x + penTopIngress.width), y: topPenY }, // Barricade Ingress Port
        { x: Math.round(penTopEgress.x + penTopEgress.width / 2), y: topPenY },  // Inside barricade system
        { x: Math.round(penTopEgress.x), y: topPenY },                          // Barricade Egress Port
        { x: Math.round(stageHub.x + 40), y: Math.round((topPenY + stageHub.y) / 2) },
        stageHub
      ];
    } else if (penTopIngress && isTopLimitExceeded) {
      // DYNAMICALLY ALTERED PATHWAY: Barricade limit exceeded! Bypasses full pen along upper relief corridor
      const bypassY = Math.max(68, Math.round(penTopIngress.y - 28));
      pathC = [
        { x: gC.x, y: gC.y },
        { x: Math.round(penTopIngress.x + penTopIngress.width + 25), y: bypassY }, // Divert north into safety road
        { x: Math.round((penTopIngress.x + penTopEgress.x) / 2), y: bypassY },     // Relief perimeter bypass
        { x: Math.round(penTopEgress.x - 25), y: bypassY },                        // Bypass full barricade pen
        { x: Math.round(penTopEgress.x - 30), y: Math.round(penTopEgress.y + 35) },
        stageHub
      ];
    } else {
      pathC = [
        { x: gC.x, y: gC.y },
        { x: Math.round(gC.x * 0.65 + stageHub.x * 0.35), y: 220 },
        { x: Math.round(gC.x * 0.35 + stageHub.x * 0.65), y: 320 },
        stageHub
      ];
    }

    // ── ROUTE A (RED): Entry Gate A -> Bottom Barricades -> Stage Front Hub ───
    let pathA;
    if (penBotIngress && !isBotLimitExceeded) {
      // Normal pathway: connected directly through bottom barricade pens
      const botPenY = Math.round(penBotIngress.y + penBotIngress.height / 2);
      pathA = [
        { x: gA.x, y: gA.y },
        { x: Math.round(gA.x * 0.45 + (penBotIngress.x + penBotIngress.width) * 0.55), y: botPenY },
        { x: Math.round(penBotIngress.x + penBotIngress.width), y: botPenY }, // Barricade Ingress Port
        { x: Math.round(penBotEgress.x + penBotEgress.width / 2), y: botPenY },  // Inside barricade system
        { x: Math.round(penBotEgress.x), y: botPenY },                          // Barricade Egress Port
        { x: Math.round(stageHub.x + 40), y: Math.round((botPenY + stageHub.y) / 2) },
        stageHub
      ];
    } else if (penBotIngress && isBotLimitExceeded) {
      // DYNAMICALLY ALTERED PATHWAY: Barricade limit exceeded! Bypasses full pen along lower relief corridor
      const bypassY = Math.min(765, Math.round(penBotIngress.y + penBotIngress.height + 28));
      pathA = [
        { x: gA.x, y: gA.y },
        { x: Math.round(penBotIngress.x + penBotIngress.width + 25), y: bypassY }, // Divert south into safety road
        { x: Math.round((penBotIngress.x + penBotEgress.x) / 2), y: bypassY },     // Relief perimeter bypass
        { x: Math.round(penBotEgress.x - 25), y: bypassY },                        // Bypass full barricade pen
        { x: Math.round(penBotEgress.x - 30), y: Math.round(penBotEgress.y + penBotEgress.height - 35) },
        stageHub
      ];
    } else {
      pathA = [
        { x: gA.x, y: gA.y },
        { x: Math.round(gA.x * 0.65 + stageHub.x * 0.35), y: 600 },
        { x: Math.round(gA.x * 0.35 + stageHub.x * 0.65), y: 500 },
        stageHub
      ];
    }

    // ── ROUTE B (YELLOW): Entry Gate B -> Central Arterial Safety Corridor ────
    const corridorY = Math.round(stageHub.y);
    const pathB = [
      { x: gB.x, y: gB.y },
      { x: Math.round(gB.x * 0.70 + stageHub.x * 0.30), y: corridorY },
      { x: Math.round(gB.x * 0.30 + stageHub.x * 0.70), y: corridorY },
      stageHub
    ];

    // ── EXIT GATES SELECTION FOR INGRESS-THROUGH-EGRESS CONTINUATION ──
    // Sort exit gates along Y axis (top to bottom)
    const sortedExits = [...exits].sort((a, b) => a.y - b.y);
    const exTopGate = sortedExits.find(e => e.y < (stage.y || 275)) || sortedExits[0] || { x: 52, y: 130, width: 36, height: 45 };
    const exTop = getCenter(exTopGate, { x: 52, y: 130 });

    const exMidGate = sortedExits[1] || sortedExits[Math.floor(sortedExits.length / 2)] || sortedExits[0] || { x: 52, y: 326, width: 36, height: 45 };
    const exMid = getCenter(exMidGate, { x: 52, y: 326 });

    const exBotGate = sortedExits[sortedExits.length - 1] || { x: 52, y: 720, width: 36, height: 45 };
    const exBot = getCenter(exBotGate, { x: 52, y: 720 });

    // ── EXIT LEGS (Connecting from Stage Front Audience Hub -> Clear Aisles -> Exit Gates -> Perimeter Road) ──
    let exitLegC, exitLegB, exitLegA, pathSos;

    if (sp === 'west') {
      const clearNorthY = Math.min(Math.round((stage.y || 275) - 35), Math.round(exTop.y));
      const clearSouthY = Math.min(745, Math.max(Math.round((stage.y || 275) + (stage.height || 290) + 35), Math.round(exBot.y)));

      // Route C: Stage Front -> North Stage Aisle -> EXIT EX-1 -> 12M Perimeter Road
      exitLegC = [
        { x: Math.round(stageHub.x - 20), y: Math.max(140, clearNorthY) },
        { x: Math.round(exTop.x + 48), y: exTop.y },
        { x: exTop.x, y: exTop.y },
        { x: Math.max(28, Math.round(exTop.x - 24)), y: exTop.y }
      ];

      // Route B: Stage Front -> Central Arterial Safety Corridor -> EXIT EX-2 -> 12M Perimeter Road
      exitLegB = [
        { x: Math.round(stageHub.x - 25), y: Math.round(exMid.y) },
        { x: Math.round(exMid.x + 48), y: exMid.y },
        { x: exMid.x, y: exMid.y },
        { x: Math.max(28, Math.round(exMid.x - 24)), y: exMid.y }
      ];

      // Route A: Stage Front -> South Stage Aisle -> EXIT EX-4 -> 12M Perimeter Road
      exitLegA = [
        { x: Math.round(stageHub.x - 20), y: clearSouthY },
        { x: Math.round(exBot.x + 48), y: exBot.y },
        { x: exBot.x, y: exBot.y },
        { x: Math.max(28, Math.round(exBot.x - 24)), y: exBot.y }
      ];

      // SOS Emergency Route: Direct clear evacuation corridor from stage -> EXIT EX-1 -> Safe Assembly Perimeter
      const crossAisleX = Math.round(stage.x + (stage.width || 105) / 2);
      pathSos = [
        stageHub,
        { x: Math.round(stageHub.x - 15), y: clearNorthY },
        { x: crossAisleX, y: clearNorthY },
        { x: Math.round(exTop.x + 48), y: exTop.y },
        { x: exTop.x, y: exTop.y },
        { x: Math.max(28, Math.round(exTop.x - 24)), y: exTop.y }
      ];
    } else if (sp === 'east') {
      const clearNorthY = Math.min(Math.round((stage.y || 275) - 35), Math.round(exTop.y));
      const clearSouthY = Math.max(Math.round((stage.y || 275) + (stage.height || 290) + 35), Math.round(exBot.y));

      exitLegC = [
        { x: Math.round(stageHub.x + 20), y: Math.max(140, clearNorthY) },
        { x: Math.round(exTop.x - 48), y: exTop.y },
        { x: exTop.x, y: exTop.y },
        { x: Math.min(1360, Math.round(exTop.x + 24)), y: exTop.y }
      ];
      exitLegB = [
        { x: Math.round(stageHub.x + 25), y: Math.round(exMid.y) },
        { x: Math.round(exMid.x - 48), y: exMid.y },
        { x: exMid.x, y: exMid.y },
        { x: Math.min(1360, Math.round(exMid.x + 24)), y: exMid.y }
      ];
      exitLegA = [
        { x: Math.round(stageHub.x + 20), y: Math.min(745, clearSouthY) },
        { x: Math.round(exBot.x - 48), y: exBot.y },
        { x: exBot.x, y: exBot.y },
        { x: Math.min(1360, Math.round(exBot.x + 24)), y: exBot.y }
      ];
      pathSos = [
        stageHub,
        { x: Math.round(stageHub.x + 15), y: clearNorthY },
        { x: Math.round(stage.x + (stage.width || 105) / 2), y: clearNorthY },
        { x: Math.round(exTop.x - 48), y: exTop.y },
        { x: exTop.x, y: exTop.y },
        { x: Math.min(1360, Math.round(exTop.x + 24)), y: exTop.y }
      ];
    } else {
      exitLegC = [
        { x: Math.round((stageHub.x + exTop.x) / 2), y: Math.round((stageHub.y + exTop.y) / 2) },
        { x: exTop.x, y: exTop.y },
        { x: exTop.x, y: Math.max(30, exTop.y - 25) }
      ];
      exitLegB = [
        { x: Math.round((stageHub.x + exMid.x) / 2), y: Math.round((stageHub.y + exMid.y) / 2) },
        { x: exMid.x, y: exMid.y },
        { x: exMid.x, y: Math.max(30, exMid.y - 25) }
      ];
      exitLegA = [
        { x: Math.round((stageHub.x + exBot.x) / 2), y: Math.round((stageHub.y + exBot.y) / 2) },
        { x: exBot.x, y: exBot.y },
        { x: exBot.x, y: Math.min(820, exBot.y + 25) }
      ];
      pathSos = [
        stageHub,
        { x: Math.round((stageHub.x + exTop.x) / 2), y: Math.round((stageHub.y + exTop.y) / 2) },
        { x: exTop.x, y: exTop.y },
        { x: exTop.x, y: Math.max(30, exTop.y - 25) }
      ];
    }

    // Connect pathways through from Stage Hub out to designated Exit Gates
    return {
      'C': pathC.concat(exitLegC),
      'B': pathB.concat(exitLegB),
      'A': pathA.concat(exitLegA),
      'EMERGENCY': pathSos
    };
  },

  loadCadPathways: function() {
    // 1. Generate clean default pathways from layout
    const defaults = this.getDefaultCadPathways();
    this.state.cadPathways = JSON.parse(JSON.stringify(defaults));

    // 2. Check for persisted CAD-specific coordinates
    const gm = window.GoogleMapsManager;
    const vid = gm ? (gm.currentVenueId || 'sona-college') : 'sona-college';

    let loaded = null;
    try {
      const raw = localStorage.getItem('cad_flow_pathways_' + vid);
      if (raw) loaded = JSON.parse(raw);
    } catch(e) {}

    // 3. Coordinate validation: ensure waypoints reside in valid CAD space
    if (loaded && typeof loaded === 'object') {
      let isCadValid = true;
      for (const k of ['C', 'B', 'A']) {
        const pts = loaded[k];
        if (!Array.isArray(pts) || pts.length < 2) {
          isCadValid = false; break;
        }
        const start = pts[0];
        const end = pts[pts.length - 1];
        // Ingress start points must originate on East (x > 850), terminating at Exit Gates (x <= 80 for west stage)
        // Discard any legacy points that terminated at stageHub (x > 80) or converted satellite points
        if (start.x < 850 || end.x > 80 || start.y < 90 || end.y > 780) {
          isCadValid = false; break;
        }
      }
      if (isCadValid) {
        if (loaded['EMERGENCY']) {
          const sosPts = loaded['EMERGENCY'];
          const lastPt = sosPts[sosPts.length - 1];
          // If legacy emergency path is short or didn't reach perimeter exit (x > 80), use clean default
          if (!Array.isArray(sosPts) || sosPts.length < 4 || (lastPt && lastPt.x > 80)) {
            loaded['EMERGENCY'] = JSON.parse(JSON.stringify(defaults['EMERGENCY']));
          }
        }
        this.state.cadPathways = loaded;
      } else {
        try { localStorage.removeItem('cad_flow_pathways_' + vid); } catch(e) {}
      }
    }
    this.updatePathwayBadgeCounts();
  },

  saveCadPathways: function(notify = true) {
    const gm = window.GoogleMapsManager;
    const vid = gm ? (gm.currentVenueId || 'sona-college') : 'sona-college';

    // Persist exact CAD coordinates for CAD planner
    try {
      localStorage.setItem('cad_flow_pathways_' + vid, JSON.stringify(this.state.cadPathways));
    } catch(e) {}

    // Convert to GPS for Visitor Map & Routing synchronization
    const gpsPathways = this.getGpsPathways();

    // Extract GPS barricades based on CAD layout setting
    const gpsBarricades = this.getGpsBarricades();
    try {
      localStorage.setItem('flow_barricades_' + vid, JSON.stringify(gpsBarricades));
    } catch(e) {}

    // Extract GPS facilities and boundary based on rotated CAD layout
    const gpsFacilities = this.getGpsFacilities();
    const gpsBoundary = this.getGpsBoundary();
    try {
      localStorage.setItem('flow_facilities_' + vid, JSON.stringify(gpsFacilities));
      localStorage.setItem('flow_boundary_' + vid, JSON.stringify(gpsBoundary));
    } catch(e) {}

    if (window.GoogleMapsManager) {
      if (typeof window.GoogleMapsManager.setFacilities === 'function') {
        window.GoogleMapsManager.setFacilities(gpsFacilities);
      }
      if (typeof window.GoogleMapsManager.setBoundary === 'function') {
        window.GoogleMapsManager.setBoundary(gpsBoundary);
      }
      window.GoogleMapsManager.setBarricades(gpsBarricades, false);
      window.GoogleMapsManager.setCustomPathways(gpsPathways, true);
    } else {
      try {
        localStorage.setItem('flow_pathways_' + vid, JSON.stringify(gpsPathways));
        fetch(`/api/venues/${vid}/pathways`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pathways: gpsPathways, 
            barricades: gpsBarricades,
            facilities: gpsFacilities,
            boundary: gpsBoundary,
            map_rotation: this.state.mapRotationDeg || 0,
            cad_rotation: this.state.cadRotationDeg || 0
          })
        }).catch(() => {});
      } catch(e) {}
    }

    this.updatePathwayBadgeCounts();
    if (notify) {
      this.showToast('✅ Saved CAD pathways and barricades! Synced to Admin & Visitor maps.', 'success');
    }
  },

  setPathwayInteractionMode: function(active) {
    this.state.pathwayEditMode = active;
    this.state.mapInteractionMode = active ? 'pathway' : 'cad';

    const editBtn = document.getElementById('cfModeEditCadBtn');
    const dragBtn = document.getElementById('cfModeDragMapBtn');
    const pwBtn = document.getElementById('cfModePathwayBtn');
    const toolbar = document.getElementById('cfCadPathwayToolbar');
    const statusText = document.getElementById('cfHudStatusText');
    const viewportWrap = document.getElementById('cfViewportWrap');

    if (active) {
      if (editBtn) { editBtn.classList.remove('active'); editBtn.style.background = 'transparent'; editBtn.style.color = '#1e40af'; editBtn.style.boxShadow = 'none'; }
      if (dragBtn) { dragBtn.classList.remove('active'); dragBtn.style.background = 'transparent'; dragBtn.style.color = '#1e40af'; dragBtn.style.boxShadow = 'none'; }
      if (pwBtn) { pwBtn.classList.add('active'); pwBtn.style.background = '#059669'; pwBtn.style.color = '#ffffff'; pwBtn.style.boxShadow = '0 1px 3px rgba(5,150,105,0.4)'; }
      if (toolbar) toolbar.style.display = 'flex';
      if (statusText) statusText.innerHTML = '🛤️ PATHWAY EDIT MODE: CLICK CANVAS TO ADD POINTS • DRAG HANDLES TO MOVE • RIGHT-CLICK TO REMOVE';
      if (viewportWrap) viewportWrap.style.cursor = this.state.pwAddPointMode ? 'crosshair' : 'grab';
      this.showToast('CAD Pathway Editor Active: Click anywhere to add points or drag waypoint handles.', 'info');
    } else {
      if (pwBtn) { pwBtn.classList.remove('active'); pwBtn.style.background = 'transparent'; pwBtn.style.color = '#1e40af'; pwBtn.style.boxShadow = 'none'; }
      if (toolbar) toolbar.style.display = 'none';
      this.setMapInteractionMode('cad');
    }
    this.renderCanvas();
  },

  switchActiveRoute: function(routeKey) {
    this.state.activeRouteKey = routeKey;
    document.querySelectorAll('.cf-pw-route-btn').forEach(btn => {
      const btnRoute = btn.getAttribute('data-route');
      const isMatch = (btnRoute === routeKey);
      btn.classList.toggle('active', isMatch);
      btn.style.boxShadow = isMatch ? '0 0 0 2px #ffffff, 0 0 0 4px #2563eb' : 'none';
    });

    const meta = this.pathwayMeta[routeKey];
    const lbl = document.getElementById('cfPwActiveRouteLabel');
    if (lbl && meta) {
      lbl.textContent = meta.name;
      lbl.style.color = meta.color;
    }
    this.updatePathwayBadgeCounts();
    this.renderCanvas();
  },

  updatePathwayBadgeCounts: function() {
    const counts = { C: 0, B: 0, A: 0, EMERGENCY: 0 };
    for (const [k, pts] of Object.entries(this.state.cadPathways)) {
      if (counts[k] !== undefined) counts[k] = (pts || []).length;
    }
    const elC = document.getElementById('cfPwCountC');
    const elB = document.getElementById('cfPwCountB');
    const elA = document.getElementById('cfPwCountA');
    const elSos = document.getElementById('cfPwCountSos');
    if (elC) elC.textContent = `${counts.C} pts`;
    if (elB) elB.textContent = `${counts.B} pts`;
    if (elA) elA.textContent = `${counts.A} pts`;
    if (elSos) elSos.textContent = `${counts.EMERGENCY} pts`;
  },

  autoRouteActiveRoute: function(routeKey) {
    const key = routeKey || this.state.activeRouteKey || 'C';
    const defaults = this.getDefaultCadPathways();
    // Update active route with fresh default
    if (defaults[key]) {
      this.state.cadPathways[key] = JSON.parse(JSON.stringify(defaults[key]));
    }
    // Also repair any other routes that were distorted or missing
    for (const [k, pts] of Object.entries(defaults)) {
      if (k === 'EMERGENCY') {
        const curSos = this.state.cadPathways['EMERGENCY'];
        if (!curSos || curSos.length < 4 || (curSos[curSos.length - 1] && curSos[curSos.length - 1].x > 80) || k === key) {
          this.state.cadPathways['EMERGENCY'] = JSON.parse(JSON.stringify(pts));
        }
      } else if (!this.state.cadPathways[k] || this.state.cadPathways[k].length < 2 || this.state.cadPathways[k][0].x < 850 || (this.state.cadPathways[k][this.state.cadPathways[k].length - 1] && this.state.cadPathways[k][this.state.cadPathways[k].length - 1].x > 80) || k === key) {
        this.state.cadPathways[k] = JSON.parse(JSON.stringify(pts));
      }
    }
    this.updatePathwayBadgeCounts();
    this.renderCanvas();
    this.saveCadPathways(true);
    this.showToast(`✨ Generated route cleanly from ${this.pathwayMeta[key].gateLabel} through Barricades & Stage to Exit Portal!`, 'success');
  },

  autoRouteAllRoutes: function() {
    this.state.cadPathways = this.getDefaultCadPathways();
    this.updatePathwayBadgeCounts();
    this.renderCanvas();
    this.saveCadPathways(true);
    this.showToast('✨ Cleanly auto-routed all pathways from Entry Gates & Exits!', 'success');
  },

  renderPathwaysSvg: function() {
    const routes = ['C', 'B', 'A', 'EMERGENCY'];
    let html = '<g id="cfSvgPathwaysGroup">';

    routes.forEach(routeKey => {
      const pts = this.state.cadPathways[routeKey] || [];
      if (pts.length < 2) return;

      const meta = this.pathwayMeta[routeKey];
      const isEditing = (this.state.mapInteractionMode === 'pathway' && this.state.activeRouteKey === routeKey);
      const isSos = (routeKey === 'EMERGENCY');
      const d = 'M ' + pts.map(p => `${p.x} ${p.y}`).join(' L ');

      // Glowing underlay
      html += `
        <path d="${d}" fill="none" stroke="${meta.glow}" stroke-width="${meta.strokeWidth + (isEditing ? 12 : 8)}" stroke-opacity="${isEditing ? 0.45 : 0.28}" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${d}" fill="none" stroke="${meta.color}" stroke-width="${meta.strokeWidth + (isEditing ? 1.5 : 0)}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${meta.strokeDash}" />
      `;

      // Directional Flow Chevrons along segments
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
        html += `
          <g transform="translate(${midX}, ${midY}) rotate(${angle})">
            <polygon points="-7,-5 3,0 -7,5" fill="#ffffff" stroke="${meta.color}" stroke-width="1.5" opacity="0.9" />
          </g>
        `;
      }

      // Start Landmark Badge (at Gate on East perimeter for C, B, A; at Stage for SOS)
      const startPt = pts[0];
      const rot = this.getTextRotationAngle();
      const startLabel = isSos ? '🚨 Evacuation Egress' : `${meta.icon} ${meta.gateLabel}`;
      const badgeX = isSos ? Math.round(startPt.x + 85) : (startPt.x - 70);
      const badgeY = isSos ? Math.round(startPt.y - 28) : (startPt.y - 18);

      html += `
        <g class="cf-rotatable-text" data-cx="${badgeX}" data-cy="${badgeY}" transform="rotate(${rot}, ${badgeX}, ${badgeY})">
          <rect x="${badgeX - 65}" y="${badgeY - 11}" width="130" height="22" rx="11" fill="${meta.bg}" stroke="#ffffff" stroke-width="2" filter="url(#cfShadowCard)" />
          <text x="${badgeX}" y="${badgeY + 4}" text-anchor="middle" font-size="9" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff">
            ${startLabel}
          </text>
        </g>
      `;

      // End Landmark Badges (Exit Gate Portals on West Perimeter)
      const endPt = pts[pts.length - 1];
      const badgeEndX = Math.round(endPt.x + 75);
      const badgeEndY = Math.round(endPt.y);
      const exitTitle = isSos ? '🚨 SOS Exit (EX-1)' : (meta.exitLabel ? meta.exitLabel.split('(')[0].trim() : (routeKey === 'C' ? '🚪 Exit EX-1' : routeKey === 'B' ? '🚪 Exit EX-2' : '🚪 Exit EX-4'));
      const badgeFill = isSos ? '#b91c1c' : meta.badgeBg;

      html += `
        <g class="cf-rotatable-text" data-cx="${badgeEndX}" data-cy="${badgeEndY}" transform="rotate(${rot}, ${badgeEndX}, ${badgeEndY})">
          <rect x="${badgeEndX - 65}" y="${badgeEndY - 11}" width="130" height="22" rx="11" fill="${badgeFill}" stroke="#ffffff" stroke-width="2" filter="url(#cfShadowCard)" />
          <text x="${badgeEndX}" y="${badgeEndY + 4}" text-anchor="middle" font-size="9" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff">
            ${exitTitle}
          </text>
        </g>
      `;
    });

    // Central Landmark Badge: Main Stage & Primary Audience Hub (Anchored in front of stage)
    const stage = (this.state.plan && this.state.plan.layout && this.state.plan.layout.stage) || { x: 98, y: 275, width: 105, height: 290 };
    const sp = (this.state.stage_position || 'west').toLowerCase();
    const stageHubX = sp === 'east' ? Math.round(stage.x - 35) : Math.round(stage.x + (stage.width || 105) + 35);
    const stageHubY = Math.round(stage.y + (stage.height || 290) / 2);
    const rot = this.getTextRotationAngle();

    html += `
      <g class="cf-rotatable-text" data-cx="${stageHubX}" data-cy="${stageHubY + 28}" transform="rotate(${rot}, ${stageHubX}, ${stageHubY + 28})">
        <rect x="${stageHubX - 88}" y="${stageHubY + 17}" width="176" height="22" rx="11" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2" filter="url(#cfShadowCard)" />
        <text x="${stageHubX}" y="${stageHubY + 32}" text-anchor="middle" font-size="9.5" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff">
          🏟️ Main Stage / Destination Hub
        </text>
      </g>
    `;

    // Interactive Draggable Waypoint Handles (when in Pathway Edit Mode)
    if (this.state.mapInteractionMode === 'pathway') {
      const activeKey = this.state.activeRouteKey || 'C';
      const pts = this.state.cadPathways[activeKey] || [];
      const meta = this.pathwayMeta[activeKey];

      pts.forEach((pt, idx) => {
        html += `
          <g class="cf-pathway-handle" data-route="${activeKey}" data-index="${idx}" style="cursor:grab;">
            <circle cx="${pt.x}" cy="${pt.y}" r="12" fill="${meta.color}" stroke="#ffffff" stroke-width="3" filter="url(#cfShadowCard)" />
            <text x="${pt.x}" y="${pt.y + 4.5}" text-anchor="middle" font-size="10.5" font-weight="900" font-family="'Outfit', sans-serif" fill="#ffffff" pointer-events="none">${idx + 1}</text>
          </g>
        `;
      });
    }

    html += '</g>';
    return html;
  },

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
