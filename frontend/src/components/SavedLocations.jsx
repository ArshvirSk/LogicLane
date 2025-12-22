import { BuildingOfficeIcon, HomeIcon, MapPinIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useAuth } from '../services/AuthContext';
import { toast } from './Toast';

const SavedLocations = ({ onSelectLocation }) => {
    const { userProfile, updateUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [locations, setLocations] = useState({
        home: '',
        work: '',
        favorite: ''
    });

    useEffect(() => {
        if (userProfile?.savedLocations) {
            setLocations(userProfile.savedLocations);
        }
    }, [userProfile]);

    const handleSave = async () => {
        try {
            await updateUserProfile({
                savedLocations: locations
            });
            setIsEditing(false);
            toast.success('Saved locations updated successfully');
        } catch (error) {
            toast.error('Failed to save locations');
        }
    };

    const handleLocationClick = (location) => {
        if (location && onSelectLocation) {
            onSelectLocation(location);
            toast.info(`Selected: ${location}`);
        }
    };

    const locationIcons = {
        home: <HomeIcon className="w-5 h-5" />,
        work: <BuildingOfficeIcon className="w-5 h-5" />,
        favorite: <MapPinIcon className="w-5 h-5" />
    };

    const locationLabels = {
        home: 'Home',
        work: 'Work',
        favorite: 'Favorite'
    };

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Edit Saved Locations</h3>
                    <button
                        onClick={() => setIsEditing(false)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        Cancel
                    </button>
                </div>

                {Object.keys(locations).map((key) => (
                    <div key={key} className="space-y-1">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            {locationIcons[key]}
                            {locationLabels[key]}
                        </label>
                        <input
                            type="text"
                            value={locations[key]}
                            onChange={(e) => setLocations({ ...locations, [key]: e.target.value })}
                            placeholder={`Enter ${locationLabels[key].toLowerCase()} address`}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                ))}

                <button
                    onClick={handleSave}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                    Save Locations
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Quick Access</h3>
                <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    aria-label="Edit locations"
                >
                    <PencilIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-2">
                {Object.entries(locations).map(([key, value]) => (
                    value ? (
                        <button
                            key={key}
                            onClick={() => handleLocationClick(value)}
                            className="w-full flex items-center gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left group"
                        >
                            <div className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {locationIcons[key]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {locationLabels[key]}
                                </div>
                                <div className="text-sm text-gray-900 dark:text-white truncate">
                                    {value}
                                </div>
                            </div>
                        </button>
                    ) : null
                ))}

                {!locations.home && !locations.work && !locations.favorite && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                    >
                        + Add saved locations
                    </button>
                )}
            </div>
        </div>
    );
};

export default SavedLocations;
