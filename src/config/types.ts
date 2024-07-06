import { Transform } from 'class-transformer';
import {
  IsEthereumAddress,
  IsHash,
  IsInt,
  IsObject,
  IsString,
  Min,
  ValidationOptions,
  isSemVer,
  registerDecorator,
} from 'class-validator';
import { SolcConfig } from 'hardhat/types';
import { Hash, Address, ByteArray } from 'viem';

/**
 * The metadata of a cloned contract.
 */
export class CloneMetadata {
  /**
   * The address of the contract.
   */
  @IsString()
  @IsEthereumAddress()
  address!: string;

  /**
   * The path to the source file that contains the contract declaration.
   * The path is relative to the source folder of the project.
   */
  @IsString()
  path!: string;

  /**
   * The chain ID where the contract is deployed.
   */
  @IsInt()
  @Min(1)
  chainId!: number;

  /**
   * The transaction hash that created the contract.
   */
  @IsHash('sha256')
  creationTransaction!: Hash;

  /**
   * The address of the deployer, i.e., sender of the creation transaction.
   */
  @IsString()
  @IsEthereumAddress()
  deployer!: Address;

  /**
   * The arguments passed to the contract constructor.
   */
  @Transform(({ value }) => Buffer.from(value, 'hex'), { toClassOnly: true })
  @Transform(({ value }) => value.toString('hex'), { toPlainOnly: true })
  constructorArguments!: ByteArray;

  /**
   * The version of Solidity compiler.
   */
  @IsObject()
  @IsSolcConfig()
  solcConfig!: SolcConfig;
}

/**
 * A class-validator decorator that checks if a value is a valid SolcConfig object.
 *
 * @param validationOptions Validation options for the decorator
 * @returns a decorator function
 */
function IsSolcConfig(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsSolcConfig',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validate(value: any) {
          // doing simple validation for SolcConfig:
          // - it should be an object
          // - it should have a version field that is a valid semver
          // - if it has a settings field, it should be an object
          if (typeof value !== 'object') return false;
          if (!value.version || !isSemVer(value.version)) return false;
          if (value.settings && typeof value.settings !== 'object')
            return false;
          return true;
        },
      },
    });
  };
}
