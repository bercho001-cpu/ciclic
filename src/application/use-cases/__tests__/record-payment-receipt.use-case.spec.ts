import { test, expect } from '@playwright/test';
import { RecordPaymentReceiptUseCase } from '../record-payment-receipt.use-case';
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

test.describe('Use Case: RecordPaymentReceiptUseCase', () => {
  test('should successfully record a payment on an installment', async () => {
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new RecordPaymentReceiptUseCase(planRepo as any);

    // Arrange: Save a plan with installments
    const plan = PaymentPlan.create({
      projectId: 'project-123',
      totalAmount: Money.create(1000, 'USD'),
    });
    plan.generateEvenSplit(2); // 2 installments of $500 each
    await planRepo.save(plan);

    const installment1 = plan.installments[0];

    // Act: Record a partial payment of $200
    const output = await useCase.execute({
      paymentPlanId: plan.id,
      installmentId: installment1.id,
      amount: 200,
      currency: 'USD',
      date: new Date(),
      method: 'TRANSFER',
      receiptReference: 'REF-001',
    });

    // Assert
    expect(output.id).toBe(plan.id);
    expect(output.installments[0].paidAmount).toBe(200);
    expect(output.installments[0].remainingAmount).toBe(300);
    expect(output.installments[0].status).toBe('PARTIALLY_PAID');

    // Act: Record a full payment of remaining $300
    const output2 = await useCase.execute({
      paymentPlanId: plan.id,
      installmentId: installment1.id,
      amount: 300,
      currency: 'USD',
      date: new Date(),
      method: 'TRANSFER',
      receiptReference: 'REF-002',
    });

    // Assert
    expect(output2.installments[0].paidAmount).toBe(500);
    expect(output2.installments[0].remainingAmount).toBe(0);
    expect(output2.installments[0].status).toBe('PAID');
  });

  test('should throw an error if the payment plan does not exist', async () => {
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new RecordPaymentReceiptUseCase(planRepo as any);

    await expect(
      useCase.execute({
        paymentPlanId: 'invalid-id',
        installmentId: 'inst-id',
        amount: 100,
        currency: 'USD',
        date: new Date(),
        method: 'TRANSFER',
        receiptReference: 'REF-001',
      })
    ).rejects.toThrow();
  });
});
