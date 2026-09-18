import fs from 'node:fs';
import path from 'node:path';

/**
 * Inspect workspace files to detect framework, package manager, test runner, languages, etc.
 * @param {string} rootDir
 * @returns {object}
 */
export function detectWorkspace(rootDir = process.cwd()) {
  const result = {
    packageManager: 'npm',
    projectType: 'generic',
    languages: [],
    testRunner: null,
    frameworks: [],
    lintFormatters: [],
    existingConfigs: []
  };

  // 1. Detect Package Manager
  if (fs.existsSync(path.join(rootDir, 'pnpm-lock.yaml'))) {
    result.packageManager = 'pnpm';
  } else if (fs.existsSync(path.join(rootDir, 'yarn.lock'))) {
    result.packageManager = 'yarn';
  } else if (fs.existsSync(path.join(rootDir, 'bun.lockb')) || fs.existsSync(path.join(rootDir, 'bun.lock'))) {
    result.packageManager = 'bun';
  } else if (fs.existsSync(path.join(rootDir, 'package-lock.json'))) {
    result.packageManager = 'npm';
  } else if (fs.existsSync(path.join(rootDir, 'Cargo.toml'))) {
    result.packageManager = 'cargo';
  } else if (fs.existsSync(path.join(rootDir, 'pyproject.toml')) || fs.existsSync(path.join(rootDir, 'requirements.txt'))) {
    result.packageManager = 'pip/poetry';
  } else if (fs.existsSync(path.join(rootDir, 'go.mod'))) {
    result.packageManager = 'go';
  }

  // 2. Detect Languages & Node config
  const pkgPath = path.join(rootDir, 'package.json');
  let pkg = null;
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {
      // ignore invalid json
    }
  }

  if (fs.existsSync(path.join(rootDir, 'tsconfig.json'))) {
    result.languages.push('TypeScript');
  }
  if (pkg) {
    if (!result.languages.includes('TypeScript') && !result.languages.includes('JavaScript')) {
      result.languages.push('JavaScript');
    }
    result.projectType = 'node';

    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {})
    };

    // Framework detection
    if (allDeps['next']) result.frameworks.push('Next.js');
    if (allDeps['react']) result.frameworks.push('React');
    if (allDeps['vue']) result.frameworks.push('Vue');
    if (allDeps['svelte']) result.frameworks.push('Svelte');
    if (allDeps['express']) result.frameworks.push('Express');
    if (allDeps['nest'] || allDeps['@nestjs/core']) result.frameworks.push('NestJS');
    if (allDeps['fastify']) result.frameworks.push('Fastify');
    if (allDeps['tailwindcss']) result.frameworks.push('Tailwind CSS');

    // Test runner
    if (allDeps['vitest']) result.testRunner = 'vitest';
    else if (allDeps['jest']) result.testRunner = 'jest';
    else if (allDeps['mocha']) result.testRunner = 'mocha';
    else if (allDeps['playwright'] || allDeps['@playwright/test']) result.testRunner = 'playwright';

    // Linters
    if (allDeps['eslint']) result.lintFormatters.push('ESLint');
    if (allDeps['prettier']) result.lintFormatters.push('Prettier');
    if (allDeps['biome'] || allDeps['@biomejs/biome']) result.lintFormatters.push('Biome');
  }

  if (fs.existsSync(path.join(rootDir, 'Cargo.toml'))) {
    result.languages.push('Rust');
    result.projectType = 'rust';
  }
  if (fs.existsSync(path.join(rootDir, 'go.mod'))) {
    result.languages.push('Go');
    result.projectType = 'go';
  }
  if (fs.existsSync(path.join(rootDir, 'pyproject.toml')) || fs.existsSync(path.join(rootDir, 'requirements.txt'))) {
    result.languages.push('Python');
    result.projectType = 'python';
  }

  // 3. Existing AI configuration files
  const checkFiles = [
    { target: 'claude', path: 'CLAUDE.md' },
    { target: 'cursor', path: '.cursorrules' },
    { target: 'cursor', path: path.join('.cursor', 'rules') },
    { target: 'copilot', path: path.join('.github', 'copilot-instructions.md') },
    { target: 'gemini', path: 'GEMINI.md' },
    { target: 'windsurf', path: '.windsurfrules' },
    { target: 'agents', path: 'AGENTS.md' }
  ];

  for (const item of checkFiles) {
    if (fs.existsSync(path.join(rootDir, item.path))) {
      result.existingConfigs.push(item);
    }
  }

  return { result, pkg };
}
