
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only on the client-side after mounting.
 * Useful for wrapping components that rely on browser-specific APIs
 * or need to avoid server-client hydration mismatches.
 */
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps): ReactNode {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return fallback;
  }

  return children;
}
