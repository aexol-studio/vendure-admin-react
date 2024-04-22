'use client';

import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, buttonVariants } from '@/components';
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
    <div
      data-collapsed={isCollapsed}
      className="group flex h-[calc(100%-70px)] flex-col gap-4 py-2 data-[collapsed=true]:py-2 lg:h-[calc(100%-80px)]"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {links.map((link, index) =>
          isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <div>
                  <NavLink to={link.href}>
                    <div
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                        'h-9 w-9',
                        location.pathname === link.href &&
                          'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white',
                      )}
                    >
                      <link.icon className="h-6 w-6" />
                      <span className="sr-only">{link.title}</span>
                    </div>
                  </NavLink>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4 capitalize">
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
                  'justify-start capitalize',
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
      {!isCollapsed && (
        <div className="flex h-full flex-col justify-end p-4">
          <Card>
            <CardHeader className="p-2 pt-0 md:p-4">
              <CardTitle>Upgrade to Pro</CardTitle>
              <CardDescription>Unlock all features and get unlimited access to our support team.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
              <NavLink to="/marketplace">
                <Button size="sm" className="w-full">
                  Upgrade
                </Button>
              </NavLink>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
