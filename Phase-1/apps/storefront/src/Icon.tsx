export function Icon({
  name,
  filled = false,
  size = 24,
  className
}: {
  name: string;
  filled?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "filled" : ""} ${className ?? ""}`}
      style={{ fontSize: size, width: size, height: size }}
      aria-hidden
    >
      {name}
    </span>
  );
}
