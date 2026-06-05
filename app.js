// SafeStay AP Police Intelligence Dashboard - Controller Logic

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let currentTab = 'checkins'; // checkins, properties, audit
  let selectedDistrictId = null;
  let mapMode = 'occupancy'; // occupancy, alerts
  let searchQuery = '';
  
  // Leaflet Map State
  let map = null;
  let tileLayer = null;
  let markersLayer = null;
  
  // District Coordinates Map (Andhra Pradesh hubs)
  const DISTRICT_COORDS = {
    'AP-VJA': { lat: 16.5062, lng: 80.6480, name: 'Vijayawada' },
    'AP-VSKP': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam' },
    'AP-GNT': { lat: 16.3067, lng: 80.4365, name: 'Guntur' },
    'AP-TPT': { lat: 13.6288, lng: 79.4192, name: 'Tirupati' },
    'AP-KRN': { lat: 15.8281, lng: 78.0373, name: 'Kurnool' },
    'AP-ANTP': { lat: 14.6819, lng: 77.6006, name: 'Anantapuramu' }
  };

  // DOM Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const dashboardSearch = document.getElementById('dashboardSearch');
  const activeSosBtn = document.getElementById('activeSosBtn');
  const activeSosCount = document.getElementById('activeSosCount');
  
  const kpiTotalProperties = document.getElementById('kpiTotalProperties');
  const kpiTotalCheckins = document.getElementById('kpiTotalCheckins');
  const kpiTotalThreats = document.getElementById('kpiTotalThreats');
  
  const districtListRail = document.getElementById('districtListRail');
  const dashboardTable = document.getElementById('dashboardTable');
  const dashboardTableBody = document.getElementById('dashboardTableBody');
  
  const tabCheckins = document.getElementById('tabCheckins');
  const tabProperties = document.getElementById('tabProperties');
  const tabAudit = document.getElementById('tabAudit');
  
  const alertTickerContainer = document.getElementById('alertTickerContainer');
  const incidentListContainer = document.getElementById('incidentListContainer');
  
  const detailsDrawer = document.getElementById('detailsDrawer');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const drawerBodyContent = document.getElementById('drawerBodyContent');

  // Sidebar Links
  const sideNavDashboard = document.getElementById('sideNavDashboard');
  const sideNavProperties = document.getElementById('sideNavProperties');
  const sideNavGuests = document.getElementById('sideNavGuests');
  const sideNavThreats = document.getElementById('sideNavThreats');
  const sideNavSos = document.getElementById('sideNavSos');

  // Headers
  const commandHeaderTitle = document.getElementById('commandHeaderTitle');
  const commandHeaderSub = document.getElementById('commandHeaderSub');
  const mapSectionPanel = document.getElementById('mapSectionPanel');

  // --- Initialize Map ---
  function initMap() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Create map centered on Andhra Pradesh
    map = L.map('leafletMap', {
      center: [15.9129, 79.7400],
      zoom: 7,
      zoomControl: true,
      attributionControl: false
    });
    
    // Add custom styled theme-based tile layers (CartoDB Dark Matter / CartoDB Voyager)
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      
    tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19
    }).addTo(map);
    
    markersLayer = L.layerGroup().addTo(map);
    renderMapMarkers();
  }

  // Update map tiles when theme is toggled
  function updateMapTheme() {
    if (!map || !tileLayer) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const tileUrl = isDark 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    
    map.removeLayer(tileLayer);
    tileLayer = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
  }

  // Render markers representing districts on OpenStreetMap
  function renderMapMarkers() {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    MOCK_DATA.districts.forEach(district => {
      const coords = DISTRICT_COORDS[district.id];
      if (!coords) return;

      // Determine colors based on active alerts and select state
      const isSelected = selectedDistrictId === district.id;
      let color = '#2196F3'; // Info blue
      
      if (district.activeSos > 0) {
        color = '#ef4444'; // Alarm red
      } else if (district.watchlistMatches > 0) {
        color = '#f59e0b'; // Warn orange
      } else if (mapMode === 'occupancy') {
        color = district.occupancy > 75 ? '#ef4444' : (district.occupancy > 55 ? '#f59e0b' : '#10b981');
      }

      // Calculate circle size
      let radiusValue = 22000; // base size
      if (mapMode === 'occupancy') {
        radiusValue += district.occupancy * 120;
      } else {
        radiusValue += (district.activeSos * 8000) + (district.watchlistMatches * 4000);
      }

      const circle = L.circle([coords.lat, coords.lng], {
        color: color,
        fillColor: color,
        fillOpacity: isSelected ? 0.55 : 0.3,
        weight: isSelected ? 3 : 1.5,
        radius: radiusValue
      });

      // Bind dynamic high-end glassmorphic tooltip/popup content
      const popupHtml = `
        <div style="font-family: inherit; color: #1e293b; padding: 4px;">
          <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: ${color};">${district.name} Hub</h4>
          <div style="font-size: 11px; margin-bottom: 4px;"><strong>Occupancy Status:</strong> ${district.occupancy}% occupancy</div>
          <div style="font-size: 11px; margin-bottom: 4px;"><strong>Verified Places:</strong> ${district.PGs + district.hotels} lodgings</div>
          <div style="font-size: 11px; margin-bottom: 4px;"><strong>Active Threat Alarms:</strong> ${district.activeSos} SOS cases</div>
          <div style="font-size: 11px;"><strong>Watchlist Matches:</strong> ${district.watchlistMatches} flagged</div>
        </div>
      `;
      circle.bindTooltip(popupHtml, { permanent: false, direction: 'top' });

      // Click callback
      circle.on('click', () => {
        if (selectedDistrictId === district.id) {
          selectedDistrictId = null; // deselect
        } else {
          selectedDistrictId = district.id;
          map.setView([coords.lat, coords.lng], 9);
        }
        renderDistrictList();
        renderMapMarkers();
        renderTable();
      });

      markersLayer.addLayer(circle);
    });
  }

  // --- Theme Toggle Controller ---
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    updateMapTheme();
  });

  // --- Initial KPI setup ---
  function updateKPIs() {
    const totalProps = MOCK_DATA.properties.length + MOCK_DATA.districts.reduce((acc, d) => acc + d.PGs + d.hotels, 0);
    const totalCheckins = MOCK_DATA.liveCheckins.length + MOCK_DATA.districts.reduce((acc, d) => acc + d.checkins, 0);
    const totalWatchlist = MOCK_DATA.liveCheckins.filter(c => c.watchlistMatch).length + MOCK_DATA.districts.reduce((acc, d) => acc + d.watchlistMatches, 0);
    const totalSos = MOCK_DATA.incidents.filter(i => i.status === 'Dispatch Active').length;
    
    kpiTotalProperties.textContent = totalProps.toLocaleString();
    kpiTotalCheckins.textContent = totalCheckins.toLocaleString();
    kpiTotalThreats.textContent = totalWatchlist;
    activeSosCount.textContent = `${totalSos} ACTIVE SOS`;
    
    if (totalSos > 0) {
      activeSosBtn.style.display = 'flex';
      activeSosBtn.classList.add('critical-alert-flash');
    } else {
      activeSosBtn.style.display = 'none';
      activeSosBtn.classList.remove('critical-alert-flash');
    }
  }

  // --- Search Input Controller ---
  dashboardSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderTable();
  });

  // --- Tab Switchers ---
  tabCheckins.addEventListener('click', () => {
    switchTab('checkins');
  });
  tabProperties.addEventListener('click', () => {
    switchTab('properties');
  });
  tabAudit.addEventListener('click', () => {
    switchTab('audit');
  });

  function switchTab(tabName) {
    currentTab = tabName;
    [tabCheckins, tabProperties, tabAudit].forEach(btn => btn.classList.remove('active'));
    
    if (tabName === 'checkins') tabCheckins.classList.add('active');
    if (tabName === 'properties') tabProperties.classList.add('active');
    if (tabName === 'audit') tabAudit.classList.add('active');
    
    renderTable();
  }

  // --- District Map & List Controllers ---
  function renderDistrictList() {
    districtListRail.innerHTML = '';
    
    MOCK_DATA.districts.forEach(district => {
      const isSelected = selectedDistrictId === district.id;
      const row = document.createElement('div');
      row.className = `district-row ${isSelected ? 'selected' : ''}`;
      row.dataset.id = district.id;
      
      let badgeColor = 'var(--success-glow)';
      let badgeTextColor = 'var(--success)';
      let badgeLabel = 'Stable';
      
      if (district.activeSos > 0) {
        badgeColor = 'var(--danger-glow)';
        badgeTextColor = 'var(--danger)';
        badgeLabel = 'SOS Active';
      } else if (district.watchlistMatches > 0) {
        badgeColor = 'var(--warning-glow)';
        badgeTextColor = 'var(--warning)';
        badgeLabel = 'Alert Flags';
      }
      
      row.innerHTML = `
        <div class="district-info">
          <h4>${district.name}</h4>
          <p>${district.PGs + district.hotels} Verified PGs/Hotels</p>
        </div>
        <div class="district-stat">
          <span class="district-occupancy">${district.occupancy}% Occupancy</span>
          <span class="district-badge" style="background-color: ${badgeColor}; color: ${badgeTextColor}">${badgeLabel}</span>
        </div>
      `;
      
      row.addEventListener('click', () => {
        if (selectedDistrictId === district.id) {
          selectedDistrictId = null; // Unselect
          if (map) map.setView([15.9129, 79.7400], 7);
        } else {
          selectedDistrictId = district.id;
          const coords = DISTRICT_COORDS[district.id];
          if (map && coords) {
            map.setView([coords.lat, coords.lng], 9.5);
          }
        }
        renderDistrictList();
        renderMapMarkers();
        renderTable();
      });
      
      districtListRail.appendChild(row);
    });
  }

  // Switch map modes
  document.querySelectorAll('[data-map-mode]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('[data-map-mode]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      mapMode = e.target.dataset.mapMode;
      renderMapMarkers();
    });
  });

  // --- Dynamic Table Renderer ---
  function renderTable() {
    dashboardTableBody.innerHTML = '';
    const headerRow = dashboardTable.querySelector('thead');
    
    // Filter matching district if chosen
    const filterDistrict = selectedDistrictId ? MOCK_DATA.districts.find(d => d.id === selectedDistrictId)?.name : null;
    
    if (currentTab === 'checkins') {
      headerRow.innerHTML = `
        <tr>
          <th>Occupant Name</th>
          <th>Verification ID</th>
          <th>Nationality</th>
          <th>Location / Property</th>
          <th>Check-in Time</th>
          <th>Status</th>
        </tr>
      `;
      
      const filtered = MOCK_DATA.liveCheckins.filter(c => {
        const matchesDistrict = !filterDistrict || c.propertyName.includes(filterDistrict) || MOCK_DATA.properties.find(p => p.name === c.propertyName)?.district === filterDistrict;
        
        let matchesSearch = !searchQuery || c.guestName.toLowerCase().includes(searchQuery) || c.idNumber.toLowerCase().includes(searchQuery) || c.propertyName.toLowerCase().includes(searchQuery);
        
        // Custom search mode hooks
        if (searchQuery === 'watchlist') {
          return matchesDistrict && c.watchlistMatch;
        }
        
        return matchesDistrict && matchesSearch;
      });
      
      if (filtered.length === 0) {
        dashboardTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No check-in logs match current criteria.</td></tr>`;
        return;
      }
      
      filtered.forEach(item => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        
        let statusClass = 'verified';
        if (item.status === 'Watchlist Match') statusClass = 'flagged';
        if (item.status === 'Escalated') statusClass = 'pending';
        
        row.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${item.photo}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
              <strong>${item.guestName}</strong>
            </div>
          </td>
          <td>
            <span style="font-family: var(--font-mono); font-size: 11px;">${item.idType}: ${item.idNumber}</span>
          </td>
          <td>${item.nationality}</td>
          <td>
            <div>${item.propertyName}</div>
            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Room ${item.roomNumber}</div>
          </td>
          <td style="font-family: var(--font-mono); font-size: 11px;">${new Date(item.checkinTime).toLocaleTimeString()}</td>
          <td>
            <span class="status-indicator ${statusClass}">${item.status}</span>
          </td>
        `;
        
        row.addEventListener('click', () => openGuestDrawer(item));
        dashboardTableBody.appendChild(row);
      });
      
    } else if (currentTab === 'properties') {
      headerRow.innerHTML = `
        <tr>
          <th>Property Name</th>
          <th>Type</th>
          <th>Location</th>
          <th>Capacity</th>
          <th>Audit Score</th>
          <th>Safety Standard</th>
        </tr>
      `;
      
      const filtered = MOCK_DATA.properties.filter(p => {
        const matchesDistrict = !filterDistrict || p.district === filterDistrict;
        const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery) || p.ownerName.toLowerCase().includes(searchQuery) || p.address.toLowerCase().includes(searchQuery);
        return matchesDistrict && matchesSearch;
      });
      
      if (filtered.length === 0) {
        dashboardTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No property records match search.</td></tr>`;
        return;
      }
      
      filtered.forEach(item => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        
        let scoreClass = 'high';
        if (item.complianceScore < 50) scoreClass = 'low';
        else if (item.complianceScore < 85) scoreClass = 'mid';
        
        row.innerHTML = `
          <td><strong>${item.name}</strong></td>
          <td><span style="font-size: 10px; font-weight: bold; text-transform: uppercase;">${item.type}</span></td>
          <td>${item.address}</td>
          <td style="font-family: var(--font-mono); font-size: 12px;">${item.occupiedRooms}/${item.totalRooms} rooms</td>
          <td>
            <span class="score-badge ${scoreClass}">${item.complianceScore}%</span>
          </td>
          <td>
            <span class="status-indicator ${item.status}">${item.status}</span>
          </td>
        `;
        
        row.addEventListener('click', () => openPropertyDrawer(item));
        dashboardTableBody.appendChild(row);
      });
      
    } else if (currentTab === 'audit') {
      headerRow.innerHTML = `
        <tr>
          <th>Facility</th>
          <th>CCTV Surveillance</th>
          <th>Fire clearance</th>
          <th>Guard Security</th>
          <th>Last Compliance Audit</th>
          <th>Action</th>
        </tr>
      `;
      
      const filtered = MOCK_DATA.properties.filter(p => {
        const matchesDistrict = !filterDistrict || p.district === filterDistrict;
        const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery);
        return matchesDistrict && matchesSearch;
      });
      
      filtered.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td><strong>${item.name}</strong></td>
          <td>
            <span style="color: ${item.cctvWorking ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">
              ${item.cctvWorking ? '✓ Functional' : '✗ Offline'}
            </span>
          </td>
          <td>
            <span style="color: ${item.fireSafety ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">
              ${item.fireSafety ? '✓ Verified' : '✗ Pending'}
            </span>
          </td>
          <td><span style="font-size: 11px;">${item.guardDetails}</span></td>
          <td style="font-family: var(--font-mono); font-size: 11px;">${item.lastAudit}</td>
          <td>
            <button class="btn-action-small primary" onclick="event.stopPropagation(); triggerAudit('${item.id}')">Force Audit</button>
          </td>
        `;
        
        dashboardTableBody.appendChild(row);
      });
    }
  }

  window.triggerAudit = (propId) => {
    const prop = MOCK_DATA.properties.find(p => p.id === propId);
    if (prop) {
      alert(`Initiated immediate automated Police Safety Compliance audit for ${prop.name}. CCTV logs, digital registers, and gate access controls are being analyzed.`);
      prop.lastAudit = new Date().toISOString().split('T')[0];
      prop.complianceScore = Math.min(100, prop.complianceScore + 8);
      renderTable();
    }
  };

  // --- Real-time alert ticker stream ---
  function renderAlertTicker() {
    alertTickerContainer.innerHTML = '';
    
    // Filter alerts if SOS mode is highlighted
    let filteredAlerts = MOCK_DATA.alerts;
    if (searchQuery === 'sos') {
      filteredAlerts = MOCK_DATA.alerts.filter(a => a.type === 'sos');
    }

    filteredAlerts.forEach(alertItem => {
      const card = document.createElement('div');
      card.className = `alert-card ${alertItem.severity}`;
      
      let icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>`;
      if (alertItem.type === 'sos') {
        icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`;
      }
      
      card.innerHTML = `
        <div class="alert-icon-wrapper">
          ${icon}
        </div>
        <div class="alert-body">
          <h4 style="text-transform: uppercase;">${alertItem.type} alert</h4>
          <p>${alertItem.message}</p>
          <div class="alert-time">${alertItem.time}</div>
        </div>
      `;
      
      card.addEventListener('click', () => {
        const prop = MOCK_DATA.properties.find(p => p.id === alertItem.propertyId);
        if (prop) {
          openPropertyDrawer(prop);
        }
      });
      
      alertTickerContainer.appendChild(card);
    });
  }

  // --- Dispatch Incident Tracker ---
  function renderIncidents() {
    incidentListContainer.innerHTML = '';
    MOCK_DATA.incidents.forEach(incident => {
      const card = document.createElement('div');
      card.className = `incident-card ${incident.status === 'Dispatch Active' ? 'active' : ''}`;
      
      let badgeClass = incident.status === 'Dispatch Active' ? 'dispatch' : 'investigation';
      
      card.innerHTML = `
        <div class="incident-head">
          <h4>${incident.type}</h4>
          <span class="incident-badge ${badgeClass}">${incident.status}</span>
        </div>
        <p class="incident-desc">${incident.details}</p>
        <div class="incident-meta">
          <span>${incident.propertyName}</span>
          <span>${incident.assignedOfficer}</span>
        </div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button class="btn-action-small primary" onclick="resolveIncident('${incident.id}')">Resolve Case</button>
          <button class="btn-action-small" style="background-color: var(--border-subtle); color: var(--text-primary)" onclick="reassignOfficer('${incident.id}')">Reassign</button>
        </div>
      `;
      incidentListContainer.appendChild(card);
    });
  }

  window.resolveIncident = (incidentId) => {
    const inc = MOCK_DATA.incidents.find(i => i.id === incidentId);
    if (inc) {
      inc.status = 'Resolved';
      inc.details = `Incident resolved successfully. Verification cleared by command patrol force.`;
      setTimeout(() => {
        MOCK_DATA.incidents = MOCK_DATA.incidents.filter(i => i.id !== incidentId);
        renderIncidents();
        updateKPIs();
      }, 2000);
      renderIncidents();
      updateKPIs();
    }
  };

  window.reassignOfficer = (incidentId) => {
    const inc = MOCK_DATA.incidents.find(i => i.id === incidentId);
    if (inc) {
      const newOfficer = prompt("Enter Name of New Assigned Patrol Officer / Inspector:", inc.assignedOfficer);
      if (newOfficer) {
        inc.assignedOfficer = newOfficer;
        renderIncidents();
      }
    }
  };

  // --- Drawer Detail Openers ---
  function openGuestDrawer(guest) {
    drawerBodyContent.innerHTML = `
      <div class="drawer-header">
        <img src="${guest.photo}" alt="${guest.guestName}" class="drawer-photo">
        <div class="drawer-title-desc">
          <h3>${guest.guestName}</h3>
          <p>${guest.nationality} National • Age ${guest.age}</p>
        </div>
      </div>

      <div>
        <div class="drawer-section-title">Stay & Check-in Credentials</div>
        <div class="info-grid">
          <div class="info-item">
            <h5>Property Location</h5>
            <p>${guest.propertyName}</p>
          </div>
          <div class="info-item">
            <h5>Assigned Room</h5>
            <p>Room ${guest.roomNumber}</p>
          </div>
          <div class="info-item">
            <h5>Check-in Timestamp</h5>
            <p>${new Date(guest.checkinTime).toLocaleString()}</p>
          </div>
          <div class="info-item">
            <h5>Contact Number</h5>
            <p>${guest.phone}</p>
          </div>
        </div>
      </div>

      <div>
        <div class="drawer-section-title">Identity verification document</div>
        <div class="info-item" style="margin-bottom: 12px;">
          <h5>Document Type & Reference</h5>
          <p>${guest.idType} (${guest.idNumber})</p>
        </div>
        <img src="${guest.idImage}" alt="Scanned Document" class="id-doc-preview">
      </div>

      ${guest.watchlistMatch ? `
        <div style="background-color: var(--danger-glow); border: 1px solid var(--danger); padding: 16px; border-radius: 12px;">
          <div style="display: flex; align-items: center; gap: 8px; color: var(--danger); font-weight: 700; font-size: 13px; margin-bottom: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            Watchlist Threat Triggered
          </div>
          <p style="font-size: 12px; line-height: 1.5; color: var(--text-primary);">${guest.watchlistReason}</p>
        </div>
      ` : ''}

      <div class="drawer-actions">
        <button class="btn-action-large primary" id="btnActionClear">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          Clear and Verify profile
        </button>
        <button class="btn-action-large warning" id="btnActionEscalate">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
          Escalate to Control Room
        </button>
        <button class="btn-action-large danger" id="btnActionFlag">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
          Flag and Suspend Occupant
        </button>
      </div>
    `;
    
    // Add Actions listeners
    document.getElementById('btnActionClear').addEventListener('click', () => {
      guest.status = 'Cleared';
      guest.watchlistMatch = false;
      guest.watchlistReason = '';
      closeDrawer();
      updateKPIs();
      renderTable();
      renderMapMarkers();
      renderDistrictList();
    });
    
    document.getElementById('btnActionEscalate').addEventListener('click', () => {
      guest.status = 'Escalated';
      const newInc = {
        id: `INC-${Date.now().toString().slice(-4)}`,
        propertyName: guest.propertyName,
        district: 'NTR Vijayawada',
        type: 'Escalated Guest Review',
        reportedAt: new Date().toISOString(),
        assignedOfficer: 'DCP K. Saritha (Special Branch)',
        status: 'Under Investigation',
        details: `Profile match pending manual investigation for passport/ID mismatch. ID Reference: ${guest.idNumber}.`
      };
      MOCK_DATA.incidents.unshift(newInc);
      closeDrawer();
      renderIncidents();
      updateKPIs();
      renderTable();
    });

    document.getElementById('btnActionFlag').addEventListener('click', () => {
      guest.status = 'Flagged';
      guest.watchlistMatch = true;
      guest.watchlistReason = 'Manually flagged as threat by DCP Vijayawada';
      closeDrawer();
      updateKPIs();
      renderTable();
    });

    detailsDrawer.classList.add('open');
  }

  function openPropertyDrawer(property) {
    drawerBodyContent.innerHTML = `
      <div class="drawer-header">
        <div class="sidebar-logo" style="width: 48px; height: 48px; border-radius: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
        </div>
        <div class="drawer-title-desc">
          <h3>${property.name}</h3>
          <p>${property.type} • ${property.district}</p>
        </div>
      </div>

      <div>
        <div class="drawer-section-title">Owner details</div>
        <div class="info-grid">
          <div class="info-item">
            <h5>Owner Name</h5>
            <p>${property.ownerName}</p>
          </div>
          <div class="info-item">
            <h5>Contact Number</h5>
            <p>${property.ownerPhone}</p>
          </div>
          <div class="info-item" style="grid-column: span 2">
            <h5>Registered Address</h5>
            <p>${property.address}</p>
          </div>
        </div>
      </div>

      <div>
        <div class="drawer-section-title">Compliance Metrics</div>
        <div class="info-grid">
          <div class="info-item">
            <h5>CCTV Surveillance</h5>
            <p style="color: ${property.cctvWorking ? 'var(--success)' : 'var(--danger)'}">
              ${property.cctvWorking ? '✓ Functional' : '✗ Offline'}
            </p>
          </div>
          <div class="info-item">
            <h5>Fire Safety Permit</h5>
            <p style="color: ${property.fireSafety ? 'var(--success)' : 'var(--danger)'}">
              ${property.fireSafety ? '✓ Verified' : '✗ Pending'}
            </p>
          </div>
          <div class="info-item">
            <h5>Security Personnel</h5>
            <p>${property.guardDetails}</p>
          </div>
          <div class="info-item">
            <h5>Safety Score</h5>
            <p>${property.complianceScore}% Verified</p>
          </div>
        </div>
      </div>

      <div class="drawer-actions">
        <button class="btn-action-large success" id="btnPropApprove">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Approve Verification
        </button>
        <button class="btn-action-large warning" id="btnPropFlag">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
          Flag Facility
        </button>
        <button class="btn-action-large danger" id="btnPropSuspend">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
          Suspend Access Permit
        </button>
      </div>
    `;

    // Actions Listeners
    document.getElementById('btnPropApprove').addEventListener('click', () => {
      property.status = 'verified';
      property.complianceScore = Math.max(90, property.complianceScore);
      closeDrawer();
      updateKPIs();
      renderTable();
    });

    document.getElementById('btnPropFlag').addEventListener('click', () => {
      property.status = 'flagged';
      property.complianceScore = Math.min(65, property.complianceScore);
      closeDrawer();
      updateKPIs();
      renderTable();
    });

    document.getElementById('btnPropSuspend').addEventListener('click', () => {
      property.status = 'suspended';
      closeDrawer();
      updateKPIs();
      renderTable();
    });

    detailsDrawer.classList.add('open');
  }

  function closeDrawer() {
    detailsDrawer.classList.remove('open');
  }

  drawerCloseBtn.addEventListener('click', closeDrawer);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // --- Sidebar View Navigation Router ---
  function resetActiveSidebarItem(activeBtn) {
    [sideNavDashboard, sideNavProperties, sideNavGuests, sideNavThreats, sideNavSos].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    if (activeBtn) activeBtn.classList.add('active');
  }

  if (sideNavDashboard) {
    sideNavDashboard.addEventListener('click', (e) => {
      e.preventDefault();
      resetActiveSidebarItem(sideNavDashboard);
      
      // Restore default command center view
      commandHeaderTitle.textContent = "Command Center Dashboard";
      commandHeaderSub.textContent = "Real-time district hospitality intelligence & safety monitoring";
      searchQuery = '';
      dashboardSearch.value = '';
      selectedDistrictId = null;
      mapSectionPanel.style.display = 'block';
      
      switchTab('checkins');
      renderDistrictList();
      renderMapMarkers();
      renderAlertTicker();
      
      if (map) {
        map.setView([15.9129, 79.7400], 7);
        setTimeout(() => map.invalidateSize(), 200);
      }
    });
  }

  if (sideNavProperties) {
    sideNavProperties.addEventListener('click', (e) => {
      e.preventDefault();
      resetActiveSidebarItem(sideNavProperties);
      
      commandHeaderTitle.textContent = "Verified Stays & Accommodations";
      commandHeaderSub.textContent = "Audit compliance registry for PGs, hostels & apartments";
      
      switchTab('properties');
      
      // Auto scroll to tables for visibility
      document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (sideNavGuests) {
    sideNavGuests.addEventListener('click', (e) => {
      e.preventDefault();
      resetActiveSidebarItem(sideNavGuests);
      
      commandHeaderTitle.textContent = "Live Check-in Occupants";
      commandHeaderSub.textContent = "Continuous tenant registration database and digital safety stamps";
      
      switchTab('checkins');
      document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (sideNavThreats) {
    sideNavThreats.addEventListener('click', (e) => {
      e.preventDefault();
      resetActiveSidebarItem(sideNavThreats);
      
      commandHeaderTitle.textContent = "Watchlist Threat Matrix";
      commandHeaderSub.textContent = "Identity match logs flagged against state and national watchlists";
      
      // Filter list specifically for Watchlist
      searchQuery = 'watchlist';
      dashboardSearch.value = 'Watchlist Match';
      switchTab('checkins');
      
      document.querySelector('.table-container').scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (sideNavSos) {
    sideNavSos.addEventListener('click', (e) => {
      e.preventDefault();
      resetActiveSidebarItem(sideNavSos);
      
      commandHeaderTitle.textContent = "SOS Incident dispatch center";
      commandHeaderSub.textContent = "Emergency panic triggers requiring immediate command patrol deployment";
      
      searchQuery = 'sos';
      renderAlertTicker();
      document.querySelector('.right-rail').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // --- Initial Renderings ---
  updateKPIs();
  initMap();
  renderDistrictList();
  renderTable();
  renderAlertTicker();
  renderIncidents();
});
