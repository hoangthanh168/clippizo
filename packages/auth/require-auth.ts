import "server-only";

import { auth } from "@clerk/nextjs/server";
import type { Profile } from "@repo/database";
import { getOrCreateProfile } from "./profile";

/**
 * Custom error class for authentication failures.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Require authentication. Throws AuthError if user is not signed in.
 * @returns Object containing the Clerk userId
 * @throws AuthError with statusCode 401 if not authenticated
 */
export async function requireAuth(): Promise<{ userId: string }> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Unauthorized", 401);
  }

  return { userId };
}

/**
 * Require both authentication and a valid profile.
 * Creates profile on-demand if it doesn't exist (webhook fallback).
 * @returns Object containing both userId and profile
 * @throws AuthError with statusCode 401 if not authenticated
 * @throws AuthError with statusCode 404 if profile not found/creation failed
 */
export async function requireProfile(): Promise<{
  userId: string;
  profile: Profile;
}> {
  const { userId } = await requireAuth();
  const profile = await getOrCreateProfile(userId);

  if (!profile) {
    throw new AuthError("Profile not found", 404);
  }

  return { userId, profile };
}
