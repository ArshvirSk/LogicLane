/**
 * Environment configuration
 * Centralizes all environment-dependent settings
 */

export const config = {
    api: {
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
        timeout: 15000,
    },
    openWeather: {
        apiKey: import.meta.env.VITE_OPENWEATHER_API_KEY || 'bb1ae91edbd801c0a95f4a93b14f7a71',
        baseUrl: 'https://api.openweathermap.org/data/2.5',
    },
    app: {
        name: 'LogicLane',
        version: '1.0.0',
    },
};

export default config;
