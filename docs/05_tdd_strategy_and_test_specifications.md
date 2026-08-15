# 🧪 Estrategia TDD y Especificaciones de Pruebas — Ciclic

## 1. Filosofía Test-Driven Development (TDD) en Ciclic

En Ciclic, **ninguna lógica de negocio o cálculo monetario se implementa sin una prueba previa que falle**. El ciclo de desarrollo sigue estrictamente:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. 🔴 RED: Escribir test unitario que falla (Define contrato) │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 2. 🟢 GREEN: Escribir el código mínimo para que pase el test │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│ 3. 🔵 REFACTOR: Limpiar, optimizar y aplicar SOLID/DRY      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Configuración del Entorno de Pruebas (Vitest)

Utilizamos **Vitest** por su velocidad instantánea, soporte nativo de TypeScript y compatibilidad total con `describe`/`it`/`expect`.

### Archivo de Configuración (`vitest.config.ts`):
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 90,
      functions: 90,
      branches: 85,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 3. Especificación de Suites de Pruebas de Dominio

### Suite 1: Value Object `Money` (`src/domain/value-objects/__tests__/money.spec.ts`)
- [ ] Debe crear una instancia válida de `Money` con monto y moneda predeterminada USD.
- [ ] Debe lanzar error si el monto es negativo.
- [ ] Debe redondear correctamente a 2 decimales sin errores de coma flotante de JS (ej. `0.1 + 0.2 = 0.30`).
- [ ] Debe sumar y restar dos montos de la misma moneda.
- [ ] Debe lanzar error si se intentan sumar dos monedas distintas sin tasa de conversión.
- [ ] Debe multiplicar por un factor o porcentaje conservando el redondeo financiero estándar.

```typescript
import { describe, it, expect } from 'vitest';
import { Money } from '../money';

describe('Value Object: Money', () => {
  it('debe redondear y sumar sin error de punto flotante', () => {
    const m1 = Money.create(19.99, 'USD');
    const m2 = Money.create(10.01, 'USD');
    const result = m1.add(m2);
    expect(result.amount).toBe(30.00);
    expect(result.currency).toBe('USD');
  });

  it('debe rechazar montos negativos', () => {
    expect(() => Money.create(-50, 'USD')).toThrow('El monto no puede ser negativo');
  });
});
```

---

### Suite 2: Estimación PERT (`src/domain/value-objects/__tests__/estimation-hours.spec.ts`)
- [ ] Debe calcular las horas esperadas según la fórmula: $(O + 4M + P) / 6$.
- [ ] Debe lanzar error si $Optimista > Más Probable$ o $Más Probable > Pesimista$.
- [ ] Debe calcular correctamente el caso estándar (ej. $O=10, M=20, P=30 \implies (10 + 80 + 30)/6 = 20$ horas).

```typescript
import { describe, it, expect } from 'vitest';
import { EstimationHours } from '../estimation-hours';

describe('Value Object: EstimationHours (PERT)', () => {
  it('debe calcular las horas ponderadas correctamente', () => {
    const estimation = EstimationHours.create({ optimistic: 10, probable: 20, pessimistic: 30 });
    expect(estimation.calculatedHours).toBe(20);
  });

  it('debe lanzar error de invariante si pesimista es menor que optimista', () => {
    expect(() => EstimationHours.create({ optimistic: 50, probable: 20, pessimistic: 10 }))
      .toThrow('Invariante violada: Optimista <= Probable <= Pesimista');
  });
});
```

---

### Suite 3: Motor Financiero (`src/domain/services/__tests__/financial-calculation.service.spec.ts`)
- [ ] Debe calcular el costo total de mano de obra sumando todas las tareas y sus tarifas de rol.
- [ ] Debe aplicar el porcentaje de contingencia sobre el subtotal operativo.
- [ ] Debe aplicar el margen de ganancia sobre el costo con contingencia.
- [ ] Debe aplicar los impuestos al final sobre la base imponible.
- [ ] Caso de prueba numérico completo:
  - Mano de obra: $100 hrs a $50/hr = $5,000 USD
  - Costos fijos (Servidor): $200 USD
  - Subtotal = $5,200 USD
  - Contingencia 10%: $520 USD $\implies$ Base = $5,720 USD
  - Margen de ganancia 20%: $1,144 USD $\implies$ Base Imponible = $6,864 USD
  - IVA 21%: $1,441.44 USD $\implies$ Total Final = $8,305.44 USD

```typescript
import { describe, it, expect } from 'vitest';
import { FinancialCalculationService } from '../financial-calculation.service';
import { Money } from '../../value-objects/money';
import { Percentage } from '../../value-objects/percentage';

describe('Domain Service: FinancialCalculationService', () => {
  it('debe calcular la liquidación completa del proyecto con precisión matemática', () => {
    const laborCost = Money.create(5000, 'USD');
    const externalCosts = Money.create(200, 'USD');
    const contingency = Percentage.create(10);
    const margin = Percentage.create(20);
    const tax = Percentage.create(21);

    const summary = FinancialCalculationService.calculate({
      laborCost,
      externalCosts,
      contingency,
      margin,
      tax,
    });

    expect(summary.subtotal.amount).toBe(5200.00);
    expect(summary.contingencyAmount.amount).toBe(520.00);
    expect(summary.profitMarginAmount.amount).toBe(1144.00);
    expect(summary.taxableBase.amount).toBe(6864.00);
    expect(summary.taxAmount.amount).toBe(1441.44);
    expect(summary.totalFinal.amount).toBe(8305.44);
  });
});
```

---

### Suite 4: Esquema de Cuotas (`src/domain/aggregates/__tests__/payment-plan.spec.ts`)
- [ ] Debe dividir un total de $10,000 en 3 cuotas (30%, 40%, 30%) generando montos exactos ($3,000, $4,000, $3,000).
- [ ] Debe lanzar error si la suma de porcentajes no es 100%.
- [ ] Debe registrar un pago parcial o total en una cuota y actualizar su estado a `PAID`.
- [ ] Debe calcular el balance total cobrado vs pendiente.
