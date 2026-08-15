import { test, expect } from '@playwright/test';
import { Percentage } from '../percentage';

test.describe('Value Object: Percentage', () => {
  test('debe crear un porcentaje válido dentro del rango [0, 100]', async () => {
    const p = Percentage.create(20);
    expect(p.value).toBe(20);
    expect(p.asDecimal()).toBe(0.20);
  });

  test('debe admitir valores límite 0 y 100', async () => {
    const pZero = Percentage.create(0);
    expect(pZero.value).toBe(0);
    expect(pZero.asDecimal()).toBe(0);

    const pMax = Percentage.create(100);
    expect(pMax.value).toBe(100);
    expect(pMax.asDecimal()).toBe(1.0);
  });

  test('debe rechazar porcentajes menores a 0', async () => {
    expect(() => Percentage.create(-5)).toThrow('El porcentaje debe estar entre 0% y 100%');
  });

  test('debe rechazar porcentajes mayores a 100', async () => {
    expect(() => Percentage.create(100.5)).toThrow('El porcentaje debe estar entre 0% y 100%');
  });

  test('debe calcular el monto porcentual aplicado a un valor numérico', async () => {
    const p = Percentage.create(15);
    expect(p.applyTo(1000)).toBe(150.00);

    const pWithDecimal = Percentage.create(21);
    expect(pWithDecimal.applyTo(6864)).toBe(1441.44);
  });

  test('debe comparar igualdad por valor numérico', async () => {
    const p1 = Percentage.create(25);
    const p2 = Percentage.create(25.0);
    const p3 = Percentage.create(30);

    expect(p1.equals(p2)).toBe(true);
    expect(p1.equals(p3)).toBe(false);
  });
});
