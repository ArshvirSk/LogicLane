import { useNavigate } from "react-router-dom";

function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 transition-colors">
            <div className="max-w-lg w-full text-center">
                {/* 404 Icon */}
                <div className="mb-8">
                    <svg
                        className="w-48 h-48 mx-auto text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                {/* Error Message */}
                <div className="mb-8">
                    <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
                        404
                    </h1>
                    <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                        Page Not Found
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                        Oops! The route you're looking for doesn't exist.
                    </p>
                    <p className="text-gray-500 dark:text-gray-500">
                        It seems you've taken a wrong turn in the traffic.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                            Go Back
                        </div>
                    </button>

                    <button
                        onClick={() => navigate("/")}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                />
                            </svg>
                            Go Home
                        </div>
                    </button>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Looking for something specific?
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <button
                            onClick={() => navigate("/traffic-map")}
                            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Traffic Map
                        </button>
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => navigate("/profile")}
                            className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default NotFound;
