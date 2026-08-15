import type { IPaymentPlanRepository } from '@/domain/repositories/payment-plan.repository.interface';
import type { FinancialHealthOutputDto } from '../dtos/payment-plan.dto';

export class GetFinancialHealthSummaryUseCase {
  constructor(private readonly paymentPlanRepo: IPaymentPlanRepository) {}

  async execute(input: { projectId: string }): Promise<FinancialHealthOutputDto> {
    if (!input.projectId) {
      throw new Error('El ID del proyecto es requerido.');
    }

    const plan = await this.paymentPlanRepo.findByProjectId(input.projectId);
    if (!plan) {
      return {
        projectId: input.projectId,
        totalBilled: 0,
        totalCollected: 0,
        totalPending: 0,
        currency: 'USD',
      };
    }

    const balance = plan.getBalance();

    return {
      projectId: plan.projectId,
      totalBilled: balance.totalBilled.amount,
      totalCollected: balance.totalCollected.amount,
      totalPending: balance.totalPending.amount,
      currency: plan.totalAmount.currency,
    };
  }
}
