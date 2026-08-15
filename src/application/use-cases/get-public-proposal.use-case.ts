import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';
import type { IPaymentPlanRepository } from '@/domain/repositories/payment-plan.repository.interface';
import { FinancialCalculationService } from '@/domain/services/financial-calculation.service';
import { Money } from '@/domain/value-objects/money';
import { Percentage } from '@/domain/value-objects/percentage';
import type { ProjectOutputDto, BudgetSummaryOutputDto } from '../dtos/project.dto';
import type { PaymentPlanOutputDto } from '../dtos/payment-plan.dto';

interface GetPublicProposalOutput {
  project: ProjectOutputDto;
  budget: BudgetSummaryOutputDto;
  paymentPlan: PaymentPlanOutputDto | null;
}

export class GetPublicProposalUseCase {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly paymentPlanRepo: IPaymentPlanRepository
  ) {}

  async execute(input: { shareToken: string }): Promise<GetPublicProposalOutput> {
    if (!input.shareToken) {
      throw new Error('El token de propuesta compartida es requerido.');
    }

    const project = await this.projectRepo.findByShareToken(input.shareToken);
    if (!project) {
      throw new Error('La propuesta compartida no existe o no se encuentra disponible.');
    }

    // Since the project in our simplified domain model only calculates laborCost,
    // we use default 0/empty factors for the rest of the public budget summary
    const laborCost = project.calculateLaborCost();
    const zeroExternal = Money.create(0, project.currency);
    const zeroPct = Percentage.create(0);

    const summary = FinancialCalculationService.calculate({
      laborCost,
      externalCosts: zeroExternal,
      contingency: zeroPct,
      margin: zeroPct,
      tax: zeroPct,
    });

    const plan = await this.paymentPlanRepo.findByProjectId(project.id);

    return {
      project: {
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        currency: project.currency,
        ownerId: project.ownerId,
        status: project.status,
        shareToken: project.shareToken,
        totalEstimatedHours: project.totalEstimatedHours,
        moduleCount: project.modules.length,
      },
      budget: {
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
      },
      paymentPlan: plan
        ? {
            id: plan.id,
            projectId: plan.projectId,
            totalAmount: plan.totalAmount.amount,
            currency: plan.totalAmount.currency,
            installments: plan.installments.map((inst) => ({
              id: inst.id,
              sequenceNumber: inst.sequenceNumber,
              title: inst.title,
              amount: inst.amount.amount,
              paidAmount: inst.paidAmount.amount,
              remainingAmount: inst.remainingAmount.amount,
              status: inst.status,
              currency: inst.amount.currency,
            })),
          }
        : null,
    };
  }
}
