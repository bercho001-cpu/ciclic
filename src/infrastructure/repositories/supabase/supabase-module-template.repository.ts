import type { SupabaseClient } from '@supabase/supabase-js';
import type { IModuleTemplateRepository } from '../../../domain/repositories/module-template.repository.interface';
import { ModuleTemplate } from '../../../domain/aggregates/module-template';
import { EstimationHours } from '../../../domain/value-objects/estimation-hours';

export class SupabaseModuleTemplateRepository implements IModuleTemplateRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<ModuleTemplate | null> {
    const { data, error } = await this.supabase
      .from('module_templates')
      .select('*, task_templates(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToAggregate(data);
  }

  async findByOwnerId(ownerId: string): Promise<ModuleTemplate[]> {
    const { data, error } = await this.supabase
      .from('module_templates')
      .select('*, task_templates(*)')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row: unknown) => this.mapToAggregate(row));
  }

  async save(template: ModuleTemplate): Promise<void> {
    const { error } = await this.supabase.from('module_templates').upsert({
      id: template.id,
      name: template.name,
      description: template.description,
      owner_id: template.ownerId,
    });

    if (error) throw new Error(`Error al guardar la plantilla: ${error.message}`);

    for (const task of template.tasks) {
      await this.supabase.from('task_templates').upsert({
        id: task.id,
        module_template_id: template.id,
        name: task.name,
        description: task.description ?? null,
        role_id: task.roleId,
        estimated_hours_optimistic: task.estimationHours.optimistic,
        estimated_hours_probable: task.estimationHours.probable,
        estimated_hours_pessimistic: task.estimationHours.pessimistic,
      });
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('module_templates').delete().eq('id', id);
    if (error) throw new Error(`Error al eliminar la plantilla: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToAggregate(row: any): ModuleTemplate {
    return ModuleTemplate.create({
      name: row.name,
      description: row.description ?? '',
      ownerId: row.owner_id,
      tasks: (row.task_templates ?? []).map((t: any) => ({
        name: t.name,
        description: t.description ?? undefined,
        roleId: t.role_id,
        estimationHours: EstimationHours.create({
          optimistic: t.estimated_hours_optimistic,
          probable: t.estimated_hours_probable,
          pessimistic: t.estimated_hours_pessimistic,
        }),
      })),
    });
  }
}
