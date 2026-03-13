# Vehicle Rental Platform Backend

This is the backend service for the Vehicle Rental Platform, built with Node.js, Express, and **TypeScript**.

> [!IMPORTANT]
> **WSL Compatibility:** If you are using WSL, you must run all `pnpm` and `node` commands inside the **WSL Terminal**. Running these from Windows on a WSL path (`\\wsl.localhost\...`) is known to cause a `panic` in the `pnpm` binary due to filesystem incompatibilities.

## Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Framework:** [Express.js](https://expressjs.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL
- **Build Tool:** `tsc` (TypeScript Compiler)
- **Dev Tool:** `tsx` (for fast execution and hot-load)

## Project Structure

```text
car-rental-be/
├── prisma/             # Database schema and migrations
├── src/                # Source code (TypeScript)
│   ├── index.ts        # Entry point
│   ├── app.ts          # Express application setup
│   ├── routes/         # API routes
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   └── ...
├── dist/               # Compiled JavaScript (after build)
├── tsconfig.json       # TypeScript configuration
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Getting Started (WSL Users)

1. **Open Ubuntu terminal** (or your distro).
2. **Install dependencies:**
   ```bash
   pnpm install
   ```
3. **Setup environment:**
   ```bash
   cp .env.example .env
   ```
4. **Database Migration:**
   ```bash
   pnpm prisma:merge
   pnpm prisma:generate
   ```
5. **Run Development Server:**
   ```bash
   pnpm dev
   ```

## Available Scripts

- `pnpm dev`: Runs the server with `tsx watch` for development (supports TypeScript).
- `pnpm build`: Compiles TypeScript to JavaScript in the `dist/` folder.
- `pnpm start`: Runs the compiled JavaScript from `dist/index.js`.
- `pnpm prisma:generate`: Generates the Prisma Client.
- `pnpm prisma:merge`: Pushes the Prisma schema to the database.

## API Documentation

Interactive API documentation (Swagger UI) is available at:
`http://localhost:5000/api-docs`
