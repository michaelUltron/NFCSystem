import { activateCard, getCurrentUserProfile, getMySubscriptionPlan } from "./card-service";
import { getPendingCardUid, clearPendingCardUid } from "./card-session";

export type ActivationResult = {
  success: boolean;
  mode: "personal" | "business_inventory" | null;
  message: string;
  card?: any;
};

export async function processPendingCardActivation(): Promise<ActivationResult | null> {
  const pendingUid = getPendingCardUid();

  if (!pendingUid) return null;

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return null;
  }

  const subscription = await getMySubscriptionPlan();

  try {
    const activatedCard = await activateCard(pendingUid);
    clearPendingCardUid();

    const isBusiness =
      subscription?.plan?.toLowerCase() === "business" &&
      subscription?.status?.toLowerCase() === "active";

    return {
      success: true,
      mode: isBusiness ? "business_inventory" : "personal",
      message: isBusiness
        ? "Card added to your business inventory."
        : "Card activated to your account.",
      card: activatedCard,
    };
  } catch (error: any) {
    return {
      success: false,
      mode: null,
      message: error?.message || "Failed to activate card.",
    };
  }
}