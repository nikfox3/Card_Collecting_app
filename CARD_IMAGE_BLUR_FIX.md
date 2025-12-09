# Card Image Blur & Background Glow Fix

## Issues Fixed

### 1. Harsh Edge on Blurred Container
**Problem**: The card image container had a visible hard border that created a harsh edge against the blurred background.

**Solution**: Removed the `border border-white/10` class from the inner card image container to eliminate the harsh edge:
```jsx
// Before
<div className="aspect-[3/4] bg-white/5 backdrop-blur-sm rounded-lg mb-3 flex items-center justify-center overflow-hidden relative border border-white/10">

// After
<div className="aspect-[3/4] bg-white/5 backdrop-blur-sm rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
```

### 2. Oversized Blur/Glow Background
**Problem**: The dynamic glow background behind card images was too large and didn't complement the card's dimensions.

**Solution**: Reduced the size and adjusted the glow effect to better match card dimensions:
```jsx
// Before
<div 
  className="absolute opacity-20 blur-xl"
  style={{
    backgroundImage: `url(${getCardImageUrl(selectedCard)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    filter: 'blur(20px) saturate(1.5) brightness(1.2)',
    transform: 'scale(1.1)',
    inset: '-10px',
    zIndex: 1,
    width: '268px',
    marginLeft: '52px'
  }}
/>

// After
<div 
  className="absolute opacity-15 blur-2xl"
  style={{
    backgroundImage: `url(${getCardImageUrl(selectedCard)})`,
    backgroundSize: '130%',
    backgroundPosition: 'center center',
    filter: 'blur(25px) saturate(1.3) brightness(1.1)',
    transform: 'scale(0.85)',
    inset: '-20px',
    zIndex: 1,
    width: '268px',
    marginLeft: '52px',
    borderRadius: '8px'
  }}
/>
```

## Changes Made

### Key Adjustments:
1. **Reduced opacity**: `opacity-20` → `opacity-15` for a more subtle glow
2. **Increased blur**: `blur-xl` (16px) → `blur-2xl` (24px) for smoother effect
3. **Reduced scale**: `transform: 'scale(1.1)'` → `scale(0.85)` to make background smaller
4. **Adjusted background size**: `cover` → `130%` to prevent oversizing
5. **More blur**: `blur(20px)` → `blur(25px)` for softer edges
6. **Less saturation**: `saturate(1.5)` → `saturate(1.3)` for more subtle colors
7. **Less brightness**: `brightness(1.2)` → `brightness(1.1)` for softer glow
8. **Added border radius**: `borderRadius: '8px'` for smoother edges
9. **Increased inset**: `-10px` → `-20px` for more spread

## Results

✅ **Eliminated harsh edges**: No more visible border lines on card image containers
✅ **Better proportioned glow**: Background glow now complements card dimensions
✅ **Smoother blur effect**: Softer, more natural-looking blur
✅ **More subtle appearance**: Glow is less intense and more elegant

## Files Modified

- `src/App.jsx`:
  - Line 375: Removed border from card image container
  - Lines 6395-6409: Optimized dynamic glow background for card detail page

## Testing

1. Open the main app
2. View trending cards on the dashboard
3. Click on any card to view details
4. Verify:
   - No harsh edges around card images
   - Glow effect is proportional to card size
   - Smooth, natural blur effect
   - Subtle, elegant appearance



