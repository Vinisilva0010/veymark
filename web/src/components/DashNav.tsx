"use client";

/**
 * Panel navigation.
 *
 * Three durable places, present on every screen, always in the same order and
 * the same position. Before this each screen offered a single "Back" button
 * and the assembly station had no link at all — it could only be reached by
 * typing the address, which meant most people never learned it existed.
 *
 * Labels say what the screen does. "Provision" is the word the people who
 * built this use; it is not the word an operator would look for.
 */

import { usePathname, useRouter } from "next/navigation";

const PLACES = [
  { href: "/dashboard", label: "Products" },
  { href: "/dashboard/provision", label: "Write tags" },
  { href: "/dashboard/assembly", label: "Record contents" },
] as const;

export default function DashNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="vm-nav" aria-label="Panel sections">
      {PLACES.map((place) => {
        const active = pathname === place.href;
        return (
          <button
            key={place.href}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => router.push(place.href)}
            className={`vm-nav-item ${active ? "is-active" : ""}`}
          >
            {place.label}
          </button>
        );
      })}
    </nav>
  );
}
