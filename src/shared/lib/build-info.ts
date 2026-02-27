export const buildInfo = {
  version: __APP_VERSION__,
  channel: __BUILD_CHANNEL__ as "production" | "development",
  buildTime: __BUILD_TIME__,
  recipient: import.meta.env.VITE_BUNDLE_RECIPIENT ?? "internal",
};
