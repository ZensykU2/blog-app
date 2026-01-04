# Blog App

A modern, high-performance blog application built with the T3 Stack, featuring a rich text editor, robust authentication, and a sleek, responsive design.

## 🚀 Vision & Goal

This repository aims to provide a full-featured blogging platform that balances developer experience with end-user performance. It's designed for writers who need a powerful markdown-based editor and readers who value a clean, fast-loading experience.

## 🛠️ Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org) - React framework with Turbopack.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Static type checking for safer code.
- **Database & ORM:** [Drizzle ORM](https://orm.drizzle.team/) + [PostgreSQL](https://www.postgresql.org/) - Type-safe database interactions.
- **Authentication:** [Auth.js (NextAuth v5)](https://authjs.dev/) - Flexible and secure authentication.
- **API Layer:** [tRPC](https://trpc.io/) - End-to-end type-safe APIs.
- **Validation:** [Zod 4](https://zod.dev) - Schema-first validation.
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) - Utility-first CSS framework.
- **State Management:** [TanStack Query](https://tanstack.com/query) - Asynchronous state management.
- **Editor:** Custom Markdown editor with live preview and formatting toolbar.
- **Images:** [React Easy Crop](https://github.com/ValentinH/react-easy-crop) for profile/post image handling.

## ✨ Core Features

- **Rich Markdown Editor:** Intuitive writing experience with live preview, syntax highlighting, and easy formatting via toolbar.
- **User Authentication:** Secure login via Google/GitHub OAuth or email/password.
- **Profile Management:** Customizable user profiles with banners, avatars (including cropping), and bios.
- **Engagement:** Like posts, bookmark for later, and participate in threaded conversations (planned).
- **Social Features:** Follow authors and receive notifications for interactions.
- **Performance Optimized:** Leveraging Next.js 15 features like `force-dynamic` for real-time updates where needed.
- **Responsive Design:** Mobile-first approach ensuring a great experience on all devices.

## 📂 Project Structure

```text
src/
├── app/             # Next.js App Router pages and layouts
│   ├── _components/ # Reusable UI components (Posts, Shared, Profile, etc.)
│   ├── api/         # Route handlers for auth and other APIs
│   └── (routes)     # Main application pages
├── server/          # Backend logic
│   ├── api/         # tRPC router and procedure definitions
│   ├── db/          # Database schema and client initialization
│   └── auth.ts      # Authentication configuration
├── styles/          # Global styles (Tailwind)
└── trpc/            # tRPC client and server utilities
```

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/)
- A PostgreSQL instance (local or hosted like Supabase/Neon)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up your environment variables:
   - Copy `.env.example` to `.env`.
   - Fill in your database URL, auth secrets, and OAuth provider credentials.

4. Initialize the database:
   ```bash
   pnpm db:push
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## 📜 Available Scripts

- `pnpm dev` - Start development server.
- `pnpm build` - Build for production.
- `pnpm lint` - Run ESLint checks.
- `pnpm check` - Run linting and type checking.
- `pnpm db:generate` - Generate Drizzle migrations.
- `pnpm db:push` - Push schema changes directly to the database.
- `pnpm db:studio` - Open Drizzle Studio to manage data.
- `pnpm format:write` - Format code with Prettier.

## 🛡️ Linting & Quality

This project uses **Vercel's Style Guide** for ESLint and Prettier to ensure consistent code quality and catch common errors early.
