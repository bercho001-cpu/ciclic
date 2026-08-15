import { Money } from './money';
import { Percentage } from './percentage';

export interface InstallmentItem {
  sequenceNumber: number;
  title: string;
  percentage: Percentage;
  dueDate?: Date;
  milestoneDeliverable?: string;
}

export interface CalculatedInstallmentItem extends InstallmentItem {
  amount: Money;
}

export class InstallmentSchedule {
  private readonly _items: ReadonlyArray<InstallmentItem>;
  private readonly _isEvenSplit: boolean;

  private constructor(items: InstallmentItem[], isEvenSplit = false) {
    const totalPct = items.reduce((acc, item) => acc + item.percentage.value, 0);
    // Tolerancia de precisión para suma de porcentajes (99.99% a 100.01%)
    if (Math.abs(totalPct - 100) > 0.01) {
      throw new Error('La suma de los porcentajes de las cuotas debe ser exactamente 100%');
    }
    this._items = Object.freeze([...items]);
    this._isEvenSplit = isEvenSplit;
  }

  public static create(items: InstallmentItem[]): InstallmentSchedule {
    return new InstallmentSchedule(items, false);
  }

  public static fromEvenSplit(numberOfInstallments: number): InstallmentSchedule {
    if (numberOfInstallments <= 0) {
      throw new Error('El número de cuotas debe ser mayor a 0');
    }

    const rawPct = 100 / numberOfInstallments;
    const roundedPct = Math.floor((rawPct + Number.EPSILON) * 100) / 100;
    const residualPct = Math.round(((100 - (roundedPct * numberOfInstallments)) + Number.EPSILON) * 100) / 100;

    const items: InstallmentItem[] = [];
    for (let i = 1; i <= numberOfInstallments; i++) {
      const isLast = i === numberOfInstallments;
      const finalPct = isLast ? Math.round((roundedPct + residualPct + Number.EPSILON) * 100) / 100 : roundedPct;
      items.push({
        sequenceNumber: i,
        title: `Cuota ${i} de ${numberOfInstallments}`,
        percentage: Percentage.create(finalPct),
      });
    }

    return new InstallmentSchedule(items, true);
  }

  public static fromStandardMilestones(advancePct = 30, betaPct = 40, releasePct = 30): InstallmentSchedule {
    const items: InstallmentItem[] = [
      { sequenceNumber: 1, title: 'Anticipo al Inicio del Proyecto', percentage: Percentage.create(advancePct) },
      { sequenceNumber: 2, title: 'Entrega de MVP / Versión Beta', percentage: Percentage.create(betaPct) },
      { sequenceNumber: 3, title: 'Pase a Producción y Traspaso Final', percentage: Percentage.create(releasePct) },
    ];
    return new InstallmentSchedule(items, false);
  }

  public get items(): ReadonlyArray<InstallmentItem> {
    return this._items;
  }

  public get totalPercentage(): number {
    return this._items.reduce((acc, curr) => acc + curr.percentage.value, 0);
  }

  public get isEvenSplit(): boolean {
    return this._isEvenSplit;
  }

  public calculateAmountsWithPennyAdjustment(totalAmount: Money): CalculatedInstallmentItem[] {
    const totalInCents = Math.round(totalAmount.amount * 100);
    const numberOfItems = this._items.length;
    const calculated: CalculatedInstallmentItem[] = [];

    if (this._isEvenSplit) {
      const baseCents = Math.floor(totalInCents / numberOfItems);
      const remainderCents = totalInCents % numberOfItems;

      for (let i = 0; i < numberOfItems; i++) {
        const item = this._items[i];
        const isLast = i === numberOfItems - 1;
        const itemCents = isLast ? baseCents + remainderCents : baseCents;

        calculated.push({
          ...item,
          amount: Money.create(itemCents / 100, totalAmount.currency),
        });
      }
    } else {
      let distributedCents = 0;

      for (let i = 0; i < numberOfItems; i++) {
        const item = this._items[i];
        const isLast = i === numberOfItems - 1;

        if (!isLast) {
          const itemCents = Math.round(totalInCents * (item.percentage.value / 100));
          distributedCents += itemCents;
          calculated.push({
            ...item,
            amount: Money.create(itemCents / 100, totalAmount.currency),
          });
        } else {
          // Última cuota absorbe el centavo residual
          const remainingCents = totalInCents - distributedCents;
          calculated.push({
            ...item,
            amount: Money.create(remainingCents / 100, totalAmount.currency),
          });
        }
      }
    }

    return calculated;
  }
}
