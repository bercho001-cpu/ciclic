import { test, expect } from '@playwright/test';
import { AddModuleWithTasksUseCase } from '../add-module-with-tasks.use-case';
import { Project } from '@/domain/aggregates/project';
import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';

// ─── In-Memory Repository Mock ───────────────────────────────────────────────
class InMemoryProjectRepository implements IProjectRepository {
  private projects = new Map<string, Project>();

  async findById(id: string): Promise<Project | null> {
    const project = this.projects.get(id);
    return project || null;
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

test.describe('Use Case: AddModuleWithTasksUseCase', () => {
  test('should successfully add a module with tasks to an existing project', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const useCase = new AddModuleWithTasksUseCase(projectRepo);

    // Arrange: Save a draft project
    const project = Project.create({
      name: 'E-commerce App',
      clientName: 'Stark Industries',
      currency: 'USD',
      ownerId: 'owner-123',
    });
    await projectRepo.save(project);

    // Act
    const output = await useCase.execute({
      projectId: project.id,
      moduleName: 'Authentication',
      moduleDescription: 'User login and registration',
      tasks: [
        {
          name: 'OAuth integration',
          roleId: 'role-dev',
          hourlyRate: 50,
          optimisticHours: 4,
          probableHours: 8,
          pessimisticHours: 16,
          description: 'Google and GitHub oauth login',
        },
      ],
    });

    // Assert
    expect(output.id).toBe(project.id);
    expect(output.moduleCount).toBe(1);
    expect(output.totalEstimatedHours).toBe(8.67); // PERT: (4 + 4*8 + 16)/6 = 52/6 = 8.6666... rounded to 8.67

    const updatedProject = await projectRepo.findById(project.id);
    expect(updatedProject).not.toBeNull();
    expect(updatedProject!.modules.length).toBe(1);
    expect(updatedProject!.modules[0].name).toBe('Authentication');
    expect(updatedProject!.modules[0].tasks.length).toBe(1);
  });

  test('should throw an error if the project does not exist', async () => {
    const projectRepo = new InMemoryProjectRepository();
    const useCase = new AddModuleWithTasksUseCase(projectRepo);

    await expect(
      useCase.execute({
        projectId: 'non-existent-id',
        moduleName: 'Auth',
        tasks: [],
      })
    ).rejects.toThrow();
  });
});
