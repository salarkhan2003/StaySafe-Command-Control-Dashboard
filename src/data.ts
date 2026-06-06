export interface District {
  id: string;
  name: string;
  PGs: number;
  hotels: number;
  checkins: number;
  watchlistMatches: number;
  activeSos: number;
  complianceScore: number;
  occupancy: number;
}

export interface Property {
  id: string;
  name: string;
  type: 'PG' | 'Hotel' | 'Guesthouse';
  address: string;
  district: string;
  ownerName: string;
  ownerPhone: string;
  totalRooms: number;
  occupiedRooms: number;
  complianceScore: number;
  status: 'verified' | 'pending' | 'suspended' | 'flagged';
  cctvWorking: boolean;
  fireSafety: boolean;
  guardDetails: string;
  lastAudit: string;
  // Dynamic Verification Workflow Status
  verificationStatus: 'submitted_physical' | 'police_verified' | 'approved' | 'declined' | 'docs_required';
  submittedDate: string;
  policeReportComments?: string;
  verificationOfficer?: string;
}

export interface CheckIn {
  id: string;
  guestName: string;
  age: number;
  phone: string;
  idType: string;
  idNumber: string;
  idImage: string;
  nationality: string;
  checkinTime: string;
  checkoutTime: string;
  propertyName: string;
  roomNumber: string;
  watchlistMatch: boolean;
  watchlistReason: string;
  photo: string;
  status: 'Cleared' | 'Watchlist Match' | 'Escalated' | 'Flagged';
  // Additional details taken from SafeStay AP mobile app
  gender: 'Male' | 'Female';
  guestCount: number;
}

export interface Alert {
  id: string;
  type: 'sos' | 'watchlist' | 'compliance' | 'foreign';
  message: string;
  time: string;
  severity: 'critical' | 'warning' | 'info';
  propertyId: string;
}

export interface Incident {
  id: string;
  propertyName: string;
  district: string;
  type: string;
  reportedAt: string;
  assignedOfficer: string;
  status: 'Dispatch Active' | 'Under Investigation' | 'Resolved';
  details: string;
}

// ─── 24 PROPERTIES (PGs, HOTELS, GUESTHOUSES WITH WORKFLOW STATUSES) ───
const PROPERTIES_MOCK: Property[] = [
  { id: 'PROP-001', name: 'Venkata Sai Elite Women\'s PG', type: 'PG', address: 'Gayatri Nagar, Vijayawada', district: 'NTR Vijayawada', ownerName: 'Ramachandra Rao', ownerPhone: '+91 98480 22338', totalRooms: 45, occupiedRooms: 42, complianceScore: 96, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified (SecureForce Ltd)', lastAudit: '2026-05-18', verificationStatus: 'approved', submittedDate: '2026-04-10' },
  { id: 'PROP-002', name: 'V-Residency Luxury Coliving', type: 'PG', address: 'Madhurawada, Visakhapatnam', district: 'Visakhapatnam City', ownerName: 'V. Srinivas', ownerPhone: '+91 88970 11422', totalRooms: 120, occupiedRooms: 98, complianceScore: 78, status: 'flagged', cctvWorking: false, fireSafety: true, guardDetails: 'Pending Police Verification', lastAudit: '2026-06-01', verificationStatus: 'police_verified', submittedDate: '2026-05-12', policeReportComments: 'CCTV feed offline. Local verification completed.', verificationOfficer: 'SI M. Prasad' },
  { id: 'PROP-003', name: 'Tirumala Grand Residency', type: 'Hotel', address: 'Alipiri Road, Tirupati', district: 'Tirupati Urban', ownerName: 'K. Srinivasa Reddy', ownerPhone: '+91 99080 55421', totalRooms: 80, occupiedRooms: 72, complianceScore: 98, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified (Tirupati Guard Services)', lastAudit: '2026-05-25', verificationStatus: 'approved', submittedDate: '2026-04-18' },
  { id: 'PROP-004', name: 'Sri Krishna Luxury Stay', type: 'Guesthouse', address: 'Koretipadu, Guntur', district: 'Guntur Urban', ownerName: 'Y. Koteswara Rao', ownerPhone: '+91 91234 56789', totalRooms: 30, occupiedRooms: 20, complianceScore: 42, status: 'pending', cctvWorking: false, fireSafety: false, guardDetails: 'None Provided', lastAudit: 'Never Audited', verificationStatus: 'submitted_physical', submittedDate: '2026-06-02' },
  { id: 'PROP-005', name: 'Executive PG for Men', type: 'PG', address: 'Benz Circle, Vijayawada', district: 'NTR Vijayawada', ownerName: 'B. Venkat Rao', ownerPhone: '+91 94405 12345', totalRooms: 50, occupiedRooms: 45, complianceScore: 90, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified (AP Guards)', lastAudit: '2026-04-10', verificationStatus: 'approved', submittedDate: '2026-03-20' },
  { id: 'PROP-006', name: 'Sri Sai Mansion Girls Hostel', type: 'PG', address: 'Gandhinagar, Vijayawada', district: 'NTR Vijayawada', ownerName: 'K. Lakshmi', ownerPhone: '+91 98662 44321', totalRooms: 40, occupiedRooms: 38, complianceScore: 92, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified (SecureForce Ltd)', lastAudit: '2026-05-10', verificationStatus: 'approved', submittedDate: '2026-04-05' },
  { id: 'PROP-007', name: 'Sunrise Executive Residency', type: 'Hotel', address: 'Beach Road, Visakhapatnam', district: 'Visakhapatnam City', ownerName: 'M. Anand', ownerPhone: '+91 88975 99321', totalRooms: 150, occupiedRooms: 120, complianceScore: 89, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified (Vizag Security)', lastAudit: '2026-05-30', verificationStatus: 'approved', submittedDate: '2026-04-20' },
  { id: 'PROP-008', name: 'Hill View Guesthouse', type: 'Guesthouse', address: 'Rushikonda, Visakhapatnam', district: 'Visakhapatnam City', ownerName: 'P. Harish', ownerPhone: '+91 90001 88273', totalRooms: 25, occupiedRooms: 12, complianceScore: 74, status: 'flagged', cctvWorking: false, fireSafety: true, guardDetails: 'None', lastAudit: '2026-04-20', verificationStatus: 'submitted_physical', submittedDate: '2026-06-03' },
  { id: 'PROP-009', name: 'Tirupati Guest Inn', type: 'Hotel', address: 'Kapila Theertham Road, Tirupati', district: 'Tirupati Urban', ownerName: 'J. Ramana', ownerPhone: '+91 99887 66554', totalRooms: 60, occupiedRooms: 54, complianceScore: 94, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-05-28', verificationStatus: 'approved', submittedDate: '2026-04-22' },
  { id: 'PROP-010', name: 'Temple View Residency', type: 'PG', address: 'Bypass Road, Tirupati', district: 'Tirupati Urban', ownerName: 'S. K. Prasad', ownerPhone: '+91 91102 33445', totalRooms: 70, occupiedRooms: 63, complianceScore: 81, status: 'pending', cctvWorking: true, fireSafety: false, guardDetails: 'Pending Audit', lastAudit: 'Never Audited', verificationStatus: 'submitted_physical', submittedDate: '2026-06-04' },
  { id: 'PROP-011', name: 'Guntur Executive PG for Men', type: 'PG', address: 'Nagarampalem, Guntur', district: 'Guntur Urban', ownerName: 'Ch. Ramaiah', ownerPhone: '+91 95502 99882', totalRooms: 55, occupiedRooms: 49, complianceScore: 87, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-05-15', verificationStatus: 'approved', submittedDate: '2026-04-12' },
  { id: 'PROP-012', name: 'Kurnool Palace Hotel', type: 'Hotel', address: 'Old Town, Kurnool', district: 'Kurnool District', ownerName: 'K. V. Subba Reddy', ownerPhone: '+91 94402 77321', totalRooms: 100, occupiedRooms: 80, complianceScore: 92, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-05-22', verificationStatus: 'approved', submittedDate: '2026-04-01' },
  { id: 'PROP-013', name: 'Royal Inn Kurnool', type: 'Hotel', address: 'Bellary Road, Kurnool', district: 'Kurnool District', ownerName: 'N. Raghavendra', ownerPhone: '+91 98490 88273', totalRooms: 50, occupiedRooms: 30, complianceScore: 55, status: 'suspended', cctvWorking: false, fireSafety: false, guardDetails: 'Suspended Audit', lastAudit: '2026-05-02', verificationStatus: 'declined', submittedDate: '2026-05-10' },
  { id: 'PROP-014', name: 'Ananthapuram Guest House', type: 'Guesthouse', address: 'Subash Road, Anantapuramu', district: 'Anantapuramu', ownerName: 'G. Suresh', ownerPhone: '+91 93902 33211', totalRooms: 35, occupiedRooms: 22, complianceScore: 83, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-05-20', verificationStatus: 'approved', submittedDate: '2026-04-15' },
  { id: 'PROP-015', name: 'Golden Stay Coliving PG', type: 'PG', address: 'JNTU Road, Anantapuramu', district: 'Anantapuramu', ownerName: 'S. Saleem', ownerPhone: '+91 99665 11002', totalRooms: 90, occupiedRooms: 85, complianceScore: 95, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-05-26', verificationStatus: 'approved', submittedDate: '2026-04-28' },
  { id: 'PROP-016', name: 'Vijayawada Grand Plaza', type: 'Hotel', address: 'Eluru Road, Vijayawada', district: 'NTR Vijayawada', ownerName: 'K. Venkat', ownerPhone: '+91 94401 22938', totalRooms: 140, occupiedRooms: 110, complianceScore: 97, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-06-03', verificationStatus: 'approved', submittedDate: '2026-05-01' },
  { id: 'PROP-017', name: 'Vizag Sea Shells Residency', type: 'PG', address: 'MVP Colony, Visakhapatnam', district: 'Visakhapatnam City', ownerName: 'T. Rama Rao', ownerPhone: '+91 88972 55331', totalRooms: 80, occupiedRooms: 75, complianceScore: 91, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-05-29', verificationStatus: 'approved', submittedDate: '2026-05-05' },
  { id: 'PROP-018', name: 'Amaravathi Executive Hostels', type: 'PG', address: 'Vidyanagar, Guntur', district: 'Guntur Urban', ownerName: 'B. Shiva', ownerPhone: '+91 90521 33441', totalRooms: 65, occupiedRooms: 58, complianceScore: 84, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-05-14', verificationStatus: 'approved', submittedDate: '2026-05-08' },
  { id: 'PROP-019', name: 'Rayalaseema Mansion PG', type: 'PG', address: 'Nandyal Road, Kurnool', district: 'Kurnool District', ownerName: 'M. Chenna Reddy', ownerPhone: '+91 99081 22331', totalRooms: 75, occupiedRooms: 60, complianceScore: 79, status: 'flagged', cctvWorking: false, fireSafety: true, guardDetails: 'Pending Check', lastAudit: '2026-05-11', verificationStatus: 'police_verified', submittedDate: '2026-05-20', policeReportComments: 'Fire drills pending. Local review complete.', verificationOfficer: 'ASI K. Ramudu' },
  { id: 'PROP-020', name: 'Sri Tirumala Luxury Coliving', type: 'PG', address: 'Renigunta Road, Tirupati', district: 'Tirupati Urban', ownerName: 'P. Subbarayudu', ownerPhone: '+91 94409 88771', totalRooms: 110, occupiedRooms: 95, complianceScore: 93, status: 'verified', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: '2026-05-27', verificationStatus: 'approved', submittedDate: '2026-05-02' },
  // Additional Properties to exceed 20+ PGs and include all statuses
  { id: 'PROP-021', name: 'Elite Residency for Ladies', type: 'PG', address: 'Sujatha Nagar, Visakhapatnam', district: 'Visakhapatnam City', ownerName: 'K. Suneetha', ownerPhone: '+91 88972 99001', totalRooms: 35, occupiedRooms: 0, complianceScore: 60, status: 'pending', cctvWorking: true, fireSafety: false, guardDetails: 'Not Verified', lastAudit: 'Never Audited', verificationStatus: 'submitted_physical', submittedDate: '2026-06-04' },
  { id: 'PROP-022', name: 'Royal PG for Men', type: 'PG', address: 'Vidya Nagar, Guntur', district: 'Guntur Urban', ownerName: 'A. Subba Rao', ownerPhone: '+91 90521 88776', totalRooms: 48, occupiedRooms: 0, complianceScore: 72, status: 'pending', cctvWorking: true, fireSafety: true, guardDetails: 'Verified', lastAudit: 'Never Audited', verificationStatus: 'police_verified', submittedDate: '2026-05-28', policeReportComments: 'Verification done. Premises fully secure.', verificationOfficer: 'SI G. Srinivasa Rao' },
  { id: 'PROP-023', name: 'Sri Venkateswara Boys PG', type: 'PG', address: 'Bypass Road, Tirupati', district: 'Tirupati Urban', ownerName: 'T. Govind', ownerPhone: '+91 94409 11223', totalRooms: 60, occupiedRooms: 0, complianceScore: 50, status: 'pending', cctvWorking: false, fireSafety: false, guardDetails: 'None', lastAudit: 'Never Audited', verificationStatus: 'docs_required', submittedDate: '2026-05-30' },
  { id: 'PROP-024', name: 'New Capital Guest Stay', type: 'Guesthouse', address: 'Amaravati Road, Guntur', district: 'Guntur Urban', ownerName: 'Ch. Venkaiah', ownerPhone: '+91 95502 33445', totalRooms: 20, occupiedRooms: 0, complianceScore: 40, status: 'pending', cctvWorking: false, fireSafety: false, guardDetails: 'None', lastAudit: 'Never Audited', verificationStatus: 'docs_required', submittedDate: '2026-06-01' }
];

// ─── GUEST NAMES ───
const GUEST_NAMES = [
  "Anudeep Kurra", "Michael Corleone", "Shaik Ameer", "Rajesh Gowd", "Vikram Malhotra",
  "Amina Khatun", "David Miller", "Sanjay Dutt", "Sarah Jenkins", "Abhishek Shah",
  "Rashid Khan", "Vijay Devarakonda", "Allu Arjun", "Ram Charan", "NTR Junior",
  "Prabhas Raju", "Kajal Aggarwal", "Samantha Ruth", "Rashmika Mandanna", "Pooja Hegde",
  "Sree Leela", "Nara Lokesh", "Pawan Kalyan", "Chiranjeevi Konidela", "Mahesh Babu",
  "Balakrishna Nandamuri", "Nagarjuna Akkineni", "Venkatesh Daggubati", "Mohan Babu", "Raghavendra Rao",
  "Rajamouli Koduri", "Keeravani Koduri", "Chithra Krishnan", "Balasubrahmanyam SP", "Susheela Pulapaka",
  "Janaki Sistla", "Rahman AR", "Ilaiyaraaja Gnanadesikan", "Harris Jayaraj", "Devi Sri Prasad",
  "Thaman Sai", "Ravi Teja", "Nithin Reddy", "Nani Ghanta", "Sharwanand Myneni",
  "Vijay Sethupathi", "Fahadh Faasil", "Dulquer Salmaan", "Prithviraj Sukumaran", "Suriya Sivakumar"
];

const NATIONALITIES = [
  "Indian", "United States", "Indian", "Indian", "United Kingdom",
  "Bangladesh", "Germany", "Indian", "Canada", "Indian",
  "Afghanistan", "Indian", "Indian", "Indian", "Indian",
  "Indian", "Indian", "Indian", "Indian", "Indian",
  "Indian", "Indian", "Indian", "Indian", "Indian",
  "Indian", "Indian", "Indian", "Indian", "Indian",
  "Indian", "Indian", "Indian", "Indian", "Indian",
  "Indian", "Indian", "Indian", "Indian", "Indian",
  "Indian", "Indian", "Indian", "Indian", "Indian",
  "Indian", "Indian", "Indian", "Indian", "Indian"
];

const CRIMINAL_REASONS = [
  "Interpol Red Notice: Narcotics Smuggling Case #892",
  "Cyber Crime Cell: Ransomware Attack and Cyber Fraud Suspect",
  "Enforcement Directorate Case: Money Laundering Allegations",
  "Local Police Warrant: Land Grabbing & Extortion Case",
  "NIA Threat Flag: Anti-National Activity and Conspiracy",
  "CB-CID Arrest Warrant: Passport Forgery & Illegal Travel Link",
  "Customs Directorate: Red-Sander Smuggling Syndicate Head",
  "State Intelligence Warning: High-profile Corporate Extortion",
  "DRI Warning: Gold Smuggling Syndicate Member",
  "CCB Bangalore: Illegal Cricket Betting & Hawala Operations"
];

const generateCheckins = (): CheckIn[] => {
  const checkins: CheckIn[] = [];
  for (let i = 0; i < 50; i++) {
    const name = GUEST_NAMES[i % GUEST_NAMES.length];
    const age = 21 + ((i * 13) % 40);
    const nationality = NATIONALITIES[i % NATIONALITIES.length];
    
    // Distribute checkins over first 20 properties
    const prop = PROPERTIES_MOCK[i % 20];
    
    // Set exactly 17 as watchlist criminal matches (every 3rd index)
    const isWatchlist = i % 3 === 0;
    const watchlistReason = isWatchlist ? CRIMINAL_REASONS[i % CRIMINAL_REASONS.length] : "";
    const status = isWatchlist 
      ? 'Watchlist Match' 
      : (i % 7 === 1 ? 'Escalated' : (i % 7 === 2 ? 'Flagged' : 'Cleared'));

    checkins.push({
      id: `CHK-${2026 - i}`,
      guestName: name,
      age: age,
      phone: `+91 9${i % 10}848 2233${i % 10}`,
      idType: i % 2 === 0 ? 'Aadhar Card' : 'Passport',
      idNumber: i % 2 === 0 ? `9834 8832 990${i}` : `Z88921${20 + i}`,
      idImage: i % 2 === 0 
        ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
      nationality: nationality,
      checkinTime: new Date(Date.now() - (i * 4 * 3600000) - 86400000 * 3).toISOString(),
      checkoutTime: new Date(Date.now() + 86400000 * (5 + (i % 7))).toISOString(),
      propertyName: prop.name,
      roomNumber: `${100 + (i % 15)}`,
      watchlistMatch: isWatchlist,
      watchlistReason: watchlistReason,
      photo: i % 2 === 0
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80',
      status: status,
      gender: i % 2 === 0 ? 'Female' : 'Male',
      guestCount: (i % 3) + 1
    });
  }
  return checkins;
};

// --- INITIAL DISTRIBUTED ALERTS ---
const generateAlerts = (): Alert[] => {
  return [
    { id: 'ALT-101', type: 'sos', message: 'Active SOS Alert triggered from Venkata Sai Elite Women\'s PG (Vijayawada)', time: '2 mins ago', severity: 'critical', propertyId: 'PROP-001' },
    { id: 'ALT-102', type: 'watchlist', message: 'Watchlist match detected: Michael Corleone (US National) at Tirumala Grand Residency', time: '14 mins ago', severity: 'warning', propertyId: 'PROP-003' },
    { id: 'ALT-103', type: 'compliance', message: 'Critical compliance drop: Sri Krishna Luxury Stay score dropped below 50%', time: '1 hour ago', severity: 'warning', propertyId: 'PROP-004' },
    { id: 'ALT-104', type: 'foreign', message: 'Foreign national check-in: Amina Khatun (Bangladesh) at Sunrise Executive Residency', time: '14 mins ago', severity: 'info', propertyId: 'PROP-007' }
  ];
};

// --- INITIAL INCIDENTS Patrolling logs ---
const generateIncidents = (): Incident[] => {
  return [
    {
      id: 'INC-2026-08',
      propertyName: 'Venkata Sai Elite Women\'s PG',
      district: 'NTR Vijayawada',
      type: 'SOS Button Triggered',
      reportedAt: '2026-06-05T19:24:00Z',
      assignedOfficer: 'Inspector Ramesh Babu (Vijayawada North)',
      status: 'Dispatch Active',
      details: 'Panic button pressed in Room 104. Ground patrol vehicle AP-16-P-0220 responding to spot check.'
    },
    {
      id: 'INC-2026-07',
      propertyName: 'V-Residency Luxury Coliving',
      district: 'Visakhapatnam City',
      type: 'Unregistered Co-Guest',
      reportedAt: '2026-06-04T11:20:00Z',
      assignedOfficer: 'SI Prasad (Madhurawada PS)',
      status: 'Under Investigation',
      details: 'Visual audit revealed discrepancy of 3 occupants who did not upload identity credentials.'
    }
  ];
};

export const INITIAL_MOCK_DATA = {
  districts: [
    { id: 'AP-VJA', name: 'NTR Vijayawada', PGs: 184, hotels: 92, checkins: 1420, watchlistMatches: 6, activeSos: 1, complianceScore: 94, occupancy: 82 },
    { id: 'AP-VSKP', name: 'Visakhapatnam City', PGs: 245, hotels: 154, checkins: 2180, watchlistMatches: 8, activeSos: 0, complianceScore: 92, occupancy: 78 },
    { id: 'AP-GNT', name: 'Guntur Urban', PGs: 156, hotels: 68, checkins: 1100, watchlistMatches: 3, activeSos: 2, complianceScore: 88, occupancy: 70 },
    { id: 'AP-TPT', name: 'Tirupati Urban', PGs: 112, hotels: 210, checkins: 3450, watchlistMatches: 4, activeSos: 0, complianceScore: 96, occupancy: 89 },
    { id: 'AP-KRN', name: 'Kurnool District', PGs: 74, hotels: 42, checkins: 650, watchlistMatches: 1, activeSos: 0, complianceScore: 84, occupancy: 61 },
    { id: 'AP-ANTP', name: 'Anantapuramu', PGs: 88, hotels: 38, checkins: 720, watchlistMatches: 4, activeSos: 1, complianceScore: 81, occupancy: 65 }
  ],
  properties: PROPERTIES_MOCK,
  liveCheckins: generateCheckins(),
  alerts: generateAlerts(),
  incidents: generateIncidents()
};
