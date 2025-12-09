# Accessing Console Logs from Your Phone

## Option 1: Chrome Remote Debugging (Android) - EASIEST

### Setup:
1. **On your Android phone:**
   - Open Chrome
   - Go to `chrome://inspect` (or Settings → More tools → Remote devices)
   - Enable "USB debugging" in Developer options
   - Connect phone to computer via USB

2. **On your computer:**
   - Open Chrome
   - Go to `chrome://inspect`
   - You should see your phone listed
   - Click "inspect" next to your app's tab
   - Console logs will appear in the DevTools window

### Alternative (Wireless):
- Enable "Discover USB devices" in Chrome
- Connect phone and computer to same WiFi
- Phone will appear in `chrome://inspect`

---

## Option 2: Safari Web Inspector (iOS) - REQUIRES MAC

### Setup:
1. **On your iPhone:**
   - Settings → Safari → Advanced
   - Enable "Web Inspector"

2. **On your Mac:**
   - Open Safari
   - Safari → Preferences → Advanced
   - Enable "Show Develop menu in menu bar"
   - Connect iPhone via USB
   - Safari → Develop → [Your iPhone Name] → [Your App Tab]
   - Console logs will appear in Web Inspector

---

## Option 3: Add Visual Debug Panel (EASIEST - No Computer Needed!)

Add a debug panel directly in the app that shows logs on screen.

### Implementation:
Add this to `CardScanner.jsx`:

```jsx
const [debugLogs, setDebugLogs] = useState([]);

// Add debug logging function
const addDebugLog = (message, data = {}) => {
  const log = {
    timestamp: new Date().toLocaleTimeString(),
    message,
    data: JSON.stringify(data).substring(0, 100)
  };
  setDebugLogs(prev => [...prev.slice(-19), log]); // Keep last 20 logs
  console.log(message, data);
};

// Use it instead of console.log:
addDebugLog('🔍 Preprocessing image', { width, height });
addDebugLog('🔐 Calculated dHash', { hashLength, hashPreview });
```

Then add a debug panel in the UI:

```jsx
{/* Debug Panel */}
{showDebugPanel && (
  <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white text-xs p-2 max-h-48 overflow-y-auto z-50">
    <div className="flex justify-between items-center mb-2">
      <span className="font-bold">Debug Logs</span>
      <button onClick={() => setShowDebugPanel(false)}>✕</button>
    </div>
    {debugLogs.map((log, i) => (
      <div key={i} className="mb-1">
        <span className="text-gray-400">{log.timestamp}</span> {log.message} {log.data}
      </div>
    ))}
  </div>
)}
```

---

## Option 4: Send Logs to Server (Best for Production Debugging)

Send logs to your API server so you can view them in terminal:

```javascript
// Add to cardImageMatcher.js or CardScanner.jsx
const sendDebugLog = async (message, data = {}) => {
  try {
    await fetch(`${API_URL}/api/debug/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    });
  } catch (e) {
    // Silent fail - don't break app if logging fails
  }
};

// Use it:
sendDebugLog('Hash calculated', { hashLength, hashPreview });
```

Then view logs in your terminal where the API server is running.

---

## Quick Test: Add Alert for Hash Preview

Temporarily add an alert to see hash values:

```javascript
// In cardImageMatcher.js, after calculating hash:
if (scannedHashes.differenceHash) {
  const preview = scannedHashes.differenceHash.substring(0, 20);
  alert(`Hash preview: ${preview}\nLength: ${scannedHashes.differenceHash.length}`);
}
```

This will show a popup on your phone with the hash info.

---

## Recommended Approach

**For quick debugging:** Use Option 3 (Visual Debug Panel) - easiest, no setup needed
**For detailed debugging:** Use Option 1 (Chrome Remote Debugging) or Option 2 (Safari Web Inspector)

