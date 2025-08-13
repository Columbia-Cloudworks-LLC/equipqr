# CI Testing Reference Guide

## Executive Summary

This document provides comprehensive guidance for writing reliable, type-safe tests in the EquipQR project. It's based on real-world testing challenges and solutions encountered during development, specifically addressing common pitfalls that can cause test failures and waste development resources.

**Key Principles:**
- Always use proper TypeScript types (never `any`)
- Mock Supabase fluent interfaces correctly
- Remove unused variables immediately
- Test error conditions with proper error objects
- Use semantic interfaces for mock data

## Test Architecture Overview

### Technology Stack
- **Testing Framework**: Vitest with React Testing Library
- **Mocking**: vi (Vitest mocking utilities)
- **Database**: Mocked Supabase client
- **Coverage**: V8 provider with 70% thresholds

### Project Structure
```
src/
├── test/
│   ├── setup.ts              # Global test configuration
│   ├── utils/
│   │   ├── TestProviders.tsx  # React context providers for tests
│   │   ├── mock-providers.tsx # Mock context implementations
│   │   ├── mock-supabase.ts   # Supabase client mocking utilities
│   │   ├── renderUtils.tsx    # Custom render function
│   │   └── test-utils.tsx     # Re-exported testing utilities
│   ├── types/
│   │   └── test-types.ts      # Test-specific TypeScript interfaces
│   └── mocks/
│       └── testTypes.ts       # Mock data factories
├── hooks/__tests__/           # Hook-specific tests
├── components/__tests__/      # Component-specific tests
└── services/__tests__/        # Service layer tests
```

## Supabase Mocking Patterns

### Critical Pattern: Fluent Interface Mocking

Supabase uses a fluent interface where methods return the query builder object to enable chaining. This must be mocked correctly:

```typescript
// ✅ CORRECT: Proper fluent interface mock
const createMockChain = () => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    nullsFirst: vi.fn().mockReturnThis(),
    // Terminal methods return promises
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  
  // Ensure all chain methods return the same mock object
  Object.keys(chain).forEach(key => {
    if (key !== 'single' && key !== 'then') {
      chain[key].mockReturnValue(chain);
    }
  });
  
  return chain;
};

// ❌ WRONG: Methods don't return the chain object
const badMock = {
  select: vi.fn(), // Missing .mockReturnThis()
  eq: vi.fn(),     // Will break chaining
};
```

### Response Type Patterns

Always use proper Supabase response interfaces:

```typescript
// ✅ CORRECT: Proper response typing
interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Mock configurations with proper types
const mockListResult: SupabaseResponse<PMTemplate[]> = {
  data: [mockTemplate],
  error: null
};

const mockSingleResult: SupabaseResponse<PMTemplate> = {
  data: mockTemplate,
  error: null
};

const mockErrorResult: SupabaseResponse<null> = {
  data: null,
  error: new Error('Database error')
};

// ❌ WRONG: Using any type
const badMock: any = { data: [], error: null };
```

## TypeScript Best Practices

### 1. Never Use `any` Type

```typescript
// ✅ CORRECT: Proper typing
let mockResult: SupabaseResponse<Equipment[]>;
let mockError: SupabaseResponse<null>;

// ❌ WRONG: Loses type safety
let mockResult: any;
let mockError: any;
```

### 2. Define Proper Interfaces

```typescript
// ✅ CORRECT: Comprehensive interfaces
interface MockEquipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number?: string;
  status: 'active' | 'maintenance' | 'inactive';
  location?: string;
  organization_id: string;
}

// ❌ WRONG: Partial or missing typing
const equipment = {
  id: '1',
  name: 'Test'
  // Missing required fields
};
```

### 3. Remove Unused Variables

```typescript
// ✅ CORRECT: Only declare what you use
let mockListResult: SupabaseResponse<PMTemplate[]>;

beforeEach(() => {
  mockListResult = { data: [mockTemplate], error: null };
});

// ❌ WRONG: Unused declarations
let mockListResult: SupabaseResponse<PMTemplate[]>;
let mockUnusedResult: any; // Declared but never used
```

## Common Pitfalls & Solutions

### 1. Fluent Interface Chain Breaking

**Problem**: Supabase methods return `undefined` instead of the chain object
```typescript
// ❌ WRONG: Chain breaks after first method
mockSupabase.from.mockReturnValue({
  select: vi.fn(), // Returns undefined, breaks .eq()
  eq: vi.fn()
});
```

**Solution**: Ensure all methods return the same chain object
```typescript
// ✅ CORRECT: Chain methods return the chain
const chain = createMockChain();
mockSupabase.from.mockReturnValue(chain);
```

### 2. Promise Resolution Issues

**Problem**: Terminal methods should return promises, not chain objects
```typescript
// ❌ WRONG: Terminal method returns chain
single: vi.fn().mockReturnThis()
```

**Solution**: Terminal methods resolve to data/error objects
```typescript
// ✅ CORRECT: Terminal methods return promises
single: vi.fn().mockResolvedValue({ data: mockData, error: null })
```

### 3. Type Safety Violations

**Problem**: Using `any` type loses compile-time checking
```typescript
// ❌ WRONG: No type checking
const mockResult: any = { data: "wrong type", error: null };
```

**Solution**: Use proper generic interfaces
```typescript
// ✅ CORRECT: Type-safe mock data
const mockResult: SupabaseResponse<Equipment[]> = {
  data: [mockEquipment],
  error: null
};
```

## Testing Patterns by Component Type

### Service Layer Tests

Services interact directly with Supabase and require careful mocking:

```typescript
describe('EquipmentService', () => {
  let mockChain: any;

  beforeEach(() => {
    mockChain = createMockChain();
    mockSupabase.from.mockReturnValue(mockChain);
  });

  test('should fetch equipment list', async () => {
    mockChain.then.mockResolvedValue({
      data: [mockEquipment],
      error: null
    });

    const result = await equipmentService.list('org-1');
    
    expect(mockSupabase.from).toHaveBeenCalledWith('equipment');
    expect(mockChain.select).toHaveBeenCalled();
    expect(mockChain.eq).toHaveBeenCalledWith('organization_id', 'org-1');
    expect(result).toEqual([mockEquipment]);
  });
});
```

### Hook Tests

Hooks require React Query providers and context mocking:

```typescript
describe('useEquipmentForm', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        <MockSessionProvider>
          {children}
        </MockSessionProvider>
      </MockAuthProvider>
    </QueryClientProvider>
  );

  test('should create equipment successfully', async () => {
    const { result } = renderHook(() => useEquipmentForm(), { wrapper });
    
    await act(async () => {
      await result.current.handleSubmit(mockEquipmentData);
    });

    expect(mockCreateEquipment).toHaveBeenCalledWith(mockEquipmentData);
  });
});
```

### Component Tests

Components need full provider context and proper rendering:

```typescript
describe('EquipmentCard', () => {
  test('should display equipment information', () => {
    render(
      <EquipmentCard equipment={mockEquipment} />,
      { wrapper: TestProviders }
    );

    expect(screen.getByText(mockEquipment.name)).toBeInTheDocument();
    expect(screen.getByText(mockEquipment.manufacturer)).toBeInTheDocument();
  });
});
```

## Mock Configuration Guide

### Data Factory Pattern

Create reusable mock data factories:

```typescript
// Mock data factories
export const createMockEquipment = (overrides?: Partial<Equipment>): Equipment => ({
  id: '1',
  name: 'Test Equipment',
  manufacturer: 'Test Manufacturer',
  model: 'Test Model',
  serial_number: 'TEST123',
  status: 'active',
  location: 'Test Location',
  organization_id: 'org-1',
  ...overrides
});

export const createMockWorkOrder = (overrides?: Partial<WorkOrder>): WorkOrder => ({
  id: '1',
  title: 'Test Work Order',
  description: 'Test Description',
  equipment_id: '1',
  status: 'submitted',
  priority: 'medium',
  organization_id: 'org-1',
  ...overrides
});
```

### Context Providers Setup

Establish consistent provider patterns:

```typescript
export const TestProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <MemoryRouter initialEntries={['/']}>
      <QueryClientProvider client={queryClient}>
        <MockAuthProvider>
          <MockSessionProvider>
            <MockUserProvider>
              <MockSimpleOrganizationProvider>
                {children}
              </MockSimpleOrganizationProvider>
            </MockUserProvider>
          </MockSessionProvider>
        </MockAuthProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};
```

## Error Handling in Tests

### Testing Error Conditions

Always test both success and error scenarios:

```typescript
describe('error handling', () => {
  test('should handle database errors gracefully', async () => {
    const mockError = new Error('Database connection failed');
    mockChain.then.mockResolvedValue({
      data: null,
      error: mockError
    });

    await expect(service.fetchData()).rejects.toThrow('Database connection failed');
  });

  test('should handle empty results', async () => {
    mockChain.then.mockResolvedValue({
      data: [],
      error: null
    });

    const result = await service.fetchData();
    expect(result).toEqual([]);
  });
});
```

### Error Object Structure

Use proper error objects that match Supabase's structure:

```typescript
// ✅ CORRECT: Proper error object
const mockError = {
  message: 'Invalid input',
  details: 'Field validation failed',
  hint: 'Check required fields',
  code: '23505'
};

// ❌ WRONG: Simple string error
const badError = 'Something went wrong';
```

## Debugging Failed Tests

### 1. Check Console Output

Look for specific error messages in test output:
```bash
# Common error patterns
FAIL src/services/__tests__/service.test.ts
  TypeError: Cannot read property 'eq' of undefined
  # Solution: Fix fluent interface chain

  ReferenceError: mockResult is not defined
  # Solution: Declare mock variables properly

  TSError: Type 'any' is not assignable to type 'SupabaseResponse<T>'
  # Solution: Use proper TypeScript types
```

### 2. Verify Mock Setup

Ensure mocks are configured before tests run:
```typescript
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();
  
  // Reconfigure mocks
  mockChain = createMockChain();
  mockSupabase.from.mockReturnValue(mockChain);
  
  // Set default return values
  mockListResult = { data: [mockTemplate], error: null };
});
```

### 3. Check Type Definitions

Verify interfaces match actual data structures:
```typescript
// Compare interface with actual data
interface Expected {
  id: string;
  name: string;
  // ... other fields
}

const mockData: Expected = {
  id: '1',
  name: 'Test',
  // Ensure all required fields are present
};
```

## CI/CD Integration

### Vitest Configuration

Ensure proper test configuration in `vitest.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
});
```

### GitHub Actions Workflow

Ensure tests run in CI environment:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run build
```

## Checklist for New Tests

### Before Writing Tests

- [ ] Identify component type (service, hook, or component)
- [ ] Review existing similar tests for patterns
- [ ] Plan mock data requirements
- [ ] Define expected test scenarios (success, error, edge cases)

### During Test Implementation

- [ ] Use proper TypeScript interfaces (no `any`)
- [ ] Configure Supabase mocks with fluent interface support
- [ ] Set up appropriate React providers for context
- [ ] Include both positive and negative test cases
- [ ] Remove any unused variables immediately

### Test Validation

- [ ] Tests pass locally with `npm run test`
- [ ] No TypeScript errors with `npm run type-check`
- [ ] No linting errors with `npm run lint`
- [ ] Coverage thresholds are met
- [ ] All mock objects use proper types

### Common Issues Checklist

- [ ] ✅ Fluent interface methods return `this` (not `undefined`)
- [ ] ✅ Terminal methods return promises with data/error structure
- [ ] ✅ All mock variables are actually used in tests
- [ ] ✅ No `any` types are used anywhere
- [ ] ✅ Error test cases use proper error objects
- [ ] ✅ Mock data matches expected interface structure

## Example Test Template

Use this template for new service tests:

```typescript
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createMockSupabaseClient } from '../../../test/utils/mock-supabase';
import { YourService } from '../yourService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createMockSupabaseClient(),
}));

// Define proper response types
interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

describe('YourService', () => {
  let mockChain: any;
  let mockListResult: SupabaseResponse<YourType[]>;
  let mockSingleResult: SupabaseResponse<YourType>;
  let mockErrorResult: SupabaseResponse<null>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChain = createMockChain();
    mockSupabase.from.mockReturnValue(mockChain);
    
    // Configure default mock responses
    mockListResult = { data: [mockData], error: null };
    mockSingleResult = { data: mockData, error: null };
    mockErrorResult = { data: null, error: new Error('Test error') };
  });

  test('should handle success case', async () => {
    mockChain.then.mockResolvedValue(mockListResult);
    
    const result = await YourService.method();
    
    expect(result).toEqual(mockListResult.data);
  });

  test('should handle error case', async () => {
    mockChain.then.mockResolvedValue(mockErrorResult);
    
    await expect(YourService.method()).rejects.toThrow('Test error');
  });
});
```

## Conclusion

Following these patterns and avoiding the documented pitfalls will ensure reliable, maintainable tests that pass consistently in CI environments. The key is maintaining type safety, proper mock configuration, and comprehensive test coverage while avoiding the specific issues that have caused test failures in the past.

Remember: Tests are code too - they should be clean, typed, and follow the same quality standards as the application code.
