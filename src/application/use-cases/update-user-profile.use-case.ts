import type { IUserProfileRepository } from '@/domain/repositories/user-profile.repository.interface';
import { UserProfile } from '@/domain/aggregates/user-profile';
import {
  UpdateUserProfileInputSchema,
  type UpdateUserProfileInputDto,
  type UserProfileOutputDto,
} from '../dtos/user-profile.dto';

export class UpdateUserProfileUseCase {
  constructor(private readonly userProfileRepo: IUserProfileRepository) {}

  async execute(rawInput: UpdateUserProfileInputDto): Promise<UserProfileOutputDto> {
    const input = UpdateUserProfileInputSchema.parse(rawInput);

    let profile = await this.userProfileRepo.findByUserId(input.userId);

    if (!profile) {
      // Create new profile if not exists
      profile = UserProfile.create({
        userId: input.userId,
        displayName: input.displayName || 'Guest',
        defaultCurrency: input.defaultCurrency || 'USD',
        taxId: input.taxId,
        logoUrl: input.logoUrl,
        defaultPaymentTermsDays: input.defaultPaymentTermsDays,
      });

      // Update remaining branding fields
      profile.updateBranding({
        contactEmail: input.contactEmail,
        websiteUrl: input.websiteUrl,
      });
    } else {
      // Update existing profile
      if (input.displayName) {
        profile.updateDisplayName(input.displayName);
      }
      if (input.defaultCurrency) {
        profile.updateDefaultCurrency(input.defaultCurrency);
      }

      profile.updateBranding({
        logoUrl: input.logoUrl,
        taxId: input.taxId,
        defaultPaymentTermsDays: input.defaultPaymentTermsDays,
        contactEmail: input.contactEmail,
        websiteUrl: input.websiteUrl,
      });
    }

    await this.userProfileRepo.save(profile);

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      defaultCurrency: profile.defaultCurrency,
      taxId: profile.taxId,
      logoUrl: profile.logoUrl,
      contactEmail: profile.contactEmail,
      websiteUrl: profile.websiteUrl,
      defaultPaymentTermsDays: profile.defaultPaymentTermsDays,
    };
  }
}
