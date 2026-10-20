/**
 * FlowNavigator - Venue Management CRUD Controller
 * Handles full CRUD operations:
 * - Create: via AddVenueManager modal or direct form
 * - Read: List all venues with live metrics from /api/venues
 * - Update: Edit venue name, capacity, city, and metadata
 * - Delete: Remove venues from database and sync with dropdown selector
 */

const VenueCrudManager = {
  venues: [],
  isLoading: false,

  init: function() {
    this.bindEvents();
    this.loadVenues();
  },

  bindEvents: function() {
    // Refresh button
    const refreshBtn = document.getElementById('vmRefreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadVenues());
    }

    // Open Add Venue Modal from Venue Manager
    const openCreateBtn = document.getElementById('vmOpenCreateModalBtn');
    if (openCreateBtn) {
      openCreateBtn.addEventListener('click', () => {
        if (window.AddVenueManager) window.AddVenueManager.openModal();
      });
    }

    // Search and Filter
    const searchInput = document.getElementById('vmSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderVenueTable());
    }

    const filterType = document.getElementById('vmFilterType');
    if (filterType) {
      filterType.addEventListener('change', () => this.renderVenueTable());
    }

    // Edit Modal bindings
    const closeEditBtn = document.getElementById('vmCloseEditModalBtn');
    const closeEditBtn2 = document.getElementById('vmCloseEditModalBtn2');
    const editModal = document.getElementById('vmEditVenueModal');

    if (closeEditBtn) closeEditBtn.addEventListener('click', () => this.closeEditModal());
    if (closeEditBtn2) closeEditBtn2.addEventListener('click', () => this.closeEditModal());
    if (editModal) {
      editModal.addEventListener('click', (e) => {
        if (e.target === editModal) this.closeEditModal();
      });
    }

    // Save Edit Form
    const saveEditBtn = document.getElementById('vmSaveEditBtn');
    if (saveEditBtn) {
      saveEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.saveVenueEdit();
      });
    }
  },

  loadVenues: async function() {
    this.isLoading = true;
    try {
      const resp = await fetch('/api/venues');
      const data = await resp.json();
      this.venues = data.venues || [];

      // Also merge any client-only custom venues stored in localStorage if not yet synced
      if (window.AddVenueManager && Array.isArray(window.AddVenueManager.customVenues)) {
        window.AddVenueManager.customVenues.forEach(cv => {
          if (!this.venues.some(v => v.id === cv.id)) {
            this.venues.push(cv);
          }
        });
      }

      this.updateStats();
      this.renderVenueTable();
      this.renderAdminTabTable();
    } catch (e) {
      console.error('[VenueCrudManager] Error loading venues:', e);
    } finally {
      this.isLoading = false;
    }
  },

  updateStats: function() {
    const totalVenuesEl = document.getElementById('vmStatTotalVenues');
    const totalCapEl = document.getElementById('vmStatTotalCap');
    const activeVenueEl = document.getElementById('vmStatActiveVenue');

    const adminCountEl = document.getElementById('adminVmStatCount');
    const adminCapEl = document.getElementById('adminVmStatCap');
    const adminActiveEl = document.getElementById('adminVmStatActive');

    let totalCap = 0;
    this.venues.forEach(v => {
      const cap = v.capacity || v.total_capacity || 0;
      totalCap += cap;
    });

    const activeId = window.FlowApp ? window.FlowApp.activeVenueId : 'palani-gathering';
    const activeVenue = this.venues.find(v => v.id === activeId);
    const activeName = activeVenue ? activeVenue.name : activeId;

    if (totalVenuesEl) totalVenuesEl.textContent = `${this.venues.length} Grounds`;
    if (totalCapEl) totalCapEl.textContent = `${totalCap.toLocaleString()} Capacity`;
    if (activeVenueEl) activeVenueEl.textContent = activeName;

    if (adminCountEl) adminCountEl.textContent = `${this.venues.length} Grounds`;
    if (adminCapEl) adminCapEl.textContent = `${totalCap.toLocaleString()} Safe Cap`;
    if (adminActiveEl) adminActiveEl.textContent = activeName;
  },

  renderVenueTable: function() {
    const tbody = document.getElementById('vmVenueTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('vmSearchInput')?.value || '').toLowerCase().trim();
    const filterType = document.getElementById('vmFilterType')?.value || 'all';

    const filtered = this.venues.filter(v => {
      const name = (v.name || '').toLowerCase();
      const city = (v.city || '').toLowerCase();
      const type = (v.type || v.category || '').toLowerCase();

      const matchesSearch = !searchTerm || name.includes(searchTerm) || city.includes(searchTerm) || type.includes(searchTerm);
      const matchesFilter = filterType === 'all' || type.includes(filterType.toLowerCase());

      return matchesSearch && matchesFilter;
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
            <div style="font-size:1.1rem; font-weight:700; margin-bottom:0.25rem;">No Venues Found</div>
            <div style="font-size:0.8rem;">Try adjusting your search terms or click "+ Add New Venue".</div>
          </td>
        </tr>
      `;
      return;
    }

    const activeId = window.FlowApp ? window.FlowApp.activeVenueId : '';

    tbody.innerHTML = filtered.map(v => {
      const isSelected = v.id === activeId;
      const isDefault = (v.id === 'palani-gathering' || v.id === 'meenakshi-temple' || v.id === 'chennai-stadium' || v.id === 'central-transit-hub');
      const cap = (v.capacity || v.total_capacity || 5000);
      const curCrowd = v.current_total_crowd || Math.round(cap * 0.48);
      const zonesCount = v.active_zones_count || v.zones_count || v.zones || 5;
      const typeLabel = v.category || v.type || 'Custom Ground';

      return `
        <tr style="${isSelected ? 'background:rgba(37,99,235,0.06);' : ''}">
          <td>
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-weight:800; color:var(--text-main); font-size:0.92rem;">${v.name}</span>
              ${isSelected ? '<span class="badge badge-safe" style="font-size:0.65rem;">ACTIVE MONITORING</span>' : ''}
              ${v.is_custom || String(v.id).startsWith('custom-') ? '<span class="badge" style="background:#fef3c7;color:#92400e;font-size:0.65rem;">CUSTOM</span>' : ''}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">ID: ${v.id}</div>
          </td>
          <td>
            <span class="badge" style="background:#eff6ff; color:#1d4ed8; font-size:0.75rem; font-weight:700;">
              ${typeLabel}
            </span>
          </td>
          <td style="font-size:0.82rem; color:var(--text-muted); font-weight:600;">
            ${v.city || 'Tamil Nadu'}
          </td>
          <td>
            <div style="font-weight:800; color:var(--text-main); font-size:0.88rem;">${cap.toLocaleString()} ppl</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${v.area ? Math.round(v.area).toLocaleString() + ' m²' : 'Standard bounds'}</div>
          </td>
          <td style="font-size:0.82rem; font-weight:700; color:#2563eb;">
            ${zonesCount} Zones
          </td>
          <td>
            <div style="font-size:0.82rem; font-weight:700; color:#059669;">
              ● ~${curCrowd.toLocaleString()} active
            </div>
            <div style="font-size:0.72rem; color:var(--text-muted);">
              ${Math.round((curCrowd / cap) * 100)}% density
            </div>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:0.4rem; justify-content:flex-end;">
              <button class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.25rem 0.55rem; color:#2563eb; border-color:#93c5fd; background:#eff6ff;" onclick="VenueCrudManager.selectVenue('${v.id}')" title="Set as live active ground">
                Select &amp; Monitor
              </button>
              <button class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.25rem 0.55rem;" onclick="VenueCrudManager.openEditModal('${v.id}')" title="Edit details">
                Edit
              </button>
              ${isDefault ? `
                <button class="btn btn-outline btn-sm" style="font-size:0.75rem; padding:0.25rem 0.55rem; opacity:0.45; cursor:not-allowed;" title="Template venue protected" disabled>
                  Delete
                </button>
              ` : `
                <button class="btn btn-outline btn-sm" style="color:#b91c1c; border-color:#fca5a5; background:#fef2f2; font-size:0.75rem; padding:0.25rem 0.55rem;" onclick="VenueCrudManager.deleteVenue('${v.id}')" title="Delete venue">
                  Delete
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  renderAdminTabTable: function() {
    const tbody = document.getElementById('adminVenueTableBody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('adminVmSearchInput')?.value || '').toLowerCase().trim();

    const filtered = this.venues.filter(v => {
      if (!searchTerm) return true;
      const name = (v.name || '').toLowerCase();
      const city = (v.city || '').toLowerCase();
      const type = (v.type || v.category || '').toLowerCase();
      return name.includes(searchTerm) || city.includes(searchTerm) || type.includes(searchTerm);
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">
            No venues found matching "${searchTerm}".
          </td>
        </tr>
      `;
      return;
    }

    const activeId = window.FlowApp ? window.FlowApp.activeVenueId : '';

    tbody.innerHTML = filtered.map(v => {
      const isDefault = (v.id === 'palani-gathering' || v.id === 'meenakshi-temple' || v.id === 'chennai-stadium' || v.id === 'central-transit-hub');
      const cap = (v.capacity || v.total_capacity || 5000);
      const isSelected = activeId === v.id;
      const zonesCount = v.active_zones_count || v.zones_count || v.zones || 5;

      return `
        <tr style="${isSelected ? 'background:rgba(37,99,235,0.06);' : ''}">
          <td>
            <div style="font-weight:700; color:var(--text-main); font-size:0.88rem;">${v.name}</div>
            <div style="font-size:0.72rem; color:var(--text-muted); font-family:monospace;">${v.id}</div>
          </td>
          <td><span class="badge" style="background:#eff6ff; color:#1d4ed8; font-size:0.72rem; font-weight:700;">${v.category || v.type || 'Custom'}</span></td>
          <td style="font-size:0.8rem; color:var(--text-muted); font-weight:600;">${v.city || 'Tamil Nadu'}</td>
          <td style="font-weight:800; font-size:0.85rem; color:var(--text-main);">${cap.toLocaleString()} ppl</td>
          <td style="font-size:0.8rem; font-weight:700; color:#2563eb;">${zonesCount} Zones</td>
          <td>
            <span class="badge ${isSelected ? 'badge-safe' : 'badge-safe'}" style="font-size:0.7rem;">
              ● ${isSelected ? 'ACTIVE ON DISPATCH' : 'Online'}
            </span>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:0.35rem;">
              <button class="btn btn-outline btn-sm" style="font-size:0.72rem; padding:0.2rem 0.5rem; color:#2563eb; border-color:#93c5fd; background:#eff6ff;" onclick="VenueCrudManager.selectVenue('${v.id}')">Select</button>
              <button class="btn btn-outline btn-sm" style="font-size:0.72rem; padding:0.2rem 0.5rem;" onclick="VenueCrudManager.openEditModal('${v.id}')">Edit</button>
              ${!isDefault ? `<button class="btn btn-outline btn-sm" style="color:#b91c1c; border-color:#fca5a5; background:#fef2f2; font-size:0.72rem; padding:0.2rem 0.5rem;" onclick="VenueCrudManager.deleteVenue('${v.id}')">Delete</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  selectVenue: function(venueId) {
    if (window.FlowApp) {
      window.FlowApp.setVenue(venueId);
      this.updateStats();
      this.renderVenueTable();
      this.renderAdminTabTable();

      // Show brief notification
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:99999;background:#059669;color:#fff;padding:0.85rem 1.25rem;border-radius:10px;font-size:0.85rem;font-weight:700;box-shadow:0 8px 32px rgba(0,0,0,0.2);display:flex;align-items:center;gap:0.5rem;';
      toast.innerHTML = '✔ Active Ground Switched to: ' + venueId;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    }
  },

  openEditModal: function(venueId) {
    const venue = this.venues.find(v => v.id === venueId);
    if (!venue) return;

    const idInput = document.getElementById('vmEditVenueId');
    const nameInput = document.getElementById('vmEditName');
    const cityInput = document.getElementById('vmEditCity');
    const typeSelect = document.getElementById('vmEditType');
    const capInput = document.getElementById('vmEditCapacity');
    const gatesInput = document.getElementById('vmEditGates');
    const feedback = document.getElementById('vmEditFeedback');

    if (idInput) idInput.value = venue.id;
    if (nameInput) nameInput.value = venue.name || '';
    if (cityInput) cityInput.value = venue.city || '';
    if (typeSelect) typeSelect.value = venue.type || 'college-event';
    if (capInput) capInput.value = venue.capacity || venue.total_capacity || 5000;
    if (gatesInput) gatesInput.value = venue.gates || 4;
    if (feedback) feedback.style.display = 'none';

    const modal = document.getElementById('vmEditVenueModal');
    if (modal) modal.classList.add('active');
  },

  closeEditModal: function() {
    const modal = document.getElementById('vmEditVenueModal');
    if (modal) modal.classList.remove('active');
  },

  saveVenueEdit: async function() {
    const venueId = document.getElementById('vmEditVenueId')?.value;
    const name = document.getElementById('vmEditName')?.value.trim();
    const city = document.getElementById('vmEditCity')?.value.trim();
    const type = document.getElementById('vmEditType')?.value;
    const capacity = parseInt(document.getElementById('vmEditCapacity')?.value || 0);
    const gates = parseInt(document.getElementById('vmEditGates')?.value || 4);
    const feedback = document.getElementById('vmEditFeedback');

    if (!name) {
      if (feedback) {
        feedback.textContent = 'Venue name cannot be empty.';
        feedback.style.background = '#fef2f2';
        feedback.style.color = '#b91c1c';
        feedback.style.display = 'block';
      }
      return;
    }

    try {
      const resp = await fetch(`/api/venues/${venueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, city, type, capacity, gates })
      });
      const data = await resp.json();

      if (resp.ok && data.success) {
        // Update local object
        const target = this.venues.find(v => v.id === venueId);
        if (target) {
          target.name = name;
          target.city = city;
          target.type = type;
          target.capacity = capacity;
          target.total_capacity = capacity;
          target.gates = gates;
        }

        // Also update AddVenueManager if in custom venues
        if (window.AddVenueManager) {
          const cv = window.AddVenueManager.customVenues.find(v => v.id === venueId);
          if (cv) {
            cv.name = name;
            cv.city = city;
            cv.type = type;
            cv.capacity = capacity;
            window.AddVenueManager.saveToStorage();
          }
        }

        // Update dropdown option label
        const select = document.getElementById('venueSelect');
        const opt = select?.querySelector(`option[value="${venueId}"]`);
        if (opt) {
          opt.textContent = name + (city ? ` (${city})` : '');
        }

        // Update Map configs if present
        if (window.GoogleMapsManager?.venueConfigs?.[venueId]) {
          window.GoogleMapsManager.venueConfigs[venueId].name = name;
          window.GoogleMapsManager.venueConfigs[venueId].city = city;
          window.GoogleMapsManager.venueConfigs[venueId].capacity = capacity;
        }

        if (feedback) {
          feedback.textContent = '✅ Venue updated successfully!';
          feedback.style.background = '#ecfdf5';
          feedback.style.color = '#047857';
          feedback.style.display = 'block';
        }

        setTimeout(() => {
          this.closeEditModal();
          this.loadVenues();
          if (window.FlowApp && window.FlowApp.activeVenueId === venueId) {
            window.FlowApp.setVenue(venueId);
          }
        }, 800);
      } else {
        if (feedback) {
          feedback.textContent = data.message || 'Failed to update venue';
          feedback.style.background = '#fef2f2';
          feedback.style.color = '#b91c1c';
          feedback.style.display = 'block';
        }
      }
    } catch (e) {
      console.error('[VenueCrudManager] Save edit error:', e);
    }
  },

  deleteVenue: async function(venueId) {
    const venue = this.venues.find(v => v.id === venueId);
    const name = venue ? venue.name : venueId;

    if (!confirm(`Are you sure you want to delete venue "${name}"? This will remove all associated zones and sensor records.`)) {
      return;
    }

    try {
      const resp = await fetch(`/api/venues/${venueId}`, { method: 'DELETE' });
      const data = await resp.json();

      if (resp.ok && data.success) {
        // Remove from AddVenueManager client storage
        if (window.AddVenueManager) {
          window.AddVenueManager.removeVenue(venueId);
        }

        // Remove from local list
        this.venues = this.venues.filter(v => v.id !== venueId);

        // Remove from dropdown select
        const select = document.getElementById('venueSelect');
        const opt = select?.querySelector(`option[value="${venueId}"]`);
        if (opt) opt.remove();

        // If active, fallback to palani-gathering
        if (window.FlowApp && window.FlowApp.activeVenueId === venueId) {
          window.FlowApp.setVenue('palani-gathering');
        }

        this.updateStats();
        this.renderVenueTable();
        this.renderAdminTabTable();
      } else {
        alert(data.message || 'Could not delete venue');
      }
    } catch (e) {
      console.error('[VenueCrudManager] Delete error:', e);
    }
  }
};

window.VenueCrudManager = VenueCrudManager;

document.addEventListener('DOMContentLoaded', () => {
  VenueCrudManager.init();
});
