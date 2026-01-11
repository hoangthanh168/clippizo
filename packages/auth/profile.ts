import "server-only";

import { clerkClient } from "@clerk/nextjs/server";
import type { Profile } from "@repo/database";
import { database } from "@repo/database";

/**
 * Get profile by Clerk user ID, or create one on-demand if webhook failed.
 * Returns null if profile is soft-deleted or creation fails.
 */
export async function getOrCreateProfile(
  clerkUserId: string
): Promise<Profile | null> {
  // Try to find existing profile
  const profile = await database.profile.findFirst({
    where: {
      clerkUserId,
      deletedAt: null, // Skip soft-deleted profiles
    },
  });

  if (profile) {
    return profile;
  }

  // Fallback: fetch from Clerk and create profile on-demand
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(clerkUserId);

    // Use primary email address (best practice from Clerk docs)
    const primaryEmail =
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ?? "";

    const newProfile = await database.profile.create({
      data: {
        clerkUserId,
        email: primaryEmail,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.imageUrl,
        phoneNumber: user.phoneNumbers[0]?.phoneNumber ?? null,
      },
    });

    return newProfile;
  } catch (error) {
    // Log but don't throw - let caller handle null profile
    console.error("Failed to create profile on-demand", { clerkUserId, error });
    return null;
  }
}
