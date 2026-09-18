import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { detectWorkspace } from '../src/detector.js';
import { generateMasterTemplate } from '../src/template.js';
import { syncFiles, checkSync, TARGETS } from '../src/syncer.js';

describe('agentrules unit test suite', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agentrules-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('detectWorkspace detects pnpm, TypeScript, and vitest correctly', () => {
    fs.writeFileSync(path.join(tmpDir, 'pnpm-lock.yaml'), '');
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), '{}');
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: { next: '^14.0.0', react: '^18.0.0' },
        devDependencies: { vitest: '^1.0.0', eslint: '^8.0.0' }
      })
    );

    const { result } = detectWorkspace(tmpDir);
    assert.strictEqual(result.packageManager, 'pnpm');
    assert.ok(result.languages.includes('TypeScript'));
    assert.strictEqual(result.testRunner, 'vitest');
    assert.ok(result.frameworks.includes('Next.js'));
    assert.ok(result.lintFormatters.includes('ESLint'));
  });

  test('generateMasterTemplate produces expected instructions', () => {
    const meta = {
      packageManager: 'pnpm',
      languages: ['TypeScript'],
      frameworks: ['Next.js'],
      testRunner: 'vitest',
      lintFormatters: ['ESLint'],
      existingConfigs: []
    };
    const content = generateMasterTemplate(meta);
    assert.ok(content.includes('pnpm test'));
    assert.ok(content.includes('pnpm install'));
    assert.ok(content.includes('TypeScript'));
  });

  test('syncFiles writes Claude, Cursor, Copilot, Gemini rule files', () => {
    const masterPath = path.join(tmpDir, 'AGENT_RULES.md');
    fs.writeFileSync(masterPath, '# My Rules\n- Be concise\n- Write unit tests');

    const { written } = syncFiles(tmpDir);
    assert.strictEqual(written.length, Object.keys(TARGETS).length);

    // Verify Claude
    assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')));
    const claudeContent = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.ok(claudeContent.includes('Write unit tests'));

    // Verify Cursor
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'rules', 'main.mdc')));

    // Verify Copilot
    assert.ok(fs.existsSync(path.join(tmpDir, '.github', 'copilot-instructions.md')));

    // Verify Gemini
    assert.ok(fs.existsSync(path.join(tmpDir, 'GEMINI.md')));
  });

  test('checkSync validates whether targets are in sync', () => {
    const masterPath = path.join(tmpDir, 'AGENT_RULES.md');
    fs.writeFileSync(masterPath, '# My Rules\n- Rule 1');

    // Before sync: out of sync
    const resBefore = checkSync(tmpDir);
    assert.strictEqual(resBefore.inSync, false);

    // Sync
    syncFiles(tmpDir);
    const resAfter = checkSync(tmpDir);
    assert.strictEqual(resAfter.inSync, true);
    assert.strictEqual(resAfter.diffs.length, 0);

    // Manually mutate one target file to simulate drift
    fs.appendFileSync(path.join(tmpDir, 'CLAUDE.md'), '\nExtra drifted rule');
    const resDrifted = checkSync(tmpDir);
    assert.strictEqual(resDrifted.inSync, false);
    assert.ok(resDrifted.diffs.some((d) => d.key === 'claude'));
  });
});
