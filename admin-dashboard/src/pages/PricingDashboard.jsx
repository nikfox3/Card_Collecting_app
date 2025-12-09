import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { admin } from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PricingDashboard = () => {
  const [pricingData, setPricingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCard, setSelectedCard] = useState(null);
  const [cardPricingHistory, setCardPricingHistory] = useState(null);
  const [calendarDates, setCalendarDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateData, setDateData] = useState(null);
  const [dateLogs, setDateLogs] = useState(null);
  const [loadingDateData, setLoadingDateData] = useState(false);

  // Fetch pricing dashboard data
  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const response = await admin.getPricingDashboard(timeRange);
      if (response.data.success) {
        setPricingData(response.data.data);
      } else {
        console.error('Failed to fetch pricing data');
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual card pricing history
  const fetchCardPricingHistory = async (cardId) => {
    try {
      const response = await fetch(`http://localhost:3002/api/cards/${cardId}/price-history?timeRange=30d`);
      if (response.ok) {
        const data = await response.json();
        setCardPricingHistory(data);
      }
    } catch (error) {
      console.error('Error fetching card pricing history:', error);
    }
  };

  // Fetch calendar dates
  const fetchCalendarDates = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/pricing-monitor/calendar-dates');
      if (response.ok) {
        const data = await response.json();
        setCalendarDates(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching calendar dates:', error);
    }
  };

  // Fetch data for selected date
  const fetchDateData = async (date) => {
    try {
      setLoadingDateData(true);
      const [dataRes, logsRes] = await Promise.all([
        fetch(`http://localhost:3002/api/pricing-monitor/date/${date}`),
        fetch(`http://localhost:3002/api/pricing-monitor/date/${date}/logs`)
      ]);

      if (dataRes.ok) {
        const data = await dataRes.json();
        setDateData(data.data);
      }

      if (logsRes.ok) {
        const logs = await logsRes.json();
        console.log('Logs response:', logs);
        setDateLogs(logs.data);
      } else {
        console.log('Logs response not ok:', logsRes.status, logsRes.statusText);
      }
    } catch (error) {
      console.error('Error fetching date data:', error);
    } finally {
      setLoadingDateData(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
    fetchCalendarDates();
  }, [timeRange]);

  useEffect(() => {
    if (selectedDate) {
      fetchDateData(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedCard) {
      fetchCardPricingHistory(selectedCard.product_id);
    }
  }, [selectedCard]);

  // Chart configurations
  const priceTrendConfig = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Price Trends Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toFixed(2);
          }
        }
      }
    }
  };

  const priceDistributionConfig = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Price Distribution',
      },
    }
  };

  const setPerformanceConfig = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top Performing Sets',
      },
    }
  };

  // Calendar helper functions
  const hasDataForDate = (dateStr) => {
    return calendarDates.some(d => d.date === dateStr);
  };

  const getDateData = (dateStr) => {
    return calendarDates.find(d => d.date === dateStr);
  };

  // Clean card names similar to server-side cleaning
  const cleanCardName = (name) => {
    if (!name) return name;
    let cleaned = name.replace(/\s*-\s*\d+\/?\d*\s*$/, '');
    cleaned = cleaned.replace(/\s*\([A-Z]?\d+\)\s*$/, '');
    cleaned = cleaned.replace(/\s*\([A-Z]\d+\)\s*$/, '');
    cleaned = cleaned.replace(/\s*\([A-Z]+\)\s*$/, '');
    return cleaned.trim();
  };

  const formatDateForDisplay = (dateStr) => {
    // Parse the date string as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const cleanSetNameLocal = (name) => {
    if (!name) return name;
    let n = String(name);
    n = n.replace(/^(SWSH\d+:\s*)/i, '');
    n = n.replace(/^(SV\d+:\s*)/i, '');
    n = n.replace(/^(SM\s*-\s*)/i, '');
    n = n.replace(/^(XY\s*-\s*)/i, '');
    n = n.replace(/^(ME\d+:\s*)/i, '');
    n = n.replace(/^(SVE:\s*)/i, '');
    n = n.replace(/^(SV:\s*)/i, '');
    return n.trim();
  };

  const formatDateForApi = (date) => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  if (!pricingData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Failed to load pricing data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pricing Dashboard</h1>
          <p className="text-slate-400">Track pricing trends, analytics, and market insights</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[
              { value: '1d', label: '1 Day' },
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: '90d', label: '90 Days' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Price Records</p>
                <p className="text-2xl font-bold text-white">{pricingData.summary.totalRecords.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Average Price</p>
                <p className="text-2xl font-bold text-white">${pricingData.summary.averagePrice.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Highest Price</p>
                <p className="text-2xl font-bold text-white">${pricingData.summary.highestPrice.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Price Updates Today</p>
                <p className="text-2xl font-bold text-white">{pricingData.summary.updatesToday.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Pricing History Calendar</h2>
          <div className="bg-slate-900/50 rounded-lg p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-lg font-semibold text-white">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-slate-400 font-medium text-sm py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-10"></div>;
                }

                const dateStr = formatDateForApi(date);
                const hasData = hasDataForDate(dateStr);
                const dateInfo = hasData ? getDateData(dateStr) : null;
                const isToday = formatDateForApi(new Date()) === dateStr;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-10 rounded-lg text-sm transition-colors relative ${
                      isSelected
                        ? 'bg-blue-500 text-white'
                        : hasData
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-white border border-green-500/30'
                        : isToday
                        ? 'bg-blue-500/20 text-white border border-blue-500/30'
                        : 'bg-slate-700/30 hover:bg-slate-700/50 text-slate-300'
                    }`}
                    title={hasData ? `${dateInfo?.records_count || 0} records, ${dateInfo?.cards_count || 0} cards` : ''}
                  >
                    {date.getDate()}
                    {hasData && (
                      <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500/20 border border-green-500/30 rounded"></div>
                <span className="text-slate-300 text-xs">Has pricing data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/20 border border-blue-500/30 rounded"></div>
                <span className="text-slate-300 text-xs">Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Price Trends Chart */}
          <div className="bg-slate-800 rounded-xl p-6">
            <Line data={pricingData.charts.priceTrends} options={priceTrendConfig} />
          </div>

          {/* Price Distribution Chart */}
          <div className="bg-slate-800 rounded-xl p-6">
            <Doughnut data={pricingData.charts.priceDistribution} options={priceDistributionConfig} />
          </div>

          {/* Set Performance Chart */}
          <div className="bg-slate-800 rounded-xl p-6">
            <Bar data={pricingData.charts.setPerformance} options={setPerformanceConfig} />
          </div>

          {/* Recent Updates */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Price Updates</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pricingData.recentUpdates.map((update, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={update.image_url} 
                      alt={update.name}
                      className="w-10 h-10 rounded object-cover"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div>
                      <p className="text-white text-sm font-medium">{update.name}</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-slate-400 text-xs">{cleanSetNameLocal(update.clean_set_name || update.set_name)}</p>
                        {update.sub_type_name && (
                          <span className="px-1 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                            {update.sub_type_name}
                          </span>
                        )}
                        {update.ext_card_type && (
                          <span className="px-1 py-0.5 bg-green-500/20 text-green-300 text-xs rounded">
                            {update.ext_card_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${update.market_price?.toFixed(2) || 'N/A'}</p>
                    <p className="text-slate-400 text-xs">{update.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Cards Table */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Top Value Cards</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-300">Card</th>
                  <th className="text-left py-3 px-4 text-slate-300">Set</th>
                  <th className="text-right py-3 px-4 text-slate-300">Current Price</th>
                  <th className="text-right py-3 px-4 text-slate-300">7d Change</th>
                  <th className="text-right py-3 px-4 text-slate-300">30d Change</th>
                  <th className="text-center py-3 px-4 text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pricingData.topCards.map((card, index) => (
                  <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={card.image_url} 
                          alt={card.name}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        <div>
                          <p className="text-white font-medium">{card.name}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-slate-400 text-sm">{card.ext_rarity}</p>
                            {card.sub_type_name && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                {card.sub_type_name}
                              </span>
                            )}
                            {card.ext_card_type && (
                              <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                {card.ext_card_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{cleanSetNameLocal(card.clean_set_name || card.set_name)}</td>
                    <td className="py-3 px-4 text-right text-white font-semibold">
                      ${card.market_price?.toFixed(2) || 'N/A'}
                    </td>
                    <td className={`py-3 px-4 text-right ${card.priceChange7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {card.priceChange7d >= 0 ? '+' : ''}{card.priceChange7d?.toFixed(1) || 0}%
                    </td>
                    <td className={`py-3 px-4 text-right ${card.priceChange30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {card.priceChange30d >= 0 ? '+' : ''}{card.priceChange30d?.toFixed(1) || 0}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedCard(card)}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card Pricing History Modal */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Pricing History: {selectedCard.name}
                </h3>
                <button
                  onClick={() => {
                    setSelectedCard(null);
                    setCardPricingHistory(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {cardPricingHistory && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-sm">Current Price</p>
                      <p className="text-2xl font-bold text-white">
                        ${cardPricingHistory.currentPrice?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-sm">7d Change</p>
                      <p className={`text-2xl font-bold ${cardPricingHistory.change7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {cardPricingHistory.change7d >= 0 ? '+' : ''}{cardPricingHistory.change7d?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <div className="bg-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-sm">30d Change</p>
                      <p className={`text-2xl font-bold ${cardPricingHistory.change30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {cardPricingHistory.change30d >= 0 ? '+' : ''}{cardPricingHistory.change30d?.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>

                  {cardPricingHistory.history && cardPricingHistory.history.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Price History Chart</h4>
                      <Line 
                        data={{
                          labels: cardPricingHistory.history.map(h => new Date(h.date).toLocaleDateString()),
                          datasets: [{
                            label: 'Market Price',
                            data: cardPricingHistory.history.map(h => h.market_price),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.1
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              labels: {
                                color: 'white'
                              }
                            }
                          },
                          scales: {
                            x: {
                              ticks: {
                                color: 'white'
                              },
                              grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                              }
                            },
                            y: {
                              ticks: {
                                color: 'white',
                                callback: function(value) {
                                  return '$' + value.toFixed(2);
                                }
                              },
                              grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date Detail Modal */}
        {selectedDate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  Pricing Data: {formatDateForDisplay(selectedDate)}
                </h3>
                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setDateData(null);
                    setDateLogs(null);
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingDateData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : dateData ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  {dateData.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Total Records</p>
                        <p className="text-2xl font-bold text-white">{dateData.summary.total_records?.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Unique Cards</p>
                        <p className="text-2xl font-bold text-white">{dateData.summary.unique_cards?.toLocaleString() || 0}</p>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Avg Price</p>
                        <p className="text-2xl font-bold text-white">${dateData.summary.avg_price || 0}</p>
                      </div>
                      <div className="bg-slate-700 rounded-lg p-4">
                        <p className="text-slate-400 text-sm">Price Range</p>
                        <p className="text-sm font-semibold text-white">
                          ${dateData.summary.min_price || 0} - ${dateData.summary.max_price || 0}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Sources Breakdown */}
                  {dateData.sources && dateData.sources.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Data Sources</h4>
                      <div className="space-y-2">
                        {dateData.sources.map((source, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                            <span className="text-white font-medium">{source.source_group}</span>
                            <div className="flex items-center gap-4 text-sm text-slate-300">
                              <span>{source.cards_count} cards</span>
                              <span>{source.records_count} records</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Cards */}
                  {dateData.sampleCards && dateData.sampleCards.length > 0 && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Sample Cards (Top 50 by Price)</h4>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="space-y-2">
                          {dateData.sampleCards.map((card, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-slate-800 rounded">
                              <div className="flex items-center gap-3">
                                {card.image_url && (
                                  <img 
                                    src={card.image_url} 
                                    alt={card.card_name}
                                    className="w-10 h-10 rounded object-cover"
                                    onError={(e) => e.target.style.display = 'none'}
                                  />
                                )}
                                <div>
                                  <p className="text-white font-medium text-sm">{cleanCardName(card.card_name) || `Card ${card.product_id}`}</p>
                                  <p className="text-slate-400 text-xs">{card.source}</p>
                                </div>
                              </div>
                              <p className="text-white font-semibold">${card.market_price?.toFixed(2) || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Log File */}
                  {dateLogs && (
                    <div className="bg-slate-700 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3">Collection Log File</h4>
                      {console.log('dateLogs in render:', dateLogs)}
                      {dateLogs.exists ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">File: {dateLogs.filename}</span>
                            <span className="text-slate-400">Size: {(dateLogs.size / 1024).toFixed(2)} KB</span>
                          </div>
                          <div className="bg-slate-900 rounded p-4 max-h-64 overflow-y-auto">
                            <pre className="text-xs text-slate-300 whitespace-pre-wrap">
                              {dateLogs.content.join('\n')}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm">No log file found for this date.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No data available for this date.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingDashboard;
