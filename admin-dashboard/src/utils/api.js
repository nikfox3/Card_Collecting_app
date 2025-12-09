import axios from "axios";

const API_BASE_URL = "http://localhost:3002/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (password) => api.post("/auth/login", { password }),
  verify: () => api.get("/auth/verify"),
  logout: () => {
    localStorage.removeItem("admin_token");
    return Promise.resolve();
  },
};

// Admin endpoints
export const admin = {
  getDashboardStats: () => api.get("/admin/dashboard/stats"),
  getCards: (params) => api.get("/admin/cards", { params }),
  getCard: (id) => api.get(`/admin/cards/${id}`),
  updateCard: (id, data) => api.put(`/admin/cards/${id}`, data),
  updateGroupsReleaseDate: (groupIds, releaseDate) =>
    api.put("/admin/groups/release-date", { groupIds, releaseDate }),
  createCard: (data) => api.post("/admin/cards", data),
  deleteCard: (id) => api.delete(`/admin/cards/${id}`),
  getMissingDataSummary: () => api.get("/admin/cards/missing/summary"),
  getSystemHealth: () => api.get("/admin/system/health"),
  getPricingDashboard: (timeRange) =>
    api.get(`/admin/pricing-dashboard?timeRange=${timeRange}`),
  importCSV: (csvData, options = {}) =>
    api.post("/admin/csv/import", { csvData, options }),
  exportDatabase: async (format = "full") => {
    const response = await api.get(`/admin/csv/export?format=${format}`, {
      responseType: "blob",
    });
    return response.data;
  },
  getSets: (params) => api.get("/admin/sets", { params }),
  getSet: (id) => api.get(`/admin/sets/${id}`),
  updateSet: (id, data) => api.put(`/admin/sets/${id}`, data),
  getUsers: (params) => api.get("/admin/users", { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  suspendUser: (id, hours, reason) =>
    api.post(`/admin/users/${id}/suspend`, { hours, reason }),
  activateUser: (id) => api.post(`/admin/users/${id}/activate`),
  // Trending Cards
  getTrendingCards: () => api.get("/admin/trending-cards"),
  getAutoTrendingCards: (limit) =>
    api.get("/admin/trending-cards/auto", { params: { limit } }),
  addTrendingCard: (data) => api.post("/admin/trending-cards", data),
  updateTrendingCard: (id, data) =>
    api.put(`/admin/trending-cards/${id}`, data),
  deleteTrendingCard: (id) => api.delete(`/admin/trending-cards/${id}`),
  reorderTrendingCards: (cards) =>
    api.post("/admin/trending-cards/reorder", { cards }),
  searchTrendingCards: (query) =>
    api.get("/admin/trending-cards/search", { params: { q: query } }),
  // Marketplace endpoints
  getMarketplaces: () => api.get("/admin/marketplace"),
  getMarketplace: (platform) => api.get(`/admin/marketplace/${platform}`),
  updateMarketplace: (platform, data) =>
    api.put(`/admin/marketplace/${platform}`, data),
  deleteMarketplace: (platform) => api.delete(`/admin/marketplace/${platform}`),
  // Product marketplace links
  searchMarketplaceProducts: (query, limit) =>
    api.get("/admin/marketplace/products/search", { params: { q: query, limit } }),
  autoFindMarketplaceProducts: (productId, platforms) =>
    api.post("/admin/marketplace/auto-find", { productId, platforms }),
  parseMarketplaceLink: (url) =>
    api.post("/admin/marketplace/parse-link", { url }),
  getProductMarketplaceLinks: (productId) =>
    api.get(`/admin/marketplace/products/${productId}/links`),
  addProductMarketplaceLink: (productId, platform, url) =>
    api.post(`/admin/marketplace/products/${productId}/links`, { platform, url }),
  deleteProductMarketplaceLink: (productId, linkId) =>
    api.delete(`/admin/marketplace/products/${productId}/links/${linkId}`),
};

// Analytics endpoints
export const analytics = {
  getOverview: (timeRange = "days:7") =>
    api.get("/analytics/overview", { params: { timeRange } }),
  getTopSearches: (timeRange = "days:7", limit = 20) =>
    api.get("/analytics/searches/top", { params: { timeRange, limit } }),
  getPopularCards: (timeRange = "days:7", limit = 20) =>
    api.get("/analytics/cards/popular", { params: { timeRange, limit } }),
  getTrends: (timeRange = "days:7") =>
    api.get("/analytics/trends", { params: { timeRange } }),
  getRecentActivity: (limit = 50) =>
    api.get("/analytics/activity/recent", { params: { limit } }),
};

// Pricing monitoring endpoints
export const pricingMonitor = {
  getStats: () => api.get("/pricing-monitor/stats"),
  getApiStatus: () => api.get("/pricing-monitor/api-status"),
  triggerCollection: () => api.post("/pricing-monitor/collect"),
  getLogs: () => api.get("/pricing-monitor/logs"),
};

export default api;
