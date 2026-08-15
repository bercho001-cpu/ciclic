import { test, expect } from '@playwright/test';
import { Money } from '../money';

test.describe('Value Object: Money', () => {
  test('debe crear una instancia válida de Money con moneda USD por defecto', async () => {
    const money = Money.create(150.50);
    expect(money.amount).toBe(150.50);
    expect(money.currency).toBe('USD');
  });

  test('debe permitir especificar una moneda personalizada válida', async () => {
    const money = Money.create(1000, 'EUR');
    expect(money.amount).toBe(1000);
    expect(money.currency).toBe('EUR');
  });

  test('debe lanzar error si el monto es negativo', async () => {
    expect(() => Money.create(-50, 'USD')).toThrow('El monto no puede ser negativo');
  });

  test('debe redondear automáticamente a 2 decimales sin errores de coma flotante', async () => {
    const m1 = Money.create(19.99, 'USD');
    const m2 = Money.create(10.01, 'USD');
    const sum = m1.add(m2);
    expect(sum.amount).toBe(30.00);

    const mFloat = Money.create(0.1 + 0.2, 'USD');
    expect(mFloat.amount).toBe(0.30);
  });

  test('debe sumar y restar montos con la misma moneda', async () => {
    const m1 = Money.create(100, 'USD');
    const m2 = Money.create(40, 'USD');

    expect(m1.add(m2).amount).toBe(140.00);
    expect(m1.subtract(m2).amount).toBe(60.00);
  });

  test('debe lanzar error al restar si el resultado es negativo', async () => {
    const m1 = Money.create(50, 'USD');
    const m2 = Money.create(100, 'USD');
    expect(() => m1.subtract(m2)).toThrow('El monto no puede ser negativo');
  });

  test('debe rechazar operaciones aritméticas entre monedas diferentes', async () => {
    const usd = Money.create(100, 'USD');
    const eur = Money.create(100, 'EUR');
    expect(() => usd.add(eur)).toThrow('No se pueden operar montos con distintas monedas: USD y EUR');
    expect(() => usd.subtract(eur)).toThrow('No se pueden operar montos con distintas monedas: USD y EUR');
  });

  test('debe multiplicar por un factor numérico manteniendo 2 decimales', async () => {
    const base = Money.create(100, 'USD');
    const multiplied = base.multiply(1.215); // 121.5 -> redondeo financiero 121.50
    expect(multiplied.amount).toBe(121.50);
  });

  test('debe comparar igualdad por valor (amount y currency)', async () => {
    const m1 = Money.create(100, 'USD');
    const m2 = Money.create(100, 'USD');
    const m3 = Money.create(100, 'EUR');
    const m4 = Money.create(200, 'USD');

    expect(m1.equals(m2)).toBe(true);
    expect(m1.equals(m3)).toBe(false);
    expect(m1.equals(m4)).toBe(false);
  });

  test('debe formatear el monto con el código de moneda', async () => {
    const money = Money.create(1500.5, 'USD');
    expect(money.format()).toContain('1,500.50');
    expect(money.format()).toContain('USD');
  });
});
