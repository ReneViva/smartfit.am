"use client";

import {
  createContext,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

type LookupMotionContextValue = {
  isPending: boolean;
  navigate: (href: string, customerCode?: string) => void;
  pendingCustomerCode: string | null;
};

const LookupMotionContext = createContext<LookupMotionContextValue | null>(
  null,
);

export function useCustomerLookupMotion() {
  const context = useContext(LookupMotionContext);

  if (!context) {
    throw new Error(
      "useCustomerLookupMotion must be used inside CustomerLookupMotion.",
    );
  }

  return context;
}

export function CustomerLookupMotion({
  children,
  selectedCustomerCode,
}: {
  children: ReactNode;
  selectedCustomerCode: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingCustomerCode, setPendingCustomerCode] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setPendingCustomerCode(null);
  }, [selectedCustomerCode]);

  const value = useMemo<LookupMotionContextValue>(
    () => ({
      isPending,
      navigate(href, customerCode) {
        setPendingCustomerCode(customerCode ?? null);
        startTransition(() => {
          router.push(href, { scroll: false });
        });
      },
      pendingCustomerCode,
    }),
    [isPending, pendingCustomerCode, router],
  );

  return (
    <LookupMotionContext.Provider value={value}>
      {children}
    </LookupMotionContext.Provider>
  );
}

export function CustomerLookupControls({
  compact,
  customerFilter,
  query,
  selectedCustomerCode,
  showAllPackages,
  sort,
}: {
  compact: boolean;
  customerFilter: string;
  query: string;
  selectedCustomerCode: string;
  showAllPackages: boolean;
  sort: string;
}) {
  const { isPending, navigate } = useCustomerLookupMotion();
  const [filterValue, setFilterValue] = useState(customerFilter);
  const [queryValue, setQueryValue] = useState(query);
  const [sortValue, setSortValue] = useState(sort);

  useEffect(() => {
    setFilterValue(customerFilter);
    setQueryValue(query);
    setSortValue(sort);
  }, [customerFilter, query, sort]);

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string") {
        params.set(key, value);
      }
    }

    navigate(`/registration?${params.toString()}`);
  }

  return (
    <form
      aria-busy={isPending}
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(18rem,1fr)_minmax(11rem,0.45fr)_minmax(12rem,0.5fr)_auto] xl:items-end"
      onSubmit={submitLookup}
    >
      {compact ? <input name="view" type="hidden" value="compact" /> : null}
      {showAllPackages ? <input name="showAll" type="hidden" value="1" /> : null}
      {selectedCustomerCode ? (
        <input name="customer" type="hidden" value={selectedCustomerCode} />
      ) : null}
      <label className="block min-w-0 flex-1 text-sm font-semibold text-foreground">
        Name, member ID, or phone
        <input
          autoFocus
          className="mt-2 min-h-12 w-full rounded-lg border border-input-border bg-card px-4 py-3 text-foreground outline-none transition-[border-color,box-shadow,opacity] duration-200 focus:border-brand focus:ring-2 focus:ring-soft-blue"
          name="q"
          onChange={(event) => setQueryValue(event.target.value)}
          placeholder="Search by name, member ID, or phone..."
          value={queryValue}
        />
      </label>
      <label className="block min-w-0 text-sm font-semibold text-foreground">
        Filter
        <select
          className="mt-2 min-h-12 w-full rounded-lg border border-input-border bg-card px-4 py-3 text-foreground outline-none transition-[border-color,box-shadow,opacity] duration-200 focus:border-brand focus:ring-2 focus:ring-soft-blue"
          name="customerFilter"
          onChange={(event) => setFilterValue(event.target.value)}
          value={filterValue}
        >
          <option value="all">All customers</option>
          <option value="in-gym">In gym</option>
          <option value="not-in-gym">Not in gym</option>
          <option value="active">Active customers</option>
          <option value="inactive">Inactive customers</option>
          <option value="needs-attention">Needs attention</option>
        </select>
      </label>
      <label className="block min-w-0 text-sm font-semibold text-foreground">
        Sort
        <select
          className="mt-2 min-h-12 w-full rounded-lg border border-input-border bg-card px-4 py-3 text-foreground outline-none transition-[border-color,box-shadow,opacity] duration-200 focus:border-brand focus:ring-2 focus:ring-soft-blue"
          name="sort"
          onChange={(event) => setSortValue(event.target.value)}
          value={sortValue}
        >
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
          <option value="newest">Newest customers first</option>
          <option value="oldest">Oldest customers first</option>
          <option value="code-asc">Member code: ascending</option>
          <option value="code-desc">Member code: descending</option>
        </select>
      </label>
      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-white transition-[background-color,opacity,transform] duration-200 hover:bg-primary-hover active:translate-y-px disabled:cursor-wait disabled:opacity-75 xl:w-auto"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Updating results..." : "Apply"}
      </button>
    </form>
  );
}

export function CustomerWorkspaceMotion({
  children,
  selectedCustomerKey,
}: {
  children: ReactNode;
  selectedCustomerKey: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedCustomerKey || !containerRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const container = containerRef.current;

      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const fullyVisible = rect.top >= 16 && rect.bottom <= window.innerHeight - 16;

      if (fullyVisible) {
        return;
      }

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      container.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selectedCustomerKey]);

  return (
    <div
      className="animate-workspace-in scroll-mt-section min-w-0"
      ref={containerRef}
    >
      {children}
    </div>
  );
}

export function handleLookupLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  navigate: (href: string, customerCode?: string) => void,
  href: string,
  customerCode?: string,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();
  navigate(href, customerCode);
}
