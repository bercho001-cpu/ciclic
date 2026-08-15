import { test, expect } from '@playwright/test';
import { UpdateUserProfileUseCase } from '../update-user-profile.use-case';
import { UserProfile } from '@/domain/aggregates/user-profile';
import type { IUserProfileRepository } from '@/domain/repositories/user-profile.repository.interface';

// ─── In-Memory Repository ────────────────────────────────────────────────────
class InMemoryUserProfileRepository implements IUserProfileRepository {
  private profiles = new Map<string, UserProfile>();

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async save(userProfile: UserProfile): Promise<void> {
    this.profiles.set(userProfile.userId, userProfile);
  }
}

test.describe('Use Case: UpdateUserProfileUseCase', () => {
  test('should successfully initialize and save a new user profile', async () => {
    const profileRepo = new InMemoryUserProfileRepository();
    const useCase = new UpdateUserProfileUseCase(profileRepo);

    // Act
    const output = await useCase.execute({
      userId: 'user-001',
      displayName: 'Tony Stark',
      defaultCurrency: 'USD',
      logoUrl: 'https://starkindustries.com/logo.png',
      taxId: 'TAX-STARK-1',
      contactEmail: 'tony@stark.com',
      defaultPaymentTermsDays: 15,
    });

    // Assert
    expect(output.userId).toBe('user-001');
    expect(output.displayName).toBe('Tony Stark');
    expect(output.defaultCurrency).toBe('USD');
    expect(output.logoUrl).toBe('https://starkindustries.com/logo.png');
    expect(output.taxId).toBe('TAX-STARK-1');
    expect(output.contactEmail).toBe('tony@stark.com');
    expect(output.defaultPaymentTermsDays).toBe(15);

    const savedProfile = await profileRepo.findByUserId('user-001');
    expect(savedProfile).not.toBeNull();
    expect(savedProfile!.displayName).toBe('Tony Stark');
  });

  test('should successfully update an existing user profile', async () => {
    const profileRepo = new InMemoryUserProfileRepository();
    const useCase = new UpdateUserProfileUseCase(profileRepo);

    // Arrange: Save an existing profile
    const existingProfile = UserProfile.create({
      userId: 'user-002',
      displayName: 'Bruce Wayne',
      defaultCurrency: 'USD',
    });
    await profileRepo.save(existingProfile);

    // Act
    const output = await useCase.execute({
      userId: 'user-002',
      displayName: 'Batman',
      defaultCurrency: 'EUR',
      logoUrl: 'https://batcave.com/logo.png',
      taxId: 'TAX-BAT-9',
      contactEmail: 'bruce@wayne.com',
      defaultPaymentTermsDays: 30,
    });

    // Assert
    expect(output.userId).toBe('user-002');
    expect(output.displayName).toBe('Batman');
    expect(output.defaultCurrency).toBe('EUR');
    expect(output.logoUrl).toBe('https://batcave.com/logo.png');
    expect(output.taxId).toBe('TAX-BAT-9');
    expect(output.contactEmail).toBe('bruce@wayne.com');
    expect(output.defaultPaymentTermsDays).toBe(30);

    const savedProfile = await profileRepo.findByUserId('user-002');
    expect(savedProfile!.displayName).toBe('Batman');
    expect(savedProfile!.defaultCurrency).toBe('EUR');
  });
});
