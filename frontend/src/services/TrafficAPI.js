// API service for communication with the backend
import config from '../config/environment';

const API_BASE_URL = `${config.api.baseUrl}/api`;
const API_TIMEOUT = config.api.timeout;

/**
 * Fetch with timeout wrapper
 * @param {string} url - Request URL
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>}
 */
const fetchWithTimeout = async (url, options = {}, timeout = API_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

class TrafficAPI {
  // Health check
  static async healthCheck() {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Health check failed:", error);
      }
      throw error;
    }
  }

  // Get available locations and options
  static async getLocations() {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/locations`);
      const data = await response.json();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Failed to fetch locations:", error);
      }
      throw error;
    }
  }

  // Predict congestion for a single location
  static async predictCongestion(locationData) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Prediction failed");
      }

      const data = await response.json();

      if (import.meta.env.DEV) {
        console.log("Prediction result:", data);
      }

      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Prediction failed:", error);
      }
      throw error;
    }
  }

  // Predict congestion with route coordinates for time calculation
  static async predictCongestionWithRoute(locationData, originCoords, destCoords) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...locationData,
          originCoords,
          destCoords
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Prediction failed");
      }

      const data = await response.json();

      if (import.meta.env.DEV) {
        console.log("Prediction result with route:", data);
      }

      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Prediction failed:", error);
      }
      throw error;
    }
  }

  // Predict congestion for multiple locations
  static async predictBulkCongestion(locations) {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/predict/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Bulk prediction failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Bulk prediction failed:", error);
      }
      throw error;
    }
  }

  // Get route with optional routing service
  static async getRoute(origin, destination, routingService = "osrm") {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/routes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ origin, destination, routingService }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Route calculation failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Route calculation failed:", error);
      }
      throw error;
    }
  }

  // Get alternative routes (2-3 options)
  static async getAlternativeRoutes(origin, destination, routingService = "osrm") {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/routes/alternatives`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ origin, destination, routingService }),
      }, 30000); // 30 second timeout for multiple routes

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Alternative routes calculation failed");
      }

      const data = await response.json();

      if (import.meta.env.DEV) {
        console.log("Alternative routes response:", data);
        if (data.routes) {
          console.log("Routes durations:", data.routes.map(r => ({ duration: r.duration, distance: r.distance })));
        }
      }

      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Alternative routes calculation failed:", error);
      }
      throw error;
    }
  }

  // Optimize waypoints using TSP solver
  static async optimizeWaypoints(waypoints, routingService = "osrm") {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/routes/optimize-waypoints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ waypoints, routingService }),
      }, 45000); // 45 second timeout for waypoint optimization

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Waypoint optimization failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Waypoint optimization failed:", error);
      }
      throw error;
    }
  }

  // Calculate multi-stop route in given order (no optimization)
  static async calculateMultiStopRoute(waypoints, routingService = "osrm") {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/routes/multi-stop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ waypoints, routingService }),
      }, 45000); // 45 second timeout

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Multi-stop route calculation failed");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Multi-stop route calculation failed:", error);
      }
      throw error;
    }
  }

  // Helper method to handle network errors gracefully
  static async safeApiCall(apiCall, fallbackData = null) {
    try {
      return await apiCall();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("API call failed, using fallback:", error.message);
      }
      return fallbackData;
    }
  }
}

export default TrafficAPI;

