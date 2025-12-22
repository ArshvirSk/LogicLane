import { useState } from "react";

const WaypointManager = ({ onOptimize, isLoading }) => {
    const [waypoints, setWaypoints] = useState([]);
    const [newWaypoint, setNewWaypoint] = useState("");
    const [draggedIndex, setDraggedIndex] = useState(null);

    const addWaypoint = () => {
        if (newWaypoint.trim()) {
            setWaypoints([...waypoints, newWaypoint.trim()]);
            setNewWaypoint("");
        }
    };

    const removeWaypoint = (index) => {
        setWaypoints(waypoints.filter((_, i) => i !== index));
    };

    const handleDragStart = (index) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (dropIndex) => {
        if (draggedIndex === null) return;

        const newWaypoints = [...waypoints];
        const draggedItem = newWaypoints[draggedIndex];
        newWaypoints.splice(draggedIndex, 1);
        newWaypoints.splice(dropIndex, 0, draggedItem);

        setWaypoints(newWaypoints);
        setDraggedIndex(null);
    };

    const handleOptimize = () => {
        if (waypoints.length >= 2) {
            onOptimize(waypoints);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                    Multi-Stop Route
                </h3>
            </div>

            {/* Add Waypoint Input */}
            <div className="flex gap-1 mb-2">
                <input
                    type="text"
                    value={newWaypoint}
                    onChange={(e) => setNewWaypoint(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addWaypoint()}
                    placeholder="Add a stop..."
                    className="flex-1 px-2 py-1.5 text-xs border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <button
                    onClick={addWaypoint}
                    className="px-2 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    disabled={!newWaypoint.trim()}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Waypoint List */}
            {waypoints.length > 0 && (
                <div className="space-y-1 mb-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Drag to reorder stops:
                    </p>
                    {waypoints.map((waypoint, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(index)}
                            className={`flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 cursor-move hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${draggedIndex === index ? 'opacity-50' : ''
                                }`}
                        >
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-semibold">
                                {index + 1}
                            </span>
                            <span className="flex-1 text-xs text-gray-700 dark:text-gray-300 truncate">
                                {waypoint}
                            </span>
                            <button
                                onClick={() => removeWaypoint(index)}
                                className="flex-shrink-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Optimize Button */}
            {waypoints.length >= 2 && (
                <button
                    onClick={handleOptimize}
                    disabled={isLoading}
                    className="w-full py-1.5 px-3 bg-purple-600 text-white rounded font-medium text-xs hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                >
                    {isLoading ? (
                        <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Optimizing...
                        </>
                    ) : (
                        <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Optimize Route Order
                        </>
                    )}
                </button>
            )}

            {waypoints.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    Add at least 2 stops to optimize your route
                </p>
            )}
        </div>
    );
};

export default WaypointManager;
