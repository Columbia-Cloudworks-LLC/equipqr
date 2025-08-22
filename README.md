# EquipQR - Fleet Equipment Management Platform

A comprehensive fleet equipment management platform built with React, TypeScript, and modern web technologies.

## 🚀 Features

- **Equipment Tracking**: QR code integration for quick equipment access
- **Work Order Management**: Create, assign, and track maintenance work orders
- **Team Management**: Organize teams and assign responsibilities
- **Fleet Visualization**: Interactive maps for equipment location tracking
- **Real-time Updates**: Live tracking and notifications

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Database, Storage)
- **State Management**: TanStack Query
- **Testing**: Vitest, React Testing Library
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- Node.js 18.x or 20.x
- npm or yarn
- Supabase account and project

## 🏗️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd equipqr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

Optional environment variables:
- `VITE_STRIPE_PUBLISHABLE_KEY`: For billing features
- `VITE_GOOGLE_MAPS_API_KEY`: For fleet map functionality

4. Start the development server:
```bash
npm run dev
```

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Test Coverage

The project maintains a minimum test coverage threshold of 70% across:
- Lines
- Functions  
- Branches
- Statements

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage

### Code Quality

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Vitest** for unit testing
- **React Testing Library** for component testing

## 🚀 CI/CD

The project includes GitHub Actions workflows for:

### Pull Request Testing (`pr-tests.yml`)
- **Multi-Node Testing**: Tests against Node.js 18.x and 20.x
- **Code Quality**: ESLint and TypeScript checks
- **Test Coverage**: Runs tests with coverage reporting
- **Security Audits**: Checks for package vulnerabilities
- **Build Validation**: Ensures the application builds successfully
- **Quality Gates**: Enforces coverage thresholds and build size limits

### Workflow Triggers
- Pull requests to `main` or `develop` branches
- Direct pushes to `main` or `develop` branches

### Required GitHub Secrets
Add these secrets to your GitHub repository:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── equipment/      # Equipment-specific components
│   ├── work-orders/    # Work order components
│   └── teams/          # Team management components
├── pages/              # Main application pages
├── hooks/              # Custom React hooks
├── services/           # API service layers
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── test/               # Test utilities and setup
```

## 🔒 Security

- Row Level Security (RLS) policies for data isolation
- Authentication via Supabase Auth
- Input validation with Zod schemas
- Regular security audits in CI pipeline

## 📖 Documentation

- [Features Overview](./docs/features.md)
- [Technical Guide](./docs/technical-guide.md)
- [Deployment Guide](./docs/deployment.md)
- [Work Order Workflow](./docs/work-order-workflow.md)
- [Database Migrations](./docs/database-migrations.md)
- [CI Testing Guide](./docs/ci-testing-reference.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm run test`
5. Run the linter: `npm run lint`
6. Commit your changes: `git commit -m 'Add your feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Open a pull request

### Pull Request Guidelines

- All tests must pass
- Code coverage must meet the 70% threshold
- No high-severity security vulnerabilities
- Build size must not exceed 10MB
- Follow the existing code style and conventions

## 📄 License

Copyright © 2024 Columbia Cloudworks LLC. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the troubleshooting guide

## 🎯 Roadmap

- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] IoT sensor integration
- [ ] Predictive maintenance algorithms
- [ ] API integrations with external ERP systems