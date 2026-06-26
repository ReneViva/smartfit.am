import { Prisma } from "@prisma/client";

import { db } from "./db";
import { normalizeMapEmbedUrl } from "./map-embed";

const PRICE_FILTER_PATTERN = /^\d{1,8}(?:\.\d{1,2})?$/;
const PUBLIC_INTERNAL_PATH_PATTERN = /^\/(?!\/)[^\s\\]*$/;

const publicContentSelect = {
  body: true,
  ctaLabel: true,
  ctaUrl: true,
  id: true,
  imageUrl: true,
  sortOrder: true,
  title: true,
  type: true,
  visibleOnApp: true,
} satisfies Prisma.PublicContentSelect;

type PublicContentRecord = Prisma.PublicContentGetPayload<{
  select: typeof publicContentSelect;
}>;

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

function safePublicHref(value: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (PUBLIC_INTERNAL_PATH_PATTERN.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:"
      ? trimmed
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

function publicWorkingSchedule({
  workingDays,
  workingHours,
  workingScheduleText,
}: {
  workingDays?: string | null;
  workingHours?: string | null;
  workingScheduleText?: string | null;
}) {
  if (workingScheduleText?.trim()) {
    return workingScheduleText;
  }

  const legacySchedule = [workingDays, workingHours]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n");

  return legacySchedule || null;
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

function activePublicContentWhere(
  now: Date,
  extra?: Prisma.PublicContentWhereInput,
): Prisma.PublicContentWhereInput {
  return {
    ...extra,
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
  };
}

function publicContentOrderBy(): Prisma.PublicContentOrderByWithRelationInput[] {
  return [
    { sortOrder: "asc" },
    { createdAt: "asc" },
    { id: "asc" },
  ];
}

function safePublicContent(item: PublicContentRecord) {
  return {
    ...item,
    ctaUrl: safePublicHref(item.ctaUrl),
    imageUrl: safePublicUrl(item.imageUrl),
  };
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
          showTelegramInPublicLinks: true,
          showWhatsappInPublicApp: true,
          telegramLink: true,
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
  const telegramLink = settings?.showTelegramInPublicLinks
    ? safePublicUrl(settings.telegramLink)
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
      telegram: telegramLink,
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
        showTelegramInPublicLinks: true,
        telegramLink: true,
        whatsappLink: true,
        workingDays: true,
        workingHours: true,
        workingScheduleText: true,
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
      telegramLink: settings.showTelegramInPublicLinks
        ? safePublicUrl(settings.telegramLink)
        : null,
      whatsappLink: safePublicUrl(settings.whatsappLink),
      workingSchedule: publicWorkingSchedule(settings),
    };
  } catch {
    return null;
  }
}

export async function getActivePublicContent(limit?: number) {
  const now = new Date();

  try {
    const content = await db.publicContent.findMany({
      where: activePublicContentWhere(now),
      select: publicContentSelect,
      orderBy: publicContentOrderBy(),
      take: limit,
    });

    return content.map(safePublicContent);
  } catch {
    return [];
  }
}

export async function getVisibleAppPublicContent(limit?: number) {
  const now = new Date();

  try {
    const content = await db.publicContent.findMany({
      where: activePublicContentWhere(now, { visibleOnApp: true }),
      select: publicContentSelect,
      orderBy: publicContentOrderBy(),
      take: limit,
    });

    return content.map(safePublicContent);
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
          where: {
            category: {
              isArchived: false,
              isPublic: true,
            },
          },
        },
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
      categories: coach.categories.map(({ category }) => category),
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

function activePackagePriceValue({
  discountPrice,
  price,
}: {
  discountPrice: string | null;
  price: string;
}) {
  return Number(discountPrice ?? price);
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
    const packages = await db.package.findMany({
      orderBy: [{ name: "asc" }],
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
        discountPrice: true,
        defaultGuestPasses: true,
        highlightOnPublicPackages: true,
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
        ],
      },
    });
    const publicPackages = packages.map((gymPackage) => ({
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
      discountPrice: gymPackage.discountPrice?.toString() ?? null,
      defaultGuestPasses: gymPackage.defaultGuestPasses,
      highlightOnPublicPackages: gymPackage.highlightOnPublicPackages,
      id: gymPackage.id,
      name: gymPackage.name,
      packageType: gymPackage.packageType,
      price: gymPackage.price.toString(),
      sessionCount: gymPackage.sessionCount,
      timeRestrictionLabel: gymPackage.timeRestrictionLabel,
    }));
    const filteredPackages =
      minPrice.valid && maxPrice.valid && rangeIsValid
        ? publicPackages.filter((gymPackage) => {
            const activePrice = activePackagePriceValue(gymPackage);

            return (
              (minPrice.value === null ||
                activePrice >= Number(minPrice.value)) &&
              (maxPrice.value === null ||
                activePrice <= Number(maxPrice.value))
            );
          })
        : publicPackages;
    const sortedPackages = [...filteredPackages].sort((left, right) => {
      if (sort === "price-asc") {
        return (
          activePackagePriceValue(left) - activePackagePriceValue(right) ||
          left.name.localeCompare(right.name)
        );
      }

      if (sort === "price-desc") {
        return (
          activePackagePriceValue(right) - activePackagePriceValue(left) ||
          left.name.localeCompare(right.name)
        );
      }

      return left.name.localeCompare(right.name);
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
      packages: sortedPackages,
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
