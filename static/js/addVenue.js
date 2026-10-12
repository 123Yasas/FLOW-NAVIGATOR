/**
 * FlowNavigator - Add Custom Venue Module
 * Allows users to register custom grounds/events (college, sports, festival, etc.)
 * with size-based automatic capacity estimation and live monitoring integration.
 */

const AddVenueManager = {
  // NFPA 101 / assembly occupancy density standards (m2 per person)
  DENSITY_STANDARDS: {
    'college-event':    1.4,
    'sports-ground':    1.2,
    'outdoor-festival': 1.0,
    'concert-hall':     0.65,
    'exhibition':       2.8,
    'pilgrimage':       0.75,
    'transit':          1.5,
    'custom':           1.5,
  },

  customVenues: [],

  init: function () {
    this.loadFromStorage();
    this.bindModal();
    this.bindPresets();
    this.bindSizeAutoCalc();
    this.bindSubmit();
    this.restoreDropdownOptions();
  },

  bindModal: function () {
    const openBtn     = document.getElementById('openAddVenueModalBtn');
    const adminAddBtn = document.getElementById('adminOpenAddVenueBtn');
    const modal       = document.getElementById('addVenueModal');
    const closeBtn    = document.getElementById('closeAddVenueModalBtn');
    const closeBtn2   = document.getElementById('closeAddVenueModalBtn2');

    if (openBtn)     openBtn.addEventListener('click', () => this.openModal());
    if (adminAddBtn) adminAddBtn.addEventListener('click', () => this.openModal());
    if (closeBtn)    closeBtn.addEventListener('click', () => this.closeModal());
    if (closeBtn2)   closeBtn2.addEventListener('click', () => this.closeModal());

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal();
      });
    }
  },

  openModal: function () {
    const modal = document.getElementById('addVenueModal');
    if (modal) {
      modal.classList.add('active');
      if (window.lucide) lucide.createIcons();
      this.renderAddedList();
    }
  },

  closeModal: function () {
    const modal = document.getElementById('addVenueModal');
    if (modal) modal.classList.remove('active');
    this.clearForm();
  },

  clearForm: function () {
    ['avName', 'avCity', 'avDate', 'avLength', 'avWidth', 'avArea', 'avCapacity']
      .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const avGates = document.getElementById('avGates'); if (avGates) avGates.value = '4';
    const avZones = document.getElementById('avZones'); if (avZones) avZones.value = '5';
    const avType  = document.getElementById('avType');  if (avType)  avType.value = 'college-event';
    this.hideCapacityHint();
    document.querySelectorAll('.av-preset-btn').forEach(b => b.classList.remove('active'));
  },

  bindPresets: function () {
    document.querySelectorAll('.av-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.av-preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const len   = btn.dataset.length;
        const width = btn.dataset.width;
        const cap   = btn.dataset.cap;
        const zones = btn.dataset.zones;
        const gates = btn.dataset.gates;

        const avLength = document.getElementById('avLength');
        const avWidth  = document.getElementById('avWidth');
        const avArea   = document.getElementById('avArea');
        const avCap    = document.getElementById('avCapacity');
        const avZones  = document.getElementById('avZones');
        const avGates  = document.getElementById('avGates');

        if (avLength) avLength.value = len;
        if (avWidth)  avWidth.value  = width;
        if (avArea)   avArea.value   = parseInt(len) * parseInt(width);
        if (avCap)    avCap.value    = cap;
        if (avZones)  avZones.value  = zones;
        if (avGates)  avGates.value  = gates;

        this.showCapacityHint(parseInt(cap));
      });
    });
  },

  bindSizeAutoCalc: function () {
    const inputs = ['avLength', 'avWidth', 'avArea', 'avType'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.recalcCapacity());
    });
  },

  recalcCapacity: function () {
    const length    = parseFloat(document.getElementById('avLength')?.value || 0);
    const width     = parseFloat(document.getElementById('avWidth')?.value  || 0);
    const areaInput = parseFloat(document.getElementById('avArea')?.value   || 0);
    const type      = document.getElementById('avType')?.value || 'custom';

    let area = 0;
    if (length > 0 && width > 0) {
      area = length * width;
      const avArea = document.getElementById('avArea');
      if (avArea && !avArea.value) avArea.value = Math.round(area);
    } else if (areaInput > 0) {
      area = areaInput;
    }

    if (area <= 0) { this.hideCapacityHint(); return; }

    const density   = this.DENSITY_STANDARDS[type] || 1.5;
    const estimated = Math.round(area / density);

    const avCap = document.getElementById('avCapacity');
    if (avCap && (!avCap.value || avCap.dataset.autoFilled === 'true')) {
      avCap.value = estimated;
      avCap.dataset.autoFilled = 'true';
    }

    this.showCapacityHint(estimated, area, density);
  },

  showCapacityHint: function (capacity, area, density) {
    const hint = document.getElementById('avCapacityHint');
    const val  = document.getElementById('avCapacityHintValue');
    if (!hint || !val) return;

    const safeNum  = capacity.toLocaleString();
    const lowAlert = capacity > 10000 ? ' - Mega event: multi-agency safety coordination recommended' :
                     capacity > 5000  ? ' - Large event: dedicated crowd management team required' :
                     capacity > 2000  ? ' - Medium event: zoned entry & timed ticketing advised' :
                                        ' - Small event: standard crowd flow measures apply';

    val.innerHTML = '<strong>' + safeNum + ' people</strong>' +
      (area ? ' based on ' + Math.round(area).toLocaleString() + ' m2 at 1 person / ' + density + ' m2' : '') +
      lowAlert;
    hint.style.display = 'block';
  },

  hideCapacityHint: function () {
    const hint = document.getElementById('avCapacityHint');
    if (hint) hint.style.display = 'none';
  },

  bindSubmit: function () {
    const btn = document.getElementById('addVenueSubmitBtn');
    if (btn) btn.addEventListener('click', () => this.submitVenue());
  },

  submitVenue: function () {
    const name     = document.getElementById('avName')?.value.trim();
    const type     = document.getElementById('avType')?.value;
    const capacity = parseInt(document.getElementById('avCapacity')?.value || 0);
    const length   = parseFloat(document.getElementById('avLength')?.value || 0);
    const width    = parseFloat(document.getElementById('avWidth')?.value  || 0);
    const area     = parseFloat(document.getElementById('avArea')?.value   || (length * width) || 0);
    const gates    = parseInt(document.getElementById('avGates')?.value  || 4);
    const zones    = parseInt(document.getElementById('avZones')?.value  || 5);
    const city     = document.getElementById('avCity')?.value.trim() || '';
    const date     = document.getElementById('avDate')?.value || '';

    if (!name)              { this.flashError('avName', 'Please enter a venue name'); return; }
    if (!capacity || capacity < 50) { this.flashError('avCapacity', 'Please enter a valid capacity (min 50)'); return; }

    const typeEmoji = {
      'college-event': 'Grad', 'sports-ground': 'Sport', 'outdoor-festival': 'Festival',
      'concert-hall': 'Concert', 'exhibition': 'Expo', 'pilgrimage': 'Pilgrimage',
      'transit': 'Transit', 'custom': 'Custom'
    };

    const venueId   = 'custom-' + Date.now();
    const label     = '[' + (typeEmoji[type] || 'Custom') + '] ' + name + (city ? ' (' + city + ')' : '');
    const dropLabel = name + (city ? ' - ' + city : '');

    const venue = {
      id: venueId, name, type, capacity, area, gates, zones, city, date, label,
      lat: 11.0168 + (Math.random() - 0.5) * 2,
      lng: 76.9558 + (Math.random() - 0.5) * 2,
      addedAt: new Date().toISOString()
    };

    this.customVenues.push(venue);
    this.saveToStorage();

    this.addDropdownOption(venueId, dropLabel);
    this.registerWithMapsManager(venue);

    if (window.FlowApp) window.FlowApp.setVenue(venueId);

    this.renderAddedList();
    this.showSuccessToast(name, capacity);
    this.clearForm();

    setTimeout(() => this.closeModal(), 1200);
  },

  flashError: function (inputId, msg) {
    const el = document.getElementById(inputId);
    if (el) {
      el.style.borderColor = '#b91c1c';
      el.style.boxShadow = '0 0 0 3px rgba(185,28,28,0.15)';
      el.focus();
      setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 2000);
    }
    console.warn('[AddVenue]', msg);
  },

  addDropdownOption: function (venueId, label) {
    const select = document.getElementById('venueSelect');
    if (!select) return;
    if (select.querySelector('option[value="' + venueId + '"]')) return;
    const opt = document.createElement('option');
    opt.value = venueId;
    opt.textContent = label;
    opt.dataset.custom = 'true';
    select.appendChild(opt);
    select.value = venueId;
  },

  registerWithMapsManager: function (venue) {
    if (!window.GoogleMapsManager) return;

    const zoneNames = [
      'Main Entry Plaza', 'Central Field', 'North Stand', 'South Block',
      'East Pavilion', 'West Wing', 'VIP Enclosure', 'Media Zone',
      'Food & Beverage Court', 'Emergency Muster Point'
    ];

    const perZoneCap = Math.round(venue.capacity / venue.zones);
    const zones = Array.from({ length: venue.zones }, (_, i) => ({
      id: 'zone-' + String.fromCharCode(65 + i),
      name: zoneNames[i] || ('Zone ' + String.fromCharCode(65 + i)),
      capacity: perZoneCap
    }));

    window.GoogleMapsManager.venueConfigs[venue.id] = {
      name: venue.name,
      lat: venue.lat,
      lng: venue.lng,
      zoom: venue.area > 100000 ? 14 : venue.area > 20000 ? 15 : 16,
      capacity: venue.capacity,
      area: venue.area,
      type: venue.type,
      gates: venue.gates,
      zones: zones,
      isCustom: true
    };
  },

  renderAddedList: function () {
    const container = document.getElementById('avAddedList');
    const body      = document.getElementById('avAddedListBody');
    if (!container || !body) return;

    if (!this.customVenues.length) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    body.innerHTML = this.customVenues.map(v =>
      '<div class="av-venue-chip">' +
        '<span>' + v.label + ' &nbsp;·&nbsp; <strong>' + v.capacity.toLocaleString() + ' ppl</strong>' +
          (v.area ? ' · ' + Math.round(v.area).toLocaleString() + ' m²' : '') +
        '</span>' +
        '<button onclick="AddVenueManager.removeVenue(\'' + v.id + '\')" title="Remove">✕</button>' +
      '</div>'
    ).join('');
  },

  removeVenue: function (venueId) {
    this.customVenues = this.customVenues.filter(v => v.id !== venueId);
    this.saveToStorage();

    const select = document.getElementById('venueSelect');
    const opt = select?.querySelector('option[value="' + venueId + '"]');
    if (opt) opt.remove();

    if (window.FlowApp && window.FlowApp.activeVenueId === venueId) {
      window.FlowApp.setVenue('palani-gathering');
    }

    if (window.GoogleMapsManager?.venueConfigs?.[venueId]) {
      delete window.GoogleMapsManager.venueConfigs[venueId];
    }

    this.renderAddedList();
  },

  showSuccessToast: function (name, capacity) {
    const existing = document.getElementById('avSuccessToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'avSuccessToast';
    toast.style.cssText = [
      'position:fixed', 'bottom:2rem', 'right:2rem', 'z-index:99999',
      'background:#065f46', 'color:#d1fae5', 'padding:1rem 1.4rem',
      'border-radius:12px', 'font-size:0.88rem', 'font-weight:700',
      'box-shadow:0 8px 32px rgba(0,0,0,0.18)', 'display:flex',
      'align-items:center', 'gap:0.65rem', 'max-width:360px'
    ].join(';');
    toast.innerHTML =
      '<span style="font-size:1.4rem;">&#10003;</span>' +
      '<div>' +
        '<div>' + name + ' added successfully!</div>' +
        '<div style="font-size:0.78rem;font-weight:500;opacity:0.8;">Monitoring started &middot; ' + capacity.toLocaleString() + ' person capacity</div>' +
      '</div>';
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
  },

  saveToStorage: function () {
    try { localStorage.setItem('fn_custom_venues', JSON.stringify(this.customVenues)); }
    catch (e) { console.warn('[AddVenue] Storage save failed:', e); }
  },

  loadFromStorage: function () {
    try {
      const raw = localStorage.getItem('fn_custom_venues');
      this.customVenues = raw ? JSON.parse(raw) : [];
    } catch (e) { this.customVenues = []; }
  },

  restoreDropdownOptions: function () {
    this.customVenues.forEach(v => {
      this.addDropdownOption(v.id, v.label);
      this.registerWithMapsManager(v);
    });
  }
};

window.AddVenueManager = AddVenueManager;

document.addEventListener('DOMContentLoaded', () => {
  AddVenueManager.init();
});
