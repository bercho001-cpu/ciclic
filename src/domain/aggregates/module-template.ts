import { EstimationHours } from '../value-objects/estimation-hours';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TemplateTaskInput {
  name: string;
  estimationHours: EstimationHours;
  roleId: string;
  description?: string;
}

export interface TemplateTask extends TemplateTaskInput {
  id: string;
}

export interface ClonedTask {
  name: string;
  projectId: string;
  estimation: EstimationHours;
  roleId: string;
  description?: string;
}

export interface ModuleTemplateCreateInput {
  name: string;
  description: string;
  ownerId: string;
  tasks: TemplateTaskInput[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _idCounter = 0;
const generateId = (prefix: string): string => `${prefix}-${Date.now()}-${++_idCounter}`;

// ─── Aggregate: ModuleTemplate ────────────────────────────────────────────────

export class ModuleTemplate {
  private readonly _id: string;
  private _name: string;
  private _description: string;
  private readonly _ownerId: string;
  private readonly _tasks: TemplateTask[];

  private constructor(input: ModuleTemplateCreateInput) {
    this._id = generateId('tmpl');
    this._name = input.name;
    this._description = input.description;
    this._ownerId = input.ownerId;
    this._tasks = input.tasks.map((t) => ({ id: generateId('ttask'), ...t }));
  }

  public static create(input: ModuleTemplateCreateInput): ModuleTemplate {
    if (!input.name || !input.name.trim()) {
      throw new Error('El nombre de la plantilla es requerido');
    }
    return new ModuleTemplate(input);
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  public get id(): string { return this._id; }
  public get name(): string { return this._name; }
  public get description(): string { return this._description; }
  public get ownerId(): string { return this._ownerId; }
  public get tasks(): ReadonlyArray<TemplateTask> { return this._tasks; }

  public get totalEstimatedHours(): number {
    return this._tasks.reduce((acc, t) => acc + t.estimationHours.calculatedHours, 0);
  }

  // ── Commands ─────────────────────────────────────────────────────────────

  public cloneTasksForProject(projectId: string): ClonedTask[] {
    return this._tasks.map((t) => ({
      name: t.name,
      projectId,
      estimation: t.estimationHours,
      roleId: t.roleId,
      description: t.description,
    }));
  }
}
