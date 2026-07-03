const { config } = require('dotenv');
const { resolve } = require('path');
const { spawnSync } = require('child_process');

const apiRoot = resolve(__dirname, '..');
const monorepoRoot = resolve(apiRoot, '../..');

config({ path: resolve(monorepoRoot, '.env') });
config({ path: resolve(apiRoot, '.env') });

const result = spawnSync('prisma', process.argv.slice(2), {
  stdio: 'inherit',
  shell: true,
  cwd: apiRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
