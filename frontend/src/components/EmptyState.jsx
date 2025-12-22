/**
 * EmptyState Component
 * Friendly messages when no data is available
 */

const EmptyState = ({
    icon,
    title,
    description,
    action,
    actionLabel = "Get Started",
    type = "default"
}) => {
    const icons = {
        predictions: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
        ),
        locations: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
        ),
        search: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        ),
        data: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        error: (
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-6 text-gray-400 dark:text-gray-600">
                {icon || icons[type] || icons.default}
            </div>

            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                {title || "No data available"}
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                {description || "Start by adding some data to see it here."}
            </p>

            {action && (
                <button
                    onClick={action}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
