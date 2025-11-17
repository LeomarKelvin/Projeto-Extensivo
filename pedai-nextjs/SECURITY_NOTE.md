# Security & Tenant Isolation

## Current Implementation

### Critical Decision: Tenant Isolation in Orders

The current implementation validates that orders are created for lojas that exist, but does NOT enforce that a cliente's profile is bound to a specific municipality.

**Why**: The original database schema does not include a `municipio` column in the `perfis` table for clientes.

**Implications**:
- A cliente from Alagoa Nova CAN theoretically order from a loja in Esperança if they know the loja_id
- This is acceptable if the business model allows cross-municipal ordering
- If strict municipal boundaries are required, the database schema must be updated

## Recommended Future Enhancement

### Add Municipality to User Profiles

```sql
ALTER TABLE perfis 
ADD COLUMN municipio VARCHAR(100);

CREATE INDEX idx_perfis_municipio ON perfis(municipio);
```

Then enforce in API:
1. On POST /api/pedidos: Verify perfil.municipio === loja.municipio
2. On GET /api/lojas: Filter by perfil.municipio
3. Store municipio during registration

### Benefits
- True tenant isolation
- Prevents cross-municipal data access
- Clearer business logic

## Current Safeguards

1. ✅ Authentication required for all orders
2. ✅ Loja existence validated before order creation
3. ✅ Lojas filtered by municipio on storefront
4. ✅ GET /api/pedidos filtered by user role (cliente sees only own orders)
5. ✅ Loja dashboard shows only own orders

## What's Protected

- Users cannot see other users' orders (perfil_id filtering)
- Lojas cannot see other lojas' orders (loja_id filtering)
- Storefront displays only lojas from selected municipio
- Order listing respects user ownership

## What's NOT Protected (by design, pending schema update)

- Cliente can order from any active loja if they construct the cart manually
- This requires technical knowledge and deliberate circumvention
- No UI facilitates cross-municipal ordering
- Business decision: Is this acceptable?
