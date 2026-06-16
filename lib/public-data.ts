import { Prisma } from "@prisma/client";

import { db } from "./db";
import { normalizeMapEmbedUrl } from "./map-embed";

const PRICE_FILTER_PATTERN = /^\d{1,8}(?:\.\d{1,2})?$/;

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
          mapEmbedUrl: true,
          mapLink: true,
          motivationalText: true,
          occupancyGreenMax: true,
          occupancyYellowMax: true,
          ourAppLogoDarkUrl: true,
          ourAppLogoLightUrl: true,
          showInstagramInPublicApp: true,
          showLocationInPublicApp: true,
          showMotivationalTextInPublicApp: true,
          showPhoneInPublicApp: true,
          showPublicAnalyticsOnOurApp: true,
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
  const mapEmbedUrl = settings?.showLocationInPublicApp
    ? normalizeMapEmbedUrl(settings.mapEmbedUrl)
    : null;

  return {
    gymName: settings?.gymName ?? "Smartfit.am",
    ourAppLogoDarkUrl: safePublicUrl(settings?.ourAppLogoDarkUrl ?? null),
    ourAppLogoLightUrl: safePublicUrl(settings?.ourAppLogoLightUrl ?? null),
    motivationalText: settings?.showMotivationalTextInPublicApp
      ? settings.motivationalText
      : null,
    settingsAvailable: Boolean(settings),
    showPublicAnalytics: settings?.showPublicAnalyticsOnOurApp ?? false,
    location: settings?.showLocationInPublicApp
      ? {
          address: settings.address,
          mapEmbedUrl,
        }
      : null,
    links: {
      instagram: instagramLink,
      location: mapLink
        ? {
            href: mapLink,
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

export type PublicPackageSearchParams = {
  category?: string | string[];
  maxPrice?: string | string[];
  minPrice?: string | string[];
  sort?: string | string[];
};

export type PublicPackageSort = "name" | "price-asc" | "price-desc";

const publicPackageSorts = new Set<PublicPackageSort>([
  "name",
  "price-asc",
  "price-desc",
]);

function publicEligiblePackageWhere(): Prisma.PackageWhereInput {
  return {
    categories: {
      none: {
        category: {
          OR: [{ isArchived: true }, { isPublic: false }],
        },
      },
    },
    deletedAt: null,
    isActive: true,
  };
}

function queryValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function priceFilter(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return { value: null, valid: true };
  }

  return {
    value: PRICE_FILTER_PATTERN.test(normalized) ? normalized : null,
    valid: PRICE_FILTER_PATTERN.test(normalized),
  };
}

export async function getPublicPackageCatalog(
  searchParams: PublicPackageSearchParams,
) {
  try {
    const categories = await db.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        name: true,
        slug: true,
      },
      where: {
        isArchived: false,
        isPublic: true,
        packages: {
          some: {
            package: publicEligiblePackageWhere(),
          },
        },
      },
    });
    const requestedCategory = queryValue(searchParams.category);
    const requestedMinPrice = queryValue(searchParams.minPrice);
    const requestedMaxPrice = queryValue(searchParams.maxPrice);
    const rawSort = queryValue(searchParams.sort);
    const category = categories.some(
      (option) => option.slug === requestedCategory,
    )
      ? requestedCategory
      : null;
    const minPrice = priceFilter(requestedMinPrice);
    const maxPrice = priceFilter(requestedMaxPrice);
    const requestedSort = rawSort as PublicPackageSort;
    const sort = requestedSort && publicPackageSorts.has(requestedSort)
      ? requestedSort
      : "name";
    const rangeIsValid =
      minPrice.value === null ||
      maxPrice.value === null ||
      Number(minPrice.value) <= Number(maxPrice.value);
    const filterErrors = [
      requestedCategory && !category
        ? "The selected category is not publicly available."
        : null,
      !minPrice.valid || !maxPrice.valid
        ? "Prices must be non-negative numbers with no more than two decimal places."
        : null,
      !rangeIsValid
        ? "Minimum price cannot be greater than maximum price."
        : null,
      rawSort && !publicPackageSorts.has(requestedSort)
        ? "The selected sort option is not available."
        : null,
    ].filter((message): message is string => Boolean(message));
    const priceWhere =
      minPrice.valid && maxPrice.valid && rangeIsValid
        ? {
            price: {
              gte: minPrice.value ?? undefined,
              lte: maxPrice.value ?? undefined,
            },
          }
        : {};
    const orderBy: Prisma.PackageOrderByWithRelationInput[] =
      sort === "price-asc"
        ? [{ price: "asc" }, { name: "asc" }]
        : sort === "price-desc"
          ? [{ price: "desc" }, { name: "asc" }]
          : [{ name: "asc" }];
    const packages = await db.package.findMany({
      orderBy,
      select: {
        assignedCoach: {
          select: {
            deletedAt: true,
            firstName: true,
            isActive: true,
            lastName: true,
          },
        },
        categories: {
          orderBy: {
            category: {
              sortOrder: "asc",
            },
          },
          select: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        description: true,
        defaultGuestPasses: true,
        id: true,
        name: true,
        packageType: true,
        price: true,
        sessionCount: true,
        timeRestrictionLabel: true,
      },
      where: {
        AND: [
          publicEligiblePackageWhere(),
          category
            ? {
                categories: {
                  some: {
                    category: {
                      isArchived: false,
                      isPublic: true,
                      slug: category,
                    },
                  },
                },
              }
            : {},
          priceWhere,
        ],
      },
    });

    return {
      available: true,
      categories,
      filterErrors,
      filters: {
        category: category ?? "",
        maxPrice: requestedMaxPrice,
        minPrice: requestedMinPrice,
        sort,
      },
      packages: packages.map((gymPackage) => ({
        assignedCoach:
          gymPackage.assignedCoach?.isActive &&
          !gymPackage.assignedCoach.deletedAt
            ? {
                firstName: gymPackage.assignedCoach.firstName,
                lastName: gymPackage.assignedCoach.lastName,
              }
            : null,
        categories: gymPackage.categories.map(({ category: option }) => option),
        description: gymPackage.description,
        defaultGuestPasses: gymPackage.defaultGuestPasses,
        id: gymPackage.id,
        name: gymPackage.name,
        packageType: gymPackage.packageType,
        price: gymPackage.price.toString(),
        sessionCount: gymPackage.sessionCount,
        timeRestrictionLabel: gymPackage.timeRestrictionLabel,
      })),
    };
  } catch {
    return {
      available: false,
      categories: [],
      filterErrors: [],
      filters: {
        category: "",
        maxPrice: queryValue(searchParams.maxPrice),
        minPrice: queryValue(searchParams.minPrice),
        sort: "name" as const,
      },
      packages: [],
    };
  }
}

export async function getActivePackages(limit?: number) {
  const catalog = await getPublicPackageCatalog({});
  return limit ? catalog.packages.slice(0, limit) : catalog.packages;
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

    return images.flatMap((image) => {
      const imageUrl = safePublicUrl(image.imageUrl);

      return imageUrl
        ? [
            {
              ...image,
              imageUrl,
            },
          ]
        : [];
    });
  } catch {
    return [];
  }
}
