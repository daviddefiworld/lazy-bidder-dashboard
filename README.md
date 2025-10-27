# LazyBidder Dashboard

A modern web application with authentication features built using React, TypeScript, Vite, and Tailwind CSS.

## Features

- 🔐 **Authentication System**
  - User login with email and password
  - User registration with form validation
  - Protected routes and authentication guards
  - Persistent login sessions using localStorage

- 🎨 **Modern UI**
  - Responsive design with Tailwind CSS
  - Clean and intuitive user interface
  - Form validation with React Hook Form and Zod
  - Loading states and error handling

- 🛡️ **Type Safety**
  - Full TypeScript support
  - Type-safe authentication context
  - Form validation schemas

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context API
- **Package Manager**: Yarn

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable components
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   └── DashboardPage.tsx
├── types/              # TypeScript type definitions
│   └── auth.ts
├── App.tsx             # Main app component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Authentication Flow

1. **Login/Signup**: Users can authenticate via the login or signup pages
2. **Protected Routes**: Authenticated users can access the dashboard
3. **Session Management**: User sessions are persisted in localStorage
4. **Automatic Redirects**: Unauthenticated users are redirected to login

## Development Notes

- The authentication system uses mock data for demonstration purposes
- In a production environment, you would integrate with a real authentication API
- Form validation is handled by Zod schemas for type safety
- The app follows React best practices with functional components and hooks

## License

This project is licensed under the MIT License.
