/**
 * Credit System Error Classes
 */

export class InsufficientCreditsError extends Error {
  public readonly required: number;
  public readonly available: number;

  constructor(required: number, available: number) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = "InsufficientCreditsError";
    this.required = required;
    this.available = available;
  }
}

export class NoActiveSubscriptionError extends Error {
  constructor() {
    super("An active subscription is required to purchase credit packs");
    this.name = "NoActiveSubscriptionError";
  }
}

export class CreditOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CreditOperationError";
  }
}

export class InvalidCreditPackError extends Error {
  constructor(packId: string) {
    super(`Invalid credit pack ID: ${packId}`);
    this.name = "InvalidCreditPackError";
  }
}
