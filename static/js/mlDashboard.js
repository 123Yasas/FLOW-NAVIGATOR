/**
 * FlowNavigator - Random Forest Machine Learning Studio
 * Interactive workbench for exploring Scikit-Learn Random Forest predictions,
 * crowd surge forecasts, and feature importance explainability.
 */

const MlDashboard = {
  init: function() {
    this.bindSliders();
    this.fetchModelInfo();
    
    const runBtn = document.getElementById('runMlInferenceBtn');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runInference());
    }
  },

  bindSliders: function() {
    const sliders = [
      { id: 'mlSlideHeadcount', valId: 'mlValHeadcount' },
      { id: 'mlSlideCapacity', valId: 'mlValCapacity' },
      { id: 'mlSlideEntryRate', valId: 'mlValEntryRate' },
      { id: 'mlSlideExitRate', valId: 'mlValExitRate' },
      { id: 'mlSlideBottleneck', valId: 'mlValBottleneck', isFloat: true }
    ];

    sliders.forEach(s => {
      const input = document.getElementById(s.id);
      const valEl = document.getElementById(s.valId);
      if (input && valEl) {
        input.addEventListener('input', (e) => {
          valEl.textContent = s.isFloat ? (e.target.value / 100).toFixed(2) : e.target.value;
          this.runInference();
        });
      }
    });
  },

  runInference: async function() {
    const currentCount = parseInt(document.getElementById('mlSlideHeadcount').value);
    const capacity = parseInt(document.getElementById('mlSlideCapacity').value);
    const entryRate = parseInt(document.getElementById('mlSlideEntryRate').value);
    const exitRate = parseInt(document.getElementById('mlSlideExitRate').value);
    const bottleneck = parseFloat(document.getElementById('mlSlideBottleneck').value) / 100;

    try {
      const resp = await fetch('/api/predict/zone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'custom-interactive-zone',
          current_count: currentCount,
          capacity: capacity,
          entry_rate: entryRate,
          exit_rate: exitRate,
          bottleneck_proximity: bottleneck
        })
      });

      const prediction = await resp.json();
      this.displayPrediction(prediction);
    } catch (e) {
      console.warn('[ML Studio] Inference call error:', e);
    }
  },

  displayPrediction: function(pred) {
    const riskEl = document.getElementById('mlOutputRisk');
    const waitEl = document.getElementById('mlOutputWait');
    const f15El = document.getElementById('mlForecast15m');
    const f30El = document.getElementById('mlForecast30m');
    const surgeEl = document.getElementById('mlSurgeProb');

    const risk = pred.predicted_risk_level || 'SAFE';
    if (riskEl) {
      riskEl.textContent = risk;
      const colors = {
        'SAFE': 'var(--color-safe)',
        'MODERATE': 'var(--color-moderate)',
        'HIGH': 'var(--color-high)',
        'CRITICAL': 'var(--color-critical)'
      };
      riskEl.style.color = colors[risk] || '#fff';
    }

    if (waitEl) waitEl.textContent = `${pred.predicted_wait_minutes || 5.0} min`;
    if (f15El) f15El.textContent = `${pred.forecast_15m || 0} ppl`;
    if (f30El) f30El.textContent = `${pred.forecast_30m || 0} ppl`;
    if (surgeEl) surgeEl.textContent = `${pred.surge_probability_pct || 15}%`;
  },

  fetchModelInfo: async function() {
    try {
      const resp = await fetch('/api/predict/model-info');
      const data = await resp.json();
      this.renderFeatureImportances(data.feature_importances || {});
    } catch (e) {
      console.warn('[ML Studio] Model info error:', e);
    }
  },

  renderFeatureImportances: function(importances) {
    const container = document.getElementById('featureImportanceContainer');
    if (!container) return;

    const friendlyNames = {
      'occupancy_ratio': 'Space Capacity Utilization',
      'current_count': 'Current Zone Headcount',
      'entry_rate': 'Arrival Rush Speed (people/min)',
      'exit_rate': 'Departure Flow Speed (people/min)',
      'net_flow_rate': 'Net Crowd Accumulation Rate',
      'bottleneck_proximity': 'Doorway & Corridor Squeeze Factor',
      'hour_of_day': 'Time of Day (Arrival Curve)',
      'is_peak_hours': 'Peak Rush Hour Window',
      'weather_factor': 'Weather Compaction Factor',
      'capacity': 'Maximum Space Limit'
    };

    const sorted = Object.entries(importances).sort((a, b) => b[1] - a[1]);
    const maxVal = sorted.length ? sorted[0][1] : 1.0;

    container.innerHTML = sorted.map(([feature, val]) => {
      const pct = (val * 100).toFixed(1);
      const barWidth = Math.max(8, (val / maxVal) * 100);
      const label = friendlyNames[feature] || feature;

      return `
        <div class="feature-importance-bar">
          <div class="fi-name" title="${feature}">${label}</div>
          <div class="fi-bar-bg">
            <div class="fi-bar-fill" style="width: ${barWidth}%;"></div>
          </div>
          <div style="font-weight:700; width:55px; text-align:right; font-family:var(--font-display);">${pct}%</div>
        </div>
      `;
    }).join('');
  }
};

window.MlDashboard = MlDashboard;
