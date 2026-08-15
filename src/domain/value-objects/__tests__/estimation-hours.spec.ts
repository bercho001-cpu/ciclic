import { test, expect } from '@playwright/test';
import { EstimationHours } from '../estimation-hours';

test.describe('Value Object: EstimationHours (PERT)', () => {
  test('debe calcular las horas estimadas PERT con la fórmula (O + 4M + P) / 6', async () => {
    // Caso estándar: O = 10, M = 20, P = 30 -> (10 + 80 + 30) / 6 = 120 / 6 = 20.00
    const est = EstimationHours.create({ optimistic: 10, probable: 20, pessimistic: 30 });
    expect(est.optimistic).toBe(10);
    expect(est.probable).toBe(20);
    expect(est.pessimistic).toBe(30);
    expect(est.calculatedHours).toBe(20.00);
  });

  test('debe calcular horas ponderadas con decimales y redondeo a 2 cifras', async () => {
    // O = 5, M = 8, P = 15 -> (5 + 32 + 15) / 6 = 52 / 6 = 8.666... -> 8.67
    const est = EstimationHours.create({ optimistic: 5, probable: 8, pessimistic: 15 });
    expect(est.calculatedHours).toBe(8.67);
  });

  test('debe permitir crear horas fijas (modo directo) donde O = M = P', async () => {
    const est = EstimationHours.fromFixed(40);
    expect(est.optimistic).toBe(40);
    expect(est.probable).toBe(40);
    expect(est.pessimistic).toBe(40);
    expect(est.calculatedHours).toBe(40.00);
  });

  test('debe rechazar horas negativas', async () => {
    expect(() => EstimationHours.create({ optimistic: -1, probable: 5, pessimistic: 10 }))
      .toThrow('Las horas de estimación no pueden ser negativas');
  });

  test('debe lanzar error de invariante si Optimista > Probable', async () => {
    expect(() => EstimationHours.create({ optimistic: 25, probable: 20, pessimistic: 30 }))
      .toThrow('Invariante violada: Optimista <= Probable <= Pesimista');
  });

  test('debe lanzar error de invariante si Probable > Pesimista', async () => {
    expect(() => EstimationHours.create({ optimistic: 10, probable: 35, pessimistic: 30 }))
      .toThrow('Invariante violada: Optimista <= Probable <= Pesimista');
  });

  test('debe permitir O = Probable = Pesimista sin error', async () => {
    const est = EstimationHours.create({ optimistic: 12, probable: 12, pessimistic: 12 });
    expect(est.calculatedHours).toBe(12.00);
  });

  test('debe comparar igualdad por valor', async () => {
    const e1 = EstimationHours.create({ optimistic: 10, probable: 20, pessimistic: 30 });
    const e2 = EstimationHours.create({ optimistic: 10, probable: 20, pessimistic: 30 });
    const e3 = EstimationHours.create({ optimistic: 10, probable: 20, pessimistic: 40 });

    expect(e1.equals(e2)).toBe(true);
    expect(e1.equals(e3)).toBe(false);
  });
});
