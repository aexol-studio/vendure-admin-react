'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';

interface ChannelswitcherProps {
  isCollapsed: boolean;
  channels: {
    label: string;
    code: string;
    icon: React.ReactNode;
  }[];
}

export function ChannelSwitcher({ isCollapsed, channels }: ChannelswitcherProps) {
  const [selectedAccount, setSelectedAccount] = React.useState<string>(channels[0].code);

  return (
    <Select defaultValue={selectedAccount} onValueChange={setSelectedAccount}>
      <SelectTrigger
        className={cn(
          'flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
          isCollapsed && 'flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden',
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          {channels.find((account) => account.code === selectedAccount)?.icon}
          <span className={cn('ml-2', isCollapsed && 'hidden')}>
            {channels.find((account) => account.code === selectedAccount)?.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {channels.map((account) => (
          <SelectItem key={account.code} value={account.code}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              {account.icon}
              {account.code}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
