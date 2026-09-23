import type { ReactNode } from 'react';

import { ScreenShell } from '@/components/ScreenShell/ScreenShell';

type TabScreenShellProps = {
  title: string;
  children: ReactNode;
  right?: ReactNode;
};

export function TabScreenShell({ title, children, right }: TabScreenShellProps) {
  return (
    <ScreenShell title={title} leading="drawer" right={right}>
      {children}
    </ScreenShell>
  );
}
