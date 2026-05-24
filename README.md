# LogicLane

<div align="center">

<!-- PROJECT BANNER PLACEHOLDER (1200x400) -->
![LogicLane Banner](frontend/public/banner.png)

**Navigate traffic with ML-powered precision.**

[![Live Demo Placeholder](https://img.shields.io/badge/Live_Demo-Coming_Soon-indigo.svg)](#)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![ML](https://img.shields.io/badge/ML-Gradient%20Boosting-purple.svg)](https://scikit-learn.org/)
[![OpenWeatherMap](https://img.shields.io/badge/Weather-OpenWeatherMap-orange.svg)](https://openweathermap.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

## 📌 Problem Statement

Urban congestion costs commuters countless hours and significantly increases carbon emissions. Traditional navigation apps often rely purely on current traffic speeds, failing to anticipate how weather, roadworks, and time-of-day interact to cause gridlocks. Commuters need a smarter way to plan their routes—not just based on what traffic looks like *now*, but what it will look like when they actually hit the road.

## ✨ Key Features

- **🤖 ML-Powered Congestion Predictions:** A trained Gradient Boosting Regressor model predicts traffic severity based on 8 key factors (time, weather, location, day of week) with ~85% accuracy.
- **🗺️ Interactive Route Segmentation:** Real-time route visualization using Leaflet and OSRM, breaking down trips into color-coded segments to pinpoint exact delay locations.
- **🌤️ Dynamic Weather Integration:** Automatically fetches real-time meteorological data via OpenWeatherMap to account for weather-induced traffic variations.
- **📊 Real-Time Visual Analytics:** An intuitive, dark-themed dashboard providing live traffic monitoring, ETA estimates, and alternate route suggestions.

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Tailwind CSS v4, Vite | Modern, responsive UI with interactive mapping. |
| **Maps & Routing** | Leaflet, React-Leaflet, OSRM | Open-source mapping and route optimization engines. |
| **Backend API** | Node.js, Express.js | High-performance RESTful API serving prediction data. |
| **Machine Learning** | Python, Scikit-learn, Pandas | Gradient Boosting model for traffic prediction. |
| **External APIs** | OpenWeatherMap, Nominatim | Live weather data and geocoding services. |

## 📸 Screenshots

<!-- SCREENSHOTS PLACEHOLDER SECTION -->
<div align="center">
  <img src="https://via.placeholder.com/800x450/111827/4F46E5?text=Landing+Page+Screenshot" alt="Landing Page" width="45%" />
  <img src="https://via.placeholder.com/800x450/111827/4F46E5?text=Dashboard+Screenshot" alt="Dashboard" width="45%" />
</div>

## 🚀 Local Setup Instructions

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

### 1. Clone the repository
```bash
git clone https://github.com/LogicLane/Smart-City-Rush-Hour.git
cd Smart-City-Rush-Hour
```

### 2. Setup Backend & ML Model
```bash
cd backend
npm install
# Ensure you have the Python dependencies for the ML model (scikit-learn, pandas, numpy)
# pip install scikit-learn pandas numpy
npm run dev
```
*Backend runs on http://localhost:5000*

### 3. Setup Frontend
```bash
# In a new terminal window
cd frontend
npm install
npm run dev
```
*Frontend runs on http://localhost:5173*

## 🔐 Environment Variables

Create a `.env` file in the **backend** directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Python Environment Path (adjust based on your local setup)
PYTHON_PATH=python

# Google Routes API (Optional, if using Google Maps instead of OSRM)
GOOGLE_ROUTES_API_KEY=your_google_routes_api_key_here
```

Create a `.env` file in the **frontend** directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# OpenWeatherMap (Required for weather-based traffic predictions)
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here

# Firebase Configuration (Required for Authentication)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here
```

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
