# Restart Servers Guide

## Quick Restart (2 Terminal Windows)

### Terminal 1 - API Server (Port 3001)
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app/server
npm run dev
```

### Terminal 2 - Vite Dev Server (Port 3000)
```bash
cd /Users/NikFox/Documents/git/Card_Collecting_app
npm run dev
```

## Verify Servers Are Running

### Check API Server:
```bash
curl http://localhost:3001/api/health
```

### Check Vite Server:
Open browser: `http://localhost:3000` or `http://192.168.1.240:3000`

## Access from Phone

Once both servers are running:
- **Vite Server**: `http://192.168.1.240:3000`
- **API Server**: `http://192.168.1.240:3001`

Make sure your phone is on the same WiFi network as your computer.

## Troubleshooting

### If ports are already in use:
```bash
# Kill processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

### Check what's running:
```bash
ps aux | grep -E "(vite|node.*server)" | grep -v grep
```

### View server logs:
- API Server logs will appear in Terminal 1
- Vite Server logs will appear in Terminal 2

