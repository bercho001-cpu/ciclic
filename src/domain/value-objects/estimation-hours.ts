export interface PERTHoursParams {
  optimistic: number;
  probable: number;
  pessimistic: number;
}

export class EstimationHours {
  private readonly _optimistic: number;
  private readonly _probable: number;
  private readonly _pessimistic: number;
  private readonly _calculatedHours: number;

  private constructor(params: PERTHoursParams) {
    const { optimistic, probable, pessimistic } = params;

    if (optimistic < 0 || probable < 0 || pessimistic < 0) {
      throw new Error('Las horas de estimación no pueden ser negativas');
    }

    if (optimistic > probable || probable > pessimistic) {
      throw new Error('Invariante violada: Optimista <= Probable <= Pesimista');
    }

    this._optimistic = Math.round((optimistic + Number.EPSILON) * 100) / 100;
    this._probable = Math.round((probable + Number.EPSILON) * 100) / 100;
    this._pessimistic = Math.round((pessimistic + Number.EPSILON) * 100) / 100;

    // Fórmula PERT: (O + 4M + P) / 6
    const pert = (this._optimistic + (4 * this._probable) + this._pessimistic) / 6;
    this._calculatedHours = Math.round((pert + Number.EPSILON) * 100) / 100;
  }

  public static create(params: PERTHoursParams): EstimationHours {
    return new EstimationHours(params);
  }

  public static fromFixed(hours: number): EstimationHours {
    return new EstimationHours({
      optimistic: hours,
      probable: hours,
      pessimistic: hours,
    });
  }

  public get optimistic(): number {
    return this._optimistic;
  }

  public get probable(): number {
    return this._probable;
  }

  public get pessimistic(): number {
    return this._pessimistic;
  }

  public get calculatedHours(): number {
    return this._calculatedHours;
  }

  public equals(other: EstimationHours): boolean {
    return (
      this._optimistic === other.optimistic &&
      this._probable === other.probable &&
      this._pessimistic === other.pessimistic
    );
  }
}
