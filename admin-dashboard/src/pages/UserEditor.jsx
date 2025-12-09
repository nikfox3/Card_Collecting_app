import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { admin } from '../utils/api';

export default function UserEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [suspendHours, setSuspendHours] = useState(24);
  const [suspendReason, setSuspendReason] = useState('');

  const navigateBackWithState = () => {
    const returnParams = searchParams.get('return');
    if (returnParams) {
      navigate(`/users?${returnParams}`);
    } else {
      navigate('/users');
    }
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await admin.getUser(id);
      const userData = response.data.data;
      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        full_name: userData.full_name || '',
        is_pro: userData.is_pro === 1 || userData.is_pro === true
      });
    } catch (error) {
      console.error('Error loading user:', error);
      setMessage('Error loading user');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      const updates = {
        ...formData,
        is_pro: formData.is_pro ? 1 : 0
      };

      await admin.updateUser(id, updates);
      setMessage('User updated successfully!');
      
      setTimeout(() => {
        loadUser();
      }, 500);
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Error updating user');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendHours || suspendHours <= 0) {
      setMessage('Please enter a valid number of hours');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await admin.suspendUser(id, suspendHours, suspendReason);
      setMessage(`User suspended for ${suspendHours} hours`);
      setSuspendReason('');
      
      setTimeout(() => {
        loadUser();
      }, 500);
    } catch (error) {
      console.error('Error suspending user:', error);
      setMessage('Error suspending user');
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    try {
      setSaving(true);
      setMessage('');

      await admin.activateUser(id);
      setMessage('User activated successfully');
      
      setTimeout(() => {
        loadUser();
      }, 500);
    } catch (error) {
      console.error('Error activating user:', error);
      setMessage('Error activating user');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-slate-400">Loading user...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-400 mb-4">User not found</p>
          <button
            onClick={navigateBackWithState}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const isSuspended = user.is_suspended === 1 || (user.suspended_until && new Date(user.suspended_until) > new Date());

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={navigateBackWithState}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Users
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Manage User</h1>
          <p className="text-slate-400">User ID: {user.id}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
            : 'bg-green-500/20 text-green-400 border border-green-500/50'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pro || false}
                    onChange={(e) => setFormData({ ...formData, is_pro: e.target.checked })}
                    className="w-5 h-5 rounded bg-slate-900/50 border-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-slate-300 text-sm font-medium">Pro Subscription</span>
                </label>
                <p className="text-slate-500 text-xs mt-1 ml-8">Enable paid subscription features for this user</p>
              </div>
            </div>
          </div>

          {/* Suspension Management */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Status</h2>
            
            {isSuspended ? (
              <div className="space-y-4">
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-red-400 font-medium">Account Suspended</span>
                    <button
                      onClick={handleActivate}
                      disabled={saving}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      Activate User
                    </button>
                  </div>
                  {user.suspended_until && (
                    <p className="text-red-300 text-sm">
                      Suspended until: {formatDate(user.suspended_until)}
                    </p>
                  )}
                  {user.suspension_reason && (
                    <p className="text-red-300 text-sm mt-1">
                      Reason: {user.suspension_reason}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <span className="text-green-400 font-medium">Account Active</span>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Suspend User (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8760"
                    value={suspendHours}
                    onChange={(e) => setSuspendHours(parseInt(e.target.value) || 24)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
                  />
                  <input
                    type="text"
                    placeholder="Reason for suspension (optional)"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
                  />
                  <button
                    onClick={handleSuspend}
                    disabled={saving}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Suspend User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-6">
          {/* Usage Statistics */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Usage Statistics</h2>
            <div className="space-y-4">
              <div>
                <div className="text-slate-400 text-sm mb-1">Total Events</div>
                <div className="text-white text-2xl font-bold">{user.total_events || 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Events Today</div>
                <div className="text-white text-2xl font-bold">{user.events_today || 0}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Active Days</div>
                <div className="text-white text-2xl font-bold">{user.active_days || 0}</div>
              </div>
              <div className="pt-4 border-t border-slate-700/50">
                <div className="text-slate-400 text-sm mb-2">Activity Breakdown</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Searches</span>
                    <span className="text-white font-medium">{user.search_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Card Views</span>
                    <span className="text-white font-medium">{user.card_view_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Collection Adds</span>
                    <span className="text-white font-medium">{user.collection_add_count || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
            <div className="space-y-3">
              <div>
                <div className="text-slate-400 text-sm mb-1">Joined</div>
                <div className="text-white text-sm">{formatDate(user.created_at)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Last Updated</div>
                <div className="text-white text-sm">{formatDate(user.updated_at)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">First Activity</div>
                <div className="text-white text-sm">{user.first_activity ? formatDate(user.first_activity) : 'N/A'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">Last Activity</div>
                <div className="text-white text-sm">{user.last_activity ? formatDate(user.last_activity) : 'Never'}</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {user.recent_activity && user.recent_activity.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {user.recent_activity.slice(0, 10).map((activity, index) => (
                  <div key={index} className="text-sm">
                    <div className="text-slate-300">{activity.event_type}</div>
                    <div className="text-slate-500 text-xs">{formatDate(activity.timestamp)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}







