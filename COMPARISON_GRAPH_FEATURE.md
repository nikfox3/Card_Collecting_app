# Comparison Graph Feature Implementation

## What Was Added

### 1. Raw/Graded Selection
- **Replaced** the condition dropdown with a "Raw" vs "Graded" selection dropdown
- Users can now choose between viewing Ungraded card values or Graded (PSA) values
- State variable: `selectedCardType` ('Raw' or 'Graded')

### 2. Price Display Buttons
Added tappable buttons below the timeline that show:
- **For Raw**: Ungraded Values (NM, LP, MP, HP, DM)
- **For Graded**: PSA Values (10, 9, 8, 7, 6)

Each button displays:
- Condition/Grade abbreviation
- Price value
- Interactive highlight when selected

### 3. Comparison Tracking
- State variable: `selectedComparisons` (array of selected items)
- Users can tap multiple conditions/grades to compare
- Selected items are highlighted in blue

## Current State

✅ **UI Elements Added**:
- Raw/Graded dropdown selection
- Condition price buttons for Raw cards
- PSA grade buttons for Graded cards
- Selection tracking and highlighting

⏳ **Next Steps** (need implementation):
- Load historical data for selected comparisons
- Add multiple datasets to the Line chart
- Different colors for each comparison line
- Update chart when comparisons change

## Files Modified

- `src/App.jsx`:
  - Line 1147-1151: Added state for Raw/Graded selection and comparisons
  - Line 6860-6898: Replaced condition dropdown with Raw/Graded dropdown
  - Line 6960-7035: Added price buttons section with conditions/grades

## How It Works

1. **Select Type**: User chooses "Raw" or "Graded" from dropdown
2. **View Options**: Corresponding price buttons appear (Ungraded or PSA Values)
3. **Select for Comparison**: Tap buttons to add them to comparison
4. **Graph Updates**: (Pending) Multiple lines appear on chart in different colors

## Data Flow (To Be Implemented)

```
User selects comparison → Check if data exists → Load historical data → 
Add as dataset to chart → Display line in unique color
```

## Note

The graph rendering logic needs to be updated to support multiple datasets (lines) based on the `selectedComparisons` array. This will require:

1. Fetching historical data for each selected comparison
2. Creating separate datasets in `cardChartData`
3. Assigning unique colors to each line
4. Updating the chart when comparisons change



