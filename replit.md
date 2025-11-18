# PedeAí - Plataforma de Delivery Multi-Municipal

## Overview

PedeAí is a full-stack Next.js 14 platform for local delivery services across multiple municipalities in Paraíba, Brazil. It supports multi-tenancy with dynamic theming and configurations for each municipality. The platform features a complete order placement and checkout flow, a comprehensive order management system for shopkeepers, and a professional admin panel for full platform management. The project's vision is to deliver a production-ready, scalable, and secure MVP that streamlines local delivery operations and provides efficient tools for businesses, enhancing user experience and ensuring financial integrity.

## User Preferences

- This project was created entirely with AI (Gemini/ChatGPT).
- The developer has no prior programming experience.
- The focus is on maintainability and scalability.

## System Architecture

**UI/UX Decisions:**
- **Dynamic Theming:** Distinct primary color themes for each municipality (Alagoa Nova: yellow, Esperança: cyan, Lagoa Seca: green), with a consistent secondary dark color.
- **Font:** Poppins (weights 300-800) for a modern and readable interface.
- **Shared Components:** Reusable, tenant-aware components like SimpleHeader, Footer, CartButton, Logo, and LoginForm.
- **Admin Panel:** Professional dark mode interface with fixed sidebar navigation and responsive design.

**Technical Implementations:**
- **Next.js 14 Fullstack:** Utilizes the App Router with TypeScript.
- **Multi-Tenancy System:** Implemented with dynamic routes (`/[municipio]/*`), TypeScript types, and helper functions for tenant-specific settings.
- **Server-Side Rendering (SSR):** Primarily uses Server Components with Supabase for data fetching, passing data to Client Components for interactivity.
- **State Management:** Currently uses Context API for client-side state (e.g., shopping cart), with plans for Zustand integration.
- **Authentication:** Supports four user types (client, shop, deliveryman, admin) with API routes for user creation and middleware for route protection. Session storage uses localStorage + Authorization Bearer tokens (optimized for Replit's iframe environment where third-party cookies are blocked). API endpoints accept both Bearer tokens and cookies for flexibility.
- **Shopping Cart:** Persistent cart via Context API and LocalStorage, including minimum order validation and delivery fee calculation.
- **Order Management System for Shopkeepers:** Authenticated API endpoints and a dedicated UI page (`/loja/pedidos`) for viewing, filtering, and updating order statuses.
- **Admin Account System:** A universal admin profile provides full access to platform statistics and comprehensive management modules via a professional admin panel. Default credentials: `admin@pedai.com` / `admin123`.

**Feature Specifications:**
- **Complete Checkout Flow:** Dynamic shopping cart, checkout page with address forms and payment options (cash, PIX, card), and server-side validation.
- **Secure API for Orders:** Ensures financial integrity with server-side price calculation, data validation, and atomic transactions. Supports guest checkout.
- **Database Structure:** Includes tables for `perfis`, `lojas`, `produtos`, `pedidos`, `pedido_itens`, `configuracoes_plataforma`, `repasses_financeiros`, `auditoria`, and `cupons`. Features foreign keys, indexes, automatic `updated_at` triggers, and validation constraints.
- **Audit System:** Automatic logging of critical admin operations with full before/after state tracking.
- **Municipality-Based User Segmentation:** User registration includes municipality field with server-side validation and auto-detection based on URL.

## External Dependencies

- **Supabase:** Backend-as-a-service for database management, authentication, and SSR data fetching (`@supabase/ssr`).
- **Next.js:** Web framework for the full-stack application.
- **React:** JavaScript library for building user interfaces.
- **Tailwind CSS:** Utility-first CSS styling framework with dark mode support.