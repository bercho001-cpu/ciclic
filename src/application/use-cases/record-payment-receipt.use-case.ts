import type { IPaymentPlanRepository } from '@/domain/repositories/payment-plan.repository.interface';
import { Money } from '@/domain/value-objects/money';
import {
  RecordPaymentInputSchema,
  type RecordPaymentInputDto,
  type PaymentPlanOutputDto,
} from '../dtos/payment-plan.dto';

export class RecordPaymentReceiptUseCase {
  constructor(private readonly paymentPlanRepo: IPaymentPlanRepository) {}

  async execute(rawInput: RecordPaymentInputDto): Promise<PaymentPlanOutputDto> {
    const input = RecordPaymentInputSchema.parse(rawInput);

    const plan = await this.paymentPlanRepo.findById(input.paymentPlanId);
    if (!plan) {
      throw new Error(`El plan de pagos con ID ${input.paymentPlanId} no existe.`);
    }

    const payAmount = Money.create(input.amount, input.currency);
    plan.recordPayment(
      input.installmentId,
      payAmount,
      input.date,
      input.method,
      input.receiptReference
    );

    await this.paymentPlanRepo.save(plan);

    return {
      id: plan.id,
      projectId: plan.projectId,
      totalAmount: plan.totalAmount.amount,
      currency: plan.totalAmount.currency,
      installments: plan.installments.map((inst) => ({
        id: inst.id,
        sequenceNumber: inst.sequenceNumber,
        title: inst.title,
        amount: inst.amount.amount,
        paidAmount: inst.paidAmount.amount,
        remainingAmount: inst.remainingAmount.amount,
        status: inst.status,
        currency: inst.amount.currency,
      })),
    };
  }
}
