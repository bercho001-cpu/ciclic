import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';
import type { IPaymentPlanRepository } from '@/domain/repositories/payment-plan.repository.interface';
import { PaymentPlan } from '@/domain/aggregates/payment-plan';
import { Money } from '@/domain/value-objects/money';
import {
  GeneratePaymentPlanInputSchema,
  type GeneratePaymentPlanInputDto,
  type PaymentPlanOutputDto,
} from '../dtos/payment-plan.dto';

export class GeneratePaymentPlanUseCase {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly paymentPlanRepo: IPaymentPlanRepository
  ) {}

  async execute(rawInput: GeneratePaymentPlanInputDto): Promise<PaymentPlanOutputDto> {
    const input = GeneratePaymentPlanInputSchema.parse(rawInput);

    const project = await this.projectRepo.findById(input.projectId);
    if (!project) {
      throw new Error(`El proyecto con ID ${input.projectId} no existe.`);
    }

    if (project.status === 'DRAFT') {
      throw new Error('No se puede generar un plan de pagos para un proyecto en estado DRAFT (no cotizado).');
    }

    const totalAmount = Money.create(input.totalAmount, input.currency);
    const plan = PaymentPlan.create({
      projectId: project.id,
      totalAmount,
    });

    if (input.splitType === 'EVEN') {
      if (!input.evenCount) {
        throw new Error('Se requiere evenCount para una división equitativa (EVEN).');
      }
      plan.generateEvenSplit(input.evenCount);
    } else if (input.splitType === 'STANDARD_30_40_30') {
      plan.generateSplit(30, 40, 30);
    } else if (input.splitType === 'CUSTOM') {
      if (!input.customPercentages || input.customPercentages.length === 0) {
        throw new Error('Se requieren customPercentages para una división personalizada (CUSTOM).');
      }
      plan.generateSplit(...input.customPercentages);
    }

    await this.paymentPlanRepo.save(plan);

    return {
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
    };
  }
}
