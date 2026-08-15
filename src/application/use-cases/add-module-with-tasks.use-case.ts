import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';
import { EstimationHours } from '@/domain/value-objects/estimation-hours';
import { Money } from '@/domain/value-objects/money';
import {
  AddModuleWithTasksInputSchema,
  type AddModuleWithTasksInputDto,
  type ProjectOutputDto,
} from '../dtos/project.dto';

export class AddModuleWithTasksUseCase {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async execute(rawInput: AddModuleWithTasksInputDto): Promise<ProjectOutputDto> {
    const input = AddModuleWithTasksInputSchema.parse(rawInput);

    const project = await this.projectRepo.findById(input.projectId);
    if (!project) {
      throw new Error(`El proyecto con ID ${input.projectId} no existe.`);
    }

    project.addModule({
      name: input.moduleName,
      description: input.moduleDescription,
      tasks: input.tasks.map((t) => ({
        name: t.name,
        roleId: t.roleId,
        hourlyRateAtQuotation: Money.create(t.hourlyRate, project.currency),
        estimation: EstimationHours.create({
          optimistic: t.optimisticHours,
          probable: t.probableHours,
          pessimistic: t.pessimisticHours,
        }),
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
