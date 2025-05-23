
# EquipQR - Fleet Equipment Management System

EquipQR is a comprehensive QR-based asset tracking and management system designed to simplify equipment management across teams and organizations. Built with modern web technologies, it provides powerful tools for tracking, servicing, and managing fleet equipment with controlled cross-organizational collaboration.

## 🚀 Features

### Core Equipment Management
- **QR Code Generation & Scanning**: Automatically generate QR codes for equipment and scan them for quick access
- **Comprehensive Equipment Records**: Track detailed equipment information including specifications, installation dates, warranty periods, and custom attributes
- **Multi-View Interface**: Switch between list and card views for optimal equipment browsing
- **Advanced Filtering**: Filter equipment by status, team assignment, and search across all fields
- **Data Export**: Export equipment data to CSV format for reporting and analysis

### Team & Organization Management
- **Multi-Organization Support**: Manage equipment across different organizations with strict access controls
- **Team-Based Access Control**: Create teams with role-based permissions (Manager, Technician, Viewer)
- **Cross-Organization Collaboration**: Invite members from other organizations to teams while maintaining ownership boundaries
- **Invitation System**: Email-based invitation system for both team and organization membership

### Work Notes & Maintenance
- **Immutable Work Notes**: Technicians can add maintenance notes that cannot be edited after submission
- **Public/Private Notes**: Support for both public and private work notes with role-based visibility
- **Non-Repudiation**: Maintain complete audit trails for compliance and regulatory requirements
- **Real-time Updates**: Live updates to equipment status and work notes across team members

### Security & Permissions
- **Role-Based Access Control**: Granular permissions based on user roles within teams
- **Organization Ownership**: Equipment can only be permanently deleted or modified by the owning organization
- **Team Assignment**: Equipment can be assigned to teams for collaborative management
- **Secure Authentication**: Google OAuth integration with session management

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, utility-first styling
- **shadcn/ui** for consistent, accessible UI components
- **React Router** for client-side routing
- **React Query (TanStack Query)** for data fetching and caching

### Backend & Database
- **Supabase** for backend-as-a-service
- **PostgreSQL** database with Row Level Security (RLS)
- **Edge Functions** for serverless API endpoints
- **Real-time subscriptions** for live data updates

### Additional Libraries
- **React Hook Form** with Zod validation for form management
- **Lucide React** for consistent iconography
- **QRCode.react** for QR code generation
- **date-fns** for date manipulation
- **Recharts** for data visualization

## 🏗 Architecture

### Database Design
- **Organizations**: Top-level entities that own equipment
- **Teams**: Cross-organizational groups with role-based membership
- **Equipment**: Assets owned by organizations, optionally assigned to teams
- **Work Notes**: Immutable maintenance records with privacy controls
- **Invitations**: Email-based invitation system for team/org membership

### Permission Model
- **Organization Level**: Full CRUD operations on owned equipment
- **Team Level**: Role-based access to assigned equipment
- **User Level**: Personal profile and invitation management

### Security Features
- Row Level Security (RLS) policies for data protection
- JWT-based authentication with refresh token rotation
- Cross-Site Request Forgery (CSRF) protection
- Input validation and sanitization

## 📱 Mobile-Ready Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Touch-Friendly Interface**: Mobile-optimized interactions and navigation
- **QR Code Scanning**: Camera integration for equipment scanning
- **Offline Capability**: Basic offline functionality for critical operations
- **Progressive Web App (PWA)**: Install-able web app experience

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git for version control

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env.local`
   - Configure your Supabase project credentials
   - Set up authentication providers (Google OAuth)

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:5173 in your browser
   - Sign up/in to start managing equipment

### Production Deployment

The application can be deployed to any modern hosting platform:

- **Vercel/Netlify**: Automatic deployments from Git
- **Self-hosted**: Static site deployment with environment variables
- **Custom domains**: Configure custom domains via hosting provider

## 📖 User Guide

### Getting Started
1. **Sign Up**: Create an account using Google OAuth or email/password
2. **Create Organization**: Set up your organization profile
3. **Add Equipment**: Start adding your equipment with QR codes
4. **Invite Team Members**: Build your teams and assign roles
5. **Assign Equipment**: Connect equipment to teams for collaborative management

### User Roles

#### Organization Admin
- Full control over organization settings and equipment
- Manage organization-level invitations
- Access to all organization equipment regardless of team assignment

#### Team Manager
- Create and manage teams within their organization
- Invite members from any organization to teams
- Assign/unassign equipment to/from teams
- Edit equipment records assigned to their teams

#### Team Technician
- View all equipment assigned to their teams
- Add both public and private work notes
- Scan QR codes for quick equipment access
- View complete work note history

#### Team Viewer
- Read-only access to team equipment
- View equipment details and public work notes only
- Generate reports and export data

### Key Workflows

#### Equipment Management
1. Add new equipment with basic information
2. Generate and print QR code labels
3. Assign equipment to appropriate teams
4. Track maintenance through work notes
5. Monitor warranty and service schedules

#### Team Collaboration
1. Create teams for specific projects or locations
2. Invite members with appropriate roles
3. Assign relevant equipment to teams
4. Collaborate on maintenance and updates
5. Track team performance and equipment usage

## 🎯 Use Cases

### Fleet Management Companies
- Track vehicle maintenance across multiple service teams
- Manage equipment assignments to different job sites
- Maintain regulatory compliance through immutable work notes

### Construction Companies
- Monitor tool and equipment inventory across projects
- Coordinate equipment sharing between job sites
- Track equipment condition and maintenance schedules

### Facilities Management
- Manage building equipment and systems
- Coordinate maintenance across multiple properties
- Track warranty information and service contracts

### Equipment Rental Businesses
- Track rental equipment location and condition
- Manage maintenance schedules and safety inspections
- Coordinate equipment between different rental locations

## 🔧 Development

### Code Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── services/           # API and business logic
├── contexts/           # React context providers
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── integrations/       # Third-party integrations
```

### Key Patterns
- **Custom Hooks**: Business logic separated into reusable hooks
- **Context Providers**: Global state management for auth, organizations, and teams
- **Service Layer**: API calls and data transformation separated from UI
- **Type Safety**: Comprehensive TypeScript coverage for all data structures

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes with appropriate tests
4. Submit a pull request with detailed description

## 📞 Support

### Documentation
- In-app help and tooltips
- Comprehensive user guides
- API documentation for integrations

### Community
- GitHub Issues for bug reports and feature requests
- Community discussions for best practices
- Regular updates and feature releases

### Enterprise Support
- Priority support for business customers
- Custom integration assistance
- Training and onboarding services

## 📄 License

This project is built with Lovable and follows standard web application licensing practices. See the project settings for specific licensing information.

## 🏢 About

EquipQR is specifically designed for equipment-heavy businesses in Texas and beyond, with a focus on simplifying complex equipment management workflows while maintaining strict security and compliance standards.

**Target Geographic Focus**: Giddings, TX and broader Texas region  
**Primary Industries**: Fleet management, construction, facilities, and logistics  
**Version**: v1.5

---

Built with ❤️ using [Lovable](https://lovable.dev) - The AI-powered web application development platform.
