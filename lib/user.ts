type ClerkLikeUser = {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  primaryEmailAddress?: { emailAddress: string } | null;
  emailAddresses?: { emailAddress: string }[];
};

/** A human name for a Clerk user. Never falls back to the raw user ID. */
export function displayNameOf(user: ClerkLikeUser | null | undefined) {
  if (!user) return "Guest";
  const full = user.fullName?.trim() || [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.username) return user.username;
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress;
  if (email) return email.split("@")[0];
  return "Guest";
}
