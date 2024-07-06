import assert from 'node:assert';
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
import { CompilerInput, SolcConfig } from 'hardhat/types';
import { Abi, Address, ByteArray, Hash } from 'viem';
import { SourceTree, SourceTreeEntry } from '../source/tree';
import { SemVer, parse as semverParse } from 'semver';

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

  /**
   * Whether the contract is verified on Etherscan.
   */
  get isVerified(): boolean {
    return this.sourceCode !== '';
  }

  /**
   * Whether the contract is a Vyper contract.
   */
  get isVyper(): boolean {
    return this.compilerVersion.startsWith('vyper:');
  }

  /**
   * Get the semantic version of the compiler used to compile the contract.
   */
  get semVersion(): SemVer {
    let version = this.compilerVersion;
    version = version.replace('vyper:', '');
    version = version.replace('v', '');
    let semVersion;
    semVersion = semverParse(version);
    if (!semVersion) {
      version = version.replace('a', '-alpha.');
      version = version.replace('b', '-beta.');
      semVersion = semverParse(version);
    }
    if (!semVersion) {
      throw new Error(`Invalid compiler version: ${this.compilerVersion}`);
    }
    return semVersion;
  }

  get compilerInput(): CompilerInput {
    assert.ok(this.isVerified, 'contract not verified');
    assert.ok(!this.isVyper, 'Vyper contracts are not supported');

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

  private _sourceTree: SourceTree | undefined;

  /**
   * Get the source tree from the contract metadata.
   */
  get sourceTree(): SourceTree {
    if (this._sourceTree) {
      return this._sourceTree;
    }
    const compilerInput = this.compilerInput;
    const entries = Object.entries(compilerInput.sources).map(
      ([path, content]) => new SourceTreeEntry(path, content.content),
    );
    this._sourceTree = new SourceTree(...entries);
    return this._sourceTree;
  }

  /**
   * Get the main file of the contract in the source tree.
   */
  get mainFile(): string {
    const tree = this.sourceTree;
    for (const entry of tree.entries) {
      // The current heuristic to find the main file of the contract is to look for the file that
      // named in the contract name.
      if (entry.path.endsWith(`${this.contractName}.sol`)) {
        return entry.path;
      }
    }

    // if not found, return the first file
    return tree.entries[0].path;
  }

  get solcConfig(): SolcConfig {
    return {
      version: this.semVersion.toString(),
      settings: this.compilerInput.settings,
    };
  }
}

export class Creation {
  /**
   * The address of the contract.
   */
  @IsString()
  @IsEthereumAddress()
  contractAddress!: Address;

  /**
   * The address of the creator of the contract.
   */
  @IsString()
  @IsEthereumAddress()
  contractCreator!: Address;

  /**
   * The transaction hash of the contract creation.
   */
  @IsString()
  @IsHash('sha256')
  txHash!: Hash;
}
