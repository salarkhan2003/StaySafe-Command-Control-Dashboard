import { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Building, 
  Users, 
  AlertTriangle, 
  Activity, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Sun, 
  Moon, 
  TrendingUp, 
  Sliders, 
  Lock,
  Eye,
  Check,
  AlertCircle
} from 'lucide-react';
import { INITIAL_MOCK_DATA, Incident } from './data';

export default function App() {
  // --- STATE ---
  const [data, setData] = useState(INITIAL_MOCK_DATA);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'properties' | 'guests' | 'threats' | 'sos' | 'compliance' | 'analytics'>('dashboard');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'occupancy' | 'alerts'>('occupancy');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedItem, setSelectedItem] = useState<{ type: 'guest' | 'property'; item: any } | null>(null);
  const [activeTableTab, setActiveTableTab] = useState<'checkins' | 'properties' | 'audit'>('checkins');

  // Map reference
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  // --- DISTRICT COORDINATES ---
  const DISTRICT_COORDS: Record<string, { lat: number; lng: number; name: string }> = {
    'AP-VJA': { lat: 16.5062, lng: 80.6480, name: 'Vijayawada' },
    'AP-VSKP': { lat: 17.6868, lng: 83.2185, name: 'Visakhapatnam' },
    'AP-GNT': { lat: 16.3067, lng: 80.4365, name: 'Guntur' },
    'AP-TPT': { lat: 13.6288, lng: 79.4192, name: 'Tirupati' },
    'AP-KRN': { lat: 15.8281, lng: 78.0373, name: 'Kurnool' },
    'AP-ANTP': { lat: 14.6819, lng: 77.6006, name: 'Anantapuramu' }
  };

  // --- THEME ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- INITIALIZE MAP (Only once on dashboard tab) ---
  useEffect(() => {
    if (currentTab !== 'dashboard') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    // Center map on Andhra Pradesh
    const map = L.map('leafletMap', {
      center: [15.9129, 79.7400],
      zoom: 7,
      zoomControl: true,
      attributionControl: false
    });

    const tileUrl = theme === 'dark' 
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      
    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    const markersLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerRef.current = markersLayer;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentTab, theme]);

  // --- RENDER MAP MARKERS ---
  useEffect(() => {
    if (currentTab !== 'dashboard' || !mapRef.current || !markersLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    data.districts.forEach(district => {
      const coords = DISTRICT_COORDS[district.id];
      if (!coords) return;

      const isSelected = selectedDistrictId === district.id;
      let color = '#4f6ef7'; // Accent Blue
      
      if (district.activeSos > 0) {
        color = '#ef4444'; // Red alarm
      } else if (district.watchlistMatches > 0) {
        color = '#f59e0b'; // Warning Orange
      } else if (mapMode === 'occupancy') {
        color = district.occupancy > 75 ? '#ef4444' : (district.occupancy > 55 ? '#f59e0b' : '#10b981');
      }

      let radiusValue = 20000;
      if (mapMode === 'occupancy') {
        radiusValue += district.occupancy * 120;
      } else {
        radiusValue += (district.activeSos * 8000) + (district.watchlistMatches * 4000);
      }

      const circle = L.circle([coords.lat, coords.lng], {
        color: color,
        fillColor: color,
        fillOpacity: isSelected ? 0.6 : 0.35,
        weight: isSelected ? 3.5 : 1.5,
        radius: radiusValue
      });

      const popupHtml = `
        <div style="font-family: 'Outfit', sans-serif; color: #0f172a; padding: 4px; min-width: 160px;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: ${color};">${district.name}</h4>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Occupancy:</strong> ${district.occupancy}%</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Verified Places:</strong> ${district.PGs + district.hotels}</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Active SOS:</strong> ${district.activeSos} Alarms</div>
          <div style="font-size: 11px;"><strong>Watchlist Match:</strong> ${district.watchlistMatches} Flagged</div>
        </div>
      `;
      circle.bindTooltip(popupHtml, { permanent: false, direction: 'top' });

      circle.on('click', () => {
        if (selectedDistrictId === district.id) {
          setSelectedDistrictId(null);
          mapRef.current.setView([15.9129, 79.7400], 7);
        } else {
          setSelectedDistrictId(district.id);
          mapRef.current.setView([coords.lat, coords.lng], 9);
        }
      });

      markersLayer.addLayer(circle);
    });
  }, [currentTab, data, selectedDistrictId, mapMode]);

  // --- ACTIONS CONTROLLERS ---
  const handleVerifyGuest = (id: string) => {
    setData(prev => {
      const updatedCheckins = prev.liveCheckins.map(c => {
        if (c.id === id) {
          return { ...c, status: 'Cleared' as const, watchlistMatch: false, watchlistReason: '' };
        }
        return c;
      });

      // Recalculate district match counts
      const matched = updatedCheckins.find(c => c.id === id);
      const updatedDistricts = prev.districts.map(d => {
        if (matched && matched.propertyName.includes(d.name.replace(' Urban', '').replace(' City', '').replace(' District', ''))) {
          return { ...d, watchlistMatches: Math.max(0, d.watchlistMatches - 1) };
        }
        return d;
      });

      return {
        ...prev,
        liveCheckins: updatedCheckins,
        districts: updatedDistricts,
        alerts: prev.alerts.filter(a => !(a.propertyId === matched?.propertyName && a.type === 'watchlist'))
      };
    });

    if (selectedItem?.type === 'guest' && selectedItem.item.id === id) {
      setSelectedItem(prev => prev ? { ...prev, item: { ...prev.item, status: 'Cleared', watchlistMatch: false, watchlistReason: '' } } : null);
    }
  };

  const handleEscalateGuest = (id: string) => {
    const target = data.liveCheckins.find(c => c.id === id);
    if (!target) return;

    const newIncident: Incident = {
      id: `INC-2026-${Math.floor(10 + Math.random() * 90)}`,
      propertyName: target.propertyName,
      district: target.propertyName.includes('Vijayawada') ? 'NTR Vijayawada' : 'Visakhapatnam City',
      type: 'Escalated Threat Review',
      reportedAt: new Date().toISOString(),
      assignedOfficer: 'Inspector SB Intelligence (HQ)',
      status: 'Under Investigation',
      details: `Watchlist match escalated by Command room. Verification profile is suspended. ID details: ${target.idType} (${target.idNumber}).`
    };

    setData(prev => ({
      ...prev,
      incidents: [newIncident, ...prev.incidents],
      liveCheckins: prev.liveCheckins.map(c => c.id === id ? { ...c, status: 'Escalated' as const } : c)
    }));

    if (selectedItem?.type === 'guest' && selectedItem.item.id === id) {
      setSelectedItem(prev => prev ? { ...prev, item: { ...prev.item, status: 'Escalated' } } : null);
    }
  };

  const handleFlagGuest = (id: string) => {
    setData(prev => ({
      ...prev,
      liveCheckins: prev.liveCheckins.map(c => c.id === id ? { ...c, status: 'Flagged' as const } : c)
    }));

    if (selectedItem?.type === 'guest' && selectedItem.item.id === id) {
      setSelectedItem(prev => prev ? { ...prev, item: { ...prev.item, status: 'Flagged' } } : null);
    }
  };

  const handleVerifyProperty = (id: string) => {
    setData(prev => ({
      ...prev,
      properties: prev.properties.map(p => p.id === id ? { ...p, status: 'verified' as const, complianceScore: Math.max(90, p.complianceScore) } : p)
    }));

    if (selectedItem?.type === 'property' && selectedItem.item.id === id) {
      setSelectedItem(prev => prev ? { ...prev, item: { ...prev.item, status: 'verified', complianceScore: 95 } } : null);
    }
  };

  const handleFlagProperty = (id: string) => {
    setData(prev => ({
      ...prev,
      properties: prev.properties.map(p => p.id === id ? { ...p, status: 'flagged' as const, complianceScore: Math.min(48, p.complianceScore) } : p)
    }));

    if (selectedItem?.type === 'property' && selectedItem.item.id === id) {
      setSelectedItem(prev => prev ? { ...prev, item: { ...prev.item, status: 'flagged', complianceScore: 48 } } : null);
    }
  };

  const handleSuspendProperty = (id: string) => {
    setData(prev => ({
      ...prev,
      properties: prev.properties.map(p => p.id === id ? { ...p, status: 'suspended' as const } : p)
    }));

    if (selectedItem?.type === 'property' && selectedItem.item.id === id) {
      setSelectedItem(prev => prev ? { ...prev, item: { ...prev.item, status: 'suspended' } } : null);
    }
  };

  const handleForceAudit = (id: string) => {
    setData(prev => ({
      ...prev,
      properties: prev.properties.map(p => p.id === id ? { 
        ...p, 
        lastAudit: new Date().toISOString().split('T')[0],
        complianceScore: Math.min(100, p.complianceScore + 6),
        cctvWorking: true 
      } : p)
    }));
    alert("Triggered automated live camera audit check. CCTV connection restablished. Safety score updated.");
  };

  const handleResolveIncident = (id: string) => {
    setData(prev => {
      const incident = prev.incidents.find(i => i.id === id);
      const isSos = incident?.type.includes('SOS');
      
      const updatedIncidents = prev.incidents.map(inc => {
        if (inc.id === id) {
          return { ...inc, status: 'Resolved' as const, details: 'Incident resolved. Ground patrol report completed.' };
        }
        return inc;
      });

      // If resolving SOS incident, decrease active SOS counter for district
      let updatedDistricts = prev.districts;
      if (isSos && incident) {
        updatedDistricts = prev.districts.map(d => {
          if (incident.propertyName.includes(d.name.replace(' Urban', '').replace(' City', '').replace(' District', ''))) {
            return { ...d, activeSos: Math.max(0, d.activeSos - 1) };
          }
          return d;
        });
      }

      return {
        ...prev,
        incidents: updatedIncidents,
        districts: updatedDistricts,
        alerts: prev.alerts.filter(a => !(a.propertyId === incident?.propertyName && a.type === 'sos'))
      };
    });
  };

  const handleReassignOfficer = (id: string) => {
    const newOfficer = prompt("Enter Inspector Name/ID to dispatch:");
    if (!newOfficer) return;

    setData(prev => ({
      ...prev,
      incidents: prev.incidents.map(inc => inc.id === id ? { ...inc, assignedOfficer: newOfficer } : inc)
    }));
  };

  // --- FILTERS & SEARCH RUNNERS ---
  const activeDistrictName = selectedDistrictId 
    ? data.districts.find(d => d.id === selectedDistrictId)?.name 
    : null;

  const normalizeDistrictSub = (name: string) => 
    name.replace(' Urban', '').replace(' City', '').replace(' District', '').replace(' NTR ', '');

  const filterBySelectedDistrict = (itemDistrict: string) => {
    if (!activeDistrictName) return true;
    const cleanActive = normalizeDistrictSub(activeDistrictName);
    const cleanItem = normalizeDistrictSub(itemDistrict);
    return cleanItem.includes(cleanActive) || cleanActive.includes(cleanItem);
  };

  const searchFilter = (fields: string[]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return fields.some(f => f?.toLowerCase().includes(query));
  };

  // Live Alerts Count
  const activeSosCount = data.incidents.filter(i => i.status === 'Dispatch Active').length;

  return (
    <div className="app-container">
      
      {/* ─── SIDEBAR NAVIGATION ─── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Shield size={20} strokeWidth={2.5} />
          </div>
          <div className="sidebar-brand-text">
            <h2>SafeStay AP</h2>
            <p>Police Intelligence</p>
          </div>
        </div>

        <div>
          <div className="menu-group">
            <div className="menu-title">Operations</div>
            <div 
              className={`menu-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('dashboard'); setSelectedItem(null); }}
            >
              <Activity size={18} />
              <span>Command Center</span>
            </div>
            <div 
              className={`menu-item ${currentTab === 'properties' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('properties'); setSelectedItem(null); }}
            >
              <Building size={18} />
              <span>PGs & Hotels</span>
            </div>
            <div 
              className={`menu-item ${currentTab === 'guests' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('guests'); setSelectedItem(null); }}
            >
              <Users size={18} />
              <span>Live Occupants</span>
            </div>
          </div>

          <div className="menu-group">
            <div className="menu-title">Threat Matrix</div>
            <div 
              className={`menu-item ${currentTab === 'threats' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('threats'); setSelectedItem(null); }}
            >
              <AlertTriangle size={18} />
              <span>Watchlist Hits</span>
            </div>
            <div 
              className={`menu-item ${currentTab === 'sos' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('sos'); setSelectedItem(null); }}
            >
              <FileText size={18} />
              <span>SOS Alarms Center</span>
            </div>
            <div 
              className={`menu-item ${currentTab === 'compliance' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('compliance'); setSelectedItem(null); }}
            >
              <Sliders size={18} />
              <span>Compliance Audits</span>
            </div>
          </div>

          <div className="menu-group">
            <div className="menu-title">Analytics</div>
            <div 
              className={`menu-item ${currentTab === 'analytics' ? 'active' : ''}`}
              onClick={() => { setCurrentTab('analytics'); setSelectedItem(null); }}
            >
              <TrendingUp size={18} />
              <span>Analytics Hub</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <img 
              src="https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?w=80&q=80" 
              alt="Officer Avatar" 
              className="user-avatar" 
            />
            <div className="user-info">
              <h4>AP Police</h4>
              <p>State Intel</p>
            </div>
          </div>
          <div 
            className="theme-switch" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title="Toggle Visual Theme"
          >
            <div className="theme-switch-thumb">
              {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN WORKSPACE ─── */}
      <main className="main-workspace">
        
        {/* HEADER */}
        <header className="top-nav">
          <div className="dashboard-title">
            <h1>
              {currentTab === 'dashboard' && 'Command Center Dashboard'}
              {currentTab === 'properties' && 'Properties Registry'}
              {currentTab === 'guests' && 'Live Occupant manifest'}
              {currentTab === 'threats' && 'Watchlist Screening Hits'}
              {currentTab === 'sos' && 'SOS & Silent Alarm Center'}
              {currentTab === 'compliance' && 'Safety & CCTV Audit Console'}
              {currentTab === 'analytics' && 'Hospitality Intelligence Analytics'}
            </h1>
            <p>
              {currentTab === 'dashboard' && 'Real-time district hospitality intelligence & safety monitoring'}
              {currentTab === 'properties' && 'Audit status and safety registries of paying guest hostels and hotels'}
              {currentTab === 'guests' && 'Active database list of checked-in occupants and KYC verification states'}
              {currentTab === 'threats' && 'Matches flagged by Automated AP Police Criminal Database Checks'}
              {currentTab === 'sos' && 'Active location dispatches, alarm reports, and response tracking'}
              {currentTab === 'compliance' && 'Manage CCTV connectivity, fire safety permits, and license scores'}
              {currentTab === 'analytics' && 'Visualizations of safety score trends, district densities, and alerts'}
            </p>
          </div>

          <div className="header-controls">
            <div className="control-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search database..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {activeSosCount > 0 && (
              <button className="btn-pulse" onClick={() => setCurrentTab('sos')}>
                <span className="pulse-dot"></span>
                <span>{activeSosCount} ACTIVE SOS DISPATCHES</span>
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE CONTENTS */}
        <div className="dashboard-content">
          
          {/* TAB 1: COMMAND CENTER (MAIN DASHBOARD) */}
          {currentTab === 'dashboard' && (
            <div className="dashboard-center">
              
              {/* KPIs */}
              <div className="kpi-row">
                <div className="kpi-card primary">
                  <div className="kpi-header">
                    <span>Verified Properties</span>
                    <div className="kpi-icon"><Building size={16} /></div>
                  </div>
                  <div className="kpi-value">{data.properties.length + 672}</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={12} />
                    <span>+18 audited this week</span>
                  </div>
                </div>

                <div className="kpi-card success">
                  <div className="kpi-header">
                    <span>Active Occupants</span>
                    <div className="kpi-icon"><Users size={16} /></div>
                  </div>
                  <div className="kpi-value">{data.liveCheckins.length + 8970}</div>
                  <div className="kpi-trend up">
                    <TrendingUp size={12} />
                    <span>+242 checked-in today</span>
                  </div>
                </div>

                <div className="kpi-card danger">
                  <div className="kpi-header">
                    <span>Active Threat Matches</span>
                    <div className="kpi-icon"><AlertTriangle size={16} /></div>
                  </div>
                  <div className="kpi-value">{data.liveCheckins.filter(c => c.watchlistMatch).length}</div>
                  <div className="kpi-trend down">
                    <AlertCircle size={12} />
                    <span>Watchlist alerts pending review</span>
                  </div>
                </div>
              </div>

              {/* MAP MATRIX */}
              <div className="mission-control-panel">
                <div className="panel-header">
                  <h3>Geospatial District Intelligence</h3>
                  <div className="panel-controls">
                    <button 
                      className={`filter-chip ${mapMode === 'occupancy' ? 'active' : ''}`}
                      onClick={() => setMapMode('occupancy')}
                    >
                      Occupancy Density
                    </button>
                    <button 
                      className={`filter-chip ${mapMode === 'alerts' ? 'active' : ''}`}
                      onClick={() => setMapMode('alerts')}
                    >
                      Threat Heatmap
                    </button>
                  </div>
                </div>

                <div className="map-layout">
                  <div className="map-container">
                    <div id="leafletMap"></div>
                  </div>

                  <div className="district-list-rail">
                    {data.districts.map(d => {
                      const isSelected = selectedDistrictId === d.id;
                      let badgeBg = 'var(--success-glow)';
                      let badgeText = 'var(--success)';
                      let statusLabel = 'Clear';
                      
                      if (d.activeSos > 0) {
                        badgeBg = 'var(--danger-glow)';
                        badgeText = 'var(--danger)';
                        statusLabel = `${d.activeSos} SOS Alarms`;
                      } else if (d.watchlistMatches > 0) {
                        badgeBg = 'var(--warning-glow)';
                        badgeText = 'var(--warning)';
                        statusLabel = `${d.watchlistMatches} Threat Flags`;
                      }

                      return (
                        <div 
                          key={d.id}
                          className={`district-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedDistrictId(isSelected ? null : d.id)}
                        >
                          <div className="district-info">
                            <h4>{d.name}</h4>
                            <p>{d.PGs + d.hotels} Lodgings</p>
                          </div>
                          <div className="district-stat">
                            <span className="district-occupancy">{d.occupancy}% occupancy</span>
                            <span className="district-badge" style={{ backgroundColor: badgeBg, color: badgeText }}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* QUICK TABLES CONTAINER */}
              <div className="table-container">
                <div className="tabs-header">
                  <button 
                    className={`tab-btn ${activeTableTab === 'checkins' ? 'active' : ''}`}
                    onClick={() => setActiveTableTab('checkins')}
                  >
                    Live Check-in Registry
                  </button>
                  <button 
                    className={`tab-btn ${activeTableTab === 'properties' ? 'active' : ''}`}
                    onClick={() => setActiveTableTab('properties')}
                  >
                    Properties List
                  </button>
                  <button 
                    className={`tab-btn ${activeTableTab === 'audit' ? 'active' : ''}`}
                    onClick={() => setActiveTableTab('audit')}
                  >
                    Compliance Registry
                  </button>
                </div>

                <div className="table-wrapper">
                  {activeTableTab === 'checkins' && (
                    <table>
                      <thead>
                        <tr>
                          <th>Guest Name</th>
                          <th>Identity Code</th>
                          <th>Nationality</th>
                          <th>PG / Property</th>
                          <th>Check-in Time</th>
                          <th>Verification Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.liveCheckins
                          .filter(c => filterBySelectedDistrict(c.propertyName))
                          .filter(c => searchFilter([c.guestName, c.idNumber, c.propertyName]))
                          .map(guest => (
                            <tr 
                              key={guest.id} 
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedItem({ type: 'guest', item: guest })}
                            >
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <img src={guest.photo} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                  <strong>{guest.guestName}</strong>
                                </div>
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{guest.idType}: {guest.idNumber}</td>
                              <td>{guest.nationality}</td>
                              <td>{guest.propertyName} <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Room {guest.roomNumber}</div></td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{new Date(guest.checkinTime).toLocaleTimeString()}</td>
                              <td>
                                <span className={`status-indicator ${guest.status}`}>
                                  {guest.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}

                  {activeTableTab === 'properties' && (
                    <table>
                      <thead>
                        <tr>
                          <th>Property Name</th>
                          <th>Type</th>
                          <th>Address</th>
                          <th>Occupancy</th>
                          <th>Compliance Score</th>
                          <th>Permit Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.properties
                          .filter(p => filterBySelectedDistrict(p.district))
                          .filter(p => searchFilter([p.name, p.ownerName, p.address]))
                          .map(prop => (
                            <tr 
                              key={prop.id} 
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedItem({ type: 'property', item: prop })}
                            >
                              <td><strong>{prop.name}</strong></td>
                              <td><span style={{ fontWeight: 'bold', fontSize: '10px' }}>{prop.type}</span></td>
                              <td>{prop.address}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{prop.occupiedRooms}/{prop.totalRooms} rooms</td>
                              <td>
                                <span className={`score-badge ${prop.complianceScore > 85 ? 'high' : (prop.complianceScore > 50 ? 'mid' : 'low')}`}>
                                  {prop.complianceScore}%
                                </span>
                              </td>
                              <td>
                                <span className={`status-indicator ${prop.status}`}>
                                  {prop.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}

                  {activeTableTab === 'audit' && (
                    <table>
                      <thead>
                        <tr>
                          <th>Hostel Facility</th>
                          <th>CCTV Security</th>
                          <th>Fire Safety License</th>
                          <th>Guard Security details</th>
                          <th>Last Audited</th>
                          <th>Quick Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.properties
                          .filter(p => filterBySelectedDistrict(p.district))
                          .filter(p => searchFilter([p.name]))
                          .map(prop => (
                            <tr key={prop.id}>
                              <td><strong>{prop.name}</strong></td>
                              <td>
                                <span style={{ color: prop.cctvWorking ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                                  {prop.cctvWorking ? '✓ Online' : '✗ Offline'}
                                </span>
                              </td>
                              <td>
                                <span style={{ color: prop.fireSafety ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                                  {prop.fireSafety ? '✓ Certified' : '✗ Expired/None'}
                                </span>
                              </td>
                              <td>{prop.guardDetails}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{prop.lastAudit}</td>
                              <td>
                                <button className="btn-action-small" onClick={() => handleForceAudit(prop.id)}>
                                  Trigger Audit Check
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PROPERTIES VIEW */}
          {currentTab === 'properties' && (
            <div className="dashboard-center">
              <div className="table-container">
                <div className="panel-header">
                  <h3>All Registered Hospitality Accommodations</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Total: {data.properties.length} Active Records
                  </span>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Accommodation Name</th>
                        <th>Type</th>
                        <th>District / Location</th>
                        <th>Owner / Phone</th>
                        <th>Occupancy Level</th>
                        <th>Safety Score</th>
                        <th>Status</th>
                        <th>Audit Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.properties
                        .filter(p => searchFilter([p.name, p.ownerName, p.district]))
                        .map(prop => (
                          <tr 
                            key={prop.id} 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedItem({ type: 'property', item: prop })}
                          >
                            <td><strong>{prop.name}</strong></td>
                            <td><span style={{ fontSize: '10px', fontWeight: 'bold' }}>{prop.type}</span></td>
                            <td>{prop.address} <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{prop.district}</div></td>
                            <td>{prop.ownerName} <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{prop.ownerPhone}</div></td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{prop.occupiedRooms}/{prop.totalRooms} rooms</td>
                            <td>
                              <span className={`score-badge ${prop.complianceScore > 85 ? 'high' : (prop.complianceScore > 50 ? 'mid' : 'low')}`}>
                                {prop.complianceScore}%
                              </span>
                            </td>
                            <td>
                              <span className={`status-indicator ${prop.status}`}>
                                {prop.status}
                              </span>
                            </td>
                            <td onClick={e => e.stopPropagation()}>
                              <button className="btn-action-small" onClick={() => handleForceAudit(prop.id)}>
                                Force Audit
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE GUESTS MANIFEST */}
          {currentTab === 'guests' && (
            <div className="dashboard-center">
              <div className="table-container">
                <div className="panel-header">
                  <h3>Active Occupant manifest registers</h3>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Occupant Details</th>
                        <th>Contact Phone</th>
                        <th>ID Credentials</th>
                        <th>Property Stay Location</th>
                        <th>Nationality</th>
                        <th>Check-in Timestamp</th>
                        <th>Watchlist status</th>
                        <th>Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.liveCheckins
                        .filter(c => searchFilter([c.guestName, c.idNumber, c.propertyName]))
                        .map(guest => (
                          <tr 
                            key={guest.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelectedItem({ type: 'guest', item: guest })}
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img src={guest.photo} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                <div>
                                  <strong>{guest.guestName}</strong>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Age {guest.age}</div>
                                </div>
                              </div>
                            </td>
                            <td>{guest.phone}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{guest.idType}: {guest.idNumber}</td>
                            <td>
                              {guest.propertyName}
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Room {guest.roomNumber}</div>
                            </td>
                            <td>{guest.nationality}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{new Date(guest.checkinTime).toLocaleString()}</td>
                            <td>
                              <span className={`status-indicator ${guest.status}`}>
                                {guest.status}
                              </span>
                            </td>
                            <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn-action-small primary" onClick={() => handleVerifyGuest(guest.id)}>Verify</button>
                              <button className="btn-action-small" style={{ backgroundColor: 'var(--warning-glow)', color: 'var(--warning)', borderColor: 'var(--warning)' }} onClick={() => handleEscalateGuest(guest.id)}>Escalate</button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WATCHLIST HITS */}
          {currentTab === 'threats' && (
            <div className="dashboard-center">
              <div className="table-container" style={{ borderLeft: '4px solid var(--danger)' }}>
                <div className="panel-header">
                  <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} />
                    Watchlist Hit Alert Matches
                  </h3>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', fontWeight: 'bold' }}>
                    CRITICAL ALARMS
                  </span>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Suspect Profile</th>
                        <th>ID Credentials Checked</th>
                        <th>Stay Property details</th>
                        <th>Risk Categorization</th>
                        <th>Watchlist Match Note</th>
                        <th>Review State</th>
                        <th>Emergency Command Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.liveCheckins
                        .filter(c => c.watchlistMatch || c.status === 'Watchlist Match' || c.status === 'Escalated')
                        .map(guest => (
                          <tr key={guest.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem({ type: 'guest', item: guest })}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img src={guest.photo} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--danger)' }} alt="" />
                                <div>
                                  <strong>{guest.guestName}</strong>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Age {guest.age} • {guest.nationality}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{guest.idType}: {guest.idNumber}</td>
                            <td>{guest.propertyName} <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Room {guest.roomNumber}</div></td>
                            <td>
                              <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AlertCircle size={12} /> High Alert
                              </span>
                            </td>
                            <td style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{guest.watchlistReason || 'Flagged name matched crime databases'}</td>
                            <td>
                              <span className={`status-indicator ${guest.status}`}>
                                {guest.status}
                              </span>
                            </td>
                            <td onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '8px' }}>
                              <button className="btn-action-small primary" style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => handleVerifyGuest(guest.id)}>
                                De-escalate & Clear
                              </button>
                              <button className="btn-action-small" style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }} onClick={() => handleFlagGuest(guest.id)}>
                                Lock & Suspend
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SOS DISPATCHES */}
          {currentTab === 'sos' && (
            <div className="dashboard-center">
              <div className="table-container" style={{ borderTop: '4px solid var(--danger)' }}>
                <div className="panel-header">
                  <h3 style={{ color: 'var(--danger)' }}>Active SOS Dispatches & Incident Logs</h3>
                  <button className="btn-pulse">
                    <span>{data.incidents.filter(i => i.status === 'Dispatch Active').length} DISPATCHES ACTIVE</span>
                  </button>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Incident Case ID</th>
                        <th>Hostel Facility</th>
                        <th>Alarm Categorization</th>
                        <th>Trigger Timestamp</th>
                        <th>Assigned Patrol Officer</th>
                        <th>Ground Status</th>
                        <th>Control room Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.incidents.map(inc => (
                        <tr key={inc.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{inc.id}</td>
                          <td>
                            <strong>{inc.propertyName}</strong>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{inc.district}</div>
                          </td>
                          <td>
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={12} /> {inc.type}
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{new Date(inc.reportedAt).toLocaleString()}</td>
                          <td><strong>{inc.assignedOfficer}</strong></td>
                          <td>
                            <span className={`status-indicator ${inc.status === 'Dispatch Active' ? 'flagged' : (inc.status === 'Resolved' ? 'verified' : 'pending')}`}>
                              {inc.status}
                            </span>
                          </td>
                          <td style={{ display: 'flex', gap: '8px' }}>
                            {inc.status !== 'Resolved' && (
                              <>
                                <button className="btn-action-small primary" onClick={() => handleResolveIncident(inc.id)}>
                                  Resolve Case
                                </button>
                                <button className="btn-action-small" style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} onClick={() => handleReassignOfficer(inc.id)}>
                                  Reassign
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: COMPLIANCE AUDITS */}
          {currentTab === 'compliance' && (
            <div className="dashboard-center">
              <div className="compliance-grid">
                
                {data.properties.map(prop => {
                  let complianceLabel = 'High Compliance';
                  let scoreColor = 'var(--success)';
                  
                  if (prop.complianceScore < 50) {
                    complianceLabel = 'Non-compliant (Under Review)';
                    scoreColor = 'var(--danger)';
                  } else if (prop.complianceScore < 85) {
                    complianceLabel = 'Moderate Compliance';
                    scoreColor = 'var(--warning)';
                  }

                  return (
                    <div key={prop.id} className="compliance-card" style={{ borderLeft: `4px solid ${scoreColor}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4>{prop.name}</h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{prop.address}</p>
                          <span style={{ display: 'inline-block', fontSize: '10px', fontWeight: 'bold', color: scoreColor, marginTop: '4px' }}>
                            {complianceLabel}
                          </span>
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: '800', color: scoreColor }}>
                          {prop.complianceScore}%
                        </span>
                      </div>

                      <div className="compliance-status-row" style={{ marginTop: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                        <span>CCTV Feed Online:</span>
                        <strong style={{ color: prop.cctvWorking ? 'var(--success)' : 'var(--danger)' }}>
                          {prop.cctvWorking ? '✓ Online' : '✗ Offline'}
                        </strong>
                      </div>

                      <div className="compliance-status-row">
                        <span>Fire Safety Clearance:</span>
                        <strong style={{ color: prop.fireSafety ? 'var(--success)' : 'var(--danger)' }}>
                          {prop.fireSafety ? '✓ Verified' : '✗ Expired'}
                        </strong>
                      </div>

                      <div className="compliance-status-row">
                        <span>Security Personnel details:</span>
                        <span>{prop.guardDetails}</span>
                      </div>

                      <div className="compliance-status-row" style={{ marginBottom: '8px' }}>
                        <span>Last compliance Audit:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>{prop.lastAudit}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                        <button className="btn-action-small primary" style={{ flex: 1 }} onClick={() => handleForceAudit(prop.id)}>
                          Re-run Audit Check
                        </button>
                        <button className="btn-action-small" style={{ flex: 1, backgroundColor: 'var(--danger-glow)', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleFlagProperty(prop.id)}>
                          Flag Listing
                        </button>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          )}

          {/* TAB 7: ANALYTICS HUB */}
          {currentTab === 'analytics' && (
            <div className="dashboard-center">
              
              <div className="analytics-grid">
                
                {/* Custom SVG Bar Graph: District Occupancy */}
                <div className="graph-card">
                  <h3>District Occupancy Density comparison</h3>
                  <div className="graph-canvas-container" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 40px' }}>
                    {data.districts.map(d => (
                      <div key={d.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '10px' }}>
                        <div style={{ position: 'relative', width: '32px', height: '180px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            left: 0, 
                            width: '100%', 
                            height: `${d.occupancy}%`, 
                            background: d.occupancy > 78 ? 'linear-gradient(to top, var(--danger), #f87171)' : 'linear-gradient(to top, var(--accent), var(--info))',
                            borderRadius: '4px',
                            transition: 'height 0.8s ease'
                          }}></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{d.id.replace('AP-', '')}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.occupancy}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom SVG Donut Chart: Property Category Breakdown */}
                <div className="graph-card">
                  <h3>Accommodations Types</h3>
                  <div className="graph-canvas-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                    <svg width="120" height="120" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border-subtle)" strokeWidth="4"></circle>
                      
                      {/* Segment 1: PGs (60%) */}
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--accent)" strokeWidth="4.5" strokeDasharray="60 40" strokeDashoffset="25"></circle>
                      
                      {/* Segment 2: Hotels (30%) */}
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--success)" strokeWidth="4.5" strokeDasharray="30 70" strokeDashoffset="65"></circle>
                      
                      {/* Segment 3: Guesthouses (10%) */}
                      <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--warning)" strokeWidth="4.5" strokeDasharray="10 90" strokeDashoffset="95"></circle>
                    </svg>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', padding: '0 10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--accent)', borderRadius: '50%' }}></span> PG Hostels</span>
                        <strong>60%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--success)', borderRadius: '50%' }}></span> Hotels</span>
                        <strong>30%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ display: 'inline-block', width: '8px', height: '8px', backgroundColor: 'var(--warning)', borderRadius: '50%' }}></span> Guesthouses</span>
                        <strong>10%</strong>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Custom SVG Line Chart: Safety Score Metrics */}
              <div className="graph-card" style={{ marginTop: '24px' }}>
                <h3>Average District Safety & Compliance Rating</h3>
                <div style={{ padding: '20px 40px 10px 40px' }}>
                  <svg viewBox="0 0 500 120" style={{ width: '100%', height: '120px' }}>
                    <path 
                      d="M 20 80 Q 100 40 180 60 T 340 20 T 480 30" 
                      fill="none" 
                      stroke="var(--info)" 
                      strokeWidth="3.5"
                    />
                    
                    {/* Data Points */}
                    <circle cx="20" cy="80" r="4.5" fill="var(--bg-primary)" stroke="var(--info)" strokeWidth="2" />
                    <circle cx="120" cy="45" r="4.5" fill="var(--bg-primary)" stroke="var(--info)" strokeWidth="2" />
                    <circle cx="220" cy="55" r="4.5" fill="var(--bg-primary)" stroke="var(--info)" strokeWidth="2" />
                    <circle cx="320" cy="22" r="4.5" fill="var(--bg-primary)" stroke="var(--info)" strokeWidth="2" />
                    <circle cx="420" cy="28" r="4.5" fill="var(--bg-primary)" stroke="var(--info)" strokeWidth="2" />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <span>NTR Vijayawada</span>
                    <span>Visakhapatnam</span>
                    <span>Guntur</span>
                    <span>Tirupati</span>
                    <span>Kurnool</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ─── RIGHT RAIL (LIVE LOG STREAM) ─── */}
          <aside className="right-rail">
            
            {/* Intel Ticker */}
            <section className="panel-alert-stream">
              <div className="alert-stream-header">
                <h3>Live Intel Feed</h3>
                <span className="pulse-dot"></span>
              </div>
              <div className="alert-ticker">
                {data.alerts.map(a => (
                  <div 
                    key={a.id} 
                    className={`alert-card ${a.severity}`}
                    onClick={() => {
                      const prop = data.properties.find(p => p.id === a.propertyId);
                      if (prop) setSelectedItem({ type: 'property', item: prop });
                    }}
                  >
                    <div className="alert-icon-wrapper">
                      {a.type === 'sos' && <AlertCircle size={14} />}
                      {a.type === 'watchlist' && <Lock size={14} />}
                      {a.type === 'compliance' && <Sliders size={14} />}
                      {a.type === 'foreign' && <Eye size={14} />}
                    </div>
                    <div className="alert-body">
                      <h4>{a.type} alert</h4>
                      <p>{a.message}</p>
                      <div className="alert-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Incidents Dispatch */}
            <section className="incident-panel">
              <h3>Incidents Response Queue</h3>
              <div className="incident-list">
                {data.incidents.slice(0, 3).map(inc => (
                  <div key={inc.id} className={`incident-card ${inc.status === 'Dispatch Active' ? 'active' : ''}`}>
                    <div className="incident-head">
                      <h4>{inc.type}</h4>
                      <span className={`incident-badge ${inc.status === 'Dispatch Active' ? 'dispatch' : (inc.status === 'Resolved' ? 'resolved' : 'investigation')}`}>
                        {inc.status}
                      </span>
                    </div>
                    <p className="incident-desc">{inc.details}</p>
                    <div className="incident-meta">
                      <span>{inc.propertyName}</span>
                      <span>{inc.assignedOfficer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>

        </div>
      </main>

      {/* ─── EXPANDABLE GUEST / PROPERTY DETAILS DRAWER ─── */}
      <div className={`drawer ${selectedItem ? 'open' : ''}`}>
        {selectedItem && (
          <>
            <div className="drawer-close" onClick={() => setSelectedItem(null)}>
              <XCircle size={18} />
            </div>

            <div className="drawer-body">
              
              {/* If Drawer represents GUEST details */}
              {selectedItem.type === 'guest' && (
                <>
                  <div className="drawer-header">
                    <img 
                      src={selectedItem.item.photo} 
                      alt={selectedItem.item.guestName} 
                      className="drawer-photo" 
                    />
                    <div className="drawer-title-desc">
                      <h3>{selectedItem.item.guestName}</h3>
                      <p>{selectedItem.item.nationality} National • Age {selectedItem.item.age}</p>
                    </div>
                  </div>

                  <div>
                    <div className="drawer-section-title">Check-in Registry Info</div>
                    <div className="info-grid">
                      <div className="info-item">
                        <h5>Stay Facility</h5>
                        <p>{selectedItem.item.propertyName}</p>
                      </div>
                      <div className="info-item">
                        <h5>Assigned Room</h5>
                        <p>Room {selectedItem.item.roomNumber}</p>
                      </div>
                      <div className="info-item">
                        <h5>Check-in Time</h5>
                        <p>{new Date(selectedItem.item.checkinTime).toLocaleString()}</p>
                      </div>
                      <div className="info-item">
                        <h5>Contact Phone</h5>
                        <p>{selectedItem.item.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="drawer-section-title">Identity Credentials Scanned</div>
                    <div className="info-item" style={{ marginBottom: '12px' }}>
                      <h5>Verified Document</h5>
                      <p>{selectedItem.item.idType} ({selectedItem.item.idNumber})</p>
                    </div>
                    <img 
                      src={selectedItem.item.idImage} 
                      alt="Scanned Document ID" 
                      className="id-doc-preview" 
                    />
                  </div>

                  {selectedItem.item.watchlistMatch && (
                    <div style={{ backgroundColor: 'var(--danger-glow)', border: '1px solid var(--danger)', padding: '16px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: '700', fontSize: '13px', marginBottom: '6px' }}>
                        <AlertTriangle size={16} />
                        Watchlist Threat Flagged
                      </div>
                      <p style={{ fontSize: '11.5px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
                        {selectedItem.item.watchlistReason}
                      </p>
                    </div>
                  )}

                  <div className="drawer-actions">
                    <button className="btn-action-large success" onClick={() => handleVerifyGuest(selectedItem.item.id)}>
                      <CheckCircle2 size={16} /> Clear Profile
                    </button>
                    <button className="btn-action-large warning" onClick={() => handleEscalateGuest(selectedItem.item.id)}>
                      <AlertTriangle size={16} /> Escalate to Control Room
                    </button>
                    <button className="btn-action-large danger" onClick={() => handleFlagGuest(selectedItem.item.id)}>
                      <XCircle size={16} /> Flag and Suspend Occupant
                    </button>
                  </div>
                </>
              )}

              {/* If Drawer represents PROPERTY details */}
              {selectedItem.type === 'property' && (
                <>
                  <div className="drawer-header">
                    <div className="sidebar-logo" style={{ width: '48px', height: '48px', borderRadius: '10px' }}>
                      <Building size={24} />
                    </div>
                    <div className="drawer-title-desc">
                      <h3>{selectedItem.item.name}</h3>
                      <p>{selectedItem.item.type} • {selectedItem.item.district}</p>
                    </div>
                  </div>

                  <div>
                    <div className="drawer-section-title">Ownership Contact Information</div>
                    <div className="info-grid">
                      <div className="info-item">
                        <h5>Owner Name</h5>
                        <p>{selectedItem.item.ownerName}</p>
                      </div>
                      <div className="info-item">
                        <h5>Contact Phone</h5>
                        <p>{selectedItem.item.ownerPhone}</p>
                      </div>
                      <div className="info-item" style={{ gridColumn: 'span 2' }}>
                        <h5>Property Address</h5>
                        <p>{selectedItem.item.address}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="drawer-section-title">Compliance Audit Stats</div>
                    <div className="info-grid">
                      <div className="info-item">
                        <h5>CCTV Status</h5>
                        <p style={{ color: selectedItem.item.cctvWorking ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                          {selectedItem.item.cctvWorking ? '✓ Online' : '✗ Offline'}
                        </p>
                      </div>
                      <div className="info-item">
                        <h5>Fire clearance</h5>
                        <p style={{ color: selectedItem.item.fireSafety ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                          {selectedItem.item.fireSafety ? '✓ Verified' : '✗ Pending'}
                        </p>
                      </div>
                      <div className="info-item">
                        <h5>Guard Security</h5>
                        <p>{selectedItem.item.guardDetails}</p>
                      </div>
                      <div className="info-item">
                        <h5>Last Audit Date</h5>
                        <p style={{ fontFamily: 'var(--font-mono)' }}>{selectedItem.item.lastAudit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="drawer-actions">
                    <button className="btn-action-large success" onClick={() => handleVerifyProperty(selectedItem.item.id)}>
                      <Check size={16} /> Approve Verification License
                    </button>
                    <button className="btn-action-large warning" onClick={() => handleFlagProperty(selectedItem.item.id)}>
                      <AlertTriangle size={16} /> Flag Facility Compliance
                    </button>
                    <button className="btn-action-large danger" onClick={() => handleSuspendProperty(selectedItem.item.id)}>
                      <XCircle size={16} /> Suspend Operation Permit
                    </button>
                  </div>
                </>
              )}

            </div>
          </>
        )}
      </div>

    </div>
  );
}
