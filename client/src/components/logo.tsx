export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Dirt & Leaf logo"
    >
      <path
        d="M24 42C17 37.8 13 31.1 13 23.6C13 17 17.4 11.8 24 10c6.6 1.8 11 7 11 13.6c0 7.5-4 14.2-11 18.4Z"
        fill="currentColor"
        opacity=".16"
      />
      <path d="M24 38V14" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path
        d="M24 20c-4.8 0-9.2-2.6-11-7 7.6-.6 13.5 1.1 16 7"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 24c4.8 0 9.2-2.6 11-7-7.6-.6-13.5 1.1-16 7"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
