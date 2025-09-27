# Glass Navigation Bar Component

## Overview
A beautiful glassmorphism navigation bar with dynamic icons, smooth animations, and a glowing indicator. Perfectly aligned and designed to match Figma specifications.

## Features
- ✅ **Glassmorphism Effect**: Semi-transparent background with backdrop blur
- ✅ **Dynamic Icons**: Active/inactive states with proper SVG icons
- ✅ **Smooth Animations**: 500ms sliding indicator with easing
- ✅ **Perfect Alignment**: Precisely centered indicator under each icon
- ✅ **Glowing Effect**: Multi-layer glow with glass diffusion
- ✅ **Responsive Design**: Fixed bottom positioning with proper spacing

## Usage

```jsx
import GlassNavigationBar from './components/GlassNavigationBar'

// In your main component
const [activeTab, setActiveTab] = useState('home')
const [navigationMode, setNavigationMode] = useState('home')

return (
  <div>
    {/* Your main content */}
    <div className="pb-20"> {/* Add bottom padding to prevent overlap */}
      {/* App content here */}
    </div>
    
    {/* Navigation Bar */}
    <GlassNavigationBar 
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      navigationMode={navigationMode}
      setNavigationMode={setNavigationMode}
    />
  </div>
)
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `activeTab` | string | Current active tab ('home', 'collection', 'marketplace', 'profile') |
| `setActiveTab` | function | Function to update active tab |
| `navigationMode` | string | Current navigation mode ('home', 'collection', 'marketplace', 'profile', 'none') |
| `setNavigationMode` | function | Function to update navigation mode |

## Navigation States

### Active State
- Filled purple icon (`#6865E7`)
- White text label below icon
- Glowing indicator underneath
- Full height button (75px)

### Inactive State
- Outlined gray icon (`#8F8F94`)
- No text label
- No indicator
- Reduced height button (47px)

## Indicator Animation
- **Sliding Motion**: Smoothly slides between active icons
- **None State**: Slides off-screen to the left when `navigationMode === 'none'`
- **Duration**: 500ms with ease-in-out timing
- **Glow Effect**: Multi-layer blur with glass diffusion

## Positioning
The indicator is perfectly centered under each icon:
- **Home**: 41px from left
- **Collection**: 125px from left  
- **Marketplace**: 209px from left
- **Profile**: 293px from left

## Styling Details

### Glass Effect
- Background: `rgba(43,43,43,0.2)` with 20% opacity
- Backdrop blur: `backdrop-blur-md`
- Border: `border-white/10` for subtle edge
- Border radius: `rounded-[16px]`

### Shadow
Multi-layer shadow for depth:
```css
shadow-[0px_24px_7px_0px_rgba(0,0,0,0.01),0px_16px_6px_0px_rgba(0,0,0,0.04),0px_9px_5px_0px_rgba(0,0,0,0.15),0px_4px_4px_0px_rgba(0,0,0,0.25),0px_1px_2px_0px_rgba(0,0,0,0.29)]
```

### Indicator Glow
- Inner glow: `blur-sm opacity-30 scale-110`
- Outer glow: `blur-md opacity-20 scale-125`
- Glass diffusion: `bg-gradient-to-t from-white/10 to-transparent`

## Icons Used

### Home
- **Active**: Filled house icon
- **Inactive**: Outlined house icon with door

### Collection  
- **Active**: Filled overlapping cards
- **Inactive**: Outlined overlapping cards

### Marketplace
- **Active**: Filled shopping cart
- **Inactive**: Outlined shopping cart

### Profile
- **Active**: Filled user silhouette
- **Inactive**: Outlined user silhouette

## Customization

To customize colors, modify these CSS variables:
- Active icon color: `#6865E7`
- Inactive icon color: `#8F8F94`
- Text color: `white`
- Background: `rgba(43,43,43,0.2)`

## Browser Support
- Modern browsers with CSS backdrop-filter support
- Fallback: Semi-transparent background without blur

## Dependencies
- React
- Tailwind CSS
- No external icon libraries (uses inline SVG)

## File Structure
```
src/
  components/
    GlassNavigationBar.jsx    # Main component
    GlassNavigationBar.md     # This documentation
```

## Notes
- Ensure main content has `pb-20` to prevent overlap with fixed navigation
- The component is fully self-contained with no external dependencies
- All animations are CSS-based for optimal performance
- Perfectly aligned for mobile and desktop use
