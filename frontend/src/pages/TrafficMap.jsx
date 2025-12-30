// TrafficMap.jsx
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { useSearchParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PredictionForm from "../components/PredictionForm";
import PredictionResults from "../components/PredictionResults";
import { toast } from "../components/Toast";
import { useAuth } from "../services/AuthContext";
import { db } from "../services/firebase";

// Add custom styles for route markers and tooltips
const routeStyles = `
  .start-marker, .end-marker {
    background: transparent !important;
    border: none !important;
    overflow: visible !important;
  }
  .start-marker .leaflet-marker-icon, .end-marker .leaflet-marker-icon {
    overflow: visible !important;
  }
  .leaflet-routing-container {
    display: none;
  }
  .route-tooltip-container {
    background: rgba(255, 255, 255, 0.95) !important;
    border: 2px solid #3B82F6 !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2), 0 4px 10px rgba(59, 130, 246, 0.1) !important;
    padding: 10px 14px !important;
    min-width: 200px !important;
    backdrop-filter: blur(10px) !important;
    transition: all 0.2s ease-in-out !important;
  }
  .route-tooltip {
    color: #1F2937 !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
    font-weight: 500 !important;
  }
  .route-tooltip-container::before {
    border-top-color: #3B82F6 !important;
  }
  .route-tooltip-container:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25), 0 6px 15px rgba(59, 130, 246, 0.15) !important;
  }
  .traffic-segment-tooltip-container {
    background: rgba(255, 255, 255, 0.98) !important;
    border: 2px solid #10B981 !important;
    border-radius: 10px !important;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15), 0 3px 8px rgba(16, 185, 129, 0.1) !important;
    padding: 8px 12px !important;
    min-width: 220px !important;
    backdrop-filter: blur(8px) !important;
  }
  .traffic-segment-tooltip {
    color: #1F2937 !important;
    font-family: system-ui, -apple-system, sans-serif !important;
    font-size: 12px !important;
    line-height: 1.4 !important;
  }
  .traffic-warning-marker {
    background: transparent !important;
    border: none !important;
  }
`;

// Component to fly to the new location after search
const FlyToLocation = ({ lat, lon }) => {
  const map = useMap();
  if (lat && lon) {
    map.flyTo([lat, lon], 13);
  }
  return null;
};

// Component to capture map reference
const MapRefSetter = ({ setMapRef }) => {
  const map = useMap();
  useEffect(() => {
    if (map && setMapRef) {
      setMapRef(map);
    }
  }, [map, setMapRef]);
  return null;
};

// Helper functions for traffic visualization
const getCongestionColor = (level) => {
  if (level >= 80) return "#DC2626"; // Red - Heavy traffic
  if (level >= 60) return "#EA580C"; // Orange - Medium traffic
  if (level >= 40) return "#D97706"; // Amber - Moderate traffic
  return "#16A34A"; // Green - Light traffic
};

const getTrafficWeight = (level) => {
  if (level >= 80) return 8;
  if (level >= 60) return 6;
  if (level >= 40) return 4;
  return 3;
};

const getCongestionSeverity = (level) => {
  if (level >= 80) return "High";
  if (level >= 60) return "Medium";
  if (level >= 40) return "Moderate";
  return "Low";
};

// Weather API function that considers prediction date
const fetchWeatherForDate = async (
  predictionDate,
  latitude = 12.9716,
  longitude = 77.5946
) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const API_KEY = "bb1ae91edbd801c0a95f4a93b14f7a71";

    // If prediction date is today or not provided, get current weather
    if (!predictionDate || predictionDate === today) {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
      );

      if (response.ok) {
        const weatherData = await response.json();
        const weatherCondition = weatherData.weather[0].main;

        const weatherMapping = {
          Clear: "Clear",
          Clouds: "Cloudy",
          Rain: "Rainy",
          Drizzle: "Rainy",
          Thunderstorm: "Rainy",
          Snow: "Cloudy",
          Mist: "Cloudy",
          Fog: "Cloudy",
          Haze: "Cloudy",
        };

        return {
          condition: weatherMapping[weatherCondition] || "Clear",
          temperature: Math.round(weatherData.main.temp),
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind?.speed || 0,
          source: "current",
        };
      }
    } else {
      // For future dates, try different forecast APIs based on time range
      const predDate = new Date(predictionDate);
      const todayDate = new Date(today);
      const daysDiff = Math.ceil(
        (predDate - todayDate) / (1000 * 60 * 60 * 24)
      );

      // Try 5-day forecast first (most accurate for near future)
      if (daysDiff <= 5 && daysDiff > 0) {
        try {
          const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
          );

          if (forecastResponse.ok) {
            const forecastData = await forecastResponse.json();

            // Find forecast for the specific date (closest to noon)
            const targetDate = predictionDate;
            const forecast = forecastData.list.find((item) => {
              const itemDate = new Date(item.dt * 1000)
                .toISOString()
                .split("T")[0];
              const itemHour = new Date(item.dt * 1000).getHours();
              return (
                itemDate === targetDate && itemHour >= 12 && itemHour <= 15
              );
            });

            if (forecast) {
              const weatherCondition = forecast.weather[0].main;
              const weatherMapping = {
                Clear: "Clear",
                Clouds: "Cloudy",
                Rain: "Rainy",
                Drizzle: "Rainy",
                Thunderstorm: "Rainy",
                Snow: "Cloudy",
                Mist: "Cloudy",
                Fog: "Cloudy",
                Haze: "Cloudy",
              };

              return {
                condition: weatherMapping[weatherCondition] || "Clear",
                temperature: Math.round(forecast.main.temp),
                description: forecast.weather[0].description,
                icon: forecast.weather[0].icon,
                humidity: forecast.main.humidity,
                windSpeed: forecast.wind?.speed || 0,
                source: "5-day forecast",
              };
            }
          }
        } catch (error) {
          console.warn(
            "5-day forecast failed, using seasonal prediction:",
            error
          );
        }
      }

      // For dates beyond 5 days, use seasonal weather patterns since free API only provides 5-day forecast
      console.info(
        `Date is ${daysDiff} days in future. Using seasonal prediction for ${predictionDate}`
      );

      // For dates beyond 30 days or if all forecasts fail, use seasonal patterns
      return getPredictedWeatherByDate(predictionDate);
    }

    // Fallback to default weather
    return {
      condition: "Clear",
      temperature: 25,
      description: "clear sky",
      icon: "01d",
      humidity: 50,
      windSpeed: 5,
      source: "default",
    };
  } catch (error) {
    console.error("Error fetching weather:", error);
    return getPredictedWeatherByDate(predictionDate);
  }
};

// Function to predict weather based on seasonal patterns for Bangalore
const getPredictedWeatherByDate = (predictionDate) => {
  const date = new Date(predictionDate);
  const month = date.getMonth() + 1; // 1-12

  // Bangalore seasonal weather patterns
  let condition = "Clear";
  let temperature = 25;
  let description = "clear sky";
  let icon = "01d";

  // Summer (March-May)
  if (month >= 3 && month <= 5) {
    temperature = Math.floor(Math.random() * 8) + 28; // 28-35°C
    if (Math.random() > 0.7) {
      condition = "Cloudy";
      description = "partly cloudy";
      icon = "02d";
    }
  }
  // Monsoon (June-September)
  else if (month >= 6 && month <= 9) {
    temperature = Math.floor(Math.random() * 5) + 22; // 22-26°C
    const rainChance = Math.random();
    if (rainChance > 0.4) {
      condition = "Rainy";
      description = "moderate rain";
      icon = "10d";
    } else if (rainChance > 0.2) {
      condition = "Cloudy";
      description = "overcast clouds";
      icon = "04d";
    }
  }
  // Post-monsoon (October-November)
  else if (month >= 10 && month <= 11) {
    temperature = Math.floor(Math.random() * 6) + 24; // 24-29°C
    if (Math.random() > 0.6) {
      condition = "Cloudy";
      description = "scattered clouds";
      icon = "03d";
    }
  }
  // Winter (December-February)
  else {
    temperature = Math.floor(Math.random() * 8) + 18; // 18-25°C
    if (Math.random() > 0.8) {
      condition = "Cloudy";
      description = "few clouds";
      icon = "02d";
    }
  }

  return {
    condition,
    temperature,
    description,
    icon,
    humidity: Math.floor(Math.random() * 30) + 40, // 40-70%
    windSpeed: Math.floor(Math.random() * 10) + 5, // 5-15 km/h
    source: "predicted",
  };
};

// Component to display multiple alternative routes
const AlternativeRoutesDisplay = ({ routes, startCoords, endCoords, selectedIndex, onSelectRoute, waypointCoordinates, waypoints }) => {
  const map = useMap();

  useEffect(() => {
    if (!routes || routes.length === 0 || !startCoords || !endCoords || !map) return;

    const polylines = [];
    const markers = [];

    // Route colors matching Google Maps style
    const routeColors = ["#4285F4", "#34A853", "#FBBC04"];

    // Create start marker
    const startMarker = L.marker([startCoords.lat, startCoords.lon], {
      icon: L.divIcon({
        className: "start-marker",
        html: `<div class="relative">
                 <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white z-[1000] relative">S</div>
                 <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-500"></div>
               </div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 32],
      }),
    }).addTo(map);

    markers.push(startMarker);

    // Create intermediate waypoint markers (if multi-stop route)
    if (waypointCoordinates && waypointCoordinates.length > 2 && waypoints) {
      // Skip first (start) and last (end) coordinates
      for (let i = 1; i < waypointCoordinates.length - 1; i++) {
        const coords = waypointCoordinates[i];
        const waypointMarker = L.marker([coords.lat, coords.lon], {
          icon: L.divIcon({
            className: "waypoint-marker",
            html: `<div class="relative">
                     <div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white z-[1000] relative">${i}</div>
                     <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-500"></div>
                   </div>`,
            iconSize: [32, 40],
            iconAnchor: [16, 32],
          }),
        }).addTo(map);

        // Add tooltip with waypoint name
        if (waypoints[i]) {
          waypointMarker.bindTooltip(
            `<div class="text-sm font-semibold">Stop ${i}: ${waypoints[i]}</div>`,
            { permanent: false, direction: 'top' }
          );
        }

        markers.push(waypointMarker);
      }
    }

    // Create end marker
    const endMarker = L.marker([endCoords.lat, endCoords.lon], {
      icon: L.divIcon({
        className: "end-marker",
        html: `<div class="relative">
                 <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white z-[1000] relative">D</div>
                 <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
               </div>`,
        iconSize: [32, 40],
        iconAnchor: [16, 32],
      }),
    }).addTo(map);

    markers.push(endMarker);

    // Draw each route
    routes.forEach((route, index) => {
      if (route.geometry && route.geometry.coordinates) {
        const latLngs = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);

        const isSelected = index === selectedIndex;
        const color = routeColors[index] || "#9E9E9E";

        const polyline = L.polyline(latLngs, {
          color: color,
          weight: isSelected ? 7 : 5,
          opacity: isSelected ? 0.9 : 0.6,
          className: `route-${index}`,
          interactive: true,
        }).addTo(map);

        // Add click handler to select route
        polyline.on('click', () => {
          if (onSelectRoute) {
            onSelectRoute(index);
          }
        });

        // Add tooltip showing route info
        const formatDuration = (minutes) => {
          if (!minutes || minutes < 1) return "< 1 min";
          if (minutes < 60) return `${Math.round(minutes)} min`;
          const hours = Math.floor(minutes / 60);
          const mins = Math.round(minutes % 60);
          return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        };

        const formatDistance = (meters) => {
          const km = (meters / 1000).toFixed(1);
          return `${km} km`;
        };

        const routeLabel = index === 0 ? "Fastest" : route.distance < routes[0].distance ? "Shortest" : "Alternative";

        polyline.bindTooltip(
          `<div class="text-sm font-semibold" style="color: ${color}">${routeLabel} Route</div>
           <div class="text-xs"><strong>${formatDuration(route.duration)}</strong> • ${formatDistance(route.distance)}</div>`,
          { sticky: true, className: 'route-tooltip-container' }
        );

        // Highlight on hover
        polyline.on('mouseover', function () {
          if (!isSelected) {
            this.setStyle({ weight: 6, opacity: 0.8 });
          }
        });

        polyline.on('mouseout', function () {
          if (!isSelected) {
            this.setStyle({ weight: 5, opacity: 0.6 });
          }
        });

        polylines.push(polyline);
      }
    });

    // Fit map to show all routes
    if (polylines.length > 0) {
      const group = L.featureGroup(polylines);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Cleanup
    return () => {
      polylines.forEach(p => map.removeLayer(p));
      markers.forEach(m => map.removeLayer(m));
    };
  }, [routes, startCoords, endCoords, selectedIndex, onSelectRoute, map]);

  return null;
};

// Component to handle route display
const RouteDisplay = ({ startCoords, endCoords, routeData, hideMarkers = false }) => {
  const map = useMap();

  useEffect(() => {
    if (!startCoords || !endCoords || !map) return;

    // Inject custom styles
    if (!document.getElementById("route-styles")) {
      const style = document.createElement("style");
      style.id = "route-styles";
      style.textContent = routeStyles;
      document.head.appendChild(style);
    }

    let routingControl;
    let routeLayer;
    let startMarker;
    let endMarker;

    // Create route visualization
    const createRoute = () => {
      // Create start and end markers with pointers (only if not hidden)
      if (!hideMarkers) {
        startMarker = L.marker([startCoords.lat, startCoords.lon], {
          icon: L.divIcon({
            className: "start-marker",
            html: `<div class="relative">
                     <div class="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white z-10 relative">S</div>
                     <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-500"></div>
                   </div>`,
            iconSize: [32, 40],
            iconAnchor: [16, 32],
          }),
        }).addTo(map);
      }

      if (!hideMarkers) {
        endMarker = L.marker([endCoords.lat, endCoords.lon], {
          icon: L.divIcon({
            className: "end-marker",
            html: `<div class="relative">
                     <div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white z-10 relative">D</div>
                     <div class="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
                   </div>`,
            iconSize: [32, 40],
            iconAnchor: [16, 32],
          }),
        }).addTo(map);
      }

      // If we have route geometry data, use it
      if (routeData && routeData.geometry && routeData.geometry.coordinates) {
        // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
        const latLngs = routeData.geometry.coordinates.map((coord) => [
          coord[1],
          coord[0],
        ]);

        // Calculate ETA with traffic-adjusted times
        const currentTime = new Date();
        const baseRouteDurationMinutes = routeData.duration || 0; // Duration in minutes from backend
        const segmentBaseDuration = baseRouteDurationMinutes / 8; // Each segment gets equal base time

        // Track cumulative time for accurate segment ETAs (will be updated as we process segments)
        let cumulativeTimeMinutes = 0;

        // Create route segments with ML-based traffic predictions
        const segmentLength = Math.ceil(latLngs.length / 8); // 8 segments per route
        const routeSegments = [];

        for (let i = 0; i < latLngs.length - 1; i += segmentLength) {
          const endIndex = Math.min(i + segmentLength, latLngs.length - 1);
          const segmentCoords = latLngs.slice(i, endIndex + 1);

          if (segmentCoords.length < 2) continue;

          // Get midpoint for this segment to determine area
          const midIndex = Math.floor(segmentCoords.length / 2);
          const midPoint = segmentCoords[midIndex];

          // Create segment with initial default styling (will be updated with ML prediction)
          const segment = L.polyline(segmentCoords, {
            color: "#3B82F6",
            weight: 6,
            opacity: 0.8,
          }).addTo(map);

          routeSegments.push({
            polyline: segment,
            coordinates: segmentCoords,
            midPoint: midPoint,
            index: i,
            segmentIndex: routeSegments.length,
            baseDuration: segmentBaseDuration,
          });
        }

        // Process segments with staggered requests to avoid rate limiting
        const processSegment = async (segment, index) => {
          try {
            // Add delay between requests to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, index * 800));

            let area = "Central Bangalore";
            let road = "Main Road";

            try {
              // Reverse geocode the midpoint to get area information
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 8000);

              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${segment.midPoint[0]}&lon=${segment.midPoint[1]}&addressdetails=1`,
                {
                  signal: controller.signal,
                  headers: {
                    "User-Agent": "BangaloreTrafficPulse/1.0",
                  },
                }
              );

              clearTimeout(timeoutId);

              if (response.ok) {
                const locationData = await response.json();

                area =
                  locationData.address?.suburb ||
                  locationData.address?.neighbourhood ||
                  locationData.address?.city_district ||
                  locationData.address?.town ||
                  locationData.address?.city ||
                  "Central Bangalore";

                road =
                  locationData.address?.road ||
                  locationData.address?.primary ||
                  locationData.address?.secondary ||
                  locationData.address?.trunk ||
                  "Main Road";
              }
            } catch (geocodeError) {
              console.warn(
                `Geocoding failed for segment ${index + 1}, using defaults:`,
                geocodeError.message
              );
            }

            // Get current conditions including real weather data
            const currentHour = new Date().getHours();
            const isWeekend =
              new Date().getDay() === 0 || new Date().getDay() === 6;

            // Fetch real weather data for this location based on current date
            const currentDate = new Date().toISOString().split("T")[0];
            const weatherData = await fetchWeatherForDate(
              currentDate,
              segment.midPoint[0],
              segment.midPoint[1]
            );

            // Make ML prediction for this segment
            try {
              const predictionResponse = await fetch(
                "https://logiclane.onrender.com/api/predict",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    areaName: area,
                    roadName: road,
                    weatherConditions: weatherData.condition,
                    roadworkActivity: Math.random() > 0.9 ? "Yes" : "No",
                    predictionDate: new Date().toISOString().split("T")[0],
                    predictionTime: `${currentHour
                      .toString()
                      .padStart(2, "0")}:00`,
                    isWeekend: isWeekend,
                  }),
                }
              );

              if (predictionResponse.ok) {
                const prediction = await predictionResponse.json();
                const congestionLevel =
                  prediction.prediction?.congestion ||
                  Math.floor(Math.random() * 60) + 20;

                // Calculate traffic delay for this segment
                // Formula: baseTime + (baseTime * congestion% * 0.01)
                // e.g., 10min base + (10 * 80% * 0.01) = 10 + 8 = 18min in heavy traffic
                const segmentTrafficDelay = segment.baseDuration * (congestionLevel / 100) * 1.0;
                const segmentTotalTime = segment.baseDuration + segmentTrafficDelay;

                // Add to cumulative time for this segment's ETA
                cumulativeTimeMinutes += segmentTotalTime;

                // Calculate when user will reach this segment
                const segmentEtaTime = new Date(
                  currentTime.getTime() + cumulativeTimeMinutes * 60 * 1000
                );
                const segmentEtaString = segmentEtaTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                // Update segment styling based on ML prediction
                const segmentColor = getCongestionColor(congestionLevel);
                const segmentWeight = getTrafficWeight(congestionLevel);

                segment.polyline.setStyle({
                  color: segmentColor,
                  weight: segmentWeight,
                  opacity: 0.9,
                });

                // Tooltip removed for cleaner interface

                // Add hover effects
                segment.polyline.on("mouseover", function () {
                  this.setStyle({
                    weight: segmentWeight + 2,
                    opacity: 1,
                  });
                });

                segment.polyline.on("mouseout", function () {
                  this.setStyle({
                    weight: segmentWeight,
                    opacity: 0.9,
                  });
                });

                // Add congestion markers for high-traffic segments
                if (congestionLevel >= 70) {
                  L.marker([segment.midPoint[0], segment.midPoint[1]], {
                    icon: L.divIcon({
                      className: "traffic-warning-marker",
                      html: `<div class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg animate-pulse border-2 border-white">
                              ⚠️
                             </div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12],
                    }),
                  })
                    .bindPopup(
                      `
                    <div class="traffic-warning-popup">
                      <h4 class="font-bold text-red-600 mb-2">🚨 Heavy Congestion Alert</h4>
                      <div class="space-y-1 text-sm">
                        <div><strong>Location:</strong> ${area}, ${road}</div>
                        <div><strong>ML Prediction:</strong> ${congestionLevel}% congestion</div>
                        <div><strong>Severity:</strong> ${getCongestionSeverity(
                        congestionLevel
                      )}</div>
                        <div><strong>Weather Impact:</strong> ${weatherData.condition
                      } conditions</div>
                        <div><strong>Temperature:</strong> ${weatherData.temperature}°C</div>
                        <div><strong>Traffic Delay:</strong> +${Math.round(segmentTrafficDelay)} min</div>
                        <div><strong>Segment ETA:</strong> ${segmentEtaString}</div>
                        <div><strong>Recommendation:</strong> Consider alternate route</div>
                      </div>
                    </div>
                  `
                    )
                    .addTo(map);
                }
              } else {
                console.warn(`ML prediction failed for segment ${index + 1}`);
              }
            } catch (mlError) {
              console.warn(
                `ML prediction error for segment ${index + 1}:`,
                mlError.message
              );
            }
          } catch (error) {
            console.error(
              `Error processing segment ${index + 1}:`,
              error.message
            );
          }
        };

        // Process all segments with staggered timing
        routeSegments.forEach((segment, index) => {
          processSegment(segment, index);
        });

        routeLayer = routeSegments[0]?.polyline; // Keep reference for bounds

        // Fit map to show the route
        map.fitBounds(routeLayer.getBounds().pad(0.1));
      } else {
        // Fallback to simple routing if no geometry data
        routingControl = L.Routing.control({
          waypoints: [
            L.latLng(startCoords.lat, startCoords.lon),
            L.latLng(endCoords.lat, endCoords.lon),
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          createMarker: () => null, // Don't create markers as we already have custom ones
          lineOptions: {
            styles: [
              { color: "#3B82F6", weight: 6, opacity: 0.8 },
              { color: "#1E40AF", weight: 4, opacity: 1 },
            ],
          },
        }).addTo(map);

        // Add tooltip to the routing control line when available
        routingControl.on("routesfound", function (e) {
          const routes = e.routes;
          if (routes && routes.length > 0) {
            const route = routes[0];
            const currentTime = new Date();
            const etaTime = new Date(
              currentTime.getTime() + route.summary.totalTime * 1000
            );
            const etaString = etaTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const distance = (route.summary.totalDistance / 1000).toFixed(1);
            const duration = Math.round(route.summary.totalTime / 60);

            // Find the route line and add tooltip
            setTimeout(() => {
              const routeLines = document.querySelectorAll(
                ".leaflet-routing-container ~ div .leaflet-interactive"
              );
              routeLines.forEach((line) => {
                const leafletLine =
                  map._layers[
                  Object.keys(map._layers).find(
                    (key) => map._layers[key]._path === line
                  )
                  ];
                if (leafletLine && leafletLine.bindTooltip) {
                  leafletLine.bindTooltip(
                    `<div class="route-tooltip">
                      <div class="font-semibold text-blue-800 mb-1">Route Information</div>
                      <div class="text-sm space-y-1">
                        <div><span class="font-medium">Distance:</span> ${distance} km</div>
                        <div><span class="font-medium">Duration:</span> ${duration} min</div>
                        <div><span class="font-medium">ETA:</span> ${etaString}</div>
                      </div>
                    </div>`,
                    {
                      permanent: false,
                      direction: "top",
                      offset: [0, -10],
                      className: "route-tooltip-container",
                      opacity: 0.9,
                    }
                  );
                }
              });
            }, 100);
          }
        });

        // Fit map to show entire route
        const group = new L.featureGroup([startMarker, endMarker]);
        map.fitBounds(group.getBounds().pad(0.1));
      }
    };

    createRoute();

    // Cleanup function
    return () => {
      if (routingControl && map) {
        map.removeControl(routingControl);
      }
      if (routeLayer && map) {
        map.removeLayer(routeLayer);
      }
      if (startMarker && map) {
        map.removeLayer(startMarker);
      }
      if (endMarker && map) {
        map.removeLayer(endMarker);
      }
    };
  }, [map, startCoords, endCoords, routeData]);

  return null;
};

const TrafficMap = () => {
  const [locations, setLocations] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPredictionResults, setShowPredictionResults] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // Mobile sidebar toggle

  // Alternative routes state
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Waypoints state
  const [waypoints, setWaypoints] = useState([]);
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState(null);

  // Tab state for compact sidebar
  const [activeTab, setActiveTab] = useState('predict'); // 'predict', 'info', 'locations'

  // Mobile bottom sheet state
  const [sheetHeight, setSheetHeight] = useState(0); // 0%, 50%, or 100%
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const sheetRef = useRef(null);

  // Map reference for clearing layers
  const mapRef = useRef(null);

  // Add URL search params support
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // Bottom sheet drag handlers
  const handleTouchStart = (e) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragCurrentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent scrolling while dragging
    dragCurrentY.current = e.touches[0].clientY;

    // Update transform immediately for smooth dragging
    const delta = dragCurrentY.current - dragStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${Math.max(0, delta)}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = dragCurrentY.current - dragStartY.current;

    // Reset transform and let CSS transition handle the animation
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }

    // Determine final position based on drag distance
    if (deltaY > 100) {
      // Dragged down - collapse to half or close
      if (sheetHeight === 100) {
        setSheetHeight(50);
      } else {
        setSheetHeight(0);
      }
    } else if (deltaY < -100) {
      // Dragged up - expand to half or full
      if (sheetHeight === 0) {
        setSheetHeight(50);
      } else {
        setSheetHeight(100);
      }
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragCurrentY.current = e.clientY;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    dragCurrentY.current = e.clientY;

    const delta = dragCurrentY.current - dragStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${Math.max(0, delta)}px)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = dragCurrentY.current - dragStartY.current;

    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }

    if (deltaY > 100) {
      if (sheetHeight === 100) {
        setSheetHeight(50);
      } else {
        setSheetHeight(0);
      }
    } else if (deltaY < -100) {
      if (sheetHeight === 0) {
        setSheetHeight(50);
      } else {
        setSheetHeight(100);
      }
    }
  };

  // Handle tab clicks - open sheet to 50% when clicking a tab
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (sheetHeight === 0) {
      setSheetHeight(50);
    }
  };

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, sheetHeight]);

  // Storage function for predictions and routes
  const storePredictionData = useCallback(
    async (predictionData, routeData) => {
      if (!currentUser) {
        console.log("No user logged in, skipping Firebase storage");
        return;
      }

      try {
        console.log("Storing prediction data to Firebase:", {
          predictionData,
          routeData,
        });

        // Flatten route data to avoid nested arrays issue in Firestore
        const flattenedRouteData = {
          success: routeData.success,
          routingService: routeData.routingService,
          timestamp: routeData.timestamp,
          origin: {
            address: routeData.origin?.address,
            coordinates: routeData.origin?.coordinates,
          },
          destination: {
            address: routeData.destination?.address,
            coordinates: routeData.destination?.coordinates,
          },
          route: {
            distance: routeData.route?.distance,
            duration: routeData.route?.duration,
            // Convert geometry coordinates to string to avoid nested array issue
            geometryCoordinates: routeData.route?.geometry?.coordinates
              ? JSON.stringify(routeData.route.geometry.coordinates)
              : null,
            geometryType: routeData.route?.geometry?.type,
            // Convert steps array to string to avoid nested array issue
            stepsData: routeData.route?.steps
              ? JSON.stringify(routeData.route.steps)
              : null,
            stepsCount: routeData.route?.steps?.length || 0,
          },
        };

        const docData = {
          userId: currentUser.uid,
          predictionData: predictionData,
          routeData: flattenedRouteData,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(
          collection(db, "traffic_predictions"),
          docData
        );
        console.log("Prediction data stored successfully with ID:", docRef.id);
        return docRef.id;
      } catch (error) {
        console.error("Error storing prediction data to Firebase:", error);
        throw error;
      }
    },
    [currentUser]
  );

  // Storage function for general trip data (for dashboard integration)
  const storeTripData = useCallback(
    async (tripData) => {
      if (!currentUser) {
        console.log("No user logged in, skipping trip storage");
        return;
      }

      try {
        console.log("Storing trip data to Firebase:", tripData);

        const docData = {
          userId: currentUser.uid,
          tripData: tripData,
          timestamp: serverTimestamp(),
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, "user_trips"), docData);
        console.log("Trip data stored successfully with ID:", docRef.id);
        return docRef.id;
      } catch (error) {
        console.error("Error storing trip data to Firebase:", error);
        throw error;
      }
    },
    [currentUser]
  );

  // Function to get congestion color
  const getCongestionColor = (level) => {
    if (level >= 80) return "#ff4444"; // High congestion - Red
    if (level >= 60) return "#ff8800"; // Medium congestion - Orange
    if (level >= 40) return "#ffdd00"; // Low-medium congestion - Yellow
    return "#44ff44"; // Low congestion - Green
  };

  // Function to get congestion severity text
  const getCongestionSeverity = (level) => {
    if (level >= 80) return "High";
    if (level >= 60) return "Medium";
    if (level >= 40) return "Moderate";
    return "Low";
  };

  // Geocoding function
  const getCoordinates = async (locationName) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          locationName
        )}`
      );
      const data = await res.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };
      } else {
        alert("Location not found!");
        return null;
      }
    } catch (err) {
      console.error("Error geocoding:", err);
      alert("Error fetching location");
      return null;
    }
  };

  // Handle prediction results
  const handlePredictionResult = (prediction) => {
    setCurrentPrediction(prediction);
    setShowPredictionResults(true);
    toast.success("Traffic prediction generated successfully!");
  };

  // Handle clearing all map data and routes
  const handleClearAll = () => {
    // Remove all map layers (polylines, markers) FIRST before clearing state
    if (mapRef.current) {
      mapRef.current.eachLayer((layer) => {
        // Keep only the tile layer (base map)
        if (!(layer instanceof L.TileLayer)) {
          mapRef.current.removeLayer(layer);
        }
      });
    }

    // Clear all locations and markers
    setLocations([]);

    // Clear route information
    setRouteInfo(null);

    // Clear alternative routes
    setAlternativeRoutes([]);
    setSelectedRouteIndex(0);

    // Clear prediction results
    setCurrentPrediction(null);
    setShowPredictionResults(false);
  };

  // Handle URL parameters for loading specific routes
  useEffect(() => {
    const startLocation = searchParams.get("start");
    const endLocation = searchParams.get("end");

    if (startLocation && endLocation) {
      // Auto-load route from URL parameters
      const loadRouteFromParams = async () => {
        try {
          setIsLoading(true);

          // Get coordinates for both locations
          const startCoords = await getCoordinates(startLocation);
          const endCoords = await getCoordinates(endLocation);

          if (startCoords && endCoords) {
            // Create locations array
            const routeLocations = [
              {
                name: startLocation,
                lat: startCoords.lat,
                lon: startCoords.lon,
                isPrimary: true,
                isStart: true,
              },
              {
                name: endLocation,
                lat: endCoords.lat,
                lon: endCoords.lon,
                isPrimary: true,
                isEnd: true,
              },
            ];

            setLocations(routeLocations);

            // Trigger route calculation
            const routeResponse = await fetch(
              "https://logiclane.onrender.com/api/routes",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  origin: startLocation,
                  destination: endLocation,
                  routingService: "osrm",
                }),
              }
            );

            if (routeResponse.ok) {
              const routeData = await routeResponse.json();
              if (routeData.success) {
                setRouteInfo(routeData.route);

                // Store trip data to Firebase (from dashboard clicks)
                try {
                  const tripData = {
                    startLocation: startLocation,
                    endLocation: endLocation,
                    source: "dashboard-click",
                    routeData: routeData,
                  };
                  const firebaseDocId = await storeTripData(tripData);
                  console.log(
                    "🔥 Dashboard trip stored to Firebase with ID:",
                    firebaseDocId
                  );
                } catch (firebaseError) {
                  console.error(
                    "❌ Firebase trip storage failed:",
                    firebaseError
                  );
                }
              }
            }
          }
        } catch (error) {
          console.error("Error loading route from URL params:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadRouteFromParams();
    }
  }, [searchParams, storeTripData]);

  // Fetch weather data on component mount
  useEffect(() => {
    const getWeather = async () => {
      setIsLoadingWeather(true);
      const currentDate = new Date().toISOString().split("T")[0];
      const weather = await fetchWeatherForDate(currentDate, 12.9716, 77.5946); // Bangalore coordinates
      setCurrentWeather(weather);
      setIsLoadingWeather(false);
    };

    getWeather();

    // Update weather every 10 minutes
    const weatherInterval = setInterval(getWeather, 600000);
    return () => clearInterval(weatherInterval);
  }, []);

  // Handle alternative routes selection
  const handleAlternativeRoutesUpdate = (routes, selectedIndex, routeInfoData = null) => {
    console.log("🛣️ Alternative routes updated:", routes);
    console.log("📍 Selected route index:", selectedIndex);
    setAlternativeRoutes(routes);
    if (selectedIndex !== undefined) {
      setSelectedRouteIndex(selectedIndex);
    }
    // If route info is provided (e.g., for multi-stop routes), set it
    if (routeInfoData) {
      console.log("🗺️ Setting route info:", routeInfoData);
      setRouteInfo(routeInfoData);
    }
  };

  // Handle adding ML prediction to map with route plotting
  const handleAddPredictionToMap = async (predictionData) => {
    console.log("🗺️ Find optimal route and add to map clicked!");
    console.log("📊 Prediction Data:", predictionData);

    try {
      setIsLoading(true);

      const origin = predictionData.startLocation;
      const destination = `${predictionData.area}, ${predictionData.road}`;

      // Get route data from backend API
      const routeResponse = await fetch("https://logiclane.onrender.com/api/routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          destination,
          routingService: "osrm",
        }),
      });

      if (!routeResponse.ok) {
        const errorData = await routeResponse.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Route API returned error:", errorData);
        toast.error(`Route API error: ${errorData.error || "Failed to fetch route"}`);
      }

      if (routeResponse.ok) {
        const routeData = await routeResponse.json();
        console.log("🛣️ Route API Response:", routeData);

        if (routeData.success) {
          // Fetch alternative routes
          await fetchAlternativeRoutes(origin, destination);
          toast.success("Route calculated successfully!");
          console.log("✅ Route calculation successful!");
          // Create location for destination
          const newLocation = {
            name: predictionData.name,
            startLocation: predictionData.startLocation,
            area: predictionData.area,
            road: predictionData.road,
            weather: predictionData.weather,
            roadwork: predictionData.roadwork,
            congestion: predictionData.congestion,
            severity: predictionData.severity,
            estimatedDelay: predictionData.estimatedDelay,
            recommendedAction: predictionData.recommendedAction,
            timestamp: predictionData.timestamp,
            lat: routeData.destination.coordinates.lat,
            lon: routeData.destination.coordinates.lon,
            source: "ml-prediction",
          };

          setLocations((prev) => [...prev, newLocation]);
          console.log("📍 New location added to map:", newLocation);

          // Set route information for display with real route data
          const routeInfo = {
            start: routeData.origin.coordinates,
            end: routeData.destination.coordinates,
            startLocation: predictionData.startLocation,
            destination: `${predictionData.area}, ${predictionData.road}`,
            prediction: predictionData,
            routeData: routeData.route,
            distance: routeData.route.distance,
            duration: routeData.route.duration,
          };

          setRouteInfo(routeInfo);
          console.log("🛣️ Route info set:", routeInfo);

          setSearchResult(routeData.destination.coordinates);
          console.log(
            "🎯 Search result updated:",
            routeData.destination.coordinates
          );

          // Store to Firebase
          try {
            const firebaseDocId = await storePredictionData(
              predictionData,
              routeData
            );
            console.log("🔥 Data stored to Firebase with ID:", firebaseDocId);
          } catch (firebaseError) {
            console.error("❌ Firebase storage failed:", firebaseError);
          }
        }
      } else {
        console.log("⚠️ Route API failed, falling back to geocoding");
        // Fallback to geocoding if route API fails
        const [startCoords, destCoords] = await Promise.all([
          getCoordinates(`${predictionData.startLocation}, Bangalore`),
          getCoordinates(
            `${predictionData.area}, ${predictionData.road}, Bangalore`
          ),
        ]);
        console.log("🌍 Geocoding results:", { startCoords, destCoords });

        if (startCoords && destCoords) {
          console.log(
            "✅ Geocoding successful, adding location with fallback method"
          );
          const newLocation = {
            name: predictionData.name,
            startLocation: predictionData.startLocation,
            area: predictionData.area,
            road: predictionData.road,
            weather: predictionData.weather,
            roadwork: predictionData.roadwork,
            congestion: predictionData.congestion,
            severity: predictionData.severity,
            estimatedDelay: predictionData.estimatedDelay,
            recommendedAction: predictionData.recommendedAction,
            timestamp: predictionData.timestamp,
            lat: destCoords.lat,
            lon: destCoords.lon,
            source: "ml-prediction",
          };

          setLocations((prev) => [...prev, newLocation]);
          console.log("📍 Fallback location added to map:", newLocation);

          const fallbackRouteInfo = {
            start: startCoords,
            end: destCoords,
            startLocation: predictionData.startLocation,
            destination: `${predictionData.area}, ${predictionData.road}`,
            prediction: predictionData,
          };

          setRouteInfo(fallbackRouteInfo);
          console.log("🛣️ Fallback route info set:", fallbackRouteInfo);

          setSearchResult(destCoords);
          console.log("🎯 Fallback search result updated:", destCoords);

          // Store to Firebase (fallback case)
          try {
            const fallbackRouteData = {
              success: true,
              routingService: "geocoding-fallback",
              timestamp: new Date().toISOString(),
              route: {
                distance: "N/A (geocoding fallback)",
                duration: "N/A (geocoding fallback)",
                geometryCoordinates: null,
                geometryType: null,
                stepsData: null,
                stepsCount: 0,
              },
              origin: {
                address: predictionData.startLocation,
                coordinates: startCoords,
              },
              destination: {
                address: `${predictionData.area}, ${predictionData.road}`,
                coordinates: destCoords,
              },
            };
            const firebaseDocId = await storePredictionData(
              predictionData,
              fallbackRouteData
            );
            console.log(
              "🔥 Fallback data stored to Firebase with ID:",
              firebaseDocId
            );
          } catch (firebaseError) {
            console.error(
              "❌ Firebase fallback storage failed:",
              firebaseError
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to add prediction to map:", error);
      toast.error("Failed to add prediction to map. Please try again.");
    } finally {
      setIsLoading(false);
      console.log("🏁 Add to map process completed");
    }
  };

  // Waypoint Management Functions
  const addWaypoint = (location) => {
    setWaypoints(prev => [...prev, {
      id: Date.now(),
      name: location.name || location,
      coordinates: location.coordinates || null
    }]);
    toast.success("Waypoint added");
  };

  const removeWaypoint = (index) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
    toast.info("Waypoint removed");
  };

  const handleWaypointDragStart = (index) => {
    setDraggedWaypointIndex(index);
  };

  const handleWaypointDragOver = (e) => {
    e.preventDefault();
  };

  const handleWaypointDrop = (dropIndex) => {
    if (draggedWaypointIndex === null) return;

    const updatedWaypoints = [...waypoints];
    const [draggedItem] = updatedWaypoints.splice(draggedWaypointIndex, 1);
    updatedWaypoints.splice(dropIndex, 0, draggedItem);

    setWaypoints(updatedWaypoints);
    setDraggedWaypointIndex(null);
    toast.info("Waypoints reordered");
  };

  const optimizeWaypointsRoute = async () => {
    if (waypoints.length < 2) {
      toast.warning("Add at least 2 waypoints to optimize route");
      return;
    }

    try {
      setIsLoading(true);
      toast.info("Optimizing route for multiple waypoints...");

      const response = await fetch("https://logiclane.onrender.com/api/routes/optimize-waypoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waypoints })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Reorder waypoints based on optimized order
          const optimizedWaypoints = data.optimizedOrder.map(index => waypoints[index]);
          setWaypoints(optimizedWaypoints);
          toast.success("Route optimized successfully!");
        }
      } else {
        toast.error("Could not optimize route");
      }
    } catch (error) {
      console.error("Error optimizing waypoints:", error);
      toast.error("Could not optimize route");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Alternative Routes
  const fetchAlternativeRoutes = async (origin, destination) => {
    try {
      // Fetch up to 3 alternative routes from OSRM
      const response = await fetch("https://logiclane.onrender.com/api/routes/alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin,
          destination,
          alternatives: 3
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.routes) {
          setAlternativeRoutes(data.routes);
          setSelectedRouteIndex(0);
          toast.success(`Found ${data.routes.length} route options`);
        }
      }
    } catch (error) {
      console.error("Error fetching alternative routes:", error);
      toast.error("Could not fetch alternative routes");
    }
  };


  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* Control Panel - Desktop Only Sidebar */}
      <div className="hidden lg:flex lg:w-80 h-screen bg-white dark:bg-gray-800 shadow-lg overflow-hidden border-r border-gray-200 dark:border-gray-700 flex-col">
        {/* Tab Navigation - Desktop */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setActiveTab('predict')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${activeTab === 'predict'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <svg className="w-4 h-4 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Predict
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${activeTab === 'info'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <svg className="w-4 h-4 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Info
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${activeTab === 'locations'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-gray-800'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            <svg className="w-4 h-4 mx-auto mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            Map ({locations.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Predict Tab */}
          {activeTab === 'predict' && (
            <div className="p-3">
              <PredictionForm
                onPredictionResult={handlePredictionResult}
                onLocationAdd={handleAddPredictionToMap}
                onAlternativeRoutes={handleAlternativeRoutesUpdate}
                onClearAll={handleClearAll}
              />
              {isLoading && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Plotting route...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="p-3 space-y-3">
              {/* ML Prediction Info Banner */}
              {routeInfo && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-2.5">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">AI Traffic Predictions Active</p>
                      <p className="text-xs text-purple-700 dark:text-purple-400">Route segments are being analyzed with ML. Hover over colored segments on the map to see detailed congestion predictions for each area.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Weather */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.002 4.002 0 003 15z" />
                  </svg>
                  Weather
                </h4>
                {isLoadingWeather ? (
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    Loading...
                  </div>
                ) : currentWeather ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={`https://openweathermap.org/img/w/${currentWeather.icon}.png`} alt="" className="w-8 h-8" />
                      <div>
                        <div className="text-xs font-medium text-gray-800 dark:text-white">{currentWeather.condition}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{currentWeather.description}</div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{currentWeather.temperature}°C</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 dark:text-gray-400">Unavailable</div>
                )}
              </div>

              {/* Legend */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Congestion
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Low (0-39%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Moderate (40-59%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">Medium (60-79%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">High (80-100%)</span>
                  </div>
                </div>
              </div>

              {/* Active Route */}
              {routeInfo && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-2.5 border border-blue-200 dark:border-blue-700">
                  <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Active Route</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">S</div>
                      <span className="text-gray-700 dark:text-gray-300 truncate">{routeInfo.startLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">D</div>
                      <span className="text-gray-700 dark:text-gray-300 truncate">{routeInfo.destination}</span>
                    </div>
                    {routeInfo.distance && (
                      <div className="flex justify-between pt-1.5 border-t border-blue-200 dark:border-blue-700">
                        <span className="text-blue-600 dark:text-blue-400">Distance:</span>
                        <span className="font-semibold">{(routeInfo.distance / 1000).toFixed(1)} km</span>
                      </div>
                    )}
                    {routeInfo.duration && (
                      <div className="flex justify-between">
                        <span className="text-blue-600 dark:text-blue-400">Time:</span>
                        <span className="font-semibold">{routeInfo.duration} min</span>
                      </div>
                    )}
                    <button
                      onClick={() => setRouteInfo(null)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    >
                      Clear Route
                    </button>
                  </div>
                </div>
              )}

              {/* Waypoints Section */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Waypoints ({waypoints.length})
                  </h4>
                  {waypoints.length > 1 && (
                    <button
                      onClick={optimizeWaypointsRoute}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      disabled={isLoading}
                    >
                      Optimize
                    </button>
                  )}
                </div>
                {waypoints.length > 0 ? (
                  <div className="space-y-1">
                    {waypoints.map((waypoint, index) => (
                      <div
                        key={waypoint.id}
                        draggable
                        onDragStart={() => handleWaypointDragStart(index)}
                        onDragOver={handleWaypointDragOver}
                        onDrop={() => handleWaypointDrop(index)}
                        className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600 cursor-move hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                        <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">{waypoint.name}</span>
                        <button
                          onClick={() => removeWaypoint(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">No waypoints added. Drag locations to reorder.</p>
                )}
              </div>

              {/* Alternative Routes */}
              {alternativeRoutes.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Route Options
                  </h4>
                  <div className="space-y-2">
                    {alternativeRoutes.map((route, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedRouteIndex(index)}
                        className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedRouteIndex === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-800 dark:text-white">
                            Route {index + 1}
                            {index === 0 && (
                              <span className="ml-1 px-1 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded text-xs">
                                Fastest
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {route.duration && route.duration >= 1 ? `${Math.round(route.duration)} min` : '< 1 min'}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {(route.distance / 1000).toFixed(1)} km
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="p-3">
              {locations.length > 0 ? (
                <div className="space-y-2">
                  {locations.map((loc, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="font-medium text-xs text-gray-800 dark:text-white truncate mb-1">{loc.name}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getCongestionColor(loc.congestion) }}
                        >
                          {loc.congestion}%
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {loc.severity || getCongestionSeverity(loc.congestion)}
                        </span>
                        {loc.source === "ml-prediction" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded text-xs">ML</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  type="locations"
                  title="No locations monitored"
                  description="Make a traffic prediction to see locations on the map with real-time congestion data."
                  action={() => document.querySelector('[data-tab="predict"]')?.click()}
                  actionLabel="Start Predicting"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map Section - Mobile Responsive */}
      <div className="flex-1 flex flex-col h-screen lg:h-screen">
        <div className="bg-white dark:bg-gray-800 border-b sm:flex items-center justify-between border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-3 sm:py-4 hidden">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white flex items-center flex-wrap">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            {routeInfo ? "Route Navigation" : "Traffic Map"}
            {routeInfo && (
              <span className="ml-3 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                Route Active
              </span>
            )}
          </h3>
        </div>

        <div className="flex-1">
          <div className="h-full">
            <MapContainer
              center={[12.9716, 77.5946]}
              zoom={12}
              style={{
                height: "100%",
                width: "100%",
              }}
              className="z-0"
            >
              <MapRefSetter setMapRef={(map) => (mapRef.current = map)} />
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              {/* Route Display */}
              {routeInfo && alternativeRoutes.length === 0 && (
                <RouteDisplay
                  startCoords={routeInfo.start}
                  endCoords={routeInfo.end}
                  routeData={routeInfo.routeData}
                />
              )}

              {/* Multi-route visualization with simple polylines */}
              {alternativeRoutes.length > 0 && routeInfo && (
                <AlternativeRoutesDisplay
                  routes={alternativeRoutes}
                  startCoords={routeInfo.start}
                  endCoords={routeInfo.end}
                  selectedIndex={selectedRouteIndex}
                  onSelectRoute={(index) => setSelectedRouteIndex(index)}
                  waypointCoordinates={routeInfo.waypointCoordinates}
                  waypoints={routeInfo.waypoints}
                />
              )}

              {/* Detailed ML prediction segments for selected route */}
              {alternativeRoutes.length > 0 &&
                routeInfo &&
                alternativeRoutes[selectedRouteIndex] && (
                  <RouteDisplay
                    startCoords={routeInfo.start}
                    endCoords={routeInfo.end}
                    routeData={alternativeRoutes[selectedRouteIndex]}
                    hideMarkers={true}
                  />
                )}

              {locations.map((loc, index) => (
                <Circle
                  key={index}
                  center={[loc.lat, loc.lon]}
                  radius={loc.congestion * 15}
                  pathOptions={{
                    color: getCongestionColor(loc.congestion),
                    fillColor: getCongestionColor(loc.congestion),
                    fillOpacity: 0.4,
                    weight: 3,
                  }}
                  eventHandlers={{
                    click: () => {
                      // Auto-close sidebar on mobile when location is clicked
                      if (window.innerWidth < 1024) {
                        setShowSidebar(false);
                      }
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2 sm:p-4 min-w-[200px] sm:min-w-[256px]">
                      <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-3">
                        {loc.name}
                      </h4>
                      <div className="space-y-2 sm:space-y-3">
                        {loc.startLocation && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Route:
                            </span>
                            <span className="font-medium text-blue-600">
                              {loc.startLocation} → {loc.area}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Congestion Level:
                          </span>
                          <span
                            className="font-semibold"
                            style={{
                              color: getCongestionColor(loc.congestion),
                            }}
                          >
                            {loc.congestion}% (
                            {loc.severity ||
                              getCongestionSeverity(loc.congestion)}
                            )
                          </span>
                        </div>
                        {loc.estimatedDelay && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Estimated Delay:
                            </span>
                            <span className="font-medium text-orange-600">
                              {loc.estimatedDelay}
                            </span>
                          </div>
                        )}
                        {loc.source === "ml-prediction" && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Source:
                            </span>
                            <span className="font-medium text-purple-600 flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 20 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                              </svg>
                              ML Predicted
                            </span>
                          </div>
                        )}
                        {loc.recommendedAction && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="font-semibold text-blue-800 mb-1">
                              Recommendation:
                            </div>
                            <p className="text-sm text-blue-700">
                              {loc.recommendedAction}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Circle>
              ))}

              {searchResult && (
                <FlyToLocation lat={searchResult.lat} lon={searchResult.lon} />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Prediction Results Modal */}
        {showPredictionResults && currentPrediction && (
          <PredictionResults
            prediction={currentPrediction}
            onClose={() => setShowPredictionResults(false)}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50">
        <div className="flex items-center justify-around">
          <button
            onClick={() => handleTabClick('predict')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${activeTab === 'predict'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-xs font-medium">Predict</span>
          </button>
          <button
            onClick={() => handleTabClick('info')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${activeTab === 'info'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Info</span>
          </button>
          <button
            onClick={() => handleTabClick('locations')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors ${activeTab === 'locations'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-xs font-medium">Map</span>
            {locations.length > 0 && (
              <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {locations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Sheet for Content */}
      {sheetHeight > 0 && (
        <div
          ref={sheetRef}
          className="lg:hidden fixed inset-x-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-40 transition-all duration-300 ease-out"
          style={{
            bottom: '4rem',
            height: sheetHeight === 100 ? 'calc(100vh - 8rem)' : `${sheetHeight}vh`,
            willChange: isDragging ? 'transform' : 'auto',
            touchAction: 'none'
          }}
        >
          {/* Drag Handle */}
          <div
            className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 cursor-grab active:cursor-grabbing z-10 touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center justify-center">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                {activeTab === 'predict' && 'Traffic Prediction'}
                {activeTab === 'info' && 'Route Information'}
                {activeTab === 'locations' && `Locations (${locations.length})`}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSheetHeight(sheetHeight === 50 ? 100 : 50)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label={sheetHeight === 50 ? "Expand" : "Collapse"}
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {sheetHeight === 50 ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => setSheetHeight(0)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ height: 'calc(100% - 64px)' }}>
            <div className="p-4">
              {/* Predict Tab Content */}
              {activeTab === 'predict' && (
                <div>
                  <PredictionForm
                    onPredictionResult={handlePredictionResult}
                    onLocationAdd={handleAddPredictionToMap}
                    onAlternativeRoutes={handleAlternativeRoutesUpdate}
                    onClearAll={handleClearAll}
                  />
                  {isLoading && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span className="text-xs text-blue-600 dark:text-blue-400">Plotting route...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Info Tab Content */}
              {activeTab === 'info' && (
                <div className="space-y-3">
                  {/* ML Prediction Info Banner */}
                  {routeInfo && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-2.5">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-purple-800 dark:text-purple-300 mb-1">AI Traffic Predictions Active</p>
                          <p className="text-xs text-purple-700 dark:text-purple-400">Route segments are being analyzed with ML. Tap colored segments on the map to see detailed congestion predictions.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Weather */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.002 4.002 0 003 15z" />
                      </svg>
                      Weather
                    </h4>
                    {isLoadingWeather ? (
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        Loading...
                      </div>
                    ) : currentWeather ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={`https://openweathermap.org/img/w/${currentWeather.icon}.png`} alt="" className="w-8 h-8" />
                          <div>
                            <div className="text-xs font-medium text-gray-800 dark:text-white">{currentWeather.condition}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{currentWeather.description}</div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{currentWeather.temperature}°C</div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 dark:text-gray-400">Unavailable</div>
                    )}
                  </div>

                  {/* Active Route */}
                  {routeInfo && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-2.5 border border-blue-200 dark:border-blue-700">
                      <h4 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2">Active Route</h4>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">S</div>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{routeInfo.startLocation}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">D</div>
                          <span className="text-gray-700 dark:text-gray-300 truncate">{routeInfo.destination}</span>
                        </div>
                        {routeInfo.distance && (
                          <div className="flex justify-between pt-1.5 border-t border-blue-200 dark:border-blue-700">
                            <span className="text-blue-600 dark:text-blue-400">Distance:</span>
                            <span className="font-semibold">{(routeInfo.distance / 1000).toFixed(1)} km</span>
                          </div>
                        )}
                        {routeInfo.duration && (
                          <div className="flex justify-between">
                            <span className="text-blue-600 dark:text-blue-400">Time:</span>
                            <span className="font-semibold">{routeInfo.duration} min</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Alternative Routes */}
                  {alternativeRoutes.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Route Options
                      </h4>
                      <div className="space-y-2">
                        {alternativeRoutes.map((route, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedRouteIndex(index)}
                            className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedRouteIndex === index
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                              : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-gray-800 dark:text-white">
                                Route {index + 1}
                                {index === 0 && (
                                  <span className="ml-1 px-1 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded text-xs">
                                    Fastest
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                              <span>{route.duration && route.duration >= 1 ? `${Math.round(route.duration)} min` : '< 1 min'}</span>
                              <span>{(route.distance / 1000).toFixed(1)} km</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Locations Tab Content */}
              {activeTab === 'locations' && (
                <div>
                  {locations.length > 0 ? (
                    <div className="space-y-2">
                      {locations.map((loc, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="font-medium text-xs text-gray-800 dark:text-white truncate mb-1">{loc.name}</div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: getCongestionColor(loc.congestion) }}
                            >
                              {loc.congestion}%
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {loc.severity || getCongestionSeverity(loc.congestion)}
                            </span>
                            {loc.source === "ml-prediction" && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded text-xs">ML</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      type="locations"
                      title="No locations monitored"
                      description="Make a traffic prediction to see locations on the map with real-time congestion data."
                      action={() => setActiveTab('predict')}
                      actionLabel="Start Predicting"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => handleTabClick('predict')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'predict'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs mt-1">Predict</span>
          </button>
          <button
            onClick={() => handleTabClick('info')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'info'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1">Info</span>
          </button>
          <button
            onClick={() => handleTabClick('locations')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${activeTab === 'locations'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs mt-1">Locations</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrafficMap;
