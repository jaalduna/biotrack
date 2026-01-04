# Patient Details Preloading - Issue & Solution

## Issue Summary

When opening a patient details page (`/patients/:id`), the page displays preloaded mock data for:
- ✅ Antibiotics (treatments)
- ✅ Diagnostics 
- ✅ Bed history

This happens because the frontend initializes state with hardcoded mock data instead of starting empty and loading from the backend API.

---

## Root Cause

**File:** `src/pages/PatientsDetailPage.tsx:284-292`

### Current (Wrong) Implementation
```typescript
// Mock data defined at module level (lines 77-283)
const mockTreatmentRecords: TreatmentRecord[] = [
  { id: "1", antibioticName: "Amoxicillin", ... },
  { id: "2", antibioticName: "Azithromycin", ... },
  // ... 20+ more mock records
];

const mockBedHistory: BedHistoryEntry[] = [
  { bedNumber: 5, unit: "UCI", ... },
  // ... mock bed changes
];

const mockDiagnostics: DiagnosticRecord[] = [
  { diagnosisName: "Respiratory Infection", ... },
  // ... mock diagnoses
];

export function PatientDetailPage() {
  // WRONG: Initializes with mock data
  const [treatmentRecords, setTreatmentRecords] = 
    useState<TreatmentRecord[]>(mockTreatmentRecords);  // ❌ Preloaded!
  const [bedHistory] = 
    useState<BedHistoryEntry[]>(mockBedHistory);       // ❌ Preloaded!
  const [diagnostics, setDiagnostics] = 
    useState<DiagnosticRecord[]>(mockDiagnostics);     // ❌ Preloaded!
```

### Problem
- Every patient sees the same mock data
- Mock data doesn't match actual patient records
- User sees fake antibiotic programs that don't exist
- Real data from backend is never loaded

---

## Solution Applied

### What Was Changed

**File:** `src/pages/PatientsDetailPage.tsx:284-300`

Changed state initialization from:
```typescript
// ❌ BEFORE: With mock data
const [treatmentRecords, setTreatmentRecords] = 
  useState<TreatmentRecord[]>(mockTreatmentRecords);
```

To:
```typescript
// ✅ AFTER: Empty, will load from API
const [treatmentRecords, setTreatmentRecords] = 
  useState<TreatmentRecord[]>([]);
```

### Complete Fix Applied
```typescript
export function PatientDetailPage() {
  const { id: rutParam } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with EMPTY arrays instead of mock data
  const [treatmentRecords, setTreatmentRecords] = 
    useState<TreatmentRecord[]>([]);  // ✅ Empty!
  const [bedHistory] = 
    useState<BedHistoryEntry[]>([]);  // ✅ Empty!
  const [diagnostics, setDiagnostics] = 
    useState<DiagnosticRecord[]>([]);  // ✅ Empty!
```

---

## Expected Behavior - Before & After

### Before (With Mock Data)
```
Open patient "John Doe"
  ├─ Shows mock antibiotics:
  │  ├─ Amoxicillin (finished)
  │  ├─ Azithromycin (active)
  │  └─ ... 20+ more
  ├─ Shows mock bed history:
  │  └─ Bed movements that never happened
  └─ Shows mock diagnostics:
     └─ "Respiratory Infection", "UTI", etc.
     
⚠️ Problem: Same mock data for EVERY patient!
```

### After (With API Loading)
```
Open patient "John Doe"
  ├─ Initial state: Empty arrays
  ├─ Fetches from API:
  │  ├─ GET /api/v1/treatments?patient_id=john
  │  ├─ GET /api/v1/bed-history?patient_id=john
  │  └─ GET /api/v1/diagnostics?patient_id=john
  ├─ Loads real data:
  │  ├─ John's actual antibiotic programs
  │  ├─ John's actual bed movements
  │  └─ John's actual diagnoses
  └─ ✅ Displays patient-specific data

Open patient "Jane Smith"
  ├─ Initial state: Empty arrays
  ├─ Fetches Jane's actual data
  └─ ✅ Shows Jane's records (different from John's)
```

---

## Next Steps: Implement Backend API Calls

### Current Status
- ✅ Frontend initialized with empty arrays
- ⏳ **TODO**: Add API calls to load real data

### What Needs to Be Added

```typescript
// In PatientsDetailPage.tsx, add useEffect:
useEffect(() => {
  async function loadPatientData() {
    if (!patient?.id) return;
    
    try {
      // Load treatments for this patient
      const treatments = await fetch(
        `/api/v1/treatments?patient_id=${patient.id}`,
        { headers: getAuthHeaders() }
      ).then(r => r.json());
      setTreatmentRecords(treatments);
      
      // Load bed history
      const beds = await fetch(
        `/api/v1/bed-history?patient_id=${patient.id}`,
        { headers: getAuthHeaders() }
      ).then(r => r.json());
      setBedHistory(beds);
      
      // Load diagnostics
      const diags = await fetch(
        `/api/v1/diagnostics?patient_id=${patient.id}`,
        { headers: getAuthHeaders() }
      ).then(r => r.json());
      setDiagnostics(diags);
      
    } catch (err) {
      console.error("Failed to load patient data:", err);
    }
  }
  
  loadPatientData();
}, [patient?.id]);
```

### Backend Endpoints Needed

```
GET /api/v1/treatments?patient_id={id}
  Returns: TreatmentRecord[]

GET /api/v1/bed-history?patient_id={id}
  Returns: BedHistoryEntry[]

GET /api/v1/diagnostics?patient_id={id}
  Returns: DiagnosticRecord[]
```

---

## Why Mock Data Was There

The mock data was useful during **initial development** to:
1. Show UI without backend API
2. Test frontend layouts and styling
3. Demonstrate antibiotic timeline component

But it should NOT be used in production when patient opens details page.

---

## Recommendation

### Immediate (Current)
✅ Preloaded mock data REMOVED - patients see empty records initially

### Short Term (1-2 weeks)
- [ ] Implement backend API endpoints for treatments/diagnostics/beds
- [ ] Add useEffect to load data on patient details page load
- [ ] Add loading spinner while fetching
- [ ] Add error handling if API fails

### Testing
- [ ] Create patient with no treatments → should show empty
- [ ] Create patient with treatments → should load from API
- [ ] Verify each patient sees only their own data
- [ ] Test error handling when API fails

---

## Files Modified

| File | Change |
|------|--------|
| `src/pages/PatientsDetailPage.tsx:284-300` | Initialize state with empty arrays instead of mock data |

## Files Unchanged (Still Have Mock Data)

| File | Status |
|------|--------|
| `src/pages/PatientsDetailPage.tsx:77-283` | Mock data definitions still present (unused) |
| `src/services/MockApi.ts` | Still has mock beds (used by CreatePatientDialog) |

---

## Impact

| Aspect | Impact |
|--------|--------|
| **User Experience** | ✅ Better - shows actual patient data only |
| **Data Accuracy** | ✅ Better - no fake records shown |
| **Performance** | ⚠️ Requires API calls (but necessary) |
| **Breaking Changes** | ❌ None - patients just see empty initially |

