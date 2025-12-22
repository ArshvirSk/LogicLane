import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../services/AuthContext';
import { toast } from './Toast';

const RecentSearches = ({ onSelectSearch, maxItems = 5 }) => {
    const { userProfile, updateUserProfile } = useAuth();
    const recentSearches = userProfile?.recentSearches || [];

    const handleSelectSearch = (search) => {
        if (onSelectSearch) {
            onSelectSearch(search);
            toast.info('Search loaded');
        }
    };

    const handleRemoveSearch = async (searchToRemove) => {
        try {
            const updatedSearches = recentSearches.filter(
                search => JSON.stringify(search) !== JSON.stringify(searchToRemove)
            );

            await updateUserProfile({
                recentSearches: updatedSearches
            });

            toast.success('Search removed');
        } catch (error) {
            toast.error('Failed to remove search');
        }
    };

    const handleClearAll = async () => {
        try {
            await updateUserProfile({
                recentSearches: []
            });
            toast.success('Recent searches cleared');
        } catch (error) {
            toast.error('Failed to clear searches');
        }
    };

    if (recentSearches.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    Recent Searches
                </h3>
                <button
                    onClick={handleClearAll}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                    Clear All
                </button>
            </div>

            <div className="space-y-2">
                {recentSearches.slice(0, maxItems).map((search, index) => (
                    <div
                        key={index}
                        className="group flex items-start gap-2 p-3 rounded-md bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        <button
                            onClick={() => handleSelectSearch(search)}
                            className="flex-1 text-left min-w-0"
                        >
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {search.startLocation} → {search.areaName}, {search.roadName}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
                                    {search.weatherConditions}
                                </span>
                                <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
                                    {search.roadworkActivity === 'Yes' ? 'Roadwork' : 'No Roadwork'}
                                </span>
                                {search.predictionDate && (
                                    <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded">
                                        {new Date(search.predictionDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSearch(search);
                            }}
                            className="flex-shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove search"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentSearches;
