"use client";

/**
 * Panel layout.
 *
 * Paints the page surface for every panel screen. The colour goes on the body
 * rather than on the panel's own box: painting the box leaves the page margins
 * on the browser default, which showed as white bands either side of a cream
 * column.
 */

import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.classList.add("vm-dash-page");
    return () => document.body.classList.remove("vm-dash-page");
  }, []);

  return <>{children}</>;
}
