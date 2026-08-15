import type { SupabaseClient } from '@supabase/supabase-js';
import type { IPaymentPlanRepository } from '../../../domain/repositories/payment-plan.repository.interface';
import { PaymentPlan } from '../../../domain/aggregates/payment-plan';
import { Money } from '../../../domain/value-objects/money';
import { Percentage } from '../../../domain/value-objects/percentage';

export class SupabasePaymentPlanRepository implements IPaymentPlanRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<PaymentPlan | null> {
    const { data, error } = await this.supabase
      .from('payment_plans')
      .select('*, installments(*, payment_records(*))')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToAggregate(data);
  }

  async findByProjectId(projectId: string): Promise<PaymentPlan | null> {
    const { data, error } = await this.supabase
      .from('payment_plans')
      .select('*, installments(*, payment_records(*))')
      .eq('project_id', projectId)
      .single();

    if (error || !data) return null;
    return this.mapToAggregate(data);
  }

  async save(paymentPlan: PaymentPlan): Promise<void> {
    const { error } = await this.supabase.from('payment_plans').upsert({
      id: paymentPlan.id,
      project_id: paymentPlan.projectId,
      total_amount: paymentPlan.totalAmount.amount,
      currency: paymentPlan.totalAmount.currency,
    });

    if (error) throw new Error(`Error al guardar el plan de pagos: ${error.message}`);

    for (const inst of paymentPlan.installments) {
      await this.supabase.from('installments').upsert({
        id: inst.id,
        payment_plan_id: paymentPlan.id,
        sequence_number: inst.sequenceNumber,
        title: inst.title,
        amount: inst.amount.amount,
        paid_amount: inst.paidAmount.amount,
        status: inst.status,
        due_date: inst.dueDate?.toISOString() ?? null,
        currency: inst.amount.currency,
      });

      for (const pay of inst.payments) {
        await this.supabase.from('payment_records').upsert({
          id: pay.id,
          installment_id: inst.id,
          amount: pay.amount.amount,
          currency: pay.amount.currency,
          date: pay.date.toISOString(),
          method: pay.method,
          receipt_reference: pay.receiptReference,
        });
      }
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('payment_plans').delete().eq('id', id);
    if (error) throw new Error(`Error al eliminar el plan de pagos: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToAggregate(row: any): PaymentPlan {
    const currency = row.currency;
    const plan = PaymentPlan.create({
      projectId: row.project_id,
      totalAmount: Money.create(row.total_amount, currency),
    });

    // Re-hidratar cuotas desde DB usando split percentages
    const sortedInstallments = (row.installments ?? []).sort(
      (a: any, b: any) => a.sequence_number - b.sequence_number
    );

    if (sortedInstallments.length > 0) {
      const percentages = sortedInstallments.map((inst: any) =>
        Math.round(((inst.amount / row.total_amount) * 100 + Number.EPSILON) * 100) / 100
      );
      plan.generateSplit(...percentages);

      // Re-aplicar pagos registrados
      const liveInstallments = plan.installments;
      for (let i = 0; i < sortedInstallments.length; i++) {
        const dbInst = sortedInstallments[i];
        const liveInst = liveInstallments[i];

        for (const pay of (dbInst.payment_records ?? [])) {
          plan.recordPayment(
            liveInst.id,
            Money.create(pay.amount, pay.currency),
            new Date(pay.date),
            pay.method,
            pay.receipt_reference
          );
        }
      }
    }

    return plan;
  }
}
