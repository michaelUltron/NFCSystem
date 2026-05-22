import type { CardRow } from "./card-service";
import type { ProfileRow } from "./profile-service";

export function isProfileReady(profile: ProfileRow | null) {
  return Boolean(
    profile?.full_name?.trim() &&
      profile?.username?.trim() &&
      profile?.avatar_url?.trim()
  );
}

export function hasContactDetails(profile: ProfileRow | null) {
  return Boolean(
    profile?.company?.trim() ||
      profile?.position?.trim() ||
      profile?.phone?.trim() ||
      profile?.email?.trim() ||
      profile?.website?.trim() ||
      profile?.location_label?.trim()
  );
}

export function hasActiveCard(cards: CardRow[]) {
  return cards.some((card) => card.status === "active");
}

export function getOnboardingProgress(profile: ProfileRow | null, cards: CardRow[]) {
  const checks = [
    isProfileReady(profile),
    hasContactDetails(profile),
    hasActiveCard(cards),
  ];

  const completed = checks.filter(Boolean).length;

  return {
    completed,
    total: checks.length,
    percent: Math.round((completed / checks.length) * 100),
  };
}
