'use client';

import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NavLink, useLocation } from 'react-router-dom';

interface NavProps {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    href: string;
    icon: LucideIcon;
  }[];
}

export function Nav({ links, isCollapsed }: NavProps) {
  const location = useLocation();

  return (
    <div data-collapsed={isCollapsed} className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <NavLink to={link.href}>
                  <div
                    className={cn(
                      buttonVariants({ variant: 'ghost', size: 'icon' }),
                      'h-9 w-9',
                      location.pathname === link.href &&
                        'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white',
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="sr-only">{link.title}</span>
                  </div>
                </NavLink>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && <span className="ml-auto text-muted-foreground">{link.label}</span>}
              </TooltipContent>
            </Tooltip>
          ) : (
            <NavLink to={link.href} key={index}>
              <div
                key={index}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  location.pathname === link.href &&
                    'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
                  'justify-start',
                )}
              >
                <link.icon className="mr-2 h-4 w-4" />
                {link.title}
                {link.label && (
                  <span className={cn('ml-auto', location.pathname === link.href && 'text-background dark:text-white')}>
                    {link.label}
                  </span>
                )}
              </div>
            </NavLink>
          ),
        )}
      </nav>
    </div>
  );
}
