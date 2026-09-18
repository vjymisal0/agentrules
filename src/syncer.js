import fs from 'node:fs';
import path from 'node:path';

/**
 * Format specifications for each supported AI assistant tool.
 */
export const TARGETS = {
  claude: {
    name: 'Claude Code / Anthropic',
    file: 'CLAUDE.md',
    header: '<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n',
    format: (content) => `<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n${content}`
  },
  cursor: {
    name: 'Cursor',
    file: path.join('.cursor', 'rules', 'main.mdc'),
    fallbackFile: '.cursorrules',
    header: '---\ndescription: Workspace master rules\nglobs: *\n---\n<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n',
    format: (content) => `---
description: Workspace master rules
globs: *
---
<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->

${content}`
  },
  copilot: {
    name: 'GitHub Copilot',
    file: path.join('.github', 'copilot-instructions.md'),
    header: '<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n',
    format: (content) => `<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n${content}`
  },
  gemini: {
    name: 'Gemini / Antigravity',
    file: 'GEMINI.md',
    header: '<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n',
    format: (content) => `<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n${content}`
  },
  windsurf: {
    name: 'Windsurf / Codeium',
    file: '.windsurfrules',
    header: '<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n',
    format: (content) => `<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n${content}`
  },
  agents: {
    name: 'OpenAI / Generic Agents',
    file: 'AGENTS.md',
    header: '<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n',
    format: (content) => `<!-- Generated automatically by agentrules from AGENT_RULES.md - DO NOT EDIT DIRECTLY -->\n\n${content}`
  }
};

/**
 * Sync master content to target tool configuration files.
 * @param {string} rootDir
 * @param {string[]} targetKeys
 * @returns {{ written: string[], skipped: string[] }}
 */
export function syncFiles(rootDir = process.cwd(), targetKeys = Object.keys(TARGETS)) {
  const masterPath = path.join(rootDir, 'AGENT_RULES.md');
  if (!fs.existsSync(masterPath)) {
    throw new Error(`Master file not found at ${masterPath}. Run "npx agentrules init" first.`);
  }

  const masterContent = fs.readFileSync(masterPath, 'utf8').trim();
  const written = [];
  const skipped = [];

  for (const key of targetKeys) {
    const target = TARGETS[key];
    if (!target) continue;

    const targetPath = path.join(rootDir, target.file);
    const targetDir = path.dirname(targetPath);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const outputContent = target.format(masterContent);
    fs.writeFileSync(targetPath, outputContent, 'utf8');
    written.push({ key, path: target.file });
  }

  return { written, skipped };
}

/**
 * Check if target files match master file content (for CI/CD validation).
 * @param {string} rootDir
 * @param {string[]} targetKeys
 * @returns {{ inSync: boolean, diffs: Array<{ key: string, file: string, reason: string }> }}
 */
export function checkSync(rootDir = process.cwd(), targetKeys = Object.keys(TARGETS)) {
  const masterPath = path.join(rootDir, 'AGENT_RULES.md');
  if (!fs.existsSync(masterPath)) {
    return {
      inSync: false,
      diffs: [{ key: 'master', file: 'AGENT_RULES.md', reason: 'Master AGENT_RULES.md file is missing' }]
    };
  }

  const masterContent = fs.readFileSync(masterPath, 'utf8').trim();
  const diffs = [];

  for (const key of targetKeys) {
    const target = TARGETS[key];
    if (!target) continue;

    const targetPath = path.join(rootDir, target.file);
    if (!fs.existsSync(targetPath)) {
      diffs.push({ key, file: target.file, reason: 'File does not exist' });
      continue;
    }

    const currentContent = fs.readFileSync(targetPath, 'utf8').trim();
    const expectedContent = target.format(masterContent).trim();

    if (currentContent !== expectedContent) {
      diffs.push({ key, file: target.file, reason: 'Content out of sync with AGENT_RULES.md' });
    }
  }

  return {
    inSync: diffs.length === 0,
    diffs
  };
}
