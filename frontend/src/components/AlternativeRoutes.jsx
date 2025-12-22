import { useState } from "react";

const AlternativeRoutes = ({ routes, onSelectRoute, selectedRouteIndex }) => {
    const [expanded, setExpanded] = useState(true);

    if (!routes || routes.length === 0) return null;

    const formatDuration = (minutes) => {
        if (!minutes || minutes < 1) return "< 1 min";
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const formatDistance = (meters) => {
        if (!meters || meters === 0) return "Calculating...";
        const km = (meters / 1000).toFixed(1);
        return `${km} km`;
    };

    const getRouteColor = (index) => {
        const colors = ["#4285F4", "#34A853", "#FBBC04"]; // Google Maps blue, green, yellow
        return colors[index] || "#9E9E9E";
    };

    const getRouteBadge = (index, route) => {
        if (index === 0) return "Fastest";
        if (route.distance < routes[0].distance) return "Shortest";
        return "Alternative";
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-t-lg"
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                        {routes.length} route{routes.length > 1 ? 's' : ''} found
                    </span>
                </div>
                <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {expanded && (
                <div className="p-2 space-y-2 border-t border-gray-200 dark:border-gray-700">
                    {routes.map((route, index) => (
                        <button
                            key={index}
                            onClick={() => onSelectRoute(index)}
                            className={`w-full p-2.5 rounded-lg text-left transition-all border-2 ${selectedRouteIndex === index
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-sm'
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                                }`}
                        >
                            {/* Route Header */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {/* Route Line Indicator */}
                                    <div
                                        className="w-1 h-12 rounded-full"
                                        style={{ backgroundColor: getRouteColor(index) }}
                                    />
                                    <div className="flex-1">
                                        {/* Route Badge */}
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                                                style={{ backgroundColor: getRouteColor(index) }}
                                            >
                                                {getRouteBadge(index, route)}
                                            </span>
                                            {selectedRouteIndex === index && (
                                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Time */}
                                        <div className="text-base font-bold text-gray-900 dark:text-white">
                                            {formatDuration(route.duration)}
                                        </div>

                                        {/* Distance */}
                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {formatDistance(route.distance)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Traffic Indicator */}
                            {route.trafficLevel !== undefined && (
                                <div className="ml-3 mt-2 flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all ${route.trafficLevel > 70 ? 'bg-red-500' :
                                                route.trafficLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${route.trafficLevel}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {route.trafficLevel > 70 ? '🔴 Heavy' :
                                            route.trafficLevel > 40 ? '🟡 Moderate' : '🟢 Light'}
                                    </span>
                                </div>
                            )}

                            {/* Via/Through info if available */}
                            {route.summary && (
                                <div className="ml-3 mt-2 text-xs text-gray-500 dark:text-gray-400 truncate">
                                    via {route.summary}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlternativeRoutes;
