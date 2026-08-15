import { test, expect } from '@playwright/test';
import { APP_NAME, APP_VERSION } from '@/domain';

test.describe('Sanity & Configuration Test', () => {
  test('debe verificar que Playwright Test se ejecuta correctamente', async () => {
    expect(1 + 1).toBe(2);
  });

  test('debe resolver alias de TypeScript @/* hacia src/*', async () => {
    expect(APP_NAME).toBe('Ciclic');
    expect(APP_VERSION).toBe('0.1.0');
  });
});
