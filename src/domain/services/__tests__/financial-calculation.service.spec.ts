import { test, expect } from '@playwright/test';
import { FinancialCalculationService } from '../financial-calculation.service';
import { Money } from '../../value-objects/money';
import { Percentage } from '../../value-objects/percentage';

test.describe('Domain Service: FinancialCalculationService', () => {
  test('debe calcular el subtotal de mano de obra + costos externos', async () => {
    const laborCost = Money.create(5000, 'USD');
    const externalCosts = Money.create(400, 'USD');

    const summary = FinancialCalculationService.calculate({
      laborCost,
      externalCosts,
      contingency: Percentage.create(0),
      margin: Percentage.create(0),
      tax: Percentage.create(0),
    });

    expect(summary.subtotal.amount).toBe(5400.00);
  });

  test('debe aplicar la contingencia sobre el subtotal', async () => {
    const laborCost = Money.create(5000, 'USD');
    const externalCosts = Money.create(400, 'USD');
    const contingency = Percentage.create(10); // 10% de 5400 = 540

    const summary = FinancialCalculationService.calculate({
      laborCost,
      externalCosts,
      contingency,
      margin: Percentage.create(0),
      tax: Percentage.create(0),
    });

    expect(summary.contingencyAmount.amount).toBe(540.00);
    expect(summary.operativeBase.amount).toBe(5940.00);
  });

  test('debe aplicar el margen de ganancia sobre la base operativa con riesgo', async () => {
    const summary = FinancialCalculationService.calculate({
      laborCost: Money.create(5000, 'USD'),
      externalCosts: Money.create(400, 'USD'),
      contingency: Percentage.create(10),
      margin: Percentage.create(20), // 20% de 5940 = 1188
      tax: Percentage.create(0),
    });

    expect(summary.profitMarginAmount.amount).toBe(1188.00);
    expect(summary.taxableBase.amount).toBe(7128.00);
  });

  test('debe calcular la liquidación completa del proyecto con precisión matemática en cascada', async () => {
    const summary = FinancialCalculationService.calculate({
      laborCost: Money.create(5000, 'USD'),
      externalCosts: Money.create(400, 'USD'),  // $200 puntual + ($50 * 4) recurrente
      contingency: Percentage.create(10),
      margin: Percentage.create(20),
      tax: Percentage.create(21), // IVA 21% de 7128 = 1496.88
    });

    expect(summary.subtotal.amount).toBe(5400.00);
    expect(summary.contingencyAmount.amount).toBe(540.00);
    expect(summary.operativeBase.amount).toBe(5940.00);
    expect(summary.profitMarginAmount.amount).toBe(1188.00);
    expect(summary.taxableBase.amount).toBe(7128.00);
    expect(summary.taxAmount.amount).toBe(1496.88);
    expect(summary.totalFinal.amount).toBe(8624.88);
  });

  test('debe calcular sin contingencia ni margen ni impuesto (paso a paso cero)', async () => {
    const summary = FinancialCalculationService.calculate({
      laborCost: Money.create(1000, 'USD'),
      externalCosts: Money.create(0, 'USD'),
      contingency: Percentage.create(0),
      margin: Percentage.create(0),
      tax: Percentage.create(0),
    });

    expect(summary.subtotal.amount).toBe(1000.00);
    expect(summary.totalFinal.amount).toBe(1000.00);
  });

  test('debe preservar la moneda de la mano de obra en todos los campos calculados', async () => {
    const summary = FinancialCalculationService.calculate({
      laborCost: Money.create(2000, 'EUR'),
      externalCosts: Money.create(500, 'EUR'),
      contingency: Percentage.create(5),
      margin: Percentage.create(15),
      tax: Percentage.create(10),
    });

    expect(summary.subtotal.currency).toBe('EUR');
    expect(summary.totalFinal.currency).toBe('EUR');
  });
});
