/**
 * Environment configuration
 * Centralizes all environment-dependent settings
 */

export const config = {
    api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://logiclane.onrender.com',
        timeout: 15000,
    },
    openWeather: {
        apiKey: import.meta.env.VITE_OPENWEATHER_API_KEY,
        baseUrl: 'https://api.openweathermap.org/data/2.5',
    },
    app: {
        name: 'LogicLane',
        version: '1.0.0',
    },
};

export default config;
