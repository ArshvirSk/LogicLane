const PredictionResults = ({ prediction, onClose }) => {
  if (!prediction) return null;

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "moderate":
        return "#eab308";
      case "low":
        return "#22c55e";
      default:
        return "#6b7280";
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "🔴";
      case "medium":
        return "🟠";
      case "moderate":
        return "🟡";
      case "low":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const getActionIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "🚨";
      case "medium":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "moderate":
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        );
      case "low":
        return "✅";
      default:
        return (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${getSeverityColor(prediction.severity)}20` }}
            >
              <span className="text-2xl">{getSeverityIcon(prediction.severity)}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Route Analysis</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Traffic prediction results</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Main Status */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: getSeverityColor(prediction.severity) }}
                >
                  {prediction.congestionLevel}%
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Traffic Level</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{prediction.severity}</div>
                </div>
              </div>
              <div className="text-right">
                {prediction.timeInfo ? (
                  <>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Travel Time</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{prediction.timeInfo.adjustedDuration} min</div>
                    {prediction.timeInfo.delayMinutes > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">+{prediction.timeInfo.delayMinutes} min delay</div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Est. Delay</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{prediction.estimatedDelay}</div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{prediction.recommendedAction}</p>
              </div>
            </div>
          </div>

          {/* Route */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Route</h3>
            <div className="space-y-2">
              {prediction.location.startLocation && (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{prediction.location.startLocation}</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  B
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{prediction.location.area}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{prediction.location.road}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Conditions</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-2xl mb-1">☁️</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Weather</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{prediction.location.weather}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-2xl mb-1">🚧</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Roadwork</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{prediction.location.roadwork}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-2xl mb-1">📅</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(prediction.location.predictionDate || new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              View on Map
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg font-medium transition-colors border border-gray-300 dark:border-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionResults;
