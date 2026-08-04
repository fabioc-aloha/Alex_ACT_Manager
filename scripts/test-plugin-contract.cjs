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
  assert.equal(plugin.version, '0.2.1');
  assert.equal(plugin.skills, '.github/skills');
  assert.equal(plugin.commands, '.github/prompts');
});

test('source inventory and repository documentation are complete', () => {
  const manifest = readJson('manifest.json');
  assert.equal(manifest.plugin, 'alex-act-manager');
  assert.equal(manifest.version, '0.2.1');
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

test('user baseline carries the framework discovery floor', () => {
  const baseline = readJson('.github/skills/plugin-management/resources/welcome-baseline.json').settings;
  assert.equal(baseline['chat.agentSkillsLocations']['.github/skills'], true);
  assert.equal(baseline['chat.agentSkillsLocations']['.github/skills/local'], true);
  assert.equal(baseline['chat.agentSkillsLocations']['~/.copilot/skills'], true);
  assert.equal(baseline['chat.promptFilesLocations']['.github/prompts'], true);
  assert.equal(baseline['chat.promptFilesLocations']['.github/prompts/local'], true);
  assert.equal(baseline['chat.agentFilesLocations']['.github/agents'], true);
  assert.equal(baseline['chat.agentFilesLocations']['.github/agents/local'], true);
  assert.equal(baseline['chat.hookFilesLocations']['.github/hooks'], true);
  assert.equal(baseline['chat.hookFilesLocations']['~/.copilot/hooks'], true);
  assert.equal(baseline['chat.editing.revealNextChangeOnResolve'], false,
    'chat edits must not automatically reveal the next changed file');
  assert.equal(Object.hasOwn(baseline, 'markdown.styles'), false,
    'local Markdown CSS must remain workspace-scoped');
});

test('install setup separately covers user settings and current workspace CSS', () => {
  const skill = fs.readFileSync(path.join(
    repoRoot, '.github', 'skills', 'install-constellation', 'SKILL.md'), 'utf8');
  const prompt = fs.readFileSync(path.join(
    repoRoot, '.github', 'prompts', 'install-constellation.prompt.md'), 'utf8');
  const combined = `${skill}\n${prompt}`;
  assert.match(combined, /\/alex-act-manager configure-vscode/);
  assert.match(combined, /\/alex-act-manager bootstrap-workspace/);
  assert.match(combined, /user(?:-scope| settings).*consent|consent.*user(?:-scope| settings)/is);
  assert.match(combined, /workspace.*consent|consent.*workspace/is);
  assert.match(combined, /\.vscode\/markdown-light\.css|\.vscode\\markdown-light\.css/);
  assert.match(combined, /markdown\.styles/);
  assert.match(skill, /six activation planes/);
  assert.match(skill, /Step 7 is separately consent-gated/);
  assert.match(skill, /greeting Y covers plugin selection only/);
  assert.doesNotMatch(skill, /summary with four activation planes/);
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

test('workspace CSS refresh is explicit and hash-verified', (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-css-refresh-'));
  t.after(() => fs.rmSync(target, { recursive: true, force: true }));
  const vscode = path.join(target, '.vscode');
  fs.mkdirSync(vscode, { recursive: true });
  const destination = path.join(vscode, 'markdown-light.css');
  fs.writeFileSync(destination, 'stale-css\n');
  const script = path.join(
    repoRoot, '.github', 'skills', 'plugin-management', 'scripts', 'manager-operations.cjs');

  const preserve = JSON.parse(execFileSync(process.execPath, [
    script, 'bootstrap-workspace', '--target', target,
  ], { cwd: repoRoot, encoding: 'utf8' }));
  assert.equal(preserve.css.action, 'preserve');
  assert.equal(preserve.css.matchesSource, false);
  assert.equal(fs.readFileSync(destination, 'utf8'), 'stale-css\n');

  const refresh = JSON.parse(execFileSync(process.execPath, [
    script, 'bootstrap-workspace', '--target', target, '--refresh-css', '--apply',
  ], { cwd: repoRoot, encoding: 'utf8' }));
  assert.equal(refresh.css.action, 'refresh');
  assert.equal(sha256(destination), refresh.css.sha256);
});

test('user baseline preserves unrelated settings and removes local CSS only explicitly', (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-user-settings-'));
  t.after(() => fs.rmSync(target, { recursive: true, force: true }));
  const settings = path.join(target, 'settings.json');
  fs.writeFileSync(settings, JSON.stringify({
    'editor.fontSize': 15,
    'chat.agentSkillsLocations': { '.agents/skills': true },
    'markdown.styles': ['C:/custom/markdown.css'],
  }, null, 2));
  const script = path.join(
    repoRoot, '.github', 'skills', 'plugin-management', 'scripts', 'manager-operations.cjs');

  const preview = JSON.parse(execFileSync(process.execPath, [
    script, 'configure-vscode', '--target-settings', settings,
  ], { cwd: repoRoot, encoding: 'utf8' }));
  assert.equal(preview.action, 'merge');
  assert.deepEqual(preview.unsupportedLocalMarkdownStyles, ['C:/custom/markdown.css']);
  assert.equal(JSON.parse(fs.readFileSync(settings, 'utf8'))['chat.useAgentSkills'], undefined);

  execFileSync(process.execPath, [
    script, 'configure-vscode', '--target-settings', settings, '--remove-local-css', '--apply',
  ], { cwd: repoRoot, encoding: 'utf8' });
  const applied = JSON.parse(fs.readFileSync(settings, 'utf8'));
  assert.equal(applied['editor.fontSize'], 15);
  assert.equal(applied['chat.agentSkillsLocations']['.agents/skills'], true);
  assert.equal(applied['chat.agentSkillsLocations']['.github/skills'], true);
  assert.equal(applied['markdown.styles'], undefined);
  assert.equal(applied['chat.useAgentSkills'], true);
  assert.equal(applied['github.copilot.chat.skillTool.enabled'], false);
});

test('user baseline apply fails closed on comment-rich JSONC', (t) => {
  const target = fs.mkdtempSync(path.join(os.tmpdir(), 'manager-user-jsonc-'));
  t.after(() => fs.rmSync(target, { recursive: true, force: true }));
  const settings = path.join(target, 'settings.json');
  const original = '// keep this comment\n{"editor.fontSize":15}\n';
  fs.writeFileSync(settings, original);
  const script = path.join(
    repoRoot, '.github', 'skills', 'plugin-management', 'scripts', 'manager-operations.cjs');
  const result = spawnSync(process.execPath, [
    script, 'configure-vscode', '--target-settings', settings, '--apply',
  ], { cwd: repoRoot, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /contain comments/);
  assert.equal(fs.readFileSync(settings, 'utf8'), original);
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
