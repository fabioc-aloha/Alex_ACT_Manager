'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { execFileSync, spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const coreRoot = path.resolve(repoRoot, '..', 'Alex_ACT_Core');
const skillNames = [
  'bootstrap-workspace',
  'install-constellation',
  'plugin-management',
  'uninstall-constellation',
  'update-plugins',
];
const promptNames = [
  'bootstrap-workspace',
  'configure-vscode',
  'configure-vscode-verify',
  'install-constellation',
  'plugin-status',
  'uninstall-constellation',
  'update-plugins',
];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

test('plugin manifest exposes the Manager lifecycle bundle', () => {
  const plugin = readJson('plugin.json');
  assert.equal(plugin.name, 'alex-act-manager');
  assert.equal(plugin.version, '0.1.0');
  assert.equal(plugin.skills, '.github/skills');
  assert.equal(plugin.commands, '.github/prompts');
});

test('source inventory and repository documentation are complete', () => {
  const manifest = readJson('manifest.json');
  assert.equal(manifest.plugin, 'alex-act-manager');
  assert.equal(manifest.version, '0.1.0');
  assert.deepEqual(manifest.assets.skills.map((entry) => entry.name), skillNames);
  assert.deepEqual(manifest.assets.prompts.map((entry) => entry.name), promptNames);
  assert.equal(manifest.assets.bootstrap_instructions.length, 17);
  assert.deepEqual(manifest.distribution.expected_payload_files, 37);

  for (const relativePath of [
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    '.github/copilot-instructions.md',
  ]) {
    assert(fs.existsSync(path.join(repoRoot, relativePath)), `missing ${relativePath}`);
  }
});

test('all lifecycle skills, prompts, runtime, and resources are present', () => {
  for (const name of skillNames) {
    assert(fs.existsSync(path.join(repoRoot, '.github', 'skills', name, 'SKILL.md')),
      `missing ${name}/SKILL.md`);
  }
  for (const name of promptNames) {
    assert(fs.existsSync(path.join(repoRoot, '.github', 'prompts', `${name}.prompt.md`)),
      `missing ${name}.prompt.md`);
  }
  assert(fs.existsSync(path.join(
    repoRoot, '.github', 'skills', 'plugin-management', 'scripts', 'manager-operations.cjs')),
  'missing deterministic Manager runtime');
  assert(fs.existsSync(path.join(
    repoRoot, '.github', 'skills', 'plugin-management', 'resources', 'welcome-baseline.json')),
  'missing user-scope VS Code baseline');
  assert(fs.existsSync(path.join(
    repoRoot, '.github', 'skills', 'bootstrap-workspace', 'resources', 'markdown-light.css')),
  'missing workspace Markdown CSS');
});

test('bootstrap bundle contains seventeen Core-owned instruction resources', () => {
  const bootstrap = path.join(repoRoot, '.github', 'skills', 'install-constellation', 'bootstrap');
  const files = fs.readdirSync(bootstrap).filter((name) => name.endsWith('.instructions.md')).sort();
  assert.equal(files.length, 17);
  if (!fs.existsSync(coreRoot)) return;
  const mismatches = [];
  for (const name of files) {
    const source = path.join(coreRoot, '.github', 'instructions', name.replace(/^alex-act-/, ''));
    if (!fs.existsSync(source) || sha256(source) !== sha256(path.join(bootstrap, name))) {
      mismatches.push(name);
    }
  }
  assert.deepEqual(mismatches, []);
});

test('Manager command guidance uses the Manager namespace', () => {
  const violations = [];
  for (const name of promptNames) {
    const file = path.join(repoRoot, '.github', 'prompts', `${name}.prompt.md`);
    const content = fs.readFileSync(file, 'utf8');
    if (new RegExp(`/alex-act-core ${name}(?:\\b|\\s)`).test(content)) violations.push(name);
  }
  const bootstrapSkill = fs.readFileSync(path.join(
    repoRoot, '.github', 'skills', 'bootstrap-workspace', 'SKILL.md'), 'utf8');
  assert.doesNotMatch(bootstrapSkill, /\/alex-act-core bootstrap-workspace/);
  assert.deepEqual(violations, []);
});

test('component roots contain no editorial README files', () => {
  for (const relativePath of ['.github/skills/README.md', '.github/prompts/README.md']) {
    assert(!fs.existsSync(path.join(repoRoot, relativePath)),
      `${relativePath} would be reified as a phantom component`);
  }
});

test('component documentation has no broken local links', () => {
  const broken = [];
  const markdownFiles = [
    ...skillNames.map((name) => path.join(repoRoot, '.github', 'skills', name, 'SKILL.md')),
    ...promptNames.map((name) => path.join(repoRoot, '.github', 'prompts', `${name}.prompt.md`)),
  ];
  for (const file of markdownFiles) {
    const markdown = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const raw = match[1].trim().replace(/^<|>$/g, '');
      if (!raw || /^(https?:|mailto:|#)/i.test(raw) || raw.includes('<')) continue;
      const target = raw.split('#')[0].split('?')[0];
      if (!fs.existsSync(path.resolve(path.dirname(file), target))) {
        broken.push(`${path.relative(repoRoot, file)} -> ${raw}`);
      }
    }
  }
  assert.deepEqual(broken, []);
});

test('installable source stays below the Windows payload ceiling', () => {
  const roots = ['plugin.json', '.github/skills', '.github/prompts'];
  const files = [];
  function collect(current) {
    const stat = fs.statSync(current);
    if (stat.isFile()) {
      files.push(current);
      return;
    }
    for (const entry of fs.readdirSync(current)) collect(path.join(current, entry));
  }
  for (const root of roots) collect(path.join(repoRoot, root));
  assert(files.length <= 100, `${files.length} installable files exceed the 100-file ceiling`);
  assert.equal(files.length, 33, 'unexpected installable source file count');
});

test('workspace bootstrap is self-contained and preview-only by default', (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-workspace-'));
  t.after(() => fs.rmSync(target, { recursive: true, force: true }));
  const script = path.join(
    repoRoot, '.github', 'skills', 'plugin-management', 'scripts', 'manager-operations.cjs');
  const output = execFileSync(process.execPath, [
    script, 'bootstrap-workspace', '--target', target,
  ], { cwd: repoRoot, encoding: 'utf8' });
  const plan = JSON.parse(output);
  assert.equal(plan.apply, false);
  assert.equal(plan.css.action, 'create');
  assert.equal(plan.settings.action, 'create');
  assert.equal(fs.existsSync(path.join(target, '.vscode')), false);
  assert.match(plan.css.source.replaceAll('\\', '/'),
    /bootstrap-workspace\/resources\/markdown-light\.css$/);
});

test('marketplace resolver selects exact records and fails closed', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-marketplace-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const fixture = path.join(directory, 'marketplace.json');
  fs.writeFileSync(fixture, JSON.stringify({
    plugins: [{ name: 'alex-act-core', version: '0.6.6', source: 'plugins/core' }],
  }));
  const script = path.join(
    repoRoot, '.github', 'skills', 'plugin-management', 'scripts', 'manager-operations.cjs');
  const output = JSON.parse(execFileSync(process.execPath, [
    script, 'marketplace-versions', '--file', fixture, '--plugins', 'alex-act-core',
  ], { encoding: 'utf8' }));
  assert.deepEqual(output, [{ name: 'alex-act-core', version: '0.6.6', source: 'plugins/core' }]);

  const missing = spawnSync(process.execPath, [
    script, 'marketplace-versions', '--file', fixture, '--plugins', 'not-real',
  ], { encoding: 'utf8' });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /plugin record not found: not-real/);
});
