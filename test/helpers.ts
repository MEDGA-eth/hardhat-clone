import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import child_process from 'node:child_process';

export const ETHERSCAN_API_KEYS = [
  'MCAUM7WPE9XP5UQMZPCKIBUJHPM1C24FP6',
  'QYKNT5RHASZ7PGQE68FNQWH99IXVTVVD2I',
  'VXMQ117UN58Y4RHWUB8K1UGCEA7UQEWK55',
];
let apiKeyIndex = 0;

export function getEtherscanApiKey(): string {
  const key = ETHERSCAN_API_KEYS[apiKeyIndex];
  apiKeyIndex += 1;
  apiKeyIndex %= ETHERSCAN_API_KEYS.length;
  return key;
}

/**
 * Create a temp hardhat project.
 */
export async function createTestFixture(opts?: {
  debug?: boolean;
}): Promise<string> {
  const appRoot = await import('app-root-path');
  const root = appRoot.path;
  const tmp = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'hardhat-clone-'),
  );
  if (opts?.debug) console.log('Temp project:', tmp);

  await fs.promises.cp(
    path.join(root, 'test', 'fixture-projects', 'hardhat-project'),
    tmp,
    { recursive: true },
  );
  const packages = JSON.parse(
    await fs.promises.readFile(path.join(tmp, 'package.json'), 'utf-8'),
  );
  packages['devDependencies']['@medga/hardhat-clone'] = `link:${root}`;
  await fs.promises.writeFile(
    path.join(tmp, 'package.json'),
    JSON.stringify(packages, null, 2),
  );

  child_process.execSync('pnpm i', { cwd: tmp });
  return tmp;
}

/**
 * Clone contract in a hardhat project.
 */
export async function cloneContract(
  project: string,
  address: string,
  name: string,
  opts?: { debug?: boolean; etherscanApiKey?: string },
): Promise<void> {
  const etherscanApiKey: string = opts?.etherscanApiKey ?? getEtherscanApiKey();
  try {
    const cloneOutput = child_process.execSync(
      `pnpm hardhat clone --etherscan-api-key ${etherscanApiKey} '${address}' '${name}'`,
      {
        encoding: 'utf-8',
        stdio: 'pipe',
        cwd: project,
      },
    );
    if (opts?.debug) console.log('Clone output:\n', cloneOutput);
  } catch (e) {
    if (opts?.debug) console.log('Clone failed:\n', e);
    throw e;
  }
}
