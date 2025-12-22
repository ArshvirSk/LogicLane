import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const Analytics = () => {
  const analyticsData = {
    overview: {
      totalRecords: 8936,
      dataQuality: 100.0,
      avgTrafficVolume: 29236,
      peakTraffic: 72039,
      minTraffic: 4233,
      trafficVariability: 44.5,
    },
    areaInsights: [
      { area: "Koramangala", avgTraffic: 40832, percentage: 18.5 },
      { area: "M.G. Road", avgTraffic: 35300, percentage: 16.8 },
      { area: "Indiranagar", avgTraffic: 32284, percentage: 15.4 },
      { area: "Hebbal", avgTraffic: 26533, percentage: 12.6 },
      { area: "Jayanagar", avgTraffic: 24601, percentage: 11.7 },
      { area: "Whitefield", avgTraffic: 21295, percentage: 10.1 },
      { area: "Yeshwanthpur", avgTraffic: 18932, percentage: 9.0 },
      { area: "Electronic City", avgTraffic: 16347, percentage: 7.8 },
    ],
    weatherImpact: [
      { condition: "Windy", avgTraffic: 30163, impact: 3.8 },
      { condition: "Rain", avgTraffic: 29559, impact: 1.7 },
      { condition: "Fog", avgTraffic: 29183, impact: 0.4 },
      { condition: "Clear", avgTraffic: 29167, impact: 0.4 },
      { condition: "Overcast", avgTraffic: 29053, impact: 0.0 },
    ],
    keyCorrelations: [
      { factor: "Environmental Impact", correlation: 1.0 },
      { factor: "Congestion Level", correlation: 0.837 },
      { factor: "Travel Time Index", correlation: 0.698 },
      { factor: "Road Capacity Utilization", correlation: 0.653 },
    ],
  };

  const COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-blue-500 dark:bg-blue-600 rounded-3xl shadow-xl mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-blue-500 dark:text-blue-400 mb-4">
            Traffic Analytics Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Advanced data insights and predictive analysis for Bangalore's
            traffic ecosystem
          </p>
        </div>

        {/* Enhanced Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-blue-100 dark:border-blue-900 hover:border-blue-200 dark:hover:border-blue-700 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-500/10 dark:to-cyan-500/10 rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Complete
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Dataset Size
              </h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
                {analyticsData.overview.totalRecords.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Traffic records analyzed</p>
            </div>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-emerald-100 hover:border-emerald-200 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                  Perfect
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Data Quality
              </h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-1">
                {analyticsData.overview.dataQuality}%
              </p>
              <p className="text-sm text-gray-600">Accuracy & completeness</p>
            </div>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-amber-100 hover:border-amber-200 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                  Average
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Traffic Volume
              </h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-1">
                {analyticsData.overview.avgTrafficVolume.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Daily average vehicles</p>
            </div>
          </div>

          <div className="group relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-red-100 hover:border-red-200 transform hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-3xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  Peak
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Peak Traffic
              </h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-1">
                {analyticsData.overview.peakTraffic.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Maximum recorded volume</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Area-wise Traffic Bar Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              <svg
                className="w-7 h-7 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Traffic by Area
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.areaInsights}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="area"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => [value.toLocaleString(), "Avg Traffic"]}
                />
                <Bar dataKey="avgTraffic" fill="#4ECDC4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Weather Impact Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
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
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
              Weather Impact on Traffic
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.weatherImpact}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="condition" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [value.toLocaleString(), "Avg Traffic"]}
                />
                <Bar dataKey="avgTraffic" fill="#FF6B6B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart and Correlations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Area Distribution Pie Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              <svg
                className="w-7 h-7 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Traffic Distribution by Area
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.areaInsights}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ area, percentage }) => `${area}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {analyticsData.areaInsights.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Key Correlations */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🔗 Key Traffic Correlations
            </h2>
            <div className="space-y-4">
              {analyticsData.keyCorrelations.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-700">
                    {item.factor}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${item.correlation * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-blue-600">
                      {item.correlation.toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
