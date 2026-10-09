export type TargetKey = 'claude' | 'cursor' | 'copilot' | 'gemini' | 'windsurf' | 'agents';

export interface Target {
  name: string;
  file: string;
  fallbackFile?: string;
  header: string;
  format(content: string): string;
}

export interface WorkspaceMetadata {
  /** 'npm' | 'pnpm' | 'yarn' | 'bun' | 'cargo' | 'pip/poetry' | 'go' */
  packageManager: string;
  projectType: string;
  languages: string[];
  testRunner: string | null;
  frameworks: string[];
  lintFormatters: string[];
  existingConfigs: Array<{ target: TargetKey; path: string }>;
}

export interface DetectResult {
  result: WorkspaceMetadata;
  /** Parsed package.json, or null when absent or unreadable. */
  pkg: Record<string, any> | null;
}

export interface SyncResult {
  written: Array<{ key: TargetKey; path: string }>;
  skipped: Array<{ key: TargetKey; path: string }>;
}

export interface SyncDiff {
  key: TargetKey | 'master';
  file: string;
  reason: string;
}

export interface CheckResult {
  inSync: boolean;
  diffs: SyncDiff[];
}

export const TARGETS: Record<TargetKey, Target>;

export function detectWorkspace(rootDir?: string): DetectResult;
export function generateMasterTemplate(metadata: WorkspaceMetadata, pkg?: Record<string, any> | null): string;
export function syncFiles(rootDir?: string, targetKeys?: TargetKey[]): SyncResult;
export function checkSync(rootDir?: string, targetKeys?: TargetKey[]): CheckResult;
