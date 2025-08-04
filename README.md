# Designer Extension: Audit Tool

Explore the [documentation](https://developers.webflow.com/designer/reference/introduction) for detailed information on Designer Extension features and API.

## Local Development

```bash
npm run dev
```

This command installs dependencies, starts the Vite development server, and serves your extension files. Use the displayed URL as the "Development URL" in Webflow Designer's Apps panel to launch your extension.

## Build for Distribution

```bash
npm run build
```

This command builds your React application with Vite, copies the build files to the public directory, and prepares a bundle.zip file for distribution. Upload this bundle.zip file for distributing the App inside of your workspace or via the Marketplace.

## Technology Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Radix UI Components