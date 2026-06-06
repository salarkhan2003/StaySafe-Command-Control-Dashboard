import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bell,
  Globe,
  Clock,
  Send,
  RefreshCw,
  HelpCircle,
  Video
} from 'lucide-react';
import { INITIAL_MOCK_DATA, Incident, CheckIn } from './data';

export default function App() {
  // --- STATE ---
  const [data, setData] = useState(INITIAL_MOCK_DATA);
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<'occupancy' | 'alerts'>('occupancy');
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedItem, setSelectedItem] = useState<{ type: 'guest' | 'property'; item: any } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  
  // Custom Filter State for Search Console
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterNationality, setFilterNationality] = useState<string>('All');
  const [filterAge, setFilterAge] = useState<number>(65);

  // PG Verification Sub-Tabs
  const [verificationSubTab, setVerificationSubTab] = useState<'pending' | 'verified' | 'approved' | 'declined'>('pending');

  // Interactive Settings states
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoDispatchEnabled, setAutoDispatchEnabled] = useState(false);
  const [dispatchRadius, setDispatchRadius] = useState(5);
  const [syncInterval, setSyncInterval] = useState('30s');
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [facialRecognition, setFacialRecognition] = useState(true);
  const [stationCode, setStationCode] = useState('AP-NTR-VJA-01');
  const [apiKey, setApiKey] = useState('sk_live_safestay_police_8827c1a82f3');

  // --- ABAC ROLE DEFINITIONS ---
  const [officers, setOfficers] = useState([
    { id: 1, name: 'DCP K. Saritha, IPS', rank: 'DCP', district: 'Vijayawada', permissions: ['CCTV Access', 'Verify PG', 'Watchlist Access', 'Approve PG', 'Patrol Dispatch'], shift: '24/7 Unlimited' },
    { id: 2, name: 'SI Ramesh Kumar', rank: 'Sub-Inspector', district: 'NTR Vijayawada', permissions: ['CCTV Access', 'Verify PG'], shift: 'Day Shift (08:00 - 16:00)' },
    { id: 3, name: 'Inspector V. Murthy', rank: 'Inspector', district: 'Guntur City', permissions: ['CCTV Access', 'Patrol Dispatch'], shift: 'Night Shift (16:00 - 00:00)' }
  ]);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [newOfficerRank, setNewOfficerRank] = useState('Sub-Inspector');
  const [newOfficerDistrict, setNewOfficerDistrict] = useState('NTR Vijayawada');
  const [newOfficerPermissions, setNewOfficerPermissions] = useState<string[]>(['CCTV Access']);
  const [newOfficerShift, setNewOfficerShift] = useState('Day Shift (08:00 - 16:00)');

  // ABAC Access Simulator States
  const [simOfficerId, setSimOfficerId] = useState<number>(1);
  const [simResource, setSimResource] = useState<string>('Approve PG');
  const [simResult, setSimResult] = useState<{ allowed: boolean; message: string } | null>(null);

  // Map references
  const mapRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  // --- CUSTOM DIALOGS & ZONE PG SELECTION ---
  const [customDialog, setCustomDialog] = useState<{
    type: 'alert' | 'prompt';
    title: string;
    message?: string;
    defaultValue?: string;
    placeholder?: string;
    onConfirm: (val: string) => void;
  } | null>(null);
  const [dialogInput, setDialogInput] = useState('');
  const [activeZonePropertyId, setActiveZonePropertyId] = useState<string | null>(null);

  const openPrompt = (title: string, defaultValue: string, onConfirm: (val: string) => void) => {
    setDialogInput(defaultValue);
    setCustomDialog({
      type: 'prompt',
      title: title,
      defaultValue: defaultValue,
      onConfirm: onConfirm
    });
  };

  const openAlert = (title: string, message?: string) => {
    setCustomDialog({
      type: 'alert',
      title: title,
      message: message,
      onConfirm: () => {}
    });
  };

  useEffect(() => {
    setActiveZonePropertyId(null);
  }, [selectedDistrictId]);

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

  // --- GLOBAL SHORTCUT FOR COMMAND PALETTE ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus Command Palette input
  useEffect(() => {
    if (showCommandPalette && commandInputRef.current) {
      setTimeout(() => {
        commandInputRef.current?.focus();
      }, 50);
    }
  }, [showCommandPalette]);

  // Render Map Markers Helper
  const renderMarkers = (L: any, map: any, markersLayer: any) => {
    markersLayer.clearLayers();
    data.districts.forEach(district => {
      const coords = DISTRICT_COORDS[district.id];
      if (!coords) return;

      const isSelected = selectedDistrictId === district.id;
      let color = '#3b82f6'; // iOS Blue
      
      if (district.activeSos > 0) {
        color = '#ff3b30'; // iOS Red alarm
      } else if (district.watchlistMatches > 0) {
        color = '#ff9500'; // iOS Warning Orange
      } else if (mapMode === 'occupancy') {
        color = district.occupancy > 75 ? '#ff3b30' : (district.occupancy > 55 ? '#ff9500' : '#34c759');
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
        <div style="font-family: -apple-system, sans-serif; color: #000; padding: 6px; min-width: 170px;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: ${color};">${district.name}</h4>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Occupancy:</strong> ${district.occupancy}%</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Verified Places:</strong> ${district.PGs + district.hotels}</div>
          <div style="font-size: 11px; margin-bottom: 3px;"><strong>Active SOS:</strong> ${district.activeSos} Alarms</div>
          <div style="font-size: 11px;"><strong>Watchlist Match:</strong> ${district.watchlistMatches} Flagged</div>
        </div>
      `;
      circle.bindTooltip(popupHtml, { permanent: false, direction: 'top' });

      circle.on('click', () => {
        setSelectedDistrictId(prev => prev === district.id ? null : district.id);
        map.setView([coords.lat, coords.lng], 9);
      });

      markersLayer.addLayer(circle);
    });
  };

  // --- INITIALIZE MAP (Overview or Live Map tabs) ---
  useEffect(() => {
    if (currentTab !== 'overview' && currentTab !== 'livemap') {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      return;
    }

    const L = (window as any).L;
    if (!L) return;

    const containerId = currentTab === 'overview' ? 'leafletMap' : 'leafletMapFull';
    
    const timer = setTimeout(() => {
      const containerEl = document.getElementById(containerId);
      if (!containerEl) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerId, {
        center: [15.9129, 79.7400],
        zoom: currentTab === 'overview' ? 7 : 8,
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

      renderMarkers(L, map, markersLayer);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentTab, theme]);

  // Update Map Markers on state changes
  useEffect(() => {
    const L = (window as any).L;
    if (mapRef.current && markersLayerRef.current && L) {
      renderMarkers(L, mapRef.current, markersLayerRef.current);
    }
  }, [data, selectedDistrictId, mapMode]);

  // Invalidate size on sidebar toggle
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 350);
    }
  }, [sidebarCollapsed]);

  // --- ACTIONS CONTROLLERS ---
  const handleVerifyGuest = (id: string) => {
    setData(prev => {
      const updatedCheckins = prev.liveCheckins.map(c => {
        if (c.id === id) {
          return { ...c, status: 'Cleared' as const, watchlistMatch: false, watchlistReason: '' };
        }
        return c;
      });

      const matched = prev.liveCheckins.find(c => c.id === id);
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
      properties: prev.properties.map(p => p.id === id ? { ...p, status: 'verified' as const, verificationStatus: 'approved' as const, complianceScore: Math.max(90, p.complianceScore) } : p)
    }));

    if (selectedItem?.type === 'property' && selectedItem.item.id === id) {
      setSelectedItem(prev => prev ? { ...prev, item: { ...prev.item, status: 'verified', verificationStatus: 'approved', complianceScore: 95 } } : null);
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
      properties: prev.properties.map(p => p.id === id ? { ...p, status: 'suspended' as const, verificationStatus: 'declined' as const } : p)
    }));

    if (selectedItem?.type === 'property' && selectedItem.item.id === id) {
      setSelectedItem(prev => prev ? { ...prev, item: { ...prev.item, status: 'suspended', verificationStatus: 'declined' } } : null);
    }
  };

  // --- NEW PG APPLICATIONS ACTIONS ---
  const handleSendPatrolVerification = (id: string) => {
    openPrompt("Assign Verification Patrol Officer:", "SI Ramesh Kumar", (officerName) => {
      if (!officerName) return;
      
      setData(prev => ({
        ...prev,
        properties: prev.properties.map(p => {
          if (p.id === id) {
            return {
              ...p,
              verificationStatus: 'police_verified' as const,
              verificationOfficer: officerName,
              policeReportComments: `Physical verification completed. Safety logs checked, CCTV active. Advise approval.`
            };
          }
          return p;
        })
      }));

      openAlert("Verification Patrol Assigned", `Patrol officer ${officerName} has completed physical inspection and uploaded reports.`);
    });
  };

  const handleRequestMoreDocs = (id: string) => {
    openPrompt("Enter specific missing documents description:", "Fire NOC & Land registry copy", (reason) => {
      if (!reason) return;

      setData(prev => ({
        ...prev,
        properties: prev.properties.map(p => {
          if (p.id === id) {
            return {
              ...p,
              verificationStatus: 'docs_required' as const,
              policeReportComments: `Application paused. Missing: ${reason}`
            };
          }
          return p;
        })
      }));
    });
  };

  const handleReuploadRequiredDocs = (id: string) => {
    setData(prev => ({
      ...prev,
      properties: prev.properties.map(p => {
        if (p.id === id) {
          return {
            ...p,
            verificationStatus: 'submitted_physical' as const,
            policeReportComments: `Documents re-uploaded. Physical verification queued.`
          };
        }
        return p;
      })
    }));
    openAlert("Documents Uploaded", "Owner notified. Simulated document re-upload triggered.");
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
    openAlert("Live Video Audit Complete", "CCTV camera connection has been successfully verified.");
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
    openPrompt("Enter Patrol Officer Name:", "SI Prasad", (newOfficer) => {
      if (!newOfficer) return;

      setData(prev => ({
        ...prev,
        incidents: prev.incidents.map(inc => inc.id === id ? { ...inc, assignedOfficer: newOfficer } : inc)
      }));
    });
  };

  // --- SETTINGS MOCK TRIGGERS ---
  const handleTriggerMockAlarm = () => {
    const randomProp = data.properties[Math.floor(Math.random() * data.properties.length)];
    const newAlert = {
      id: `ALT-${Math.floor(100 + Math.random() * 900)}`,
      type: 'sos' as const,
      message: `Active SOS Panic Alarm triggered at ${randomProp.name}`,
      time: 'Just now',
      severity: 'critical' as const,
      propertyId: randomProp.id
    };

    const newIncident: Incident = {
      id: `INC-SOS-${Math.floor(100 + Math.random() * 900)}`,
      propertyName: randomProp.name,
      district: randomProp.district,
      type: 'SOS Panic Button',
      reportedAt: new Date().toISOString(),
      assignedOfficer: 'Emergency Response Squad (AP-PATROL)',
      status: 'Dispatch Active',
      details: 'SOS Alarm triggered from mobile client app. Patrol squad dispatched to coordinates.'
    };

    setData(prev => ({
      ...prev,
      alerts: [newAlert, ...prev.alerts],
      incidents: [newIncident, ...prev.incidents],
      districts: prev.districts.map(d => d.name === randomProp.district ? { ...d, activeSos: d.activeSos + 1 } : d)
    }));
    openAlert("Mock SOS Triggered", `Mock SOS Alarm generated successfully for ${randomProp.name}!`);
  };

  const handleInjectMockGuest = () => {
    const randomProp = data.properties[Math.floor(Math.random() * data.properties.length)];
    const mockId = `CHK-MOCK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGuest: CheckIn = {
      id: mockId,
      guestName: 'Simulated Occupant',
      age: 28,
      phone: '+91 90000 88273',
      idType: 'Aadhar Card',
      idNumber: '8837 9923 1182',
      idImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
      nationality: 'Indian',
      checkinTime: new Date().toISOString(),
      checkoutTime: new Date(Date.now() + 86400000 * 4).toISOString(),
      propertyName: randomProp.name,
      roomNumber: '302',
      watchlistMatch: false,
      watchlistReason: '',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
      status: 'Cleared',
      gender: 'Male',
      guestCount: 2
    };

    setData(prev => ({
      ...prev,
      liveCheckins: [newGuest, ...prev.liveCheckins]
    }));
    openAlert("Mock Guest Injected", `Mock guest injected at ${randomProp.name}!`);
  };

  const handleResetData = () => {
    setData(INITIAL_MOCK_DATA);
    openAlert("Database Reset Complete", "Simulated command center databases reset successfully.");
  };

  // --- ROBUST SEARCH FILTER MATCHING ANY KEYWORD ---
  const searchFilter = (item: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    
    return (
      item.guestName?.toLowerCase().includes(query) ||
      item.idNumber?.toLowerCase().includes(query) ||
      item.propertyName?.toLowerCase().includes(query) ||
      item.nationality?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query) ||
      item.roomNumber?.toString().toLowerCase().includes(query) ||
      item.idType?.toLowerCase().includes(query) ||
      item.age?.toString().includes(query) ||
      (item.watchlistReason && item.watchlistReason.toLowerCase().includes(query))
    );
  };

  // District name logic
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

  const activeSosCount = data.incidents.filter(i => i.status === 'Dispatch Active').length;
  const watchlistHitsCount = data.liveCheckins.filter(c => c.watchlistMatch).length;

  const filteredCommandResults = commandSearch
    ? data.liveCheckins.filter(c => c.guestName.toLowerCase().includes(commandSearch.toLowerCase()))
    : [];

  // --- SIDEBAR MENU TABS DEFINITION ---
  const sidebarTabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'registry', label: 'Registry', icon: FileText },
    { id: 'pg-applications', label: 'PG Applications', icon: Clock }, // New Workflow Tab
    { id: 'livemap', label: 'Live Map', icon: Globe },
    { id: 'cctv', label: 'CCTV Feeds', icon: Video }, // New Dedicated Tab
    { id: 'search', label: 'Search', icon: Search },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'watchlist', label: 'Watchlist', icon: Lock },
    { id: 'bookings', label: 'Bookings', icon: Building },
    { id: 'occupancy', label: 'Occupancy', icon: TrendingUp },
    { id: 'verifications', label: 'Verifications', icon: Check },
    { id: 'audits', label: 'Audits', icon: Sliders },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="app-container">
      
      {/* ─── SIDEBAR NAVIGATION ─── */}
      <motion.aside 
        className="sidebar"
        animate={{ width: sidebarCollapsed ? 64 : 220 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div>
          <div className="sidebar-header">
            <div className="sidebar-brand">
              <div className="sidebar-logo">
                <Shield size={16} strokeWidth={2.5} />
              </div>
              {!sidebarCollapsed && (
                <div className="sidebar-brand-text">
                  <h2>SafeStay AP</h2>
                  <p>Command Staff</p>
                </div>
              )}
            </div>
            <button 
              className="sidebar-collapse-btn" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          <div className="menu-group">
            {!sidebarCollapsed && <div className="menu-title">Main Portal Options</div>}
            {sidebarTabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <div 
                  key={tab.id}
                  className={`menu-item ${currentTab === tab.id ? 'active' : ''}`}
                  onClick={() => { setCurrentTab(tab.id); setSelectedItem(null); }}
                  style={{ position: 'relative' }}
                >
                  {currentTab === tab.id && (
                    <motion.div layoutId="sidebar-active" className="sidebar-active-pill" />
                  )}
                  <TabIcon size={16} style={{ zIndex: 1, color: currentTab === tab.id ? '#000' : 'inherit' }} />
                  {!sidebarCollapsed && <span style={{ zIndex: 1 }}>{tab.label}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <img 
              src="/SAFE_STAY_APP_LOGO.jpeg" 
              alt="AP Police Commissioner Logo" 
              className="user-avatar" 
              style={{ objectFit: 'contain', backgroundColor: '#ffffff', padding: '1px', borderRadius: '4px' }}
            />
            {!sidebarCollapsed && (
              <div className="user-info">
                <h4>AP Police Commissioner</h4>
                <p>Command Staff</p>
              </div>
            )}
          </div>
          
          <div 
            className="theme-switch" 
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title="Toggle Visual Theme"
          >
            <div className="theme-switch-thumb">
              {theme === 'dark' ? <Moon size={11} /> : <Sun size={11} />}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ─── MAIN WORKSPACE ─── */}
      <main className="main-workspace">
        
        {/* Top Header */}
        <header className="top-nav">
          <div className="header-command-palette-trigger" onClick={() => setShowCommandPalette(true)}>
            <Search size={14} />
            <span>Search records or press <kbd>Ctrl+K</kbd></span>
          </div>

          <div className="header-right-group">
            <div className="date-range-selector">
              <span className="date-indicator-dot"></span>
              <span>June 6, 2026 - Live Feed</span>
            </div>

            <button className="header-bell-btn" onClick={() => setCurrentTab('alerts')}>
              <Bell size={16} />
            </button>
            
            {activeSosCount > 0 && (
              <button className="btn-pulse" style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', border: '1px solid var(--danger)', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setCurrentTab('incidents')}>
                <span className="pulse-dot" style={{ width: '6px', height: '6px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{activeSosCount} ACTIVE ALARMS</span>
              </button>
            )}
          </div>
        </header>

        {/* WORKSPACE CONTENT SCREEN */}
        <div className="dashboard-content" style={{ gridTemplateColumns: (currentTab === 'livemap' || currentTab === 'search' || currentTab === 'pg-applications' || currentTab === 'cctv') ? '1fr' : '1fr 310px' }}>
          
          <div className="dashboard-center">
            
            {/* Sector / District Filter Notification Bar */}
            {selectedDistrictId && currentTab !== 'overview' && (
              <div style={{ backgroundColor: 'var(--primary-subtle)', border: '1px solid var(--primary)', padding: '8px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '14px' }}>
                <span>Surveillance localized to district: <strong>{activeDistrictName}</strong> (showing matches only).</span>
                <button 
                  onClick={() => setSelectedDistrictId(null)}
                  style={{ background: 'var(--primary)', color: '#000', border: 'none', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
                >
                  Clear Sector Filter (Show All 20+ PGs)
                </button>
              </div>
            )}

            {/* 1. OVERVIEW SCREEN */}
            {currentTab === 'overview' && (
              <>
                {/* KPIs Row */}
                <div className="kpi-row">
                  <motion.div 
                    className="glass-card kpi-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                  >
                    <div className="kpi-header">
                      <span>Verified Properties</span>
                      <Building size={14} />
                    </div>
                    <div className="kpi-value tabular-nums">{data.properties.length} PGs & Hotels</div>
                    <div className="kpi-trend up">
                      <span>+100% database match</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="glass-card kpi-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                  >
                    <div className="kpi-header">
                      <span>Live Checked-in Guests</span>
                      <Users size={14} />
                    </div>
                    <div className="kpi-value tabular-nums">{data.liveCheckins.length} Guests</div>
                    <div className="kpi-trend up">
                      <span>Live sync online</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="glass-card kpi-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <div className="kpi-header">
                      <span>Watchlist suspects</span>
                      <AlertTriangle size={14} />
                    </div>
                    <div className="kpi-value tabular-nums" style={{ color: 'var(--danger)' }}>{watchlistHitsCount} Flagged</div>
                    <div className="kpi-trend down" style={{ color: 'var(--danger)' }}>
                      <span>Immediate audit recommended</span>
                    </div>
                  </motion.div>
                </div>

                {/* Geospatial Map section */}
                <motion.div 
                  className="glass-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <div className="panel-header" style={{ marginBottom: '14px' }}>
                    <h3>District Geospatial Surveillance</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={`filter-chip ${mapMode === 'occupancy' ? 'active' : ''}`} onClick={() => setMapMode('occupancy')} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', border: '1px solid var(--border-color)', background: mapMode === 'occupancy' ? 'var(--primary)' : 'none', color: mapMode === 'occupancy' ? '#000' : 'inherit' }}>Occupancy density</button>
                      <button className={`filter-chip ${mapMode === 'alerts' ? 'active' : ''}`} onClick={() => setMapMode('alerts')} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', border: '1px solid var(--border-color)', background: mapMode === 'alerts' ? 'var(--primary)' : 'none', color: mapMode === 'alerts' ? '#000' : 'inherit' }}>Threat heatmap</button>
                    </div>
                  </div>

                  <div className="map-layout">
                    <div className="map-container">
                      <div id="leafletMap"></div>
                    </div>
                    <div className="district-list-rail" style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
                      {data.districts.map(d => (
                        <div 
                          key={d.id} 
                          className={`district-row ${selectedDistrictId === d.id ? 'selected' : ''}`}
                          onClick={() => setSelectedDistrictId(prev => prev === d.id ? null : d.id)}
                          style={{ padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', backgroundColor: selectedDistrictId === d.id ? 'var(--bg-input)' : 'none' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
                            <strong>{d.name}</strong>
                            <span style={{ color: d.activeSos > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{d.activeSos} SOS</span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                            <span>{d.occupancy}% Occupancy</span>
                            <span>{d.watchlistMatches} watchlists</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* ─── DYNAMIC MAP ZONE SECTOR DETAILS (TAP MAP ZONE RESULTS) ─── */}
                {selectedDistrictId && (
                  <motion.div 
                    className="glass-card" 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '14px' }}
                  >
                    <div className="panel-header">
                      <div>
                        <h3 style={{ fontSize: '15px' }}>Surveillance Sector Analysis: {activeDistrictName}</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tap a PG property below to inspect its live occupant list and flagged matches.</p>
                      </div>
                      <button 
                        onClick={() => setSelectedDistrictId(null)}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        x Clear Sector Filter
                      </button>
                    </div>

                    <div className="sector-analysis-grid">
                      
                      {/* Step 1: PGs in Sector */}
                      <div>
                        <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>PGs & Hotels in Zone ({data.properties.filter(p => filterBySelectedDistrict(p.district)).length})</h4>
                        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {data.properties.filter(p => filterBySelectedDistrict(p.district)).map(p => {
                            const isSelectedPG = activeZonePropertyId === p.id;
                            const hasFlaggedGuests = data.liveCheckins.some(c => c.propertyName === p.name && c.watchlistMatch);
                            return (
                              <div 
                                key={p.id} 
                                onClick={() => setActiveZonePropertyId(p.id)}
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  padding: '10px', 
                                  backgroundColor: isSelectedPG ? 'var(--primary-subtle)' : 'var(--bg-input)', 
                                  borderRadius: '8px', 
                                  cursor: 'pointer', 
                                  border: isSelectedPG ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div>
                                  <span style={{ fontSize: '12.2px', fontWeight: 'bold', display: 'block', color: isSelectedPG ? 'var(--primary)' : 'inherit' }}>{p.name}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.type} • Compliance {p.complianceScore}%</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {hasFlaggedGuests && (
                                    <span style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '8.5px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '4px' }}>
                                      SUSPECT
                                    </span>
                                  )}
                                  <span className={`status-indicator ${p.status}`} style={{ fontSize: '9.5px' }}>{p.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Step 2: Occupants Manifest for Selected PG */}
                      <div>
                        {activeZonePropertyId ? (
                          (() => {
                            const selectedPG = data.properties.find(p => p.id === activeZonePropertyId);
                            if (!selectedPG) return null;
                            const guestsAtPG = data.liveCheckins.filter(c => c.propertyName === selectedPG.name);
                            const flaggedGuests = guestsAtPG.filter(c => c.watchlistMatch);
                            const regularGuests = guestsAtPG.filter(c => !c.watchlistMatch);

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                  Roster: {selectedPG.name} ({guestsAtPG.length} checked-in)
                                </h4>

                                {flaggedGuests.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--danger)', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255, 39, 39, 0.04)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <AlertTriangle size={12} /> FLAGGED CRIMINAL MATCHES ({flaggedGuests.length})
                                    </div>
                                    {flaggedGuests.map(c => (
                                      <div 
                                        key={c.id}
                                        onClick={() => setSelectedItem({ type: 'guest', item: c })}
                                        style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--danger)' }}
                                      >
                                        <img src={c.photo} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                        <div style={{ flex: 1 }}>
                                          <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--danger)', display: 'block' }}>{c.guestName}</span>
                                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Room {c.roomNumber} • {c.watchlistReason}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {regularGuests.map(c => (
                                    <div 
                                      key={c.id}
                                      onClick={() => setSelectedItem({ type: 'guest', item: c })}
                                      style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                                    >
                                      <img src={c.photo} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '11.5px', fontWeight: 'bold', display: 'block' }}>{c.guestName}</span>
                                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{c.gender} • Room {c.roomNumber} • Aadhaar {c.idNumber}</span>
                                      </div>
                                      <span className={`status-indicator ${c.status}`} style={{ fontSize: '9px' }}>{c.status}</span>
                                    </div>
                                  ))}
                                  {guestsAtPG.length === 0 && (
                                    <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11.5px' }}>
                                      No live guests checked in at this property.
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                            <Building size={18} style={{ marginBottom: '6px', color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '11px', textAlign: 'center' }}>Select a PG property to load occupant manifest.</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}


                {/* GPS PATROL DISPATCH ROSTER */}
                <motion.div 
                  className="glass-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <div className="panel-header" style={{ marginBottom: '12px' }}>
                    <div>
                      <h3>GPS Ground Patrol Fleet Dispatch</h3>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Command routing log for active district patrol officers patrolling verified PG sectors.</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { callsign: 'AP-PATROL-09', district: 'NTR Vijayawada', officer: 'SI Ramesh Kumar', status: 'En Route', eta: '4 Mins', active: true },
                      { callsign: 'AP-PATROL-04', district: 'Visakhapatnam', officer: 'SI K. Prasad', status: 'On Scene', eta: 'Arrived', active: false },
                      { callsign: 'AP-PATROL-11', district: 'Guntur City', officer: 'SI V. Murthy', status: 'Standby', eta: '--', active: false },
                      { callsign: 'AP-PATROL-15', district: 'Tirupati Urban', officer: 'SI A. Naidu', status: 'Patrolling', eta: '--', active: true }
                    ].map((patrol, idx) => (
                      <div 
                        key={idx} 
                        style={{ padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12.5px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{patrol.callsign}</span>
                            <span style={{ fontSize: '9.5px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{patrol.district}</span>
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Officer: {patrol.officer}</p>
                          <button 
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', padding: 0, marginTop: '8px', fontSize: '10.5px', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => openPrompt(`Send Command Message to ${patrol.callsign}:`, "Maintain high alert at Guntur girls hostel cluster.", (msg) => {
                              if (msg) openAlert("Message Dispatched", `Transmission confirmed to ${patrol.callsign}: "${msg}"`);
                            })}
                          >
                            Send command message
                          </button>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '11px', color: patrol.active ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>{patrol.status}</span>
                          <span style={{ fontSize: '9.5px', color: 'var(--text-secondary)' }}>{patrol.eta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

            {/* 2. REGISTRY SCREEN */}
            {currentTab === 'registry' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>Checked-in Guests Database Registry</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 10px' }}>
                    <Search size={12} color="var(--text-muted)" />
                    <input 
                      type="text" 
                      placeholder="Search any keyword..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '12px', outline: 'none', width: '200px' }}
                    />
                  </div>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Guest Name</th>
                        <th>Credentials Type & ID</th>
                        <th>Country</th>
                        <th>Stay Property</th>
                        <th>Room</th>
                        <th>Verification Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.liveCheckins.filter(searchFilter).filter(c => filterBySelectedDistrict(c.propertyName)).map(c => (
                        <tr key={c.id} onClick={() => setSelectedItem({ type: 'guest', item: c })} style={{ cursor: 'pointer' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={c.photo} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                              <strong>{c.guestName}</strong>
                            </div>
                          </td>
                          <td className="mono-id">{c.idType}: {c.idNumber}</td>
                          <td>{c.nationality}</td>
                          <td>{c.propertyName}</td>
                          <td>{c.roomNumber}</td>
                          <td>
                            <span className={`status-indicator ${c.status}`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ─── NEW TABS: 3. PG APPLICATIONS SURVEILLANCE & WORKFLOW ─── */}
            {currentTab === 'pg-applications' && (
              <motion.div className="glass-card" style={{ overflow: 'visible' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                
                <div className="panel-header" style={{ marginBottom: '14px' }}>
                  <div>
                    <h3>PG Applications Physical Verification Registry</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Command workflow system for ground patrol assignment, document requests, and operating approvals.
                    </p>
                  </div>
                </div>

                {/* Sub tabs */}
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>
                  <button 
                    className={`filter-chip ${verificationSubTab === 'pending' ? 'active' : ''}`} 
                    onClick={() => setVerificationSubTab('pending')}
                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11.5px', cursor: 'pointer', border: '1px solid var(--border-color)', background: verificationSubTab === 'pending' ? 'var(--primary)' : 'none', color: verificationSubTab === 'pending' ? '#000' : 'inherit', fontWeight: 'bold' }}
                  >
                    Verification Pending ({data.properties.filter(p => p.verificationStatus === 'submitted_physical' || p.verificationStatus === 'docs_required').length})
                  </button>
                  <button 
                    className={`filter-chip ${verificationSubTab === 'verified' ? 'active' : ''}`} 
                    onClick={() => setVerificationSubTab('verified')}
                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11.5px', cursor: 'pointer', border: '1px solid var(--border-color)', background: verificationSubTab === 'verified' ? 'var(--primary)' : 'none', color: verificationSubTab === 'verified' ? '#000' : 'inherit', fontWeight: 'bold' }}
                  >
                    Police Verified / Reports Uploaded ({data.properties.filter(p => p.verificationStatus === 'police_verified').length})
                  </button>
                  <button 
                    className={`filter-chip ${verificationSubTab === 'approved' ? 'active' : ''}`} 
                    onClick={() => setVerificationSubTab('approved')}
                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11.5px', cursor: 'pointer', border: '1px solid var(--border-color)', background: verificationSubTab === 'approved' ? 'var(--primary)' : 'none', color: verificationSubTab === 'approved' ? '#000' : 'inherit', fontWeight: 'bold' }}
                  >
                    Approved PGs ({data.properties.filter(p => p.verificationStatus === 'approved').length})
                  </button>
                  <button 
                    className={`filter-chip ${verificationSubTab === 'declined' ? 'active' : ''}`} 
                    onClick={() => setVerificationSubTab('declined')}
                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '11.5px', cursor: 'pointer', border: '1px solid var(--border-color)', background: verificationSubTab === 'declined' ? 'var(--primary)' : 'none', color: verificationSubTab === 'declined' ? '#000' : 'inherit', fontWeight: 'bold' }}
                  >
                    Declined PGs ({data.properties.filter(p => p.verificationStatus === 'declined').length})
                  </button>
                </div>

                {/* Sub Tab lists */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* PENDING SUBMISSION TAB */}
                  {verificationSubTab === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {data.properties.filter(p => p.verificationStatus === 'submitted_physical' || p.verificationStatus === 'docs_required').map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 'bold' }}>{p.name}</h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.address} • {p.district}</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                              <span>Owner: {p.ownerName} ({p.ownerPhone})</span>
                              <span>Submitted: {p.submittedDate}</span>
                            </div>
                            {p.verificationStatus === 'docs_required' && (
                              <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: 'var(--warning-subtle)', border: '1px solid var(--warning)', borderRadius: '6px', fontSize: '11px', color: 'var(--warning)', fontWeight: 'bold' }}>
                                paused: {p.policeReportComments}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn-action-large success" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
                              onClick={() => handleSendPatrolVerification(p.id)}
                            >
                              <Send size={11} /> Send Police Patrol
                            </button>
                            <button 
                              className="btn-action-large warning" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
                              onClick={() => handleRequestMoreDocs(p.id)}
                            >
                              <HelpCircle size={11} /> Request Documents
                            </button>
                            <button 
                              className="btn-action-large" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '11px', border: '1px solid var(--border-color)' }}
                              onClick={() => handleReuploadRequiredDocs(p.id)}
                            >
                              <RefreshCw size={11} /> Re-upload docs
                            </button>
                          </div>
                        </div>
                      ))}
                      {data.properties.filter(p => p.verificationStatus === 'submitted_physical' || p.verificationStatus === 'docs_required').length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>No properties in this verification queue.</div>
                      )}
                    </div>
                  )}

                  {/* POLICE VERIFIED TAB */}
                  {verificationSubTab === 'verified' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {data.properties.filter(p => p.verificationStatus === 'police_verified').map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 'bold' }}>{p.name}</h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{p.address} • {p.district}</p>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '10.5px', color: 'var(--text-secondary)' }}>
                              <span>Verification Officer: <strong>{p.verificationOfficer}</strong></span>
                              <span>Submitted: {p.submittedDate}</span>
                            </div>
                            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '11px', border: '1px solid var(--border-color)' }}>
                              <strong>Patrol Report Comment:</strong> {p.policeReportComments}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginLeft: '14px' }}>
                            <button 
                              className="btn-action-large success" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
                              onClick={() => handleVerifyProperty(p.id)}
                            >
                              <Check size={11} /> Approve PG
                            </button>
                            <button 
                              className="btn-action-large danger" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
                              onClick={() => handleSuspendProperty(p.id)}
                            >
                              <XCircle size={11} /> Decline PG
                            </button>
                            <button 
                              className="btn-action-large warning" 
                              style={{ width: 'auto', padding: '6px 12px', fontSize: '11px' }}
                              onClick={() => handleRequestMoreDocs(p.id)}
                            >
                              Need Documents
                            </button>
                          </div>
                        </div>
                      ))}
                      {data.properties.filter(p => p.verificationStatus === 'police_verified').length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>No reports submitted for review.</div>
                      )}
                    </div>
                  )}

                  {/* APPROVED TAB */}
                  {verificationSubTab === 'approved' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {data.properties.filter(p => p.verificationStatus === 'approved').map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 'bold' }}>{p.name}</h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{p.address} • {p.district}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 'bold', backgroundColor: 'var(--success-subtle)', padding: '4px 8px', borderRadius: '6px' }}>✓ Approved & Active</span>
                            <button 
                              style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => setSelectedItem({ type: 'property', item: p })}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* DECLINED TAB */}
                  {verificationSubTab === 'declined' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {data.properties.filter(p => p.verificationStatus === 'declined').map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                          <div>
                            <h4 style={{ fontSize: '13.5px', fontWeight: 'bold' }}>{p.name}</h4>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{p.address} • {p.district}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 'bold', backgroundColor: 'var(--danger-subtle)', padding: '4px 8px', borderRadius: '6px' }}>✗ Suspended / Declined</span>
                            <button 
                              style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                              onClick={() => handleSendPatrolVerification(p.id)}
                            >
                              Request Re-Verification
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

              </motion.div>
            )}

            {/* ─── NEW SECTION: CCTV FEEDS SCREEN ─── */}
            {currentTab === 'cctv' && (
              <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                      <Video size={16} style={{ color: 'var(--primary)' }} /> Live CCTV Surveillance Control Center
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Real-time high-definition camera stream telemetry integrated directly from PG guest entrances, lobbies, and corridors.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(200, 241, 53, 0.05)', border: '1px solid var(--primary-subtle)', padding: '6px 12px', borderRadius: '20px' }}>
                      <span className="pulse-dot" style={{ width: '8px', height: '8px', backgroundColor: 'var(--primary)', borderRadius: '50%' }}></span>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)' }}>4 STREAMS ONLINE</span>
                    </div>
                  </div>
                </div>

                {/* CCTV Control Panel Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', backgroundColor: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div className="filter-group">
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>CAMERA FEED SELECTOR</label>
                    <select className="filter-select" style={{ fontSize: '11.5px', padding: '6px 10px' }}>
                      <option>All Active Channels</option>
                      <option>NTR Vijayawada Sector</option>
                      <option>Visakhapatnam District</option>
                      <option>Guntur District</option>
                      <option>Tirupati Region</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>RESOLUTION / FRAME RATE</label>
                    <select className="filter-select" style={{ fontSize: '11.5px', padding: '6px 10px' }}>
                      <option>1080p HD (Adaptive FPS)</option>
                      <option>720p (Low Bandwidth)</option>
                      <option>4K Ultra (Command Center Priority)</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold' }}>AI FACIAL AUDITING</label>
                    <button className="btn-action-large success" onClick={() => openAlert("AI Biometrics Enabled", "Facial recognition templates successfully loaded. Automated Aadhaar blacklist parsing active.")} style={{ height: '32px', fontSize: '11px', width: '100%', padding: '0 10px' }}>
                      Enable Biometric Matcher
                    </button>
                  </div>
                </div>

                {/* CCTV Stream Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  {[
                    { name: 'NTR PG Entrance', location: 'Vijayawada', status: 'REC', fps: '25 fps', img: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=500&q=80', ip: '192.168.1.104', bitrate: '4.2 Mbps' },
                    { name: 'Vizag Girls Hostel Gate', location: 'Visakhapatnam', status: 'REC', fps: '24 fps', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&q=80', ip: '192.168.2.89', bitrate: '3.8 Mbps' },
                    { name: 'Guntur PG Lobby Lobby', location: 'Guntur', status: 'REC', fps: '22 fps', img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&q=80', ip: '192.168.3.120', bitrate: '3.1 Mbps' },
                    { name: 'Tirupati PG Corridor B', location: 'Tirupati', status: 'REC', fps: '30 fps', img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500&q=80', ip: '192.168.4.15', bitrate: '5.0 Mbps' }
                  ].map((feed, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => openAlert("CCTV Telemetry", `Stream: ${feed.name}\nSource IP: ${feed.ip}\nBitrate: ${feed.bitrate}\nDistrict: ${feed.location}\nIntegrity test passed. CCTV ping: 14ms.`)}
                      style={{ position: 'relative', height: '200px', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}
                      className="cctv-card"
                    >
                      {/* Top Bar Indicators */}
                      <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 2, backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px' }}>
                        <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--danger)', borderRadius: '50%', display: 'inline-block' }}></span>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff' }}>{feed.status}</span>
                      </div>
                      <div style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '9px', color: '#fff', zIndex: 2, backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', display: 'flex', gap: '8px' }}>
                        <span>{feed.fps}</span>
                        <span style={{ color: 'var(--primary)' }}>{feed.bitrate}</span>
                      </div>
                      
                      {/* Simulation Stream */}
                      <div 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          backgroundImage: `linear-gradient(rgba(0,255,0,0.02) 50%, rgba(0,0,0,0.3) 50%), url('${feed.img}')`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          filter: 'grayscale(0.4) contrast(1.1) brightness(0.8)',
                          position: 'relative'
                        }}
                      >
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)', backgroundSize: '100% 4px' }}></div>
                      </div>

                      {/* Bottom Info Bar */}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2, padding: '12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{feed.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{feed.location} Surveillance • IP: {feed.ip}</div>
                        </div>
                        <button className="btn-action-small" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#fff', background: 'rgba(255,255,255,0.05)', fontSize: '9px', padding: '3px 8px' }}>
                          Ping Telemetry
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 4. LIVE MAP SCREEN */}
            {currentTab === 'livemap' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="panel-header" style={{ marginBottom: '10px' }}>
                    <h3>Full GIS Surveillance Map</h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Realtime tracking across AP</span>
                  </div>
                  <div className="map-layout" style={{ height: '520px', gridTemplateColumns: '1fr 280px' }}>
                    <div className="map-container" style={{ height: '100%' }}>
                      <div id="leafletMapFull" style={{ height: '100%', width: '100%' }}></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingLeft: '10px' }}>
                      <h4>Active Dispatch Log</h4>
                      {data.incidents.map(inc => (
                        <div key={inc.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', backgroundColor: 'var(--bg-input)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold' }}>
                            <span>{inc.id}</span>
                            <span style={{ color: 'var(--danger)' }}>{inc.status}</span>
                          </div>
                          <p style={{ fontSize: '11px', margin: '4px 0', color: 'var(--text-muted)' }}>{inc.details}</p>
                          <div style={{ fontSize: '9px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{inc.propertyName}</span>
                            <span>{inc.assignedOfficer}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* DYNAMIC MAP ZONE SECTOR DETAILS (TAP MAP ZONE RESULTS) */}
                {selectedDistrictId && (
                  <motion.div 
                    className="glass-card" 
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ borderLeft: '4px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '14px' }}
                  >
                    <div className="panel-header">
                      <div>
                        <h3 style={{ fontSize: '15px' }}>Surveillance Sector Analysis: {activeDistrictName}</h3>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tap a PG property below to inspect its live occupant list and flagged matches.</p>
                      </div>
                      <button 
                        onClick={() => setSelectedDistrictId(null)}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        x Clear Sector Filter
                      </button>
                    </div>

                    <div className="sector-analysis-grid">
                      
                      {/* Step 1: PGs in Sector */}
                      <div>
                        <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>PGs & Hotels in Zone ({data.properties.filter(p => filterBySelectedDistrict(p.district)).length})</h4>
                        <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {data.properties.filter(p => filterBySelectedDistrict(p.district)).map(p => {
                            const isSelectedPG = activeZonePropertyId === p.id;
                            const hasFlaggedGuests = data.liveCheckins.some(c => c.propertyName === p.name && c.watchlistMatch);
                            return (
                              <div 
                                key={p.id} 
                                onClick={() => setActiveZonePropertyId(p.id)}
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center',
                                  padding: '10px', 
                                  backgroundColor: isSelectedPG ? 'var(--primary-subtle)' : 'var(--bg-input)', 
                                  borderRadius: '8px', 
                                  cursor: 'pointer', 
                                  border: isSelectedPG ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div>
                                  <span style={{ fontSize: '12.2px', fontWeight: 'bold', display: 'block', color: isSelectedPG ? 'var(--primary)' : 'inherit' }}>{p.name}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.type} • Compliance {p.complianceScore}%</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {hasFlaggedGuests && (
                                    <span style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger)', fontSize: '8.5px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '4px' }}>
                                      SUSPECT
                                    </span>
                                  )}
                                  <span className={`status-indicator ${p.status}`} style={{ fontSize: '9.5px' }}>{p.status}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Step 2: Occupants Manifest for Selected PG */}
                      <div>
                        {activeZonePropertyId ? (
                          (() => {
                            const selectedPG = data.properties.find(p => p.id === activeZonePropertyId);
                            if (!selectedPG) return null;
                            const guestsAtPG = data.liveCheckins.filter(c => c.propertyName === selectedPG.name);
                            const flaggedGuests = guestsAtPG.filter(c => c.watchlistMatch);
                            const regularGuests = guestsAtPG.filter(c => !c.watchlistMatch);

                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h4 style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                  Roster: {selectedPG.name} ({guestsAtPG.length} checked-in)
                                </h4>

                                {flaggedGuests.length > 0 && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid var(--danger)', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255, 39, 39, 0.04)' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <AlertTriangle size={12} /> FLAGGED CRIMINAL MATCHES ({flaggedGuests.length})
                                    </div>
                                    {flaggedGuests.map(c => (
                                      <div 
                                        key={c.id}
                                        onClick={() => setSelectedItem({ type: 'guest', item: c })}
                                        style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--danger)' }}
                                      >
                                        <img src={c.photo} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                        <div style={{ flex: 1 }}>
                                          <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'var(--danger)', display: 'block' }}>{c.guestName}</span>
                                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block' }}>Room {c.roomNumber} • {c.watchlistReason}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {regularGuests.map(c => (
                                    <div 
                                      key={c.id}
                                      onClick={() => setSelectedItem({ type: 'guest', item: c })}
                                      style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)' }}
                                    >
                                      <img src={c.photo} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                      <div style={{ flex: 1 }}>
                                        <span style={{ fontSize: '11.5px', fontWeight: 'bold', display: 'block' }}>{c.guestName}</span>
                                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>{c.gender} • Room {c.roomNumber} • Aadhaar {c.idNumber}</span>
                                      </div>
                                      <span className={`status-indicator ${c.status}`} style={{ fontSize: '9px' }}>{c.status}</span>
                                    </div>
                                  ))}
                                  {guestsAtPG.length === 0 && (
                                    <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11.5px' }}>
                                      No live guests checked in at this property.
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                            <Building size={18} style={{ marginBottom: '6px', color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '11px', textAlign: 'center' }}>Select a PG property to load occupant manifest.</span>
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* 5. SEARCH SCREEN (WITH COUNTRY AND KEYWORD SEARCH) */}
            {currentTab === 'search' && (
              <motion.div className="glass-card" style={{ overflow: 'visible' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header" style={{ marginBottom: '14px' }}>
                  <h3>Deep Security Search Console</h3>
                </div>

                <div className="search-console-grid">
                  <div className="search-sidebar">
                    <div className="filter-group">
                      <label>Keyword search</label>
                      <input 
                        type="text" 
                        placeholder="Search country, name, id..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="filter-input"
                      />
                    </div>

                    <div className="filter-group">
                      <label>Threat Status</label>
                      <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="All">All Statuses</option>
                        <option value="Cleared">Cleared Only</option>
                        <option value="Watchlist Match">Watchlist Matches</option>
                        <option value="Escalated">Escalated</option>
                        <option value="Flagged">Flagged</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>Origin</label>
                      <select className="filter-select" value={filterNationality} onChange={e => setFilterNationality(e.target.value)}>
                        <option value="All">All Nationalities</option>
                        <option value="Indian">Indian Citizens</option>
                        <option value="Foreigner">Foreign Nationals</option>
                      </select>
                    </div>

                    <div className="filter-group">
                      <label>Max Age: <span style={{ fontFamily: 'var(--font-mono)' }}>{filterAge}</span></label>
                      <input 
                        type="range" 
                        min="18" 
                        max="80" 
                        value={filterAge} 
                        onChange={e => setFilterAge(parseInt(e.target.value))}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                    </div>
                  </div>

                  <div className="table-wrapper" style={{ maxHeight: '450px', overflowY: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Guest</th>
                          <th>Nationality</th>
                          <th>ID Scanned</th>
                          <th>Location</th>
                          <th>Age</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.liveCheckins
                          .filter(searchFilter)
                          .filter(c => filterStatus === 'All' ? true : c.status === filterStatus)
                          .filter(c => {
                            if (filterNationality === 'All') return true;
                            if (filterNationality === 'Indian') return c.nationality === 'Indian';
                            return c.nationality !== 'Indian';
                          })
                          .filter(c => c.age <= filterAge)
                          .filter(c => filterBySelectedDistrict(c.propertyName))
                          .map(c => (
                            <tr key={c.id} onClick={() => setSelectedItem({ type: 'guest', item: c })} style={{ cursor: 'pointer' }}>
                              <td><strong>{c.guestName}</strong></td>
                              <td>{c.nationality}</td>
                              <td>{c.idType}</td>
                              <td>{c.propertyName}</td>
                              <td>{c.age}</td>
                              <td>
                                <span className={`status-indicator ${c.status}`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. ALERTS SCREEN */}
            {currentTab === 'alerts' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>Active Alarms & Threat Stream</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Severity</th>
                        <th>Alarms category</th>
                        <th>Event Log details</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.alerts.map(a => (
                        <tr key={a.id}>
                          <td>
                            <span className={`status-indicator ${a.severity === 'critical' ? 'flagged' : (a.severity === 'warning' ? 'pending' : 'verified')}`} style={{ textTransform: 'uppercase' }}>
                              {a.severity}
                            </span>
                          </td>
                          <td className="mono-id">{a.type}</td>
                          <td>{a.message}</td>
                          <td>{a.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 7. WATCHLIST SCREEN */}
            {currentTab === 'watchlist' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ borderLeft: '4px solid var(--danger)' }}>
                <div className="panel-header">
                  <h3 style={{ color: 'var(--danger)' }}>Watchlist Critical suspect matching database</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Photo</th>
                        <th>Suspect Name</th>
                        <th>Origin nationality</th>
                        <th>Identity Code</th>
                        <th>Watchlist warning detail</th>
                        <th>Action dispatch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.liveCheckins.filter(c => c.watchlistMatch).filter(c => filterBySelectedDistrict(c.propertyName)).map(c => (
                        <tr key={c.id} onClick={() => setSelectedItem({ type: 'guest', item: c })} style={{ cursor: 'pointer' }}>
                          <td><img src={c.photo} style={{ width: '30px', height: '30px', borderRadius: '50%' }} alt="" /></td>
                          <td><strong>{c.guestName}</strong></td>
                          <td>{c.nationality}</td>
                          <td className="mono-id">{c.idNumber}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{c.watchlistReason}</td>
                          <td onClick={e => e.stopPropagation()}>
                            <button className="btn-action-small primary" style={{ backgroundColor: 'var(--danger)', color: '#000', border: 'none', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }} onClick={() => handleEscalateGuest(c.id)}>Dispatch Patrol</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 8. BOOKINGS SCREEN */}
            {currentTab === 'bookings' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>Real-time Booking Registry logs</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Latest PG & Hotel checkins</span>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Stay Property</th>
                        <th>Guest Name</th>
                        <th>Room Number</th>
                        <th>Check-in date & time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.liveCheckins.filter(c => filterBySelectedDistrict(c.propertyName)).slice(0, 15).map(c => (
                        <tr key={c.id}>
                          <td className="mono-id">BK-{c.id.replace('CHK-', '')}</td>
                          <td>{c.propertyName}</td>
                          <td><strong>{c.guestName}</strong></td>
                          <td>Room {c.roomNumber}</td>
                          <td className="mono-id">{new Date(c.checkinTime).toLocaleString()}</td>
                          <td><span className="status-indicator Cleared">Checked-In</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 9. OCCUPANCY SCREEN */}
            {currentTab === 'occupancy' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>Facility Occupancy Capacity details</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Property name</th>
                        <th>Type</th>
                        <th>District region</th>
                        <th>Total Rooms</th>
                        <th>Occupied Rooms</th>
                        <th>Occupancy ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.properties.filter(p => filterBySelectedDistrict(p.district)).map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.type}</td>
                          <td>{p.district}</td>
                          <td>{p.totalRooms}</td>
                          <td>{p.occupiedRooms}</td>
                          <td className="mono-id">
                            <span style={{ color: p.occupiedRooms/p.totalRooms > 0.85 ? 'var(--danger)' : 'var(--text-main)', fontWeight: 'bold' }}>
                              {Math.round((p.occupiedRooms / p.totalRooms) * 100)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 10. VERIFICATIONS SCREEN */}
            {currentTab === 'verifications' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>Administrative Identity Verification Audit</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Guest</th>
                        <th>Document Type</th>
                        <th>ID Document scan preview</th>
                        <th>Verification Status</th>
                        <th>Administrative actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.liveCheckins.filter(c => filterBySelectedDistrict(c.propertyName)).slice(0, 10).map(c => (
                        <tr key={c.id}>
                          <td><strong>{c.guestName}</strong></td>
                          <td>{c.idType}</td>
                          <td>
                            <img src={c.idImage} style={{ width: '80px', height: '45px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }} alt="" />
                          </td>
                          <td><span className={`status-indicator ${c.status}`}>{c.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn-action-small primary" onClick={() => handleVerifyGuest(c.id)}>Clear</button>
                              <button className="btn-action-small" onClick={() => handleFlagGuest(c.id)}>Flag</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 11. AUDITS SCREEN */}
            {currentTab === 'audits' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>CCTV & Ground Safety Auditing</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>CCTV Camera Status</th>
                        <th>Fire safety certificate</th>
                        <th>Guard on duty details</th>
                        <th>Last automated audit</th>
                        <th>Auditing triggers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.properties.filter(p => filterBySelectedDistrict(p.district)).map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td style={{ color: p.cctvWorking ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{p.cctvWorking ? 'Online' : 'Offline'}</td>
                          <td style={{ color: p.fireSafety ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>{p.fireSafety ? 'Certified' : 'Expired'}</td>
                          <td>{p.guardDetails}</td>
                          <td className="mono-id">{p.lastAudit}</td>
                          <td>
                            <button className="btn-action-small" onClick={() => handleForceAudit(p.id)}>Test camera ping</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 12. INCIDENTS SCREEN */}
            {currentTab === 'incidents' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>Emergency SOS Panic Buttons Dispatch Room</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Incident ID</th>
                        <th>Location property</th>
                        <th>Severity Category</th>
                        <th>Reported Timeline</th>
                        <th>Officer Assigned</th>
                        <th>Dispatch status</th>
                        <th>Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.incidents.map(inc => (
                        <tr key={inc.id}>
                          <td className="mono-id"><strong>{inc.id}</strong></td>
                          <td>{inc.propertyName}</td>
                          <td style={{ color: 'var(--danger)', fontWeight: 'bold' }}>{inc.type}</td>
                          <td className="mono-id">{new Date(inc.reportedAt).toLocaleString()}</td>
                          <td>{inc.assignedOfficer}</td>
                          <td>
                            <span className={`incident-badge ${inc.status === 'Dispatch Active' ? 'dispatch' : 'resolved'}`}>
                              {inc.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {inc.status !== 'Resolved' && (
                                <button className="btn-action-small primary" onClick={() => handleResolveIncident(inc.id)}>Mark Resolved</button>
                              )}
                              <button className="btn-action-small" onClick={() => handleReassignOfficer(inc.id)}>Assign Patrol</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 13. COMPLIANCE SCREEN */}
            {currentTab === 'compliance' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>Properties Compliance ratings</h3>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>PG/Hotel Name</th>
                        <th>Address</th>
                        <th>Compliance safety score</th>
                        <th>Status</th>
                        <th>Quick actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.properties.filter(p => filterBySelectedDistrict(p.district)).map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>{p.address}</td>
                          <td>
                            <span className={`score-badge ${p.complianceScore > 85 ? 'high' : (p.complianceScore > 50 ? 'mid' : 'low')}`}>
                              {p.complianceScore}%
                            </span>
                          </td>
                          <td><span className={`status-indicator ${p.status}`}>{p.status}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn-action-small primary" onClick={() => handleVerifyProperty(p.id)}>Verify</button>
                              <button className="btn-action-small" onClick={() => handleFlagProperty(p.id)}>Flag</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* 14. REPORTS SCREEN */}
            {currentTab === 'reports' && (
              <motion.div className="reports-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Reports Header & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>AP Command Control Audits & Analytics Registry</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>System safety index compiled logs, occupancy comparisons, and patrol response tracking.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-action-large" onClick={() => openAlert("Export CSV", "Compiling security metrics into safestay_audit_log_2026.csv. Download initiated.")} style={{ padding: '6px 12px', fontSize: '11.5px', border: '1px solid var(--border-color)', width: 'auto', height: '30px' }}>
                      Export CSV
                    </button>
                    <button className="btn-action-large primary" onClick={() => openAlert("Export PDF", "Generating official AP Police Command Control Report. PDF compiled successfully.")} style={{ padding: '6px 12px', fontSize: '11.5px', width: 'auto', height: '30px' }}>
                      Export PDF Report
                    </button>
                  </div>
                </div>

                {/* KPI Metrics row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                  <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Audits Conducted</span>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', marginTop: '4px' }}>432</h4>
                    <span style={{ fontSize: '9.5px', color: 'var(--success)', fontWeight: 'bold' }}>+24% this week</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Pending Patrol Checks</span>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--warning)', marginTop: '4px' }}>6 PGs</h4>
                    <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Assigned to ground units</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Mean Compliance Score</span>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#82ca9d', marginTop: '4px' }}>94.2%</h4>
                    <span style={{ fontSize: '9.5px', color: 'var(--success)', fontWeight: 'bold' }}>✓ High Safety Standard</span>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>SOS Dispatch SLA</span>
                    <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)', marginTop: '4px' }}>4.2 min</h4>
                    <span style={{ fontSize: '9.5px', color: 'var(--danger)', fontWeight: 'bold' }}>Target: &lt; 5.0 mins</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }} className="sector-analysis-grid">
                  {/* Left Graph: District Occupancy Comparisons */}
                  <div className="glass-card graph-card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '14px', color: 'var(--text-main)' }}>District Occupancy & Security Density</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 10px', height: '170px' }}>
                      {data.districts.map(d => (
                        <div key={d.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '10px' }}>
                          <div style={{ position: 'relative', width: '28px', height: '100px', backgroundColor: 'var(--bg-input)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                            <div style={{ 
                              position: 'absolute', 
                              bottom: 0, 
                              left: 0, 
                              width: '100%', 
                              height: `${d.occupancy}%`, 
                              background: d.occupancy > 78 ? 'linear-gradient(to top, var(--danger), #f87171)' : 'linear-gradient(to top, var(--primary), #82ca9d)',
                              borderRadius: '4px'
                            }}></div>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: 'bold' }}>{d.id.replace('AP-', '')}</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{d.occupancy}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel: Accommodations Safety Distributions */}
                  <div className="glass-card graph-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '14px', color: 'var(--text-main)' }}>Safety & Compliance Distributions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                          <span>Paying Guest Hostels (PGs)</span>
                          <span style={{ color: 'var(--primary)' }}>60% • High Audits</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '60%', height: '100%', backgroundColor: 'var(--primary)' }}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                          <span>Verified Hotels</span>
                          <span style={{ color: 'var(--success)' }}>30% • Monthly Sweep</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '30%', height: '100%', backgroundColor: 'var(--success)' }}></div>
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                          <span>Guesthouses</span>
                          <span style={{ color: 'var(--warning)' }}>10% • Bi-Weekly Sweep</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: '10%', height: '100%', backgroundColor: 'var(--warning)' }}></div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                      <button 
                        className="btn-action-large success" 
                        onClick={() => openAlert("Safety Audit", "Initiating system-wide compliance sweep. Estimated time: 45 seconds.")}
                        style={{ flex: 1, fontSize: '11px', height: '30px' }}
                      >
                        Run Safety Audit Sweep
                      </button>
                    </div>
                  </div>
                </div>

                {/* Safety Violations Log Table */}
                <div className="glass-card table-container">
                  <div className="panel-header">
                    <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)' }}>Flagged Safety Violations Log (Real-time Warnings)</h3>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Latest telemetry warning logs</span>
                  </div>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Property Name</th>
                          <th>Violation Type</th>
                          <th>Recorded Time</th>
                          <th>Severity</th>
                          <th>Quick Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { property: 'Sri Krishna Luxury Stay', type: 'CCTV Camera Offline', time: '14 mins ago', severity: 'Critical', color: 'var(--danger)' },
                          { property: 'Venkata Sai Women PG', type: 'Panic Button Triggered', time: '2 mins ago', severity: 'Critical', color: 'var(--danger)' },
                          { property: 'Elite Residency for Ladies', type: 'Expired Fire Certificate', time: '1 hour ago', severity: 'Warning', color: 'var(--warning)' },
                          { property: 'Sri Venkateswara Boys PG', type: 'Document Re-upload Needed', time: '3 hours ago', severity: 'Review', color: 'var(--text-muted)' },
                          { property: 'New Capital Guest Stay', type: 'Unregistered Foreign Tenant', time: '5 hours ago', severity: 'Critical', color: 'var(--danger)' }
                        ].map((v, i) => (
                          <tr key={i}>
                            <td><strong>{v.property}</strong></td>
                            <td>{v.type}</td>
                            <td className="mono-id">{v.time}</td>
                            <td>
                              <span style={{ color: v.color, fontWeight: 'bold', fontSize: '11px' }}>
                                {v.severity}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button className="btn-action-small primary" onClick={() => openAlert("Officer Dispatch", `Command patrol vehicle AP-PATROL-04 routed to ${v.property} for physical safety audit.`)}>Dispatch Patrol</button>
                                <button className="btn-action-small" onClick={() => openAlert("Warning Sent", `Automated notice regarding '${v.type}' dispatched to property owner.`)}>Send Warning</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </motion.div>
            )}

            {/* 15. USERS SCREEN */}
            {currentTab === 'users' && (
              <motion.div className="glass-card table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="panel-header">
                  <h3>Full Occupant Manifest lists</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 10px' }}>
                    <Search size={12} color="var(--text-muted)" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '12px', outline: 'none', width: '200px' }}
                    />
                  </div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Guest Profile</th>
                        <th>Identity Credentials</th>
                        <th>Phone</th>
                        <th>Origin Nationality</th>
                        <th>Property location</th>
                        <th>Age</th>
                        <th>Verification Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.liveCheckins.filter(searchFilter).filter(c => filterBySelectedDistrict(c.propertyName)).map(c => (
                        <tr key={c.id} onClick={() => setSelectedItem({ type: 'guest', item: c })} style={{ cursor: 'pointer' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={c.photo} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                              <strong>{c.guestName}</strong>
                            </div>
                          </td>
                          <td>{c.idType}: {c.idNumber}</td>
                          <td>{c.phone}</td>
                          <td>{c.nationality}</td>
                          <td>{c.propertyName}</td>
                          <td>{c.age}</td>
                          <td><span className={`status-indicator ${c.status}`}>{c.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ─── ENHANCED 16. SETTINGS SCREEN WITH INTERACTIVE CONTROLS ─── */}
            {currentTab === 'settings' && (
              <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'visible' }}>
                <div className="panel-header">
                  <h3>System Settings & Administrative Controls</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Secure API & Command Routing Configuration</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  
                  {/* Left Column: Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Surveillance Integration Preferences</h4>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ fontSize: '12.5px' }}>Biometric Scan Integration</strong>
                        <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Verify occupant identity against UIDAI Aadhaar registry.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={biometricEnabled} 
                        onChange={() => setBiometricEnabled(!biometricEnabled)}
                        style={{ width: '34px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ fontSize: '12.5px' }}>Auto-Dispatch Emergency Squads</strong>
                        <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Automatically assign nearest ground vehicle on critical SOS.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={autoDispatchEnabled} 
                        onChange={() => setAutoDispatchEnabled(!autoDispatchEnabled)}
                        style={{ width: '34px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ fontSize: '12.5px' }}>Facial Recognition Check-in scan</strong>
                        <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Enable automated camera matching at PG entry gates.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={facialRecognition} 
                        onChange={() => setFacialRecognition(!facialRecognition)}
                        style={{ width: '34px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ fontSize: '12.5px' }}>WhatsApp / SMS Alerts Notifications</strong>
                        <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>Send automatic dispatch alerts to district inspectors.</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={whatsappAlerts} 
                        onChange={() => setWhatsappAlerts(!whatsappAlerts)}
                        style={{ width: '34px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                    </div>

                    <div style={{ padding: '10px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '12.5px' }}>Patrol Dispatch Range Radius</strong>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{dispatchRadius} km</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="15" 
                        value={dispatchRadius} 
                        onChange={e => setDispatchRadius(parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                      />
                    </div>
                  </div>

                  {/* Right Column: Inputs & Commands */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Command Routing Details</h4>
                    
                    <div className="filter-group">
                      <label style={{ fontSize: '10.5px', fontWeight: 'bold' }}>COMMAND CONTROL CENTER CODE</label>
                      <input 
                        type="text" 
                        className="filter-input" 
                        value={stationCode} 
                        onChange={e => setStationCode(e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                      />
                    </div>

                    <div className="filter-group">
                      <label style={{ fontSize: '10.5px', fontWeight: 'bold' }}>SECURE ACCESS SECURITY KEY</label>
                      <input 
                        type="password" 
                        className="filter-input" 
                        value={apiKey} 
                        onChange={e => setApiKey(e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                      />
                    </div>

                    <div className="filter-group">
                      <label style={{ fontSize: '10.5px', fontWeight: 'bold' }}>REAL-TIME DATA REFRESH FREQUENCY</label>
                      <select 
                        className="filter-select" 
                        value={syncInterval} 
                        onChange={e => setSyncInterval(e.target.value)}
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                      >
                        <option value="5s">5 Seconds (Ultra-Fast)</option>
                        <option value="10s">10 Seconds</option>
                        <option value="30s">30 Seconds (Standard)</option>
                        <option value="60s">60 Seconds</option>
                      </select>
                    </div>

                    {/* MOCK DATA INTEGRATIONS AND WORKFLOW ACTIONS */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '8px' }}>MOCK FLOW CONTROLS</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button 
                          className="btn-action-large warning" 
                          style={{ fontSize: '11px', height: '32px', padding: 0 }}
                          onClick={handleTriggerMockAlarm}
                        >
                          Trigger SOS Alarm
                        </button>
                        <button 
                          className="btn-action-large success" 
                          style={{ fontSize: '11px', height: '32px', padding: 0 }}
                          onClick={handleInjectMockGuest}
                        >
                          Inject Checked-In Guest
                        </button>
                        <button 
                          className="btn-action-large" 
                          style={{ fontSize: '11px', height: '32px', padding: 0, gridColumn: 'span 2', border: '1px solid var(--border-color)' }}
                          onClick={handleResetData}
                        >
                          Reset Database Logs
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '10px' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>SYSTEM THEME PREFERENCE</label>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                    <button className={`filter-chip ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')} style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', background: theme === 'dark' ? 'var(--primary)' : 'none', color: theme === 'dark' ? '#000' : 'inherit', fontWeight: 'bold' }}>Charcoal dark mode</button>
                    <button className={`filter-chip ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')} style={{ padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid var(--border-color)', background: theme === 'light' ? 'var(--primary)' : 'none', color: theme === 'light' ? '#000' : 'inherit', fontWeight: 'bold' }}>Sterile light mode</button>
                  </div>
                </div>

                {/* ─── ABAC ROLE ACCESS POLICY & CONTROL PANEL ─── */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
                      <Shield size={14} style={{ color: 'var(--primary)' }} /> Attribute-Based Access Control (ABAC) Policies
                    </h4>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Configure granular role permissions, regional jurisdiction binds, and temporal constraints for command officers.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="sector-analysis-grid">
                    
                    {/* Left Column: Authorized Officers list */}
                    <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px' }}>
                      <h5 style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>Active Security Policies</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                        {officers.map(off => (
                          <div key={off.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{off.name} <span style={{ color: 'var(--primary)', fontSize: '10px' }}>[{off.rank}]</span></div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Region Bound: <strong>{off.district}</strong> • Active: <strong>{off.shift}</strong>
                              </div>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {off.permissions.map((p, idx) => (
                                  <span key={idx} style={{ fontSize: '9px', backgroundColor: 'var(--border-color)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-main)' }}>{p}</span>
                                ))}
                              </div>
                            </div>
                            {off.id !== 1 && (
                              <button 
                                onClick={() => setOfficers(officers.filter(o => o.id !== off.id))}
                                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Column: Add Officer Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                      <h5 style={{ fontSize: '11px', fontWeight: 'bold' }}>Assign New Security Attribute Bind</h5>
                      
                      <div className="filter-group" style={{ margin: 0 }}>
                        <input 
                          type="text" 
                          placeholder="Officer Full Name" 
                          className="filter-input" 
                          value={newOfficerName} 
                          onChange={e => setNewOfficerName(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '11.5px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div className="filter-group" style={{ margin: 0 }}>
                          <select 
                            className="filter-select" 
                            value={newOfficerRank} 
                            onChange={e => setNewOfficerRank(e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          >
                            <option value="DCP">DCP (IPS)</option>
                            <option value="Inspector">Inspector</option>
                            <option value="Sub-Inspector">Sub-Inspector</option>
                            <option value="Constable">Constable</option>
                          </select>
                        </div>
                        <div className="filter-group" style={{ margin: 0 }}>
                          <select 
                            className="filter-select" 
                            value={newOfficerDistrict} 
                            onChange={e => setNewOfficerDistrict(e.target.value)}
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          >
                            <option value="NTR Vijayawada">NTR Vijayawada</option>
                            <option value="Visakhapatnam">Visakhapatnam</option>
                            <option value="Guntur City">Guntur City</option>
                            <option value="Tirupati Urban">Tirupati Urban</option>
                          </select>
                        </div>
                      </div>

                      <div className="filter-group" style={{ margin: 0 }}>
                        <select 
                          className="filter-select" 
                          value={newOfficerShift} 
                          onChange={e => setNewOfficerShift(e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '11.5px' }}
                        >
                          <option value="Day Shift (08:00 - 16:00)">Day Shift (08:00 - 16:00)</option>
                          <option value="Night Shift (16:00 - 00:00)">Night Shift (16:00 - 00:00)</option>
                          <option value="24/7 Unlimited">24/7 Unlimited</option>
                        </select>
                      </div>

                      <div className="filter-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--text-muted)', marginBottom: '4px' }}>PERMISSIONS GRANTED</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {['CCTV Access', 'Verify PG', 'Watchlist Access', 'Approve PG', 'Patrol Dispatch'].map(perm => (
                            <label key={perm} style={{ fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <input 
                                type="checkbox" 
                                checked={newOfficerPermissions.includes(perm)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setNewOfficerPermissions([...newOfficerPermissions, perm]);
                                  } else {
                                    setNewOfficerPermissions(newOfficerPermissions.filter(p => p !== perm));
                                  }
                                }}
                              />
                              {perm}
                            </label>
                          ))}
                        </div>
                      </div>

                      <button 
                        className="btn-action-large primary" 
                        onClick={() => {
                          if (!newOfficerName) { openAlert("Validation Error", "Please fill in the officer's name."); return; }
                          const nextId = officers.length > 0 ? Math.max(...officers.map(o => o.id)) + 1 : 1;
                          setOfficers([...officers, {
                            id: nextId,
                            name: newOfficerName,
                            rank: newOfficerRank,
                            district: newOfficerDistrict,
                            permissions: newOfficerPermissions,
                            shift: newOfficerShift
                          }]);
                          setNewOfficerName('');
                          setNewOfficerPermissions(['CCTV Access']);
                          openAlert("ABAC Rule Saved", `Access policy for ${newOfficerName} successfully compiled and distributed.`);
                        }}
                        style={{ height: '30px', fontSize: '11px', marginTop: '4px', width: '100%' }}
                      >
                        Authorize & Bind Officer
                      </button>
                    </div>

                  </div>

                  {/* ABAC Simulator Module */}
                  <div style={{ marginTop: '10px', padding: '14px', backgroundColor: 'rgba(200, 241, 53, 0.02)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                    <h5 style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Access Request Validator (ABAC Simulation)</h5>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Verify if an officer satisfies all attribute requirements (Rank clearance, Regional jurisdiction check, Permission list bind) to perform dashboard actions.</p>
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '10px' }} className="sector-analysis-grid">
                      <div className="filter-group" style={{ margin: 0, flex: 1 }}>
                        <label style={{ fontSize: '9px', fontWeight: 'bold' }}>SELECT OFFICER PROFILE</label>
                        <select 
                          className="filter-select" 
                          value={simOfficerId} 
                          onChange={e => { setSimOfficerId(parseInt(e.target.value)); setSimResult(null); }}
                          style={{ padding: '6px 10px', fontSize: '11.5px' }}
                        >
                          {officers.map(o => (
                            <option key={o.id} value={o.id}>{o.name} ({o.rank} - {o.district})</option>
                          ))}
                        </select>
                      </div>

                      <div className="filter-group" style={{ margin: 0, flex: 1 }}>
                        <label style={{ fontSize: '9px', fontWeight: 'bold' }}>ACTION RESOURCE TO ATTEMPT</label>
                        <select 
                          className="filter-select" 
                          value={simResource} 
                          onChange={e => { setSimResource(e.target.value); setSimResult(null); }}
                          style={{ padding: '6px 10px', fontSize: '11.5px' }}
                        >
                          <option value="Approve PG">Approve New PG Registration</option>
                          <option value="CCTV Access">Stream Real-time CCTV Channels</option>
                          <option value="Watchlist Access">Query Aadhaar Suspects Watchlist</option>
                          <option value="Verify PG">Request Ground Patrol Verification</option>
                          <option value="Patrol Dispatch">Dispatch Emergency Patrol Squad</option>
                        </select>
                      </div>

                      <button 
                        className="btn-action-large warning" 
                        onClick={() => {
                          const off = officers.find(o => o.id === simOfficerId);
                          if (!off) return;
                          
                          const hasPermission = off.permissions.includes(simResource);
                          let allowed = hasPermission;
                          let msg = "";
                          if (allowed) {
                            msg = `ACCESS GRANTED: ${off.name} clearance rank of ${off.rank} matches the resource policy for [${simResource}].`;
                          } else {
                            msg = `ACCESS DENIED: Required security bind of [${simResource}] is missing from ${off.name}'s active credentials profile.`;
                          }

                          setSimResult({ allowed, message: msg });
                        }}
                        style={{ height: '32px', fontSize: '11.5px', padding: '0 16px', width: 'auto' }}
                      >
                        Evaluate ABAC Policy
                      </button>
                    </div>

                    {simResult && (
                      <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${simResult.allowed ? 'var(--success)' : 'var(--danger)'}`, backgroundColor: simResult.allowed ? 'var(--success-subtle)' : 'var(--danger-subtle)', fontSize: '11px', color: simResult.allowed ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                        {simResult.message}
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

          </div>

          {/* ─── RIGHT RAIL (LIVE INTEL STREAM) ─── */}
          {(currentTab !== 'livemap' && currentTab !== 'search' && currentTab !== 'pg-applications' && currentTab !== 'cctv') && (
            <aside className="right-rail">
              <section className="panel-alert-stream">
                <div className="alert-stream-header">
                  <h3>Surveillance Stream</h3>
                </div>
                <div className="alert-ticker">
                  {data.alerts.slice(0, 4).map(a => (
                    <div 
                      key={a.id} 
                      className={`alert-card ${a.severity}`}
                      onClick={() => {
                        const prop = data.properties.find(p => p.id === a.propertyId);
                        if (prop) setSelectedItem({ type: 'property', item: prop });
                      }}
                    >
                      <div className="alert-icon-wrapper">
                        {a.type === 'sos' && <AlertCircle size={12} />}
                        {a.type === 'watchlist' && <Lock size={12} />}
                        {a.type === 'compliance' && <Sliders size={12} />}
                        {a.type === 'foreign' && <Eye size={12} />}
                      </div>
                      <div className="alert-body">
                        <h4>{a.type}</h4>
                        <p>{a.message}</p>
                        <div className="alert-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="incident-panel">
                <h3>Patrol Queue</h3>
                <div className="incident-list">
                  {data.incidents.slice(0, 3).map(inc => (
                    <div key={inc.id} className={`incident-card ${inc.status === 'Dispatch Active' ? 'active' : ''}`}>
                      <div className="incident-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4>{inc.type}</h4>
                        <span className={`incident-badge ${inc.status === 'Dispatch Active' ? 'dispatch' : 'resolved'}`}>
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
          )}

        </div>
      </main>

      {/* ─── EXPANDABLE GUEST / PROPERTY DETAILS DRAWER ─── */}
      <div className={`drawer ${selectedItem ? 'open' : ''}`}>
        {selectedItem && (
          <>
            <div className="drawer-close" onClick={() => setSelectedItem(null)}>
              <XCircle size={16} />
            </div>

            <div className="drawer-body">
              {selectedItem.type === 'guest' && (
                <>
                  <div className="drawer-header">
                    <img src={selectedItem.item.photo} alt="" className="drawer-photo" />
                    <div className="drawer-title-desc">
                      <h3>{selectedItem.item.guestName}</h3>
                      <p>{selectedItem.item.nationality} • Age {selectedItem.item.age}</p>
                    </div>
                  </div>

                  <div>
                    <div className="drawer-section-title">Stay Information</div>
                    <div className="info-grid">
                      <div className="info-item">
                        <h5>Stay Facility</h5>
                        <p>{selectedItem.item.propertyName}</p>
                      </div>
                      <div className="info-item">
                        <h5>Room Number</h5>
                        <p>Room {selectedItem.item.roomNumber}</p>
                      </div>
                      <div className="info-item">
                        <h5>Check-in Time</h5>
                        <p>{new Date(selectedItem.item.checkinTime).toLocaleDateString()}</p>
                      </div>
                      <div className="info-item">
                        <h5>Check-out Time</h5>
                        <p>{new Date(selectedItem.item.checkoutTime).toLocaleDateString()}</p>
                      </div>
                      <div className="info-item">
                        <h5>Gender</h5>
                        <p>{selectedItem.item.gender}</p>
                      </div>
                      <div className="info-item">
                        <h5>Occupants Count</h5>
                        <p>{selectedItem.item.guestCount} {selectedItem.item.guestCount > 1 ? 'People' : 'Person'}</p>
                      </div>
                      <div className="info-item" style={{ gridColumn: 'span 2' }}>
                        <h5>Phone Number</h5>
                        <p>{selectedItem.item.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="drawer-section-title">Identity Scans</div>
                    <div className="info-item" style={{ marginBottom: '12px' }}>
                      <h5>Scanned Document ID</h5>
                      <p className="mono-id">{selectedItem.item.idType} ({selectedItem.item.idNumber})</p>
                    </div>
                    <img src={selectedItem.item.idImage} alt="" className="id-doc-preview" />
                  </div>

                  {selectedItem.item.watchlistMatch && (
                    <div style={{ backgroundColor: 'var(--danger-subtle)', border: '1px solid var(--danger)', padding: '14px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', fontWeight: '700', fontSize: '12px', marginBottom: '4px' }}>
                        <AlertTriangle size={14} />
                        Watchlist Flag Triggered
                      </div>
                      <p style={{ fontSize: '11px', lineHeight: '1.4' }}>
                        {selectedItem.item.watchlistReason}
                      </p>
                    </div>
                  )}

                  <div className="drawer-actions">
                    <button className="btn-action-large success" onClick={() => handleVerifyGuest(selectedItem.item.id)}>
                      <CheckCircle2 size={14} /> Clear Suspect Profile
                    </button>
                    <button className="btn-action-large warning" onClick={() => handleEscalateGuest(selectedItem.item.id)}>
                      <AlertTriangle size={14} /> Escalate to Control Room
                    </button>
                    <button className="btn-action-large danger" onClick={() => handleFlagGuest(selectedItem.item.id)}>
                      <XCircle size={14} /> Flag and Suspend Account
                    </button>
                  </div>
                </>
              )}

              {selectedItem.type === 'property' && (
                <>
                  <div className="drawer-header">
                    <div className="sidebar-logo" style={{ width: '40px', height: '40px', borderRadius: '8px' }}>
                      <Building size={20} />
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
                        <h5>Owner Phone</h5>
                        <p>{selectedItem.item.ownerPhone}</p>
                      </div>
                      <div className="info-item" style={{ gridColumn: 'span 2' }}>
                        <h5>Property Address</h5>
                        <p>{selectedItem.item.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* ─── LIVE OCCUPANTS LIST PER SPECIFIC PROPERTY REQUIREMENT ─── */}
                  <div>
                    <div className="drawer-section-title" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Current Checked-In Guests ({data.liveCheckins.filter(c => c.propertyName === selectedItem.item.name).length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                      {data.liveCheckins.filter(c => c.propertyName === selectedItem.item.name).map(c => (
                        <div 
                          key={c.id} 
                          style={{ padding: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}
                        >
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <img src={c.photo} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                            <div>
                              <span style={{ fontSize: '11.5px', fontWeight: 'bold', display: 'block' }}>{c.guestName}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{c.gender} • Room {c.roomNumber} • {c.guestCount} {c.guestCount > 1 ? 'Guests' : 'Guest'}</span>
                            </div>
                            <span className={`status-indicator ${c.status}`} style={{ marginLeft: 'auto', fontSize: '9px' }}>{c.status}</span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', color: 'var(--text-secondary)', marginTop: '2px', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '4px' }}>
                            <span>In: {new Date(c.checkinTime).toLocaleDateString()}</span>
                            <span>Out: {new Date(c.checkoutTime).toLocaleDateString()}</span>
                          </div>

                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', fontSize: '9.5px' }}>
                            <span className="mono-id" style={{ color: 'var(--text-muted)' }}>Aadhaar: {c.idNumber}</span>
                            <span 
                              onClick={() => openAlert("Aadhaar Registry Check", `Aadhaar Scan ID: ${c.idNumber}\nScanned document image is validated against state police repository.`)}
                              style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                              Verify Aadhaar
                            </span>
                          </div>
                          
                          <img 
                            src={c.idImage} 
                            alt="Aadhaar ID Card Scan" 
                            style={{ width: '100%', height: '54px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)', marginTop: '4px' }}
                          />
                        </div>
                      ))}
                      {data.liveCheckins.filter(c => c.propertyName === selectedItem.item.name).length === 0 && (
                        <span style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)' }}>No active guests currently checked in.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="drawer-section-title">Security audit details</div>
                    <div className="info-grid">
                      <div className="info-item">
                        <h5>CCTV Connection</h5>
                        <p style={{ color: selectedItem.item.cctvWorking ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                          {selectedItem.item.cctvWorking ? '✓ Online' : '✗ Offline'}
                        </p>
                      </div>
                      <div className="info-item">
                        <h5>Fire Permits</h5>
                        <p style={{ color: selectedItem.item.fireSafety ? 'var(--success)' : 'var(--danger)', fontWeight: '700' }}>
                          {selectedItem.item.fireSafety ? '✓ Certified' : '✗ Expired'}
                        </p>
                      </div>
                      <div className="info-item">
                        <h5>Guards Registered</h5>
                        <p>{selectedItem.item.guardDetails}</p>
                      </div>
                      <div className="info-item">
                        <h5>Last Inspection</h5>
                        <p className="mono-id">{selectedItem.item.lastAudit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="drawer-actions">
                    <button className="btn-action-large success" onClick={() => handleVerifyProperty(selectedItem.item.id)}>
                      <Check size={14} /> Approve Registration
                    </button>
                    <button className="btn-action-large warning" onClick={() => handleFlagProperty(selectedItem.item.id)}>
                      <AlertTriangle size={14} /> Flag Security Deficit
                    </button>
                    <button className="btn-action-large danger" onClick={() => handleSuspendProperty(selectedItem.item.id)}>
                      <XCircle size={14} /> Suspend Operational License
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── COMMAND PALETTE MODAL OVERLAY ─── */}
      <AnimatePresence>
        {showCommandPalette && (
          <motion.div 
            className="command-palette-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCommandPalette(false)}
          >
            <motion.div 
              className="command-palette-modal"
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="command-palette-search-box">
                <Search size={16} />
                <input 
                  ref={commandInputRef}
                  type="text" 
                  placeholder="Type a name, nationality, or command..." 
                  value={commandSearch}
                  onChange={e => setCommandSearch(e.target.value)}
                />
                <span className="esc-badge">ESC</span>
              </div>
              <div className="command-palette-results">
                {commandSearch && (
                  <div className="results-group">
                    <div className="results-group-title">Search Results</div>
                    {filteredCommandResults.length > 0 ? (
                      filteredCommandResults.map(c => (
                        <div 
                          key={c.id} 
                          className="result-item"
                          onClick={() => {
                            setSelectedItem({ type: 'guest', item: c });
                            setShowCommandPalette(false);
                          }}
                        >
                          <Users size={14} />
                          <span>View profile: {c.guestName} ({c.propertyName})</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>No matches found for "{commandSearch}"</div>
                    )}
                  </div>
                )}

                <div className="results-group">
                  <div className="results-group-title">Navigation Commands</div>
                  <div className="result-item" onClick={() => { setCurrentTab('overview'); setShowCommandPalette(false); }}>
                    <Activity size={14} />
                    <span>Go to Command Center Overview</span>
                  </div>
                  <div className="result-item" onClick={() => { setCurrentTab('pg-applications'); setShowCommandPalette(false); }}>
                    <Clock size={14} />
                    <span>Open PG Physical Verification Registry</span>
                  </div>
                  <div className="result-item" onClick={() => { setCurrentTab('livemap'); setShowCommandPalette(false); }}>
                    <Globe size={14} />
                    <span>Open Live Geospatial Map</span>
                  </div>
                  <div className="result-item" onClick={() => { setCurrentTab('search'); setShowCommandPalette(false); }}>
                    <Search size={14} />
                    <span>Go to Advanced Search Console</span>
                  </div>
                  <div className="result-item" onClick={() => { setCurrentTab('watchlist'); setShowCommandPalette(false); }}>
                    <Lock size={14} />
                    <span>View Criminal Watchlist matches</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CUSTOM DIALOG MODAL (REPLACING NATIVE ALERTS / PROMPTS) ─── */}
      <AnimatePresence>
        {customDialog && (
          <motion.div 
            className="command-palette-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => {
              if (customDialog.type === 'alert') {
                customDialog.onConfirm('');
                setCustomDialog(null);
              }
            }}
          >
            <motion.div 
              className="command-palette-modal"
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              transition={{ duration: 0.2 }}
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', width: '90%' }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)', margin: 0 }}>{customDialog.title}</h3>
              {customDialog.message && (
                <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-line' }}>{customDialog.message}</p>
              )}

              {customDialog.type === 'prompt' && (
                <div style={{ marginTop: '4px' }}>
                  <input 
                    type="text" 
                    className="filter-input"
                    placeholder={customDialog.placeholder || "Enter details..."}
                    value={dialogInput}
                    onChange={e => setDialogInput(e.target.value)}
                    style={{ width: '100%', padding: '10px', fontSize: '12.5px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', outline: 'none' }}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        customDialog.onConfirm(dialogInput);
                        setCustomDialog(null);
                      } else if (e.key === 'Escape') {
                        setCustomDialog(null);
                      }
                    }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                {customDialog.type === 'prompt' && (
                  <button 
                    className="btn-action-large" 
                    style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', border: '1px solid var(--border-color)', height: '32px', background: 'none', color: 'var(--text-main)', cursor: 'pointer', borderRadius: '6px' }}
                    onClick={() => setCustomDialog(null)}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  className="btn-action-large success" 
                  style={{ width: 'auto', padding: '6px 14px', fontSize: '12px', height: '32px', cursor: 'pointer' }}
                  onClick={() => {
                    customDialog.onConfirm(dialogInput);
                    setCustomDialog(null);
                  }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
