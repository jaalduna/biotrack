# BioTrack Database Architecture

## Overview

BioTrack uses a **single shared PostgreSQL database** for all teams and users with **row-level multi-tenancy**. This means:

- ✅ **One database** for the entire application
- ✅ **All teams' data** stored in same tables
- ✅ **Data isolation** enforced at application layer via `team_id` field
- ✅ **Scalable and cost-effective** for SaaS

**Why Single Database?**
- Simpler deployment and management
- No need to create/destroy databases per team
- Cost-effective (one DB instance)
- Easier backup and recovery
- Works well for teams < 10,000

---

## Database Schema

### Core Tables

#### 1. **teams** - Team metadata and billing
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,           -- e.g., "City Hospital ICU"
    subscription_status VARCHAR(50),      -- "trial", "active", "cancelled", "expired"
    subscription_plan VARCHAR(50),        -- "basic" (5 members), "premium" (20 members)
    member_limit INTEGER,                 -- 5 for basic, 20 for premium
    trial_ends_at TIMESTAMP,              -- When free trial expires
    stripe_customer_id VARCHAR(255),      -- Stripe customer reference
    stripe_subscription_id VARCHAR(255),  -- Stripe subscription reference
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Fields:**
- `id` - Team identifier, used for data isolation
- `subscription_plan` - Determines how many members team can have
- `trial_ends_at` - Triggers when to require payment

---

#### 2. **users** - User credentials and roles
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,   -- Login credential
    name VARCHAR(255),
    hashed_password VARCHAR(255),         -- bcrypt hash
    
    -- Team association
    team_id UUID FOREIGN KEY,             -- Which team user belongs to
    team_role VARCHAR(50),                -- "owner", "admin", "member"
    
    -- Email verification
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    
    -- User type
    role VARCHAR(50),                     -- "basic" or "advanced" (features)
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Key Constraints:**
- One user can only belong to ONE team
- `team_id` is NULL until user creates/joins team
- Email verification required to manage teams

---

#### 3. **team_invitations** - Pending team member invitations
```sql
CREATE TABLE team_invitations (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL FOREIGN KEY,
    email VARCHAR(255) NOT NULL,          -- Invited email
    role VARCHAR(50),                     -- "admin" or "member"
    status VARCHAR(50),                   -- "pending", "accepted", "declined"
    expires_at TIMESTAMP,                 -- Link expiry (24 hours)
    
    -- Acceptance tracking
    accepted_at TIMESTAMP,
    accepted_by UUID FOREIGN KEY,         -- User who accepted
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Flow:**
1. Owner sends invitation → creates row with `status='pending'`
2. Invited user clicks email link
3. User accepts → updates `status='accepted'`, records `accepted_by` and `accepted_at`

---

#### 4. **patients** - Hospital patients (CORE DATA)
```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL FOREIGN KEY,    -- DATA ISOLATION: Only team can see their patients
    
    rut VARCHAR(20) NOT NULL UNIQUE,      -- Patient ID number
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    status VARCHAR(50),                   -- "waiting", "active", "archived"
    
    unit VARCHAR(50),                     -- "UCI" (ICU) or "UTI" (standard ward)
    bed_number INTEGER,                   -- Which bed patient is in
    has_ending_soon_program BOOLEAN,      -- Alert flag
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Multi-Tenancy:** Every query MUST include `WHERE team_id = current_team_id`

---

#### 5. **treatments** - Antibiotic treatment programs
```sql
CREATE TABLE treatments (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL FOREIGN KEY,
    team_id UUID NOT NULL FOREIGN KEY,    -- For efficient filtering
    
    -- Treatment details
    antibiotic_name VARCHAR(255),
    antibiotic_type VARCHAR(50),          -- "antibiotic" or "corticoide"
    start_date DATE,
    programmed_days INTEGER,              -- How many days total
    days_applied INTEGER,                 -- Days actually given
    status VARCHAR(50),                   -- "active", "suspended", "finished", "extended"
    start_count INT,                      -- 0 or 1
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

#### 6. **diagnostics** - Patient diagnoses
```sql
CREATE TABLE diagnostics (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL FOREIGN KEY,
    team_id UUID NOT NULL FOREIGN KEY,
    
    diagnosis_name VARCHAR(255),
    diagnosis_code VARCHAR(50),           -- e.g., ICD-10 code
    date_diagnosed DATE,
    severity VARCHAR(50),                 -- "mild", "moderate", "severe", "critical"
    notes TEXT,
    created_by UUID FOREIGN KEY,          -- Doctor who created
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

#### 7. **units** - Hospital units/departments
```sql
CREATE TABLE units (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL FOREIGN KEY,
    
    name VARCHAR(255),                    -- e.g., "ICU", "Ward A"
    description TEXT,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

#### 8. **beds** - Physical hospital beds
```sql
CREATE TABLE beds (
    id UUID PRIMARY KEY,
    unit_id UUID NOT NULL FOREIGN KEY,
    team_id UUID NOT NULL FOREIGN KEY,
    
    bed_number INTEGER,
    is_occupied BOOLEAN,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

#### 9. **bed_history** - Patient bed movements
```sql
CREATE TABLE bed_history (
    id UUID PRIMARY KEY,
    patient_id UUID NOT NULL FOREIGN KEY,
    team_id UUID NOT NULL FOREIGN KEY,
    
    bed_number INTEGER,
    unit VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## Multi-Tenancy Architecture

### How Data Isolation Works

**Rule: All queries must filter by `team_id`**

**Example - Get all patients for a team:**
```python
# ✅ CORRECT - Filters by team
patients = db.query(Patient).filter(
    Patient.team_id == current_user.team_id
).all()

# ❌ WRONG - Would show all teams' patients!
patients = db.query(Patient).all()
```

### User Flow & Team Association

```
1. NEW USER REGISTERS
   ├─ Creates account
   ├─ User.team_id = NULL
   ├─ User.email_verified = FALSE
   └─ Must verify email before managing teams

2. USER VERIFIES EMAIL
   ├─ Clicks email link
   ├─ User.email_verified = TRUE
   └─ Can now create/join teams

3. USER CREATES TEAM (becomes owner)
   ├─ POST /teams/ with team name
   ├─ Backend creates:
   │  ├─ New Team record
   │  ├─ Updates User: team_id = new_team.id
   │  └─ Sets User: team_role = "owner"
   └─ User can now manage team

4. OWNER INVITES MEMBERS
   ├─ POST /teams/{id}/invitations
   ├─ Creates TeamInvitation record
   ├─ Email sent with acceptance link
   └─ Invited person can:
      ├─ Accept if new user (creates account + joins)
      ├─ Accept if existing user (joins if email matches)
      └─ Decline (invitation expired)

5. TEAM OPERATIONS
   ├─ All patient queries: filter by team_id
   ├─ All diagnostics: filter by team_id
   ├─ All treatments: filter by team_id
   └─ Team members see only their team's data
```

---

## Database Statistics

### Current Schema

| Table | Rows (typical) | Size per 1000 teams |
|-------|----------------|-------------------|
| teams | 1 per team | 1 KB |
| users | 5-20 per team | 15 KB |
| team_invitations | 50-100 total | 25 KB |
| patients | 100-500 per team | 200 KB |
| treatments | 500-2000 per patient | 1-5 MB |
| diagnostics | 50-200 per patient | 100 KB |
| units | 2-5 per team | 5 KB |
| beds | 20-50 per team | 50 KB |
| bed_history | Variable | 100 KB |
| **TOTAL** | **~1M rows** | **~1 GB per 1000 teams** |

---

## Security & Performance

### Security Measures

1. **Row-Level Filtering** - All queries include `team_id` filter
2. **JWT Tokens** - Include `team_id`, validate on each request
3. **Database-Level Constraints**
   - Foreign keys prevent orphaned records
   - Unique constraints on team data (e.g., patient RUT per team)
4. **Email Verification** - Required before team operations
5. **Role-Based Access Control**
   - owner: can manage team, delete team, transfer ownership
   - admin: can invite members, manage patients
   - member: can view/add patients (read-most operations)

### Performance Optimization

1. **Indexes on `team_id`** - Every table has index on team_id
   ```sql
   CREATE INDEX idx_patients_team_id ON patients(team_id);
   CREATE INDEX idx_treatments_team_id ON treatments(team_id);
   ```

2. **Compound Indexes** - For common queries
   ```sql
   CREATE INDEX idx_patients_team_status ON patients(team_id, status);
   CREATE INDEX idx_treatments_patient_team ON treatments(patient_id, team_id);
   ```

3. **Foreign Keys** - Prevent invalid references
   ```sql
   ALTER TABLE patients ADD FOREIGN KEY (team_id) REFERENCES teams(id);
   ```

---

## Data Isolation Example

### Scenario: Two Hospitals Using BioTrack

**Hospital A** (team_id = `uuid-aaa`)
```sql
SELECT * FROM patients WHERE team_id = 'uuid-aaa';
-- Returns: John (patient), Jane (patient) - Hospital A's patients

SELECT * FROM treatments 
WHERE team_id = 'uuid-aaa';
-- Returns: All treatments for Hospital A's patients
```

**Hospital B** (team_id = `uuid-bbb`)
```sql
SELECT * FROM patients WHERE team_id = 'uuid-bbb';
-- Returns: Bob (patient), Alice (patient) - Hospital B's patients
-- Does NOT see Hospital A's patients

SELECT * FROM treatments 
WHERE team_id = 'uuid-bbb';
-- Returns: Only Hospital B's treatments
```

**What if query forgets `team_id` filter?**
```sql
SELECT * FROM patients;  -- ❌ ERROR! Would see ALL hospitals' data
-- PREVENTED by application code requiring team_id in JWT
```

---

## Backup & Disaster Recovery

### Single Database Strategy

**Advantages:**
- ✅ One backup file contains everything
- ✅ Easy point-in-time recovery
- ✅ All teams recover together
- ✅ Lower storage cost

**Disadvantages:**
- ⚠️ One team's data corruption affects all
- ⚠️ Requires careful transaction management

**Mitigation:**
- Daily automatic backups
- Test restores weekly
- Use transactions for critical operations
- Audit logging for data changes

---

## Future Scaling Options

### Option 1: Shard by Team (if > 10,000 teams)
```
Database cluster:
├─ Shard 1: Teams A-M (own DB)
├─ Shard 2: Teams N-Z (own DB)
└─ Metadata DB: Team → Shard mapping
```

### Option 2: Separate Databases per Team (if > 50,000 teams)
```
Metadata DB (shared):
├─ teams
├─ users
└─ team_invitations

Per-Team DBs:
├─ Hospital-A DB: patients, treatments, diagnostics
├─ Hospital-B DB: patients, treatments, diagnostics
└─ Hospital-C DB: patients, treatments, diagnostics
```

### Option 3: Hybrid Approach
```
Shared DB (multi-tenant):
├─ Frequently accessed: users, teams, invitations
└─ Stable data: units, beds

Per-Team DBs (dedicated):
├─ Fast queries: patients, treatments, diagnostics
└─ Real-time: bed_history, status updates
```

**Current Recommendation:** Stay with single shared database until 5,000+ teams

---

## Key Concepts

### Team ID as Primary Filter
Every table except `Team` and `User` has `team_id`:
- Ensures data isolation
- Enables efficient querying
- Allows future sharding

### User → Team Relationship
- Users: One team at a time (one `team_id`)
- Teams: Multiple users
- Invitations: Temporary link between email and team
- Roles: owner, admin, member per user per team

### Data Ownership
- Patients owned by: Teams (not users)
- Treatments owned by: Teams (via patient)
- Diagnostics owned by: Teams (via patient)
- All data is team-scoped

---

## Migration from Single-Tenant to Multi-Tenant

If scaling to Option 2 (per-team databases):

```sql
-- Step 1: Backup current shared DB
-- Step 2: Create per-team DBs
-- Step 3: Run migration script:
FOR EACH team IN teams:
    CREATE DATABASE team_{team.id}
    COPY patients WHERE team_id = team.id → team_{team.id}
    COPY treatments WHERE team_id = team.id → team_{team.id}
    COPY diagnostics WHERE team_id = team.id → team_{team.id}
    
-- Step 4: Update connection logic in backend
-- Step 5: Point teams to their dedicated DBs
```

---

## Summary

| Aspect | Current Architecture |
|--------|----------------------|
| **Database Count** | 1 (PostgreSQL) |
| **Data Isolation** | Row-level (team_id filter) |
| **User-Team Relationship** | 1 user : 1 team (at a time) |
| **Max Recommended Teams** | 5,000 |
| **Max Recommended Users** | 50,000 |
| **Scalability** | Horizontal (add app servers) |
| **Cost** | Low (single DB instance) |
| **Complexity** | Medium (require team_id on all queries) |

BioTrack is production-ready for up to 5,000 hospital teams using this architecture!
