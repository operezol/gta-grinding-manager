# Universal Dataset Integration Guide

## Overview
This document describes the transition from a personal grinding tracker to a universal grinding framework supporting all player styles and activities.

---

## ✅ What's Been Done

### 1. TypeScript Type System Update
**File**: `frontend/src/types/Activity.ts`

**Changes**:
- Made all fields optional except `id`, `name`, `category`
- Added `deprecated` flag (tracks activities no longer in dataset)
- Added `source` field ('dataset' | 'wiki' | 'manual' | 'legacy')
- Added production fields: `productionMinutes`, `supplyConsumptionMinutes`, `maxStorage`
- Added new categories: `challenge`, `passive`
- Unified cooldown fields: `cooldownMinutes` + legacy `minCooldown`

**Rationale**:
- Supports partial data (activities without verified metrics)
- Allows graceful handling of null values
- Enables progressive data population
- Maintains backward compatibility with existing code

---

### 2. Database Schema Migration
**File**: `scripts/migrate-db-for-dataset.js`

**New Columns**:
- `deprecated` (BOOLEAN): Marks activities removed from current dataset
- `source` (TEXT): Tracks data origin (dataset/wiki/manual/legacy)
- `production_minutes` (INTEGER): Time to produce full stock
- `supply_consumption_minutes` (INTEGER): Supply duration
- `max_storage` (REAL): Maximum storage capacity

**Safe Migration**:
- Only adds missing columns
- Never deletes data
- Never overwrites existing values
- Idempotent (can run multiple times)

**Usage**:
```bash
node scripts/migrate-db-for-dataset.js
```

---

### 3. Dataset Import/Upsert System
**File**: `scripts/import-dataset.js`

**Features**:
- **Smart Upsert**: Creates new activities, updates existing ones
- **Null Safety**: Only updates fields present in dataset (ignores null)
- **Deprecation Tracking**: Marks DB activities not in dataset as deprecated
- **Detailed Reporting**: Shows created/updated/deprecated/skipped/errors
- **Data Validation**: Validates required fields (id, name, category)

**Field Mapping** (Dataset → Database):
```
payout                        → avg_payout
time_minutes                  → avg_time_minutes
cooldown_minutes              → cooldown_minutes
production_minutes            → production_minutes
supply_consumption_minutes    → supply_consumption_minutes
max_storage                   → max_storage
```

**Auto-calculated**:
- `efficiency` = `avg_payout / avg_time_minutes` (when both exist)
- `source` = 'dataset' (for all imported activities)
- `deprecated` = FALSE (for dataset activities)

**Usage**:
```bash
# 1. Run migration first (one time)
node scripts/migrate-db-for-dataset.js

# 2. Import dataset (run anytime dataset is updated)
node scripts/import-dataset.js
```

---

## 📋 Dataset Structure

### Base Template (`data.json`)
```json
[
  {
    "id": "activity_id",           // REQUIRED: unique slug
    "name": "Activity Name",       // REQUIRED: display name
    "category": "mission",         // REQUIRED: mission|heist|business|contract|challenge|passive
    
    // Core flags
    "solo": true,                  // Can be done solo?
    "passive": false,              // Passive income?
    
    // Metrics (all optional, use null until verified)
    "payout": null,                // Average payout or {min, max}
    "time_minutes": null,          // Average time or {min, max}
    "cooldown_minutes": null,      // Cooldown in minutes
    
    // Business-specific (optional)
    "production_minutes": null,    // Time to produce full stock
    "supply_consumption_minutes": null,  // How long supplies last
    "max_storage": null            // Maximum storage/capacity
  }
]
```

### Categories Explained
- **mission**: Contact missions, VIP work, CEO work
- **heist**: All heists (Cayo, Casino, Doomsday, Original)
- **business**: Active businesses (Import/Export, Special Cargo, MC businesses)
- **contract**: Agency contracts, Auto Shop, Payphone Hits
- **challenge**: Time Trials, RC Trials
- **passive**: Passive income (Nightclub Safe, Arcade Safe)

---

## 🎨 UI Updates Needed

### Current State
The UI currently expects all fields to be present and non-null. This breaks with the new optional schema.

### Required UI Changes

#### 1. Activity List/Grid Component
**Additions**:
- Show visual indicators:
  - 🚫 Badge for deprecated activities
  - 🌐 Badge for source (dataset/wiki/manual/legacy)
  - 👤 Icon for solo-able
  - ⏸️ Icon for passive
  - ⏱️ Icon when cooldown exists
- Gracefully handle null payout/time (show "No data" or "—")
- Show efficiency only when calculated

#### 2. Filters Component (New)
**Location**: `frontend/src/components/Filters.tsx`

**Filter Options**:
- **Category**: mission | heist | business | contract | challenge | passive
- **Solo**: Solo only | Team required | All
- **Passive**: Passive only | Active only | All
- **Deprecated**: Hide deprecated | Show all
- **Source**: dataset | wiki | manual | legacy | all
- **Has Data**: Only with metrics | All

#### 3. Activity Detail View
**Show**:
- All fields with labels
- "No data" for null metrics
- Source badge
- Deprecated warning if applicable
- Production/consumption info for businesses

#### 4. Sorting Options
**Add**:
- By efficiency (only for activities with data)
- By category
- By cooldown
- By payout
- By time
- By name (existing)

---

## 🚀 Recommended UX/Business Improvements

### Phase 1: Core Enhancements (Immediate)

#### 1.1 Activity Selector / Onboarding
**Problem**: New users don't know which activities to track.

**Solution**: Initial wizard
```
"What's your playstyle?"
[ ] Solo grinder
[ ] Team player
[ ] Passive income focus
[ ] Speed runner (quick activities)
[ ] Big payouts (heists)

→ Auto-adds recommended activities to tracking
```

#### 1.2 Favorites System
**Feature**: Star/favorite activities
- Quick access to preferred activities
- Separate "Favorites" view
- Persistence in DB or localStorage

#### 1.3 Custom Grinding Lists
**Feature**: Create named lists
```
Examples:
- "Morning Routine" (Nightclub Safe → Bunker → Cayo)
- "Quick Money" (Headhunter → Sightseer → Payphone Hit)
- "Passive Setup" (All MC businesses resupply)
```

**Storage**: New DB table `grinding_lists`

---

### Phase 2: Intelligence Layer

#### 2.1 Smart Session Planner
**Input**: "I have 30 minutes"

**Output**:
```
Recommended sequence:
1. Headhunter (5min, $20k)
2. Sightseer (7min, $22k)  
3. Security Contract (6min, $39k)
4. Headhunter again (5min, $20k)

Total: 23 minutes, ~$101k
Efficiency: $4,391/min
```

**Logic**:
- Considers cooldowns
- Maximizes efficiency
- Fits within time budget
- Accounts for solo/team preference

#### 2.2 Passive Income Calculator
**Features**:
- Tracks all passive businesses
- Shows "AFK earnings" projection
- Alerts when businesses are full
- Calculates optimal sell timing

**UI**:
```
Passive Dashboard
────────────────────
Nightclub:      $280k / $360k  (78% full)
                Est. full in: 4h 32m

MC Cocaine:     Full! Sell now
MC Meth:        $180k / $255k  (71%)

Total passive value: $510k
Hourly rate: $45k/hr
```

#### 2.3 Efficiency Analyzer
**Feature**: "Estimated vs Actual" comparison

**Shows**:
- Dataset avg payout vs your actual average
- Dataset avg time vs your actual average
- Your efficiency vs community benchmark
- Improvement suggestions

---

### Phase 3: Advanced Features

#### 3.1 Cooldown Orchestrator
**Problem**: Players forget cooldown times, waste opportunities.

**Solution**: Timeline view
```
Now:        Headhunter available
+5min:      Cayo Perico ready
+10min:     Casino Heist ready
+144min:    Cayo cooldown expires
```

**Alerts**:
- Desktop notifications
- Audio alerts
- Priority queue

#### 3.2 Heist Prep Tracker
**Problem**: Complex heists have many prep steps.

**Solution**: Checklist system
```
Cayo Perico Heist
────────────────
Preps (0/7):
[ ] Gather Intel
[ ] Cutting Torch
[ ] Plasma Cutter
...

Estimated total time: 35min
Expected payout: $1.5M
Efficiency: $42k/min
```

#### 3.3 Daily/Weekly Goals
**Feature**: Set income targets
```
Daily Goal: $2M
Progress:   $1.4M (70%)
Remaining:  $600k

Suggested next activity:
Cayo Perico ($1.5M, 60min)
→ Would complete goal!
```

---

## 🏗️ Architecture Recommendations

### Current Issues
1. **No clear separation** between data fetching and UI
2. **Filter logic scattered** across components
3. **No central state management** (could benefit from Zustand/Context)
4. **Repeated calculations** (efficiency, formatting) in components

### Recommended Structure

```
frontend/src/
├── components/
│   ├── activities/
│   │   ├── ActivityCard.tsx          (presentational)
│   │   ├── ActivityList.tsx          (container)
│   │   ├── ActivityFilters.tsx       (NEW)
│   │   └── ActivityDetail.tsx        (detail view)
│   ├── grinding/
│   │   ├── GrindingList.tsx          (NEW: custom lists)
│   │   ├── SessionPlanner.tsx        (NEW: smart planner)
│   │   └── PassiveDashboard.tsx      (NEW: passive income)
│   ├── common/
│   │   ├── Badge.tsx                 (reusable badge)
│   │   ├── Icon.tsx                  (icon system)
│   │   └── EmptyState.tsx            (no data state)
│   └── layout/
│       └── ... (existing)
│
├── hooks/
│   ├── useActivities.ts              (existing, update for new schema)
│   ├── useActivityFilters.ts         (UPDATE: add new filters)
│   ├── useGrindingLists.ts           (NEW)
│   ├── useSessionPlanner.ts          (NEW)
│   └── usePassiveIncome.ts           (NEW)
│
├── services/
│   ├── api.ts                        (existing, ensure handles nulls)
│   ├── calculations.ts               (NEW: centralize efficiency/time calcs)
│   └── notifications.ts              (existing, extend)
│
├── stores/                            (NEW: Consider Zustand)
│   ├── activityStore.ts              (central state)
│   ├── filterStore.ts                (filter persistence)
│   └── userPreferences.ts            (solo/team, favorites, etc)
│
├── utils/
│   ├── formatUtils.ts                (existing, add null-safe formatters)
│   ├── activityHelpers.ts            (NEW: isDeprecated, hasMetrics, etc)
│   └── filterHelpers.ts              (NEW: filter logic)
│
└── types/
    └── Activity.ts                    (UPDATED ✅)
```

### Key Principles
1. **Separation of Concerns**: Data ← Logic ← UI
2. **Null Safety Everywhere**: Every component handles optional fields
3. **Single Source of Truth**: Don't duplicate filter/calc logic
4. **Progressive Enhancement**: Works with partial data
5. **Extensibility**: Easy to add new activity types/fields

---

## 🔧 Implementation Priority

### Must Do (Before Launch)
1. ✅ TypeScript types updated
2. ✅ DB migration script
3. ✅ Dataset import script
4. ⏳ Update UI to handle optional fields
5. ⏳ Add deprecation indicators
6. ⏳ Add basic filters (category, solo, deprecated)

### Should Do (Phase 1)
7. Add source badges
8. Implement favorites system
9. Create filter component
10. Add sorting by efficiency/cooldown
11. Update activity detail view

### Nice to Have (Phase 2+)
12. Smart session planner
13. Passive income dashboard
14. Custom grinding lists
15. Cooldown orchestrator
16. Efficiency analyzer

---

## 📝 Migration Checklist

### For Developers
- [ ] Run `node scripts/migrate-db-for-dataset.js`
- [ ] Run `node scripts/import-dataset.js`
- [ ] Update frontend components to handle null fields
- [ ] Add visual indicators (deprecated, source, solo, passive)
- [ ] Test with partial data (some activities have metrics, some don't)
- [ ] Add filters component
- [ ] Update sorting logic

### For Data Entry
- [ ] Verify dataset structure matches schema
- [ ] Fill in verified metrics (payout, time) for known activities
- [ ] Add cooldowns for activities with cooldowns
- [ ] Add production data for passive businesses
- [ ] Mark deprecated activities (if any)
- [ ] Set proper source for each activity

---

## 🎯 Success Metrics

The refactor is successful when:
1. ✅ App doesn't crash with null/undefined metrics
2. ✅ Users can filter by category, solo, passive, deprecated
3. ✅ Dataset can be updated without breaking existing data
4. ✅ Deprecated activities are clearly marked
5. ⏳ UI shows helpful "No data" states
6. ⏳ Users can add activities without full metrics
7. ⏳ App works for solo, team, passive, and active players equally

---

## 🚨 Known Limitations

1. **Dataset is partially empty**: Most activities have `null` metrics
   - **Solution**: Progressive data population
   - **Workaround**: Show "No data" gracefully in UI

2. **Legacy activities in DB**: Existing activities may have old schema
   - **Solution**: Migration script handles this
   - **Deprecation**: Auto-marks activities not in dataset

3. **No validation on import**: Import script trusts dataset structure
   - **Risk**: Malformed JSON breaks import
   - **Mitigation**: Add JSON schema validation in future

---

## 📚 Next Steps

1. **Test the migration**:
   ```bash
   node scripts/migrate-db-for-dataset.js
   node scripts/import-dataset.js
   ```

2. **Update UI components** (see "UI Updates Needed" section)

3. **Populate dataset** with verified metrics from official sources

4. **Test with real usage**:
   - Add a session with incomplete data
   - Filter by category/solo
   - Verify deprecated activities show correctly

5. **Iterate on UX improvements** (see recommendations above)

---

## 🤝 Contributing

When adding new activities to `data.json`:
1. Use proper `id` (lowercase, underscores, unique)
2. Set correct `category`
3. Mark `solo` and `passive` accurately
4. Leave metrics as `null` until verified
5. Run import script to update DB

When adding new fields:
1. Update TypeScript interface first
2. Add DB column via migration script
3. Update import script field mapping
4. Update UI components to display/use new field

---

*This document will evolve as the app grows. Keep it updated!*
