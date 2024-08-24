import { Address } from 'viem';

export abstract class CloneError extends Error {
  cause: unknown;

  protected constructor(
    type: string,
    message: string,
    options?: { cause?: unknown; stack?: string },
  ) {
    super(message);
    this.name = type;
    this.stack = options?.stack ?? new Error().stack;
    this.cause = options?.cause;
  }

  toString(): string {
    return `${this.message}
Cause:
${this.cause}
Stack:
${this.stack}`;
  }
}

export class NotVerifiedError extends CloneError {
  constructor(public contract: Address, cause?: unknown) {
    super('NotVerifiedError', 'contract not verified', {
      cause,
      stack: new Error().stack,
    });
  }
}

export class EtherscanError extends CloneError {
  constructor(message: string, cause?: unknown) {
    super('EtherscanError', message, { cause, stack: new Error().stack });
  }
}

export class HttpError extends CloneError {
  constructor(message: string, cause?: unknown) {
    super('HttpError', message, { cause, stack: new Error().stack });
  }
}

export class FileCollisionError extends CloneError {
  constructor(public files: string[], cause?: unknown) {
    super('FileOverriddenError', `files will be overridden: ${files}`, {
      cause,
      stack: new Error().stack,
    });
  }
}

export class UnsupportedError extends CloneError {
  constructor(feature: string, cause?: unknown) {
    super('UnsupportedError', `Unsupported: ${feature}`, {
      cause,
      stack: new Error().stack,
    });
  }
}
