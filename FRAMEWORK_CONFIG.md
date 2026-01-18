# Framework Configuration

This project supports multiple linting frameworks that can be enabled or disabled based on your build environment.

## Available Frameworks

- **Client First**: Client-First naming conventions and rules
- **Lumos**: Lumos design system rules and conventions

## Configuration

Framework availability is controlled via environment variables in `.env.production` and `.env.development` files.

### Environment Variables

- `VITE_ENABLE_CLIENT_FIRST`: Set to `true` to enable Client First framework, `false` to disable
- `VITE_ENABLE_LUMOS`: Set to `true` to enable Lumos framework, `false` to disable

### Setup

1. Copy the example files:
   ```bash
   cp .env.production.example .env.production
   cp .env.development.example .env.development
   ```

2. Edit the files to enable/disable frameworks as needed:
   ```bash
   # .env.production
   VITE_ENABLE_CLIENT_FIRST=true
   VITE_ENABLE_LUMOS=false  # Disable Lumos in production
   ```

3. Build your project:
   ```bash
   pnpm run build:prod   # Uses .env.production
   pnpm run build:dev    # Uses .env.development
   ```

## Examples

### Enable only Lumos in production
```bash
# .env.production
VITE_ENABLE_CLIENT_FIRST=false
VITE_ENABLE_LUMOS=true
```

### Enable both frameworks (default)
```bash
# .env.production
VITE_ENABLE_CLIENT_FIRST=true
VITE_ENABLE_LUMOS=true
```

### Disable all frameworks
```bash
# .env.production
VITE_ENABLE_CLIENT_FIRST=false
VITE_ENABLE_LUMOS=false
```

## Notes

- Changes to `.env.*` files require rebuilding the project
- The `.env.*` files are gitignored - use `.env.*.example` as templates
- If a variable is not set or set to any value other than `"false"`, the framework will be enabled by default
