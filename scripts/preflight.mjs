#!/usr/bin/env node
/**
 * Preflight Check Script
 *
 * Validates the development environment before starting the application:
 * - fauna.config.yaml is set (copy from fauna.config.example.yaml)
 * - utils/schema-graph-data.ts is generated (run pnpm build:schema-graph)
 *
 * Usage: node scripts/preflight.mjs
 * Exit: 0 if all checks pass, 1 otherwise.
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");

// ANSI colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Load environment variables from .env files
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
}
if (existsSync(envPath)) {
  config({ path: envPath });
}
if (existsSync(envLocalPath) || existsSync(envPath)) {
  console.log(`${colors.cyan}📁 Loaded environment from .env${colors.reset}\n`);
} else {
  console.log(`${colors.yellow}⚠️  No .env file found${colors.reset}\n`);
}

/**
 * @typedef {{ success: boolean; message: string; details?: string }} CheckResult
 */

/**
 * Prints a formatted check result
 * @param {string} name
 * @param {CheckResult} result
 */
function printResult(name, result) {
  const icon = result.success ? "✓" : "✗";
  const color = result.success ? colors.green : colors.red;

  console.log(`${color}${icon}${colors.reset} ${colors.bright}${name}${colors.reset}`);
  console.log(`  ${result.message}`);

  if (result.details) {
    console.log(`  ${colors.cyan}${result.details}${colors.reset}`);
  }
  console.log();
}

/**
 * Check that fauna.config.yaml exists and is set
 * @returns {CheckResult}
 */
function checkFaunaConfig() {
  const faunaConfigPath = resolve(root, "fauna.config.yaml");
  if (!existsSync(faunaConfigPath)) {
    return {
      success: false,
      message: "fauna.config.yaml is not set",
      details: "Copy fauna.config.example.yaml to fauna.config.yaml and set database/secret",
    };
  }
  return {
    success: true,
    message: "fauna.config.yaml is configured",
    details: "Config file found at project root",
  };
}

/**
 * Check that utils/schema-graph-data.ts has been generated
 * @returns {CheckResult}
 */
function checkSchemaGraphData() {
  const schemaGraphDataPath = resolve(root, "utils", "schema-graph-data.ts");
  if (!existsSync(schemaGraphDataPath)) {
    const schemaPath = process.env.FAUNA_SCHEMA_PATH || "schema/main.fsl";
    return {
      success: false,
      message: "utils/schema-graph-data.ts is not generated",
      details: `Run: pnpm build:schema-graph (schema path: ${schemaPath})`,
    };
  }
  return {
    success: true,
    message: "Schema graph data is generated",
    details: "utils/schema-graph-data.ts exists",
  };
}

/**
 * Main preflight check function
 */
function runPreflightChecks() {
  console.log(`\n${colors.bright}${colors.blue}🚀 Running Preflight Checks${colors.reset}\n`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const results = [];

  const faunaResult = checkFaunaConfig();
  printResult("Fauna Config", faunaResult);
  results.push(faunaResult);

  const schemaResult = checkSchemaGraphData();
  printResult("Schema Graph Data", schemaResult);
  results.push(schemaResult);

  // Summary
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  if (successCount === totalCount) {
    console.log(`${colors.green}${colors.bright}✓ All checks passed! (${successCount}/${totalCount})${colors.reset}`);
    console.log(`${colors.green}Your environment is ready to go! 🎉${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bright}✗ Some checks failed (${successCount}/${totalCount})${colors.reset}`);
    console.log(`${colors.yellow}Please fix the issues above before continuing.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the checks
runPreflightChecks();
