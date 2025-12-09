import { useState, useEffect } from "react";
import { admin } from "../utils/api";

export default function Marketplace() {
  const [marketplaces, setMarketplaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    platform: "",
    enabled: true,
    affiliate_link: "",
    affiliate_id: "",
    logo_path: "",
    display_name: "",
    commission_rate: "",
    notes: "",
  });

  useEffect(() => {
    loadMarketplaces();
  }, []);

  const loadMarketplaces = async () => {
    try {
      setLoading(true);
      const response = await admin.getMarketplaces();
      setMarketplaces(response.data.data || []);
    } catch (error) {
      console.error("Error loading marketplaces:", error);
      alert("Failed to load marketplace configurations");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (marketplace) => {
    setEditing(marketplace.platform);
    setFormData({
      platform: marketplace.platform,
      enabled: marketplace.enabled === 1,
      affiliate_link: marketplace.affiliate_link || "",
      affiliate_id: marketplace.affiliate_id || "",
      logo_path: marketplace.logo_path || "",
      display_name: marketplace.display_name || marketplace.platform,
      commission_rate: marketplace.commission_rate || "",
      notes: marketplace.notes || "",
    });
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({
      platform: "",
      enabled: true,
      affiliate_link: "",
      affiliate_id: "",
      logo_path: "",
      display_name: "",
      commission_rate: "",
      notes: "",
    });
  };

  const handleSave = async () => {
    try {
      const response = await admin.updateMarketplace(formData.platform, formData);

      if (response.data.success) {
        alert("Marketplace configuration saved successfully!");
        setEditing(null);
        loadMarketplaces();
      }
    } catch (error) {
      console.error("Error saving marketplace:", error);
      alert(
        error.response?.data?.error ||
          "Failed to save marketplace configuration"
      );
    }
  };

  const handleToggleEnabled = async (marketplace) => {
    try {
      const updated = {
        ...marketplace,
        enabled: marketplace.enabled === 1 ? 0 : 1,
      };

      const response = await admin.updateMarketplace(marketplace.platform, updated);

      if (response.data.success) {
        loadMarketplaces();
      }
    } catch (error) {
      console.error("Error toggling marketplace:", error);
      alert("Failed to update marketplace status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading marketplace configurations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Marketplace Management</h1>
          <p className="text-slate-400">
            Manage affiliate links and marketplace features for your app
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
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
              <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Marketplace Configuration</p>
            <p>
              Manage marketplace settings and affiliate links here. Configure which marketplaces are enabled, 
              set up affiliate links for TCGPlayer, eBay, and other platforms, and customize display settings. 
              Then use the "Product Marketplace Links" section below to link specific cards to marketplace products.
            </p>
          </div>
        </div>
      </div>

      {/* Marketplace List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Affiliate Link
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Affiliate ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {marketplaces.map((marketplace) => (
                <tr
                  key={marketplace.platform}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  {editing === marketplace.platform ? (
                    // Edit Mode
                    <>
                      <td colSpan="6" className="px-6 py-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Display Name
                              </label>
                              <input
                                type="text"
                                value={formData.display_name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    display_name: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., TCGPlayer"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Commission Rate (%)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                value={formData.commission_rate}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    commission_rate: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 5.5"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Base Affiliate Link
                            </label>
                            <input
                              type="url"
                              value={formData.affiliate_link}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  affiliate_link: e.target.value,
                                })
                              }
                              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="https://www.tcgplayer.com?affiliate=YOUR_ID"
                            />
                            <p className="mt-1 text-xs text-slate-400">
                              Base URL for the marketplace. Include your affiliate ID/token in the URL.
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Affiliate ID/Token
                            </label>
                            <input
                              type="text"
                              value={formData.affiliate_id}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  affiliate_id: e.target.value,
                                })
                              }
                              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Your affiliate ID or token"
                            />
                            <p className="mt-1 text-xs text-slate-400">
                              Store your affiliate ID separately for reference (optional).
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Logo Path
                            </label>
                            <input
                              type="text"
                              value={formData.logo_path}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  logo_path: e.target.value,
                                })
                              }
                              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="/Assets/TCGplayer_Logo 1.svg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                              Notes
                            </label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  notes: e.target.value,
                                })
                              }
                              rows="3"
                              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                              placeholder="Additional notes or instructions..."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`enabled-${marketplace.platform}`}
                              checked={formData.enabled}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  enabled: e.target.checked,
                                })
                              }
                              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                            />
                            <label
                              htmlFor={`enabled-${marketplace.platform}`}
                              className="text-sm text-slate-300"
                            >
                              Enable this marketplace
                            </label>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <button
                              onClick={handleSave}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancel}
                              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {marketplace.logo_path && (
                            <img
                              src={marketplace.logo_path}
                              alt={marketplace.display_name || marketplace.platform}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                          <div>
                            <div className="text-white font-medium">
                              {marketplace.display_name || marketplace.platform}
                            </div>
                            {marketplace.notes && (
                              <div className="text-xs text-slate-400">
                                {marketplace.notes.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleEnabled(marketplace)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            marketplace.enabled === 1
                              ? "bg-green-500/20 text-green-400"
                              : "bg-slate-700 text-slate-400"
                          }`}
                        >
                          {marketplace.enabled === 1 ? "Enabled" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-300 max-w-xs truncate">
                          {marketplace.affiliate_link || (
                            <span className="text-slate-500">Not configured</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">
                          {marketplace.affiliate_id || (
                            <span className="text-slate-500">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">
                          {marketplace.commission_rate
                            ? `${marketplace.commission_rate}%`
                            : (
                                <span className="text-slate-500">—</span>
                              )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleEdit(marketplace)}
                          className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg font-medium transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Marketplace IDs Management */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Product Marketplace IDs
              </h2>
          <p className="text-slate-400">
            Simply add a link and select the platform. The system will automatically append your affiliate ID when users click.
          </p>
            </div>
            <details className="text-sm">
              <summary className="text-blue-400 cursor-pointer hover:text-blue-300">
                How to find Product IDs
              </summary>
              <div className="mt-3 p-4 bg-slate-900/50 rounded-lg text-slate-300 space-y-2 text-xs">
                <div>
                  <strong className="text-blue-400">How it works:</strong> Just copy the full URL from any marketplace and paste it here!
                </div>
                <div className="pt-2 space-y-1">
                  <div><strong className="text-blue-400">TCGPlayer:</strong> Copy the full product URL</div>
                  <div><strong className="text-blue-400">eBay:</strong> Copy the full item listing URL</div>
                  <div><strong className="text-blue-400">Other platforms:</strong> Copy the full product page URL</div>
                </div>
                <div className="pt-2 text-slate-400 italic">
                  💡 Tip: Your affiliate ID will be automatically added to the link when users click it.
                </div>
              </div>
            </details>
          </div>
        </div>

        <ProductMarketplaceIdsManager />
      </div>
    </div>
  );
}

// Component for managing product marketplace links
function ProductMarketplaceIdsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [links, setLinks] = useState([]);
  const [newLink, setNewLink] = useState({ platform: "TCGPlayer", url: "" });
  const [linkPreview, setLinkPreview] = useState(null);
  const [parsingLink, setParsingLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoFinding, setAutoFinding] = useState(false);
  const [autoFindResults, setAutoFindResults] = useState(null);

  const platforms = ["TCGPlayer", "eBay", "Whatnot", "Drip", "Fanatics"];

  const getAvailablePlatforms = () => {
    const usedPlatforms = links.map(l => l.platform);
    return platforms.filter(p => !usedPlatforms.includes(p));
  };

  const getNextAvailablePlatform = () => {
    const available = getAvailablePlatforms();
    return available.length > 0 ? available[0] : platforms[0];
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await admin.searchMarketplaceProducts(searchQuery, 10);
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error("Error searching products:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to search products";
      alert(`Failed to search products: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = async (product) => {
    try {
      setLoading(true);
      setSelectedProduct(product);
      const response = await admin.getProductMarketplaceLinks(product.product_id);
      setLinks(response.data.data || []);
      setNewLink({ platform: getNextAvailablePlatform(), url: "" });
      setLinkPreview(null);
      setAutoFindResults(null);
    } catch (error) {
      console.error("Error fetching product marketplace links:", error);
      alert("Failed to load product marketplace links");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFind = async () => {
    if (!selectedProduct) {
      alert("Please select a product first");
      return;
    }

    try {
      setAutoFinding(true);
      setAutoFindResults(null);
      const response = await admin.autoFindMarketplaceProducts(selectedProduct.product_id, ['eBay', 'TCGPlayer']);
      setAutoFindResults(response.data.data);
    } catch (error) {
      console.error("Error auto-finding products:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to auto-find products";
      alert(`Failed to auto-find products: ${errorMessage}`);
    } finally {
      setAutoFinding(false);
    }
  };

  const handleAddFromAutoFind = async (product) => {
    if (!selectedProduct || !product.url) return;

    try {
      setSaving(true);
      await admin.addProductMarketplaceLink(
        selectedProduct.product_id,
        product.platform,
        product.url
      );
      // Reload links
      const response = await admin.getProductMarketplaceLinks(selectedProduct.product_id);
      setLinks(response.data.data || []);
      setNewLink({ platform: getNextAvailablePlatform(), url: "" });
      setLinkPreview(null);
      alert("Link added successfully!");
    } catch (error) {
      console.error("Error adding link:", error);
      const errorMessage = error.response?.data?.error || "Failed to add link";
      alert(`Failed to add link: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const parseLink = async (url) => {
    if (!url || !url.trim()) {
      setLinkPreview(null);
      return;
    }

    try {
      setParsingLink(true);
      
      // Call backend API to parse the link and fetch product info
      const response = await admin.parseMarketplaceLink(url);
      const data = response.data.data;

      setLinkPreview({
        platform: data.platform,
        productId: data.productId,
        productName: data.productName,
        imageUrl: data.imageUrl,
        price: data.price,
        description: data.description,
        url: data.url,
      });
      // Only auto-select platform if it's not already used
      const usedPlatforms = links.map(l => l.platform);
      if (!usedPlatforms.includes(data.platform)) {
        setNewLink({ ...newLink, platform: data.platform });
      }
    } catch (error) {
      console.error("Error parsing link:", error);
      // If parsing fails, try basic URL parsing
      try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.toLowerCase();
        let platform = "TCGPlayer";
        
        if (hostname.includes("tcgplayer.com")) {
          platform = "TCGPlayer";
        } else if (hostname.includes("ebay.com") || hostname.includes("ebay.ca")) {
          platform = "eBay";
        } else if (hostname.includes("whatnot.com")) {
          platform = "Whatnot";
        } else if (hostname.includes("drip.com")) {
          platform = "Drip";
        } else if (hostname.includes("fanatics.com") || hostname.includes("fanaticsollect.com")) {
          platform = "Fanatics";
        }
        
        setLinkPreview({ platform, url });
        setNewLink({ ...newLink, platform });
      } catch (e) {
        setLinkPreview({ platform: newLink.platform, url });
      }
    } finally {
      setParsingLink(false);
    }
  };

  const handleUrlChange = (url) => {
    setNewLink({ ...newLink, url });
    // Debounce the parsing
    const timeoutId = setTimeout(() => {
      parseLink(url);
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const handleAddLink = async () => {
    if (!selectedProduct || !newLink.url.trim()) {
      alert("Please enter a URL");
      return;
    }

    try {
      setSaving(true);
      await admin.addProductMarketplaceLink(
        selectedProduct.product_id,
        newLink.platform,
        newLink.url
      );
      // Reload links
      const response = await admin.getProductMarketplaceLinks(selectedProduct.product_id);
      setLinks(response.data.data || []);
      setNewLink({ platform: getNextAvailablePlatform(), url: "" });
      setLinkPreview(null);
      alert("Link added successfully!");
    } catch (error) {
      console.error("Error adding link:", error);
      const errorMessage = error.response?.data?.error || "Failed to add link";
      alert(`Failed to add link: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!selectedProduct || !confirm("Are you sure you want to delete this link?")) {
      return;
    }

    try {
      setSaving(true);
      await admin.deleteProductMarketplaceLink(selectedProduct.product_id, linkId);
      // Reload links
      const response = await admin.getProductMarketplaceLinks(selectedProduct.product_id);
      setLinks(response.data.data || []);
      alert("Link deleted successfully!");
    } catch (error) {
      console.error("Error deleting link:", error);
      alert("Failed to delete link");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search for a card by name, set, or number..."
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Search Results */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Search Results</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-8">
                {searchQuery ? "No products found" : "Search for a product to get started"}
              </div>
            ) : (
              searchResults.map((product) => (
                <button
                  key={product.product_id}
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedProduct?.product_id === product.product_id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 hover:border-slate-600 bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {product.local_image_url || product.image_url ? (
                      <img
                        src={product.local_image_url || product.image_url}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-700 rounded flex items-center justify-center">
                        <span className="text-slate-500 text-xs">No Image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {product.name}
                      </div>
                      <div className="text-slate-400 text-sm truncate">
                        {product.set_name} {product.ext_number && `#${product.ext_number}`}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Manage Marketplace Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">
            Marketplace Links
          </h3>
          {selectedProduct ? (
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">{selectedProduct.name}</div>
                    <div className="text-slate-400 text-sm">
                      {selectedProduct.set_name} {selectedProduct.ext_number && `#${selectedProduct.ext_number}`}
                    </div>
                  </div>
                  <button
                    onClick={handleAutoFind}
                    disabled={autoFinding}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                    title="Automatically search for this product on eBay and TCGPlayer. Requires eBay API credentials in server .env file."
                  >
                    {autoFinding ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Auto-Find Products
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Auto-Find Results */}
              {autoFindResults && (
                <div className="mb-4 space-y-3">
                  <div className="text-sm font-medium text-slate-300">Auto-Found Products</div>
                  {Object.entries(autoFindResults).map(([platform, products]) => {
                    if (products.error) {
                      return (
                        <div key={platform} className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                          <div className="text-yellow-400 text-sm font-medium">{platform}:</div>
                          <div className="text-yellow-300 text-xs mt-1">{products.error}</div>
                        </div>
                      );
                    }
                    if (!products || products.length === 0) {
                      return (
                        <div key={platform} className="bg-slate-900/30 rounded-lg p-3">
                          <div className="text-slate-400 text-sm">No {platform} products found</div>
                        </div>
                      );
                    }
                    return (
                      <div key={platform} className="bg-slate-900/50 rounded-lg border border-slate-700">
                        <div className="p-3 border-b border-slate-700">
                          <div className="text-white font-medium text-sm">{platform} ({products.length} found)</div>
                        </div>
                        <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                          {products.map((product, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-2 bg-slate-800/50 rounded border border-slate-700 hover:border-blue-500 transition-colors"
                            >
                              {product.imageUrl && (
                                <img
                                  src={product.imageUrl}
                                  alt={product.title}
                                  className="w-16 h-16 object-cover rounded"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium truncate">{product.title}</div>
                                {product.price && (
                                  <div className="text-green-400 text-xs mt-1">
                                    ${product.price} {product.currency || 'USD'}
                                  </div>
                                )}
                                {product.condition && (
                                  <div className="text-slate-400 text-xs">{product.condition}</div>
                                )}
                                <a
                                  href={product.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 text-xs hover:text-blue-300 truncate block"
                                >
                                  View on {platform}
                                </a>
                              </div>
                              <button
                                onClick={() => handleAddFromAutoFind(product)}
                                disabled={saving || links.some(l => l.platform === product.platform)}
                                className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-xs transition-colors disabled:opacity-50 flex-shrink-0"
                                title={links.some(l => l.platform === product.platform) ? "Platform already added" : "Add this link"}
                              >
                                {links.some(l => l.platform === product.platform) ? "Added" : "Add"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Existing Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">
                    Marketplace Links ({links.length})
                  </label>
                  <span className="text-xs text-slate-500">
                    One link per platform
                  </span>
                </div>
                {links.length === 0 ? (
                  <div className="text-slate-500 text-sm text-center py-4 bg-slate-900/30 rounded-lg">
                    No links added yet. Add links from different platforms below.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                              <span className="text-xs font-semibold text-slate-300">
                                {link.platform.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium text-sm">{link.platform}</div>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 text-xs truncate block hover:text-blue-300"
                              title={link.url}
                            >
                              {link.url.length > 60 ? `${link.url.substring(0, 60)}...` : link.url}
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          disabled={saving}
                          className="ml-3 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors disabled:opacity-50 flex-shrink-0"
                          title="Delete link"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Link */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-300">
                    Add New Link
                  </label>
                  <span className="text-xs text-slate-500">
                    {links.length > 0 && `(${links.length}/${platforms.length} platforms added)`}
                  </span>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-3">
                  <div className="text-xs text-blue-300 font-medium mb-1">📋 Paste your marketplace URL here:</div>
                  <div className="text-xs text-slate-400">Copy the full URL from TCGPlayer, eBay, or any marketplace and paste it below</div>
                </div>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={newLink.url}
                    onChange={(e) => {
                      const url = e.target.value;
                      setNewLink({ ...newLink, url });
                      handleUrlChange(url);
                    }}
                    placeholder="Paste marketplace URL here..."
                    className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  {parsingLink && (
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing link...
                    </div>
                  )}
                  {linkPreview && !parsingLink && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-400 font-medium">Detected Platform:</span>
                        <span className="text-xs text-white font-semibold">{linkPreview.platform}</span>
                      </div>
                      {linkPreview.productId && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-400 font-medium">Product ID:</span>
                          <span className="text-xs text-white">{linkPreview.productId}</span>
                        </div>
                      )}
                      {linkPreview.productName && (
                        <div className="text-xs text-slate-300">
                          <span className="text-blue-400">Product:</span> {linkPreview.productName}
                        </div>
                      )}
                      {linkPreview.imageUrl && (
                        <div className="flex items-center gap-2">
                          <img 
                            src={linkPreview.imageUrl} 
                            alt="Product" 
                            className="w-16 h-16 object-cover rounded border border-slate-600"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      {linkPreview.price && (
                        <div className="text-xs text-slate-300">
                          <span className="text-blue-400">Price:</span> {linkPreview.price}
                        </div>
                      )}
                      <div className="text-xs text-slate-400 truncate">
                        {linkPreview.url}
                      </div>
                    </div>
                  )}
                  <select
                    value={newLink.platform}
                    onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {platforms.map(platform => {
                      const isUsed = links.some(l => l.platform === platform);
                      return (
                        <option 
                          key={platform} 
                          value={platform}
                          disabled={isUsed}
                        >
                          {platform} {isUsed ? "(already added)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  {getAvailablePlatforms().length === 0 && (
                    <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                      All platforms have been added. Delete a link to add a different one.
                    </div>
                  )}
                  <button
                    onClick={handleAddLink}
                    disabled={saving || !newLink.url.trim()}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? "Adding..." : "Add Link"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-sm text-center py-8 space-y-2">
              <div className="font-medium text-slate-300 mb-2">No product selected</div>
              <div>1. Search for a card in the left panel</div>
              <div>2. Click on a card to select it</div>
              <div>3. Then paste your marketplace links below</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
