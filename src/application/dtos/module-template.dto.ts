import { z } from 'zod';

// ─── Clone Module Template ────────────────────────────────────────────────────

export const CloneModuleTemplateInputSchema = z.object({
  templateId: z.string().min(1, 'El ID de la plantilla es requerido'),
  projectId: z.string().min(1, 'El ID del proyecto es requerido'),
  /** Override hourly rate for all cloned tasks (uses project currency) */
  defaultHourlyRate: z.number().positive('La tarifa horaria debe ser positiva'),
  currency: z.string().length(3).toUpperCase(),
});

export type CloneModuleTemplateInputDto = z.infer<typeof CloneModuleTemplateInputSchema>;

// ─── Output DTO ───────────────────────────────────────────────────────────────

export interface ModuleTemplateOutputDto {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  totalEstimatedHours: number;
  taskCount: number;
}
