
# EquipQR - Advanced Fleet Equipment Management Platform

**The Complete QR-Based Asset Tracking Solution for Modern Fleet Operations**

EquipQR is a comprehensive fleet equipment management platform that revolutionizes how organizations track, maintain, and collaborate on equipment across teams and locations. Built with enterprise-grade security and designed for cross-organizational workflows, EquipQR delivers powerful asset management capabilities through an intuitive, mobile-first interface.

**🎯 Serving Equipment-Heavy Industries Across Texas and Beyond**  
*Headquartered in Giddings, TX • Trusted by Construction, Fleet Management, and Logistics Companies*

---

## 🚀 Quick Start for Developers

### Prerequisites

Before setting up EquipQR for development, ensure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase Account** (free tier available at [supabase.com](https://supabase.com))
- **Stripe Account** (for billing features - [stripe.com](https://stripe.com))
- **Mapbox Account** (for map features - [mapbox.com](https://mapbox.com))

### Development Setup

#### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd equipqr

# Install dependencies
npm install
```

#### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your actual values
# See detailed configuration guide below
```

#### 3. Supabase Setup

**Create a Supabase Project:**
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization and create the project
4. Wait for the project to be ready (usually 2-3 minutes)

**Get Your Supabase Credentials:**
1. In your Supabase dashboard, go to **Settings > API**
2. Copy your **Project URL** and **anon public key**
3. Update `.env.local` with these values:
   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

**Update Hardcoded Project References:**
The current codebase has hardcoded Supabase project references that need to be updated:

1. **Update `src/integrations/supabase/client.ts`:**
   ```typescript
   const SUPABASE_URL = "https://your-project-ref.supabase.co";
   const SUPABASE_PUBLISHABLE_KEY = "your_anon_key_here";
   ```

2. **Update `src/utils/auth/authUtils.ts`:**
   ```typescript
   const supabaseUrl = "https://your-project-ref.supabase.co";
   ```

**Configure Authentication:**
1. In Supabase dashboard, go to **Authentication > Providers**
2. Enable **Email** provider (enabled by default)
3. Enable **Google** provider:
   - Add your Google OAuth client ID and secret
   - Add authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`

**Set Up Edge Function Secrets:**
1. Go to **Edge Functions > Manage secrets** in your Supabase dashboard
2. Add the following secrets:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key (sk_test_... for development)
   - `MAPBOX_ACCESS_TOKEN`: Your Mapbox secret access token
   - `OPENAI_API_KEY`: Your OpenAI API key (if using AI features)

#### 4. Stripe Configuration

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. For development, use **test keys** (they start with `pk_test_` and `sk_test_`)
4. Update `.env.local`:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```
5. Add your secret key to Supabase Edge Function secrets (see above)

#### 5. Mapbox Configuration

1. Create a Mapbox account at [mapbox.com](https://mapbox.com)
2. Get your access token from [account.mapbox.com/access-tokens](https://account.mapbox.com/access-tokens/)
3. Update `.env.local`:
   ```bash
   VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
   ```

#### 6. Database Schema Setup

The database schema is automatically applied when you connect to Supabase through the Lovable interface. If you're setting up manually:

1. The migration files are in `supabase/migrations/`
2. Apply them using the Supabase CLI or dashboard
3. Ensure Row Level Security (RLS) policies are enabled

#### 7. Start Development Server

```bash
# Start the development server
npm run dev

# The app will be available at http://localhost:5173
```

### Complete Environment Configuration

Your `.env.local` file should look like this:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

# Mapbox
VITE_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token

# Application URLs
VITE_APP_BASE_URL=http://localhost:5173
VITE_SITE_URL=http://localhost:5173

# Development
NODE_ENV=development
VITE_DEBUG=true
```

---

## 🛠 Troubleshooting

### Common Setup Issues

**"Invalid JWT" or Authentication Errors:**
- Verify your Supabase URL and anon key are correct
- Check that the hardcoded values in the codebase match your project
- Ensure authentication providers are properly configured

**Map Not Loading:**
- Verify your Mapbox access token is valid
- Check browser console for CORS or network errors
- Ensure the token has the required scopes

**Billing Features Not Working:**
- Confirm Stripe publishable key is correct (starts with `pk_test_` for development)
- Verify Stripe secret key is added to Supabase Edge Function secrets
- Check Stripe webhook configuration if testing subscriptions

**Database Connection Issues:**
- Ensure your Supabase project is active and not paused
- Check Row Level Security policies are properly configured
- Verify database migrations have been applied

### Development Tips

1. **Use Browser DevTools:** Check the Console and Network tabs for errors
2. **Supabase Logs:** Monitor real-time logs in your Supabase dashboard
3. **Edge Function Logs:** Check Edge Function logs for backend errors
4. **Test with Different Browsers:** Some features may behave differently across browsers

---

## 🚀 Deployment Considerations

### Production Setup Differences

**Environment Variables:**
- Use production/live API keys instead of test keys
- Update `VITE_APP_BASE_URL` to your production domain
- Set `NODE_ENV=production`

**Supabase Production:**
- Enable database backups
- Configure proper RLS policies
- Set up monitoring and alerts
- Review and tighten security settings

**Domain Configuration:**
- Configure custom domains in Supabase
- Update OAuth provider redirect URLs
- Set up SSL certificates
- Configure CORS settings

**Performance:**
- Enable Supabase CDN
- Configure caching strategies
- Optimize database queries
- Set up monitoring

---

## 📚 Useful Links

### Development Resources
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [React Query Documentation](https://tanstack.com/query/latest)

### Service Dashboards
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Mapbox Account](https://account.mapbox.com)

### API Key Locations
- [Supabase API Settings](https://supabase.com/dashboard/project/_/settings/api)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)
- [Mapbox Access Tokens](https://account.mapbox.com/access-tokens/)

---

## 🎯 Core Platform Features

### **Smart Asset Tracking & QR Technology**
- **Dynamic QR Code Generation**: Automatically generate unique QR codes for every asset with embedded metadata
- **Enhanced Scan Tracking**: Real-time location capture with GPS coordinates, accuracy metrics, and timestamp logging
- **Scan History Analytics**: Complete audit trail of equipment interactions with geographic visualization
- **Mobile-Optimized Scanning**: Camera integration for instant equipment identification and status updates

### **Advanced Equipment Management**
- **Comprehensive Asset Records**: Track specifications, installation dates, warranty periods, serial numbers, and custom attributes
- **Smart Equipment Duplication**: One-click equipment cloning with automatic naming conventions and attribute inheritance
- **Custom Attribute System**: Flexible metadata fields for industry-specific equipment characteristics
- **Multi-View Interface**: Toggle between detailed list view and visual card layout for optimal data consumption
- **Intelligent Filtering**: Advanced search across all fields with status, team, and organization filters

### **Professional Work Order System**
- **Structured Work Order Workflow**: Submit → Accept → Assign → Complete with full status tracking
- **Role-Based Work Order Management**: Differentiated permissions for requestors, technicians, and managers
- **Integrated Work Notes**: Link maintenance notes directly to specific work orders for complete service history
- **Time Tracking Integration**: Automatic hours calculation from linked work notes for accurate billing and reporting
- **Work Order Analytics**: Performance metrics and completion tracking across teams and equipment

### **Enterprise Work Notes & Maintenance**
- **Immutable Maintenance Records**: Technician-submitted notes with non-repudiation for regulatory compliance
- **Dual Visibility System**: Public notes for team collaboration, private notes for sensitive information
- **Role-Aware Note Management**: Permissions-based note creation, viewing, and editing capabilities
- **Hours Tracking Integration**: Built-in time logging for maintenance activities and service calls
- **Maintenance History**: Complete chronological record of all equipment service activities

### **Sophisticated Location Management**
- **Multi-Source Location Tracking**: Manual location entry, GPS-based scanning, and coordinate-based positioning
- **Location Override System**: Toggle between automatic scan-based updates and manual location control
- **Fleet Mapping Dashboard**: Interactive map visualization of equipment locations with real-time updates
- **Geographic Analytics**: Location-based reporting and equipment distribution insights
- **Accuracy Metrics**: GPS precision tracking for reliable location data

### **Advanced Team & Organization Management**
- **Cross-Organizational Collaboration**: Invite members from external organizations while maintaining strict ownership boundaries
- **Hierarchical Role System**: Owner → Manager → Technician → Requestor → Viewer with granular permissions
- **Team-Based Equipment Assignment**: Flexible equipment-to-team relationships with automatic access inheritance
- **Organization Ownership Model**: Clear equipment ownership with delegation capabilities through team assignments
- **Advanced Invitation System**: Email-based invitations with role-specific onboarding workflows

---

## 🛠 Technology Stack & Architecture

### **Frontend Excellence**
- **React 18** with TypeScript for type-safe, scalable development
- **Vite** for lightning-fast development and optimized production builds
- **Tailwind CSS** with **shadcn/ui** for consistent, accessible design system
- **React Query (TanStack Query)** for intelligent data fetching, caching, and synchronization
- **React Hook Form** with Zod validation for robust form management
- **React Router** for seamless client-side navigation

### **Backend & Database**
- **Supabase** backend-as-a-service with PostgreSQL database
- **Row Level Security (RLS)** for data protection and multi-tenancy
- **Edge Functions** for serverless API endpoints and business logic
- **Real-time Subscriptions** for live data updates across teams
- **Advanced Query Optimization** with intelligent caching strategies

### **Mobile & Progressive Features**
- **Progressive Web App (PWA)** capabilities for offline functionality
- **Responsive Design** optimized for desktop, tablet, and mobile workflows
- **Camera Integration** for QR code scanning and equipment photography
- **Touch-Friendly Interface** designed for field technician workflows
- **Offline Capabilities** for critical operations in low-connectivity environments

### **Enterprise Integration**
- **Google OAuth** with multi-factor authentication support
- **CSV Export/Import** for data migration and reporting
- **RESTful APIs** for third-party system integration
- **Audit Logging** for compliance and regulatory requirements
- **Backup & Recovery** with point-in-time restoration capabilities

---

## 🎯 Industry Applications & Use Cases

### **Fleet Management Excellence**
- **Vehicle Maintenance Coordination**: Track service schedules across multiple service teams and locations
- **Equipment Assignment Optimization**: Manage tool and equipment distribution between job sites
- **Regulatory Compliance**: Maintain DOT logs and inspection records with immutable audit trails
- **Cross-Location Collaboration**: Coordinate equipment sharing between facilities and service centers

### **Construction & Heavy Equipment**
- **Job Site Equipment Management**: Monitor tool inventory and equipment status across active projects
- **Maintenance Schedule Coordination**: Proactive equipment servicing with team-based responsibility assignment
- **Safety Compliance Tracking**: Equipment inspection records and safety certification management
- **Project-Based Equipment Allocation**: Dynamic equipment assignment based on project requirements

### **Facilities & Property Management**
- **Building Systems Management**: Track HVAC, electrical, and mechanical equipment across properties
- **Maintenance Team Coordination**: Assign equipment responsibility to specialized maintenance teams
- **Warranty & Service Contract Tracking**: Monitor equipment warranties and service agreement compliance
- **Vendor Management**: Coordinate external service providers with internal maintenance teams

### **Equipment Rental Operations**
- **Rental Fleet Tracking**: Monitor equipment location, condition, and availability in real-time
- **Customer Equipment Assignment**: Track which equipment is assigned to specific rental customers
- **Maintenance Scheduling**: Coordinate equipment servicing between rental periods
- **Multi-Location Inventory**: Manage equipment across multiple rental locations and service centers

---

## 👥 Advanced User Roles & Permissions

### **Organization Owner**
- **Complete Platform Control**: Full access to organization settings, billing, and member management
- **Equipment Ownership**: Create, modify, and delete any equipment within the organization
- **Team Management**: Create teams, assign managers, and oversee cross-organizational collaborations
- **Data Export & Analytics**: Access to comprehensive reporting and data export capabilities

### **Team Manager**
- **Team Leadership**: Create teams, invite members, and manage team-specific equipment assignments
- **Equipment Assignment**: Assign organization equipment to teams and manage team-based access
- **Work Order Management**: Accept, assign, and track work orders for team-assigned equipment
- **Member Coordination**: Manage team member roles and responsibilities within assigned teams

### **Field Technician**
- **Comprehensive Equipment Access**: View all equipment details and complete maintenance history
- **Work Note Management**: Create both public and private maintenance notes with time tracking
- **Work Order Execution**: Accept assigned work orders and update completion status
- **Mobile-First Workflow**: Optimized mobile interface for field-based equipment management

### **Equipment Requestor**
- **Work Order Submission**: Submit maintenance requests and track work order progress
- **Public Communication**: Create public work notes visible to entire maintenance team
- **Equipment Monitoring**: View equipment status and public maintenance history
- **Limited Write Access**: Focus on reporting issues rather than performing maintenance

### **Viewer/Observer**
- **Read-Only Access**: View equipment details and public maintenance records
- **Reporting Capabilities**: Generate reports and export data for analysis
- **Dashboard Access**: Monitor team equipment status and maintenance trends
- **No Modification Rights**: Cannot create, edit, or delete equipment or maintenance records

---

## 🔄 Key Operational Workflows

### **Equipment Lifecycle Management**
1. **Asset Registration**: Create equipment records with comprehensive metadata and custom attributes
2. **QR Code Generation**: Generate and print QR codes for physical asset tagging
3. **Team Assignment**: Assign equipment to appropriate teams based on location or function
4. **Ongoing Maintenance**: Track service history through work orders and maintenance notes
5. **Lifecycle Analytics**: Monitor equipment performance, maintenance costs, and replacement timing

### **Collaborative Maintenance Workflow**
1. **Issue Identification**: Requestors submit work orders for equipment requiring attention
2. **Work Assignment**: Managers review, accept, and assign work orders to qualified technicians
3. **Service Execution**: Technicians complete work and document activities through integrated work notes
4. **Quality Assurance**: Managers review completed work and update equipment status
5. **Performance Analysis**: Track team performance, maintenance costs, and equipment reliability

### **Cross-Organizational Collaboration**
1. **Partnership Setup**: Organizations invite external teams to collaborate on shared equipment
2. **Role Assignment**: External team members receive appropriate roles based on collaboration scope
3. **Equipment Access**: External teams gain access to specifically assigned equipment only
4. **Boundary Maintenance**: Ownership boundaries remain intact while enabling collaboration
5. **Audit & Compliance**: Complete audit trail maintained across organizational boundaries

---

## 🏗 Technical Architecture Overview

### **Database Design Philosophy**
- **Multi-Tenant Architecture**: Organization-scoped data with cross-organizational team capabilities
- **Immutable Audit Trails**: Non-repudiation maintenance records for regulatory compliance
- **Flexible Attribute System**: Custom metadata support for industry-specific equipment characteristics
- **Optimized Query Performance**: Strategic indexing and caching for real-time data access

### **Security & Compliance Framework**
- **Row Level Security (RLS)**: Database-level access control preventing unauthorized data access
- **JWT Authentication**: Secure session management with refresh token rotation
- **Cross-Site Protection**: CSRF protection and input validation throughout the platform
- **Audit Logging**: Comprehensive activity logging for compliance and security monitoring

### **Performance & Scalability**
- **Intelligent Caching**: Multi-layer caching strategy with automatic cache invalidation
- **Optimized Database Queries**: Strategic query optimization for large equipment datasets
- **Edge Function Processing**: Serverless architecture for scalable business logic execution
- **Real-Time Updates**: Efficient WebSocket connections for live data synchronization

---

## 📊 Advanced Features & Capabilities

### **Analytics & Reporting**
- **Equipment Utilization Metrics**: Track equipment usage patterns and optimization opportunities
- **Maintenance Cost Analysis**: Monitor maintenance expenses across teams and equipment categories
- **Team Performance Dashboards**: Analyze team productivity and work order completion rates
- **Predictive Maintenance Insights**: Identify equipment requiring proactive maintenance attention

### **Integration Capabilities**
- **CSV Data Exchange**: Import/export equipment data for integration with existing systems
- **RESTful API Access**: Programmatic access for custom integrations and reporting tools
- **Webhook Support**: Real-time notifications for external system synchronization
- **Third-Party Authentication**: Support for enterprise SSO and directory integration

### **Mobile Excellence**
- **Offline Functionality**: Core operations available without internet connectivity
- **Camera Integration**: Direct QR code scanning and equipment photography
- **GPS Location Services**: Automatic location capture during equipment interactions
- **Touch-Optimized Interface**: Designed specifically for mobile field operations

---

## 🏢 About EquipQR

**Transforming Equipment Management for Texas Businesses and Beyond**

EquipQR was specifically designed for equipment-heavy industries across Texas, with deep roots in Giddings, TX. Our platform addresses the unique challenges faced by construction, fleet management, and logistics companies operating across multiple locations with diverse teams.

**Our Mission**: Simplify complex equipment management workflows while maintaining enterprise-grade security and compliance standards.

**Core Values**:
- **Simplicity**: Complex operations made simple through intuitive design
- **Security**: Enterprise-grade security without compromising usability  
- **Collaboration**: Breaking down silos while maintaining organizational boundaries
- **Compliance**: Built-in audit trails and regulatory compliance features

**Geographic Focus**: Giddings, TX and broader Texas region  
**Target Industries**: Fleet management, construction, facilities management, and logistics  
**Platform Version**: v2.0 - Advanced Fleet Management Edition

---

## 📞 Support & Community

### **Documentation & Resources**
- **Comprehensive User Guides**: Step-by-step documentation for all platform features
- **API Documentation**: Complete reference for developers and integrators
- **Video Training Library**: Visual tutorials for common workflows and advanced features
- **Best Practices Guide**: Industry-specific recommendations for optimal platform usage

### **Community & Support**
- **GitHub Issues**: Bug reports, feature requests, and community discussions
- **Email Support**: Direct support for technical assistance and platform guidance
- **Training Services**: Custom onboarding and training for enterprise customers
- **Integration Consulting**: Professional services for complex deployment scenarios

### **Enterprise Services**
- **Priority Support**: Dedicated support channels for business customers
- **Custom Development**: Tailored features and integrations for enterprise requirements
- **Training & Onboarding**: Comprehensive team training and change management support
- **Compliance Consulting**: Regulatory compliance guidance and audit preparation

---

## 📄 Legal & Licensing

This project is built with modern web technologies and follows industry-standard security practices. Detailed licensing information and terms of service are available in the project settings.

**Data Protection**: GDPR-compliant data handling with user control over personal information  
**Security Standards**: SOC 2 Type II compliance with regular security audits  
**Availability**: 99.9% uptime SLA with redundant infrastructure and disaster recovery

---

*Built with ❤️ using [Lovable](https://lovable.dev) - The AI-powered web application development platform*

**EquipQR v2.0** - Advanced Fleet Equipment Management Platform  
*Empowering Texas businesses with intelligent asset tracking and collaborative maintenance workflows*
