#!/usr/bin/env node

/**
 * Flint Build CLI
 *
 * Interactive TUI for building and distributing Flint bundles.
 * Handles channel selection, recipient targeting, and versioned output.
 *
 * Usage:
 *   pnpm build
 *   (or node scripts/build-cli.js)
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync } from "node:fs";
import * as p from "@clack/prompts";
import color from "picocolors";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function progressBar(pct, width = 22) {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return `${color.cyan("█".repeat(filled))}${color.dim("░".repeat(empty))} ${color.dim(`${pct}%`)}`;
}

function run(cmd, args, env = {}) {
  return spawnSync(cmd, args, {
    env: { ...process.env, ...env },
    encoding: "utf-8",
  });
}

function getExistingRecipients(channelDir) {
  const dir = `bundle/${channelDir}`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function validateRecipientName(value) {
  if (!value || value.trim().length === 0) return "Name is required";
  if (!/^[a-z0-9_-]+$/.test(value)) return "Use only lowercase letters, numbers, underscores, or hyphens";
}

function buildTimestamp() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const MM = String(now.getMinutes()).padStart(2, "0");
  const SS = String(now.getSeconds()).padStart(2, "0");
  return `${mm}-${dd}_${HH}-${MM}-${SS}`;
}

// ─── Build Steps ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Type checking", pct: 10 },
  { label: "Building with Vite", pct: 40 },
  { label: "Bundling extension", pct: 75 },
  { label: "Organizing output", pct: 95 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.clear();

  p.intro(`${color.bgCyan(color.black("  flint  "))} ${color.dim("build cli")}  ${color.dim(`v${pkg.version}`)}`);

  // ── Channel ──────────────────────────────────────────────────────────────────

  const channel = await p.select({
    message: "Build channel",
    options: [
      { value: "production", label: "Production", hint: "bundle/prod/ — for distribution" },
      { value: "development", label: "Development", hint: "bundle/development/ — for testing" },
    ],
  });

  if (p.isCancel(channel)) {
    p.cancel("Build cancelled.");
    process.exit(0);
  }

  const channelDir = channel === "production" ? "prod" : "development";
  const viteMode = channel === "production" ? "production" : "development";

  // ── Recipient ────────────────────────────────────────────────────────────────

  const existing = getExistingRecipients(channelDir);

  const recipientOptions = [
    ...existing.map((r) => ({ value: r, label: r, hint: "existing" })),
    { value: "__new__", label: color.cyan("+ New recipient"), hint: "create a new distribution target" },
  ];

  const recipientChoice = await p.select({ message: "Recipient", options: recipientOptions });

  if (p.isCancel(recipientChoice)) {
    p.cancel("Build cancelled.");
    process.exit(0);
  }

  let recipient = recipientChoice;

  if (recipientChoice === "__new__") {
    const newName = await p.text({
      message: "Recipient name",
      placeholder: "acme_corp",
      validate: validateRecipientName,
    });
    if (p.isCancel(newName)) {
      p.cancel("Build cancelled.");
      process.exit(0);
    }
    recipient = newName.trim();
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  p.note(
    [
      `${color.dim("version")}    ${color.white(pkg.version)}`,
      `${color.dim("channel")}    ${color.white(channel)}`,
      `${color.dim("recipient")}  ${color.white(recipient)}`,
      `${color.dim("output")}     ${color.white(`bundle/${channelDir}/${recipient}/`)}`,
    ].join("\n"),
    "Build summary"
  );

  const confirmed = await p.confirm({ message: "Start build?", initialValue: true });

  if (p.isCancel(confirmed) || !confirmed) {
    p.cancel("Build cancelled.");
    process.exit(0);
  }

  // ── Build ────────────────────────────────────────────────────────────────────

  const s = p.spinner();
  const env = { VITE_BUNDLE_RECIPIENT: recipient };

  // Step 1 — Type check
  s.start(`${progressBar(STEPS[0].pct)}  ${STEPS[0].label}…`);
  const tscResult = run("pnpm", ["exec", "tsc", "--noEmit"]);
  if (tscResult.status !== 0) {
    s.stop(color.red("Type check failed"));
    p.log.error(tscResult.stdout || tscResult.stderr || "Unknown error");
    process.exit(1);
  }

  // Step 2 — Vite build
  s.message(`${progressBar(STEPS[1].pct)}  ${STEPS[1].label}…`);
  const viteResult = run("pnpm", ["exec", "vite", "build", "--mode", viteMode], env);
  if (viteResult.status !== 0) {
    s.stop(color.red("Vite build failed"));
    p.log.error(viteResult.stdout || viteResult.stderr || "Unknown error");
    process.exit(1);
  }

  // Step 3 — Webflow bundle
  s.message(`${progressBar(STEPS[2].pct)}  ${STEPS[2].label}…`);
  const bundleResult = run("pnpm", ["exec", "webflow", "extension", "bundle"]);
  if (bundleResult.status !== 0) {
    s.stop(color.red("Webflow bundle failed"));
    p.log.error(bundleResult.stdout || bundleResult.stderr || "Unknown error");
    process.exit(1);
  }

  // Step 4 — Move to output folder
  s.message(`${progressBar(STEPS[3].pct)}  ${STEPS[3].label}…`);
  const outDir = `bundle/${channelDir}/${recipient}`;
  const filename = `v${pkg.version}_${recipient}_${buildTimestamp()}.zip`;
  mkdirSync(outDir, { recursive: true });
  renameSync("bundle.zip", `${outDir}/${filename}`);

  // Done
  s.stop(`${progressBar(100)}  ${color.green("Build complete")}`);

  p.outro(`${color.green("✓")} ${color.cyan(`${outDir}/${filename}`)}`);
}

main().catch((err) => {
  p.log.error(err.message);
  process.exit(1);
});
