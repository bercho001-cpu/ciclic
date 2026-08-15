import type { PaymentPlan } from '../aggregates/payment-plan';

export interface IPaymentPlanRepository {
  findById(id: string): Promise<PaymentPlan | null>;
  findByProjectId(projectId: string): Promise<PaymentPlan | null>;
  save(paymentPlan: PaymentPlan): Promise<void>;
  delete(id: string): Promise<void>;
}
