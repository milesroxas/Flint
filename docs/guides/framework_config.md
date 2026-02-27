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

1. Create `.env.production` and `.env.development` in the project root (these files are gitignored). Add the variables:
   ```
   VITE_ENABLE_CLIENT_FIRST=true
   VITE_ENABLE_LUMOS=true
   ```

2. Edit the values to enable/disable frameworks as needed.

3. Build your project:
   ```bash
   pnpm build:prod   # Uses .env.production
   pnpm build:dev    # Uses .env.development
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
- The `.env.*` files are gitignored
- If a variable is not set or set to any value other than `"false"`, the framework will be enabled by default
