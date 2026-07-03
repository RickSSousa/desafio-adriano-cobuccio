import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 'h-8 w-8', text: 'text-lg' },
  md: { icon: 'h-10 w-10', text: 'text-xl' },
  lg: { icon: 'h-12 w-12', text: 'text-2xl' },
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const s = sizeMap[size];

  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <div
        className={`${s.icon} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 shadow-glow-sm transition-transform group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-1/2 w-1/2 text-vault-950"
          aria-hidden
        >
          <path
            d="M12 2L4 6v6c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6l-8-4z"
            fill="currentColor"
            opacity="0.9"
          />
          <path
            d="M12 8v8M9 11h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText && (
        <span className={`${s.text} font-display font-bold tracking-tight text-vault-50`}>
          Vault<span className="text-accent-400">Pay</span>
        </span>
      )}
    </Link>
  );
}
