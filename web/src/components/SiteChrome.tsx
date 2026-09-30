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

  // The panel is the factory's operating system and /v is what a buyer sees
  // on tapping a part. Neither is a page of the website: the marketing bar
  // over a verification result competes with the one thing that screen
  // exists to say. Both screens carry their own way back to the site.
  if (pathname?.startsWith("/dashboard")) return null;
  if (pathname?.startsWith("/v")) return null;

  return (
    <>
      <Background />
      <Navbar />
    </>
  );
}
