import type { IProjectRepository } from '@/domain/repositories/project.repository.interface';
import { Project } from '@/domain/aggregates/project';
import {
  CreateProjectInputSchema,
  type CreateProjectInputDto,
  type ProjectOutputDto,
} from '../dtos/project.dto';

export class CreateProjectUseCase {
  constructor(private readonly projectRepo: IProjectRepository) {}

  async execute(rawInput: CreateProjectInputDto): Promise<ProjectOutputDto> {
    const input = CreateProjectInputSchema.parse(rawInput);

    const project = Project.create({
      name: input.name,
      clientName: input.clientName,
      currency: input.currency,
      ownerId: input.ownerId,
    });

    await this.projectRepo.save(project);

    return this.toOutputDto(project);
  }

  private toOutputDto(project: Project): ProjectOutputDto {
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
