# PWABuilder Studio VSCode Extension Guide

## What is PWABuilder Studio?

PWABuilder Studio is a **VSCode extension** that brings PWA development tools directly into your editor. It's much easier than using the web version!

## Features

✅ **Audit your PWA** - Check if it's app store ready  
✅ **Generate Service Worker** - Create offline functionality  
✅ **Generate Icons** - Create all PWA icon sizes  
✅ **Package for App Stores** - Generate Android/iOS/Windows packages  
✅ **Publish to Azure** - Deploy to Azure Static Web Apps  
✅ **PWA Snippets** - Code snippets for PWA features  
✅ **Convert Web App to PWA** - Transform any web app

## Installation

### Step 1: Install Extension

1. **Open VSCode**
2. **Click Extensions** (or press `Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows)
3. **Search for:** `PWABuilder Studio`
4. **Click "Install"**
5. **Author:** Microsoft (PWABuilder)

**Or install via command:**
```bash
code --install-extension PWABuilder.pwabuilder-studio
```

### Step 2: Reload VSCode

After installation, **reload VSCode** to activate the extension.

## How to Use with Your Project

### Step 1: Open Your Project

1. **Open VSCode**
2. **File → Open Folder**
3. **Select:** `/Users/NikFox/Documents/git/Card_Collecting_app`

### Step 2: Access PWABuilder Studio

**Method 1: Command Palette**
1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
2. Type: `PWABuilder`
3. Select: **"PWABuilder: Audit PWA"** or **"PWABuilder: Package PWA"**

**Method 2: Sidebar**
1. Look for **PWABuilder** icon in the left sidebar
2. Click it to open the PWABuilder panel

**Method 3: Right-click**
1. Right-click on `index.html` or `manifest.json`
2. Select **"PWABuilder"** from context menu

## Common Tasks

### 1. Audit Your PWA

**To check if your PWA is ready:**

1. **Open Command Palette** (`Cmd+Shift+P`)
2. Type: `PWABuilder: Audit PWA`
3. **Enter your PWA URL:**
   ```
   https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app
   ```
4. **See results:**
   - ✅ What's working
   - ⚠️ What needs fixing
   - 💡 Recommendations

### 2. Generate Service Worker

**If you need to update your service worker:**

1. **Command Palette** → `PWABuilder: Generate Service Worker`
2. **Choose options:**
   - Caching strategy
   - Offline support
   - Background sync
3. **Generate** - Creates/updates `sw.js`

### 3. Generate Icons

**To create all PWA icon sizes:**

1. **Command Palette** → `PWABuilder: Generate Icons`
2. **Upload your logo** (512x512 or larger)
3. **Generate** - Creates all icon sizes automatically

### 4. Package for App Stores

**To generate Android/iOS packages:**

1. **Command Palette** → `PWABuilder: Package PWA`
2. **Select platforms:**
   - ✅ Android
   - ✅ iOS
   - ✅ Windows
3. **Fill in app details:**
   - App name: CardStax
   - Package name: com.cardstax.app
   - Version: 1.0.0
4. **Download packages**

### 5. Use PWA Snippets

**To add PWA features with code snippets:**

1. **Open any `.js` or `.html` file**
2. **Type:** `pwa-` and see suggestions
3. **Select snippet** to insert PWA code

**Available snippets:**
- `pwa-install` - Install prompt
- `pwa-offline` - Offline detection
- `pwa-sync` - Background sync
- `pwa-notification` - Push notifications

## Your Current PWA Status

Since you already have:
- ✅ `manifest.json` configured
- ✅ `sw.js` service worker
- ✅ Icons set up
- ✅ PWA deployed on Vercel

**You can use PWABuilder Studio to:**
1. **Audit** - Check if everything is correct
2. **Package** - Generate app store packages
3. **Improve** - Add missing features

## Quick Start: Audit Your PWA

**Right now, try this:**

1. **Open VSCode** in your project
2. **Press `Cmd+Shift+P`** (or `Ctrl+Shift+P`)
3. **Type:** `PWABuilder: Audit PWA`
4. **Enter:** `https://dist-7sstdz48l-therealnikfox-3095s-projects.vercel.app`
5. **See your PWA score!**

## Benefits Over Web Version

| Feature | Web Version | VSCode Extension |
|---------|-------------|------------------|
| **Audit PWA** | ✅ | ✅ |
| **Generate Icons** | ✅ | ✅ |
| **Package Apps** | ✅ | ✅ |
| **Code Integration** | ❌ | ✅ |
| **Snippets** | ❌ | ✅ |
| **Works Offline** | ❌ | ✅ |
| **Faster** | ⚠️ | ✅ |

## Troubleshooting

### Extension Not Showing

1. **Reload VSCode** after installation
2. **Check Extensions** - Make sure it's enabled
3. **Restart VSCode** if needed

### Can't Find Commands

1. **Command Palette** → Type `PWABuilder`
2. **All commands** start with `PWABuilder:`
3. **Check sidebar** for PWABuilder icon

### Audit Not Working

- Make sure your PWA is **deployed and accessible**
- Use your **Vercel URL** (not localhost)
- Check **HTTPS** is enabled (Vercel provides this)

## Next Steps

1. ✅ **Install the extension** (2 minutes)
2. ✅ **Audit your PWA** (1 minute)
3. ✅ **Generate app packages** (5 minutes)
4. ✅ **Submit to app stores** (optional)

## Summary

**PWABuilder Studio VSCode extension is perfect for you!**

- ✅ Easier than web version
- ✅ Integrated into your editor
- ✅ Works with your existing PWA
- ✅ Can generate app store packages
- ✅ Free to use

**Install it now and audit your PWA!** 🚀

