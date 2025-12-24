# @forge/crm Package Structure

```
packages/crm/
│
├── 📄 package.json                         # Package configuration
├── 📄 tsconfig.json                        # TypeScript configuration
├── 📄 README.md                            # Main documentation (500+ lines)
├── 📄 STRUCTURE.md                         # This file
├── 📄 .forge-summary.md                    # Comprehensive summary
│
├── 📁 examples/                            # Usage examples
│   ├── 📄 basic-usage.ts                   # Basic CRUD operations
│   └── 📄 sync-example.ts                  # Sync & webhook handling
│
└── 📁 src/                                 # Source code
    │
    ├── 📄 index.ts                         # Main entry point
    ├── 📄 factory.ts                       # CRM Factory (Strategy Pattern)
    │
    ├── 📁 interfaces/                      # L2 Interfaces (Abstract)
    │   ├── 📄 crm-provider.ts              # ICRMProvider, ICRMConfig, ICRMResponse
    │   ├── 📄 lead-manager.ts              # ILeadManager (12 methods)
    │   ├── 📄 deal-manager.ts              # IDealManager (13 methods)
    │   ├── 📄 company-manager.ts           # ICompanyManager (11 methods)
    │   └── 📄 index.ts                     # Interface exports
    │
    └── 📁 providers/                       # Provider Implementations
        │
        ├── 📁 attio/                       # Attio CRM Provider (✅ Complete)
        │   ├── 📄 lead-manager.ts          # AttioLeadManager (528 lines)
        │   ├── 📄 deal-manager.ts          # AttioDealManager (578 lines)
        │   ├── 📄 company-manager.ts       # AttioCompanyManager (522 lines)
        │   ├── 📄 sync-service.ts          # AttioSyncService (345 lines)
        │   └── 📄 index.ts                 # AttioProvider (exports)
        │
        └── 📁 hubspot/                     # HubSpot CRM Provider (⏳ Stub)
            ├── 📄 lead-manager.ts          # HubSpotLeadManager (stub)
            ├── 📄 deal-manager.ts          # HubSpotDealManager (stub)
            ├── 📄 company-manager.ts       # HubSpotCompanyManager (stub)
            └── 📄 index.ts                 # HubSpotProvider (stub)
```

## File Count Summary

| Category | Count | Status |
|----------|-------|--------|
| Configuration | 2 | ✅ Complete |
| Documentation | 3 | ✅ Complete |
| Examples | 2 | ✅ Complete |
| Interfaces | 5 | ✅ Complete |
| Attio Implementation | 5 | ✅ Complete |
| HubSpot Stubs | 4 | ⏳ Stub Only |
| Factory & Main | 2 | ✅ Complete |
| **Total** | **23** | **Attio: Complete, HubSpot: Stub** |

## Layer Breakdown

### L0 Atoms (External Dependencies)
- `@forge/types` - Type definitions from workspace

### L1 Molecules (Internal Utilities)
- None (self-contained package)

### L2 Cells (This Package)
```
@forge/crm
├── Interfaces (Abstract Layer)
│   ├── ICRMProvider
│   ├── ILeadManager
│   ├── IDealManager
│   └── ICompanyManager
│
├── Implementations (Concrete Layer)
│   ├── AttioProvider ✅
│   │   ├── AttioLeadManager
│   │   ├── AttioDealManager
│   │   ├── AttioCompanyManager
│   │   └── AttioSyncService
│   │
│   └── HubSpotProvider ⏳
│       ├── HubSpotLeadManager (stub)
│       ├── HubSpotDealManager (stub)
│       └── HubSpotCompanyManager (stub)
│
└── Factory (Strategy Pattern)
    └── CRMFactory
```

### L3 Tissues (Consumers)
- `apps/hephaitos` - B2B2C CRM for trading platform
- `apps/bidflow` - Vendor/supplier management
- Future apps using CRM functionality

## Code Statistics

| Component | Files | Lines | Status |
|-----------|-------|-------|--------|
| Interfaces | 5 | ~800 | ✅ |
| Attio Lead Manager | 1 | 528 | ✅ |
| Attio Deal Manager | 1 | 578 | ✅ |
| Attio Company Manager | 1 | 522 | ✅ |
| Attio Sync Service | 1 | 345 | ✅ |
| Attio Provider | 1 | 80 | ✅ |
| HubSpot Stubs | 4 | ~200 | ⏳ |
| Factory | 1 | 150 | ✅ |
| Examples | 2 | ~400 | ✅ |
| **Total** | **17** | **~3,600** | **Attio Complete** |

## API Surface

### Factory Methods
```typescript
CRMFactory.create(config)           // Create with config
CRMFactory.createFromEnv(provider)  // Create from env vars
CRMFactory.getSupportedProviders()  // List providers
CRMFactory.isSupported(provider)    // Check support
createAttioCRM(apiKey)              // Convenience function
createHubSpotCRM(apiKey)            // Convenience function
```

### Lead Manager Methods (12)
```typescript
create(data)              // Create lead
getById(id)               // Get by ID
getByEmail(email)         // Get by email
update(id, data)          // Update lead
delete(id)                // Delete lead
list(filter, pagination)  // List with filters
updateStatus(id, status)  // Change status
updateScore(id, score)    // Update score
addTags(id, tags)         // Add tags
removeTags(id, tags)      // Remove tags
convertToDeal(id, data)   // Convert to deal
```

### Deal Manager Methods (13)
```typescript
create(data)                     // Create deal
getById(id)                      // Get by ID
update(id, data)                 // Update deal
delete(id)                       // Delete deal
list(filter, pagination)         // List with filters
updateStage(id, stage)           // Change stage
updatePriority(id, priority)     // Change priority
addTags(id, tags)                // Add tags
removeTags(id, tags)             // Remove tags
getStats(filter)                 // Get statistics
markAsWon(id, date)              // Mark as won
markAsLost(id, reason)           // Mark as lost
```

### Company Manager Methods (11)
```typescript
create(data)                 // Create company
getById(id)                  // Get by ID
getByDomain(domain)          // Get by domain
update(id, data)             // Update company
delete(id)                   // Delete company
list(filter, pagination)     // List with filters
updateStatus(id, status)     // Change status
addTags(id, tags)            // Add tags
removeTags(id, tags)         // Remove tags
getContacts(id)              // Get contacts
getDeals(id)                 // Get deals
enrichByDomain(domain)       // Enrich data
```

### Sync Service Methods (Attio Only)
```typescript
syncAll(objectTypes)         // Full sync
setupWebhook(url, events)    // Configure webhook
handleWebhookEvent(event)    // Process webhook
getSyncStatus()              // Get status
```

## Design Patterns

### Strategy Pattern
- Provider abstraction via ICRMProvider
- Runtime provider switching
- Unified interface across providers

### Factory Pattern
- CRMFactory for provider creation
- Environment-based configuration
- Type-safe provider instantiation

### Repository Pattern
- Separate managers for each entity type
- Consistent CRUD operations
- Filtering and pagination support

## Type Safety

### Enums & Union Types
- LeadStatus (7 values)
- LeadSource (7 values)
- DealStage (6 values)
- DealPriority (4 values)
- CompanyStatus (5 values)
- CompanySize (5 values)
- CompanyIndustry (8 values)
- CRMProviderType (2 values)

### Generic Response Wrapper
```typescript
interface ICRMResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorInfo;
  metadata?: ResponseMetadata;
}
```

## Build Output

After compilation (`pnpm build`):

```
dist/
├── index.js & index.d.ts
├── factory.js & factory.d.ts
├── interfaces/
│   ├── crm-provider.js & .d.ts
│   ├── lead-manager.js & .d.ts
│   ├── deal-manager.js & .d.ts
│   ├── company-manager.js & .d.ts
│   └── index.js & .d.ts
└── providers/
    ├── attio/
    │   ├── lead-manager.js & .d.ts
    │   ├── deal-manager.js & .d.ts
    │   ├── company-manager.js & .d.ts
    │   ├── sync-service.js & .d.ts
    │   └── index.js & .d.ts
    └── hubspot/
        ├── lead-manager.js & .d.ts
        ├── deal-manager.js & .d.ts
        ├── company-manager.js & .d.ts
        └── index.js & .d.ts
```

## Integration Flow

```mermaid
graph TD
    A[App Layer L3] -->|imports| B[@forge/crm]
    B -->|uses| C[CRMFactory]
    C -->|creates| D{Provider}
    D -->|Attio| E[AttioProvider]
    D -->|HubSpot| F[HubSpotProvider]
    E --> G[Attio API]
    F --> H[HubSpot API]

    E --> I[AttioLeadManager]
    E --> J[AttioDealManager]
    E --> K[AttioCompanyManager]
    E --> L[AttioSyncService]
```

## Dependency Graph

```
@forge/crm
    ↓
@forge/types (L0)
```

No circular dependencies, clean dependency tree.

---

**Package**: @forge/crm
**Version**: 1.0.0
**Layer**: L2 Cells
**Status**: ✅ Attio Complete, ⏳ HubSpot Stub
**Created**: 2025-12-24
