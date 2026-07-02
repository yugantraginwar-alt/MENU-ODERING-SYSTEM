# Premium SaaS Restaurant QR Ordering System

An enterprise-grade, high-performance contactless dining and restaurant management system. This application is structured as a modern monorepo using npm workspaces.

## Repository Architecture

The project has been reorganized into a scalable, domain-driven structure:

```
QR-Ordering-System/
├── frontend/                     # Next.js Client Application
│   ├── public/                   # Static public assets
│   └── src/
│       ├── app/                  # Next.js App Router (pages & layouts)
│       ├── components/           # Reusable UI components
│       ├── store/                # State management and React Contexts
│       ├── styles/               # Global styling (Tailwind CSS)
│       └── {hooks, services, lib, utils, assets, types, constants, middleware, config}  # Scalable directories
├── backend/                      # Node.js Express Backend API
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   ├── middleware/           # Express middlewares (JWT auth, role checks)
│   │   ├── config/               # Prisma database client initializer
│   │   └── prisma/               # Prisma ORM setup (schema, seed, dev SQLite DB)
│   │   └── {routes, services, repositories, models, validators, types, constants, sockets, uploads, logs}  # Scalable directories
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── resources/                    # Unified folder for media, docs, design assets
│   ├── docs/                     # Design docs and guides
│   ├── design/                   # Brand logos, font files, and icons
│   └── screenshots/              # Application previews
├── deployment/                   # Server, container, and CI/CD settings
│   ├── docker/
│   ├── nginx/
│   ├── vercel/
│   ├── render/
│   └── github-actions/
├── README.md                     # Project documentation
├── .gitignore                    # Global git ignore configuration
└── package.json                  # Root npm workspaces configuration
```

## Tech Stack
- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, Lucide React icons, Tailwind CSS 4.
- **Backend**: Node.js, Express, Socket.io (real-time bidirection syncing).
- **Database**: SQLite with Prisma ORM.

---

## Local Development Setup

### 1. Installation
Install all dependencies for both the `frontend` and `backend` workspaces simultaneously by running the following command in the project root:
```bash
npm install
```

### 2. Database Generation
Generate the local Prisma Client inside the backend workspace:
```bash
npm run prisma:generate --workspace=backend
```

### 3. Running the System Locally
Boot both the backend server and frontend development server concurrently from the root directory:
```bash
npm run dev
```

The services will be hosted at:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## Workspace Script Command Routes

Use the following commands from the root directory to interact with individual workspaces:

| Action | Root Script | Workspace equivalent |
|---|---|---|
| **Concurrently Run Dev** | `npm run dev` | Runs dev script for both frontend and backend |
| **Build Frontend** | `npm run build:frontend` | `npm run build --workspace=frontend` |
| **Build Backend** | `npm run build:backend` | `npm run build --workspace=backend` |
| **Build All** | `npm run build` | Builds both backend and frontend |
| **Prisma Generate** | - | `npm run prisma:generate --workspace=backend` |
| **Prisma Migrate** | - | `npm run prisma:migrate --workspace=backend` |
| **Prisma Seed** | - | `npm run prisma:seed --workspace=backend` |
