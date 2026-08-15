import { test, expect } from '@playwright/test';
import { CalculateProjectBudgetUseCase } from '../calculate-project-budget.use-case';
import { Project } from '@/domain/aggregates/project';
import { Money } from '@/domain/value-objects/money';
import { EstimationHours } from '@/domain/value-objects/estimation-hours';
import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';

// ─── In-Memory Repository ────────────────────────────────────────────────────
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

test.describe('Use Case: CalculateProjectBudgetUseCase', () => {
  test('should successfully calculate project budget and freeze rates', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const useCase = new CalculateProjectBudgetUseCase(projectRepo);

    // Arrange: Create project with a task
    const project = Project.create({
      name: 'Web App',
      clientName: 'Lex Corp',
      currency: 'USD',
      ownerId: 'owner-123',
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
    await projectRepo.save(project);

    // Act
    const output = await useCase.execute({
      projectId: project.id,
      externalCosts: 200,
      contingencyPct: 10,
      marginPct: 20,
      taxPct: 21,
    });

    // Assert
    // laborCost: 10 hrs * $50/hr = $500
    // externalCosts: $200
    // subtotal: $700
    // contingency 10%: $70 -> operativeBase: $770
    // margin 20%: $154 -> taxableBase: $924
    // tax 21%: $194.04 -> totalFinal: $1118.04
    expect(output.laborCost).toBe(500);
    expect(output.externalCosts).toBe(200);
    expect(output.subtotal).toBe(700);
    expect(output.contingencyAmount).toBe(70);
    expect(output.operativeBase).toBe(770);
    expect(output.profitMarginAmount).toBe(154);
    expect(output.taxableBase).toBe(924);
    expect(output.taxAmount).toBe(194.04);
    expect(output.totalFinal).toBe(1118.04);

    const updatedProject = await projectRepo.findById(project.id);
    expect(updatedProject!.status).toBe('QUOTED'); // Snapshots frozen and status transitioned
  });

  test('should throw an error if project is not found', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const useCase = new CalculateProjectBudgetUseCase(projectRepo);

    await expect(
      useCase.execute({
        projectId: 'invalid-id',
        externalCosts: 0,
        contingencyPct: 0,
        marginPct: 0,
        taxPct: 0,
      })
    ).rejects.toThrow();
  });
});
