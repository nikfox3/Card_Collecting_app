import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../utils/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const SettingsPage = ({ onBack }) => {
  const { user } = useUser();
  const { theme: currentTheme, setTheme: setThemeContext, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [activeSection, setActiveSection] = useState('app'); // 'app', 'privacy', 'data'
  
  // App Settings
  const [theme, setTheme] = useState(currentTheme || 'dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(true);
  
  // Collection Defaults
  const [defaultCondition, setDefaultCondition] = useState('Near Mint');
  const [defaultQuantity, setDefaultQuantity] = useState(1);
  const [defaultVariant, setDefaultVariant] = useState('Normal');
  
  // Display Preferences
  const [currency, setCurrency] = useState('USD');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [showPricesInCollection, setShowPricesInCollection] = useState(true);
  
  // Dropdown states
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showDateFormatDropdown, setShowDateFormatDropdown] = useState(false);
  
  const conditionDropdownRef = useRef(null);
  const variantDropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);
  const dateFormatDropdownRef = useRef(null);
  
  // Privacy Settings
  const [profilePublic, setProfilePublic] = useState(true);
  const [collectionPublic, setCollectionPublic] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  
  
  // CSV Import
  const [csvFile, setCsvFile] = useState(null);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false
  });
  const [importResults, setImportResults] = useState(null);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeDropdownRef = useRef(null);

  const API_BASE = `${API_URL}/api/settings`;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setShowThemeDropdown(false);
      }
      if (conditionDropdownRef.current && !conditionDropdownRef.current.contains(event.target)) {
        setShowConditionDropdown(false);
      }
      if (variantDropdownRef.current && !variantDropdownRef.current.contains(event.target)) {
        setShowVariantDropdown(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
      if (dateFormatDropdownRef.current && !dateFormatDropdownRef.current.contains(event.target)) {
        setShowDateFormatDropdown(false);
      }
    };

    if (showThemeDropdown || showConditionDropdown || showVariantDropdown || showCurrencyDropdown || showDateFormatDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showThemeDropdown, showConditionDropdown, showVariantDropdown, showCurrencyDropdown, showDateFormatDropdown]);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(API_BASE, {
          headers: {
            'x-user-id': user.id
          }
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            const settings = result.data;
            const loadedTheme = settings.theme || 'dark';
            setTheme(loadedTheme);
            // Update theme context immediately
            if (setThemeContext) {
              setThemeContext(loadedTheme);
            }
            setNotificationsEnabled(settings.notificationsEnabled);
            setEmailNotifications(settings.emailNotifications);
            setPriceAlertsEnabled(settings.priceAlertsEnabled);
            setProfilePublic(settings.profilePublic);
            setCollectionPublic(settings.collectionPublic);
            setShowEmail(settings.showEmail);
            setShowActivity(settings.showActivity);
            setDefaultCondition(settings.defaultCondition || 'Near Mint');
            setDefaultQuantity(settings.defaultQuantity || 1);
            setDefaultVariant(settings.defaultVariant || 'Normal');
            setCurrency(settings.currency || 'USD');
            setDateFormat(settings.dateFormat || 'MM/DD/YYYY');
            setShowPricesInCollection(settings.showPricesInCollection !== undefined ? settings.showPricesInCollection : true);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user?.id]);

  // Save settings
  const handleSaveSettings = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const response = await fetch(API_BASE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          theme,
          notificationsEnabled,
          emailNotifications,
          priceAlertsEnabled,
          profilePublic,
          collectionPublic,
          showEmail,
          showActivity,
          defaultCondition,
          defaultQuantity,
          defaultVariant,
          currency,
          dateFormat,
          showPricesInCollection
        })
      });

      if (!response.ok) throw new Error('Failed to save settings');

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Download CSV template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`${API_BASE}/csv-template`);
      if (!response.ok) throw new Error('Failed to download template');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'collection-import-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  // Export collection as CSV
  const handleExportCollection = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE}/export-collection`, {
        headers: {
          'x-user-id': user.id
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert('No collection data found to export.');
          return;
        }
        throw new Error('Failed to export collection');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'collection-export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting collection:', error);
      alert('Failed to export collection. Please try again.');
    }
  };

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }

    return data;
  };

  // Handle CSV import
  const handleImportCSV = async () => {
    if (!csvFile || !user?.id) return;

    setImporting(true);
    setImportResults(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const csvData = parseCSV(e.target.result);
          
          if (csvData.length === 0) {
            alert('CSV file is empty or invalid');
            setImporting(false);
            return;
          }

          const response = await fetch(`${API_BASE}/import-csv`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': user.id
            },
            body: JSON.stringify({
              csvData,
              options: importOptions
            })
          });

          if (!response.ok) throw new Error('Failed to import CSV');

          const result = await response.json();
          if (result.success) {
            setImportResults(result.results);
            setCsvFile(null);
            alert(`Import completed! Added: ${result.results.added}, Updated: ${result.results.updated}, Skipped: ${result.results.skipped}`);
          }
        } catch (error) {
          console.error('Error importing CSV:', error);
          alert('Failed to import CSV. Please check the format and try again.');
        } finally {
          setImporting(false);
        }
      };
      reader.readAsText(csvFile);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read file. Please try again.');
      setImporting(false);
    }
  };

  if (!user?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: isDark 
          ? 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)'
          : 'linear-gradient(rgba(255, 255, 255, 0.1) 0%, rgba(71, 135, 243, 0.1) 100%), linear-gradient(0deg, #fafafa 0%, #fafafa 100%), #fafafa'
      }}>
        <div className="text-center">
          <p className="dark:text-white text-theme-primary text-xl mb-4">Please log in to access settings</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: isDark 
          ? 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)'
          : 'linear-gradient(rgba(255, 255, 255, 0.1) 0%, rgba(71, 135, 243, 0.1) 100%), linear-gradient(0deg, #fafafa 0%, #fafafa 100%), #fafafa'
      }}>
        <div className="dark:text-white text-theme-primary text-xl">Loading settings...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen dark:text-white text-theme-primary transition-all duration-300 ease-in-out relative"
      style={{
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        position: 'relative',
        background: isDark 
          ? 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)'
          : 'linear-gradient(rgba(255, 255, 255, 0.1) 0%, rgba(71, 135, 243, 0.1) 100%), linear-gradient(0deg, #fafafa 0%, #fafafa 100%), #fafafa'
      }}
    >
      {/* Header */}
      <div className="dark:bg-black/20 bg-white/80 backdrop-blur-sm dark:border-b border-b border-white/10 dark:border-white/10 border-theme sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 dark:bg-white/10 dark:border-white/20 bg-white/60 border-theme backdrop-blur-md rounded-lg flex items-center justify-center dark:hover:bg-white/20 hover:bg-white/80 transition-all duration-200 border"
            >
              <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold dark:text-white text-theme-primary">Settings</h1>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center px-4 pb-2 dark:border-b border-b border-white/10 dark:border-white/10 border-theme overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveSection('app')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSection === 'app' ? 'dark:text-white text-theme-primary' : 'dark:text-gray-400 text-theme-secondary dark:hover:text-white hover:text-theme-primary'
            }`}
          >
            App Settings
            {activeSection === 'app' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('privacy')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSection === 'privacy' ? 'dark:text-white text-theme-primary' : 'dark:text-gray-400 text-theme-secondary dark:hover:text-white hover:text-theme-primary'
            }`}
          >
            Privacy
            {activeSection === 'privacy' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveSection('data')}
            className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeSection === 'data' ? 'dark:text-white text-theme-primary' : 'dark:text-gray-400 text-theme-secondary dark:hover:text-white hover:text-theme-primary'
            }`}
          >
            Data & Import
            {activeSection === 'data' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24 max-w-4xl mx-auto" style={{ position: 'relative', zIndex: 1 }}>
        {/* App Settings */}
        {activeSection === 'app' && (
          <div className="space-y-6">
            <div className="dark:bg-white/5 dark:border-white/10 bg-white/60 border-theme backdrop-blur-sm rounded-xl p-6 border relative" style={{ overflow: 'visible', zIndex: showThemeDropdown ? 100 : 'auto' }}>
              <h2 className="text-lg font-semibold dark:text-white text-theme-primary mb-4">Appearance</h2>
              
              <div className="space-y-4" style={{ overflow: 'visible' }}>
                <div className="relative" ref={themeDropdownRef} style={{ zIndex: showThemeDropdown ? 1000 : 'auto' }}>
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Theme</label>
                  <button
                    type="button"
                    onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                    className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg px-4 py-2 dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer pr-10 flex items-center justify-between"
                  >
                    <span>
                      {theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'Auto (System)'}
                    </span>
                    <svg 
                      className={`w-5 h-5 dark:text-gray-400 text-theme-secondary transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showThemeDropdown && (
                    <div className="absolute z-[9999] w-full mt-1 dark:bg-gray-700 bg-gray-200 rounded-lg shadow-xl border dark:border-gray-600 border-gray-300 overflow-hidden" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme('dark');
                          if (setThemeContext) {
                            setThemeContext('dark');
                          }
                          setShowThemeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 dark:text-white text-theme-primary hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors flex items-center gap-2 ${
                          theme === 'dark' ? 'dark:bg-gray-600 bg-gray-300' : ''
                        }`}
                      >
                        {theme === 'dark' && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>Dark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme('light');
                          if (setThemeContext) {
                            setThemeContext('light');
                          }
                          setShowThemeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 dark:text-white text-theme-primary hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors flex items-center gap-2 ${
                          theme === 'light' ? 'dark:bg-gray-600 bg-gray-300' : ''
                        }`}
                      >
                        {theme === 'light' && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTheme('auto');
                          if (setThemeContext) {
                            setThemeContext('auto');
                          }
                          setShowThemeDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 dark:text-white text-theme-primary hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors flex items-center gap-2 ${
                          theme === 'auto' ? 'dark:bg-gray-600 bg-gray-300' : ''
                        }`}
                      >
                        {theme === 'auto' && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>Auto (System)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dark:bg-white/5 dark:border-white/10 bg-white/60 border-theme backdrop-blur-sm rounded-xl p-6 border relative" style={{ overflow: 'visible', zIndex: showConditionDropdown || showVariantDropdown ? 100 : 'auto' }}>
              <h2 className="text-lg font-semibold dark:text-white text-theme-primary mb-4">Collection Defaults</h2>
              
              <div className="space-y-4" style={{ overflow: 'visible' }}>
                <div className="relative" ref={conditionDropdownRef} style={{ zIndex: showConditionDropdown ? 1000 : 'auto' }}>
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Default Condition</label>
                  <button
                    type="button"
                    onClick={() => setShowConditionDropdown(!showConditionDropdown)}
                    className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg px-4 py-2 dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer pr-10 flex items-center justify-between"
                  >
                    <span>{defaultCondition}</span>
                    <svg 
                      className={`w-5 h-5 dark:text-gray-400 text-theme-secondary transition-transform ${showConditionDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showConditionDropdown && (
                    <div className="absolute z-[10000] w-full mt-1 dark:bg-gray-700 bg-gray-200 rounded-lg shadow-xl border dark:border-gray-600 border-gray-300 overflow-hidden" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                      {['Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged'].map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => {
                            setDefaultCondition(condition);
                            setShowConditionDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 dark:text-white text-theme-primary hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors flex items-center gap-2 ${
                            defaultCondition === condition ? 'dark:bg-gray-600 bg-gray-300' : ''
                          }`}
                        >
                          {defaultCondition === condition && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>{condition}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Default Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={defaultQuantity}
                    onChange={(e) => setDefaultQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg px-4 py-2 dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="relative" ref={variantDropdownRef} style={{ zIndex: showVariantDropdown ? 1000 : 'auto' }}>
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Default Variant</label>
                  <button
                    type="button"
                    onClick={() => setShowVariantDropdown(!showVariantDropdown)}
                    className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg px-4 py-2 dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer pr-10 flex items-center justify-between"
                  >
                    <span>{defaultVariant}</span>
                    <svg 
                      className={`w-5 h-5 dark:text-gray-400 text-theme-secondary transition-transform ${showVariantDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showVariantDropdown && (
                    <div className="absolute z-[10000] w-full mt-1 dark:bg-gray-700 bg-gray-200 rounded-lg shadow-xl border dark:border-gray-600 border-gray-300 overflow-hidden" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                      {['Normal', 'Holofoil', 'Reverse Holofoil', 'First Edition'].map((variant) => (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => {
                            setDefaultVariant(variant);
                            setShowVariantDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 dark:text-white text-theme-primary hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors flex items-center gap-2 ${
                            defaultVariant === variant ? 'dark:bg-gray-600 bg-gray-300' : ''
                          }`}
                        >
                          {defaultVariant === variant && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>{variant}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="dark:bg-white/5 dark:border-white/10 bg-white/60 border-theme backdrop-blur-sm rounded-xl p-6 border relative" style={{ overflow: 'visible', zIndex: showCurrencyDropdown || showDateFormatDropdown ? 100 : 'auto', isolation: 'isolate' }}>
              <h2 className="text-lg font-semibold dark:text-white text-theme-primary mb-4">Display Preferences</h2>
              
              <div className="space-y-4" style={{ overflow: 'visible' }}>
                <div className="relative" ref={currencyDropdownRef} style={{ zIndex: showCurrencyDropdown ? 1000 : 'auto' }}>
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Currency</label>
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                    className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg px-4 py-2 dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer pr-10 flex items-center justify-between"
                  >
                    <span>{currency === 'USD' ? '$ USD' : currency === 'EUR' ? '€ EUR' : currency === 'GBP' ? '£ GBP' : currency === 'JPY' ? '¥ JPY' : currency === 'CAD' ? 'C$ CAD' : currency === 'AUD' ? 'A$ AUD' : currency}</span>
                    <svg 
                      className={`w-5 h-5 dark:text-gray-400 text-theme-secondary transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showCurrencyDropdown && (
                    <div className="absolute z-[10000] w-full mt-1 dark:bg-gray-700 bg-gray-200 rounded-lg shadow-xl border dark:border-gray-600 border-gray-300 overflow-hidden" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                      {[
                        { code: 'USD', label: '$ USD' },
                        { code: 'EUR', label: '€ EUR' },
                        { code: 'GBP', label: '£ GBP' },
                        { code: 'JPY', label: '¥ JPY' },
                        { code: 'CAD', label: 'C$ CAD' },
                        { code: 'AUD', label: 'A$ AUD' }
                      ].map((curr) => (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            setCurrency(curr.code);
                            setShowCurrencyDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 dark:text-white text-theme-primary hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors flex items-center gap-2 ${
                            currency === curr.code ? 'dark:bg-gray-600 bg-gray-300' : ''
                          }`}
                        >
                          {currency === curr.code && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>{curr.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={dateFormatDropdownRef} style={{ zIndex: showDateFormatDropdown ? 1000 : 'auto' }}>
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Date Format</label>
                  <button
                    type="button"
                    onClick={() => setShowDateFormatDropdown(!showDateFormatDropdown)}
                    className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg px-4 py-2 dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer pr-10 flex items-center justify-between"
                  >
                    <span>{dateFormat}</span>
                    <svg 
                      className={`w-5 h-5 dark:text-gray-400 text-theme-secondary transition-transform ${showDateFormatDropdown ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showDateFormatDropdown && (
                    <div className="absolute z-[10000] w-full mt-1 dark:bg-gray-700 bg-gray-200 rounded-lg shadow-xl border dark:border-gray-600 border-gray-300 overflow-hidden" style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
                      {['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'].map((format) => (
                        <button
                          key={format}
                          type="button"
                          onClick={() => {
                            setDateFormat(format);
                            setShowDateFormatDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 dark:text-white text-theme-primary hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors flex items-center gap-2 ${
                            dateFormat === format ? 'dark:bg-gray-600 bg-gray-300' : ''
                          }`}
                        >
                          {dateFormat === format && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span>{format}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="dark:text-white text-theme-primary font-medium">Show Prices in Collection</p>
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">Display card prices in collection view</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPricesInCollection}
                      onChange={(e) => setShowPricesInCollection(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 dark:bg-gray-700 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="dark:bg-white/5 dark:border-white/10 bg-white/60 border-theme backdrop-blur-sm rounded-xl p-6 border relative" style={{ zIndex: 1, isolation: 'isolate' }}>
              <h2 className="text-lg font-semibold dark:text-white text-theme-primary mb-4">Notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="dark:text-white text-theme-primary font-medium">Enable Notifications</p>
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">Receive in-app notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationsEnabled}
                      onChange={(e) => setNotificationsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 dark:bg-gray-700 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="dark:text-white text-theme-primary font-medium">Email Notifications</p>
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">Receive notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      disabled={!notificationsEnabled}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="dark:text-white text-theme-primary font-medium">Price Alerts</p>
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">Get notified when card prices change</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={priceAlertsEnabled}
                      onChange={(e) => setPriceAlertsEnabled(e.target.checked)}
                      disabled={!notificationsEnabled}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600 ${!notificationsEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {activeSection === 'privacy' && (
          <div className="space-y-6">
            <div className="dark:bg-white/5 dark:border-white/10 bg-white/60 border-theme backdrop-blur-sm rounded-xl p-6 border">
              <h2 className="text-lg font-semibold dark:text-white text-theme-primary mb-4">Profile Visibility</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="dark:text-white text-theme-primary font-medium">Public Profile</p>
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">Allow others to view your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profilePublic}
                      onChange={(e) => setProfilePublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 dark:bg-gray-700 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="dark:text-white text-theme-primary font-medium">Public Collection</p>
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">Allow others to view your collection</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={collectionPublic}
                      onChange={(e) => setCollectionPublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 dark:bg-gray-700 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="dark:text-white text-theme-primary font-medium">Show Email</p>
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">Display your email on your profile</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showEmail}
                      onChange={(e) => setShowEmail(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 dark:bg-gray-700 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="dark:text-white text-theme-primary font-medium">Show Activity</p>
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">Display your recent activity</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showActivity}
                      onChange={(e) => setShowActivity(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 dark:bg-gray-700 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="dark:bg-white/5 dark:border-white/10 bg-white/60 border-theme backdrop-blur-sm rounded-xl p-6 border">
              <h2 className="text-lg font-semibold dark:text-white text-theme-primary mb-4">Legal Documents</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="w-full flex items-center justify-between p-4 dark:bg-white/5 bg-white/10 rounded-lg hover:dark:bg-white/10 hover:bg-white/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 dark:text-gray-400 text-theme-secondary group-hover:dark:text-white group-hover:text-theme-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div className="text-left">
                      <p className="dark:text-white text-theme-primary font-medium">Privacy Policy</p>
                      <p className="dark:text-gray-400 text-theme-secondary text-sm">How we collect and use your data</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 dark:text-gray-400 text-theme-secondary group-hover:dark:text-white group-hover:text-theme-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => setShowTermsOfService(true)}
                  className="w-full flex items-center justify-between p-4 dark:bg-white/5 bg-white/10 rounded-lg hover:dark:bg-white/10 hover:bg-white/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 dark:text-gray-400 text-theme-secondary group-hover:dark:text-white group-hover:text-theme-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="dark:text-white text-theme-primary font-medium">Terms of Service</p>
                      <p className="dark:text-gray-400 text-theme-secondary text-sm">Rules and guidelines for using the app</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 dark:text-gray-400 text-theme-secondary group-hover:dark:text-white group-hover:text-theme-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data & Import */}
        {activeSection === 'data' && (
          <div className="space-y-6">
            <div className="dark:bg-white/5 dark:border-white/10 bg-white/60 border-theme backdrop-blur-sm rounded-xl p-6 border">
              <h2 className="text-lg font-semibold dark:text-white text-theme-primary mb-4">Export Collection</h2>
              
              <div className="space-y-4">
                <p className="dark:text-gray-400 text-theme-secondary text-sm">
                  Download all your collection data as a CSV file. This includes all cards, their quantities, conditions, purchase prices, and notes.
                </p>
                
                <button
                  onClick={handleExportCollection}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Collection CSV
                </button>
              </div>
            </div>

            <div className="dark:bg-white/5 dark:border-white/10 bg-white/60 border-theme backdrop-blur-sm rounded-xl p-6 border">
              <h2 className="text-lg font-semibold dark:text-white text-theme-primary mb-4">Import Collection from CSV</h2>
              
              <div className="space-y-4">
                <div className="dark:bg-blue-500/10 dark:border-blue-500/20 bg-blue-100 border-blue-300 rounded-lg p-4 border">
                  <h3 className="dark:text-white text-theme-primary font-medium mb-2">Instructions</h3>
                  <ol className="list-decimal list-inside space-y-1 dark:text-gray-300 text-theme-secondary text-sm">
                    <li>Download the CSV template below</li>
                    <li>Fill in your card data following the template format</li>
                    <li>Required fields: <code className="dark:bg-gray-700 bg-gray-200 dark:text-white text-theme-primary px-1 rounded">card_id</code> or <code className="dark:bg-gray-700 bg-gray-200 dark:text-white text-theme-primary px-1 rounded">product_id</code></li>
                    <li>Optional fields: variant, condition, quantity, purchase_price, purchase_date, notes, etc.</li>
                    <li>For graded cards: set <code className="dark:bg-gray-700 bg-gray-200 dark:text-white text-theme-primary px-1 rounded">is_graded</code> to 1, and include <code className="dark:bg-gray-700 bg-gray-200 dark:text-white text-theme-primary px-1 rounded">grade_company</code> and <code className="dark:bg-gray-700 bg-gray-200 dark:text-white text-theme-primary px-1 rounded">grade_value</code></li>
                    <li>Upload your completed CSV file below</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadTemplate}
                    className="px-4 py-2 dark:bg-white/10 bg-[#e4e5f1] dark:hover:bg-white/20 hover:bg-[#d2d3db] dark:border-white/20 border-[#d2d3db] rounded-lg dark:text-white text-theme-primary font-medium transition-colors"
                  >
                    Download Template
                  </button>
                </div>

                <div>
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">CSV File</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files[0])}
                    className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg px-4 py-2 dark:text-white text-theme-primary text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  {csvFile && (
                    <p className="dark:text-gray-400 text-theme-secondary text-sm mt-2">Selected: {csvFile.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={importOptions.skipDuplicates}
                      onChange={(e) => setImportOptions({ ...importOptions, skipDuplicates: e.target.checked })}
                      className="rounded dark:border-gray-600 dark:bg-gray-700 border-gray-300 bg-gray-200 text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="dark:text-white text-theme-primary text-sm">Skip duplicate entries</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={importOptions.updateExisting}
                      onChange={(e) => setImportOptions({ ...importOptions, updateExisting: e.target.checked })}
                      className="rounded dark:border-gray-600 dark:bg-gray-700 border-gray-300 bg-gray-200 text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="dark:text-white text-theme-primary text-sm">Update existing entries (add quantities)</span>
                  </label>
                </div>

                <button
                  onClick={handleImportCSV}
                  disabled={!csvFile || importing}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import CSV'}
                </button>

                {importResults && (
                  <div className="dark:bg-gray-700/50 bg-gray-100 rounded-lg p-4">
                    <h3 className="dark:text-white text-theme-primary font-medium mb-2">Import Results</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-green-400">✓ Added: {importResults.added}</p>
                      <p className="text-blue-400">↻ Updated: {importResults.updated}</p>
                      <p className="text-yellow-400">⊘ Skipped: {importResults.skipped}</p>
                      {importResults.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-400">Errors:</p>
                          <ul className="list-disc list-inside text-red-400 text-xs">
                            {importResults.errors.slice(0, 5).map((err, idx) => (
                              <li key={idx}>Row {err.row}: {err.error}</li>
                            ))}
                            {importResults.errors.length > 5 && (
                              <li>... and {importResults.errors.length - 5} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 z-50 dark:bg-black/50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="dark:bg-gray-800 bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col dark:border-gray-700 border-theme border">
            <div className="flex items-center justify-between p-6 dark:border-b border-b border-gray-700 dark:border-gray-700 border-theme">
              <h2 className="text-2xl font-bold dark:text-white text-theme-primary">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacyPolicy(false)}
                className="w-10 h-10 dark:bg-gray-700 bg-gray-200 rounded-lg flex items-center justify-center dark:hover:bg-gray-600 hover:bg-gray-300 transition-colors"
              >
                <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <div className="prose prose-invert max-w-none dark:text-gray-300 text-theme-secondary">
                <PrivacyPolicyContent />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <div className="fixed inset-0 z-50 dark:bg-black/50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="dark:bg-gray-800 bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col dark:border-gray-700 border-theme border">
            <div className="flex items-center justify-between p-6 dark:border-b border-b border-gray-700 dark:border-gray-700 border-theme">
              <h2 className="text-2xl font-bold dark:text-white text-theme-primary">Terms of Service</h2>
              <button
                onClick={() => setShowTermsOfService(false)}
                className="w-10 h-10 dark:bg-gray-700 bg-gray-200 rounded-lg flex items-center justify-center dark:hover:bg-gray-600 hover:bg-gray-300 transition-colors"
              >
                <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <div className="prose prose-invert max-w-none dark:text-gray-300 text-theme-secondary">
                <TermsOfServiceContent />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Privacy Policy Content Component
const PrivacyPolicyContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm dark:text-gray-400 text-theme-tertiary mb-4">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">1. Introduction</h3>
        <p className="mb-4">
          Welcome to the Pokémon Card Collecting App ("we," "our," or "us"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">2. Information We Collect</h3>
        <h4 className="text-lg font-medium dark:text-white text-theme-primary mb-2 mt-4">2.1 Information You Provide</h4>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li><strong>Account Information</strong>: Username, email address, password (hashed), full name, profile image</li>
          <li><strong>Collection Data</strong>: Cards in your collection, quantities, conditions, purchase prices, purchase dates, notes</li>
          <li><strong>Deck and Binder Data</strong>: Custom decks, binders, and associated card information</li>
          <li><strong>Pricing Alerts</strong>: Card alerts, target prices, and notification preferences</li>
          <li><strong>Profile Settings</strong>: Privacy preferences, notification settings, theme preferences</li>
        </ul>

        <h4 className="text-lg font-medium dark:text-white text-theme-primary mb-2 mt-4">2.2 Automatically Collected Information</h4>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li><strong>Usage Data</strong>: Search queries, card views, feature usage, interaction patterns</li>
          <li><strong>Device Information</strong>: Browser type, device type, operating system</li>
          <li><strong>Session Data</strong>: Session tokens, authentication status</li>
        </ul>

        <h4 className="text-lg font-medium dark:text-white text-theme-primary mb-2 mt-4">2.3 Third-Party Authentication</h4>
        <p className="mb-4">
          <strong>Google OAuth</strong>: If you choose to sign in with Google, we receive your Google account email and profile information (name, profile picture) as provided by Google.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">3. How We Use Your Information</h3>
        <p className="mb-2">We use the information we collect to:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>Provide and maintain our service</li>
          <li>Process your transactions and manage your account</li>
          <li>Send you notifications about price alerts and account activity</li>
          <li>Improve our services and user experience</li>
          <li>Analyze usage patterns and trends</li>
          <li>Ensure security and prevent fraud</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">4. Data Storage and Security</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li><strong>Local Storage</strong>: Some data (like collection preferences) may be stored locally in your browser</li>
          <li><strong>Database Storage</strong>: Your account data, collections, decks, and binders are stored securely in our database</li>
          <li><strong>Security Measures</strong>: We use industry-standard security practices including password hashing, session tokens, and secure database connections</li>
          <li><strong>Data Retention</strong>: We retain your data for as long as your account is active or as needed to provide services</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">5. Data Sharing and Disclosure</h3>
        <p className="mb-2">We do not sell your personal information. We may share your information only in the following circumstances:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li><strong>Public Profiles</strong>: If you enable "Public Profile" or "Public Collection" settings, your profile and collection information may be visible to other users</li>
          <li><strong>Service Providers</strong>: We may share data with third-party service providers who assist in operating our service (e.g., hosting, analytics)</li>
          <li><strong>Legal Requirements</strong>: We may disclose information if required by law or to protect our rights and safety</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">6. Your Privacy Rights</h3>
        <p className="mb-2">You have the right to:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li><strong>Access</strong>: View and download your collection data (available in Settings)</li>
          <li><strong>Update</strong>: Modify your account information and privacy settings</li>
          <li><strong>Delete</strong>: Request deletion of your account and associated data</li>
          <li><strong>Opt-Out</strong>: Disable notifications and analytics tracking</li>
          <li><strong>Export</strong>: Download your collection data as CSV</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">7. Cookies and Tracking</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>We use session tokens to maintain your login status</li>
          <li>We may use analytics to understand usage patterns (you can opt-out)</li>
          <li>We do not use third-party advertising cookies</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">8. Children's Privacy</h3>
        <p className="mb-4">
          Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">9. International Users</h3>
        <p className="mb-4">
          If you are accessing our service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">10. Changes to This Privacy Policy</h3>
        <p className="mb-4">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">11. Contact Us</h3>
        <p className="mb-4">
          If you have questions about this Privacy Policy or our data practices, please contact us through the app's support features or settings page.
        </p>
      </section>

      <div className="mt-6 pt-6 dark:border-t border-t border-gray-700 dark:border-gray-700 border-theme">
        <p className="text-sm dark:text-gray-400 text-theme-tertiary italic">
          By using our service, you agree to the collection and use of information in accordance with this Privacy Policy.
        </p>
      </div>
    </div>
  );
};

// Terms of Service Content Component
const TermsOfServiceContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm dark:text-gray-400 text-theme-tertiary mb-4">
          Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">1. Acceptance of Terms</h3>
        <p className="mb-4">
          By accessing or using the Pokémon Card Collecting App ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">2. Description of Service</h3>
        <p className="mb-2">The Pokémon Card Collecting App is a platform that allows users to:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>Track and manage their Pokémon card collections</li>
          <li>Build and manage decks and binders</li>
          <li>Set pricing alerts for cards</li>
          <li>View card information, pricing, and market data</li>
          <li>Interact with other users (if enabled)</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">3. User Accounts</h3>
        <h4 className="text-lg font-medium dark:text-white text-theme-primary mb-2 mt-4">3.1 Account Creation</h4>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>You must provide accurate and complete information when creating an account</li>
          <li>You are responsible for maintaining the security of your account</li>
          <li>You must be at least 13 years old to create an account</li>
          <li>One person or entity may not maintain more than one account</li>
        </ul>

        <h4 className="text-lg font-medium dark:text-white text-theme-primary mb-2 mt-4">3.2 Account Responsibilities</h4>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>You are responsible for all activities that occur under your account</li>
          <li>You must notify us immediately of any unauthorized use of your account</li>
          <li>You may not share your account credentials with others</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">4. User Conduct</h3>
        <p className="mb-2">You agree not to:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>Use the Service for any illegal purpose or in violation of any laws</li>
          <li>Transmit any harmful code, viruses, or malicious software</li>
          <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
          <li>Harass, abuse, or harm other users</li>
          <li>Impersonate any person or entity</li>
          <li>Collect or store personal data about other users without permission</li>
          <li>Use automated systems to access the Service without permission</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">5. Content and Intellectual Property</h3>
        <h4 className="text-lg font-medium dark:text-white text-theme-primary mb-2 mt-4">5.1 Your Content</h4>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>You retain ownership of any content you submit to the Service (collection data, decks, binders)</li>
          <li>By submitting content, you grant us a license to use, store, and display that content as necessary to provide the Service</li>
        </ul>

        <h4 className="text-lg font-medium dark:text-white text-theme-primary mb-2 mt-4">5.2 Our Content</h4>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>All card data, images, and pricing information are provided for informational purposes</li>
          <li>Card images and data may be sourced from third-party providers (e.g., TCGCSV, Pokémon TCG API)</li>
          <li>We do not claim ownership of Pokémon card images or card data</li>
        </ul>

        <h4 className="text-lg font-medium dark:text-white text-theme-primary mb-2 mt-4">5.3 Pokémon Trademarks</h4>
        <p className="mb-4">
          Pokémon, Pokémon TCG, and related trademarks are the property of The Pokémon Company International, Inc. This app is not affiliated with, endorsed by, or sponsored by The Pokémon Company.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">6. Pricing and Market Data</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>Pricing information is provided for informational purposes only</li>
          <li>We do not guarantee the accuracy of pricing data</li>
          <li>Prices are sourced from third-party providers and may not reflect current market conditions</li>
          <li>You should verify pricing information before making purchase decisions</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">7. Prohibited Uses</h3>
        <p className="mb-2">You may not use the Service:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>To violate any applicable laws or regulations</li>
          <li>To infringe upon the rights of others</li>
          <li>To transmit spam or unsolicited communications</li>
          <li>To interfere with or disrupt the Service</li>
          <li>To reverse engineer or attempt to extract source code</li>
          <li>To create derivative works based on the Service</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">8. Service Availability</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>We strive to maintain service availability but do not guarantee uninterrupted access</li>
          <li>We may perform maintenance that temporarily interrupts service</li>
          <li>We reserve the right to modify or discontinue the Service at any time</li>
          <li>We are not liable for any loss or damage resulting from service interruptions</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">9. Data Export and Deletion</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>You may export your collection data at any time through the Settings page</li>
          <li>You may request account deletion, which will remove your account and associated data</li>
          <li>Some data may be retained as required by law or for legitimate business purposes</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">10. Limitation of Liability</h3>
        <p className="mb-2">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND</li>
          <li>WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED</li>
          <li>WE ARE NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
          <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE PAST 12 MONTHS</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">11. Indemnification</h3>
        <p className="mb-4">
          You agree to indemnify and hold harmless the Service, its operators, and affiliates from any claims, damages, losses, or expenses arising from your use of the Service, your violation of these Terms, or your violation of any rights of another party.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">12. Termination</h3>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>We may terminate or suspend your account immediately for violation of these Terms</li>
          <li>You may terminate your account at any time through the Settings page</li>
          <li>Upon termination, your right to use the Service will cease immediately</li>
          <li>Provisions that by their nature should survive termination will survive</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">13. Changes to Terms</h3>
        <p className="mb-4">
          We reserve the right to modify these Terms at any time. We will notify users of material changes. Continued use of the Service after changes constitutes acceptance of the new Terms.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">14. Governing Law</h3>
        <p className="mb-4">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which the Service operates, without regard to conflict of law provisions.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">15. Dispute Resolution</h3>
        <p className="mb-2">Any disputes arising from these Terms or your use of the Service shall be resolved through:</p>
        <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
          <li>Good faith negotiation</li>
          <li>If necessary, binding arbitration or mediation</li>
          <li>As a last resort, through the appropriate courts</li>
        </ul>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">16. Severability</h3>
        <p className="mb-4">
          If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full effect.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">17. Entire Agreement</h3>
        <p className="mb-4">
          These Terms constitute the entire agreement between you and us regarding the Service and supersede all prior agreements.
        </p>
      </section>

      <section>
        <h3 className="text-xl font-semibold dark:text-white text-theme-primary mb-3">18. Contact Information</h3>
        <p className="mb-4">
          For questions about these Terms, please contact us through the app's support features or settings page.
        </p>
      </section>

      <div className="mt-6 pt-6 dark:border-t border-t border-gray-700 dark:border-gray-700 border-theme">
        <p className="text-sm dark:text-gray-400 text-theme-tertiary italic">
          By using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;


