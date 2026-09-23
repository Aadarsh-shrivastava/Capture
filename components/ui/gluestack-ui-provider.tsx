import type { ReactNode } from 'react';
import { Fragment } from 'react';

export function GluestackUIProvider({
  children,
}: {
  children: ReactNode;
  mode?: 'light' | 'dark';
}) {
  return <Fragment>{children}</Fragment>;
}
