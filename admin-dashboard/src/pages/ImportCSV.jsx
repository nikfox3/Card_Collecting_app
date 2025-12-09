import { useState } from 'react';
import { admin } from '../utils/api';

export default function ImportCSV() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [csvData, setCsvData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [options, setOptions] = useState({
    updateExisting: true,
    addNew: true,
    skipEmptyRows: true,
    previewOnly: true
  });

  const processFile = async (selectedFile) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setMessage('');
      
      // Parse CSV file
      try {
        const text = await selectedFile.text();
        
        // Helper function to parse CSV line properly handling quoted fields
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
              } else {
                // Toggle quote state
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              // Field separator
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim()); // Add last field
          return result;
        };
        
        const lines = text.split('\n');
        const headers = parseCSVLine(lines[0]);
        
        const data = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            data.push(row);
          }
        }
        
        setCsvData(data);
        setMessage(`✅ CSV loaded: ${data.length} rows found`);
        
        // Run preview
        await runPreview(data);
        
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setMessage('❌ Error parsing CSV file: ' + error.message);
        setFile(null);
        setCsvData(null);
      }
    } else {
      setMessage('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    await processFile(selectedFile);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    await processFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const runPreview = async (data) => {
    try {
      const result = await admin.importCSV(data, { ...options, previewOnly: true });
      console.log('Preview result:', result);
      setPreview(result.data || result);
    } catch (error) {
      console.error('Error running preview:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      setMessage('❌ Error running preview: ' + errorMsg);
    }
  };

  const handleImport = async () => {
    if (!csvData) return;

    setImporting(true);
    setMessage('Importing... This may take a few minutes.');

    try {
      const result = await admin.importCSV(csvData, { ...options, previewOnly: false });
      const data = result.data || result;
      
      setMessage(`✅ Import completed! 
        • ${data.results?.updated || 0} cards updated
        • ${data.results?.created || 0} cards created
        • ${data.results?.skipped || 0} cards skipped
        • ${data.results?.errors || 0} errors`);
      
      setCsvData(null);
      setFile(null);
      setPreview(null);
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
      setMessage('❌ Import failed: ' + errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      const blob = await admin.exportDatabase();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pokemon_cards_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setMessage('✅ Database exported successfully!');
    } catch (error) {
      console.error('Error exporting database:', error);
      setMessage('❌ Export failed: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Import CSV</h1>
        <p className="text-slate-400">Bulk update cards from CSV files</p>
      </div>

      {/* Instructions & Templates */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Getting Started</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportDatabase}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Database
            </button>
            <a
              href="http://localhost:3001/api/admin/csv/template"
              download
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                const token = localStorage.getItem('admin_token');
                fetch('http://localhost:3001/api/admin/csv/template', {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                  .then(res => res.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'pokemon_cards_import_template.csv';
                    a.click();
                  });
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV Template
            </a>
            <a
              href="http://localhost:3001/api/admin/csv/instructions"
              download
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                const token = localStorage.getItem('admin_token');
                fetch('http://localhost:3001/api/admin/csv/instructions', {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                  .then(res => res.blob())
                  .then(blob => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'CSV_IMPORT_INSTRUCTIONS.txt';
                    a.click();
                  });
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Instructions
            </a>
          </div>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-blue-300 text-sm font-medium">CSV Import Template</p>
              <p className="text-blue-400/80 text-sm mt-1">
                Download the pre-formatted CSV template with all column headers and a sample card. 
                Fill in your card data and upload it back here to bulk import or update cards.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-slate-300 font-medium mb-2">Quick Steps:</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
            <li>Click "Download CSV Template" above</li>
            <li>Open the template in Excel, Numbers, or Google Sheets</li>
            <li>Fill in your card data (see sample row for format)</li>
            <li>Save as CSV and upload using the form below</li>
            <li>Review preview and click "Import"</li>
          </ol>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Upload CSV File</h2>
        
        <div 
          className="border-2 border-dashed border-slate-600/50 rounded-xl p-12 text-center hover:border-blue-500/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <svg className="w-16 h-16 text-slate-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <label className="cursor-pointer">
            <span className="text-blue-400 hover:text-blue-300 font-medium">
              Click to upload
            </span>
            <span className="text-slate-400"> or drag and drop</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          
          <p className="text-slate-500 text-sm mt-2">CSV files only</p>
          
          {file && (
            <div className="mt-4 text-white">
              Selected: <span className="text-blue-400">{file.name}</span>
            </div>
          )}
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.includes('success') || message.includes('Importing')
              ? 'bg-green-500/10 border border-green-500/50 text-green-400'
              : message.includes('Error')
              ? 'bg-red-500/10 border border-red-500/50 text-red-400'
              : 'bg-blue-500/10 border border-blue-500/50 text-blue-400'
          }`}>
            {message}
          </div>
        )}

        {file && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all shadow-lg"
          >
            {importing ? 'Importing...' : 'Import CSV'}
          </button>
        )}
      </div>

      {/* Import Options */}
      {csvData && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Import Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.updateExisting}
                  onChange={(e) => setOptions({...options, updateExisting: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-slate-300">Update existing cards</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.addNew}
                  onChange={(e) => setOptions({...options, addNew: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-slate-300">Add new cards</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.skipEmptyRows}
                  onChange={(e) => setOptions({...options, skipEmptyRows: e.target.checked})}
                  className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                />
                <span className="text-slate-300">Skip empty rows</span>
              </label>
            </div>
            
            <div className="text-slate-400 text-sm">
              <p><strong>Update existing:</strong> Cards with matching ID or name+set will be updated</p>
              <p><strong>Add new:</strong> Cards not found will be created as new entries</p>
              <p><strong>Skip empty:</strong> Rows with missing name will be ignored</p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Results */}
      {preview && preview.results && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Import Preview</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{preview.results?.processed || 0}</div>
              <div className="text-sm text-blue-300">Total Rows</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{preview.results?.updated || 0}</div>
              <div className="text-sm text-green-300">Will Update</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{preview.results?.created || 0}</div>
              <div className="text-sm text-purple-300">Will Create</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{preview.results?.errors || 0}</div>
              <div className="text-sm text-red-300">Errors</div>
            </div>
          </div>

          {preview.errors && preview.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-red-400 font-medium mb-2">Errors Found:</h3>
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {preview.errors.map((error, index) => (
                  <div key={index} className="text-red-300 text-sm">{error}</div>
                ))}
              </div>
            </div>
          )}

          {preview.results.preview && preview.results.preview.length > 0 && (
            <div>
              <h3 className="text-slate-300 font-medium mb-2">Sample Changes:</h3>
              <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                {preview.results.preview.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-slate-300">{item.name}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.action === 'update' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {item.action}
                    </span>
                  </div>
                ))}
                {preview.results.preview.length > 10 && (
                  <div className="text-slate-500 text-sm mt-2">
                    ... and {preview.results.preview.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alternative Import Methods */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Alternative Import Methods</h2>
        <p className="text-slate-300 mb-4">
          For advanced users, you can also use command-line scripts for bulk operations:
        </p>
        <div className="space-y-3">
          <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
            <div className="font-mono text-sm text-green-400 mb-2">Pricing Import:</div>
            <code className="text-slate-300">$ node import_without_triggers.cjs</code>
            <p className="text-slate-400 text-xs mt-2">Updates pricing data from CSV files</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
            <div className="font-mono text-sm text-blue-400 mb-2">Card Number Standardization:</div>
            <code className="text-slate-300">$ node scripts/standardize_card_numbers.cjs</code>
            <p className="text-slate-400 text-xs mt-2">Converts all card numbers to XXX/YYY format</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
            <div className="font-mono text-sm text-purple-400 mb-2">Auto Price Updates:</div>
            <code className="text-slate-300">$ node scripts/auto_price_updater.cjs</code>
            <p className="text-slate-400 text-xs mt-2">Fetches latest prices from APIs</p>
          </div>
        </div>
      </div>
    </div>
  );
}

