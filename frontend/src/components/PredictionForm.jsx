import { useCallback, useEffect, useState } from "react";
import config from "../config/environment";
import { useAuth } from "../services/AuthContext";
import TrafficAPI from "../services/TrafficAPI";
import AlternativeRoutes from "./AlternativeRoutes";
import { toast } from "./Toast";

// Weather API function that considers prediction date
const fetchWeatherForDate = async (
  predictionDate,
  latitude = 12.9716,
  longitude = 77.5946
) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const { apiKey, baseUrl } = config.openWeather;

    // If prediction date is today, get current weather
    if (predictionDate === today) {
      const response = await fetch(
        `${baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
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
          source: "current",
        };
      }
    } else {
      // For future dates, try to get 5-day forecast (if within 5 days)
      const predDate = new Date(predictionDate);
      const todayDate = new Date(today);
      const daysDiff = Math.ceil(
        (predDate - todayDate) / (1000 * 60 * 60 * 24)
      );

      // Try 5-day forecast first (most accurate for near future)
      if (daysDiff <= 5 && daysDiff > 0) {
        try {
          const forecastResponse = await fetch(
            `${baseUrl}/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
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
          // 5-day forecast failed, use seasonal prediction
          if (import.meta.env.DEV) {
            console.warn('5-day forecast failed, using seasonal prediction:', error);
          }
        }
      }

      // For dates beyond 5 days, use seasonal weather patterns since free API only provides 5-day forecast
      if (import.meta.env.DEV && daysDiff > 5) {
        console.info(
          `Date is ${daysDiff} days in future. Using seasonal prediction for ${predictionDate}`
        );
      }

      // For dates beyond 30 days or if all forecasts fail, use seasonal patterns
      return getPredictedWeatherByDate(predictionDate);
    }

    // Fallback to default weather
    return {
      condition: "Clear",
      temperature: 25,
      description: "clear sky",
      icon: "01d",
      source: "default",
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Error fetching weather:", error);
    }
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
    source: "predicted",
  };
};

const PredictionForm = ({ onPredictionResult, onLocationAdd, onAlternativeRoutes, onWaypointsOptimized, onClearAll }) => {
  const { userProfile, saveUserTrip, addToFavorites } =
    useAuth();

  const initialFormData = {
    startLocation: userProfile?.preferences?.defaultStartLocation || "",
    areaName: "",
    roadName: "",
    roadworkActivity: "No",
    predictionDate: new Date().toISOString().split("T")[0], // Today's date as default
  };
  const [formData, setFormData] = useState(initialFormData);

  const [currentWeather, setCurrentWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [alternativeRoutes, setAlternativeRoutes] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isLoadingWaypoints, setIsLoadingWaypoints] = useState(false);

  // Multi-stop waypoints state
  const [waypoints, setWaypoints] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const [availableData, setAvailableData] = useState({
    locations: [],
    roadworkOptions: ["Yes", "No"],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedArea, setSelectedArea] = useState(null);

  const getWeatherForDate = useCallback(async () => {
    setIsLoadingWeather(true);
    const weather = await fetchWeatherForDate(formData.predictionDate);
    setCurrentWeather(weather);
    setIsLoadingWeather(false);
  }, [formData.predictionDate]);

  // Load available locations and weather on component mount
  useEffect(() => {
    loadAvailableLocations();
    getWeatherForDate();
  }, [getWeatherForDate]);

  // Update weather when prediction date changes
  useEffect(() => {
    if (formData.predictionDate) {
      getWeatherForDate();
    }
  }, [formData.predictionDate, getWeatherForDate]);

  const loadAvailableLocations = async () => {
    try {
      const data = await TrafficAPI.getLocations();
      if (data.success) {
        setAvailableData(data);
      }
    } catch (error) {
      console.error("Failed to load locations:", error);
      // Fallback to default Bangalore locations if API fails
      setAvailableData({
        locations: [
          { area: "Koramangala", roads: ["80 Feet Road", "Outer Ring Road"] },
          {
            area: "Whitefield",
            roads: ["ITPL Main Road", "Whitefield Main Road"],
          },
          { area: "Electronic City", roads: ["Hosur Road", "Infosys Road"] },
          { area: "Jayanagar", roads: ["9th Block", "4th Block"] },
          { area: "Indiranagar", roads: ["100 Feet Road", "CMH Road"] },
          { area: "MG Road", roads: ["Mahatma Gandhi Road", "Brigade Road"] },
          { area: "BTM Layout", roads: ["BTM 1st Stage", "BTM 2nd Stage"] },
          { area: "HSR Layout", roads: ["Outer Ring Road", "27th Main Road"] },
          { area: "Bellandur", roads: ["Outer Ring Road", "Sarjapur Road"] },
          {
            area: "Marathahalli",
            roads: ["Outer Ring Road", "Old Airport Road"],
          },
        ],
        roadworkOptions: ["Yes", "No"],
        success: true,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Update available roads when area changes
    if (name === "areaName") {
      const area = availableData.locations.find((loc) => loc.area === value);
      setSelectedArea(area);
      if (area) {
        setFormData((prev) => ({
          ...prev,
          roadName: "", // Reset road selection
        }));
      }
    }
  };

  // Clear all form inputs and map
  const handleClearAll = () => {
    // Reset form to initial state
    setFormData({
      startLocation: userProfile?.preferences?.defaultStartLocation || "",
      areaName: "",
      roadName: "",
      roadworkActivity: "No",
      predictionDate: new Date().toISOString().split("T")[0],
    });

    // Clear waypoints
    setWaypoints([]);

    // Clear alternative routes
    setAlternativeRoutes([]);
    setSelectedRouteIndex(0);

    // Clear errors
    setErrors({});

    // Clear selected area
    setSelectedArea(null);

    // Fetch current weather for today
    getWeatherForDate();

    // Call parent handler to clear map
    if (onClearAll) {
      onClearAll();
    }

    // Close prediction results
    if (onPredictionResult) {
      onPredictionResult(null);
    }

    toast.success("Map and inputs cleared");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.startLocation.trim()) {
      newErrors.startLocation = "Start location is required";
    }

    if (!formData.areaName.trim()) {
      newErrors.areaName = "Destination area is required";
    }

    if (!formData.roadName.trim()) {
      newErrors.roadName = "Destination road is required";
    }

    if (!formData.roadworkActivity) {
      newErrors.roadworkActivity = "Roadwork status is required";
    }

    if (!formData.predictionDate) {
      newErrors.predictionDate = "Prediction date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if this is a multi-stop route
    if (waypoints.length > 0) {
      // Handle multi-stop route
      setIsLoading(true);
      try {
        await handleCalculateMultiStopRoute([formData.startLocation, ...waypoints]);
      } catch (error) {
        console.error("Multi-stop route error:", error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Handle single route prediction
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const predictionData = {
        ...formData,
        weatherConditions: currentWeather?.condition || "Clear",
      };

      // Fetch alternative routes first to get coordinates
      const origin = `${formData.startLocation}, Bangalore`;
      const destination = `${formData.areaName}, ${formData.roadName || ""}, Bangalore`;

      let originCoords = null;
      let destCoords = null;

      try {
        const routesResult = await TrafficAPI.getAlternativeRoutes(origin, destination);
        if (routesResult.success && routesResult.routes) {
          setAlternativeRoutes(routesResult.routes);
          setSelectedRouteIndex(0);

          // Extract coordinates from route data
          if (routesResult.origin && routesResult.destination) {
            originCoords = routesResult.origin.coordinates || routesResult.origin;
            destCoords = routesResult.destination.coordinates || routesResult.destination;
          }

          // Pass routes to parent component
          if (onAlternativeRoutes) {
            onAlternativeRoutes(routesResult.routes);
          }
        }
      } catch (routeError) {
        console.error("Failed to fetch alternative routes:", routeError);
        // Continue with prediction even if routes fail
      }

      // Now make prediction with coordinates if available
      const prediction = originCoords && destCoords
        ? await TrafficAPI.predictCongestionWithRoute(predictionData, originCoords, destCoords)
        : await TrafficAPI.predictCongestion(predictionData);

      if (prediction.success) {
        // Pass the prediction result to parent
        onPredictionResult(prediction.prediction);

        // Also add to map if callback provided
        if (onLocationAdd) {
          const routeData = {
            name: `${formData.startLocation} → ${formData.areaName}, ${formData.roadName}`,
            startLocation: formData.startLocation,
            area: formData.areaName,
            road: formData.roadName,
            weather: currentWeather?.condition || "Clear",
            roadwork: formData.roadworkActivity,
            congestion: prediction.prediction.congestionLevel,
            severity: prediction.prediction.severity,
            estimatedDelay: prediction.prediction.estimatedDelay,
            recommendedAction: prediction.prediction.recommendedAction,
            timestamp: prediction.prediction.timestamp,
          };

          onLocationAdd(routeData);

          // Save trip data for logged-in users
          if (userProfile) {
            try {
              // Calculate time saved based on traffic conditions
              const baseTime = routeData.estimatedDelay || 30; // Default base time in minutes
              const timeSavedMinutes =
                prediction.prediction.congestionLevel === "Low"
                  ? Math.round(baseTime * 0.3)
                  : prediction.prediction.congestionLevel === "Medium"
                    ? Math.round(baseTime * 0.15)
                    : 0;

              await saveUserTrip({
                startLocation: formData.startLocation,
                endLocation: `${formData.areaName}, ${formData.roadName}`,
                distance:
                  routeData.distance || Math.round(Math.random() * 15 + 5), // Random distance 5-20km if not available
                duration: routeData.estimatedDelay || baseTime,
                timeSaved: timeSavedMinutes,
                congestion: prediction.prediction.congestionLevel,
                avgCongestion: prediction.prediction.congestionLevel,
                severity: prediction.prediction.severity,
                recommendedAction: prediction.prediction.recommendedAction,
                weather: currentWeather?.condition || "Clear",
                date: formData.predictionDate,
                roadwork: formData.roadworkActivity,
              });
            } catch (error) {
              console.error("Error saving trip:", error);
            }
          }
        }

        // Reset form but keep user's default start location
        setFormData({
          startLocation: userProfile?.preferences?.defaultStartLocation || "",
          areaName: "",
          roadName: "",
          roadworkActivity: "No",
          predictionDate: new Date().toISOString().split("T")[0],
        });
        setSelectedArea(null);

        // Show success toast
        toast.success(`Traffic prediction complete: ${prediction.prediction.severity} congestion`);
      }
    } catch (error) {
      console.error("Prediction failed:", error);
      const errorMessage = error.message || "Prediction failed. Please try again.";
      setErrors({
        submit: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRoute = (index) => {
    setSelectedRouteIndex(index);
    if (onAlternativeRoutes && alternativeRoutes[index]) {
      onAlternativeRoutes(alternativeRoutes, index);
    }
  };

  const handleCalculateMultiStopRoute = async (waypointList) => {
    setIsLoadingWaypoints(true);
    try {
      const result = await TrafficAPI.calculateMultiStopRoute(waypointList);

      if (result.success && result.route) {
        // Create route info with start/end coordinates for map display
        const routeInfoForMap = {
          start: result.origin.coordinates,
          end: result.destination.coordinates,
          startLocation: result.origin.address,
          destination: result.destination.address,
          distance: result.route.distance,
          duration: result.route.duration,
          waypoints: result.waypoints, // Location names
          waypointCoordinates: result.waypointCoordinates, // All coordinates including start and end
        };

        // Pass route and route info to parent component for map display
        if (onAlternativeRoutes) {
          onAlternativeRoutes([result.route], 0, routeInfoForMap);
        }

        // Create a mock prediction result to show congestion modal
        // For multi-stop, we'll show "Light" as default since we don't have ML predictions yet
        const mockPrediction = {
          severity: "Light",
          congestionLevel: 35,
          estimatedDelay: 5,
          recommendedAction: "Multi-stop route is clear",
          timestamp: new Date().toISOString(),
          location: {
            startLocation: waypointList[0],
            area: waypointList[waypointList.length - 1],
            road: `${waypointList.length - 1} waypoint${waypointList.length > 2 ? 's' : ''}`,
            weather: currentWeather?.condition || "Clear",
            roadwork: "No",
            predictionDate: formData.predictionDate || new Date().toISOString().split("T")[0]
          }
        };

        if (onPredictionResult) {
          onPredictionResult(mockPrediction);
        }

        const routePath = waypointList.join(" → ");
        const distanceKm = (result.route.distance / 1000).toFixed(1);
        toast.success(`Multi-stop route calculated: ${distanceKm}km, ${result.route.duration} min`);
      }
    } catch (error) {
      console.error("Failed to calculate multi-stop route:", error);
      toast.error(error.message || "Failed to calculate route");
    } finally {
      setIsLoadingWaypoints(false);
    }
  };

  const handleAddWaypoint = () => {
    if (formData.areaName && formData.roadName) {
      const newWaypoint = `${formData.areaName}, ${formData.roadName}`;
      if (!waypoints.includes(newWaypoint)) {
        const updatedWaypoints = [...waypoints, newWaypoint];
        setWaypoints(updatedWaypoints);

        // Clear destination fields for next waypoint
        setFormData(prev => ({
          ...prev,
          areaName: "",
          roadName: ""
        }));
        setSelectedArea(null);
        toast.success("Stop added! Click 'Find Optimal Route' when ready.");
      }
    }
  };

  const handleRemoveWaypoint = (index) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
  };

  // Drag and drop handlers for waypoints
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newWaypoints = [...waypoints];
    const draggedItem = newWaypoints[draggedIndex];

    // Remove dragged item
    newWaypoints.splice(draggedIndex, 1);
    // Insert at new position
    newWaypoints.splice(dropIndex, 0, draggedItem);

    setWaypoints(newWaypoints);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-2">
      {/* Alternative Routes */}
      {alternativeRoutes.length > 0 && (
        <AlternativeRoutes
          routes={alternativeRoutes}
          onSelectRoute={handleSelectRoute}
          selectedRouteIndex={selectedRouteIndex}
        />
      )}

      <form onSubmit={handleSubmit}>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-2 flex items-center">
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
          Route Optimization
        </h3>

        {/* Prediction Date */}
        <div>
          <label
            htmlFor="predictionDate"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Prediction Date & Time
          </label>
          <input
            type="date"
            id="predictionDate"
            name="predictionDate"
            value={formData.predictionDate}
            onChange={handleInputChange}
            min={new Date().toISOString().split("T")[0]}
            className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.predictionDate
              ? "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
              }`}
            disabled={isLoading}
          />
          {errors.predictionDate && (
            <span className="text-xs text-red-600 mt-1 block">
              {errors.predictionDate}
            </span>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select when you plan to travel (affects weather & traffic patterns)
          </p>
        </div>

        {/* Roadwork Activity */}
        <div className="mt-2">
          <label
            htmlFor="roadworkActivity"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Roadwork Activity
          </label>
          <select
            id="roadworkActivity"
            name="roadworkActivity"
            value={formData.roadworkActivity}
            onChange={handleInputChange}
            className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.roadworkActivity
              ? "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
              }`}
            disabled={isLoading}
          >
            {availableData.roadworkOptions.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.roadworkActivity && (
            <span className="text-xs text-red-600 mt-1 block">
              {errors.roadworkActivity}
            </span>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ongoing construction significantly impacts travel time
          </p>
        </div>

        {/* Start Location */}
        <div>
          <label
            htmlFor="startLocation"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5 mt-2"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Start Location
          </label>
          <select
            id="startLocation"
            name="startLocation"
            value={formData.startLocation}
            onChange={handleInputChange}
            className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.startLocation
              ? "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
              }`}
            disabled={isLoading}
          >
            <option value="">Select start location...</option>
            {availableData.locations.map((location, index) => (
              <option key={index} value={location.area}>
                {location.area}
              </option>
            ))}
          </select>
          {errors.startLocation && (
            <span className="text-xs text-red-600 mt-1 block">
              {errors.startLocation}
            </span>
          )}
        </div>

        {/* Destination Area Selection */}
        <div>
          <label
            htmlFor="areaName"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5 mt-2"
          >
            <svg
              className="w-4 h-4 inline mr-1"
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
            Destination Area
          </label>
          <select
            id="areaName"
            name="areaName"
            value={formData.areaName}
            onChange={handleInputChange}
            className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.areaName ? "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            disabled={isLoading}
          >
            <option value="">Select an area...</option>
            {availableData.locations.map((location, index) => (
              <option key={index} value={location.area}>
                {location.area}
              </option>
            ))}
          </select>
          {errors.areaName && (
            <span className="text-xs text-red-600 mt-1 block">
              {errors.areaName}
            </span>
          )}
        </div>

        {/* Destination Road Selection */}
        <div>
          <label
            htmlFor="roadName"
            className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5 mt-2"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Destination Road/Intersection
          </label>
          <select
            id="roadName"
            name="roadName"
            value={formData.roadName}
            onChange={handleInputChange}
            className={`w-full px-2 py-1.5 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.roadName ? "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-500" : "border-gray-300 dark:border-gray-600"
              } ${isLoading || !selectedArea ? "bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500" : ""
              }`}
            disabled={isLoading || !selectedArea}
          >
            <option value="">Select a road...</option>
            {selectedArea?.roads.map((road, index) => (
              <option key={index} value={road}>
                {road}
              </option>
            ))}
          </select>
          {errors.roadName && (
            <span className="text-xs text-red-600 mt-1 block">
              {errors.roadName}
            </span>
          )}
        </div>

        {/* Add Stop Button for Multi-Stop Routes */}
        {formData.areaName && formData.roadName && (
          <button
            type="button"
            onClick={handleAddWaypoint}
            className="w-full mt-2 py-1.5 px-3 bg-purple-600 text-white rounded font-medium text-xs hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add as Stop (Multi-Stop Route)
          </button>
        )}

        {/* Display Added Waypoints */}
        {waypoints.length > 0 && (
          <div className="mt-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-300 dark:border-purple-700 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Multi-Stop Route
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {waypoints.length + 1} {waypoints.length + 1 === 2 ? 'stop' : 'stops'}
                </span>
              </h4>
            </div>

            <div className="p-3 space-y-2">
              {/* Start Location */}
              <div className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg border border-green-200 dark:border-green-700 shadow-sm">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs flex items-center justify-center font-bold shadow-md">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-green-900 dark:text-green-200 truncate">
                    {formData.startLocation}
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-400">Starting point</div>
                </div>
              </div>

              {/* Waypoints */}
              {waypoints.map((waypoint, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2.5 p-2.5 bg-white dark:bg-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500 transition-all shadow-sm group cursor-move ${draggedIndex === index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                    }`}
                >
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs flex items-center justify-center font-bold shadow-md">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                      {waypoint}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Stop {index + 1}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWaypoint(index)}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-all opacity-70 group-hover:opacity-100"
                    title="Remove stop"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Info text */}
              <div className="flex items-start gap-2 p-2 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed">
                  <span className="font-semibold">Drag and drop</span> to reorder stops, then click <span className="font-semibold">"Find Route"</span> below
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Weather Display */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 mt-2">
            Current Weather Conditions
          </label>
          <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
            {isLoadingWeather ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  Fetching weather...
                </span>
              </>
            ) : currentWeather ? (
              <>
                <img
                  src={`https://openweathermap.org/img/w/${currentWeather.icon}.png`}
                  alt={currentWeather.description}
                  className="w-8 h-8"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800 dark:text-white">
                    {currentWeather.condition}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {currentWeather.description}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-blue-600 dark:text-blue-400">
                    {currentWeather.temperature}°C
                  </div>
                </div>
                <button
                  type="button"
                  onClick={getWeatherForDate}
                  className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800"
                  disabled={isLoadingWeather}
                >
                  Refresh
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Weather data unavailable
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            ⚡ Weather data is automatically used for ML predictions
            {currentWeather && (
              <span className="ml-2">
                (
                {currentWeather.source === "current"
                  ? "Real-time"
                  : currentWeather.source === "5-day forecast"
                    ? "5-day forecast"
                    : currentWeather.source === "predicted"
                      ? "Seasonal prediction"
                      : "Weather API"}
                )
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-1.5 px-3 mt-3 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 ${isLoading
            ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
            : waypoints.length > 0
              ? "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 dark:bg-purple-500 dark:hover:bg-purple-600"
              : !formData.startLocation || !formData.areaName || !formData.roadName
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600"
            }`}
          disabled={
            isLoading ||
            (waypoints.length === 0 && (!formData.startLocation || !formData.areaName || !formData.roadName))
          }
        >
          {isLoading ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {waypoints.length > 0 ? 'Calculating Route...' : 'Finding Route...'}
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
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
              {waypoints.length > 0 ? `Find Route (${waypoints.length + 1} stops)` : 'Find Optimal Route'}
            </>
          )}
        </button>

        {/* Clear All Button */}
        <button
          type="button"
          onClick={handleClearAll}
          className="w-full py-1.5 px-3 mt-2 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500"
          disabled={isLoading}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Clear All
        </button>

        {errors.submit && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
            Error: {errors.submit}
          </div>
        )}
      </form>

      {/* Add to Favorites Button (only show for logged-in users with valid route) */}
      {userProfile &&
        formData.startLocation &&
        formData.areaName &&
        formData.roadName && (
          <button
            type="button"
            onClick={async () => {
              try {
                const added = await addToFavorites({
                  startLocation: formData.startLocation,
                  endLocation: `${formData.areaName}, ${formData.roadName}`,
                  distance: 0, // Will be updated when route is calculated
                  duration: 0, // Will be updated when route is calculated
                });
                if (added) {
                  alert("Route added to favorites!");
                } else {
                  alert("Route is already in your favorites.");
                }
              } catch (error) {
                console.error("Error adding to favorites:", error);
                alert("Failed to add route to favorites.");
              }
            }}
            className="w-full py-1.5 px-3 rounded font-medium text-sm transition-colors flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Save as Favorite Route
          </button>
        )}
    </div>
  );
};

export default PredictionForm;
