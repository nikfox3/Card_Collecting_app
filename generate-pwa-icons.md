# Generate PWA Icons

## Quick Icon Generation

You need to create icons in multiple sizes. Here are the easiest methods:

### Method 1: Using PWA Asset Generator (Recommended)

1. Install the tool:
```bash
npm install -g pwa-asset-generator
```

2. Create a 512x512 source icon (PNG format) named `icon-source.png` in the `public/` folder

3. Run the generator:
```bash
pwa-asset-generator public/icon-source.png public/ --icon-only --favicon
```

This will generate all required sizes automatically.

### Method 2: Using Online Tools

1. **PWA Builder Image Generator**
   - Visit: https://www.pwabuilder.com/imageGenerator
   - Upload your 512x512 icon
   - Download the generated icons
   - Place them in the `public/` folder

2. **RealFaviconGenerator**
   - Visit: https://realfavicongenerator.net/
   - Upload your icon
   - Configure settings
   - Download and extract to `public/` folder

### Method 3: Manual Creation

If you have an image editor, create icons in these sizes:

**Android Icons:**
- icon-72.png (72x72)
- icon-96.png (96x96)
- icon-128.png (128x128)
- icon-144.png (144x144)
- icon-152.png (152x152)
- icon-192.png (192x192)
- icon-384.png (384x384)
- icon-512.png (512x512)

**iOS Icons:**
- icon-57.png (57x57)
- icon-60.png (60x60)
- icon-76.png (76x76)
- icon-114.png (114x114)
- icon-120.png (120x120)
- icon-180.png (180x180)

**Note:** Some sizes overlap (72, 144, 152) and can be reused for both platforms.

### Using Your Logo

If you have the CardStax logo SVG:
1. Convert to PNG at 512x512
2. Use one of the methods above to generate all sizes

