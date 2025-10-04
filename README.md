# Satellite MissionPlanner

**Satellite MissionPlanner** is a modern, map-centric web application for planning, visualizing, and managing Unmanned Aerial Vehicle (UAV) missions. It integrates live weather data, realistic telemetry simulation, and a suite of professional planning tools into an intuitive, responsive interface powered by Google Maps.

![Satellite MissionPlanner Screenshot](https://storage.googleapis.com/aai-web-samples/apps/mission-planner.png)

---

## Key Features

- **Interactive Map Canvas**: Plan missions directly on a high-resolution Google Maps satellite view.
- **Advanced Mission Planning**:
  - Add, edit, and delete waypoints with precise control over location, altitude, and speed.
  - Define polygonal mission boundaries for safe operational areas.
  - Set a dedicated home position for return-to-launch procedures.
  - **Terrain-Aware Planning**:
    - **Live Elevation Data**: Automatically fetches ground elevation for each waypoint.
    - **Altitude Toggle (AGL/MSL)**: Plan flights relative to the ground (Above Ground Level) or a fixed altitude (Mean Sea Level).
    - **Terrain Profile Chart**: Instantly visualize your flight path against the underlying terrain for enhanced safety.
- **Real-time Flight Simulation**:
  - Visualize the mission with a realistic telemetry overlay.
  - The drone icon moves smoothly along the path at user-defined speeds.
  - Battery and signal strength degrade dynamically based on distance and flight time.
- **Safety & Validation**:
  - **Live Plan Validation**: The editor provides real-time warnings for common issues like unsafe altitudes, duplicate waypoints, and missions exceeding estimated battery life.
  - **Altitude Safety Alerts**: During simulation, a prominent banner provides critical alerts if the drone breaches predefined altitude safety limits.
- **Live Weather Integration**:
  - Fetches and displays current METAR/TAF data.
  - Provides a 5-day forecast with temperature, humidity, precipitation, and **wind speed/direction**.
  - Displays critical government-issued weather alerts (e.g., high wind warnings).
- **Mission Management**:
  - Save and load multiple missions directly in the browser.
  - Export mission plans to common formats: **GeoJSON, KML, CSV, a printable PDF Mission Brief**, and a **terrain-aware MAVLink plan**.
- **Polished UI/UX**:
  - **Dual Unit System**: Toggle the entire application's display between Imperial (feet) and Metric (meters).
  - A clean, modern, dark-themed interface.
  - Responsive design for both desktop and mobile use.
  - Custom map controls, tooltips, and intuitive editors for a seamless user experience.

---

## Getting Started & Troubleshooting

### Prerequisites

You need API keys from two services to enable all features. Both services offer generous free tiers suitable for development and personal use.

1.  **Google Maps Platform**: Required for the map display, location search, and terrain elevation data.
2.  **OpenWeather**: Required for live weather forecasts and alerts.

### Setup Instructions

1.  **Clone or download the project files.**

2.  **Get API Keys:**
    *   **Google Maps API Key**:
        1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
        2.  Create a new project and **enable billing** (this is required by Google, but you will almost certainly stay within the generous free tier).
        3.  Enable these three APIs: **Maps JavaScript API**, **Places API**, and **Elevation API**.
        4.  Go to "Credentials", create a new API key, and copy it.
        5.  **Important**: For security, restrict your key to your website's domain (or `localhost` for testing).
    *   **OpenWeather API Key**:
        1.  Go to [OpenWeatherMap](https://openweathermap.org/api) and create a free account.
        2.  Navigate to the "API keys" tab in your user dashboard.
        3.  **Crucially, you must subscribe to the "One Call by Call" plan.** The application uses the One Call 3.0 API, which requires this specific subscription. Go to the [API pricing page](https://openweathermap.org/price), find this plan, and click "Get API key". This plan is free for 1,000 calls/day and does not require payment details. A key from the default "Free" plan will *not* work and will cause an authentication error.
        4.  Copy your new API key.

3.  **Run the Application (VERY IMPORTANT):**
    *   **Do not open the `index.html` file directly in your browser.** This will cause `NetworkError` or CORS errors when the app tries to fetch API data, as browsers block such requests from `file://` URLs for security.
    *   You must serve the files using a local web server. The easiest way is with `npx`:
    *   Open your terminal, navigate to the project's root folder, and run the following command:
        ```bash
        npx serve
        ```
    *   Then, open the URL provided by the server (usually `http://localhost:3000`) in your browser.

4.  **Configure API Keys in the App:**
    1.  On the right-hand sidebar, click the **"Settings"** tab (gear icon).
    2.  Paste your **Google Maps API Key** into the first field and click "Save Key". The map will load automatically.
    3.  Paste your **OpenWeather API Key** into the second field and click "Save Key". The weather panel will now show live data.

    *Your keys are saved securely in your browser's local storage and are never transmitted elsewhere.*

---

## How to Use the Application

1.  **Search for a Location**: Use the search bar at the top of the map to find a starting point for your mission.
2.  **Plan a Mission**:
    *   In the **"Mission Editor"** tab, give your mission a name and set a home position.
    *   Click on the map to add waypoints.
    *   Click on a waypoint in the list to expand its details. Use the sliders and input fields to adjust its altitude, speed, and precise coordinates.
    -   Use the **AGL/MSL toggle** to decide if the altitude is relative to the ground or a fixed sea level.
    *   Observe the **Terrain Profile Chart** to see your flight path in relation to the ground.
    *   To define a safe flight zone, click "Draw Boundary" and draw a polygon on the map.
3.  **Validate and Simulate**:
    *   Check the "Plan Validation" section for any warnings about your flight plan.
    *   Once you have at least two waypoints, click "Start Simulation" to see a preview of the flight. Observe the telemetry data in the header.
4.  **Check the Weather**:
    *   Switch to the **"Weather"** tab to review the current conditions, forecast, and any critical alerts for the area.
5.  **Save and Export**:
    *   Go to the **"Mission Library"** tab to save your current mission.
    -   Use the export buttons to generate mission files in your desired format. All exports (MAVLink, KML, PDF, etc.) are **terrain-aware** and include the fetched ground elevation data.