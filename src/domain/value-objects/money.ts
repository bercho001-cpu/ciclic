export type CurrencyCode = 'USD' | 'EUR' | 'ARS' | 'MXN' | 'BRL' | 'GBP' | string;

export class Money {
  private readonly _amount: number;
  private readonly _currency: CurrencyCode;

  private constructor(amount: number, currency: CurrencyCode = 'USD') {
    if (amount < 0) {
      throw new Error('El monto no puede ser negativo');
    }
    // Redondeo estricto a 2 decimales para precisión financiera
    this._amount = Math.round((amount + Number.EPSILON) * 100) / 100;
    this._currency = currency.toUpperCase();
  }

  public static create(amount: number, currency: CurrencyCode = 'USD'): Money {
    return new Money(amount, currency);
  }

  public get amount(): number {
    return this._amount;
  }

  public get currency(): CurrencyCode {
    return this._currency;
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other.amount, this._currency);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount - other.amount, this._currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('El factor de multiplicación no puede ser negativo');
    }
    return new Money(this._amount * factor, this._currency);
  }

  public equals(other: Money): boolean {
    return this._amount === other.amount && this._currency === other.currency;
  }

  public format(locale: string = 'en-US'): string {
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this._amount);
    return `${formattedNumber} ${this._currency}`;
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other.currency) {
      throw new Error(`No se pueden operar montos con distintas monedas: ${this._currency} y ${other.currency}`);
    }
  }
}
