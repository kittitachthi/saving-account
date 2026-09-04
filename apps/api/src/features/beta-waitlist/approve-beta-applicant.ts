import type { PrismaClient } from "@prisma/client";

export class WaitlistEntryNotFoundError extends Error {}
export class WaitlistEntryDeclinedError extends Error {}
export class WaitlistEntryAlreadyApprovedError extends Error {}

export async function approveBetaApplicant(
  client: PrismaClient,
  rawEmail: string,
  reviewedBy: string,
) {
  const email = rawEmail.trim().toLowerCase();
  return client.$transaction(async (transaction) => {
    const entry = await transaction.betaWaitlistEntry.findUnique({
      where: { email },
    });
    if (!entry)
      throw new WaitlistEntryNotFoundError("Waitlist entry not found");
    if (entry.status === "DECLINED") {
      throw new WaitlistEntryDeclinedError("Declined entry cannot be approved");
    }

    const approvedAt = entry.approvedAt ?? new Date();
    await transaction.betaWaitlistEntry.update({
      where: { email },
      data: {
        status: "APPROVED",
        reviewedAt: entry.reviewedAt ?? approvedAt,
        reviewedBy: entry.reviewedBy ?? reviewedBy,
        approvedAt,
      },
    });
    await transaction.betaAllowlist.upsert({
      where: { email },
      create: { email, addedBy: reviewedBy },
      update: {},
    });
    await transaction.notificationOutbox.upsert({
      where: { dedupeKey: `beta-approved:${email}` },
      create: {
        kind: "BETA_APPROVED",
        dedupeKey: `beta-approved:${email}`,
        recipientEmail: email,
        payload: { email },
      },
      update: {},
    });

    return { email, approvedAt };
  });
}

export async function declineBetaApplicant(
  client: PrismaClient,
  rawEmail: string,
  reviewedBy: string,
) {
  const email = rawEmail.trim().toLowerCase();
  return client.$transaction(async (transaction) => {
    const entry = await transaction.betaWaitlistEntry.findUnique({
      where: { email },
    });
    if (!entry)
      throw new WaitlistEntryNotFoundError("Waitlist entry not found");
    if (entry.status === "APPROVED") {
      throw new WaitlistEntryAlreadyApprovedError(
        "Approved entry cannot be declined",
      );
    }
    if (entry.status === "DECLINED")
      return { email, declinedAt: entry.reviewedAt };
    const declinedAt = new Date();
    await transaction.betaWaitlistEntry.update({
      where: { email },
      data: { status: "DECLINED", reviewedAt: declinedAt, reviewedBy },
    });
    return { email, declinedAt };
  });
}
