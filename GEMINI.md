# Project Overview

This project is the "Audit Tool" — a Webflow Designer Extension designed to lint Webflow classes in real time. It validates naming conventions, detects duplicate utilities, and applies context-aware rules to help teams maintain clean and consistent sites.

## Key Technologies

*   **Frontend:** React
*   **Build Tool:** Vite
*   **Language:** TypeScript (strict)
*   **Linting:** ESLint
*   **Testing:** Vitest

## Features

*   **Class Type Detection:** Identifies custom, utility, and combo classes.
*   **Naming Validation:** Enforces naming conventions per class type.
*   **Duplicate Detection:** Detects exact duplicate utility classes.
*   **Element-Context Classification:** Categorizes elements (e.g., `componentRoot`, `childGroup`).
*   **Role Identification:** Determines roles from the first custom class based on presets.
*   **Presets and Opinion Modes:** Supports configurable rule sets with persisted settings.
*   **Scanning:** Enables page and selected-element scanning with highlighting in the Webflow Designer.

## Architecture

The project follows a structured architecture, with core services located in `src/features/linter/services/`. It leverages an FSD-like (Feature-Sliced Design) approach for organizing code. Key architectural decisions are documented in Architecture Decision Records (ADRs) and Requests for Comments (RFCs) within the `docs/` directory.

# Building and Running

## Prerequisites

*   `pnpm` (package manager)

## Commands

*   **Install Dependencies:**
    ```bash
    pnpm i
    ```

*   **Start Development Server:**
    ```bash
    pnpm dev
    ```
    (Use the printed URL as your Webflow “Development URL”.)

*   **Build Development Bundle:**
    ```bash
    pnpm build:dev
    ```

*   **Build Production Bundle:**
    ```bash
    pnpm build:prod
    ```

*   **Lint Code:**
    ```bash
    pnpm lint
    ```

*   **Run Tests:**
    ```bash
    pnpm exec vitest
    ```

# Development Conventions

*   **Tooling:** Vite, TypeScript (strict), ESLint, Vitest.
*   **Path Alias:** `@/*` resolves to `src/*` (configured in `tsconfig.json`).
*   **Webflow Integration:** The development server uses a custom Vite plugin to inject Webflow extension scripts. Runtime access to Designer APIs is defensive, with heuristic fallbacks for features like combo detection.
*   **Documentation:** Architectural decisions are documented using ADRs (`docs/adrs/`) and proposals via RFCs (`docs/rfcs/`).
