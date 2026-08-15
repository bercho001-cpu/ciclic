import { z } from 'zod';

// ─── Update User Profile ──────────────────────────────────────────────────────

export const UpdateUserProfileInputSchema = z.object({
  userId: z.string().min(1),
  displayName: z.string().min(1, 'El nombre de display es requerido').optional(),
  defaultCurrency: z.string().length(3).toUpperCase().optional(),
  logoUrl: z.string().url('La URL del logo debe ser una URL válida').optional(),
  taxId: z.string().optional(),
  contactEmail: z.string().email('El email debe ser válido').optional(),
  websiteUrl: z.string().url('La URL del sitio debe ser válida').optional(),
  defaultPaymentTermsDays: z.number().int().min(0).optional(),
});

export type UpdateUserProfileInputDto = z.infer<typeof UpdateUserProfileInputSchema>;

// ─── Output DTO ───────────────────────────────────────────────────────────────

export interface UserProfileOutputDto {
  userId: string;
  displayName: string;
  defaultCurrency: string;
  taxId?: string;
  logoUrl?: string;
  contactEmail?: string;
  websiteUrl?: string;
  defaultPaymentTermsDays: number;
}
