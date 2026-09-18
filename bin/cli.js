#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { detectWorkspace } from '../src/detector.js';
import { generateMasterTemplate } from '../src/template.js';
import { TARGETS, syncFiles, checkSync } from '../src/syncer.js';

const args = process.argv.slice(2);
const command = args[0] || 'help';

const banner = `
   \x1b[36m╭────────────────────────────────────────╮\x1b[0m
   \x1b[36m│\x1b[0m   🤖 \x1b[1magentrules\x1b[0m - Universal AI Context   \x1b[36m│\x1b[0m
   \x1b[36m│\x1b[0m   Sync Cursor, Claude, Copilot & more  \x1b[36m│\x1b[0m
   \x1b[36m╰────────────────────────────────────────╯\x1b[0m
`;

function showHelp() {
  console.log(banner);
  console.log(`\x1b[1mUSAGE:\x1b[0m
  $ npx agentrules <command> [options]

\x1b[1mCOMMANDS:\x1b[0m
  \x1b[32minit\x1b[0m      Analyze workspace & create/update master AGENT_RULES.md
  \x1b[32msync\x1b[0m      Sync AGENT_RULES.md across all AI configuration files
  \x1b[32mcheck\x1b[0m     Verify that all AI files are in sync with AGENT_RULES.md (for CI/CD)
  \x1b[32mstatus\x1b[0m    Inspect detected workspace metadata and existing AI rules
  \x1b[32mhelp\x1b[0m      Display this help documentation

\x1b[1mOPTIONS:\x1b[0m
  --targets=<list>   Comma-separated list of targets (claude,cursor,copilot,gemini,windsurf,agents)
  --force            Overwrite existing master AGENT_RULES.md if running init
  -v, --version      Show agentrules version

\x1b[1mEXAMPLES:\x1b[0m
  $ npx agentrules init
  $ npx agentrules sync
  $ npx agentrules sync --targets=claude,cursor
  $ npx agentrules check
`);
}

async function run() {
  if (args.includes('-v') || args.includes('--version')) {
    const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    console.log(`agentrules v${pkg.version}`);
    process.exit(0);
  }

  const rootDir = process.cwd();

  // Parse --targets=a,b flag if present
  let requestedTargets = Object.keys(TARGETS);
  const targetArg = args.find(a => a.startsWith('--targets='));
  if (targetArg) {
    requestedTargets = targetArg.split('=')[1].split(',').map(t => t.trim().toLowerCase());
  }

  switch (command) {
    case 'init': {
      console.log(banner);
      console.log('🔍 Analyzing workspace architecture...');
      const { result, pkg } = detectWorkspace(rootDir);

      console.log(`  • Package Manager : \x1b[33m${result.packageManager}\x1b[0m`);
      console.log(`  • Languages       : \x1b[33m${result.languages.join(', ') || 'General'}\x1b[0m`);
      console.log(`  • Frameworks      : \x1b[33m${result.frameworks.join(', ') || 'None detected'}\x1b[0m`);
      console.log(`  • Test Runner     : \x1b[33m${result.testRunner || 'None detected'}\x1b[0m`);

      const masterPath = path.join(rootDir, 'AGENT_RULES.md');
      const force = args.includes('--force');

      if (fs.existsSync(masterPath) && !force) {
        console.log(`\n\x1b[33m⚠️  AGENT_RULES.md already exists at ${masterPath}.\x1b[0m`);
        console.log('   Run with \x1b[1m--force\x1b[0m to regenerate, or run \x1b[1mnpx agentrules sync\x1b[0m to distribute.');
      } else {
        const template = generateMasterTemplate(result, pkg);
        fs.writeFileSync(masterPath, template, 'utf8');
        console.log(`\n\x1b[32m✔ Successfully created master AGENT_RULES.md!\x1b[0m`);
      }

      console.log('\n🔄 Automatically syncing to supported AI targets...');
      const { written } = syncFiles(rootDir, requestedTargets);
      for (const item of written) {
        console.log(`  \x1b[32m✓\x1b[0m Created/Updated \x1b[1m${item.path}\x1b[0m`);
      }

      console.log('\n\x1b[32m✨ Setup complete!\x1b[0m Edit \x1b[1mAGENT_RULES.md\x1b[0m and run \x1b[1mnpx agentrules sync\x1b[0m anytime.');
      break;
    }

    case 'sync': {
      console.log('🔄 Syncing AI assistant configurations from AGENT_RULES.md...');
      try {
        const { written } = syncFiles(rootDir, requestedTargets);
        for (const item of written) {
          console.log(`  \x1b[32m✓\x1b[0m Synced \x1b[1m${item.path}\x1b[0m`);
        }
        console.log(`\x1b[32m✔ Synchronized ${written.length} AI configurations.\x1b[0m`);
      } catch (err) {
        console.error(`\x1b[31m✖ Error:\x1b[0m ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'check': {
      console.log('🔍 Checking if AI assistant rules are in sync with AGENT_RULES.md...');
      const { inSync, diffs } = checkSync(rootDir, requestedTargets);

      if (inSync) {
        console.log('\x1b[32m✔ All AI rule files are perfectly in sync with AGENT_RULES.md.\x1b[0m');
        process.exit(0);
      } else {
        console.error('\x1b[31m✖ AI rules are out of sync!\x1b[0m\n');
        for (const diff of diffs) {
          console.error(`  - \x1b[1m${diff.file}\x1b[0m: ${diff.reason}`);
        }
        console.error('\nRun \x1b[1mnpx agentrules sync\x1b[0m to resolve differences.');
        process.exit(1);
      }
      break;
    }

    case 'status': {
      console.log(banner);
      console.log('📋 Workspace Status:');
      const { result } = detectWorkspace(rootDir);
      console.log(`  • Package Manager : ${result.packageManager}`);
      console.log(`  • Languages       : ${result.languages.join(', ') || 'N/A'}`);
      console.log(`  • Frameworks      : ${result.frameworks.join(', ') || 'N/A'}`);
      console.log(`  • Test Runner     : ${result.testRunner || 'N/A'}`);

      console.log('\n🤖 Supported Targets Status:');
      for (const [key, target] of Object.entries(TARGETS)) {
        const filePath = path.join(rootDir, target.file);
        const exists = fs.existsSync(filePath);
        console.log(`  [${exists ? '\x1b[32mEXISTS\x1b[0m' : '\x1b[90mMISSING\x1b[0m'}] ${target.name.padEnd(26)} -> ${target.file}`);
      }
      break;
    }

    case 'help':
    default:
      showHelp();
      break;
  }
}

run().catch((err) => {
  console.error('\x1b[31mUnexpected error:\x1b[0m', err);
  process.exit(1);
});
