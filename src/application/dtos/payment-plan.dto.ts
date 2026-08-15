import { z } from 'zod';

// ─── Generate Payment Plan ────────────────────────────────────────────────────

export const SplitTypeSchema = z.enum(['EVEN', 'STANDARD_30_40_30', 'CUSTOM']);
export type SplitType = z.infer<typeof SplitTypeSchema>;

export const GeneratePaymentPlanInputSchema = z.object({
  projectId: z.string().min(1),
  totalAmount: z.number().positive('El monto total debe ser positivo'),
  currency: z.string().length(3).toUpperCase(),
  splitType: SplitTypeSchema,
  /** Number of even installments — only for EVEN split */
  evenCount: z.number().int().positive().optional(),
  /** Custom percentages — must sum to 100, only for CUSTOM split */
  customPercentages: z.array(z.number().positive()).optional(),
});

export type GeneratePaymentPlanInputDto = z.infer<typeof GeneratePaymentPlanInputSchema>;

// ─── Record Payment ───────────────────────────────────────────────────────────

export const PaymentMethodSchema = z.enum(['TRANSFER', 'CASH', 'CHEQUE', 'CRYPTO', 'OTHER']);

export const RecordPaymentInputSchema = z.object({
  paymentPlanId: z.string().min(1),
  installmentId: z.string().min(1),
  amount: z.number().positive('El monto del pago debe ser positivo'),
  currency: z.string().length(3).toUpperCase(),
  date: z.coerce.date(),
  method: PaymentMethodSchema,
  receiptReference: z.string().min(1, 'La referencia del comprobante es requerida'),
});

export type RecordPaymentInputDto = z.infer<typeof RecordPaymentInputSchema>;

// ─── Output DTOs ──────────────────────────────────────────────────────────────

export interface InstallmentOutputDto {
  id: string;
  sequenceNumber: number;
  title: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  currency: string;
}

export interface PaymentPlanOutputDto {
  id: string;
  projectId: string;
  totalAmount: number;
  currency: string;
  installments: InstallmentOutputDto[];
}

export interface FinancialHealthOutputDto {
  projectId: string;
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  currency: string;
}
