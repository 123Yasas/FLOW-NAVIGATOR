/**
 * FlowNavigator - Core Application Orchestration & State Management
 * Connects Frontend HTML/CSS/JS with Flask REST Backend, MongoDB,
 * Predictive ML Pipeline, Gate Entry Counters, and Venue Spatial Maps.
 */

const FlowApp = {
  currentRole: 'landing',
  currentAdminTab: 'overview',
  activeVenueId: 'palani-gathering',
  isSeniorMode: false,
  emergencyActive: false,
  dataMode: 'demo', // 'demo' or 'real'
  isAdminLoggedIn: Boolean(sessionStorage.getItem('fn_admin_token')),
  pollTimer: null,
  cachedAnalyticsData: [],

  init: function() {
    this.bindRoleNavigation();
    this.bindAdminAuth();
    this.bindAdminSidebar();
    this.bindDataModeToggle();
    this.bindEsp32HardwareManager();
    this.bindSeniorMode();
    this.bindEmergencyProtocol();
    this.bindVenueSelector();
    this.bindEventPlanner();
    this.bindAnalyticsFilters();
    this.bindMapsKeyModal();
    this.startClock();

    // Default entry: Landing view
    this.switchRole('landing');

    // Initialize sub-modules
    if (window.GoogleMapsManager) window.GoogleMapsManager.init();
    if (window.SensorSimulator) window.SensorSimulator.init();
    if (window.MlDashboard) window.MlDashboard.init();
    if (window.CadPlanner) window.CadPlanner.init();

    // Initial data fetch and start background polling
    this.refreshData();
    this.generateAnalyticsData();
    this.pollTimer = setInterval(() => this.refreshData(), 4000);
  },

  // -------------------- ROLE NAVIGATION & ADMIN AUTH --------------------
  bindRoleNavigation: function() {
    const roles = ['landing', 'visitor', 'admin', 'kiosk'];
    roles.forEach(role => {
      const btn = document.getElementById(`role${role.charAt(0).toUpperCase() + role.slice(1)}Btn`);
      if (btn) {
        btn.addEventListener('click', () => {
          if (role === 'admin' && !this.isAdminLoggedIn) {
            this.openAdminLoginModal();
          } else {
            this.switchRole(role);
          }
        });
      }
    });

    const brandBtn = document.getElementById('brandHomeBtn');
    if (brandBtn) brandBtn.addEventListener('click', () => this.switchRole('landing'));

    const kioskExitBtn = document.getElementById('kioskExitBtn');
    if (kioskExitBtn) kioskExitBtn.addEventListener('click', () => this.switchRole('visitor'));

    const landingVisitorBtn = document.getElementById('landingVisitorCtaBtn');
    if (landingVisitorBtn) landingVisitorBtn.addEventListener('click', () => this.switchRole('visitor'));

    const landingAdminBtn = document.getElementById('landingAdminCtaBtn');
    if (landingAdminBtn) {
      landingAdminBtn.addEventListener('click', () => {
        if (this.isAdminLoggedIn) {
          this.switchRole('admin');
        } else {
          this.openAdminLoginModal();
        }
      });
    }
  },

  bindAdminAuth: function() {
    const modal = document.getElementById('adminLoginModal');
    const closeBtn = document.getElementById('closeAdminLoginModalBtn');
    const cancelBtn = document.getElementById('cancelAdminLoginBtn');
    const form = document.getElementById('adminLoginForm');
    const autoFillBtn = document.getElementById('autoFillDemoAdminBtn');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeAdminLoginModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeAdminLoginModal());
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeAdminLoginModal();
      });
    }

    if (autoFillBtn) {
      autoFillBtn.addEventListener('click', () => {
        const u = document.getElementById('adminUsernameInput');
        const p = document.getElementById('adminPasswordInput');
        if (u) u.value = 'admin';
        if (p) p.value = 'admin123';
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.performAdminLogin();
      });
    }

    // Bind Sign Out buttons
    const navSignOut = document.getElementById('navSignOutBtn');
    const sidebarSignOut = document.getElementById('adminSidebarLogoutBtn');
    const tabSignOut = document.getElementById('adminTabSignOutBtn');

    if (navSignOut) navSignOut.addEventListener('click', () => this.adminLogout());
    if (sidebarSignOut) sidebarSignOut.addEventListener('click', () => this.adminLogout());
    if (tabSignOut) tabSignOut.addEventListener('click', () => this.adminLogout());

    this.bindUserManagement();
    this.updateAdminNavBadge();
  },

  openAdminLoginModal: function() {
    const modal = document.getElementById('adminLoginModal');
    const err = document.getElementById('adminLoginError');
    if (err) err.style.display = 'none';
    if (modal) {
      modal.classList.add('active');
      const u = document.getElementById('adminUsernameInput');
      if (u) u.focus();
      if (window.lucide) lucide.createIcons();
    }
  },

  closeAdminLoginModal: function() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) modal.classList.remove('active');
  },

  performAdminLogin: async function() {
    const u = document.getElementById('adminUsernameInput')?.value.trim();
    const p = document.getElementById('adminPasswordInput')?.value.trim();
    const err = document.getElementById('adminLoginError');
    const submitBtn = document.getElementById('submitAdminLoginBtn');

    if (!u || !p) {
      if (err) {
        err.textContent = 'Please enter both username and password';
        err.style.display = 'block';
      }
      return;
    }

    try {
      if (submitBtn) submitBtn.disabled = true;

      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        this.isAdminLoggedIn = true;
        sessionStorage.setItem('fn_admin_token', data.token);
        this.closeAdminLoginModal();
        this.updateAdminNavBadge();
        this.switchRole('admin');
      } else {
        if (err) {
          err.textContent = data.message || 'Invalid username or password (use admin / admin123)';
          err.style.display = 'block';
        }
      }
    } catch (e) {
      console.error('[AdminLogin] Error:', e);
      if (u === 'admin' && p === 'admin123') {
        this.isAdminLoggedIn = true;
        sessionStorage.setItem('fn_admin_token', 'fn_admin_session_token_authenticated');
        this.closeAdminLoginModal();
        this.updateAdminNavBadge();
        this.switchRole('admin');
      } else if (err) {
        err.textContent = 'Login failed. Please verify credentials (admin / admin123)';
        err.style.display = 'block';
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  },

  adminLogout: function() {
    this.isAdminLoggedIn = false;
    sessionStorage.removeItem('fn_admin_token');
    this.updateAdminNavBadge();
    this.switchRole('landing');

    // Show toast message
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:99999;background:#b91c1c;color:#fff;padding:0.85rem 1.25rem;border-radius:10px;font-size:0.85rem;font-weight:700;box-shadow:0 8px 32px rgba(0,0,0,0.2);display:flex;align-items:center;gap:0.5rem;';
    toast.innerHTML = '<i data-lucide="log-out"></i> Signed out of Admin Command Center successfully';
    document.body.appendChild(toast);
    if (window.lucide) lucide.createIcons();
    setTimeout(() => toast.remove(), 3500);
  },

  updateAdminNavBadge: function() {
    const adminBtn = document.getElementById('roleAdminBtn');
    const navSignOut = document.getElementById('navSignOutBtn');

    if (this.isAdminLoggedIn) {
      if (adminBtn) {
        adminBtn.innerHTML = `
          <i data-lucide="shield-check" style="width:15px;height:15px;color:#10b981;"></i>
          <span>Admin (Active)</span>
        `;
      }
      if (navSignOut) navSignOut.style.display = 'inline-flex';
    } else {
      if (adminBtn) {
        adminBtn.innerHTML = `
          <i data-lucide="shield-alert" style="width:15px;height:15px;"></i>
          <span>Admin Center</span>
        `;
      }
      if (navSignOut) navSignOut.style.display = 'none';
    }
    if (window.lucide) lucide.createIcons();
  },

  switchRole: function(role) {
    this.currentRole = role;

    // Update nav button active states
    document.querySelectorAll('.role-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.role === role);
    });

    // Update visible view section
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(`${role}View`);
    if (target) target.classList.add('active');

    // Add Venue button: ONLY visible in Admin Center when logged in
    const addVenueBtn = document.getElementById('openAddVenueModalBtn');
    if (addVenueBtn) {
      addVenueBtn.style.display = (role === 'admin' && this.isAdminLoggedIn) ? 'flex' : 'none';
    }

    // Trigger icon render
    if (window.lucide) lucide.createIcons();

    // Trigger map resize if switching to admin or visitor
    if (window.GoogleMapsManager) {
      if (role === 'visitor') window.GoogleMapsManager.mountSingleMap('googleMapDiv', window.GoogleMapsManager.venueConfigs[this.activeVenueId]);
      if (role === 'admin') window.GoogleMapsManager.mountSingleMap('googleMapAdminDiv', window.GoogleMapsManager.venueConfigs[this.activeVenueId]);
    }

    if (role === 'kiosk') {
      this.generateKioskQrCode();
    }
  },

  // -------------------- VERTICAL ADMIN SIDEBAR --------------------
  bindAdminSidebar: function() {
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchAdminTab(tab);
      });
    });

    // Admin center open venue modal button
    const adminAddBtn = document.getElementById('adminOpenAddVenueBtn');
    if (adminAddBtn) {
      adminAddBtn.addEventListener('click', () => {
        if (window.AddVenueManager) window.AddVenueManager.openModal();
      });
    }

    // Map venue pill buttons
    document.querySelectorAll('.venue-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const vid = pill.dataset.vid;
        document.querySelectorAll('.venue-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        const sel = document.getElementById('venueSelect');
        if (sel) sel.value = vid;
        this.setVenue(vid);
      });
    });

    // Quick Command Center actions
    const divertBtn = document.getElementById('adminTriggerDiversionBtn');
    if (divertBtn) {
      divertBtn.addEventListener('click', () => {
        alert('📢 Diversion Broadcast Sent: Variable message signs & audio beacons instructed visitors to take Route C (North Express Lane).');
      });
    }

    const evacBtn = document.getElementById('adminEvacuateTriggerBtn');
    if (evacBtn) evacBtn.addEventListener('click', () => this.triggerEmergency(true));

    const simBurstBtn = document.getElementById('adminSimulateTickBtn');
    if (simBurstBtn) {
      simBurstBtn.addEventListener('click', () => {
        if (window.SensorSimulator) window.SensorSimulator.simulateBurst();
      });
    }

    const refreshZonesBtn = document.getElementById('refreshZonesBtn');
    if (refreshZonesBtn) refreshZonesBtn.addEventListener('click', () => this.refreshData());
  },

  switchAdminTab: function(tab) {
    this.currentAdminTab = tab;
    document.querySelectorAll('.admin-nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById(`tab-${tab}`);
    if (target) target.classList.add('active');

    if (window.lucide) lucide.createIcons();

    if (tab === 'google-maps-tab' && window.GoogleMapsManager) {
      window.GoogleMapsManager.mountSingleMap('googleMapAdminDiv', window.GoogleMapsManager.venueConfigs[this.activeVenueId]);
    }

    if (tab === 'event-planner' && window.CadPlanner) {
      window.CadPlanner.render();
    }

    if (tab === 'user-management') {
      this.fetchUsers();
    }

    if (tab === 'esp32-iot') {
      this.fetchEsp32Sensors();
    }
  },

  // -------------------- DATA MODE SWITCHER (DEMO VS REAL ESP32) --------------------
  bindDataModeToggle: function() {
    const demoBtn = document.getElementById('modeDemoBtn');
    const realBtn = document.getElementById('modeRealBtn');

    if (demoBtn) demoBtn.addEventListener('click', () => this.setDataMode('demo'));
    if (realBtn) realBtn.addEventListener('click', () => this.setDataMode('real'));

    // Check backend current mode
    this.fetchDataMode();
  },

  fetchDataMode: async function() {
    try {
      const resp = await fetch('/api/system/mode');
      const data = await resp.json();
      if (data.data_mode) {
        this.dataMode = data.data_mode;
        this.updateDataModeUI(this.dataMode);
      }
    } catch (e) {
      console.warn('[DataMode] Error fetching mode:', e);
    }
  },

  setDataMode: async function(mode) {
    try {
      const resp = await fetch('/api/system/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: mode })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        this.dataMode = data.data_mode;
        this.updateDataModeUI(this.dataMode);
        
        // Show toast
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:2rem;right:2rem;z-index:99999;background:${mode === 'real' ? '#047857' : '#1d4ed8'};color:#fff;padding:0.85rem 1.25rem;border-radius:10px;font-size:0.85rem;font-weight:700;box-shadow:0 8px 32px rgba(0,0,0,0.2);display:flex;align-items:center;gap:0.5rem;`;
        toast.innerHTML = `<i data-lucide="${mode === 'real' ? 'radio' : 'sparkles'}"></i> System switched to ${mode === 'real' ? 'Real ESP32 IoT Live Mode' : 'Demo Simulation Mode'}`;
        document.body.appendChild(toast);
        if (window.lucide) lucide.createIcons();
        setTimeout(() => toast.remove(), 3500);

        this.refreshData();
      }
    } catch (e) {
      console.error('[DataMode] Error setting mode:', e);
    }
  },

  updateDataModeUI: function(mode) {
    const demoBtn = document.getElementById('modeDemoBtn');
    const realBtn = document.getElementById('modeRealBtn');
    const modeBadge = document.getElementById('esp32ModeBadge');
    const modeDisplay = document.getElementById('esp32CurrentModeDisplay');

    if (demoBtn) demoBtn.classList.toggle('active', mode === 'demo');
    if (realBtn) realBtn.classList.toggle('active', mode === 'real');

    if (modeBadge) {
      modeBadge.textContent = mode === 'real' ? '● LIVE ESP32 HARDWARE ACTIVE' : '● DEMO SIMULATION MODE';
      modeBadge.className = `badge ${mode === 'real' ? 'badge-safe' : 'badge-moderate'}`;
    }

    if (modeDisplay) {
      modeDisplay.textContent = mode === 'real' ? 'REAL IOT MODE' : 'DEMO MODE';
      modeDisplay.style.color = mode === 'real' ? '#059669' : '#2563eb';
    }

    // Toggle simulator
    if (window.SensorSimulator) {
      window.SensorSimulator.isPaused = (mode === 'real');
    }
  },

  // -------------------- ESP32 TOF HARDWARE FLEET MANAGER --------------------
  bindEsp32HardwareManager: function() {
    const refreshBtn = document.getElementById('refreshEsp32Btn');
    const form = document.getElementById('addEsp32Form');
    const copyCodeBtn = document.getElementById('copyEsp32CodeBtn');

    if (refreshBtn) refreshBtn.addEventListener('click', () => this.fetchEsp32Sensors());
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.registerEsp32Sensor();
      });
    }

    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        const code = document.getElementById('esp32CodeBlock')?.innerText;
        if (code) {
          navigator.clipboard.writeText(code);
          copyCodeBtn.innerHTML = '<i data-lucide="check" style="width:13px;height:13px;"></i> Copied C++ Code!';
          if (window.lucide) lucide.createIcons();
          setTimeout(() => {
            copyCodeBtn.innerHTML = '<i data-lucide="copy" style="width:13px;height:13px;"></i> Copy C++ Code';
            if (window.lucide) lucide.createIcons();
          }, 2500);
        }
      });
    }
  },

  fetchEsp32Sensors: async function() {
    const tbody = document.getElementById('esp32RosterTableBody');
    const statCount = document.getElementById('esp32StatCount');
    if (!tbody) return;

    try {
      const resp = await fetch('/api/sensors');
      const data = await resp.json();
      const sensors = data.sensors || [];
      const mode = data.data_mode || this.dataMode;

      if (statCount) statCount.textContent = `${sensors.length} Units`;

      if (sensors.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; padding:2.5rem 1.5rem; background:#f8fafc;">
              <div style="font-size:1.15rem; font-weight:800; color:#047857; margin-bottom:0.35rem; display:flex; align-items:center; justify-content:center; gap:0.4rem;">
                <i data-lucide="radio" style="width:18px;height:18px;color:#059669;"></i>
                Real ESP32 IoT Mode Active (Demo Sensors Revoked)
              </div>
              <p style="font-size:0.85rem; color:var(--text-muted); max-width:480px; margin:0 auto 1rem auto; line-height:1.5;">
                Synthetic demo sensors are revoked in Real mode. Register your physical ESP32 board using the form on the right or flash the C++ firmware snippet below.
              </p>
              <div style="font-size:0.78rem; font-family:monospace; background:#ecfdf5; color:#047857; display:inline-block; padding:0.4rem 0.85rem; border-radius:6px; border:1px solid #a7f3d0; font-weight:700;">
                Listening for POST payloads at /api/sensors/count
              </div>
            </td>
          </tr>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      tbody.innerHTML = sensors.map(s => {
        const isOnline = s.status === 'ONLINE';
        const net = (s.people_in || 0) - (s.people_out || 0);

        return `
          <tr>
            <td>
              <div style="font-weight:800; color:var(--text-main); font-size:0.88rem;">${s.id}</div>
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${s.controller || 'ESP32'} · ${s.firmware_version || 'v4.0'}</div>
            </td>
            <td>
              <div style="font-weight:700; color:#2563eb; font-size:0.82rem;">${s.zone_name || s.zone_id}</div>
              <div style="font-size:0.72rem; color:var(--text-muted);">${s.sensor_type || 'Dual VL53L0X ToF'}</div>
            </td>
            <td style="font-family:monospace; font-size:0.78rem; color:var(--text-muted);">
              <div>IP: ${s.ip_address || '192.168.1.105'}</div>
              <div>MAC: ${s.mac_address || '24:0A:C4:00:01:10'}</div>
            </td>
            <td>
              <div style="font-size:0.82rem;">
                <span style="color:#059669; font-weight:700;">+${s.people_in || 0} in</span> · 
                <span style="color:#b91c1c; font-weight:700;">-${s.people_out || 0} out</span>
              </div>
              <div style="font-weight:800; color:#2563eb; font-size:0.78rem;">Net: ${net >= 0 ? '+' : ''}${net} present</div>
            </td>
            <td>
              <span class="badge ${isOnline ? 'badge-safe' : 'badge-critical'}" style="font-size:0.72rem;">
                ● ${s.status || 'ONLINE'}
              </span>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">
                Battery: ${s.battery_pct || 98}% · RSSI: ${s.signal_dbm || -55} dBm
              </div>
            </td>
            <td>
              <button class="btn btn-outline btn-sm" style="color:#b91c1c; border-color:#fca5a5; background:#fef2f2; font-size:0.72rem; padding:0.25rem 0.55rem;" onclick="FlowApp.deleteEsp32Sensor('${s.id}')">
                Remove
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (e) {
      console.error('[Esp32Manager] Fetch error:', e);
    }
  },

  registerEsp32Sensor: async function() {
    const idInput = document.getElementById('esp32IdInput');
    const zoneSelect = document.getElementById('esp32ZoneSelect');
    const controllerInput = document.getElementById('esp32ControllerInput');
    const sensorTypeInput = document.getElementById('esp32SensorTypeInput');
    const ipInput = document.getElementById('esp32IpInput');
    const macInput = document.getElementById('esp32MacInput');
    const feedback = document.getElementById('addEsp32Feedback');
    const btn = document.getElementById('submitAddEsp32Btn');

    const id = idInput?.value.trim();
    const zoneId = zoneSelect?.value;
    const zoneName = zoneSelect?.options[zoneSelect.selectedIndex]?.text || 'Main Gate';
    const controller = controllerInput?.value;
    const sensorType = sensorTypeInput?.value;
    const ip = ipInput?.value.trim() || '192.168.1.120';
    const mac = macInput?.value.trim() || '24:0A:C4:00:01:10';

    if (!id) {
      if (feedback) {
        feedback.textContent = 'Please enter a device identifier';
        feedback.style.background = '#fef2f2';
        feedback.style.color = '#b91c1c';
        feedback.style.display = 'block';
      }
      return;
    }

    try {
      if (btn) btn.disabled = true;

      const resp = await fetch('/api/sensors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensor_id: id,
          zone_id: zoneId,
          zone_name: zoneName,
          controller: controller,
          sensor_type: sensorType,
          ip_address: ip,
          mac_address: mac
        })
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        if (feedback) {
          feedback.textContent = `✅ ESP32 Unit '${id}' registered successfully`;
          feedback.style.background = '#ecfdf5';
          feedback.style.color = '#047857';
          feedback.style.display = 'block';
        }
        if (idInput) idInput.value = '';
        if (ipInput) ipInput.value = '';
        if (macInput) macInput.value = '';
        this.fetchEsp32Sensors();
        setTimeout(() => { if (feedback) feedback.style.display = 'none'; }, 3000);
      } else {
        if (feedback) {
          feedback.textContent = data.message || 'Error registering ESP32 hardware';
          feedback.style.background = '#fef2f2';
          feedback.style.color = '#b91c1c';
          feedback.style.display = 'block';
        }
      }
    } catch (e) {
      console.error('[Esp32Manager] Register error:', e);
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  deleteEsp32Sensor: async function(sensorId) {
    if (!confirm(`Are you sure you want to remove ESP32 hardware unit '${sensorId}'?`)) return;

    try {
      const resp = await fetch(`/api/sensors/${sensorId}`, { method: 'DELETE' });
      const data = await resp.json();
      if (resp.ok && data.success) {
        this.fetchEsp32Sensors();
      } else {
        alert(data.message || 'Could not remove sensor');
      }
    } catch (e) {
      console.error('[Esp32Manager] Delete error:', e);
    }
  },

  // -------------------- PUBLIC KIOSK DYNAMIC QR CODE --------------------
  generateKioskQrCode: async function() {
    const container = document.getElementById('kioskQrCodeContainer');
    const directUrlEl = document.getElementById('kioskDirectUrl');
    if (!container) return;

    let targetUrl = window.location.origin + '/?role=visitor';

    try {
      const resp = await fetch('/api/system/network_ip');
      const data = await resp.json();
      if (data.visitor_url) {
        targetUrl = data.visitor_url;
      }
    } catch (e) {
      console.warn('[KioskQR] Network IP fetch error:', e);
    }

    if (directUrlEl) directUrlEl.textContent = targetUrl;

    // Render high-res SVG vector QR Code representation
    const qrSvg = `
      <svg width="98" height="98" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="29" height="29" fill="white"/>
        <!-- Top Left Finder Pattern -->
        <rect x="2" y="2" width="7" height="7" fill="#0f172a"/>
        <rect x="3" y="3" width="5" height="5" fill="white"/>
        <rect x="4" y="4" width="3" height="3" fill="#0f172a"/>
        <!-- Top Right Finder Pattern -->
        <rect x="20" y="2" width="7" height="7" fill="#0f172a"/>
        <rect x="21" y="3" width="5" height="5" fill="white"/>
        <rect x="22" y="4" width="3" height="3" fill="#0f172a"/>
        <!-- Bottom Left Finder Pattern -->
        <rect x="2" y="20" width="7" height="7" fill="#0f172a"/>
        <rect x="3" y="21" width="5" height="5" fill="white"/>
        <rect x="4" y="22" width="3" height="3" fill="#0f172a"/>
        <!-- Alignment & Data Modules -->
        <rect x="11" y="2" width="2" height="2" fill="#2563eb"/>
        <rect x="15" y="2" width="2" height="2" fill="#0f172a"/>
        <rect x="11" y="5" width="2" height="2" fill="#0f172a"/>
        <rect x="14" y="5" width="3" height="2" fill="#2563eb"/>
        <rect x="2" y="11" width="2" height="2" fill="#0f172a"/>
        <rect x="5" y="11" width="2" height="2" fill="#2563eb"/>
        <rect x="9" y="9" width="3" height="3" fill="#0f172a"/>
        <rect x="14" y="9" width="2" height="2" fill="#059669"/>
        <rect x="18" y="9" width="3" height="3" fill="#0f172a"/>
        <rect x="23" y="11" width="2" height="3" fill="#2563eb"/>
        <rect x="11" y="14" width="3" height="2" fill="#0f172a"/>
        <rect x="16" y="14" width="2" height="2" fill="#059669"/>
        <rect x="20" y="14" width="4" height="2" fill="#0f172a"/>
        <rect x="2" y="16" width="3" height="2" fill="#2563eb"/>
        <rect x="7" y="16" width="2" height="2" fill="#0f172a"/>
        <rect x="11" y="18" width="2" height="3" fill="#059669"/>
        <rect x="15" y="18" width="3" height="2" fill="#0f172a"/>
        <rect x="20" y="18" width="2" height="2" fill="#2563eb"/>
        <rect x="24" y="18" width="3" height="3" fill="#0f172a"/>
        <rect x="11" y="23" width="3" height="3" fill="#0f172a"/>
        <rect x="16" y="23" width="2" height="2" fill="#2563eb"/>
        <rect x="20" y="23" width="4" height="4" fill="#0f172a"/>
      </svg>
    `;

    container.innerHTML = qrSvg;
  },

  // -------------------- USER & ADMIN CONTROL MANAGEMENT --------------------
  bindUserManagement: function() {
    const refreshBtn = document.getElementById('refreshUsersBtn');
    const form = document.getElementById('addUserForm');

    if (refreshBtn) refreshBtn.addEventListener('click', () => this.fetchUsers());
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createUser();
      });
    }
  },

  fetchUsers: async function() {
    const tbody = document.getElementById('userRosterTableBody');
    const totalCountEl = document.getElementById('userStatTotalCount');
    if (!tbody) return;

    try {
      const resp = await fetch('/api/admin/users');
      const data = await resp.json();
      const users = data.users || [];

      if (totalCountEl) totalCountEl.textContent = `${users.length} Users`;

      tbody.innerHTML = users.map(u => `
        <tr>
          <td>
            <div style="font-weight:700; color:var(--text-main); font-size:0.88rem;">${u.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">@${u.username} · ${u.email}</div>
          </td>
          <td>
            <span class="badge ${u.role === 'Super Admin' ? 'badge-safe' : 'badge-moderate'}" style="font-size:0.72rem; font-weight:800;">
              ${u.role}
            </span>
          </td>
          <td style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">${u.venue_scope}</td>
          <td>
            <span class="badge ${u.status === 'Active Session' ? 'badge-safe' : 'badge-safe'}" style="font-size:0.72rem;">
              ● ${u.status}
            </span>
          </td>
          <td>
            ${u.is_system ? `
              <span style="font-size:0.72rem; color:var(--text-subtle); font-weight:700;">Protected System Account</span>
            ` : `
              <button class="btn btn-outline btn-sm" style="color:#b91c1c; border-color:#fca5a5; background:#fef2f2; font-size:0.72rem; padding:0.25rem 0.55rem;" onclick="FlowApp.deleteUser('${u.username}')">
                Revoke Access
              </button>
            `}
          </td>
        </tr>
      `).join('');
    } catch (e) {
      console.error('[UserManagement] Fetch error:', e);
    }
  },

  createUser: async function() {
    const nameInput = document.getElementById('newUserName');
    const usernameInput = document.getElementById('newUserUsername');
    const emailInput = document.getElementById('newUserEmail');
    const roleInput = document.getElementById('newUserRole');
    const venueInput = document.getElementById('newUserVenueScope');
    const feedback = document.getElementById('addUserFeedback');
    const btn = document.getElementById('submitAddUserBtn');

    const name = nameInput?.value.trim();
    const username = usernameInput?.value.trim();
    const email = emailInput?.value.trim();
    const role = roleInput?.value;
    const venue = venueInput?.value;

    if (!name || !username) {
      if (feedback) {
        feedback.textContent = 'Please fill in Name and Username';
        feedback.style.background = '#fef2f2';
        feedback.style.color = '#b91c1c';
        feedback.style.display = 'block';
      }
      return;
    }

    try {
      if (btn) btn.disabled = true;

      const resp = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, role, venue_scope: venue })
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        if (feedback) {
          feedback.textContent = `✅ User @${username} created successfully`;
          feedback.style.background = '#ecfdf5';
          feedback.style.color = '#047857';
          feedback.style.display = 'block';
        }
        if (nameInput) nameInput.value = '';
        if (usernameInput) usernameInput.value = '';
        if (emailInput) emailInput.value = '';
        this.fetchUsers();
        setTimeout(() => { if (feedback) feedback.style.display = 'none'; }, 3000);
      } else {
        if (feedback) {
          feedback.textContent = data.message || 'Error creating user account';
          feedback.style.background = '#fef2f2';
          feedback.style.color = '#b91c1c';
          feedback.style.display = 'block';
        }
      }
    } catch (e) {
      console.error('[UserManagement] Create error:', e);
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  deleteUser: async function(username) {
    if (!confirm(`Are you sure you want to revoke access for @${username}?`)) return;

    try {
      const resp = await fetch(`/api/admin/users/${username}`, { method: 'DELETE' });
      const data = await resp.json();
      if (resp.ok && data.success) {
        this.fetchUsers();
      } else {
        alert(data.message || 'Could not delete user account');
      }
    } catch (e) {
      console.error('[UserManagement] Delete error:', e);
    }
  },

  // -------------------- SENIOR CITIZEN ACCESSIBILITY --------------------
  bindSeniorMode: function() {
    const btn = document.getElementById('seniorModeBtn');
    if (btn) {
      btn.addEventListener('click', () => {
        this.isSeniorMode = !this.isSeniorMode;
        document.body.classList.toggle('senior-mode', this.isSeniorMode);
        btn.classList.toggle('active', this.isSeniorMode);
        if (this.isSeniorMode) {
          this.speakText('Senior citizen mode enabled. High contrast layout active with spoken crowd advisories.');
        }
      });
    }

    const speakBtn = document.getElementById('speakAdvisoryBtn');
    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        const v = window.GoogleMapsManager ? window.GoogleMapsManager.venueConfigs[this.activeVenueId] : null;
        const vName = v ? v.name : 'this venue';
        const msg = `Welcome to ${vName}. Crowd flow is currently safe at 48 percent capacity. We recommend taking Route C North Express Lane, which has an estimated wait time of only 6 minutes. Please avoid Direct Route A due to heavy queue bottlenecking at the inner corridor.`;
        this.speakText(msg);
      });
    }
  },

  speakText: function(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(text);
    }
  },

  // -------------------- EMERGENCY EVACUATION --------------------
  bindEmergencyProtocol: function() {
    const sosBtn = document.getElementById('sosBtn');
    if (sosBtn) sosBtn.addEventListener('click', () => this.triggerEmergency(true));

    const clearBtn = document.getElementById('clearEmergencyBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => this.triggerEmergency(false));
  },

  triggerEmergency: async function(active) {
    try {
      const resp = await fetch('/api/emergency/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: active })
      });
      const data = await resp.json();
      this.emergencyActive = data.emergency_mode;
      this.updateEmergencyUI(this.emergencyActive);
      this.refreshData();
    } catch (e) {
      console.error('[Emergency] Toggle error:', e);
    }
  },

  updateEmergencyUI: function(active) {
    const banner = document.getElementById('emergencyBanner');
    const statEmergency = document.getElementById('adminStatEmergency');
    
    if (banner) banner.classList.toggle('active', active);
    if (statEmergency) {
      statEmergency.textContent = active ? 'EVACUATING' : 'NORMAL';
      statEmergency.style.color = active ? 'var(--color-critical)' : 'var(--color-safe)';
    }

    if (active) {
      this.speakText('Attention! Emergency evacuation initiated. All turnstiles are open outwards. Follow green illuminated bypass pathways immediately to parking grounds.');
    }
  },

  // -------------------- VENUE SELECTOR --------------------
  bindVenueSelector: function() {
    const select = document.getElementById('venueSelect');
    if (select) {
      select.addEventListener('change', (e) => {
        this.setVenue(e.target.value);
      });
    }
  },

  setVenue: function(venueId) {
    this.activeVenueId = venueId;
    const select = document.getElementById('venueSelect');
    if (select) select.value = venueId;

    const opt = select ? select.options[select.selectedIndex] : null;
    const text = opt ? opt.text.split('(')[0].trim() : venueId;

    const kioskTitle = document.getElementById('kioskVenueTitle');
    if (kioskTitle) kioskTitle.textContent = text;

    const sidebarVenue = document.getElementById('adminSidebarVenue');
    if (sidebarVenue) sidebarVenue.textContent = text;

    // Sync pill buttons
    document.querySelectorAll('.venue-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.vid === venueId);
    });

    if (window.GoogleMapsManager) window.GoogleMapsManager.switchVenue(venueId);
    this.refreshData();
    this.generateAnalyticsData();
  },

  // -------------------- DETAILED ANALYTICS TABLE --------------------
  bindAnalyticsFilters: function() {
    const zoneFilter = document.getElementById('analyticsZoneFilter');
    const statusFilter = document.getElementById('analyticsStatusFilter');
    const exportBtn = document.getElementById('exportAnalyticsCsvBtn');

    if (zoneFilter) zoneFilter.addEventListener('change', () => this.filterAnalyticsTable());
    if (statusFilter) statusFilter.addEventListener('change', () => this.filterAnalyticsTable());
    if (exportBtn) exportBtn.addEventListener('click', () => this.exportAnalyticsCsv());
  },

  generateAnalyticsData: function() {
    const zones = [
      { id: 'zone-a', name: 'Zone A: Main Entrance', cap: 800 },
      { id: 'zone-b', name: 'Zone B: West Courtyard', cap: 800 },
      { id: 'zone-c', name: 'Zone C: North Shrine Sanctum', cap: 800 },
      { id: 'zone-d', name: 'Zone D: South Bypass', cap: 800 },
      { id: 'zone-e', name: 'Zone E: Dining Hall', cap: 1200 },
      { id: 'zone-f', name: 'Zone F: Parking Grounds', cap: 1500 },
      { id: 'zone-h', name: 'Zone H: Hilltop Staircase', cap: 1000 }
    ];

    const records = [];
    const timeSlots = [
      '19:45 - 20:00', '19:30 - 19:45', '19:15 - 19:30', '19:00 - 19:15',
      '18:45 - 19:00', '18:30 - 18:45', '18:15 - 18:30', '18:00 - 18:15',
      '17:45 - 18:00', '17:30 - 17:45', '17:15 - 17:30', '17:00 - 17:15'
    ];

    timeSlots.forEach((slot, slotIdx) => {
      const decay = 1.0 - (slotIdx * 0.03);
      zones.forEach(z => {
        let isChoke = (z.id === 'zone-c' || z.id === 'zone-h');
        let count = Math.min(z.cap, Math.round((isChoke ? 750 : 320) * decay + (Math.random() * 40)));
        let occPct = Math.round((count / z.cap) * 100);
        let influx = Math.round((isChoke ? 65 : 35) * decay);
        let egress = Math.round((isChoke ? 25 : 32) * decay);
        let netFlow = influx - egress;
        let wait = isChoke ? Math.round(28 * decay) : Math.round(5 * decay);

        let status = 'SAFE';
        let directive = 'Normal circulation flowing smoothly';
        if (occPct >= 90) {
          status = 'CRITICAL';
          directive = 'Divert traffic to Route C; choke risk';
        } else if (occPct >= 75) {
          status = 'HIGH';
          directive = 'Monitor doorway velocity closely';
        } else if (occPct >= 50) {
          status = 'MODERATE';
          directive = 'Steady moving queue';
        }

        records.push({
          time: slot,
          zoneId: z.id,
          zoneName: z.name,
          influx: influx,
          egress: egress,
          count: count,
          capacity: z.cap,
          occPct: occPct,
          netFlow: (netFlow >= 0 ? `+${netFlow}` : `${netFlow}`) + ' /min',
          wait: `${wait} mins`,
          status: status,
          directive: directive
        });
      });
    });

    this.cachedAnalyticsData = records;
    this.filterAnalyticsTable();
  },

  filterAnalyticsTable: function() {
    const zoneFilter = document.getElementById('analyticsZoneFilter');
    const statusFilter = document.getElementById('analyticsStatusFilter');
    const tbody = document.getElementById('analyticsTableBody');
    const countEl = document.getElementById('analyticsRowCount');
    if (!tbody) return;

    const selectedZone = zoneFilter ? zoneFilter.value : 'ALL';
    const selectedStatus = statusFilter ? statusFilter.value : 'ALL';

    const filtered = this.cachedAnalyticsData.filter(r => {
      const matchesZone = (selectedZone === 'ALL' || r.zoneId === selectedZone);
      const matchesStatus = (selectedStatus === 'ALL' || r.status === selectedStatus);
      return matchesZone && matchesStatus;
    });

    if (countEl) countEl.textContent = filtered.length;

    tbody.innerHTML = filtered.map(r => `
      <tr>
        <td style="font-weight:700; color:var(--text-main);">${r.time}</td>
        <td style="color:var(--text-main); font-weight:600;">${r.zoneName}</td>
        <td style="color:var(--color-safe); font-weight:700;">+${r.influx}</td>
        <td style="color:var(--color-critical); font-weight:700;">-${r.egress}</td>
        <td style="font-weight:800; color:var(--text-main);">${r.count} <span style="font-size:0.7rem; color:var(--text-muted);">/ ${r.capacity}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span>${r.occPct}%</span>
            <div style="width:40px; height:5px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
              <div style="width:${Math.min(100, r.occPct)}%; height:100%; background:${r.status === 'CRITICAL' ? 'var(--color-critical)' : r.status === 'HIGH' ? 'var(--color-high)' : 'var(--color-safe)'};"></div>
            </div>
          </div>
        </td>
        <td style="font-family:monospace; color:var(--accent-cyan);">${r.netFlow}</td>
        <td style="font-weight:700; color:${r.status === 'CRITICAL' ? 'var(--color-critical)' : 'var(--text-main)'};">${r.wait}</td>
        <td>
          <span class="badge badge-${r.status.toLowerCase()}">● ${r.status}</span>
        </td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${r.directive}</td>
      </tr>
    `).join('');
  },

  exportAnalyticsCsv: function() {
    if (!this.cachedAnalyticsData.length) return;
    const headers = ['Time Window', 'Zone', 'Influx', 'Egress', 'Current Count', 'Capacity', 'Occupancy Pct', 'Net Flow', 'Queue Wait', 'Status', 'Directive'];
    const rows = this.cachedAnalyticsData.map(r => [
      `"${r.time}"`,
      `"${r.zoneName}"`,
      r.influx,
      r.egress,
      r.count,
      r.capacity,
      `"${r.occPct}%"`,
      `"${r.netFlow}"`,
      `"${r.wait}"`,
      `"${r.status}"`,
      `"${r.directive}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FlowNavigator_Analytics_Report_${this.activeVenueId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // -------------------- SMART PRE-EVENT PLANNER --------------------
  bindEventPlanner: function() {
    const btn = document.getElementById('generatePlanBtn');
    if (btn) {
      btn.addEventListener('click', async () => {
        const eventName = document.getElementById('plannerEventName').value;
        const crowd = parseInt(document.getElementById('plannerExpectedCrowd').value);
        const zones = parseInt(document.getElementById('plannerZonesCount').value);
        const entrances = parseInt(document.getElementById('plannerEntrances').value);
        const exits = parseInt(document.getElementById('plannerExits').value);

        try {
          const resp = await fetch('/api/planner/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_name: eventName,
              expected_crowd: crowd,
              zones_count: zones,
              entrances_count: entrances,
              exits_count: exits
            })
          });
          const plan = await resp.json();
          this.renderPlanResults(plan);
        } catch (e) {
          console.error('[Planner] Error:', e);
        }
      });
    }
  },

  renderPlanResults: function(plan) {
    const container = document.getElementById('plannerResultsContent');
    if (!container) return;

    container.innerHTML = `
      <div style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.25); border-radius:8px; padding:1rem; margin-bottom:1rem;">
        <div style="font-weight:800; color:var(--text-main); font-size:1.05rem;">${plan.event_name}</div>
        <div style="font-size:0.8rem; color:var(--accent-cyan); margin-top:0.25rem;">
          Safety Risk Profile: <strong style="color:${plan.risk_assessment.overall_risk_level === 'HIGH' ? 'var(--color-critical)' : 'var(--color-safe)'};">${plan.risk_assessment.overall_risk_level}</strong> • Recommended Counting Gates: <strong>${plan.recommended_sensors_count} Stations</strong>
        </div>
        <p style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-muted);">${plan.risk_assessment.summary}</p>
      </div>

      <div style="font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Recommended Gate Locations</div>
      <ul style="padding-left:1.25rem; margin-bottom:1rem;">
        ${plan.sensor_placements.map(s => `<li><strong>${s.location}:</strong> ${s.reason}</li>`).join('')}
      </ul>

      <div style="font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Recommended Pathway Traffic Distribution</div>
      <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1rem;">
        ${plan.suggested_route_distribution.map(r => `
          <div style="display:flex; justify-content:space-between; background:var(--bg-secondary); padding:0.5rem 0.75rem; border-radius:6px; border:1px solid var(--border-subtle);">
            <span>${r.route_name}</span>
            <strong style="color:var(--color-safe);">${r.allocation_percentage}% Target Flow</strong>
          </div>
        `).join('')}
      </div>

      <div style="font-weight:700; color:var(--text-main); margin-bottom:0.5rem;">Crowd Marshalling Personnel Deployment</div>
      <div style="display:flex; flex-direction:column; gap:0.5rem;">
        ${plan.staff_deployment.map(s => `
          <div style="font-size:0.8rem; color:var(--text-muted); background:var(--bg-secondary); padding:0.5rem 0.75rem; border-radius:6px; border:1px solid var(--border-subtle);">
            <strong style="color:var(--text-main);">${s.area}:</strong> ${s.personnel_needed} staff officers stationed (${s.primary_task})
          </div>
        `).join('')}
      </div>
    `;
  },

  // -------------------- MAPS API KEY MODAL --------------------
  bindMapsKeyModal: function() {
    const openBtn = document.getElementById('openMapsKeyModalBtn');
    const closeBtn = document.getElementById('closeMapsKeyModalBtn');
    const modal = document.getElementById('mapsKeyModal');
    const saveBtn = document.getElementById('saveMapsKeyBtn');
    const input = document.getElementById('customMapsKeyInput');

    if (openBtn && modal) openBtn.addEventListener('click', () => modal.classList.add('active'));
    if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (saveBtn && input && modal) {
      saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (key) {
          localStorage.setItem('flow_google_maps_key', key);
          alert('Google Maps API Key saved! Reloading live map...');
          if (window.GoogleMapsManager) window.GoogleMapsManager.loadGoogleMapsScript(key);
        }
        modal.classList.remove('active');
      });
    }
  },

  startClock: function() {
    setInterval(() => {
      const clockEl = document.getElementById('kioskClock');
      if (clockEl) {
        const d = new Date();
        clockEl.textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }, 1000);
  },

  // -------------------- MAIN DATA REFRESH & POLLING --------------------
  refreshData: async function() {
    try {
      const [zonesResp, routesResp, healthResp, alertsResp] = await Promise.all([
        fetch(`/api/zones?venue_id=${this.activeVenueId}`),
        fetch('/api/routes'),
        fetch('/api/health'),
        fetch('/api/alerts')
      ]);

      const zonesData = await zonesResp.json();
      const routesData = await routesResp.json();
      const healthData = await healthResp.json();
      const alertsData = await alertsResp.json();

      // Check emergency mode sync
      if (healthData.system && healthData.system.emergency_mode !== this.emergencyActive) {
        this.emergencyActive = healthData.system.emergency_mode;
        this.updateEmergencyUI(this.emergencyActive);
      }

      this.updateCitizenView(zonesData.zones || [], routesData.routes || []);
      this.updateAdminView(zonesData.zones || [], routesData.routes || [], healthData);
      this.updateAlerts(alertsData.alerts || []);
    } catch (e) {
      console.warn('[FlowApp] Polling error:', e);
    }
  },

  updateCitizenView: function(zones, routes) {
    let totalCount = 0;
    let totalCap = 0;
    zones.forEach(z => {
      totalCount += (z.current_count || 0);
      totalCap += (z.capacity || 800);
    });

    const pct = totalCap > 0 ? Math.min(100, Math.round((totalCount / totalCap) * 100)) : 48;
    const meterVal = document.getElementById('citizenMeterValue');
    const meterCircle = document.getElementById('citizenMeterCircle');
    const meterStatus = document.getElementById('citizenMeterStatus');
    const totalPpl = document.getElementById('citizenTotalPeople');

    if (meterVal) meterVal.textContent = `${pct}%`;
    if (totalPpl) totalPpl.textContent = totalCount.toLocaleString();

    if (meterCircle && meterStatus) {
      meterCircle.className = 'crowd-meter-circle';
      if (pct < 55) {
        meterCircle.classList.add('safe');
        meterStatus.textContent = 'Safe Flow';
      } else if (pct < 75) {
        meterCircle.classList.add('moderate');
        meterStatus.textContent = 'Moderate Crowds';
      } else if (pct < 90) {
        meterCircle.classList.add('high');
        meterStatus.textContent = 'Heavy Congestion';
      } else {
        meterCircle.classList.add('critical');
        meterStatus.textContent = 'Critical Density';
      }
    }

    const routesList = document.getElementById('citizenRoutesList');
    if (routesList && routes.length) {
      routesList.innerHTML = routes.map(r => `
        <div class="route-card ${r.tag === 'RECOMMENDED' ? 'selected' : ''}">
          <div class="route-main-info">
            <div class="route-header">
              <span class="badge ${r.tag === 'RECOMMENDED' ? 'badge-safe' : r.tag === 'MODERATE' ? 'badge-moderate' : 'badge-critical'}">
                ● ${r.tag === 'RECOMMENDED' ? 'RECOMMENDED ROUTE' : r.tag}
              </span>
              <div class="route-name">${r.name}</div>
            </div>
            <div class="route-desc">${r.explainable_reason}</div>
          </div>
          <div class="route-metrics">
            <div class="route-metric-item">
              <div class="route-metric-val" style="color:${r.color};">${r.estimated_wait_minutes}m</div>
              <div class="route-metric-lbl">Est. Wait</div>
            </div>
            <div class="route-metric-item">
              <div class="route-metric-val">${r.occupancy_percentage}%</div>
              <div class="route-metric-lbl">Density</div>
            </div>
            <div class="route-metric-item">
              <div class="route-metric-val">${r.distance_meters}m</div>
              <div class="route-metric-lbl">Walk</div>
            </div>
          </div>
        </div>
      `).join('');
    }

    // Keep header route status badges synced with active venue routes
    const mapBadgesEl = document.getElementById('mapHeaderRouteBadges');
    if (mapBadgesEl && routes.length) {
      mapBadgesEl.innerHTML = routes.map(r => {
        const cls = r.tag === 'RECOMMENDED' ? 'badge-safe' : (r.tag === 'MODERATE' ? 'badge-moderate' : 'badge-critical');
        const shortName = r.name.includes(' - ') ? r.name.split(' - ')[0] : (r.name.length > 15 ? r.name.slice(0, 15) + '...' : r.name);
        const tagText = r.tag === 'RECOMMENDED' ? `Fast (${r.estimated_wait_minutes}m)` : (r.tag === 'MODERATE' ? `Moderate (${r.estimated_wait_minutes}m)` : `Heavy (${r.estimated_wait_minutes}m)`);
        return `<span class="badge ${cls}">● ${shortName}: ${tagText}</span>`;
      }).join('');
    }
  },

  updateAdminView: function(zones, routes, health) {
    let totalCount = 0;
    let totalCap = 0;
    zones.forEach(z => {
      totalCount += (z.current_count || 0);
      totalCap += (z.capacity || 800);
    });

    const statHeadcount = document.getElementById('adminStatHeadcount');
    if (statHeadcount) statHeadcount.textContent = totalCount.toLocaleString();

    const capPctEl = document.getElementById('adminStatCapacityPct');
    if (capPctEl) {
      const pct = totalCap > 0 ? ((totalCount / totalCap) * 100).toFixed(1) : 49.8;
      capPctEl.textContent = `${pct}% of ${totalCap.toLocaleString()} Capacity`;
    }

    // Render human-friendly zone occupancy cards
    const grid = document.getElementById('adminZoneGrid');
    if (grid && zones.length) {
      grid.innerHTML = zones.map(z => {
        const occ = Math.round(((z.current_count || 0) / (z.capacity || 800)) * 100);
        const status = z.status || 'SAFE';
        const net = (z.entry_rate || 35) - (z.exit_rate || 30);
        const statusLabel = status === 'CRITICAL' ? 'CRITICAL CHOKEPOINT' : status === 'HIGH' ? 'HEAVY CONGESTION' : status === 'MODERATE' ? 'MODERATE QUEUE' : 'FREE FLOWING';

        return `
          <div class="zone-card ${status}">
            <div class="zone-header">
              <span class="zone-code">${z.code}</span>
              <span class="badge badge-${status.toLowerCase()}">${statusLabel}</span>
            </div>
            <div class="zone-name">${z.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.75rem;">
              ${z.description}
            </div>

            <div class="zone-progress-bg">
              <div class="zone-progress-fill" style="width:${Math.min(100, occ)}%; background:${status === 'CRITICAL' ? 'var(--color-critical)' : status === 'HIGH' ? 'var(--color-high)' : status === 'MODERATE' ? 'var(--color-moderate)' : 'var(--color-safe)'};"></div>
            </div>

            <div class="zone-stats-row">
              <span>Present: <strong>${z.current_count} / ${z.capacity} (${occ}%)</strong></span>
              <span>Net Change: <strong style="color:${net > 15 ? 'var(--color-critical)' : 'var(--text-main)'};">${net >= 0 ? '+' : ''}${net}/min</strong></span>
            </div>

            <div style="display:flex; justify-content:space-between; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid var(--border-subtle); font-size:0.75rem; color:var(--text-muted);">
              <span>Entering: <strong>+${z.entry_rate || 35}/min</strong></span>
              <span>Exiting: <strong>-${z.exit_rate || 30}/min</strong></span>
              <span>Wait: <strong style="color:var(--text-main);">${z.prediction ? z.prediction.predicted_wait_minutes : 5}m</strong></span>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render Trend Bars
    const trendsBar = document.getElementById('trendsBarChart');
    if (trendsBar && !trendsBar.hasChildNodes()) {
      const heights = [45, 60, 85, 95, 70, 80, 92];
      trendsBar.innerHTML = heights.map(h => `
        <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
          <div style="width:100%; height:${h}%; background:linear-gradient(to top, #2563eb, #06b6d4); border-radius:4px 4px 0 0; opacity:0.85;"></div>
        </div>
      `).join('');
    }
  },

  updateAlerts: function(alerts) {
    const list = document.getElementById('citizenAlertsList');
    if (!list) return;

    if (!alerts.length) {
      list.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">All pathways clear. No active bottlenecks reported.</div>`;
      return;
    }

    list.innerHTML = alerts.map(a => `
      <div style="background:var(--bg-secondary); border-left:4px solid ${a.severity === 'critical' || a.severity === 'emergency' ? 'var(--color-critical)' : 'var(--color-moderate)'}; padding:0.85rem 1rem; border-radius:0 var(--radius-sm) var(--radius-sm) 0;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="color:var(--text-main); font-size:0.9rem;">${a.title}</strong>
          <span style="font-size:0.75rem; color:var(--text-muted);">${a.timestamp}</span>
        </div>
        <div style="font-size:0.82rem; color:var(--text-muted); margin-top:0.25rem;">${a.message}</div>
      </div>
    `).join('');
  }
};

window.FlowApp = FlowApp;

document.addEventListener('DOMContentLoaded', () => {
  FlowApp.init();
});
