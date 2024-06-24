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
