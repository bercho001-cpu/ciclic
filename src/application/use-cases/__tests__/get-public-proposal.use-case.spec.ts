import { test, expect } from '@playwright/test';
import { GetPublicProposalUseCase } from '../get-public-proposal.use-case';
import { Project } from '@/domain/aggregates/project';
import { PaymentPlan } from '@/domain/aggregates/payment-plan';
import { Money } from '@/domain/value-objects/money';
import { EstimationHours } from '@/domain/value-objects/estimation-hours';
import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';
import type { IPaymentPlanRepository } from '@/domain/repositories/payment-plan.repository.interface';

// ─── In-Memory Repositories ──────────────────────────────────────────────────
class InMemoryProjectRepository implements IProjectRepository {
  private projects = new Map<string, Project>();

  async findById(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  async findByOwnerId(ownerId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter((p) => p.ownerId === ownerId);
  }

  async findByShareToken(shareToken: string): Promise<Project | null> {
    return Array.from(this.projects.values()).find((p) => p.shareToken === shareToken) || null;
  }

  async save(project: Project): Promise<void> {
    this.projects.set(project.id, project);
  }

  async delete(id: string): Promise<void> {
    this.projects.delete(id);
  }
}

class InMemoryPaymentPlanRepository implements IPaymentPlanRepository {
  private plans = new Map<string, PaymentPlan>();

  async findById(id: string): Promise<PaymentPlan | null> {
    return this.plans.get(id) || null;
  }

  async findByProjectId(projectId: string): Promise<PaymentPlan | null> {
    return Array.from(this.plans.values()).find((p) => p.projectId === projectId) || null;
  }

  async save(paymentPlan: PaymentPlan): Promise<void> {
    this.plans.set(paymentPlan.id, paymentPlan);
  }

  async delete(id: string): Promise<void> {
    this.plans.delete(id);
  }
}

test.describe('Use Case: GetPublicProposalUseCase', () => {
  test('should successfully retrieve a public project, budget, and payment plan by its share token', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new GetPublicProposalUseCase(projectRepo, planRepo);

    // Arrange: Create, estimate project and create payment plan
    const project = Project.create({
      name: 'Client Dashboard',
      clientName: 'S.T.A.R. Labs',
      currency: 'USD',
      ownerId: 'owner-abc',
    });
    project.addModule({
      name: 'Auth',
      tasks: [
        {
          name: 'Setup',
          roleId: 'role-dev',
          hourlyRateAtQuotation: Money.create(50, 'USD'),
          estimation: EstimationHours.create({ optimistic: 10, probable: 10, pessimistic: 10 }),
        },
      ],
    });
    project.freezeSnapshots(); // status: QUOTED, laborCost = $500
    await projectRepo.save(project);

    const plan = PaymentPlan.create({
      projectId: project.id,
      totalAmount: Money.create(500, 'USD'),
    });
    plan.generateEvenSplit(1);
    await planRepo.save(plan);

    // Act
    const output = await useCase.execute({ shareToken: project.shareToken });

    // Assert
    expect(output.project.id).toBe(project.id);
    expect(output.budget.totalFinal).toBe(500); // no factors, just subtotal $500
    expect(output.paymentPlan).not.toBeNull();
    expect(output.paymentPlan!.totalAmount).toBe(500);
  });

  test('should throw an error if the public proposal is not found', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new GetPublicProposalUseCase(projectRepo, planRepo);

    await expect(
      useCase.execute({ shareToken: 'invalid-share-token' })
    ).rejects.toThrow();
  });
});
