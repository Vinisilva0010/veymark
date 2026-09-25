"use client";

/**
 * A short line between two parts of the story, so one hands over to the next
 * instead of cutting dead.
 */
export default function PartBridge({
  from,
  to,
  line,
}: {
  from: string;
  to: string;
  line: string;
}) {
  return (
    <div className="pb">
      <div className="pb-inner">
        <p className="pb-from">{from}</p>
        <p className="pb-line">{line}</p>
        <p className="pb-to">
          <span className="pb-arrow" aria-hidden="true" />
          {to}
        </p>
      </div>
    </div>
  );
}
