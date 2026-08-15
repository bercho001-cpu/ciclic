import { test, expect } from '@playwright/test';
import { GeneratePaymentPlanUseCase } from '../generate-payment-plan.use-case';
import { Project } from '@/domain/aggregates/project';
import { PaymentPlan } from '@/domain/aggregates/payment-plan';
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

test.describe('Use Case: GeneratePaymentPlanUseCase', () => {
  test('should successfully generate an even split payment plan', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new GeneratePaymentPlanUseCase(projectRepo, planRepo);

    // Arrange: Save an estimated project
    const project = Project.create({
      name: 'Mobile MVP',
      clientName: 'S.T.A.R. Labs',
      currency: 'USD',
      ownerId: 'owner-777',
    });
    // Set status to QUOTED to simulateestimated project
    project.freezeSnapshots();
    await projectRepo.save(project);

    // Act
    const output = await useCase.execute({
      projectId: project.id,
      totalAmount: 10000,
      currency: 'USD',
      splitType: 'EVEN',
      evenCount: 3,
    });

    // Assert
    expect(output.projectId).toBe(project.id);
    expect(output.totalAmount).toBe(10000);
    expect(output.installments.length).toBe(3);
    // Penny allocation check: 10000 / 3 -> 3333.33, 3333.33, 3333.34
    expect(output.installments[0].amount).toBe(3333.33);
    expect(output.installments[1].amount).toBe(3333.33);
    expect(output.installments[2].amount).toBe(3333.34);

    const savedPlan = await planRepo.findByProjectId(project.id);
    expect(savedPlan).not.toBeNull();
  });

  test('should successfully generate standard 30/40/30 payment plan', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new GeneratePaymentPlanUseCase(projectRepo, planRepo);

    const project = Project.create({
      name: 'Mobile MVP',
      clientName: 'S.T.A.R. Labs',
      currency: 'USD',
      ownerId: 'owner-777',
    });
    project.freezeSnapshots();
    await projectRepo.save(project);

    const output = await useCase.execute({
      projectId: project.id,
      totalAmount: 10000,
      currency: 'USD',
      splitType: 'STANDARD_30_40_30',
    });

    expect(output.installments.length).toBe(3);
    expect(output.installments[0].amount).toBe(3000);
    expect(output.installments[1].amount).toBe(4000);
    expect(output.installments[2].amount).toBe(3000);
  });

  test('should throw an error if custom percentages do not sum up to 100', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const planRepo = new InMemoryPaymentPlanRepository();
    const useCase = new GeneratePaymentPlanUseCase(projectRepo, planRepo);

    const project = Project.create({
      name: 'Mobile MVP',
      clientName: 'S.T.A.R. Labs',
      currency: 'USD',
      ownerId: 'owner-777',
    });
    project.freezeSnapshots();
    await projectRepo.save(project);

    await expect(
      useCase.execute({
        projectId: project.id,
        totalAmount: 10000,
        currency: 'USD',
        splitType: 'CUSTOM',
        customPercentages: [40, 40], // sums to 80% -> Zod or use case should throw
      })
    ).rejects.toThrow();
  });
});
