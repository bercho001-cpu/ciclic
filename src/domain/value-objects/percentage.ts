export class Percentage {
  private readonly _value: number;

  private constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error('El porcentaje debe estar entre 0% y 100%');
    }
    this._value = Math.round((value + Number.EPSILON) * 100) / 100;
  }

  public static create(value: number): Percentage {
    return new Percentage(value);
  }

  public get value(): number {
    return this._value;
  }

  public asDecimal(): number {
    return this._value / 100;
  }

  public applyTo(amount: number): number {
    return Math.round(((amount * this.asDecimal()) + Number.EPSILON) * 100) / 100;
  }

  public equals(other: Percentage): boolean {
    return this._value === other.value;
  }
}
