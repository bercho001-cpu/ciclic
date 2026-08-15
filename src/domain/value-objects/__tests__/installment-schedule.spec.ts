import { test, expect } from '@playwright/test';
import { InstallmentSchedule, type InstallmentItem } from '../installment-schedule';
import { Money } from '../money';
import { Percentage } from '../percentage';

test.describe('Value Object: InstallmentSchedule (Penny Allocation)', () => {
  test('debe crear un cronograma válido cuando la suma de porcentajes es 100%', async () => {
    const items: InstallmentItem[] = [
      { sequenceNumber: 1, title: 'Anticipo', percentage: Percentage.create(30) },
      { sequenceNumber: 2, title: 'Entrega Beta', percentage: Percentage.create(40) },
      { sequenceNumber: 3, title: 'Pase a Producción', percentage: Percentage.create(30) },
    ];

    const schedule = InstallmentSchedule.create(items);
    expect(schedule.items.length).toBe(3);
    expect(schedule.totalPercentage).toBe(100);
  });

  test('debe rechazar cronogramas donde la suma de porcentajes no sea 100%', async () => {
    const invalidItems: InstallmentItem[] = [
      { sequenceNumber: 1, title: 'Anticipo', percentage: Percentage.create(30) },
      { sequenceNumber: 2, title: 'Entrega Final', percentage: Percentage.create(60) }, // Suma 90%
    ];

    expect(() => InstallmentSchedule.create(invalidItems))
      .toThrow('La suma de los porcentajes de las cuotas debe ser exactamente 100%');
  });

  test('debe distribuir montos exactos en división entera sin residuo', async () => {
    const schedule = InstallmentSchedule.fromEvenSplit(2); // 50% / 50%
    const total = Money.create(1000, 'USD');

    const distributed = schedule.calculateAmountsWithPennyAdjustment(total);
    expect(distributed[0].amount.amount).toBe(500.00);
    expect(distributed[1].amount.amount).toBe(500.00);
    expect(distributed[0].amount.add(distributed[1].amount).amount).toBe(1000.00);
  });

  test('debe resolver el Penny Allocation Problem ajustando el centavo residual en la última cuota', async () => {
    // 3 cuotas iguales de 33.33% sobre un total de $10,000.00
    // 10000 * 0.333333... -> 3333.33 + 3333.33 + 3333.33 = 9999.99 (Falta $0.01)
    const schedule = InstallmentSchedule.fromEvenSplit(3);
    const total = Money.create(10000, 'USD');

    const distributed = schedule.calculateAmountsWithPennyAdjustment(total);
    
    expect(distributed[0].amount.amount).toBe(3333.33);
    expect(distributed[1].amount.amount).toBe(3333.33);
    expect(distributed[2].amount.amount).toBe(3333.34); // Centavo residual asignado a la última cuota

    const totalSum = distributed.reduce((acc, curr) => acc.add(curr.amount), Money.create(0, 'USD'));
    expect(totalSum.amount).toBe(10000.00);
  });

  test('debe permitir generar el esquema estándar 30/40/30 (Anticipo / Beta / Lanzamiento)', async () => {
    const schedule = InstallmentSchedule.fromStandardMilestones(30, 40, 30);
    const total = Money.create(5000, 'USD');

    const distributed = schedule.calculateAmountsWithPennyAdjustment(total);
    expect(distributed[0].amount.amount).toBe(1500.00);
    expect(distributed[1].amount.amount).toBe(2000.00);
    expect(distributed[2].amount.amount).toBe(1500.00);
  });
});
