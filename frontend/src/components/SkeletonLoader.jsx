/**
 * Reusable Skeleton Loader Components
 * Provides better loading UX than spinners
 */

export const SkeletonCard = () => (
    <div className="animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-6 space-y-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
            </div>
        </div>
    </div>
);

export const SkeletonPredictionCard = () => (
    <div className="animate-pulse bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
    </div>
);

export const SkeletonMap = () => (
    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg w-full h-[500px] flex items-center justify-center">
        <div className="text-gray-400 dark:text-gray-500">Loading map...</div>
    </div>
);

export const SkeletonList = ({ items = 3 }) => (
    <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
            </div>
        ))}
    </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
    <div className="animate-pulse overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            ))}
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                    {Array.from({ length: cols }).map((_, colIdx) => (
                        <div key={colIdx} className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            ))}
        </div>
    </div>
);

export const SkeletonInput = () => (
    <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
);

export const SkeletonButton = () => (
    <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
);

export default {
    Card: SkeletonCard,
    PredictionCard: SkeletonPredictionCard,
    Map: SkeletonMap,
    List: SkeletonList,
    Table: SkeletonTable,
    Input: SkeletonInput,
    Button: SkeletonButton
};
