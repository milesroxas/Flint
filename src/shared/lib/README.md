# shared/lib

Stateless utility modules shared across all features. No UI, no side effects, no store dependencies.

---

## build-info

**Path:** `@/shared/lib/build-info`

Exposes build-time constants injected by Vite at compile time. Used to tag PostHog events with runtime metadata so you can filter by version, channel, or build in analytics dashboards.

### Exports

```ts
import { buildInfo } from "@/shared/lib/build-info";

buildInfo.version    // e.g. "1.2.0"  — from package.json at build time
buildInfo.channel    // "production" | "development"  — from --mode flag
buildInfo.buildTime  // ISO 8601 timestamp  — e.g. "2026-02-27T10:30:00.000Z"
```

### How values are set

| Property | Source | Set by |
|---|---|---|
| `version` | `package.json → version` | `vite.config.ts` `define.__APP_VERSION__` |
| `channel` | Vite `--mode` flag | `build:prod` → `"production"`, `build:dev` → `"development"` |
| `buildTime` | `new Date().toISOString()` at build start | `vite.config.ts` `define.__BUILD_TIME__` |
| `recipient` | `VITE_BUNDLE_RECIPIENT` env var | Set per build; defaults to `"internal"` if omitted |

**Tagging a build for a specific recipient:**
```bash
VITE_BUNDLE_RECIPIENT=acme_corp pnpm build:prod
```
All PostHog events from that bundle will carry `bundle_recipient: "acme_corp"` as a super property, allowing cohort filtering by distribution target.

### PostHog integration

Registered as [super properties](https://posthog.com/docs/libraries/js#super-properties) in `src/index.tsx` — automatically attached to every PostHog event without any extra instrumentation:

```ts
posthog.register({
  app_version: buildInfo.version,
  build_channel: buildInfo.channel,
  build_time: buildInfo.buildTime,
});
```

### Bundle output

Builds are saved to versioned zip files in `bundle/` organized by channel and recipient:

```
bundle/
  prod/
    internal/    v1.2.0_02-27_10-30-00.zip
    acme_corp/   v1.2.0_02-27_10-30-00.zip
  development/
    internal/    v1.2.0_02-27_10-30-00.zip
```

The recipient folder is created automatically if it doesn't exist. Run via `pnpm build:prod` or `pnpm build:dev`.

---

## stable-json

**Path:** `@/shared/lib/stable-json`

Deterministic JSON serialization — keys are sorted before stringifying. Used wherever JSON output must be stable across runs (e.g. cache keys, diff comparisons).
