import { cloneContract, createTestFixture, TIMEOUT } from './helpers';
import child_process from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

describe('Import cloned contracts as dependency', () => {
  it(
    'import Kyber Meta Aggregation Rounter V2',
    async () => {
      const tmp = await createTestFixture();

      await cloneContract(
        tmp,
        '0x6131B5fae19EA4f9D964eAc0408E4408b66337b5',
        'kyber',
      );

      const contract = `
    import 'kyber/contracts/MetaAggregationRouterV2.sol';
    contract C { MetaAggregationRouterV2 router; }
    `;
      const file = path.join(tmp, 'contracts', 'contract.sol');
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      await fs.promises.writeFile(file, contract);

      child_process.execSync(`pnpm hardhat compile --force`, {
        encoding: 'utf-8',
        stdio: ['inherit', 'ignore', 'ignore'],
        cwd: tmp,
      });
      expect(
        fs.existsSync(path.join(tmp, 'artifacts', 'contracts', 'contract.sol')),
      ).toBeTruthy();

      await fs.promises.rm(tmp, { recursive: true, force: true });
    },
    TIMEOUT,
  );
});
