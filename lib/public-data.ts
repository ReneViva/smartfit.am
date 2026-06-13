import { db } from "./db";

function safePublicUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:"
      ? value
      : null;
  } catch {
    return null;
  }
}

function safePhoneHref(value: string | null) {
  if (!value) {
    return null;
  }

  const dialableNumber = value.replace(/[^\d+*#,;]/g, "");

  return dialableNumber ? `tel:${dialableNumber}` : null;
}

export type PublicCrowdStatus = "low" | "medium" | "high";

function getCrowdStatus(
  currentCount: number,
  greenMax: number | null,
  yellowMax: number | null,
): PublicCrowdStatus | null {
  if (
    greenMax === null ||
    yellowMax === null ||
    greenMax < 0 ||
    yellowMax < 0 ||
    greenMax > yellowMax
  ) {
    return null;
  }

  if (currentCount <= greenMax) {
    return "low";
  }

  if (currentCount <= yellowMax) {
    return "medium";
  }

  return "high";
}

export async function getPublicAppData() {
  const [settings, occupancy] = await Promise.all([
    db.gymSettings
      .findFirst({
        select: {
          address: true,
          contactNumber: true,
          gymName: true,
          instagramLink: true,
          logoUrl: true,
          mapLink: true,
          motivationalText: true,
          occupancyGreenMax: true,
          occupancyYellowMax: true,
          showInstagramInPublicApp: true,
          showLocationInPublicApp: true,
          showMotivationalTextInPublicApp: true,
          showPhoneInPublicApp: true,
          showWhatsappInPublicApp: true,
          whatsappLink: true,
        },
      })
      .catch(() => null),
    db.occupancyState
      .findFirst({
        select: {
          currentCount: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      })
      .catch(() => null),
  ]);

  const currentCount = Math.max(0, occupancy?.currentCount ?? 0);
  const crowdStatus = occupancy
    ? getCrowdStatus(
        currentCount,
        settings?.occupancyGreenMax ?? null,
        settings?.occupancyYellowMax ?? null,
      )
    : null;
  const crowdLabels: Record<PublicCrowdStatus, string> = {
    high: "High crowd",
    low: "Low crowd",
    medium: "Medium crowd",
  };
  const phoneHref = settings?.showPhoneInPublicApp
    ? safePhoneHref(settings.contactNumber)
    : null;
  const whatsappLink = settings?.showWhatsappInPublicApp
    ? safePublicUrl(settings.whatsappLink)
    : null;
  const instagramLink = settings?.showInstagramInPublicApp
    ? safePublicUrl(settings.instagramLink)
    : null;
  const mapLink = settings?.showLocationInPublicApp
    ? safePublicUrl(settings.mapLink)
    : null;

  return {
    gymName: settings?.gymName ?? "Smartfit.am",
    logoUrl: safePublicUrl(settings?.logoUrl ?? null),
    motivationalText: settings?.showMotivationalTextInPublicApp
      ? settings.motivationalText
      : null,
    settingsAvailable: Boolean(settings),
    links: {
      instagram: instagramLink,
      location: mapLink
        ? {
            href: mapLink,
            label: settings?.address ?? "Open location",
          }
        : null,
      phone: phoneHref
        ? {
            href: phoneHref,
            label: settings?.contactNumber ?? "Call Smartfit.am",
          }
        : null,
      whatsapp: whatsappLink,
    },
    occupancy: {
      available: Boolean(occupancy),
      crowdLabel: crowdStatus
        ? crowdLabels[crowdStatus]
        : "Status unavailable",
      crowdStatus,
      currentCount,
      thresholdsAvailable: Boolean(crowdStatus),
    },
  };
}

export async function getPublicSettings() {
  try {
    const settings = await db.gymSettings.findFirst({
      select: {
        address: true,
        contactNumber: true,
        gymName: true,
        instagramLink: true,
        logoUrl: true,
        mapLink: true,
        whatsappLink: true,
        workingDays: true,
        workingHours: true,
      },
    });

    if (!settings) {
      return null;
    }

    return {
      ...settings,
      instagramLink: safePublicUrl(settings.instagramLink),
      logoUrl: safePublicUrl(settings.logoUrl),
      mapLink: safePublicUrl(settings.mapLink),
      whatsappLink: safePublicUrl(settings.whatsappLink),
    };
  } catch {
    return null;
  }
}

export async function getActivePublicContent(limit?: number) {
  const now = new Date();

  try {
    const content = await db.publicContent.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        AND: [
          {
            OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          },
          {
            OR: [{ endsAt: null }, { endsAt: { gte: now } }],
          },
        ],
      },
      select: {
        body: true,
        id: true,
        imageUrl: true,
        title: true,
        type: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return content.map((item) => ({
      ...item,
      imageUrl: safePublicUrl(item.imageUrl),
    }));
  } catch {
    return [];
  }
}

export async function getActiveCoaches(limit?: number) {
  try {
    const coaches = await db.coach.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        description: true,
        firstName: true,
        id: true,
        lastName: true,
        photoUrl: true,
        specialty: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      take: limit,
    });

    return coaches.map((coach) => ({
      ...coach,
      photoUrl: safePublicUrl(coach.photoUrl),
    }));
  } catch {
    return [];
  }
}

export async function getActivePackages(limit?: number) {
  try {
    const packages = await db.package.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        assignedCoach: {
          select: {
            deletedAt: true,
            firstName: true,
            isActive: true,
            lastName: true,
          },
        },
        description: true,
        id: true,
        name: true,
        packageType: true,
        price: true,
        sessionCount: true,
        timeRestrictionLabel: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    return packages.map((gymPackage) => ({
      description: gymPackage.description,
      id: gymPackage.id,
      name: gymPackage.name,
      packageType: gymPackage.packageType,
      price: gymPackage.price.toString(),
      sessionCount: gymPackage.sessionCount,
      timeRestrictionLabel: gymPackage.timeRestrictionLabel,
      assignedCoach:
        gymPackage.assignedCoach?.isActive &&
        !gymPackage.assignedCoach.deletedAt
          ? {
              firstName: gymPackage.assignedCoach.firstName,
              lastName: gymPackage.assignedCoach.lastName,
            }
          : null,
    }));
  } catch {
    return [];
  }
}

export async function getActiveGalleryImages(limit?: number) {
  try {
    const images = await db.galleryImage.findMany({
      where: { isActive: true },
      select: {
        altText: true,
        id: true,
        imageUrl: true,
        title: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: limit,
    });

    return images
      .map((image) => ({
        ...image,
        imageUrl: safePublicUrl(image.imageUrl),
      }))
      .filter((image) => image.imageUrl);
  } catch {
    return [];
  }
}
