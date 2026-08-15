import type { SupabaseClient } from '@supabase/supabase-js';
import type { IProjectRepository } from '../../../domain/repositories/project.repository.interface';
import { Project, type ProjectStatus } from '../../../domain/aggregates/project';
import { EstimationHours } from '../../../domain/value-objects/estimation-hours';
import { Money } from '../../../domain/value-objects/money';

/**
 * Repositorio concreto de Project que persiste en Supabase (PostgreSQL).
 * Implementa la interfaz IProjectRepository (Puerto del dominio).
 */
export class SupabaseProjectRepository implements IProjectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findById(id: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, modules(*, tasks(*))')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToAggregate(data);
  }

  async findByOwnerId(ownerId: string): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, modules(*, tasks(*))')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((row: unknown) => this.mapToAggregate(row));
  }

  async findByShareToken(shareToken: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*, modules(*, tasks(*))')
      .eq('share_token', shareToken)
      .single();

    if (error || !data) return null;
    return this.mapToAggregate(data);
  }

  async save(project: Project): Promise<void> {
    const { error } = await this.supabase.from('projects').upsert({
      id: project.id,
      name: project.name,
      client_name: project.clientName,
      currency: project.currency,
      owner_id: project.ownerId,
      status: project.status,
      share_token: project.shareToken,
    });

    if (error) throw new Error(`Error al guardar el proyecto: ${error.message}`);

    // Persistir módulos y tareas
    for (const mod of project.modules) {
      await this.supabase.from('modules').upsert({
        id: mod.id,
        project_id: project.id,
        name: mod.name,
        description: mod.description ?? null,
      });

      for (const task of mod.tasks) {
        await this.supabase.from('tasks').upsert({
          id: task.id,
          module_id: mod.id,
          name: task.name,
          description: task.description ?? null,
          role_id: task.roleId,
          estimated_hours_optimistic: task.estimation.optimistic,
          estimated_hours_probable: task.estimation.probable,
          estimated_hours_pessimistic: task.estimation.pessimistic,
          hourly_rate_at_quotation: task.hourlyRateAtQuotation.amount,
          hourly_rate_snapshot: task.hourlyRateSnapshot?.amount ?? null,
          currency: task.hourlyRateAtQuotation.currency,
        });
      }
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('projects').delete().eq('id', id);
    if (error) throw new Error(`Error al eliminar el proyecto: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToAggregate(row: any): Project {
    const project = Project.create({
      name: row.name,
      clientName: row.client_name,
      currency: row.currency,
      ownerId: row.owner_id,
      shareToken: row.share_token,
    });

    // Re-hidratar módulos y tareas
    for (const mod of (row.modules ?? [])) {
      project.addModule({
        name: mod.name,
        description: mod.description,
        tasks: (mod.tasks ?? []).map((t: any) => ({
          name: t.name,
          description: t.description,
          roleId: t.role_id,
          estimation: EstimationHours.create({
            optimistic: t.estimated_hours_optimistic,
            probable: t.estimated_hours_probable,
            pessimistic: t.estimated_hours_pessimistic,
          }),
          hourlyRateAtQuotation: Money.create(t.hourly_rate_at_quotation, t.currency),
        })),
      });

      // Restaurar snapshots si el proyecto ya fue cotizado
      if (row.status === 'QUOTED' || row.status === 'APPROVED') {
        project.freezeSnapshots();
      }
    }

    return project;
  }
}
