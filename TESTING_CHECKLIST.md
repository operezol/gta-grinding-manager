# Testing Checklist - Universal Dataset Integration

## ✅ Pre-Test Setup (COMPLETADO)
- [x] Database migration executed successfully (5 columns added)
- [x] Dataset imported successfully (46 activities created, 252 deprecated)
- [x] TypeScript types updated
- [x] UI components updated for null-safety

---

## 🧪 Test Plan

### 1. Start the Application

**Backend**:
```bash
npm start
```

**Frontend**:
```bash
cd frontend
npm run dev
```

### 2. Visual Verification Tests

#### Test 2.1: Activities Load Without Errors
- [ ] Open browser console (F12)
- [ ] Navigate to activities page
- [ ] **PASS**: No TypeScript/React errors in console
- [ ] **PASS**: All 46 new activities visible

#### Test 2.2: Deprecated Activities Handling
- [ ] Check filter "Hide deprecated" is ON by default
- [ ] **PASS**: Only 46 activities shown (252 deprecated hidden)
- [ ] Uncheck "Hide deprecated"
- [ ] **PASS**: Now shows all 298 activities (46 + 252)
- [ ] **PASS**: Deprecated activities have:
  - Strikethrough text
  - Lower opacity
  - ⚠️ Deprecated badge (if visible in compact mode)

#### Test 2.3: Visual Badges Display
For activities with badges, verify:
- [ ] **📦 Dataset badge**: Shows for new activities from dataset
- [ ] **👤 Solo badge**: Shows for solo-able activities
- [ ] **⏸️ Passive badge**: Shows for passive activities
- [ ] **📊 No data badge**: Shows for activities without metrics
- [ ] Badges are compact in grid view
- [ ] Badges don't break layout

#### Test 2.4: Null-Safe Metric Display
Check activities without metrics (most new dataset activities):
- [ ] **Payout column**: Shows "-" instead of "$0" or error
- [ ] **Time column**: Shows "-" instead of "0m" or error
- [ ] **Efficiency column**: Shows "-" instead of "$0" or error
- [ ] **PASS**: No "NaN", "undefined", or "null" displayed

### 3. Filter System Tests

#### Test 3.1: Source Filter
- [ ] Open "All sources" dropdown
- [ ] Select "Dataset"
- [ ] **PASS**: Shows only 46 activities (new dataset ones)
- [ ] Select "Legacy"
- [ ] **PASS**: Shows 252 deprecated activities
- [ ] Select "All sources"
- [ ] **PASS**: Shows all activities

#### Test 3.2: Has Metrics Filter
- [ ] Check "Has metrics only"
- [ ] **PASS**: Only shows activities with verified payout/time
- [ ] **PASS**: Activities without data are hidden
- [ ] Uncheck filter
- [ ] **PASS**: All activities visible again

#### Test 3.3: Hide Deprecated Filter
- [ ] Uncheck "Hide deprecated"
- [ ] **PASS**: 298 total activities shown
- [ ] Check "Hide deprecated"
- [ ] **PASS**: 46 activities shown (only active dataset)

#### Test 3.4: Combined Filters
Test filter combinations:
- [ ] Category: "heist" + Solo: ON
- [ ] **PASS**: Shows only solo heists
- [ ] Category: "business" + Passive: ON
- [ ] **PASS**: Shows only passive businesses
- [ ] Has metrics: ON + Hide deprecated: ON
- [ ] **PASS**: Shows only dataset activities with verified data

### 4. Tooltip Tests

#### Test 4.1: Enhanced Tooltip Info
Hover over any activity name:
- [ ] **PASS**: Tooltip appears
- [ ] **PASS**: Shows "Category" field
- [ ] For new dataset activities:
  - [ ] Shows "Source: dataset"
  - [ ] Shows "Solo: Yes/No"
  - [ ] Shows "Passive: Yes/No"
- [ ] For deprecated activities:
  - [ ] Shows "⚠️ Deprecated (not in current dataset)" in red

#### Test 4.2: New Production Fields
For business activities with production data:
- [ ] **PASS**: Shows "Production time: X min" (if present)
- [ ] **PASS**: Shows "Supply duration: X min" (if present)
- [ ] **PASS**: Shows "Max storage: $X" (if present)

### 5. Sorting Tests

#### Test 5.1: Sort by Efficiency
- [ ] Click "$/min" header
- [ ] **PASS**: Activities sort by efficiency (ascending)
- [ ] Click again
- [ ] **PASS**: Sorts descending (highest first)
- [ ] **PASS**: Activities without efficiency go to bottom

#### Test 5.2: Sort by Name
- [ ] Click "Activity" header
- [ ] **PASS**: Alphabetical sort works
- [ ] **PASS**: All activities (with/without data) sort correctly

#### Test 5.3: Sort with Nulls
- [ ] Click "Payout" header
- [ ] **PASS**: Activities with null payout go to end
- [ ] **PASS**: No crashes or errors
- [ ] Click "Time" header
- [ ] **PASS**: Same behavior for null time

### 6. Session Management Tests

#### Test 6.1: Start Session on Activity Without Data
- [ ] Find activity with "-" in payout/time columns
- [ ] Click "Start" button
- [ ] **PASS**: Session starts (no error)
- [ ] Click "Stop"
- [ ] Enter money earned
- [ ] Click "Confirm"
- [ ] **PASS**: Session completes successfully

#### Test 6.2: Stats Calculation with Partial Data
- [ ] Complete 1 session on activity without dataset metrics
- [ ] **PASS**: After session:
  - Payout shows actual earned money
  - Time shows actual duration
  - Efficiency calculated from real session
- [ ] **PASS**: Activity now has real stats instead of "-"

### 7. Backwards Compatibility Tests

#### Test 7.1: Old Activities Still Work
- [ ] Filter to "Legacy" source
- [ ] Find an old tracked activity (with session history)
- [ ] **PASS**: All data intact
- [ ] **PASS**: Sessions/stats display correctly
- [ ] **PASS**: Can start new sessions
- [ ] **PASS**: Reset button works

#### Test 7.2: Mixed Data Activities
Some activities might have partial data:
- [ ] **PASS**: If payout exists but time is null, shows payout and "-" for time
- [ ] **PASS**: If time exists but payout is null, shows time and "-" for payout
- [ ] **PASS**: Efficiency only shown if both exist

### 8. Data Integrity Tests

#### Test 8.1: Database Check
Run in backend:
```bash
sqlite3 gta_tracker.db "SELECT COUNT(*) as total, source, deprecated FROM activities GROUP BY source, deprecated;"
```

Expected output should show:
- ~46 activities with source='dataset', deprecated=0
- ~252 activities with source='legacy', deprecated=1
- All activities have id, name, category (required fields)

#### Test 8.2: Re-Import Safety
```bash
node scripts/import-dataset.js
```

- [ ] **PASS**: Shows "0 created, 46 updated, 252 deprecated"
- [ ] **PASS**: No data loss
- [ ] **PASS**: Existing sessions preserved

### 9. Edge Cases

#### Test 9.1: Activity with Only Category
- [ ] New activity with just id, name, category (all null metrics)
- [ ] **PASS**: Displays correctly with all "-"
- [ ] **PASS**: Can track sessions
- [ ] **PASS**: Stats build from real sessions

#### Test 9.2: Filter Edge Cases
- [ ] Apply all filters at once
- [ ] **PASS**: No crashes
- [ ] **PASS**: Shows correct subset (possibly empty)
- [ ] Clear all filters
- [ ] **PASS**: Returns to full list

#### Test 9.3: Search with Badges
- [ ] Search for activity name
- [ ] **PASS**: Badges still show in results
- [ ] **PASS**: Deprecated filter works with search

### 10. Performance Tests

#### Test 10.1: Large Dataset Handling
- [ ] Load all 298 activities (deprecated + active)
- [ ] **PASS**: Page loads in < 2 seconds
- [ ] **PASS**: Scrolling is smooth
- [ ] **PASS**: Filtering is instant

#### Test 10.2: Rapid Filter Changes
- [ ] Quickly toggle filters on/off
- [ ] **PASS**: No lag or freezing
- [ ] **PASS**: Results update immediately

---

## 🐛 Known Issues to Watch For

### Issue: TypeScript Errors in Console
**Symptom**: Red errors about undefined properties
**Fix**: Check that all components use `?? 0` or `?? null` for optional fields

### Issue: Badges Breaking Layout
**Symptom**: Activity names overflow or wrap badly
**Fix**: Check `ActivityBadges.css` flex/gap settings

### Issue: Efficiency Shows $0 Instead of "-"
**Symptom**: Zero values shown for activities without data
**Fix**: Check ActivityGrid efficiency calculation uses `> 0` check

### Issue: Filters Not Working
**Symptom**: Checking filter doesn't change results
**Fix**: Verify `useActivityFilters.ts` has new filter logic

---

## ✅ Success Criteria

All tests PASS when:
1. ✅ App loads without errors (console clean)
2. ✅ All 46 dataset activities visible and functional
3. ✅ 252 deprecated activities marked and hideable
4. ✅ Visual badges display correctly
5. ✅ Null metrics show as "-" not errors
6. ✅ All filters work (source, deprecated, has metrics)
7. ✅ Sorting handles null values gracefully
8. ✅ Sessions can be tracked on activities without metrics
9. ✅ Old activity data preserved (backwards compatible)
10. ✅ Re-importing dataset is safe (idempotent)

---

## 📝 Test Results Log

### Test Run: [DATE]

**Environment**:
- OS: Windows
- Node: [version]
- Browser: [browser]

**Results**:
- [ ] Visual Tests: PASS / FAIL
- [ ] Filter Tests: PASS / FAIL
- [ ] Tooltip Tests: PASS / FAIL
- [ ] Sorting Tests: PASS / FAIL
- [ ] Session Tests: PASS / FAIL
- [ ] Compatibility Tests: PASS / FAIL
- [ ] Data Integrity: PASS / FAIL
- [ ] Edge Cases: PASS / FAIL
- [ ] Performance: PASS / FAIL

**Issues Found**:
1. [List any issues]
2. 
3. 

**Notes**:
[Any observations or recommendations]

---

## 🔧 Quick Fixes

### If Nothing Shows Up
```bash
# Check activities exist
sqlite3 gta_tracker.db "SELECT COUNT(*) FROM activities;"

# Should show 298 (46 + 252)
```

### If Filters Don't Work
```bash
# Check filter defaults in useActivityFilters.ts
# Should have: hideDeprecated: true, sourceFilter: 'all', hasDataOnly: false
```

### If Badges Don't Show
```bash
# Check CSS imported in ActivityBadges.tsx
# Check ActivityGrid imports ActivityBadges
```

### If Sort Crashes
```bash
# Check sortedActivities useMemo in ActivityGrid.tsx
# Should have null checks: if (aVal == null && bVal == null) return 0;
```

---

**🎉 When all tests pass, the universal dataset integration is COMPLETE!**
