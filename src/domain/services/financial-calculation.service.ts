import { Money } from '../value-objects/money';
import { Percentage } from '../value-objects/percentage';

export interface FinancialCalculationInput {
  laborCost: Money;
  externalCosts: Money;
  contingency: Percentage;
  margin: Percentage;
  tax: Percentage;
}

export interface FinancialCalculationSummary {
  laborCost: Money;
  externalCosts: Money;
  subtotal: Money;               // laborCost + externalCosts
  contingencyAmount: Money;      // subtotal × contingency%
  operativeBase: Money;          // subtotal + contingencyAmount
  profitMarginAmount: Money;     // operativeBase × margin%
  taxableBase: Money;            // operativeBase + profitMarginAmount
  taxAmount: Money;              // taxableBase × tax%
  totalFinal: Money;             // taxableBase + taxAmount
}

export class FinancialCalculationService {
  public static calculate(input: FinancialCalculationInput): FinancialCalculationSummary {
    const { laborCost, externalCosts, contingency, margin, tax } = input;

    // Mano de obra y costos deben estar en la misma moneda
    const currency = laborCost.currency;
    const subtotal = laborCost.add(externalCosts);

    const contingencyAmount = Money.create(contingency.applyTo(subtotal.amount), currency);
    const operativeBase = subtotal.add(contingencyAmount);

    const profitMarginAmount = Money.create(margin.applyTo(operativeBase.amount), currency);
    const taxableBase = operativeBase.add(profitMarginAmount);

    const taxAmount = Money.create(tax.applyTo(taxableBase.amount), currency);
    const totalFinal = taxableBase.add(taxAmount);

    return {
      laborCost,
      externalCosts,
      subtotal,
      contingencyAmount,
      operativeBase,
      profitMarginAmount,
      taxableBase,
      taxAmount,
      totalFinal,
    };
  }
}
