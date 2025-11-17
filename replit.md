# PedeAí - Local Delivery Platform

## Overview
PedeAí is a comprehensive local delivery application for Alagoa Nova, connecting customers with local stores for fast delivery of food, medicine, shopping, and more. The platform features separate interfaces for customers, store owners, and administrators.

**Current State**: Fully configured and running on Replit with proper environment setup.

## Project Architecture

### Technology Stack
- **Backend**: Node.js with Express.js
- **Frontend**: Static HTML/CSS/JavaScript with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

### Directory Structure
```
.
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── config/      # Supabase client configuration
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/  # Authentication middleware
│   │   └── routes/      # API routes
│   └── package.json
├── frontend/            # Customer & Admin interfaces
│   ├── Clientes/       # Customer pages
│   ├── Admin/          # Admin dashboard
│   └── js/             # Shared JavaScript modules
└── loja-frontend/       # Store owner dashboard
```

### Key Features
1. **Customer Interface** (`/frontend/Clientes/`)
   - Browse stores and products
   - Shopping cart functionality
   - Order tracking
   - User profile management

2. **Store Dashboard** (`/loja-frontend/`)
   - Order management
   - Product catalog management
   - Sales analytics
   - Customer reviews

3. **Admin Panel** (`/frontend/Admin/`)
   - Platform oversight
   - Store approval/management

## Recent Changes (November 17, 2025)

### Replit Setup
1. Configured backend to serve all frontend files on port 5000
2. Updated all API URLs to use `window.location.origin` for environment flexibility
3. Configured Express to bind to `0.0.0.0:5000` for Replit webview compatibility
4. Set up workflow to auto-start the application
5. Configured deployment settings for production

### Configuration Files
- **Port**: Changed from 3000 to 5000 (required for Replit webview)
- **Host**: Configured to bind to `0.0.0.0` instead of localhost
- **Static Files**: Configured Express to serve `/frontend` and `/loja-frontend` directories
- **API Base URLs**: All frontend files updated to use dynamic URLs

## Environment Variables

The following environment variables are configured in `backend/.env`:

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key for client-side operations
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for admin operations
- `PORT`: Server port (5000)
- `NOME_MUNICIPIO`: Target city name ("Alagoa Nova")

**⚠️ SECURITY WARNING**: The current Supabase keys in `backend/.env` were imported from the original repository and should be rotated immediately. The service role key provides admin access to the database and should never be committed to version control. 

**Recommended Actions**:
1. Rotate all Supabase keys in the Supabase dashboard
2. Store new keys in Replit Secrets (not in `.env` file)
3. Update code to read from environment variables provided by Replit

## Running the Application

### Development
The application automatically starts via the configured workflow:
- Command: `cd backend && node src/index.js`
- Accessible at: The Replit webview URL
- Port: 5000

### Deployment
Configured for Replit Autoscale deployment:
- Uses production-ready Express server
- Automatically scales based on traffic
- No build step required (static frontend)

## API Routes

### Public Routes
- `POST /api/perfil/register` - User registration
- `POST /api/perfil/login` - User authentication

### Protected Routes (require authentication)
- `GET /api/perfil` - Get user profile
- `PUT /api/perfil` - Update user profile
- `GET /api/lojas` - List all stores
- `GET /api/pedidos` - Get user orders
- `POST /api/pedidos` - Create new order
- `GET /api/dashboard/loja/*` - Store dashboard endpoints

## User Roles
- **cliente**: Regular customers
- **loja**: Store owners with dashboard access
- **entregador**: Delivery personnel (future feature)

## Development Notes

### Important Considerations
1. **Static File Serving**: The backend serves all frontend files - no separate frontend server needed
2. **CORS**: Configured to accept all origins (`origin: '*'`) for development
3. **Authentication**: Uses Supabase Auth with JWT tokens stored in localStorage
4. **Image Storage**: Uses Supabase Storage for product images

### Known Limitations
- Tailwind CSS loaded via CDN (should be compiled for production)
- No build process for frontend assets
- Authentication redirects assume specific path structure

## Future Improvements
- Implement Tailwind CSS build process
- Add delivery personnel features
- Implement real-time order tracking
- Add payment gateway integration
- Optimize image loading and caching
