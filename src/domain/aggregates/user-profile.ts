// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfileCreateInput {
  userId: string;
  displayName: string;
  defaultCurrency: string;
  taxId?: string;
  logoUrl?: string;
  defaultPaymentTermsDays?: number;
}

export interface UserProfileBrandingUpdate {
  logoUrl?: string;
  taxId?: string;
  defaultPaymentTermsDays?: number;
  contactEmail?: string;
  websiteUrl?: string;
}

// ─── Aggregate: UserProfile ───────────────────────────────────────────────────

export class UserProfile {
  private readonly _userId: string;
  private _displayName: string;
  private _defaultCurrency: string;
  private _taxId?: string;
  private _logoUrl?: string;
  private _defaultPaymentTermsDays: number;
  private _contactEmail?: string;
  private _websiteUrl?: string;

  private constructor(input: UserProfileCreateInput) {
    this._userId = input.userId;
    this._displayName = input.displayName;
    this._defaultCurrency = input.defaultCurrency;
    this._taxId = input.taxId;
    this._logoUrl = input.logoUrl;
    this._defaultPaymentTermsDays = input.defaultPaymentTermsDays ?? 30;
  }

  public static create(input: UserProfileCreateInput): UserProfile {
    if (!input.displayName || !input.displayName.trim()) {
      throw new Error('El nombre de display es requerido');
    }
    return new UserProfile(input);
  }

  // ── Getters ──────────────────────────────────────────────────────────────

  public get userId(): string { return this._userId; }
  public get displayName(): string { return this._displayName; }
  public get defaultCurrency(): string { return this._defaultCurrency; }
  public get taxId(): string | undefined { return this._taxId; }
  public get logoUrl(): string | undefined { return this._logoUrl; }
  public get defaultPaymentTermsDays(): number { return this._defaultPaymentTermsDays; }
  public get contactEmail(): string | undefined { return this._contactEmail; }
  public get websiteUrl(): string | undefined { return this._websiteUrl; }

  // ── Commands ─────────────────────────────────────────────────────────────

  public updateBranding(update: UserProfileBrandingUpdate): void {
    if (update.defaultPaymentTermsDays !== undefined && update.defaultPaymentTermsDays < 0) {
      throw new Error('Los días de pago no pueden ser negativos');
    }

    if (update.logoUrl !== undefined) this._logoUrl = update.logoUrl;
    if (update.taxId !== undefined) this._taxId = update.taxId;
    if (update.defaultPaymentTermsDays !== undefined) this._defaultPaymentTermsDays = update.defaultPaymentTermsDays;
    if (update.contactEmail !== undefined) this._contactEmail = update.contactEmail;
    if (update.websiteUrl !== undefined) this._websiteUrl = update.websiteUrl;
  }

  public updateDisplayName(name: string): void {
    if (!name || !name.trim()) {
      throw new Error('El nombre de display es requerido');
    }
    this._displayName = name.trim();
  }

  public updateDefaultCurrency(currency: string): void {
    if (!currency || !currency.trim()) {
      throw new Error('La moneda por defecto es requerida');
    }
    this._defaultCurrency = currency.toUpperCase().trim();
  }
}
