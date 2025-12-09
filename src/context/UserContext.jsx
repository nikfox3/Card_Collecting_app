import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_URL } from '../utils/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('sessionToken'));

  // Load user data on mount - this ensures user stays logged in across page refreshes
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('sessionToken');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
          const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            // Valid session - restore user state
            setUser(data.user);
            setSessionToken(token);
            console.log('✅ Session restored - user logged in');
          } else {
            // Invalid response
            localStorage.removeItem('sessionToken');
            setSessionToken(null);
          }
        } else {
          // Invalid or expired session - clear token
          const errorData = await response.json().catch(() => ({}));
          console.log('Session invalid or expired:', errorData.error || 'Unknown error');
          localStorage.removeItem('sessionToken');
          setSessionToken(null);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        // Don't clear token on network errors - might be temporary
        // Only clear if it's a clear authentication error (not a network issue)
        // Network errors (Failed to fetch, etc.) should not clear the token
        // as the user might still have a valid session, just can't verify it right now
        const errorMessage = error.message || '';
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          localStorage.removeItem('sessionToken');
          setSessionToken(null);
        } else {
          // For network errors, keep the token - user might still be logged in
          // The app will handle showing login screen if needed
          console.log('Network error during session check - keeping token for potential retry');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Clear guest data before setting user
        clearGuestData();
        
        setUser(data.user);
        setSessionToken(data.sessionToken);
        localStorage.setItem('sessionToken', data.sessionToken);
        
        // Reload user-specific data from backend
        await reloadUserData(data.sessionToken);
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email, username, password, fullName) => {
    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, password, fullName })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Clear guest data before setting user
        clearGuestData();
        
        setUser(data.user);
        setSessionToken(data.sessionToken);
        localStorage.setItem('sessionToken', data.sessionToken);
        
        // Reload user-specific data from backend
        await reloadUserData(data.sessionToken);
        
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Clear guest data from localStorage
  const clearGuestData = () => {
    try {
      // Clear user database data
      localStorage.removeItem('pokemonCardCollector_userData');
      
      // Clear other guest-related data
      localStorage.removeItem('user_uuid');
      
      // Clear wishlist if stored separately
      localStorage.removeItem('wishlist');
      
      // Clear pricing alerts if stored separately
      localStorage.removeItem('pricingAlerts');
      localStorage.removeItem('pricing_alerts');
      
      console.log('✅ Cleared guest data from localStorage');
    } catch (error) {
      console.error('Error clearing guest data:', error);
    }
  };

  // Reload user-specific data from backend
  const reloadUserData = async (sessionToken) => {
    try {
      // This will trigger a reload of user data in App.jsx
      // The App.jsx useEffect that depends on isAuthenticated will handle loading
      console.log('✅ User logged in, user-specific data will be loaded from backend');
    } catch (error) {
      console.error('Error reloading user data:', error);
    }
  };

  const logout = async () => {
    // Clear user data and guest data before logging out
    clearGuestData();
    
    try {
      if (sessionToken) {
        await fetch(`${API_URL}/api/users/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionToken })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setSessionToken(null);
      localStorage.removeItem('sessionToken');
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const getUserStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/stats`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.stats;
      }
      return null;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return null;
    }
  };

  const followUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/follow/${userId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh user data to update follower/following counts
        const userResponse = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }
        return { success: true, ...data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Follow error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const unfollowUser = async (userId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/follow/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Refresh user data
        const userResponse = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }
        return { success: true, ...data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const getFollowers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/followers`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.followers;
      }
      return [];
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  };

  const getFollowing = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/following`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.following;
      }
      return [];
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  };

  const getPricingAlerts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/pricing-alerts`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.alerts || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting pricing alerts:', error);
      return [];
    }
  };

  const createPricingAlert = async (alertData) => {
    try {
      const response = await fetch(`${API_URL}/api/users/pricing-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify(alertData)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, alertId: data.alertId };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error creating pricing alert:', error);
      return { success: false, error: 'Failed to create pricing alert' };
    }
  };

  const deletePricingAlert = async (alertId) => {
    try {
      const response = await fetch(`${API_URL}/api/users/pricing-alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error deleting pricing alert:', error);
      return { success: false, error: 'Failed to delete pricing alert' };
    }
  };

  const getSetProgression = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/set-progression`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.sets;
      }
      return [];
    } catch (error) {
      console.error('Error fetching set progression:', error);
      return [];
    }
  };

  const loginWithGoogle = async (token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Clear guest data from localStorage before setting user
        clearGuestData();
        
        setUser(data.user);
        setSessionToken(data.sessionToken);
        localStorage.setItem('sessionToken', data.sessionToken);
        
        // Reload user-specific data from backend
        await reloadUserData(data.sessionToken);
        
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Failed to verify Google token' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    getUserStats,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    getPricingAlerts,
    createPricingAlert,
    deletePricingAlert,
    getSetProgression,
    loginWithGoogle,
    sessionToken
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
