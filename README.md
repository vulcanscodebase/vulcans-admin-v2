# Vulcan Admin Dashboard v2

Admin frontend dashboard for managing pods, users, and admin accounts.

## Features

- **Super Admin Dashboard**: Create pods, manage admins, view all pods
- **Admin Dashboard**: Manage pod-specific users and data
- **Role-based Access**: Different views based on admin role
- **Pod Management**: Create, view, and manage pods
- **User Management**: Add, view, and delete users within pods

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

Update `NEXT_PUBLIC_API_URL` to match your backend URL (default: `http://localhost:5001/api`)

3. Run development server:
```bash
npm run dev
```

The admin dashboard will be available at `http://localhost:3001`

## Project Structure

```
vulcan-admin-v2/
├── app/
│   ├── dashboard/     # Main dashboard page
│   ├── login/         # Admin login page
│   └── layout.tsx      # Root layout
├── components/
│   ├── api/           # API client and endpoints
│   ├── context/       # Admin auth context
│   ├── dashboard/     # Dashboard components
│   └── ui/            # UI components
└── lib/               # Utilities
```

## API Endpoints Used

- `/api/admin/login` - Admin login
- `/api/admin/me` - Get current admin
- `/api/admin/` - Get all admins
- `/api/admin/create-user` - Create admin user
- `/api/pods/create` - Create pod
- `/api/pods/all` - Get all pods
- `/api/pods/:id` - Get pod by ID
- `/api/pods/:id/users` - Get pod users
- `/api/pods/:id/add-user` - Add user to pod
- `/api/pods/:id/users/:userId` - Delete pod user

## Authentication

Admin authentication uses cookies for token management. The API client automatically handles token refresh and authentication.

## Roles

- **Super Admin**: Can create pods, manage all admins, view all pods
- **Admin**: Can only manage their assigned pod and its users

