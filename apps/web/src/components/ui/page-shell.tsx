interface PageShellProps {
  children: React.ReactNode;
  centered?: boolean;
  wide?: boolean;
  className?: string;
}

export function PageShell({ children, centered = false, wide = false, className = '' }: PageShellProps) {
  const widthClass = centered ? 'max-w-lg' : wide ? 'max-w-6xl' : 'max-w-4xl';

  return (
    <div className={`page-shell ${className}`}>
      <div
        className={`relative z-10 mx-auto px-4 ${widthClass} ${centered ? 'flex min-h-screen items-center py-12' : 'py-8'}`}
      >
        {children}
      </div>
    </div>
  );
}
