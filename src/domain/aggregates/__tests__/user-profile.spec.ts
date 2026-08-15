import { test, expect } from '@playwright/test';
import { UserProfile } from '../user-profile';

test.describe('Aggregate: UserProfile', () => {
  test('debe crear un perfil de usuario con datos mínimos requeridos', async () => {
    const profile = UserProfile.create({
      userId: 'user-123',
      displayName: 'Estudio Bercho',
      defaultCurrency: 'USD',
    });

    expect(profile.userId).toBe('user-123');
    expect(profile.displayName).toBe('Estudio Bercho');
    expect(profile.defaultCurrency).toBe('USD');
    expect(profile.taxId).toBeUndefined();
    expect(profile.logoUrl).toBeUndefined();
    expect(profile.defaultPaymentTermsDays).toBe(30); // valor por defecto
  });

  test('debe actualizar los datos de branding del perfil', async () => {
    const profile = UserProfile.create({ userId: 'user-1', displayName: 'Dev Studio', defaultCurrency: 'USD' });
    profile.updateBranding({
      logoUrl: 'https://cdn.ciclic.app/logos/estudio.png',
      taxId: '20-12345678-9',
      defaultPaymentTermsDays: 15,
    });

    expect(profile.logoUrl).toBe('https://cdn.ciclic.app/logos/estudio.png');
    expect(profile.taxId).toBe('20-12345678-9');
    expect(profile.defaultPaymentTermsDays).toBe(15);
  });

  test('debe rechazar términos de pago negativos', async () => {
    const profile = UserProfile.create({ userId: 'user-1', displayName: 'Dev Studio', defaultCurrency: 'USD' });
    expect(() => profile.updateBranding({ defaultPaymentTermsDays: -5 }))
      .toThrow('Los días de pago no pueden ser negativos');
  });

  test('debe rechazar un display name vacío', async () => {
    expect(() => UserProfile.create({ userId: 'user-1', displayName: '', defaultCurrency: 'USD' }))
      .toThrow('El nombre de display es requerido');
  });
});
