import { Money } from '../value-objects/money';
import { Percentage } from '../value-objects/percentage';
import { InstallmentSchedule } from '../value-objects/installment-schedule';

// ─── Types ───────────────────────────────────────────────────────────────────

export type InstallmentStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type PaymentMethod = 'TRANSFER' | 'CASH' | 'CHEQUE' | 'CRYPTO' | 'OTHER';

export interface PaymentRecord {
  id: string;
  amount: Money;
  date: Date;
  method: PaymentMethod;
  receiptReference: string;
}

export interface Installment {
  id: string;
  sequenceNumber: number;
  title: string;
  amount: Money;
  dueDate?: Date;
  status: InstallmentStatus;
  paidAmount: Money;
  remainingAmount: Money;
  payments: PaymentRecord[];
}

export interface PaymentPlanBalance {
  totalBilled: Money;
  totalCollected: Money;
  totalPending: Money;
}

export interface PaymentPlanCreateInput {
  projectId: string;
  totalAmount: Money;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 0;
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${++_idCounter}`;
};

// ─── Aggregate: PaymentPlan ───────────────────────────────────────────────────

export class PaymentPlan {
  private readonly _id: string;
  private readonly _projectId: string;
  private readonly _totalAmount: Money;
  private _installments: Installment[];

  private constructor(input: PaymentPlanCreateInput) {
    this._id = generateId('plan');
    this._projectId = input.projectId;
    this._totalAmount = input.totalAmount;
    this._installments = [];
  }

  public static create(input: PaymentPlanCreateInput): PaymentPlan {
    return new PaymentPlan(input);
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  public get id(): string { return this._id; }
  public get projectId(): string { return this._projectId; }
  public get totalAmount(): Money { return this._totalAmount; }
  public get installments(): ReadonlyArray<Installment> { return this._installments; }

  // ── Commands ─────────────────────────────────────────────────────────────

  public generateEvenSplit(count: number): void {
    const schedule = InstallmentSchedule.fromEvenSplit(count);
    const calculated = schedule.calculateAmountsWithPennyAdjustment(this._totalAmount);

    this._installments = calculated.map((item) => this.buildInstallment(item.sequenceNumber, item.title, item.amount));
  }

  public generateSplit(...percentages: number[]): void {
    const percentageItems = percentages.map((pct, i) => ({
      sequenceNumber: i + 1,
      title: `Cuota ${i + 1} de ${percentages.length}`,
      percentage: Percentage.create(pct),
    }));
    const schedule = InstallmentSchedule.create(percentageItems);
    const calculated = schedule.calculateAmountsWithPennyAdjustment(this._totalAmount);

    this._installments = calculated.map((item) => this.buildInstallment(item.sequenceNumber, item.title, item.amount));
  }

  public recordPayment(
    installmentId: string,
    amount: Money,
    date: Date,
    method: PaymentMethod,
    receiptReference: string
  ): void {
    const installment = this._installments.find((i) => i.id === installmentId);
    if (!installment) {
      throw new Error(`Cuota con id "${installmentId}" no encontrada`);
    }

    if (amount.amount > installment.remainingAmount.amount) {
      throw new Error('El pago excede el monto pendiente de la cuota');
    }

    const payment: PaymentRecord = {
      id: generateId('pay'),
      amount,
      date,
      method,
      receiptReference,
    };

    installment.payments.push(payment);

    const newPaid = installment.paidAmount.add(amount);
    installment.paidAmount = newPaid;
    installment.remainingAmount = installment.amount.subtract(newPaid);

    if (installment.remainingAmount.amount === 0) {
      installment.status = 'PAID';
    } else {
      installment.status = 'PARTIALLY_PAID';
    }
  }

  public getInstallmentById(id: string): Installment | undefined {
    return this._installments.find((i) => i.id === id);
  }

  public getBalance(): PaymentPlanBalance {
    const currency = this._totalAmount.currency;
    const totalCollected = this._installments.reduce(
      (acc, inst) => acc.add(inst.paidAmount),
      Money.create(0, currency)
    );
    const totalPending = this._totalAmount.subtract(totalCollected);

    return {
      totalBilled: this._totalAmount,
      totalCollected,
      totalPending,
    };
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private buildInstallment(sequenceNumber: number, title: string, amount: Money): Installment {
    return {
      id: generateId('inst'),
      sequenceNumber,
      title,
      amount,
      status: 'PENDING',
      paidAmount: Money.create(0, amount.currency),
      remainingAmount: amount,
      payments: [],
    };
  }
}
