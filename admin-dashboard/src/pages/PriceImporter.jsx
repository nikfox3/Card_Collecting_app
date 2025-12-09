import React, { useState } from 'react';

const PriceImporter = () => {
  const [file, setFile] = useState(null);
  const [priceUpdates, setPriceUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // all, increases, decreases

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const parseCSV = (file) => {
    setLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const updates = [];
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handle quoted values)
        const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
        if (!matches || matches.length < 7) continue;
        
        const cleanValue = (val) => val.replace(/^,?"?|"?$/g, '').replace(/""/g, '"');
        
        const [cardId, cardName, setName, oldPrice, newPrice, priceChange, timestamp] = matches.map(cleanValue);
        
        updates.push({
          cardId,
          cardName,
          setName,
          oldPrice: parseFloat(oldPrice),
          newPrice: parseFloat(newPrice),
          priceChange: parseFloat(priceChange),
          timestamp
        });
      }
      
      setPriceUpdates(updates);
      calculateStats(updates);
      setLoading(false);
    };
    
    reader.onerror = () => {
      alert('Error reading file');
      setLoading(false);
    };
    
    reader.readAsText(file);
  };

  const calculateStats = (updates) => {
    const increases = updates.filter(u => u.priceChange > 0).length;
    const decreases = updates.filter(u => u.priceChange < 0).length;
    const noChange = updates.filter(u => u.priceChange === 0).length;
    const totalOldValue = updates.reduce((sum, u) => sum + u.oldPrice, 0);
    const totalNewValue = updates.reduce((sum, u) => sum + u.newPrice, 0);
    const avgChange = updates.reduce((sum, u) => sum + u.priceChange, 0) / updates.length;
    
    setStats({
      total: updates.length,
      increases,
      decreases,
      noChange,
      totalOldValue,
      totalNewValue,
      avgChange
    });
  };

  const handleImport = async () => {
    if (!window.confirm(`Import ${priceUpdates.length} price updates to the database?`)) {
      return;
    }

    setImporting(true);
    
    try {
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < priceUpdates.length; i += batchSize) {
        const batch = priceUpdates.slice(i, i + batchSize);
        
        try {
          const response = await fetch('http://localhost:3001/api/admin/prices/bulk-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ updates: batch })
          });

          if (response.ok) {
            const result = await response.json();
            successCount += result.updated || batch.length;
          } else {
            errorCount += batch.length;
          }
        } catch (error) {
          console.error('Batch import error:', error);
          errorCount += batch.length;
        }

        // Update progress
        const progress = ((i + batch.length) / priceUpdates.length * 100).toFixed(1);
        console.log(`Import progress: ${progress}%`);
      }

      alert(`Import complete!\nSuccess: ${successCount}\nErrors: ${errorCount}`);
      
      // Clear the form
      setFile(null);
      setPriceUpdates([]);
      setStats(null);
      
    } catch (error) {
      alert('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const getFilteredUpdates = () => {
    if (filter === 'increases') {
      return priceUpdates.filter(u => u.priceChange > 0);
    } else if (filter === 'decreases') {
      return priceUpdates.filter(u => u.priceChange < 0);
    }
    return priceUpdates;
  };

  const filteredUpdates = getFilteredUpdates();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Bulk Price Importer</h1>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload Price Update CSV</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
          />
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Parsing CSV file...</p>
          </div>
        )}

        {stats && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Updates</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.increases}</div>
              <div className="text-sm text-gray-600">Price Increases</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.decreases}</div>
              <div className="text-sm text-gray-600">Price Decreases</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.avgChange.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Avg Change</div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {priceUpdates.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Price Updates Preview</h2>
            
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Updates ({priceUpdates.length})</option>
                <option value="increases">Increases ({stats?.increases || 0})</option>
                <option value="decreases">Decreases ({stats?.decreases || 0})</option>
              </select>

              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : 'Import All'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Set
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Old Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUpdates.slice(0, 100).map((update, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {update.cardName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {update.setName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${update.oldPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      ${update.newPrice.toFixed(2)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      update.priceChange > 0 ? 'text-green-600' : 
                      update.priceChange < 0 ? 'text-red-600' : 
                      'text-gray-500'
                    }`}>
                      {update.priceChange > 0 ? '+' : ''}{update.priceChange.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUpdates.length > 100 && (
              <div className="text-center py-4 text-sm text-gray-500">
                Showing first 100 of {filteredUpdates.length} updates
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceImporter;








