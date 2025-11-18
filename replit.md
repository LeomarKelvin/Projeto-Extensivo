# PedeAí - Plataforma de Delivery Multi-Municipal

## Overview

PedeAí is a functional, full-stack Next.js 14 platform designed for local delivery services across multiple municipalities in Paraíba, Brazil. Its primary purpose is to provide a robust, scalable, and user-friendly delivery ecosystem. The platform supports multi-tenancy, allowing different municipalities to have their own themed interfaces and configurations. Key capabilities include a complete order placement and checkout flow, a comprehensive order management system for shopkeepers, and a **professional admin panel with complete platform management**.

The project's vision is to offer a production-ready MVP for deployment, ensuring financial integrity and exploit-proof security. It aims to streamline local delivery operations, enhance user experience for customers, and provide efficient management tools for businesses. The platform is designed for maintainability and scalability, setting the stage for future expansion and feature enhancements.

## User Preferences

- This project was created entirely with AI (Gemini/ChatGPT).
- The developer has no prior programming experience.
- The focus is on maintainability and scalability.

## System Architecture

**UI/UX Decisions:**
- **Dynamic Theming:** Each municipality (Alagoa Nova, Esperança, Lagoa Seca) has a distinct primary color theme (yellow, cyan, green respectively), with a consistent secondary dark color.
- **Font:** Poppins (weights 300-800) is used throughout the application for a modern and readable interface.
- **ClientLayout:** Injects CSS variables for dynamic theming and manages the overall look and feel.
- **Shared Components:** Components like SimpleHeader, Footer, CartButton, Logo, and LoginForm are designed to be tenant-aware and reusable across municipalities.
- **Admin Panel:** Professional dark mode interface with fixed sidebar navigation and responsive design.

**Technical Implementations:**
- **Next.js 14 Fullstack:** Utilizes the App Router with TypeScript for robust, modern web development.
- **Multi-Tenancy System:** Implemented with dynamic routes (`/[municipio]/*`), TypeScript types for configurations, and helper functions to manage tenant-specific settings (e.g., `getTenantConfig`, `isTenantValid`).
- **Server-Side Rendering (SSR):** Data fetching is primarily done in Server Components using Supabase, passing data as props to Client Components for interactivity. This resolves issues with client-side loading states and ensures faster page loads.
- **State Management:** Currently uses Context API for client-side state like the shopping cart, with plans to integrate Zustand.
- **Authentication:** Integrated login and registration supporting four user types (client, shop, deliveryman, admin), with API routes for user creation and middleware for route protection and automatic redirection based on user profile.
- **Shopping Cart:** Persistent cart managed via Context API and LocalStorage, including minimum order validation and delivery fee calculation.
- **Order Management System for Shopkeepers:**
    - **API:** Provides authenticated endpoints for listing (`/api/loja/pedidos`) and updating (`/api/loja/pedidos/[id]`) orders, with ownership validation.
    - **UI:** A dedicated `/loja/pedidos` page allows shopkeepers to view, filter, and update order statuses with contextual actions.
- **Admin Account System:**
    - A universal admin profile (`admin@pedai.com`) provides full access to platform statistics and the ability to manage all aspects of the platform.
    - Professional admin panel with sidebar navigation and multiple management modules.

**Feature Specifications:**
- **Complete Checkout Flow:** Includes a dynamic shopping cart, a comprehensive checkout page with address forms and payment options (cash, PIX, card), and server-side validation of pricing, quantities, and product ownership.
- **Secure API for Orders:** Ensures financial integrity by fetching prices and calculating totals server-side, validating all incoming data, and implementing atomic transactions with rollback on errors. Supports guest checkout.
- **Database Structure:**
    - **Tables:** `perfis` (user profiles), `lojas` (shops), `produtos` (products), `categorias` (categories), `pedidos` (orders), `pedido_itens` (order items), `configuracoes_plataforma`, `repasses_financeiros`, `auditoria`, `cupons`, `cupons_uso`.
    - **Schema Features:** Foreign keys with appropriate `CASCADE/SET NULL`, indexes for performance, automatic `updated_at` triggers, and validation constraints.
    - **Audit System:** Automatic logging of all critical admin operations with full before/after state tracking.

## External Dependencies

- **Supabase:** Used as the primary backend-as-a-service for database management, authentication, and SSR data fetching (`@supabase/ssr`).
- **Next.js:** The web framework for building the full-stack application.
- **React:** The JavaScript library for building user interfaces.
- **Tailwind CSS:** For utility-first CSS styling with dark mode support.

## Admin System

### Credentials
- **Email:** admin@pedai.com
- **Password:** admin123

### Complete Admin Panel Features

#### 1. **Dashboard** (`/admin/dashboard`)
- Platform-wide KPI overview
- Total shops, orders, customers, and revenue statistics
- Quick access to all management modules
- Visual charts and metrics (coming soon)

#### 2. **User Management** (`/admin/usuarios`)
**Features:**
- Complete user directory with search and filters
- Filter by type (cliente/loja/entregador/admin)
- Filter by status (active/blocked)
- Search by name or email
- View user details and profile information
- Block/unblock users with required reason
- Password reset via Supabase magic link
- Real-time statistics (total, active, blocked)

**Security:**
- Only admins can access
- All actions are audited
- Block reasons are logged

#### 3. **Store Management** (`/admin/lojas`)
**Features:**
- Complete store directory with filters
- Filter by municipality and category
- View pending approval stores
- Approve/reprove new store registrations
- Configure store settings:
  - Delivery fee (taxa_entrega)
  - Platform commission (comissao_plataforma)
  - Operating hours (horario_abertura, horario_fechamento)
  - Delivery radius (raio_entrega_km)
  - Average prep time (tempo_medio_preparo)
- Monitor store status (open/closed)
- View store owner information

**Visual Indicators:**
- Yellow badge for pending approval
- Green badge for approved and open
- Red badge for closed stores

#### 4. **Financial Management** (`/admin/financeiro`)
**Features:**
- Financial dashboard with key metrics:
  - Total revenue
  - Total commissions
  - Pending payments
  - Active stores
- Payment transfer management:
  - View all transfers by store
  - Filter by status (pending/processing/paid)
  - Filter by specific store
  - Filter by period
- Generate new payment periods
- Process payments with confirmation
- Track payment history
- View detailed breakdowns:
  - Gross value (valor_bruto)
  - Platform commission
  - Delivery fees
  - Net value to store

**Actions:**
- Generate transfer for specific period
- Process payment (pending → processing → paid)
- Add notes and observations
- Track payment date

#### 5. **Platform Settings** (`/admin/configuracoes`)
**Features organized in tabs:**

**Tab 1: General Settings**
- Default delivery fee
- Default platform commission
- Default minimum order value
- Default delivery time
- Default delivery radius

**Tab 2: Per Municipality**
- Municipality-specific configurations
- Alagoa Nova settings
- Esperança settings
- Lagoa Seca settings
- Override global defaults per city

**Tab 3: Coupons**
- Create discount coupons
- Coupon types:
  - Percentage discount
  - Fixed value discount
  - Free delivery
- Configure:
  - Coupon code
  - Description
  - Discount value
  - Minimum order value
  - Usage limits
  - Validity period
  - Municipality restriction
  - Category restriction
  - Specific store restriction
- Activate/deactivate coupons
- Track coupon usage

#### 6. **Automatic Audit System**
**Tracked Actions:**
- User blocking/unblocking
- Password resets
- Store approval/reproval
- Store configuration changes
- Payment processing
- Coupon creation/updates
- Configuration changes

**Audit Data Stored:**
- Admin user who performed action
- Timestamp
- Action type
- Entity affected
- Before state (when applicable)
- After state
- IP address (future enhancement)

### Admin Navigation
- Fixed sidebar with logo
- Quick links to all modules:
  - 📊 Dashboard
  - 👥 Usuários
  - 🏪 Lojas
  - 💰 Financeiro
  - ⚙️ Configurações
- User profile in header
- Logout button

### API Endpoints

**User Management:**
- `GET /api/admin/usuarios` - List users with filters
- `PATCH /api/admin/usuarios` - Block/unblock user
- `POST /api/admin/usuarios/resetar-senha` - Send password reset

**Store Management:**
- `GET /api/admin/lojas` - List stores with filters
- `PATCH /api/admin/lojas` - Update store settings
- `POST /api/admin/lojas/aprovar` - Approve/reprove store

**Financial Management:**
- `GET /api/admin/financeiro` - List payment transfers
- `POST /api/admin/financeiro/processar` - Process payment
- `POST /api/admin/financeiro/gerar-repasse` - Generate new transfer period

**Settings:**
- `GET /api/admin/configuracoes` - Get all settings
- `PATCH /api/admin/configuracoes` - Update setting

**Coupons:**
- `GET /api/admin/cupons` - List coupons
- `POST /api/admin/cupons` - Create coupon
- `PATCH /api/admin/cupons` - Update coupon

### Security & Permissions
- All admin APIs validate user type = 'admin'
- Authentication required for all operations
- Shopkeepers can only access their own data
- Admins have universal access
- All critical operations are audited
- No data leakage between permission levels

## Recent Changes

**2025-11-18: Authentication Fix & Header Responsiveness**
- Fixed critical authentication bug in Replit iframe environment:
  - Cookies don't work in iframes due to browser security
  - Implemented localStorage-based session storage for client
  - Modified `/api/auth/get-profile` to accept tokens via Authorization header
  - Updated all dashboard components (Admin, Loja) to send tokens in requests
- Made SimpleHeader component responsive to user login:
  - Shows "Olá, [primeiro nome]" for logged-in clients
  - Shows "Olá, [nome da loja]" for logged-in store owners
  - Adds logout button when user is authenticated
  - Works on both desktop and mobile views
- Created diagnostic `/test-login` page for authentication troubleshooting
- All login flows now work correctly in Replit environment

**2025-11-18: Complete Admin Panel Expansion**
- Extended database schema with:
  - `configuracoes_plataforma` table for platform settings
  - `repasses_financeiros` table for payment tracking
  - `auditoria` table for action logging
  - `cupons` and `cupons_uso` tables for discount management
  - New fields in `perfis` (bloqueado, bloqueado_motivo, bloqueado_em)
  - New fields in `lojas` (aprovada, horarios, raio_entrega_km, comissao_plataforma)
- Created professional AdminLayout with fixed sidebar navigation
- Implemented 4 complete management modules:
  1. User Management with block/unblock and password reset
  2. Store Management with approval workflow and settings
  3. Financial Management with payment tracking and processing
  4. Platform Settings with global and per-municipality config
- Added comprehensive coupon system
- Implemented automatic audit trail for all admin actions
- Created 10+ API endpoints with full security validation
- All components follow dark mode design system
- All APIs include audit logging

**2025-11-17: Admin System with Universal Multi-Shop Access**
- Created admin account in Supabase cloud database
- Implemented AdminDashboard component with shop selector dropdown
- Created dynamic routes for admin shop management (`/admin/loja/[lojaId]/*`)
- Modified APIs to accept `loja_id` parameter for admin users
- Ensured shopkeepers remain restricted to their own shops
