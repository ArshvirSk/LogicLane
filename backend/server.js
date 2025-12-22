require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const { spawn } = require("child_process");
const path = require("path");
const axios = require("axios");

const app = express();

// Configuration
const PORT = process.env.PORT || 5000;
const PYTHON_PATH = process.env.PYTHON_PATH || "python";
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ["http://localhost:5173", "http://127.0.0.1:5173"];
const REQUEST_SIZE_LIMIT = process.env.REQUEST_SIZE_LIMIT || "10mb";
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// Rate limiting storage (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map();

// Rate limiting middleware
const rateLimiter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Clean up old entries
  if (rateLimitStore.size > 10000) {
    for (const [ip, requests] of rateLimitStore.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        rateLimitStore.delete(ip);
      } else {
        rateLimitStore.set(ip, validRequests);
      }
    }
  }

  const requests = rateLimitStore.get(clientIP) || [];
  const validRequests = requests.filter(time => time > windowStart);

  if (validRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Please try again later",
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    });
  }

  validRequests.push(now);
  rateLimitStore.set(clientIP, validRequests);
  next();
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: CORS_ORIGINS,
    credentials: true,
  })
);
app.use(express.json({ limit: REQUEST_SIZE_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_SIZE_LIMIT }));
app.use(rateLimiter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "Traffic Prediction API",
    version: "1.0.0",
  });
});

// Predict congestion endpoint
app.post("/api/predict", async (req, res) => {
  try {
    const {
      startLocation,
      areaName,
      roadName,
      weatherConditions,
      roadworkActivity,
      predictionDate,
    } = req.body;

    // Validate input
    if (!areaName || !roadName || !weatherConditions || !roadworkActivity) {
      return res.status(400).json({
        error: "Missing required fields",
        required: [
          "areaName",
          "roadName",
          "weatherConditions",
          "roadworkActivity",
        ],
      });
    }

    console.log("Route optimization request:", {
      startLocation,
      areaName,
      roadName,
      weatherConditions,
      roadworkActivity,
      predictionDate,
    });

    // Get route information if coordinates are provided
    let routeInfo = null;
    if (req.body.originCoords && req.body.destCoords) {
      try {
        const routeData = await getOSRMRoute(
          req.body.originCoords,
          req.body.destCoords
        );
        // Convert seconds to minutes with decimal precision
        const baseDurationMinutes = Math.max(1, Math.round(routeData.duration / 60));
        routeInfo = {
          baseDuration: baseDurationMinutes,
          distance: routeData.distance,
        };
        console.log("Route info fetched:", routeInfo);
      } catch (error) {
        console.log("Could not fetch route info:", error.message);
      }
    }

    // Call Python prediction script
    const pythonScript = path.join(__dirname, "predict.py");

    // Prepare arguments for Python script
    const pythonArgs = [
      pythonScript,
      areaName,
      roadName,
      weatherConditions,
      roadworkActivity,
    ];

    // Add prediction date if provided
    if (predictionDate) {
      pythonArgs.push(predictionDate);
    }

    const pythonProcess = spawn(PYTHON_PATH, pythonArgs);

    let result = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python script error:", error);
        return res.status(500).json({
          error: "Prediction failed",
          details: error,
          code: code,
        });
      }

      try {
        const prediction = parseFloat(result.trim());

        // Calculate additional metrics
        const congestionLevel = Math.max(
          0,
          Math.min(100, Math.round(prediction))
        );
        const severity = getSeverityLevel(congestionLevel);
        const estimatedDelay = calculateEstimatedDelay(congestionLevel);
        const recommendedAction = getRecommendedAction(
          congestionLevel,
          startLocation,
          areaName
        );

        // Calculate adjusted time if route info is available
        let timeInfo = null;
        if (routeInfo) {
          const adjustedTime = calculateAdjustedTime(
            routeInfo.baseDuration,
            congestionLevel
          );
          const delayMinutes = adjustedTime - routeInfo.baseDuration;
          timeInfo = {
            baseDuration: routeInfo.baseDuration,
            adjustedDuration: adjustedTime,
            delayMinutes: delayMinutes,
            distance: routeInfo.distance,
          };
        }

        res.json({
          success: true,
          prediction: {
            congestionLevel: congestionLevel,
            severity: severity,
            estimatedDelay: estimatedDelay,
            recommendedAction: recommendedAction,
            timestamp: new Date().toISOString(),
            timeInfo: timeInfo,
            location: {
              startLocation: startLocation,
              area: areaName,
              road: roadName,
              weather: weatherConditions,
              roadwork: roadworkActivity,
              predictionDate:
                predictionDate || new Date().toISOString().split("T")[0],
            },
          },
        });
      } catch (parseError) {
        console.error("Failed to parse prediction result:", parseError);
        res.status(500).json({
          error: "Failed to parse prediction result",
          rawResult: result,
        });
      }
    });
  } catch (error) {
    console.error("Prediction endpoint error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Get available locations endpoint
app.get("/api/locations", (req, res) => {
  const locations = [
    {
      area: "Indiranagar",
      roads: [
        "100 Feet Road",
        "12th Main Road",
        "CMH Road",
        "Old Airport Road",
      ],
    },
    {
      area: "Koramangala",
      roads: ["5th Block", "6th Block", "7th Block", "Intermediate Ring Road"],
    },
    {
      area: "Whitefield",
      roads: [
        "ITPL Main Road",
        "Varthur Road",
        "Whitefield Main Road",
        "Hope Farm Junction",
      ],
    },
    {
      area: "Electronic City",
      roads: [
        "Hosur Road",
        "Electronic City Phase 1",
        "Electronic City Phase 2",
        "Bommasandra Road",
      ],
    },
    {
      area: "Hebbal",
      roads: ["Outer Ring Road", "Bellary Road", "Hebbal Flyover", "Nagawara"],
    },
    {
      area: "BTM Layout",
      roads: [
        "BTM 1st Stage",
        "BTM 2nd Stage",
        "Bannerghatta Road",
        "Silk Board",
      ],
    },
    {
      area: "Marathahalli",
      roads: [
        "Marathahalli Bridge",
        "Outer Ring Road",
        "Varthur Road",
        "Kundalahalli",
      ],
    },
    {
      area: "Jayanagar",
      roads: [
        "4th Block",
        "9th Block",
        "South End Circle",
        "Jayanagar Shopping Complex",
      ],
    },
  ];

  res.json({
    success: true,
    locations: locations,
    weatherOptions: ["Clear", "Cloudy", "Rainy", "Foggy"],
    roadworkOptions: ["Yes", "No"],
  });
});

// Route optimization endpoint with multiple routing services
app.post("/api/routes", async (req, res) => {
  try {
    const { origin, destination, routingService = "osrm" } = req.body;
    console.log("📍 Routes API called with:", { origin, destination, routingService });

    if (!origin || !destination) {
      return res.status(400).json({
        error: "Origin and destination are required",
      });
    }

    // Geocode origin and destination first
    console.log("🌍 Starting geocoding...");
    const [originCoords, destCoords] = await Promise.all([
      geocodeLocation(origin),
      geocodeLocation(destination),
    ]);
    console.log("🌍 Geocoding results:", { originCoords, destCoords });

    if (!originCoords || !destCoords) {
      console.error("❌ Geocoding failed");
      return res.status(400).json({
        error: "Unable to geocode origin or destination",
        details: {
          originFound: !!originCoords,
          destFound: !!destCoords
        }
      });
    }

    let routeData;

    if (routingService === "google" && process.env.GOOGLE_ROUTES_API_KEY) {
      // Google Routes API integration
      console.log("🗺️ Using Google Routes API");
      routeData = await getGoogleRoute(origin, destination);
    } else {
      // Use OSRM (Open Source Routing Machine) as fallback
      console.log("🗺️ Using OSRM for routing");
      routeData = await getOSRMRoute(originCoords, destCoords);
    }

    console.log("✅ Route calculation successful");
    res.json({
      success: true,
      route: routeData,
      origin: {
        address: origin,
        coordinates: originCoords,
      },
      destination: {
        address: destination,
        coordinates: destCoords,
      },
      routingService: routingService,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Routes API error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Failed to fetch route",
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
});

// Alternative routes endpoint
app.post("/api/routes/alternatives", async (req, res) => {
  try {
    const { origin, destination, alternatives = 3 } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        error: "Origin and destination are required",
      });
    }

    // Geocode origin and destination
    const [originCoords, destCoords] = await Promise.all([
      geocodeLocation(origin),
      geocodeLocation(destination),
    ]);

    if (!originCoords || !destCoords) {
      return res.status(400).json({
        error: "Unable to geocode origin or destination",
      });
    }

    // Get alternative routes from OSRM
    const routes = await getOSRMAlternatives(originCoords, destCoords, alternatives);

    res.json({
      success: true,
      routes,
      origin: {
        address: origin,
        coordinates: originCoords,
      },
      destination: {
        address: destination,
        coordinates: destCoords,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Alternative routes API error:", error);
    res.status(500).json({
      error: "Failed to fetch alternative routes",
      message: error.message,
    });
  }
});

// Waypoint optimization endpoint
app.post("/api/routes/optimize-waypoints", async (req, res) => {
  try {
    const { waypoints } = req.body;

    if (!waypoints || waypoints.length < 2) {
      return res.status(400).json({
        error: "At least 2 waypoints are required",
      });
    }

    console.log("📍 Optimizing waypoints:", waypoints);

    // Geocode all waypoints sequentially to avoid rate limiting
    const geocodedWaypoints = [];
    for (let i = 0; i < waypoints.length; i++) {
      const waypoint = waypoints[i];
      console.log(`🌍 Geocoding ${i + 1}/${waypoints.length}: ${waypoint}`);

      const coords = await geocodeLocation(waypoint);
      if (!coords) {
        throw new Error(`Unable to geocode location: ${waypoint}`);
      }
      geocodedWaypoints.push(coords);

      // Add delay between requests to respect Nominatim rate limits (1 req/sec)
      if (i < waypoints.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("🌍 All waypoints geocoded successfully:", geocodedWaypoints);

    // Extract coordinates for OSRM format: lon,lat;lon,lat;...
    const coordinates = geocodedWaypoints
      .map(wp => `${wp.lon},${wp.lat}`)
      .join(';');

    console.log("🗺️ OSRM coordinates string:", coordinates);

    // Use OSRM Trip service for waypoint optimization
    const response = await axios.get(
      `http://router.project-osrm.org/trip/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`,
      { timeout: 15000 }
    );

    if (response.data && response.data.trips && response.data.trips.length > 0) {
      const trip = response.data.trips[0];
      const waypointOrder = response.data.waypoints.map(wp => wp.waypoint_index);

      console.log("✅ Waypoint optimization successful. Order:", waypointOrder);

      res.json({
        success: true,
        optimizedOrder: waypointOrder,
        optimizedRoute: {
          waypointOrder: waypointOrder,
          waypoints: waypointOrder.map(index => waypoints[index]),
          distance: Math.round(trip.distance),
          duration: Math.round(trip.duration / 60), // Convert to minutes
          geometry: trip.geometry,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      throw new Error("Unable to optimize waypoints");
    }
  } catch (error) {
    console.error("❌ Waypoint optimization error:", error.message);
    res.status(500).json({
      error: "Failed to optimize waypoints",
      message: error.message,
    });
  }
});

// Multi-stop route calculation (keeps order as-is)
app.post("/api/routes/multi-stop", async (req, res) => {
  try {
    const { waypoints } = req.body;

    if (!waypoints || waypoints.length < 2) {
      return res.status(400).json({
        error: "At least 2 waypoints are required",
      });
    }

    console.log("📍 Calculating multi-stop route for:", waypoints);

    // Geocode all waypoints sequentially to avoid rate limiting
    const geocodedWaypoints = [];
    for (let i = 0; i < waypoints.length; i++) {
      const waypoint = waypoints[i];
      console.log(`🌍 Geocoding ${i + 1}/${waypoints.length}: ${waypoint}`);

      const coords = await geocodeLocation(waypoint);
      if (!coords) {
        throw new Error(`Unable to geocode location: ${waypoint}`);
      }
      geocodedWaypoints.push(coords);

      // Add delay between requests to respect Nominatim rate limits (1 req/sec)
      if (i < waypoints.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log("🌍 All waypoints geocoded successfully:", geocodedWaypoints);

    // Calculate route segments between consecutive waypoints
    const segments = [];
    let totalDistance = 0;
    let totalDuration = 0;
    const allCoordinates = [];
    const allSteps = [];

    for (let i = 0; i < geocodedWaypoints.length - 1; i++) {
      const start = geocodedWaypoints[i];
      const end = geocodedWaypoints[i + 1];

      const segmentRoute = await getOSRMRoute(start, end);

      segments.push({
        from: waypoints[i],
        to: waypoints[i + 1],
        distance: segmentRoute.distance,
        duration: segmentRoute.durationMinutes,
        geometry: segmentRoute.geometry,
      });

      totalDistance += segmentRoute.distance;
      totalDuration += segmentRoute.durationMinutes;

      // Collect all coordinates for the complete route
      if (segmentRoute.geometry && segmentRoute.geometry.coordinates) {
        allCoordinates.push(...segmentRoute.geometry.coordinates);
      }

      // Collect all steps for the complete route
      if (segmentRoute.steps) {
        allSteps.push(...segmentRoute.steps);
      }
    }

    console.log("✅ Multi-stop route calculated successfully");

    // Return the same format as single route for consistency
    res.json({
      success: true,
      route: {
        distance: totalDistance,
        duration: totalDuration,
        geometry: {
          type: "LineString",
          coordinates: allCoordinates
        },
        steps: allSteps,
      },
      origin: {
        address: waypoints[0],
        coordinates: geocodedWaypoints[0],
      },
      destination: {
        address: waypoints[waypoints.length - 1],
        coordinates: geocodedWaypoints[geocodedWaypoints.length - 1],
      },
      waypoints: waypoints, // Location names
      waypointCoordinates: geocodedWaypoints, // Coordinates for all waypoints including start and end
      routingService: "osrm",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Multi-stop route error:", error.message);
    res.status(500).json({
      error: "Failed to calculate multi-stop route",
      message: error.message,
    });
  }
});

// Helper function to geocode location using Nominatim with retry logic
async function geocodeLocation(locationName, retries = 3) {
  // Try different query formats for better geocoding results
  const queryFormats = [
    `${locationName}, Bangalore, India`, // Full query
    `${locationName.split(',')[0]}, Bangalore, India`, // Just the area name if comma-separated
    `${locationName}, Bangalore`, // Without India
    `${locationName}`, // Just the location name
  ];

  for (let formatIndex = 0; formatIndex < queryFormats.length; formatIndex++) {
    const query = queryFormats[formatIndex];

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Add delay between attempts to respect rate limits
        if (attempt > 1 || formatIndex > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
          {
            timeout: 15000, // Increased timeout to 15 seconds
            headers: {
              'User-Agent': 'SmartCityRushHour/1.0'
            }
          }
        );

        if (response.data && response.data.length > 0) {
          console.log(`✅ Geocoded "${locationName}" using query "${query}" (attempt ${attempt})`);
          return {
            lat: parseFloat(response.data[0].lat),
            lon: parseFloat(response.data[0].lon),
          };
        }

        console.warn(`⚠️ No results for "${locationName}" using query "${query}" (attempt ${attempt})`);

        // If this was the last attempt for this format, try the next format
        if (attempt === retries) {
          break;
        }
      } catch (error) {
        console.error(`❌ Geocoding error for "${locationName}" (attempt ${attempt}/${retries}):`, error.message);

        if (attempt === retries) {
          // Try next format
          break;
        }
      }
    }
  }

  // All formats failed
  console.error(`Failed to geocode "${locationName}" after trying all formats`);
  return null;
}

// Helper function to get route from OSRM
async function getOSRMRoute(origin, destination) {
  try {
    const response = await axios.get(
      `http://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&steps=true`,
      { timeout: 15000 }
    );

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const route = response.data.routes[0];
      return {
        distance: Math.round(route.distance),
        duration: route.duration, // Keep in seconds for precision
        durationMinutes: Math.round(route.duration / 60), // Also provide minutes
        geometry: route.geometry,
        steps: route.legs[0].steps.map((step) => ({
          instruction: step.maneuver.modifier
            ? `${step.maneuver.type} ${step.maneuver.modifier}`
            : step.maneuver.type,
          distance: Math.round(step.distance),
          duration: Math.round(step.duration / 60),
          name: step.name || "Unknown road",
        })),
      };
    }

    throw new Error("No route found");
  } catch (error) {
    console.error("OSRM routing error:", error);
    throw error;
  }
}

// Helper function to get alternative routes from OSRM
async function getOSRMAlternatives(origin, destination, count = 3) {
  try {
    const response = await axios.get(
      `http://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full&geometries=geojson&steps=true&alternatives=${count}`,
      { timeout: 15000 }
    );

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      return response.data.routes.map((route, index) => ({
        routeIndex: index,
        distance: Math.round(route.distance),
        duration: Math.max(1, Math.round(route.duration / 60)), // Convert to minutes, min 1
        geometry: route.geometry,
        steps: route.legs[0].steps.map((step) => ({
          instruction: step.maneuver.modifier
            ? `${step.maneuver.type} ${step.maneuver.modifier}`
            : step.maneuver.type,
          distance: Math.round(step.distance),
          duration: Math.round(step.duration / 60),
          name: step.name || "Unknown road",
        })),
      }));
    }

    throw new Error("No alternative routes found");
  } catch (error) {
    console.error("OSRM alternative routes error:", error);
    throw error;
  }
}

// Helper function to get route from Google Routes API
async function getGoogleRoute(origin, destination) {
  try {
    const GOOGLE_ROUTES_API_KEY = process.env.GOOGLE_ROUTES_API_KEY;

    const response = await axios.post(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        origin: { address: origin },
        destination: { address: destination },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        computeAlternativeRoutes: false,
        units: "METRIC",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_ROUTES_API_KEY,
          "X-Goog-FieldMask":
            "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
        },
        timeout: 15000
      }
    );

    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      const route = response.data.routes[0];
      return {
        distance: route.distanceMeters,
        duration: Math.round(parseInt(route.duration.replace("s", "")) / 60),
        encodedPolyline: route.polyline.encodedPolyline,
      };
    }

    throw new Error("No route found from Google");
  } catch (error) {
    console.error("Google Routes API error:", error);
    throw error;
  }
}

// Bulk prediction endpoint for multiple locations
app.post("/api/predict/bulk", async (req, res) => {
  try {
    const { locations } = req.body;

    if (!locations || !Array.isArray(locations)) {
      return res.status(400).json({
        error: "Invalid input. Expected array of locations.",
      });
    }

    const predictions = [];

    for (const location of locations) {
      try {
        const {
          areaName,
          roadName,
          weatherConditions,
          roadworkActivity,
          predictionDate,
        } = location;

        // Prepare arguments for Python script
        const args = [areaName, roadName, weatherConditions, roadworkActivity];
        if (predictionDate) {
          args.push(predictionDate);
        }

        // Call Python script for each location
        const pythonScript = path.join(__dirname, "predict.py");
        const result = await callPythonScript(pythonScript, args);

        const congestionLevel = Math.max(
          0,
          Math.min(100, Math.round(parseFloat(result)))
        );

        predictions.push({
          location: location,
          congestionLevel: congestionLevel,
          severity: getSeverityLevel(congestionLevel),
          estimatedDelay: calculateEstimatedDelay(congestionLevel),
        });
      } catch (error) {
        predictions.push({
          location: location,
          error: "Prediction failed",
          message: error.message,
        });
      }
    }

    res.json({
      success: true,
      predictions: predictions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Bulk prediction error:", error);
    res.status(500).json({
      error: "Bulk prediction failed",
      message: error.message,
    });
  }
});

// Helper functions
function getSeverityLevel(congestionLevel) {
  if (congestionLevel >= 80) return "High";
  if (congestionLevel >= 60) return "Medium";
  if (congestionLevel >= 40) return "Moderate";
  return "Low";
}

function calculateAdjustedTime(baseDurationMinutes, congestionLevel) {
  // Calculate congestion multiplier based on congestion level
  let multiplier = 1.0;

  if (congestionLevel <= 25) {
    // Low: 1.0x - 1.15x (0-15% delay)
    multiplier = 1.0 + (congestionLevel / 100) * 0.6;
  } else if (congestionLevel <= 50) {
    // Moderate: 1.15x - 1.35x (15-35% delay)
    multiplier = 1.15 + ((congestionLevel - 25) / 100) * 0.8;
  } else if (congestionLevel <= 75) {
    // Medium: 1.35x - 1.7x (35-70% delay)
    multiplier = 1.35 + ((congestionLevel - 50) / 100) * 1.4;
  } else {
    // High: 1.7x - 2.5x (70-150% delay)
    multiplier = 1.7 + ((congestionLevel - 75) / 100) * 3.2;
  }

  return Math.round(baseDurationMinutes * multiplier);
}

function calculateEstimatedDelay(congestionLevel) {
  // Estimate delay in minutes based on congestion level
  if (congestionLevel >= 80) return "15-25 minutes";
  if (congestionLevel >= 60) return "8-15 minutes";
  if (congestionLevel >= 40) return "3-8 minutes";
  return "0-3 minutes";
}

function getRecommendedAction(congestionLevel, startLocation, destination) {
  const routeInfo =
    startLocation && destination
      ? ` from ${startLocation} to ${destination}`
      : "";

  if (congestionLevel >= 80)
    return `Avoid this route${routeInfo}. Consider alternative paths like Outer Ring Road or use public transport.`;
  if (congestionLevel >= 60)
    return `Heavy traffic expected${routeInfo}. Allow extra 15-20 minutes and consider leaving earlier.`;
  if (congestionLevel >= 40)
    return `Moderate traffic${routeInfo}. Plan for potential 5-10 minute delays.`;
  return `Light traffic${routeInfo}. Good time to travel - optimal route conditions.`;
}

function callPythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_PATH, [scriptPath, ...args]);
    let result = "";
    let error = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(error));
      } else {
        resolve(result.trim());
      }
    });
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// Start server
const server = app.listen(PORT, () => {
  const env = process.env.NODE_ENV || 'development';
  console.log(`🚦 Traffic Prediction API Server [${env}] running on port ${PORT}`);
  if (env === 'development') {
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔮 Prediction endpoint: http://localhost:${PORT}/api/predict`);
    console.log(`📋 Available locations: http://localhost:${PORT}/api/locations`);
  }
});
