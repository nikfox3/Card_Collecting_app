# Lunaris Dashboard - Next.js App

A modern rover management dashboard built with Next.js, TypeScript, and Tailwind CSS v4, replicating the "Step 3 Frame" design.

## Features

- 🚀 **Next.js 16** with App Router
- 📘 **TypeScript** for type safety
- 🎨 **Tailwind CSS v4** for modern styling
- 🎯 **Design System** with custom CSS variables
- 📱 **Responsive Layout** with sidebar navigation
- 📊 **Stats Dashboard** with metrics tiles
- 📋 **Data Table** for rover management

## Tech Stack

- **Framework**: Next.js 16.0.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Fonts**: 
  - JetBrains Mono (primary/monospace)
  - Geist (secondary/sans-serif)
  - Material Symbols Rounded (icons)

## Project Structure

```
nextjs-app/
├── app/
│   ├── globals.css          # Global styles with design system variables
│   ├── layout.tsx           # Root layout with font configuration
│   └── page.tsx            # Main dashboard page
├── components/
│   ├── Sidebar.tsx         # Navigation sidebar component
│   ├── StatsTile.tsx       # Statistics tile component
│   └── RoverTable.tsx      # Rover data table component
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd nextjs-app
```

2. Install dependencies (if not already installed):
```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) (or the port shown in your terminal) in your browser to see the application.

### Build

Build the application for production:

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Design System

The application uses a comprehensive design system with CSS variables defined in `app/globals.css`:

### Color Variables
- `--primary`: #FF8400 (Lunaris orange)
- `--background`: #111111 (dark background)
- `--foreground`: #FFFFFF (white text)
- `--border`: #2E2E2E (border color)
- `--sidebar`: #18181b (sidebar background)
- And many more semantic colors...

### Font Utilities
- `.font-primary`: JetBrains Mono (for headings, data, labels)
- `.font-secondary`: Geist (for body text)
- `.material-symbols`: Material Symbols Rounded icons

## Components

### Sidebar
Navigation component with:
- Lunaris logo header
- Operations section (Dashboard, Missions, Fleet status)
- Management section (Rentals, Billing, Settings)
- User profile footer

### StatsTile
Reusable metric card displaying:
- Title
- Value
- Percentage change indicator

### RoverTable
Data table showing:
- Rover names
- Status badges
- Location information
- Mission details
- Action links

## Design Replication

This project accurately replicates the "Step 3 Frame" design from the Pencil design file, including:

- ✅ Exact color scheme and theming
- ✅ Proper spacing and padding (24px, 16px, etc.)
- ✅ Typography hierarchy with correct font families and sizes
- ✅ Component structure and layout
- ✅ Sidebar navigation with sections
- ✅ Stats tiles with metrics
- ✅ Data table with proper column widths

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled

## License

This is a demonstration project.
