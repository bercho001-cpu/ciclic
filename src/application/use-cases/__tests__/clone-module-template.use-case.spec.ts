import { test, expect } from '@playwright/test';
import { CloneModuleTemplateToProjectUseCase } from '../clone-module-template.use-case';
import { Project } from '@/domain/aggregates/project';
import { ModuleTemplate } from '@/domain/aggregates/module-template';
import { EstimationHours } from '@/domain/value-objects/estimation-hours';
import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';
import type { IModuleTemplateRepository } from '@/domain/repositories/module-template.repository.interface';

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

class InMemoryModuleTemplateRepository implements IModuleTemplateRepository {
  private templates = new Map<string, ModuleTemplate>();

  async findById(id: string): Promise<ModuleTemplate | null> {
    return this.templates.get(id) || null;
  }

  async findGlobals(): Promise<ModuleTemplate[]> {
    return Array.from(this.templates.values()).filter((t) => t.ownerId === 'global');
  }

  async findByOwnerId(ownerId: string): Promise<ModuleTemplate[]> {
    return Array.from(this.templates.values()).filter((t) => t.ownerId === ownerId);
  }

  async save(template: ModuleTemplate): Promise<void> {
    this.templates.set(template.id, template);
  }

  async delete(id: string): Promise<void> {
    this.templates.delete(id);
  }
}

test.describe('Use Case: CloneModuleTemplateToProjectUseCase', () => {
  test('should successfully clone a template module to a project', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const templateRepo = new InMemoryModuleTemplateRepository();
    const useCase = new CloneModuleTemplateToProjectUseCase(projectRepo, templateRepo);

    // Arrange: Create and save project & template
    const project = Project.create({
      name: 'Mobile App',
      clientName: 'Wayne Enterprises',
      currency: 'USD',
      ownerId: 'owner-123',
    });
    await projectRepo.save(project);

    const template = ModuleTemplate.create({
      name: 'Authentication UI',
      description: 'Sign in and Sign up screen template',
      ownerId: 'global',
      tasks: [
        {
          name: 'Create design layouts',
          estimationHours: EstimationHours.create({ optimistic: 2, probable: 4, pessimistic: 6 }),
          roleId: 'role-designer',
          description: 'Figma mockups and wireframes',
        },
      ],
    });
    await templateRepo.save(template);

    // Act
    const output = await useCase.execute({
      templateId: template.id,
      projectId: project.id,
      defaultHourlyRate: 60,
      currency: 'USD',
    });

    // Assert
    expect(output.id).toBe(project.id);
    expect(output.moduleCount).toBe(1);
    expect(output.totalEstimatedHours).toBe(4);

    const updatedProject = await projectRepo.findById(project.id);
    expect(updatedProject).not.toBeNull();
    expect(updatedProject!.modules[0].name).toBe('Authentication UI');
    expect(updatedProject!.modules[0].tasks[0].hourlyRateAtQuotation.amount).toBe(60);
    expect(updatedProject!.modules[0].tasks[0].hourlyRateAtQuotation.currency).toBe('USD');
  });

  test('should throw an error if template does not exist', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const templateRepo = new InMemoryModuleTemplateRepository();
    const useCase = new CloneModuleTemplateToProjectUseCase(projectRepo, templateRepo);

    await expect(
      useCase.execute({
        templateId: 'invalid-template',
        projectId: 'some-project',
        defaultHourlyRate: 50,
        currency: 'USD',
      })
    ).rejects.toThrow();
  });
});
