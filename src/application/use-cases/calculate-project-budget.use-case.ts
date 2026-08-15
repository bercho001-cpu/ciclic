import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';
import { FinancialCalculationService } from '@/domain/services/financial-calculation.service';
import { Money } from '@/domain/value-objects/money';
import { Percentage } from '@/domain/value-objects/percentage';
import {
  CalculateProjectBudgetInputSchema,
  type CalculateProjectBudgetInputDto,
  type BudgetSummaryOutputDto,
} from '../dtos/project.dto';

export class CalculateProjectBudgetUseCase {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async execute(rawInput: CalculateProjectBudgetInputDto): Promise<BudgetSummaryOutputDto> {
    const input = CalculateProjectBudgetInputSchema.parse(rawInput);

    const project = await this.projectRepo.findById(input.projectId);
    if (!project) {
      throw new Error(`El proyecto con ID ${input.projectId} no existe.`);
    }

    const laborCost = project.calculateLaborCost();
    const externalCosts = Money.create(input.externalCosts, project.currency);
    const contingency = Percentage.create(input.contingencyPct);
    const margin = Percentage.create(input.marginPct);
    const tax = Percentage.create(input.taxPct);

    const summary = FinancialCalculationService.calculate({
      laborCost,
      externalCosts,
      contingency,
      margin,
      tax,
    });

    // Freeze snapshots and transition state to QUOTED
    project.freezeSnapshots();
    await this.projectRepo.save(project);

    return {
      projectId: project.id,
      currency: project.currency,
      laborCost: summary.laborCost.amount,
      externalCosts: summary.externalCosts.amount,
      subtotal: summary.subtotal.amount,
      contingencyAmount: summary.contingencyAmount.amount,
      operativeBase: summary.operativeBase.amount,
      profitMarginAmount: summary.profitMarginAmount.amount,
      taxableBase: summary.taxableBase.amount,
      taxAmount: summary.taxAmount.amount,
      totalFinal: summary.totalFinal.amount,
    };
  }
}
