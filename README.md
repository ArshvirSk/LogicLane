# LogicLane - The intelligent way to navigate urban congestion

<div align="center">

![LogicLane](frontend/banner.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)](https://nodejs.org/)
[![ML](https://img.shields.io/badge/ML-Gradient%20Boosting-purple.svg)](https://scikit-learn.org/)
[![OpenWeatherMap](https://img.shields.io/badge/Weather-OpenWeatherMap-orange.svg)](https://openweathermap.org/)

</div>

## 🌟 Overview

LogicLane is an intelligent traffic management system that leverages machine learning to predict traffic congestion patterns in real-time. The system provides route optimization, weather-based traffic analysis, and interactive visualizations to help commuters make informed travel decisions during rush hours.

### 🎯 Key Features

- **🤖 ML-Powered Predictions**: Advanced Gradient Boosting model trained on real Bangalore traffic data
- **🗺️ Interactive Route Visualization**: Real-time route plotting with 8-segment traffic analysis
- **🌤️ Weather Integration**: Automatic weather fetching with impact analysis on traffic patterns
- **📊 Real-Time Analytics**: Live traffic monitoring with congestion severity indicators
- **🛣️ Smart Route Planning**: OSRM-powered routing with ML-enhanced congestion predictions
- **📱 Responsive UI**: Modern React-based interface with Leaflet maps integration
- **⚡ Real-Time Updates**: Live traffic data with automatic refresh capabilities

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │  ML Model       │
│   (React +      │◄──►│   (Node.js +    │◄──►│  (Python +      │
│   Leaflet)      │    │   Express)      │    │   Scikit-learn) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Mapping APIs   │    │  Weather API    │    │  Traffic Data   │
│  • OSRM         │    │  OpenWeatherMap │    │  Bangalore      │
│  • Nominatim    │    │                 │    │  Dataset        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **OpenWeatherMap API Key** (free tier available)

### 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/Smart-City-Rush-Hour.git
   cd Smart-City-Rush-Hour
   ```

2. **Setup Backend**

   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**

   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Configuration**

   Create a `.env` file in the backend directory:

   ```env
   PORT=5000
   OPENWEATHER_API_KEY=your_openweathermap_api_key_here
   NODE_ENV=development
   ```

   Get your free API key from [OpenWeatherMap](https://openweathermap.org/api)

### 🏃‍♂️ Running the Application

1. **Start the Backend Server**

   ```bash
   cd backend
   npm run dev
   # Server starts on http://localhost:5000
   ```

2. **Start the Frontend Development Server**

   ```bash
   cd frontend
   npm run dev
   # Frontend starts on http://localhost:5173
   ```

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:5173`
   - The backend API will be running on `http://localhost:5000`

## 📋 Features Deep Dive

### 🤖 Machine Learning Engine

- **Algorithm**: Gradient Boosting Regressor
- **Training Data**: Real Bangalore traffic patterns with 8 key features
- **Features Used**:
  - Area/Location coordinates
  - Road type and classification
  - Weather conditions (Clear/Cloudy/Rainy)
  - Time of day and day of week
  - Roadwork activity status
  - Historical congestion patterns

### 🗺️ Interactive Traffic Map

- **Real-time route visualization** with color-coded congestion levels
- **8-segment route analysis** for detailed traffic insights
- **Interactive tooltips** showing:
  - ML prediction confidence
  - Weather impact analysis
  - Expected delays and ETA
  - Alternative route suggestions

### 🌤️ Weather Integration

- **Current weather data** from OpenWeatherMap API
- **5-day forecast** for future trip planning
- **Weather impact analysis** on traffic patterns
- **Automatic weather-based predictions** without manual input

### 📊 Traffic Analytics

- **Congestion Levels**:
  - 🟢 Low (0-39%): Free-flowing traffic
  - 🟡 Moderate (40-59%): Some delays expected
  - 🟠 Medium (60-79%): Significant congestion
  - 🔴 High (80-100%): Heavy traffic, major delays

## 🛠️ Technology Stack

### Frontend

- **React 19.1.1**: Modern UI framework
- **Leaflet**: Interactive mapping library
- **React-Leaflet**: React bindings for Leaflet
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client for API requests

### Backend

- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **Python**: ML model execution
- **Scikit-learn**: Machine learning library
- **Pandas & NumPy**: Data processing

### External APIs

- **OpenWeatherMap**: Weather data
- **OSRM**: Route optimization
- **Nominatim**: Geocoding services

## 📁 Project Structure

```
Smart-City-Rush-Hour/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── PredictionForm.jsx
│   │   │   ├── PredictionResults.jsx
│   │   │   └── UserProfile.jsx
│   │   ├── pages/             # Main application pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TrafficMap.jsx
│   │   │   └── Analytics.jsx
│   │   ├── services/          # API & authentication
│   │   │   ├── firebase.js
│   │   │   ├── AuthContext.jsx
│   │   │   └── TrafficAPI.js
│   │   └── assets/            # Static assets
│   ├── public/                # Public assets
│   └── package.json
├── backend/                   # Node.js backend API
│   ├── server.js             # Express server
│   ├── predict.py            # Python ML prediction script
│   ├── congestion_model.pkl  # Trained ML model
│   ├── encoders.pkl          # Feature encoders
│   └── package.json
└── README.md
```

## 🔄 API Endpoints

### Traffic Prediction

```
POST /api/predict
Content-Type: application/json

{
  "areaName": "Koramangala",
  "roadName": "80 Feet Road",
  "weatherConditions": "Clear",
  "roadworkActivity": "No",
  "predictionDate": "2024-12-15",
  "predictionTime": "18:00",
  "isWeekend": false
}
```

### Route Planning

```
POST /api/routes
Content-Type: application/json

{
  "origin": "Electronic City",
  "destination": "Whitefield",
  "routingService": "osrm"
}
```

## 🎮 Usage Guide

1. **🎯 Enter Prediction Details**

   - Select your starting location
   - Choose destination area and road
   - Pick date and time for travel
   - Weather is automatically fetched

2. **🗺️ View Route Analysis**

   - Interactive map shows your route
   - Color-coded segments indicate traffic levels
   - Click segments for detailed ML predictions

3. **📊 Analyze Results**

   - View congestion percentages
   - Check estimated delays
   - Get route recommendations

4. **⚡ Real-Time Updates**
   - Live weather integration
   - Dynamic route recalculation
   - Updated traffic predictions

## 🧪 Model Performance

- **Algorithm**: Gradient Boosting Regressor
- **Training Data**: 10,000+ Bangalore traffic records
- **Accuracy**: ~85% prediction accuracy on test data
- **Features**: 8 key traffic influencing factors
- **Update Frequency**: Real-time with weather integration

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Development Team**: LogicLane Contributors
- **ML Engineering**: Advanced traffic prediction algorithms
- **UI/UX Design**: Modern, responsive interface design

## 🙏 Acknowledgments

- **OpenWeatherMap** for weather data API
- **OpenStreetMap** community for mapping data
- **OSRM** for routing services
- **Bangalore Traffic Police** for traffic pattern insights
- **React & Node.js** communities for excellent documentation

## 🐛 Known Issues & Troubleshooting

### Common Issues

1. **API Key Issues**

   - Ensure OpenWeatherMap API key is valid
   - Check API key permissions and usage limits

2. **Route Calculation Fails**

   - Verify internet connection
   - Check if locations exist in Bangalore

3. **ML Predictions Not Loading**
   - Ensure backend server is running
   - Check Python dependencies are installed

### Support

For support, please open an issue on GitHub or contact the development team.

## 🚀 Future Enhancements

- [ ] **Multi-city Support**: Expand beyond Bangalore
- [ ] **Mobile App**: React Native mobile application
- [ ] **Real-time Traffic Feeds**: Integration with live traffic APIs
- [ ] **Advanced ML Models**: Deep learning integration
- [ ] **User Preferences**: Personalized route recommendations
- [ ] **Historical Analytics**: Long-term traffic pattern analysis

---

<div align="center">

**🚦 LogicLane - The intelligent way to navigate urban congestion 🚦**

_Built with ❤️ for the Smart City Initiative_

</div>
