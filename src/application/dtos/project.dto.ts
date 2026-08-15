import { z } from 'zod';

// ─── Project DTOs ─────────────────────────────────────────────────────────────

export const CreateProjectInputSchema = z.object({
  name: z.string().min(1, 'El nombre del proyecto es requerido'),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  currency: z.string().length(3, 'La moneda debe ser un código ISO de 3 letras').toUpperCase(),
  ownerId: z.string().min(1, 'El ID del propietario es requerido'),
});

export type CreateProjectInputDto = z.infer<typeof CreateProjectInputSchema>;

// ─── Add Task ─────────────────────────────────────────────────────────────────

export const AddTaskInputSchema = z.object({
  name: z.string().min(1, 'El nombre de la tarea es requerido'),
  roleId: z.string().min(1, 'El ID del rol es requerido'),
  hourlyRate: z.number().positive('La tarifa horaria debe ser positiva'),
  optimisticHours: z.number().positive('Las horas optimistas deben ser positivas'),
  probableHours: z.number().positive('Las horas probables deben ser positivas'),
  pessimisticHours: z.number().positive('Las horas pesimistas deben ser positivas'),
  description: z.string().optional(),
});

export type AddTaskInputDto = z.infer<typeof AddTaskInputSchema>;

// ─── Add Module With Tasks ────────────────────────────────────────────────────

export const AddModuleWithTasksInputSchema = z.object({
  projectId: z.string().min(1),
  moduleName: z.string().min(1, 'El nombre del módulo es requerido'),
  moduleDescription: z.string().optional(),
  tasks: z.array(AddTaskInputSchema).min(1, 'El módulo debe tener al menos una tarea'),
});

export type AddModuleWithTasksInputDto = z.infer<typeof AddModuleWithTasksInputSchema>;

// ─── Calculate Budget ─────────────────────────────────────────────────────────

export const CalculateProjectBudgetInputSchema = z.object({
  projectId: z.string().min(1),
  externalCosts: z.number().min(0).default(0),
  contingencyPct: z.number().min(0).max(100).default(0),
  marginPct: z.number().min(0).max(100).default(0),
  taxPct: z.number().min(0).max(100).default(0),
});

export type CalculateProjectBudgetInputDto = z.infer<typeof CalculateProjectBudgetInputSchema>;

// ─── Output DTOs ──────────────────────────────────────────────────────────────

export interface ProjectOutputDto {
  id: string;
  name: string;
  clientName: string;
  currency: string;
  ownerId: string;
  status: string;
  shareToken: string;
  totalEstimatedHours: number;
  moduleCount: number;
}

export interface BudgetSummaryOutputDto {
  projectId: string;
  currency: string;
  laborCost: number;
  externalCosts: number;
  subtotal: number;
  contingencyAmount: number;
  operativeBase: number;
  profitMarginAmount: number;
  taxableBase: number;
  taxAmount: number;
  totalFinal: number;
}
