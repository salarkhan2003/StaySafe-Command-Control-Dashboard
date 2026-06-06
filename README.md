# 🛡️ SafeStay AP — Police Intelligence Mission Control

This is the official React + TypeScript dashboard designed for the **Andhra Pradesh Police Department** to regulate and monitor Paying Guest (PG) hostels, co-living accommodations, and student accommodations. It acts as an end-to-end command center for hospitality intelligence and emergency safety responses.

---

## 🚀 Key Features

*   **Command Center Overview**:
    *   **Geospatial Map Intelligence**: Leaflet-powered GIS map overlay with district-level markers. Features dark-themed tiles and visual safety score colors.
    *   **Live Metrics**: Live total properties, active occupants, and flagged threat matches.
    *   **District Density Rail**: Ranks districts by occupancy, verified PGs, active dispatches, and compliance levels.
*   **PGs & Hotels Registry**:
    *   Full registry of all accommodations with details on ownership, capacity stats, CCTV health, and fire compliance safety ratings.
    *   Administrative commands to approve registration permits, flag compliance issues, or suspend property operations.
*   **Live Occupant Manifest**:
    *   A real-time search table of checked-in occupants with details on check-in timestamps, rooms, nationality, and phone numbers.
    *   Includes a slide-out drawer presenting scanned government IDs (Aadhar, PAN, Passports), photos, and verification actions.
*   **Dedicated CCTV Feeds Control Center**:
    *   Unified dashboard hosting real-time video stream telemetry directly from PG accommodations.
    *   Resolution selectors (720p, 1080p, 4K Command Center Priority) and bandwidth/IP/latency diagnostics.
    *   AI Facial Auditing Simulator checking visitor biometric templates against Aadhaar blacklist indices.
*   **Command Center Audits & Reports Registry**:
    *   High-level KPI tiles tracking Audits Conducted, Pending Patrol Checks, Mean Compliance, and SOS Dispatch SLA.
    *   District occupancy comparisons and compliance distribution gauges.
    *   Safety Violations Log tracking real-time telemetry warnings with one-click Ground Dispatch routing.
*   **Attribute-Based Access Control (ABAC)**:
    *   Interactive policy manager restricting dashboard actions based on Clearance Rank (DCP, Inspector, Sub-Inspector), Regional Jurisdiction, and temporal shift constraints.
    *   ABAC Rule Simulator to evaluate mock access requests against policy attributes.

---

## 🛠️ Tech Stack

*   **Frontend Library**: React 19 (TypeScript)
*   **Build Bundler**: Vite 6
*   **Mapping Engine**: Leaflet GIS Engine (Integrated via OpenStreetMap CDN)
*   **Iconography**: Lucide React
*   **Styling**: Custom CSS Variables, glassmorphism panels, dark mode default layouts.

---

## 📦 Directory Structure

```
DASHBOARD_AP_POLICE/
├── dist/                # Production build output
├── src/
│   ├── App.tsx          # Main dashboard view & state controllers
│   ├── main.tsx         # React root element mounting
│   ├── data.ts          # Mock databases and TS types
│   └── index.css        # Premium custom CSS stylesheet
├── vanilla_backup/      # Backup of the previous HTML/JS code files
├── index.html           # HTML entry point (Leaflet scripts/link CDN)
├── package.json         # NPM dependency manifest
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite project configuration
```

---

## 💻 Local Setup & Development

1.  **Clone the directory & navigate inside**:
    ```bash
    cd DASHBOARD_AP_POLICE
    ```

2.  **Install project dependencies**:
    ```bash
    npm install
    ```

3.  **Run local development server**:
    ```bash
    npm run dev
    ```
    The dev server launches at `http://localhost:3000`.

4.  **Build production package**:
    ```bash
    npm run build
    ```
    The optimized production assets compile into the `/dist` directory.
