import { test, expect } from '@playwright/test';
import { PaymentPlan } from '../payment-plan';
import { Money } from '../../value-objects/money';

test.describe('Aggregate: PaymentPlan (Penny Allocation & Partial Payments)', () => {
  const makeTotal = (amount = 10000) => Money.create(amount, 'USD');

  test('debe crear un plan de pagos con estado PENDING y sin cuotas', async () => {
    const plan = PaymentPlan.create({ projectId: 'p-1', totalAmount: makeTotal() });
    expect(plan.projectId).toBe('p-1');
    expect(plan.totalAmount.amount).toBe(10000);
    expect(plan.installments).toHaveLength(0);
  });

  test('debe generar 3 cuotas con distribución 30/40/30 exacta', async () => {
    const plan = PaymentPlan.create({ projectId: 'p-1', totalAmount: makeTotal(5000) });
    plan.generateSplit(30, 40, 30);

    const inst = plan.installments;
    expect(inst).toHaveLength(3);
    expect(inst[0].amount.amount).toBe(1500.00); // 30% de 5000
    expect(inst[1].amount.amount).toBe(2000.00); // 40% de 5000
    expect(inst[2].amount.amount).toBe(1500.00); // 30% de 5000
  });

  test('debe resolver el Penny Allocation Problem en cuotas iguales', async () => {
    const plan = PaymentPlan.create({ projectId: 'p-1', totalAmount: makeTotal(10000) });
    plan.generateEvenSplit(3);

    const inst = plan.installments;
    expect(inst[0].amount.amount).toBe(3333.33);
    expect(inst[1].amount.amount).toBe(3333.33);
    expect(inst[2].amount.amount).toBe(3333.34); // centavo residual

    const sum = inst.reduce((acc, i) => acc + i.amount.amount, 0);
    expect(Math.round(sum * 100) / 100).toBe(10000.00);
  });

  test('debe registrar un pago parcial y actualizar el estado a PARTIALLY_PAID', async () => {
    const plan = PaymentPlan.create({ projectId: 'p-1', totalAmount: makeTotal(1000) });
    plan.generateEvenSplit(2); // 2 cuotas de $500

    const installment1 = plan.installments[0];

    plan.recordPayment(installment1.id, Money.create(200, 'USD'), new Date(), 'TRANSFER', 'Recibo 001');

    const updated = plan.getInstallmentById(installment1.id)!;
    expect(updated.status).toBe('PARTIALLY_PAID');
    expect(updated.paidAmount.amount).toBe(200.00);
    expect(updated.remainingAmount.amount).toBe(300.00);
  });

  test('debe transicionar a PAID al completar el monto total de una cuota', async () => {
    const plan = PaymentPlan.create({ projectId: 'p-1', totalAmount: makeTotal(1000) });
    plan.generateEvenSplit(2);

    const installment1 = plan.installments[0];

    plan.recordPayment(installment1.id, Money.create(200, 'USD'), new Date(), 'TRANSFER', 'Recibo 001');
    plan.recordPayment(installment1.id, Money.create(300, 'USD'), new Date(), 'TRANSFER', 'Recibo 002');

    const updated = plan.getInstallmentById(installment1.id)!;
    expect(updated.status).toBe('PAID');
    expect(updated.paidAmount.amount).toBe(500.00);
    expect(updated.remainingAmount.amount).toBe(0.00);
  });

  test('debe rechazar pagos que excedan el monto de la cuota', async () => {
    const plan = PaymentPlan.create({ projectId: 'p-1', totalAmount: makeTotal(1000) });
    plan.generateEvenSplit(2); // 2 cuotas de $500

    const installment1 = plan.installments[0];

    expect(() =>
      plan.recordPayment(installment1.id, Money.create(600, 'USD'), new Date(), 'CASH', 'Recibo 001')
    ).toThrow('El pago excede el monto pendiente de la cuota');
  });

  test('debe calcular el balance financiero global del plan', async () => {
    const plan = PaymentPlan.create({ projectId: 'p-1', totalAmount: makeTotal(1000) });
    plan.generateEvenSplit(2); // 2 cuotas de $500

    const installment1 = plan.installments[0];
    plan.recordPayment(installment1.id, Money.create(300, 'USD'), new Date(), 'TRANSFER', 'Recibo 001');

    const balance = plan.getBalance();
    expect(balance.totalBilled.amount).toBe(1000.00);
    expect(balance.totalCollected.amount).toBe(300.00);
    expect(balance.totalPending.amount).toBe(700.00);
  });

  test('debe rechazar un split cuyos porcentajes no sumen 100%', async () => {
    const plan = PaymentPlan.create({ projectId: 'p-1', totalAmount: makeTotal() });
    expect(() => plan.generateSplit(30, 30, 30)).toThrow(
      'La suma de los porcentajes de las cuotas debe ser exactamente 100%'
    );
  });
});
