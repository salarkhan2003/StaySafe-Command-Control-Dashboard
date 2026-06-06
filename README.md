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
*   **Watchlist Threat Matrix**:
    *   Screens credentials against active warrants and Interpol databases.
    *   Allows immediate dispatch escalation to special branch units or profile clearing.
*   **Emergency SOS Panel**:
    *   Monitors panic alarms, including silent panic triggers.
    *   Displays responding patrol unit coordinates, assigned officers, and case resolution logs.
*   **Safety Compliance Console**:
    *   Provides remote audit controls to test CCTV status, fire license validity, and guard certifications.
*   **Analytics Hub**:
    *   Presents visual graphics utilizing SVG elements, including district occupancy columns, property distribution donut charts, and safety rating line trends.

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
