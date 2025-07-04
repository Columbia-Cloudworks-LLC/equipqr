# Refactor Plan - Equipment Management System
**Date**: 2025-07-03T23:26  
**Version**: 1.0  
**Project**: Work Order & Equipment Management System  

## Executive Summary

This document outlines a comprehensive refactoring strategy to improve code maintainability, adherence to SOLID principles, and overall system architecture. The current codebase shows signs of technical debt with mixed architectural patterns, tight coupling, and violation of several SOLID principles.

## Current State Analysis

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Radix UI + shadcn/ui + Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Routing**: React Router DOM

### Key Metrics
- **Services**: 20+ service files (mixed patterns)
- **Components**: 15+ feature directories 
- **Custom Hooks**: 50+ hooks (some overlapping)
- **Context Providers**: 8 contexts (some duplicated)
- **Largest Files**: 
  - `preventativeMaintenanceService.ts` (1,017 lines)
  - `SessionContext.tsx` (362 lines)
  - `EquipmentDetails.tsx` (374 lines)

## SOLID Principles Violations

### 🔴 Single Responsibility Principle (SRP) Violations

#### Critical Issues:
1. **`preventativeMaintenanceService.ts`** (1,017 lines)
   - Contains checklist definitions, CRUD operations, and business logic
   - Mixes data structures with service functions
   - Hard-coded equipment checklists

2. **`SessionContext.tsx`** (362 lines)
   - Manages session state, local storage, organization switching, team management
   - Combines multiple concerns in one context

3. **Large Page Components**
   - `EquipmentDetails.tsx` (374 lines) - UI + business logic + state management

#### Impact: High maintenance cost, difficult testing, unclear responsibilities

### 🔴 Open/Closed Principle (OCP) Violations

#### Critical Issues:
1. **Hard-coded Business Logic**
   - Equipment checklists embedded in service files
   - No extensible checklist system
   - Direct conditional logic for different equipment types

2. **Tight Database Coupling**
   - Services directly import supabase client
   - No abstraction layer for data operations

#### Impact: Difficult to extend functionality, requires code changes for new requirements

### 🔴 Liskov Substitution Principle (LSP) Violations

#### Critical Issues:
1. **Inconsistent Service Interfaces**
   - Some services extend `BaseService`, others are functional
   - Mixed return types and error handling patterns
   - "Optimized" services alongside regular services

2. **Context Provider Inconsistencies**
   - Multiple organization contexts with different interfaces
   - Cannot substitute one organization context for another

#### Impact: Unpredictable behavior, difficult refactoring, inconsistent APIs

### 🔴 Interface Segregation Principle (ISP) Violations

#### Critical Issues:
1. **Fat Interfaces**
   - `SessionContext` exposes too many methods
   - Large service classes with multiple responsibilities
   - Monolithic context interfaces

#### Impact: Unnecessary dependencies, harder to mock/test, violation of concerns

### 🔴 Dependency Inversion Principle (DIP) Violations

#### Critical Issues:
1. **Direct Database Dependencies**
   - All services directly import supabase client
   - High-level business logic depends on low-level database operations
   - No abstraction layer for data access

2. **Concrete Implementation Dependencies**
   - Services coupled to specific Supabase implementation
   - No interfaces for external dependencies

#### Impact: Difficult to test, impossible to swap implementations, tight coupling

## Refactoring Strategy

### Phase 1: Foundation & Infrastructure (4-6 weeks)

#### 1.1 Repository Pattern Implementation
**Priority**: Critical  
**Effort**: 3 weeks  

Create an abstraction layer between business logic and data access:

```typescript
// src/repositories/interfaces/IBaseRepository.ts
interface IBaseRepository<T, K = string> {
  findById(id: K): Promise<Result<T>>;
  findMany(query: QueryParams): Promise<Result<T[]>>;
  create(data: Partial<T>): Promise<Result<T>>;
  update(id: K, data: Partial<T>): Promise<Result<T>>;
  delete(id: K): Promise<Result<boolean>>;
}

// src/repositories/interfaces/IWorkOrderRepository.ts
interface IWorkOrderRepository extends IBaseRepository<WorkOrder> {
  findByEquipmentId(equipmentId: string): Promise<Result<WorkOrder[]>>;
  findByStatus(status: WorkOrderStatus): Promise<Result<WorkOrder[]>>;
  findByAssignee(userId: string): Promise<Result<WorkOrder[]>>;
}

// src/repositories/supabase/SupabaseWorkOrderRepository.ts
class SupabaseWorkOrderRepository implements IWorkOrderRepository {
  constructor(private client: SupabaseClient) {}
  // Implementation...
}
```

**Benefits**:
- Fixes DIP violations
- Enables easy testing with mock repositories
- Allows future database migrations
- Clear separation of concerns

#### 1.2 Service Layer Redesign
**Priority**: Critical  
**Effort**: 2 weeks  

Restructure services to follow consistent patterns:

```typescript
// src/services/interfaces/IWorkOrderService.ts
interface IWorkOrderService {
  getWorkOrder(id: string): Promise<Result<WorkOrderDetails>>;
  createWorkOrder(data: CreateWorkOrderData): Promise<Result<WorkOrder>>;
  updateWorkOrder(id: string, data: UpdateWorkOrderData): Promise<Result<WorkOrder>>;
  assignWorkOrder(id: string, assigneeId: string): Promise<Result<WorkOrder>>;
  changeStatus(id: string, status: WorkOrderStatus): Promise<Result<WorkOrder>>;
}

// src/services/WorkOrderService.ts
class WorkOrderService implements IWorkOrderService {
  constructor(
    private workOrderRepo: IWorkOrderRepository,
    private permissionService: IPermissionService,
    private notificationService: INotificationService
  ) {}
  
  async getWorkOrder(id: string): Promise<Result<WorkOrderDetails>> {
    // Business logic here
  }
}
```

**Benefits**:
- Fixes SRP violations by single-purpose services
- Implements DIP through dependency injection
- Consistent interfaces across services

#### 1.3 Error Handling & Result Pattern
**Priority**: High  
**Effort**: 1 week  

Implement consistent error handling:

```typescript
// src/types/Result.ts
type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: AppError;
};

// src/types/errors.ts
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
  }
}
```

### Phase 2: Business Logic Refactoring (6-8 weeks)

#### 2.1 Domain Model Implementation
**Priority**: Critical  
**Effort**: 3 weeks  

Create proper domain models and business logic:

```typescript
// src/domain/models/WorkOrder.ts
class WorkOrder {
  constructor(
    private props: WorkOrderProps,
    private id?: WorkOrderId
  ) {}

  public assignTo(assigneeId: UserId, assignerId: UserId): Result<void> {
    // Business rules and validation
    if (!this.canBeAssignedBy(assignerId)) {
      return Result.failure('Insufficient permissions');
    }
    
    this.props.assigneeId = assigneeId;
    this.props.assignedAt = new Date();
    this.props.assignedBy = assignerId;
    
    return Result.success();
  }

  public changeStatus(newStatus: WorkOrderStatus, userId: UserId): Result<void> {
    // Status transition rules
  }

  private canBeAssignedBy(userId: UserId): boolean {
    // Permission logic
  }
}
```

#### 2.2 Checklist System Redesign
**Priority**: High  
**Effort**: 3 weeks  

Make checklist system extensible (fixes OCP violation):

```typescript
// src/domain/checklists/ChecklistEngine.ts
interface ChecklistTemplate {
  id: string;
  name: string;
  equipmentType: string;
  sections: ChecklistSection[];
}

interface ChecklistBuilder {
  buildForEquipment(equipmentType: string): ChecklistTemplate;
}

class ChecklistEngine {
  private builders: Map<string, ChecklistBuilder> = new Map();

  registerBuilder(equipmentType: string, builder: ChecklistBuilder): void {
    this.builders.set(equipmentType, builder);
  }

  generateChecklist(equipmentType: string): ChecklistTemplate {
    const builder = this.builders.get(equipmentType);
    if (!builder) {
      throw new Error(`No checklist builder for ${equipmentType}`);
    }
    return builder.buildForEquipment(equipmentType);
  }
}
```

#### 2.3 Permission System Enhancement
**Priority**: High  
**Effort**: 2 weeks  

Improve the existing permission system:

```typescript
// src/services/permissions/PermissionService.ts
interface IPermissionService {
  hasPermission(permission: Permission, context: UserContext, entity?: Entity): Promise<boolean>;
  getPermissions(context: UserContext, entity?: Entity): Promise<Permission[]>;
  checkBulkPermissions(permissions: Permission[], context: UserContext): Promise<PermissionMap>;
}

class PermissionService implements IPermissionService {
  constructor(
    private engine: PermissionEngine,
    private userRepo: IUserRepository,
    private orgRepo: IOrganizationRepository
  ) {}
}
```

### Phase 3: UI & State Management (4-5 weeks)

#### 3.1 Context Consolidation
**Priority**: Medium  
**Effort**: 2 weeks  

Consolidate duplicate contexts and fix ISP violations:

```typescript
// src/contexts/AppContext.tsx - Single context with focused sub-contexts
interface AppContextValue {
  auth: AuthContextValue;
  session: SessionContextValue;
  organization: OrganizationContextValue;
}

// Split responsibilities into focused contexts
// src/contexts/SessionContext.tsx - Only session management
// src/contexts/OrganizationContext.tsx - Only organization data
// src/contexts/PermissionContext.tsx - Only permission checking
```

#### 3.2 Component Decomposition
**Priority**: Medium  
**Effort**: 3 weeks  

Break down large components:

```typescript
// Before: EquipmentDetails.tsx (374 lines)
// After:
// - EquipmentDetailsPage.tsx (orchestration)
// - EquipmentHeader.tsx
// - EquipmentTabs.tsx
// - EquipmentNotesTab.tsx
// - EquipmentMaintenanceTab.tsx
// - EquipmentWorkOrdersTab.tsx
```

### Phase 4: Performance & Testing (3-4 weeks)

#### 4.1 Hook Optimization
**Priority**: Medium  
**Effort**: 2 weeks  

Consolidate and optimize the 50+ custom hooks:

```typescript
// Consolidate similar hooks
// Before: useWorkOrderData, useOptimizedWorkOrders, useEnhancedWorkOrders
// After: useWorkOrders (with options for optimization level)

// Create composable hooks
const useWorkOrderDetails = (id: string) => {
  const workOrder = useWorkOrder(id);
  const permissions = useWorkOrderPermissions(id);
  const history = useWorkOrderHistory(id);
  
  return { workOrder, permissions, history };
};
```

#### 4.2 Testing Infrastructure
**Priority**: High  
**Effort**: 2 weeks  

Set up comprehensive testing:

```typescript
// Unit tests for domain models
// Integration tests for services
// Component tests for UI
// E2E tests for critical workflows
```

## Implementation Timeline

| Phase | Duration | Priority | Dependencies |
|-------|----------|----------|--------------|
| 1.1 Repository Pattern | 3 weeks | Critical | None |
| 1.2 Service Layer | 2 weeks | Critical | 1.1 |
| 1.3 Error Handling | 1 week | High | None |
| 2.1 Domain Models | 3 weeks | Critical | 1.1, 1.2 |
| 2.2 Checklist System | 3 weeks | High | 2.1 |
| 2.3 Permission Enhancement | 2 weeks | High | 1.2 |
| 3.1 Context Consolidation | 2 weeks | Medium | 2.3 |
| 3.2 Component Decomposition | 3 weeks | Medium | 3.1 |
| 4.1 Hook Optimization | 2 weeks | Medium | 3.2 |
| 4.2 Testing Infrastructure | 2 weeks | High | All phases |

**Total Estimated Timeline**: 23-25 weeks (5.7-6.2 months)

## Risk Assessment

### High Risk Items
1. **Database Migration Complexity** - Repository pattern may require data structure changes
2. **Business Logic Dependencies** - Complex relationships between entities
3. **User Impact** - Large refactoring may introduce temporary bugs

### Mitigation Strategies
1. **Incremental Migration** - Implement repository pattern service by service
2. **Feature Flags** - Use flags to gradually roll out refactored components
3. **Parallel Implementation** - Keep old code running while implementing new patterns
4. **Comprehensive Testing** - Test each phase thoroughly before proceeding

## Success Metrics

### Code Quality Metrics
- **Cyclomatic Complexity**: Reduce average from >10 to <5
- **File Size**: No files >300 lines
- **Test Coverage**: Achieve >80% code coverage
- **Dependencies**: Reduce coupling score by 50%

### SOLID Compliance
- ✅ **SRP**: Each class/function has single responsibility
- ✅ **OCP**: Systems extensible without modification
- ✅ **LSP**: Consistent interfaces and substitutability
- ✅ **ISP**: Focused, minimal interfaces
- ✅ **DIP**: Depend on abstractions, not concretions

### Developer Experience
- **Build Time**: Maintain current build performance
- **Developer Onboarding**: Reduce from weeks to days
- **Bug Resolution**: Faster issue isolation and fixing
- **Feature Development**: 50% faster new feature delivery

## Next Steps

1. **Stakeholder Review** - Get approval for timeline and approach
2. **Team Training** - Educate team on SOLID principles and new patterns
3. **Environment Setup** - Prepare testing and staging environments
4. **Phase 1 Kickoff** - Begin with Repository Pattern implementation

## Appendix

### Tools & Libraries to Consider
- **Testing**: Jest, Testing Library, MSW for API mocking
- **Architecture**: Inversion of Control container (Inversify, TSyringe)
- **Code Quality**: ESLint custom rules for SOLID compliance
- **Documentation**: TypeDoc for API documentation

### Recommended Reading
- "Clean Architecture" by Robert C. Martin
- "Refactoring" by Martin Fowler
- "Patterns of Enterprise Application Architecture" by Martin Fowler

---

**Document Owner**: Development Team  
**Review Date**: 2025-07-17  
**Status**: Draft - Pending Approval