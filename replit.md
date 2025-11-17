# PedeAí - Plataforma de Delivery Multi-Municipal

## Overview

PedeAí is a functional, full-stack Next.js 14 platform designed for local delivery services across multiple municipalities in Paraíba, Brazil. Its primary purpose is to provide a robust, scalable, and user-friendly delivery ecosystem. The platform supports multi-tenancy, allowing different municipalities to have their own themed interfaces and configurations. Key capabilities include a complete order placement and checkout flow, a comprehensive order management system for shopkeepers, and a universal administration panel.

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

**Technical Implementations:**
- **Next.js 14 Fullstack:** Utilizes the App Router with TypeScript for robust, modern web development.
- **Multi-Tenancy System:** Implemented with dynamic routes (`/[municipio]/*`), TypeScript types for configurations, and helper functions to manage tenant-specific settings (e.g., `getTenantConfig`, `isTenantValid`).
- **Server-Side Rendering (SSR):** Data fetching is primarily done in Server Components using Supabase, passing data as props to Client Components for interactivity. This resolves issues with client-side loading states and ensures faster page loads.
- **State Management:** Currently uses Context API for client-side state like the shopping cart, with plans to integrate Zustand.
- **Authentication:** Integrated login and registration supporting three user types (client, shop, deliveryman, admin), with API routes for user creation and middleware for route protection and automatic redirection based on user profile.
- **Shopping Cart:** Persistent cart managed via Context API and LocalStorage, including minimum order validation and delivery fee calculation.
- **Order Management System for Shopkeepers:**
    - **API:** Provides authenticated endpoints for listing (`/api/loja/pedidos`) and updating (`/api/loja/pedidos/[id]`) orders, with ownership validation.
    - **UI:** A dedicated `/loja/pedidos` page allows shopkeepers to view, filter, and update order statuses with contextual actions.
- **Admin Account System:**
    - A universal admin profile (`admin@pedai.com`) provides full access to platform statistics and the ability to manage orders for any shop.
    - An `/admin/dashboard` offers an overview of platform-wide metrics and navigation to shopkeeper and client interfaces.

**Feature Specifications:**
- **Complete Checkout Flow:** Includes a dynamic shopping cart, a comprehensive checkout page with address forms and payment options (cash, PIX, card), and server-side validation of pricing, quantities, and product ownership.
- **Secure API for Orders:** Ensures financial integrity by fetching prices and calculating totals server-side, validating all incoming data, and implementing atomic transactions with rollback on errors. Supports guest checkout.
- **Database Structure:**
    - **Tables:** `perfis` (user profiles), `lojas` (shops), `produtos` (products), `categorias` (categories), `pedidos` (orders), `pedido_itens` (order items).
    - **Schema Features:** Foreign keys with appropriate `CASCADE/SET NULL`, indexes for performance, automatic `updated_at` triggers, and validation constraints.

## External Dependencies

- **Supabase:** Used as the primary backend-as-a-service for database management, authentication, and SSR data fetching (`@supabase/ssr`).
- **Next.js:** The web framework for building the full-stack application.
- **React:** The JavaScript library for building user interfaces.
- **Tailwind CSS:** For utility-first CSS styling.