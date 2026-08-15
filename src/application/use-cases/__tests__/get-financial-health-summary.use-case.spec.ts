import { test, expect } from '@playwright/test';
import { GetFinancialHealthSummaryUseCase } from '../get-financial-health-summary.use-case';
import { PaymentPlan } from '@/domain/aggregates/payment-plan';
import { Money } from '@/domain/value-objects/money';

// ─── In-Memory Repository ────────────────────────────────────────────────────
class InMemoryPaymentPlanRepository {
  private plans = new Map<string, PaymentPlan>();

  async findById(id: string): Promise<PaymentPlan | null> {
    return this.plans.get(id) || null;
  }

  async findByProjectId(projectId: string): Promise<PaymentPlan | null> {
    return Array.from(this.plans.values()).find((p) => p.projectId === projectId) || null;
  }

  async save(paymentPlan: PaymentPlan): Promise<void> {
    this.plans.set(paymentPlan.id, paymentPlan);
  }

  async delete(id: string): Promise<void> {
    this.plans.delete(id);
  }
}

test.describe('Use Case: GetFinancialHealthSummaryUseCase', () => {
  test('should return empty / zero balances if no payment plan exists for the project', async () => {
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new GetFinancialHealthSummaryUseCase(planRepo as any);

    const output = await useCase.execute({ projectId: 'project-empty' });

    expect(output.projectId).toBe('project-empty');
    expect(output.totalBilled).toBe(0);
    expect(output.totalCollected).toBe(0);
    expect(output.totalPending).toBe(0);
    expect(output.currency).toBe('USD');
  });

  test('should successfully return the financial health of an active payment plan', async () => {
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new GetFinancialHealthSummaryUseCase(planRepo as any);

    // Arrange: Create, generate split, and save a plan with some recorded payment
    const plan = PaymentPlan.create({
      projectId: 'project-abc',
      totalAmount: Money.create(5000, 'USD'),
    });
    plan.generateEvenSplit(2); // 2 installments of $2500
    plan.recordPayment(plan.installments[0].id, Money.create(1000, 'USD'), new Date(), 'TRANSFER', 'REC-1');
    await planRepo.save(plan);

    // Act
    const output = await useCase.execute({ projectId: 'project-abc' });

    // Assert
    expect(output.projectId).toBe('project-abc');
    expect(output.totalBilled).toBe(5000);
    expect(output.totalCollected).toBe(1000);
    expect(output.totalPending).toBe(4000);
    expect(output.currency).toBe('USD');
  });
});
