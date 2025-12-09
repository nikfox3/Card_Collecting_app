# Workspace Setup Guide

## 🎯 Opening the Workspace

You now have a complete workspace file that includes your entire Card Collecting App and Admin Dashboard.

### Quick Start

**Double-click the workspace file:**
```
Card_Collecting_app.code-workspace
```

Or open it from VS Code/Cursor:
1. File → Open Workspace from File...
2. Navigate to: `/Users/NikFox/Documents/git/Card_Collecting_app/`
3. Select: `Card_Collecting_app.code-workspace`

### What's Included

The workspace includes these folders:

1. **Card Collecting App (Root)** - Main project root
   - Contains: package.json, config files, scripts
   
2. **Admin Dashboard** - Admin interface
   - Location: `./admin-dashboard`
   - Contains: Admin UI, card management, analytics
   
3. **Pricing Data** - Price collection workspace
   - Location: `./Pricing Data`
   - Contains: Collection scripts, historical data, logs
   
4. **Server** - Backend API server
   - Location: `./server`
   - Contains: API routes, database, services
   
5. **Source (Frontend)** - Main app frontend
   - Location: `./src`
   - Contains: React components, pages, services
   
6. **Database** - Database files and scripts
   - Location: `./database`
   - Contains: Database files, migrations, scripts
   
7. **Scripts** - Utility scripts
   - Location: `./scripts`
   - Contains: Automation scripts, helpers

## 🚀 Workspace Features

### Pre-configured Tasks

The workspace includes these tasks (View → Command Palette → Tasks: Run Task):

- **Start Dev Server** - Start the main frontend dev server
- **Start API Server** - Start the backend API server
- **Start Admin Dashboard** - Start the admin dashboard dev server
- **Start All Servers** - Start both frontend and API servers

### Debug Configurations

Pre-configured debug configurations:

- **Launch Frontend** - Launch Chrome with the frontend (http://localhost:5173)
- **Launch Admin Dashboard** - Launch Chrome with admin dashboard (http://localhost:5174)

### Recommended Extensions

The workspace recommends these extensions:

- Prettier (code formatting)
- ESLint (code linting)
- Tailwind CSS IntelliSense
- TypeScript support
- Auto Rename Tag
- Path IntelliSense

### File Exclusions

To keep the workspace performant, these are excluded:

- `node_modules/`
- `dist/` and `build/`
- `.cache/` and `.image-cache/`
- Python cache files
- Large pricing data archives

## 📝 Usage Tips

### Opening the Workspace

**From Terminal:**
```bash
cd "/Users/NikFox/Documents/git/Card_Collecting_app"
code Card_Collecting_app.code-workspace
# or for Cursor:
cursor Card_Collecting_app.code-workspace
```

**From Finder:**
- Double-click `Card_Collecting_app.code-workspace`
- It will open in your default editor (VS Code/Cursor)

### Working with Multiple Folders

When you open the workspace, you'll see all folders in the sidebar. Each folder can be:
- Collapsed/expanded independently
- Searched separately or together
- Focused for file operations

### Switching Between Projects

You can easily switch focus between:
- Main app development (src/)
- Admin dashboard work (admin-dashboard/)
- Price collection tasks (Pricing Data/)
- Server development (server/)

## 🔧 Customization

You can customize the workspace by editing `Card_Collecting_app.code-workspace`:

- Add/remove folders
- Change folder names
- Modify settings
- Add tasks or debug configurations

## 📍 Workspace Location

**Full path:**
```
/Users/NikFox/Documents/git/Card_Collecting_app/Card_Collecting_app.code-workspace
```

## ✅ Verification

To verify the workspace is set up correctly:

1. Open the workspace file
2. Check that all 7 folders appear in the sidebar
3. Try running a task (Command Palette → Tasks: Run Task)
4. Verify file search works across all folders

## 🆘 Troubleshooting

**Workspace won't open:**
- Make sure VS Code/Cursor is installed
- Check file permissions
- Try opening from terminal with `code` or `cursor` command

**Folders missing:**
- Verify all folders exist in the project
- Check folder paths in the workspace file

**Tasks not working:**
- Make sure you're in the correct folder
- Check that dependencies are installed (`npm install`)
- Verify package.json scripts exist

## 📚 Additional Resources

- See `README.md` in the root for project overview
- See `admin-dashboard/README.md` for admin dashboard docs
- See `Pricing Data/README.md` for pricing collection docs




