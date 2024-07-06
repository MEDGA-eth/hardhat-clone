import { mainnet } from 'viem/chains';
import { getSource } from './index';
import { EtherscanError, NotVerifiedError } from '../error';

const test_api_key = 'MCAUM7WPE9XP5UQMZPCKIBUJHPM1C24FP6';

describe('etherscan API invocation', () => {
  beforeEach(async () => {
    // sleep for 1 second to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it('should get the source code of a contract from Etherscan', async () => {
    const meta = await getSource(
      mainnet,
      '0x9ab6b21cdf116f611110b048987e58894786c244',
      test_api_key,
    );
    expect(meta.contractName).toBe('InterestRatePositionManager');
    expect(meta.isVerified).toBe(true);
  });

  it('should throw an error when the contract address is invalid', async () => {
    const promise = getSource(mainnet, '0xabc', test_api_key);
    await expect(promise).rejects.toBeInstanceOf(EtherscanError);
  });

  it('should throw an error when the contract address is not found', async () => {
    const promise = getSource(
      mainnet,
      '0x9ab6b21cdf116f611110b048987e58894786c243',
      test_api_key,
    );
    await expect(promise).rejects.toBeInstanceOf(NotVerifiedError);
  });
});
