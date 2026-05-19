export default function AIIcon({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 15">
      <defs>
        <linearGradient id="aiGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>

      <path
        d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
        fill="url(#aiGradient)"
      />
    </svg>
  );
}
