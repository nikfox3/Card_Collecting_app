import { useState, useEffect } from 'react';
import { admin, analytics, pricingMonitor } from '../utils/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [topSearches, setTopSearches] = useState([]);
  const [pricingStats, setPricingStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collectingPrices, setCollectingPrices] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, analyticsRes, searchesRes, pricingStatsRes] = await Promise.all([
        admin.getDashboardStats(),
        analytics.getOverview(7),
        analytics.getTopSearches(7, 10),
        fetch('http://localhost:3001/api/pricing-monitor/stats').then(res => res.json()).catch(() => null)
      ]);

      setStats(statsRes.data.stats);
      setAnalyticsData(analyticsRes.data.data);
      setTopSearches(searchesRes.data.data);
      setPricingStats(pricingStatsRes?.data || null);
      console.log('Pricing stats loaded:', pricingStatsRes?.data);
      console.log('Full pricing stats response:', pricingStatsRes);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectPrices = async () => {
    try {
      setCollectingPrices(true);
      const response = await pricingMonitor.triggerCollection();
      
      // Show more informative success message
      const message = response.data.message || 'Price collection started!';
      const progress = response.data.progress;
      
      let successMessage = message;
      if (progress) {
        successMessage += `\n\nCurrent Progress: ${progress.progressPercentage}% (${progress.cardsCollected.toLocaleString()} / ${progress.totalCards.toLocaleString()} cards)`;
      }
      
      alert(successMessage);
      
      // Refresh pricing stats after a short delay
      setTimeout(() => {
        loadDashboardData();
      }, 2000);
    } catch (error) {
      console.error('Error starting price collection:', error);
      alert('Failed to start price collection. Check console for details.');
    } finally {
      setCollectingPrices(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-slate-400">Welcome to the admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Cards */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-sm font-medium">Total Cards</h3>
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.total_cards?.toLocaleString() || '0'}
          </div>
          <div className="text-slate-500 text-xs">
            Across {stats?.total_sets || 0} sets
          </div>
        </div>

        {/* Pricing Coverage */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-sm font-medium">Pricing Coverage</h3>
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.pricing_coverage || '0'}%
          </div>
          <div className="text-slate-500 text-xs">
            {stats?.cards_with_pricing?.toLocaleString() || 0} cards with pricing
          </div>
        </div>

        {/* Artist Coverage */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-sm font-medium">Artist Coverage</h3>
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.artist_coverage || '0'}%
          </div>
          <div className="text-slate-500 text-xs">
            {stats?.cards_with_artist?.toLocaleString() || 0} cards with artist
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-400 text-sm font-medium">Active Today</h3>
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.active_users_today || '0'}
          </div>
          <div className="text-slate-500 text-xs">
            {stats?.searches_today || 0} searches today
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/cards?filter=no_price"
            className="flex flex-col items-center justify-center p-4 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-600/50 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-8 h-8 text-yellow-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-white text-sm font-medium">Fix Missing Prices</span>
            <span className="text-slate-400 text-xs mt-1">
              {(stats?.total_cards || 0) - (stats?.cards_with_pricing || 0)} cards
            </span>
          </a>

          <a
            href="/cards?filter=no_artist"
            className="flex flex-col items-center justify-center p-4 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-600/50 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-8 h-8 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="text-white text-sm font-medium">Fix Missing Artists</span>
            <span className="text-slate-400 text-xs mt-1">
              {(stats?.total_cards || 0) - (stats?.cards_with_artist || 0)} cards
            </span>
          </a>

          <a
            href="/import"
            className="flex flex-col items-center justify-center p-4 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-600/50 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-8 h-8 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span className="text-white text-sm font-medium">Import CSV</span>
            <span className="text-slate-400 text-xs mt-1">Bulk update</span>
          </a>

          <a
            href="/analytics"
            className="flex flex-col items-center justify-center p-4 bg-slate-900/50 hover:bg-slate-900/70 border border-slate-600/50 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-8 h-8 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-white text-sm font-medium">View Analytics</span>
            <span className="text-slate-400 text-xs mt-1">User insights</span>
          </a>
        </div>
      </div>

      {/* Pricing Monitoring Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Pricing Monitoring</h2>
          <button
            onClick={handleCollectPrices}
            disabled={collectingPrices}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {collectingPrices ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Collecting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {pricingStats?.collection_progress ? 
                  `Continue Collection (${pricingStats.collection_progress.progressPercentage || 0}%)` : 
                  'Collect Prices Now'
                }
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Data Sources Status */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Data Sources</h3>
            <div className="space-y-2">
              {pricingStats ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">TCGCSV Data</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                      {pricingStats.tcgcsv_records?.toLocaleString() || 0} records
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Pokemon Tracker</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                      {pricingStats.pokemon_tracker_records?.toLocaleString() || 0} records
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs mt-2">
                    Total: {(() => {
                      const tcgcsv = pricingStats?.tcgcsv_records || 0;
                      const pokemon = pricingStats?.pokemon_tracker_records || 0;
                      const total = tcgcsv + pokemon;
                      console.log('TCGCSV records:', tcgcsv);
                      console.log('Pokemon tracker records:', pokemon);
                      console.log('Total calculation:', total);
                      return total?.toLocaleString() || 0;
                    })()} price records
                  </div>
                </>
              ) : (
                <div className="text-slate-500 text-sm">Loading data sources...</div>
              )}
            </div>
          </div>

          {/* Collection Stats */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Last Collection</h3>
            {pricingStats ? (
              <div className="space-y-2">
                <div className="text-white font-semibold">
                  {pricingStats.last_collection_date ? 
                    (() => {
                      const dateStr = pricingStats.last_collection_date;
                      const [year, month, day] = dateStr.split('-');
                      return new Date(year, month - 1, day).toLocaleDateString();
                    })() : 'Never'}
                </div>
                {pricingStats.last_collection_by_source && pricingStats.last_collection_by_source.length > 0 ? (
                  <div className="space-y-1">
                    {pricingStats.last_collection_by_source.slice(0, 2).map((source, index) => (
                      <div key={index} className="text-slate-400 text-xs">
                        {source.source}: {(() => {
                          const dateStr = source.last_collection_date;
                          const [year, month, day] = dateStr.split('-');
                          return new Date(year, month - 1, day).toLocaleDateString();
                        })()}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs">
                    {pricingStats.cards_processed || 0} cards processed
                  </div>
                )}
                <div className="text-slate-400 text-xs">
                  {pricingStats.success_rate || 0}% success rate
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No collection data</div>
            )}
          </div>

          {/* Collection Progress */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Collection Progress</h3>
            {pricingStats?.collection_progress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Pokemon Tracker</span>
                  <span className="text-white font-semibold">
                    {pricingStats.collection_progress.progressPercentage || 0}%
                  </span>
                </div>
                <div className="text-slate-400 text-xs">
                  {pricingStats.collection_progress.cardsCollected?.toLocaleString() || 0} cards collected
                </div>
                <div className="text-slate-400 text-xs text-slate-500">
                  of {pricingStats.collection_progress.totalCardsAvailable?.toLocaleString() || 0} available products
                </div>
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pricingStats.collection_progress.progressPercentage || 0, 100)}%` }}
                  ></div>
                </div>
                {pricingStats.collection_progress.highValueProductsCount > 0 && (
                  <div className="text-slate-500 text-xs pt-1 border-t border-slate-700/50">
                    {pricingStats.collection_progress.highValueProductsCount?.toLocaleString()} high-value products (price &gt; $10)
                  </div>
                )}
                <div className="text-slate-400 text-xs pt-1">
                  Last updated: {pricingStats.collection_progress.lastCollectionDate ? 
                    (() => {
                      const dateStr = pricingStats.collection_progress.lastCollectionDate;
                      const [year, month, day] = dateStr.split('-');
                      return new Date(year, month - 1, day).toLocaleDateString();
                    })() : 'Never'}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Loading progress...</div>
            )}
          </div>

          {/* Price History Records */}
          <div className="bg-slate-900/50 rounded-lg p-4">
            <h3 className="text-slate-400 text-sm font-medium mb-2">Price History</h3>
            {pricingStats ? (
              <div className="space-y-1">
                <div className="text-white font-semibold">
                  {pricingStats.total_price_records?.toLocaleString() || 0}
                </div>
                <div className="text-slate-400 text-xs">
                  Total price records
                </div>
                <div className="text-slate-500 text-xs pt-1">
                  {pricingStats.unique_cards_with_history?.toLocaleString() || 0} cards with history
                </div>
                {pricingStats.price_history_range?.earliest_date && pricingStats.price_history_range?.latest_date && (
                  <div className="text-slate-500 text-xs pt-1 border-t border-slate-700/50 mt-1">
                    {(() => {
                      const earliest = new Date(pricingStats.price_history_range.earliest_date);
                      const latest = new Date(pricingStats.price_history_range.latest_date);
                      return `${earliest.toLocaleDateString()} - ${latest.toLocaleDateString()}`;
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Loading data...</div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Searches */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Top Searches (7 days)</h2>
          {topSearches && topSearches.length > 0 ? (
            <div className="space-y-3">
              {topSearches.map((search, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-bold text-sm w-6">{index + 1}</span>
                    <span className="text-white">{search.search_term}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm">{search.avg_results?.toFixed(0) || 0} results</span>
                    <span className="text-blue-400 font-semibold">{search.search_count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No search data yet. Users haven't searched anything.
            </div>
          )}
        </div>

        {/* Data Quality */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Data Quality</h2>
          <div className="space-y-4">
            {/* Pricing */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Pricing Coverage</span>
                <span className="text-white font-semibold">{stats?.pricing_coverage || 0}%</span>
              </div>
              <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.pricing_coverage || 0}%` }}
                ></div>
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {stats?.cards_with_pricing?.toLocaleString() || 0} / {stats?.total_cards?.toLocaleString() || 0} cards
              </div>
            </div>

            {/* Artist */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300">Artist Coverage</span>
                <span className="text-white font-semibold">{stats?.artist_coverage || 0}%</span>
              </div>
              <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.artist_coverage || 0}%` }}
                ></div>
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {stats?.cards_with_artist?.toLocaleString() || 0} / {stats?.total_cards?.toLocaleString() || 0} cards
              </div>
            </div>

            {/* Quick Stats */}
            <div className="pt-4 border-t border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Average Price</span>
                <span className="text-white font-semibold">${stats?.avg_price?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Highest Price</span>
                <span className="text-white font-semibold">${stats?.max_price?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Overview */}
      {analyticsData && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Activity (Last 7 Days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{analyticsData.total_users || 0}</div>
              <div className="text-slate-400 text-sm mt-1">Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{analyticsData.total_sessions || 0}</div>
              <div className="text-slate-400 text-sm mt-1">Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{analyticsData.total_searches || 0}</div>
              <div className="text-slate-400 text-sm mt-1">Searches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">{analyticsData.total_card_views || 0}</div>
              <div className="text-slate-400 text-sm mt-1">Card Views</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



