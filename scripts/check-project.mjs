const expected = {
  supabaseRef: 'ltcchvjxgdcdsvgrmtjb',
  githubRepo: 'salempub1-dotcom/miraj-ostadh',
  environment: 'development',
};

const actual = {
  supabaseRef: process.env.MIRAJ_OSTADH_SUPABASE_REF,
  githubRepo: process.env.MIRAJ_OSTADH_GITHUB_REPO,
  environment: process.env.MIRAJ_OSTADH_ENVIRONMENT,
};

const checks = [
  ['Project', 'Miraj Ostadh', 'Miraj Ostadh'],
  ['Supabase Ref', actual.supabaseRef, expected.supabaseRef],
  ['GitHub', actual.githubRepo, expected.githubRepo],
  ['Environment', actual.environment, expected.environment],
];

let failed = false;

console.log('\nMiraj Ostadh project identity check\n');
for (const [label, value, expectedValue] of checks) {
  const ok = value === expectedValue;
  if (!ok) failed = true;
  console.log(`${ok ? '✓' : '✗'} ${label}: ${value ?? '(missing)'}`);
  if (!ok) console.log(`  expected: ${expectedValue}`);
}

if (failed) {
  console.error('\nSTOP: project identity check failed. Do not run migrations, deploys, builds, or publishes.\n');
  process.exit(1);
}

console.log('\nProject identity verified.\n');
