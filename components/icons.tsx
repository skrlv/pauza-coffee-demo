import type { ReactNode } from "react";
export function Icon({
  name = "arrow",
  size = 22,
  filled = false,
}: {
  name?: string;
  size?: number;
  filled?: boolean;
}) {
  const paths: Record<string, ReactNode> = {
    arrow: (
      <>
        <path d="M5 19 19 5M5 5h14v14" />
      </>
    ),
    heart: (
      <path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    cup: (
      <>
        <path d="M3 8h14v8a7 7 0 0 1-14 0V8ZM17 9h2a3 3 0 0 1 0 6h-2M2 23h17M7 4V1M13 4V1" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M20 4l-2 2M6 18l-2 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 5" />,
    leaf: (
      <>
        <path d="M20 3C7 2 1 9 5 17S22 18 20 3ZM4 21 16 9" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.arrow}
    </svg>
  );
}
