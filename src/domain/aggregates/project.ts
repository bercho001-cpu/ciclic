import { EstimationHours } from '../value-objects/estimation-hours';
import { Money } from '../value-objects/money';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProjectStatus = 'DRAFT' | 'QUOTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TaskInput {
  name: string;
  estimation: EstimationHours;
  roleId: string;
  hourlyRateAtQuotation: Money;
  description?: string;
}

export interface Task extends TaskInput {
  id: string;
  hourlyRateSnapshot?: Money;
}

export interface ModuleInput {
  name: string;
  tasks: TaskInput[];
  description?: string;
}

export interface ProjectModule {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
}

export interface ProjectCreateInput {
  name: string;
  clientName: string;
  currency: string;
  ownerId: string;
  shareToken?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 0;
const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${++_idCounter}`;
};

// ─── Aggregate: Project ───────────────────────────────────────────────────────

export class Project {
  private readonly _id: string;
  private _name: string;
  private _clientName: string;
  private _currency: string;
  private _ownerId: string;
  private _status: ProjectStatus;
  private _modules: ProjectModule[];
  private _shareToken: string;
  private readonly _createdAt: Date;

  private constructor(input: ProjectCreateInput) {
    this._id = generateId('proj');
    this._name = input.name;
    this._clientName = input.clientName;
    this._currency = input.currency;
    this._ownerId = input.ownerId;
    this._status = 'DRAFT';
    this._modules = [];
    this._shareToken = input.shareToken ?? generateId('share');
    this._createdAt = new Date();
  }

  public static create(input: ProjectCreateInput): Project {
    if (!input.name || !input.name.trim()) {
      throw new Error('El nombre del proyecto es requerido');
    }
    return new Project(input);
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  public get id(): string { return this._id; }
  public get name(): string { return this._name; }
  public get clientName(): string { return this._clientName; }
  public get currency(): string { return this._currency; }
  public get ownerId(): string { return this._ownerId; }
  public get status(): ProjectStatus { return this._status; }
  public get shareToken(): string { return this._shareToken; }
  public get createdAt(): Date { return this._createdAt; }

  public get modules(): ReadonlyArray<ProjectModule> {
    return this._modules;
  }

  // ── Computed ─────────────────────────────────────────────────────────────

  public get totalEstimatedHours(): number {
    return this._modules.reduce((acc, mod) =>
      acc + mod.tasks.reduce((tAcc, t) => tAcc + t.estimation.calculatedHours, 0),
      0
    );
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  public addModule(input: ModuleInput): void {
    if (this._status === 'QUOTED') {
      throw new Error('No se pueden agregar módulos a un proyecto en estado QUOTED');
    }

    const tasks: Task[] = input.tasks.map((t) => ({
      id: generateId('task'),
      ...t,
      hourlyRateSnapshot: undefined,
    }));

    this._modules.push({
      id: generateId('mod'),
      name: input.name,
      description: input.description,
      tasks,
    });
  }

  public freezeSnapshots(): void {
    for (const mod of this._modules) {
      for (const task of mod.tasks) {
        (task as Task).hourlyRateSnapshot = task.hourlyRateAtQuotation;
      }
    }
    this._status = 'QUOTED';
  }

  public calculateLaborCost(): Money {
    const allTasks = this._modules.flatMap((m) => m.tasks);
    const currency = this._currency;

    return allTasks.reduce((acc, task) => {
      const rate = task.hourlyRateSnapshot ?? task.hourlyRateAtQuotation;
      const taskCost = rate.multiply(task.estimation.calculatedHours);
      return acc.add(taskCost);
    }, Money.create(0, currency));
  }
}
