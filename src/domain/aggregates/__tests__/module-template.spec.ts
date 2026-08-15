import { test, expect } from '@playwright/test';
import { ModuleTemplate } from '../module-template';
import { EstimationHours } from '../../value-objects/estimation-hours';
import { Money } from '../../value-objects/money';

test.describe('Aggregate: ModuleTemplate', () => {
  test('debe crear una plantilla de módulo con tareas predefinidas', async () => {
    const template = ModuleTemplate.create({
      name: 'Autenticación Estándar',
      description: 'Login, registro y recuperación de contraseña con Supabase Auth.',
      ownerId: 'user-123',
      tasks: [
        { name: 'Login y registro', estimationHours: EstimationHours.fromFixed(8), roleId: 'role-dev' },
        { name: 'Recuperación de contraseña', estimationHours: EstimationHours.fromFixed(4), roleId: 'role-dev' },
      ],
    });

    expect(template.name).toBe('Autenticación Estándar');
    expect(template.tasks).toHaveLength(2);
    expect(template.totalEstimatedHours).toBe(12);
  });

  test('debe rechazar nombres de plantilla vacíos', async () => {
    expect(() =>
      ModuleTemplate.create({ name: '', description: '', ownerId: 'user-1', tasks: [] })
    ).toThrow('El nombre de la plantilla es requerido');
  });

  test('debe clonar la plantilla generando nuevas tareas listas para un proyecto', async () => {
    const template = ModuleTemplate.create({
      name: 'Dashboard',
      description: 'KPIs y métricas visuales',
      ownerId: 'user-1',
      tasks: [
        { name: 'Gráficas de barras', estimationHours: EstimationHours.fromFixed(6), roleId: 'role-dev' },
      ],
    });

    const clonedTasks = template.cloneTasksForProject('project-999');

    expect(clonedTasks).toHaveLength(1);
    expect(clonedTasks[0].name).toBe('Gráficas de barras');
    expect(clonedTasks[0].projectId).toBe('project-999');
    expect(clonedTasks[0].estimation.calculatedHours).toBe(6);
  });
});
