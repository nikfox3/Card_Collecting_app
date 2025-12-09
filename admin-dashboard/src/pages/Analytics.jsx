import { useState, useEffect } from "react";
import { analytics } from "../utils/api";

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [topSearches, setTopSearches] = useState([]);
  const [popularCards, setPopularCards] = useState([]);
  const [timeRange, setTimeRange] = useState("days:7");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, searchesRes, cardsRes] = await Promise.all([
        analytics.getOverview(timeRange),
        analytics.getTopSearches(timeRange, 20),
        analytics.getPopularCards(timeRange, 20),
      ]);

      setOverview(overviewRes.data.data);
      setTopSearches(searchesRes.data.data);
      setPopularCards(cardsRes.data.data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time range label
  const getTimeRangeLabel = () => {
    if (timeRange === "ytd") return "Year-to-Date";
    if (timeRange === "1year") return "Last Year";
    if (timeRange.startsWith("days:")) {
      const days = parseInt(timeRange.split(":")[1]);
      return `Last ${days} day${days !== 1 ? "s" : ""}`;
    }
    return "Last 7 days";
  };

  // Helper function to format average session time
  const formatSessionTime = (seconds) => {
    if (!seconds || seconds === 0) return "0 min";
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-white text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">User behavior and engagement metrics</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: "days:7", label: "7 days" },
            { value: "days:14", label: "14 days" },
            { value: "days:30", label: "30 days" },
            { value: "ytd", label: "YTD" },
            { value: "1year", label: "1 Year" },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range.value
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800/50 text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="text-sm text-slate-400 mb-2">Total Users</div>
            <div className="text-3xl font-bold text-white">
              {overview.total_users || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="text-sm text-slate-400 mb-2">App Opens</div>
            <div className="text-3xl font-bold text-yellow-400">
              {overview.total_app_opens || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="text-sm text-slate-400 mb-2">Avg Session Time</div>
            <div className="text-3xl font-bold text-cyan-400">
              {formatSessionTime(overview.avg_session_time_seconds)}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="text-sm text-slate-400 mb-2">Total Searches</div>
            <div className="text-3xl font-bold text-purple-400">
              {overview.total_searches || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="text-sm text-slate-400 mb-2">Card Views</div>
            <div className="text-3xl font-bold text-blue-400">
              {overview.total_card_views || 0}
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="text-sm text-slate-400 mb-2">Collections Added</div>
            <div className="text-3xl font-bold text-green-400">
              {overview.total_collections_added || 0}
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Searches */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Top Searches
            <span className="text-slate-500 text-sm font-normal ml-2">
              ({getTimeRangeLabel()})
            </span>
          </h2>

          {topSearches && topSearches.length > 0 ? (
            <div className="space-y-2">
              {topSearches.map((search, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-4 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-bold text-sm w-6">
                      #{index + 1}
                    </span>
                    <span className="text-white font-medium">
                      {search.search_term}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm">
                      {search.avg_results?.toFixed(0) || 0} avg results
                    </span>
                    <span className="text-blue-400 font-bold">
                      {search.search_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No search data available yet
            </div>
          )}
        </div>

        {/* Most Viewed Cards */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Most Viewed Cards
            <span className="text-slate-500 text-sm font-normal ml-2">
              ({getTimeRangeLabel()})
            </span>
          </h2>

          {popularCards && popularCards.length > 0 ? (
            <div className="space-y-2">
              {popularCards.map((card, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-4 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-bold text-sm w-6">
                      #{index + 1}
                    </span>
                    <span className="text-white font-medium">
                      {card.card_name}
                    </span>
                  </div>
                  <span className="text-green-400 font-bold">
                    {card.view_count} views
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No card view data available yet
            </div>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-blue-300 text-sm font-medium">
              Analytics Tracking
            </p>
            <p className="text-blue-400/80 text-sm mt-1">
              Analytics tracking needs to be enabled in the main app for data to
              appear here. Once enabled, you'll see search patterns, popular
              cards, and user engagement metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
