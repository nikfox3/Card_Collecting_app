# SearchBar Component

A reusable search bar component with an overlapping scan button, designed to match the Figma specifications.

## Features

- **Overlapping Scan Button**: Circular button with gradient background that overlaps the search input
- **Responsive Design**: Adapts to different screen sizes and container widths
- **Interactive Elements**: Hover effects, transitions, and clear button functionality
- **Customizable**: Configurable placeholder text, event handlers, and styling
- **Accessibility**: Proper keyboard navigation and focus management

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `searchQuery` | `string` | - | Current search query value (controlled) |
| `setSearchQuery` | `function` | - | Function to update search query state |
| `onSearch` | `function` | - | Function called when search is triggered (Enter key or click) |
| `onScanClick` | `function` | - | Function called when scan button is clicked |
| `placeholder` | `string` | `"Search cards, sets, attacks, abilities..."` | Placeholder text for the input |
| `className` | `string` | `""` | Additional CSS classes for the container |

## Usage

```jsx
import SearchBar from './components/SearchBar';

function MyComponent() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    // Handle search logic
    console.log('Searching for:', searchQuery);
  };

  const handleScanClick = () => {
    // Handle scan functionality
    console.log('Scan button clicked');
  };

  return (
    <SearchBar
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onSearch={handleSearch}
      onScanClick={handleScanClick}
      placeholder="Search for anything..."
    />
  );
}
```

## Styling

### Scan Button
- **Size**: 64px × 64px
- **Border Radius**: 100px (fully rounded)
- **Border**: 1px solid #605DEC
- **Background**: Linear gradient from rgba(255, 251, 251, 0.20) to rgba(96, 93, 236, 0.20) over #2B2B2B
- **Shadow**: 0px 4px 4px 0px rgba(0, 0, 0, 0.25)
- **Icon**: 28px × 28px white scan icon

### Search Input
- **Height**: 48px
- **Background**: #2B2B2B
- **Border**: 1px solid #383838
- **Border Radius**: 4px
- **Text**: White with SF Pro font
- **Placeholder**: White with 70% opacity

### Interactive States
- **Hover**: Opacity changes for better user feedback
- **Focus**: Input receives focus styling
- **Clear Button**: Appears when text is entered, allows clearing

## Layout

The component uses a flexbox layout with:
- Scan button positioned with negative margin to overlap the search input
- Search input takes remaining width with proper padding
- Z-index layering ensures proper stacking order

## Accessibility

- **Keyboard Navigation**: Enter key triggers search
- **Focus Management**: Proper tab order and focus indicators
- **Screen Reader Support**: Semantic HTML structure
- **Touch Targets**: Adequate size for mobile interaction

## Customization

### Custom Placeholder
```jsx
<SearchBar
  placeholder="Search your collection..."
  // ... other props
/>
```

### Custom Styling
```jsx
<SearchBar
  className="my-custom-search-bar"
  // ... other props
/>
```

### Custom Event Handlers
```jsx
<SearchBar
  onSearch={() => {
    // Custom search logic
    performAdvancedSearch(searchQuery);
  }}
  onScanClick={() => {
    // Custom scan logic
    openCameraScanner();
  }}
  // ... other props
/>
```

## Dependencies

- React (for component functionality)
- Tailwind CSS (for styling classes)

## Browser Support

- Modern browsers with CSS Grid and Flexbox support
- Mobile browsers with touch event support
- Requires JavaScript for interactive functionality
