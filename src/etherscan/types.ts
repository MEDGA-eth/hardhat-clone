import { Expose, Transform } from 'class-transformer';
import {
  IsDataURI,
  IsEthereumAddress,
  IsHash,
  IsHexadecimal,
  IsInt,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { assert } from 'console';
import { CompilerInput } from 'hardhat/types';
import { Abi, Address, ByteArray } from 'viem';
import { SourceTree, SourceTreeEntry } from '../source/tree';

/**
 * The contract metadata returned by Etherscan getsourcecode API.
 * This interface is migrated from foundry-block-explorer rust library's `Metadata` struct.
 */
export class Metadata {
  /**
   * Includes metadata for compiler settings and language.
   */
  @IsString()
  @Expose({ name: 'SourceCode' })
  sourceCode!: string;

  /**
   * The ABI of the contract in JSON string.
   */
  @IsString()
  @IsJSON()
  @Expose({ name: 'ABI' })
  @Transform(({ value }) => JSON.parse(value))
  abi!: Abi;

  /**
   * The name of the contract.
   */
  @IsString()
  @Expose({ name: 'ContractName' })
  contractName!: string;

  /**
   * The version that this contract was compiled with. If it is a Vyper contract, it will start with "vyper:".
   */
  @IsString()
  @Expose({ name: 'CompilerVersion' })
  compilerVersion!: string;

  /**
   * Whether the optimizer was used. This value should only be 0 or 1.
   */
  @IsInt()
  @Min(0)
  @Max(1)
  @Expose({ name: 'OptimizationUsed' })
  @Transform(({ value }) => value === '1')
  optimizationUsed!: boolean;

  /**
   * The number of optimizations performed.
   */
  @IsInt()
  @Min(0)
  @Expose({ name: 'Runs' })
  runs!: number;

  /**
   * The constructor arguments the contract was deployed with.
   * Hex encoded string.
   */
  @IsString()
  @IsHexadecimal()
  @Expose({ name: 'ConstructorArguments' })
  @Transform(({ value }) => Buffer.from(value, 'hex'))
  constructorArguments!: ByteArray;

  /**
   * The version of the EVM the contract was deployed in. Can be either a variant of EvmVersion or "Default" which indicates the compiler's default.
   */
  @IsString()
  @Expose({ name: 'EVMVersion' })
  evmVersion!: string;

  /**
   * Not sure what this is. The compiler libraries settings are included in SourceCode field.
   */
  @IsString()
  @Expose({ name: 'Library' })
  library!: string;

  /**
   * The license of the contract.
   */
  @IsString()
  @Expose({ name: 'LicenseType' })
  licenseType!: string;

  /**
   * Whether this contract is a proxy. This value should only be 0 or 1.
   */
  @IsNumber()
  @Expose({ name: 'Proxy' })
  @Transform(({ value }) => value === '1')
  proxy!: boolean;

  /**
   * If this contract is a proxy, the address of its implementation.
   */
  @IsOptional()
  @IsString()
  @IsEthereumAddress()
  @Expose({ name: 'Implementation' })
  implementation?: Address;

  /**
   * The swarm source of the contract.
   */
  @IsOptional()
  @IsString()
  @IsDataURI()
  @Expose({ name: 'SwarmSource' })
  swarmSource?: string;

  get isVerified(): boolean {
    return this.sourceCode !== '';
  }

  get isVyper(): boolean {
    return this.compilerVersion.startsWith('vyper:');
  }

  get compilerInput(): CompilerInput {
    assert(!this.isVerified, 'contract not verified');
    assert(!this.isVyper, 'Vyper contracts are not supported');

    const compilerInput: CompilerInput = {
      language: this.isVyper ? 'Vyper' : 'Solidity',
      sources: {},
      settings: {
        optimizer: {
          enabled: this.optimizationUsed,
          runs: this.runs,
        },
        outputSelection: { '*': { '*': ['*'] } },
        evmVersion: this.evmVersion === 'Default' ? undefined : this.evmVersion,
      },
    };

    let sourceCodeJson = this.sourceCode;
    // We have two possibilities now: (https://github.com/TucksonDev/hardhat-etherscan-contract-cloner/blob/69eee06686bf32dd46a28e5650d310117d8bb4c1/src/task.ts#L129-L131)
    //  1.- Code is a single contract: The whole code is returned in this "SourceCode" field
    //  2.- Code is split into several imported contracts: "SourceCode" is an bad-formatted json object with the different pieces of code
    if (sourceCodeJson !== '{') {
      // Code is a single contract
      compilerInput.sources[`${this.contractName}.sol`] = {
        content: this.sourceCode,
      };
    } else {
      // Code is split into several imported contracts

      // sourceCode is not well formatted. It starts with 2 '{' and ends with 2 '}', breaking thus
      // the JSON object. To avoid errors, we will remove those 2 characters.
      sourceCodeJson = sourceCodeJson.substring(1, sourceCodeJson.length - 2);
      const sourceInfo = JSON.parse(sourceCodeJson);
      compilerInput.sources = sourceInfo.sources;
      compilerInput.settings = sourceInfo.settings;
    }

    return compilerInput;
  }

  /**
   * Get the source tree from the contract metadata.
   */
  get sourceTree(): SourceTree {
    const compilerInput = this.compilerInput;
    const entries = Object.entries(compilerInput.sources).map(
      ([path, content]) => new SourceTreeEntry(path, content.content),
    );
    return new SourceTree(...entries);
  }
}

export class Creation {
  /**
   * The address of the contract.
   */
  @IsString()
  @IsEthereumAddress()
  contractAddress!: string;

  /**
   * The address of the creator of the contract.
   */
  @IsString()
  @IsEthereumAddress()
  contractCreator!: string;

  /**
   * The transaction hash of the contract creation.
   */
  @IsString()
  @IsHash('sha256')
  txHash!: string;
}
