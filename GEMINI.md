# Context

- Webflow designer extension app used for linting Webflow projects.
- Uses Webflow Designer API.
- Feature Sliced Design pattern with a heavy emphasis on Domain Driven Design with clear. separation of concerns and single point for source of truths.
- Full type safety using Typescript with proper error handling.

# Standards

- Utilize Feature Sliced Design
- Proper error handling
- End-to-end type safety using best practice Typescript.
- Single source of truth with no redundant code to prioritize maintanability and scalability.
- Prefer modern product design conventions.
- Follow dimension constraints of the extension.
  – Use of shad/cn tokens for all colors and themes

# Building and Running

## Development

To run the project in development mode, use the following command:

```bash
pnpm run dev
```

This will start the Vite development server.

## Production Build

To build the project for production, use the following command:

```bash
pnpm run build:prod
```

This will create a production-ready bundle in the `bundle/prod` directory.

## Development Build

To build the project for development, use the following command:

```bash
pnpm run build:dev
```

This will create a development bundle in the `bundle/development` directory.

# Testing

The project uses `vitest` for testing. The following scripts are available for running tests:

- `pnpm test`: Run all tests.
- `pnpm test:run`: Run all tests once.
- `pnpm test:watch`: Run tests in watch mode.
- `pnpm test:structure`: Run tests for the Lumos structure rules.
- `pnpm test:class-order`: Run tests for the class order element.

# Development Conventions

- The project uses ESLint for linting. Run `pnpm run lint` to check for linting errors.
- The project follows the Feature-Sliced Design (FSD) architecture, as indicated by the directory structure (`src/features`, `src/entities`, `src/shared`).
- The project has a strict domain driven design approach
- The project is fully typed with proper error handling
- The project uses factory functions
- The project uses modern 2025 development best-practices.
- The project uses TypeScript.
- The project uses `pnpm` for package management, as indicated by the `pnpm-lock.yaml` file.
- The project uses ADRs (Architecture Decision Records) to document architectural decisions, as seen in the `docs/adrs` directory.
