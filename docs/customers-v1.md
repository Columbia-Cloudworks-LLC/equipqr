
# Customers v1 (Feature Flagged)

## Overview

The Customers v1 feature introduces basic customer management functionality to EquipQR. This feature is **fully opt-in** and feature-flagged, ensuring no impact on existing team-based workflows.

## Feature Flags

The customers feature requires **both** flags to be enabled:

1. **Global Feature Flag**: Set via `localStorage.setItem('feature_customers', 'true')` in development
2. **Organization Flag**: `organizations.customers_feature_enabled` must be `true` in the database

## Database Schema

### New Tables

- **`customers`**: Core customer information (id, organization_id, name, status)
- **`customer_contacts`**: Links organization members to customers with roles
- **`customer_sites`**: Scaffold for future site management (name, address)

### Schema Changes

- **`equipment.customer_id`**: Optional nullable reference to customers
- **`organizations.customers_feature_enabled`**: Boolean feature toggle

## Security (RLS Policies)

- **Admin-only access**: Only organization admins can manage customers and contacts
- **No external access**: Customer contacts cannot access the system yet (future feature)
- **Existing policies unchanged**: No changes to equipment, work orders, or team policies

## Usage

### Enabling the Feature

1. **Development**: Feature is automatically enabled in development mode
2. **Production**: Set `localStorage.setItem('feature_customers', 'true')` 
3. **Database**: Update organization record: `UPDATE organizations SET customers_feature_enabled = true WHERE id = '<org-id>';`

### Basic Workflow

1. **Create Customers**: Navigate to `/customers` and add customer records
2. **Manage Contacts**: Assign organization members as customer contacts with roles:
   - `customer_viewer`: Read-only access (future)
   - `customer_requestor`: Can create requests (future) 
   - `customer_manager`: Full customer management (future)
3. **Assign Equipment**: When creating/editing equipment, optionally assign to a customer

### Current Functionality

- ✅ Customer CRUD operations
- ✅ Contact management (org members only)
- ✅ Equipment assignment to customers
- ✅ Customer display in equipment details
- ❌ Customer portal access (future)
- ❌ Work order customer linking (future)
- ❌ Multi-team customer servicing (future)

## API Reference

### Customer Service

```typescript
// Get all customers for organization
await customerService.getCustomers(organizationId);

// Create new customer
await customerService.createCustomer(organizationId, {
  name: "Acme Corp",
  status: "active"
});

// Add organization member as customer contact
await customerService.addCustomerContact(customerId, userId, "customer_manager");
```

## Non-Breaking Changes

- **Equipment**: `customer_id` is nullable, defaults to `null`
- **Teams**: All existing team-based functionality unchanged
- **Work Orders**: No changes to creation or assignment flows
- **Permissions**: Existing RLS policies unchanged

## Testing

```bash
# Run customer tests
npm test customers

# Verify feature flag integration
localStorage.setItem('feature_customers', 'true');
# Navigate to /customers in development
```

## Future Enhancements

- Customer portal authentication and access
- Work order customer linkage and scoping  
- Multi-team customer servicing (`equipment_teams`)
- Customer sites and location management
- SLA and contract management
- Customer-specific billing and reporting

## Migration Safety

All migrations are **idempotent** and use:
- `CREATE TABLE IF NOT EXISTS`
- `ADD COLUMN IF NOT EXISTS` 
- `CREATE INDEX IF NOT EXISTS`

Safe to run `supabase db reset` and re-apply all migrations.
