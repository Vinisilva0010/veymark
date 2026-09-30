"use client";

/**
 * The site's background and navigation bar, on the site's own pages only.
 *
 * The panel is the operating system for a factory line, not a page of the
 * website. Carrying the marketing bar into it — About, FAQ, Contact above an
 * operator writing tags — reads as one surface where there are two, and the
 * site background showed through as a stripe beside the panel.
 *
 * Both components stay untouched: this only decides where they appear.
 */

import { usePathname } from "next/navigation";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";

export default function SiteChrome() {
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard")) return null;

  return (
    <>
      <Background />
      <Navbar />
    </>
  );
}
