import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { admin } from "../utils/api";

// Sort icon component
function SortIcon({ active, order }) {
  if (!active) {
    return (
      <svg
        className="w-4 h-4 text-slate-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }
  return order === "ASC" ? (
    <svg
      className="w-4 h-4 text-blue-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 15l7-7 7 7"
      />
    </svg>
  ) : (
    <svg
      className="w-4 h-4 text-blue-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

export default function UsersBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [filterStatus, setFilterStatus] = useState(
    searchParams.get("filterStatus") || "all"
  );
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadUsers();
  }, [page, search, sortBy, sortOrder, filterStatus, itemsPerPage]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (page > 1) params.set("page", page.toString());
    if (filterStatus !== "all") params.set("filterStatus", filterStatus);
    setSearchParams(params);
  }, [search, page, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: itemsPerPage,
        search,
        sortBy,
        sortOrder,
        filterStatus,
      };

      const response = await admin.getUsers(params);
      setUsers(response.data.data);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("DESC");
    }
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (user) => {
    if (
      user.is_suspended === 1 ||
      (user.suspended_until && new Date(user.suspended_until) > new Date())
    ) {
      return (
        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
          Suspended
        </span>
      );
    }
    if (user.is_pro === 1) {
      return (
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
          Pro
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-xs font-medium">
        Free
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Users</h1>
        <p className="text-slate-400">
          Manage user accounts, subscriptions, and access
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 mb-6 border border-slate-700/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search users by username, email, or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pro">Pro Subscribers</option>
            <option value="free">Free Users</option>
          </select>

          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(parseInt(e.target.value));
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-slate-400">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("username")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <span>User</span>
                        <SortIcon
                          active={sortBy === "username"}
                          order={sortOrder}
                        />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-slate-400">Status</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-slate-400">Usage</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("products_collected")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <span>Products Collected</span>
                        <SortIcon
                          active={sortBy === "products_collected"}
                          order={sortOrder}
                        />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("created_at")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <span>Joined</span>
                        <SortIcon
                          active={sortBy === "created_at"}
                          order={sortOrder}
                        />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-slate-400">Last Activity</span>
                    </th>
                    <th className="px-6 py-3 text-right">
                      <span className="text-slate-400">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {user.username || "N/A"}
                          </span>
                          <span className="text-slate-400 text-sm">
                            {user.email || "N/A"}
                          </span>
                          {user.full_name && (
                            <span className="text-slate-500 text-xs">
                              {user.full_name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(user)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-slate-300 text-sm">
                            {user.event_count || 0} events
                          </span>
                          <span className="text-slate-400 text-xs">
                            {user.active_days || 0} active days
                          </span>
                          {user.events_today > 0 && (
                            <span className="text-blue-400 text-xs">
                              {user.events_today} today
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        <span className="text-green-400 font-medium">
                          {user.products_collected || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {user.last_activity
                          ? formatDateTime(user.last_activity)
                          : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/users/${user.id}?return=${encodeURIComponent(
                                  searchParams.toString()
                                )}`
                              )
                            }
                            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-medium"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                <div className="text-slate-400 text-sm">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
