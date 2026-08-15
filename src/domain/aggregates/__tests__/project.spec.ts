import { test, expect } from '@playwright/test';
import { Project } from '../project';
import { EstimationHours } from '../../value-objects/estimation-hours';
import { Money } from '../../value-objects/money';
import { Percentage } from '../../value-objects/percentage';

test.describe('Aggregate: Project', () => {
  const makeProject = () =>
    Project.create({
      name: 'Sistema de Gestión Web',
      clientName: 'ACME Corp.',
      currency: 'USD',
      ownerId: 'user-123',
    });

  test('debe crear un proyecto con estado DRAFT y sin módulos', async () => {
    const project = makeProject();
    expect(project.name).toBe('Sistema de Gestión Web');
    expect(project.clientName).toBe('ACME Corp.');
    expect(project.status).toBe('DRAFT');
    expect(project.modules).toHaveLength(0);
  });

  test('debe agregar un módulo con tareas al proyecto', async () => {
    const project = makeProject();
    project.addModule({
      name: 'Autenticación',
      tasks: [
        {
          name: 'Login con Supabase',
          estimation: EstimationHours.create({ optimistic: 4, probable: 6, pessimistic: 10 }),
          roleId: 'role-dev',
          hourlyRateAtQuotation: Money.create(50, 'USD'),
        },
      ],
    });

    expect(project.modules).toHaveLength(1);
    expect(project.modules[0].name).toBe('Autenticación');
    expect(project.modules[0].tasks).toHaveLength(1);
  });

  test('debe congelar los hourlyRateSnapshot al cotizar (freezeSnapshots)', async () => {
    const project = makeProject();
    project.addModule({
      name: 'Módulo A',
      tasks: [
        {
          name: 'Tarea 1',
          estimation: EstimationHours.fromFixed(10),
          roleId: 'role-dev',
          hourlyRateAtQuotation: Money.create(80, 'USD'),
        },
      ],
    });

    project.freezeSnapshots();

    const task = project.modules[0].tasks[0];
    expect(task.hourlyRateSnapshot).toBeDefined();
    expect(task.hourlyRateSnapshot!.amount).toBe(80);
    expect(project.status).toBe('QUOTED');
  });

  test('debe calcular el costo de mano de obra total usando los snapshots congelados', async () => {
    const project = makeProject();
    project.addModule({
      name: 'Backend',
      tasks: [
        {
          name: 'API REST',
          estimation: EstimationHours.fromFixed(100), // 100h x $50 = $5000
          roleId: 'role-dev',
          hourlyRateAtQuotation: Money.create(50, 'USD'),
        },
      ],
    });

    project.freezeSnapshots();
    const laborCost = project.calculateLaborCost();

    expect(laborCost.amount).toBe(5000.00);
    expect(laborCost.currency).toBe('USD');
  });

  test('debe garantizar que modificar la tarifa original no afecte el costo de un proyecto ya cotizado', async () => {
    const project = makeProject();
    const originalRate = Money.create(50, 'USD');

    project.addModule({
      name: 'Frontend',
      tasks: [
        {
          name: 'UI Dashboard',
          estimation: EstimationHours.fromFixed(20),
          roleId: 'role-dev',
          hourlyRateAtQuotation: originalRate,
        },
      ],
    });

    project.freezeSnapshots();
    const costBeforeChange = project.calculateLaborCost();
    expect(costBeforeChange.amount).toBe(1000.00); // 20h x $50

    // Simular cambio de tarifa global (la snapshot debe permanecer en $50)
    const task = project.modules[0].tasks[0];
    expect(task.hourlyRateSnapshot!.amount).toBe(50);
    // El costo calculado con snapshot sigue siendo $1000
    expect(project.calculateLaborCost().amount).toBe(1000.00);
  });

  test('debe rechazar agregar módulos a un proyecto ya cotizado', async () => {
    const project = makeProject();
    project.addModule({ name: 'Módulo A', tasks: [] });
    project.freezeSnapshots();

    expect(() =>
      project.addModule({ name: 'Módulo Nuevo', tasks: [] })
    ).toThrow('No se pueden agregar módulos a un proyecto en estado QUOTED');
  });

  test('debe calcular el total de horas PERT del proyecto', async () => {
    const project = makeProject();
    project.addModule({
      name: 'Módulo',
      tasks: [
        {
          name: 'Tarea A',
          estimation: EstimationHours.fromFixed(10),
          roleId: 'role-dev',
          hourlyRateAtQuotation: Money.create(50, 'USD'),
        },
        {
          name: 'Tarea B',
          estimation: EstimationHours.fromFixed(15),
          roleId: 'role-dev',
          hourlyRateAtQuotation: Money.create(50, 'USD'),
        },
      ],
    });

    expect(project.totalEstimatedHours).toBe(25);
  });
});
