/**
 * FlowNavigator - ESP32 & VL53L0X ToF Sensors Hardware Simulator
 * Simulates physical time-of-flight doorway trigger logic and displays
 * real-time REST API telemetry sent over Wi-Fi to the Flask backend.
 */

const SensorSimulator = {
  isSimulating: false,
  
  init: function() {
    this.bindEvents();
    this.fetchSensors();
  },

  bindEvents: function() {
    const entryBtn = document.getElementById('simPedestrianEntryBtn');
    const exitBtn = document.getElementById('simPedestrianExitBtn');
    const burstBtn = document.getElementById('simBurstSurgeBtn');

    if (entryBtn) entryBtn.addEventListener('click', () => this.simulatePedestrian('entry'));
    if (exitBtn) exitBtn.addEventListener('click', () => this.simulatePedestrian('exit'));
    if (burstBtn) burstBtn.addEventListener('click', () => this.simulateBurst());
  },

  simulatePedestrian: async function(direction) {
    if (this.isSimulating) return;
    this.isSimulating = true;

    const beamA = document.getElementById('simBeamA');
    const beamB = document.getElementById('simBeamB');
    const laserA = document.getElementById('simLaserA');
    const laserB = document.getElementById('simLaserB');
    const distA = document.getElementById('simDistValA');
    const distB = document.getElementById('simDistValB');

    if (direction === 'entry') {
      // Step 1: Pedestrian intercepts Sensor A (Outer Beam)
      if (beamA) beamA.classList.add('triggered');
      if (laserA) laserA.classList.add('active');
      if (distA) distA.textContent = '380 mm (TARGET DETECTED)';

      await new Promise(r => setTimeout(r, 220));

      // Step 2: Pedestrian moves forward, intercepts Sensor B (Inner Beam)
      if (beamB) beamB.classList.add('triggered');
      if (laserB) laserB.classList.add('active');
      if (distB) distB.textContent = '415 mm (TARGET DETECTED)';

      await new Promise(r => setTimeout(r, 220));

      // Reset beams
      if (beamA) beamA.classList.remove('triggered');
      if (laserA) laserA.classList.remove('active');
      if (distA) distA.textContent = '1200 mm';

      await new Promise(r => setTimeout(r, 150));

      if (beamB) beamB.classList.remove('triggered');
      if (laserB) laserB.classList.remove('active');
      if (distB) distB.textContent = '1200 mm';

    } else {
      // Exit: Trigger B first, then A
      if (beamB) beamB.classList.add('triggered');
      if (laserB) laserB.classList.add('active');
      if (distB) distB.textContent = '390 mm (TARGET DETECTED)';

      await new Promise(r => setTimeout(r, 220));

      if (beamA) beamA.classList.add('triggered');
      if (laserA) laserA.classList.add('active');
      if (distA) distA.textContent = '425 mm (TARGET DETECTED)';

      await new Promise(r => setTimeout(r, 220));

      if (beamB) beamB.classList.remove('triggered');
      if (laserB) laserB.classList.remove('active');
      if (distB) distB.textContent = '1200 mm';

      await new Promise(r => setTimeout(r, 150));

      if (beamA) beamA.classList.remove('triggered');
      if (laserA) laserA.classList.remove('active');
      if (distA) distA.textContent = '1200 mm';
    }

    // Transmit REST API POST request to Flask
    try {
      const resp = await fetch('/api/sensors/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sensor_id: 'SENSOR-ESP32-001',
          event: direction
        })
      });
      const result = await resp.json();
      this.displayPayload(result, direction);
      this.fetchSensors();
      
      // Update global app counts
      if (window.FlowApp) window.FlowApp.refreshData();
    } catch (e) {
      console.error('[Simulator] REST error:', e);
    } finally {
      this.isSimulating = false;
    }
  },

  simulateBurst: async function() {
    for (let i = 0; i < 5; i++) {
      await this.simulatePedestrian('entry');
      await new Promise(r => setTimeout(r, 100));
    }
  },

  displayPayload: function(result, direction) {
    const term = document.getElementById('simPayloadTerminal');
    const timeEl = document.getElementById('simLastPacketTime');
    if (!term) return;

    const timeStr = new Date().toLocaleTimeString();
    if (timeEl) timeEl.textContent = `Last Event: ${timeStr}`;

    const formattedJson = JSON.stringify({
      event: direction === 'entry' ? "PEDESTRIAN_ENTRY_LOGGED" : "PEDESTRIAN_EXIT_LOGGED",
      gate_station: result.sensor_id || "GATE-STATION-001",
      flow_direction: direction.toUpperCase(),
      beam_clearance_outer: `${result.tof_a} mm`,
      beam_clearance_inner: `${result.tof_b} mm`,
      zone_net_headcount: result.current_count,
      total_people_entered: result.people_in,
      total_people_exited: result.people_out,
      dispatch_status: "ACTIVE_RECORDED"
    }, null, 2);

    term.textContent = formattedJson;
  },

  fetchSensors: async function() {
    try {
      const resp = await fetch('/api/sensors');
      const data = await resp.json();
      this.renderSensorTable(data.sensors || []);
    } catch (e) {
      console.warn('[Simulator] Failed to fetch sensors:', e);
    }
  },

  renderSensorTable: function(sensors) {
    const tbody = document.getElementById('sensorsTableBody');
    if (!tbody) return;

    tbody.innerHTML = sensors.map((s, idx) => `
      <tr class="sensor-row">
        <td>
          <div style="font-weight:700; color:var(--text-main);">Gate Station ${idx + 1}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${s.id}</div>
        </td>
        <td style="font-weight:600; color:var(--text-main);">${s.zone_name}</td>
        <td><strong style="color:var(--color-safe);">+${s.people_in}</strong></td>
        <td><strong style="color:var(--color-critical);">-${s.people_out}</strong></td>
        <td><strong style="font-size:0.95rem; color:var(--text-main);">${s.current_count} people</strong></td>
        <td>
          <span style="font-family:monospace; color:var(--accent-cyan); font-size:0.75rem;">Beam A: ${s.tof_distance_mm_a || 420}mm</span><br>
          <span style="font-family:monospace; color:var(--accent-cyan); font-size:0.75rem;">Beam B: ${s.tof_distance_mm_b || 1180}mm</span>
        </td>
        <td>
          <span style="font-size:0.75rem; color:var(--text-muted);">Turnstile Counter • Battery: <strong style="color:${s.battery_pct > 80 ? 'var(--color-safe)' : 'var(--color-moderate)'};">${s.battery_pct}%</strong></span>
        </td>
        <td>
          <span class="badge ${s.status === 'ONLINE' ? 'badge-safe' : 'badge-high'}">
            ● ${s.status === 'ONLINE' ? 'OPERATIONAL' : 'MAINTENANCE'}
          </span>
        </td>
      </tr>
    `).join('');
  }
};

window.SensorSimulator = SensorSimulator;
