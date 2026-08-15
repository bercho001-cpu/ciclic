import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';
import type { IModuleTemplateRepository } from '@/domain/repositories/module-template.repository.interface';
import { Money } from '@/domain/value-objects/money';
import {
  CloneModuleTemplateInputSchema,
  type CloneModuleTemplateInputDto,
} from '../dtos/module-template.dto';
import type { ProjectOutputDto } from '../dtos/project.dto';

export class CloneModuleTemplateToProjectUseCase {
  constructor(
    private readonly projectRepo: IProjectRepository,
    private readonly templateRepo: IModuleTemplateRepository
  ) {}

  async execute(rawInput: CloneModuleTemplateInputDto): Promise<ProjectOutputDto> {
    const input = CloneModuleTemplateInputSchema.parse(rawInput);

    const template = await this.templateRepo.findById(input.templateId);
    if (!template) {
      throw new Error(`La plantilla de módulo con ID ${input.templateId} no existe.`);
    }

    const project = await this.projectRepo.findById(input.projectId);
    if (!project) {
      throw new Error(`El proyecto con ID ${input.projectId} no existe.`);
    }

    const clonedTasks = template.cloneTasksForProject(project.id);

    project.addModule({
      name: template.name,
      description: template.description,
      tasks: clonedTasks.map((t) => ({
        name: t.name,
        roleId: t.roleId,
        hourlyRateAtQuotation: Money.create(input.defaultHourlyRate, input.currency),
        estimation: t.estimation,
        description: t.description,
      })),
    });

    await this.projectRepo.save(project);

    return {
      id: project.id,
      name: project.name,
      clientName: project.clientName,
      currency: project.currency,
      ownerId: project.ownerId,
      status: project.status,
      shareToken: project.shareToken,
      totalEstimatedHours: project.totalEstimatedHours,
      moduleCount: project.modules.length,
    };
  }
}
