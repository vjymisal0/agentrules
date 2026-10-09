# agentrules 🤖

[![npm version](https://img.shields.io/npm/v/agentrules.svg?color=blue)](https://www.npmjs.com/package/agentrules)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://img.shields.io/badge/CI-Zero%20Dependencies-brightgreen.svg)]()

> **Universal AI Context & Rules Synchronizer.**  
> Maintain a single source of truth for your repository rules and automatically sync across **Cursor**, **Claude Code**, **GitHub Copilot**, **Gemini**, **Windsurf**, and custom agent frameworks.

---

## ⚡ The Problem

Modern development teams collaborate using different AI coding tools:
- Some developers use **Cursor** (`.cursor/rules/*.mdc`)
- Others use **Claude Code** (`CLAUDE.md`)
- Others use **GitHub Copilot** (`.github/copilot-instructions.md`)
- Others use **Gemini / Antigravity** (`GEMINI.md`) or **Windsurf** (`.windsurfrules`)

Over time, instruction files drift, guidelines diverge, and new team members or AI agents run conflicting or outdated commands.

## 💡 The Solution: `agentrules`

`agentrules` introduces a vendor-neutral **`AGENT_RULES.md`** file as your single source of truth. With one command (or in your CI pipeline), it translates and syncs your guidelines into the exact native structure each AI tool expects.

- 🚀 **Zero Dependencies**: Sub-second execution and ultra-light footprint.
- 🔍 **Auto-Detection**: Scans your package manager (`npm`, `pnpm`, `yarn`, `bun`), frameworks, and test runners to scaffold tailored rules.
- 🛡️ **CI Enforcement (`--check`)**: Catch unsynced rule drift before merging PRs.

---

## 📦 Quick Start (No Installation Needed)

### 1. Initialize your repository

Run in your project root:

```bash
npx agentrules init
```

`agentrules` inspects your workspace, detects your tooling, creates `AGENT_RULES.md`, and generates all target rule files automatically!

### 2. Edit once, sync everywhere

Update your guidelines in `AGENT_RULES.md`:

```bash
npx agentrules sync
```

To sync only specific targets:
```bash
npx agentrules sync --targets=claude,cursor
```

### 3. Check status

```bash
npx agentrules status
```

---

## 🤖 Supported Targets

| Tool / Platform | Output Location | Format |
| :--- | :--- | :--- |
| **Claude Code** (Anthropic) | `CLAUDE.md` | Native Markdown |
| **Cursor** | `.cursor/rules/main.mdc` | MDC frontmatter (`globs: *`) |
| **GitHub Copilot** | `.github/copilot-instructions.md` | Copilot instructions Markdown |
| **Google Gemini / Antigravity** | `GEMINI.md` | Native Markdown |
| **Windsurf / Codeium** | `.windsurfrules` | Rules format |
| **OpenAI / General Agents** | `AGENTS.md` | Agent specification |

---

## 🛡️ CI/CD Enforcement (GitHub Actions)

Ensure contributors never update vendor files without updating the master `AGENT_RULES.md`:

```yaml
name: Check AI Rules Sync

on:
  pull_request:
    branches: [main]

jobs:
  verify-rules:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Check Rule Sync
        run: npx agentrules check
```

---

## 💻 Programmatic API

You can also import `agentrules` into your own Node.js build scripts:

```javascript
import { detectWorkspace, syncFiles, checkSync } from '@vjymisal0/agentrules';

// Analyze workspace
const { result } = detectWorkspace();
console.log(result.packageManager, result.frameworks);

// Sync rules
syncFiles();

// Verify CI sync
const { inSync, diffs } = checkSync();
if (!inSync) {
  console.error('Rules out of sync:', diffs);
}
```

---

## 📄 License

MIT © Vijay
