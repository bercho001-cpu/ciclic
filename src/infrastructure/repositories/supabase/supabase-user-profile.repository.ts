import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUserProfileRepository } from '../../../domain/repositories/user-profile.repository.interface';
import { UserProfile } from '../../../domain/aggregates/user-profile';

export class SupabaseUserProfileRepository implements IUserProfileRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return this.mapToAggregate(data);
  }

  async save(profile: UserProfile): Promise<void> {
    const { error } = await this.supabase.from('profiles').upsert({
      id: profile.userId,
      display_name: profile.displayName,
      default_currency: profile.defaultCurrency,
      tax_id: profile.taxId ?? null,
      logo_url: profile.logoUrl ?? null,
      default_payment_terms_days: profile.defaultPaymentTermsDays,
      contact_email: profile.contactEmail ?? null,
      website_url: profile.websiteUrl ?? null,
    });

    if (error) throw new Error(`Error al guardar el perfil: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToAggregate(row: any): UserProfile {
    const profile = UserProfile.create({
      userId: row.id,
      displayName: row.display_name,
      defaultCurrency: row.default_currency,
      taxId: row.tax_id ?? undefined,
      logoUrl: row.logo_url ?? undefined,
      defaultPaymentTermsDays: row.default_payment_terms_days ?? 30,
    });

    if (row.contact_email || row.website_url) {
      profile.updateBranding({
        contactEmail: row.contact_email ?? undefined,
        websiteUrl: row.website_url ?? undefined,
      });
    }

    return profile;
  }
}
