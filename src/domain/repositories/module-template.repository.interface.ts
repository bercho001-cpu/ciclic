import type { ModuleTemplate } from '../aggregates/module-template';

export interface IModuleTemplateRepository {
  findById(id: string): Promise<ModuleTemplate | null>;
  findByOwnerId(ownerId: string): Promise<ModuleTemplate[]>;
  save(template: ModuleTemplate): Promise<void>;
  delete(id: string): Promise<void>;
}
