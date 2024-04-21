import { adminApiQuery, logOut, loginAtom } from '@/common/client';
import { useAtom } from 'jotai';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label,
  ScrollArea,
} from '@/components';

import {
  BarChart,
  Bell,
  FlagIcon,
  GripVertical,
  LogOutIcon,
  MenuIcon,
  Moon,
  Package2,
  Slash,
  Store,
  Sun,
} from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';
import { Nav } from './AwesomeMenu/Nav';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ShoppingCart, Folder, Barcode } from 'lucide-react';
import { NavLink, useMatches } from 'react-router-dom';
import { ChannelSwitcher } from './AwesomeMenu/ChannelSwitcher';
import { useTheme } from '@/theme/useTheme';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
);

export const Menu: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const linkPath: string[] = [];
  const { t } = useTranslation(['common']);
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);
  const [, setIsLoggedIn] = useAtom(loginAtom);

  const [activeChannel, setActiveChannel] = React.useState<{
    id: string;
    code: string;
  }>();
  const [channels, setChannels] = React.useState<
    {
      id: string;
      code: string;
      token?: string;
      icon: React.ReactNode;
    }[]
  >([]);
  useEffect(() => {
    Promise.all([
      adminApiQuery()({
        activeChannel: { id: true, code: true, token: true },
      }),
      adminApiQuery()({
        channels: [{ options: { take: 10 } }, { items: { id: true, code: true, token: true }, totalItems: true }],
      }),
    ]).then(([{ activeChannel }, { channels }]) => {
      setActiveChannel(activeChannel);
      const data = channels.items.map((channel) => ({
        id: channel?.id,
        code: channel?.code,
        token: channel?.token,
        icon: <FlagIcon />,
      }));
      setChannels(data);
    });
  }, []);

  const onChannelChange = (id: string) => {
    const channel = channels.find((channel) => channel.id === id);
    setActiveChannel(channel);
    window.localStorage.setItem('vendure-token', channel?.token || '');
  };

  const matches = useMatches();
  const removableCrumbs = ['draft'];
  const crumbs = matches
    .filter((match) => !!match.pathname)
    .map((match) => match.pathname)
    .flatMap((p) => p.split('/'))
    .filter(Boolean)
    .filter((crumb) => !removableCrumbs.includes(crumb));
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-full border-r bg-muted/40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex-1">
          <TooltipProvider delayDuration={100}>
            <ResizablePanelGroup
              onLayout={(sizes: number[]) => {
                document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
              }}
              direction="horizontal"
              className="h-full w-full"
            >
              <ResizablePanel
                defaultSize={18}
                collapsedSize={4}
                collapsible
                minSize={10}
                maxSize={20}
                onExpand={() => {
                  setIsCollapsed(false);
                  document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
                }}
                onCollapse={() => {
                  setIsCollapsed(true);
                  document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
                }}
                className={cn(isCollapsed && 'min-w-[50px] transition-all duration-300 ease-in-out')}
              >
                <div
                  className={cn(
                    'flex h-[70px] items-center justify-center border-b lg:h-[80px]',
                    isCollapsed ? '' : 'px-2',
                  )}
                >
                  <ChannelSwitcher
                    isCollapsed={isCollapsed}
                    activeChannel={activeChannel}
                    channels={channels}
                    onChannelChange={onChannelChange}
                  />
                </div>
                <Separator />
                <Nav
                  isCollapsed={isCollapsed}
                  links={[
                    { title: t('menu.dashboard'), href: '/', icon: BarChart },
                    { title: t('menu.marketplace'), href: '/marketplace', icon: Store },
                    { title: t('menu.products'), href: '/products', icon: Barcode },
                    { title: t('menu.collections'), href: '/collections', icon: Folder },
                    { title: t('menu.orders'), href: '/orders', icon: ShoppingCart },
                  ]}
                />
                <Separator />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel>
                <div className="flex h-[70px] items-start border-b px-4 py-4 lg:h-[80px] lg:px-6">
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <Package2 className="h-6 w-6" />
                      <span className="">Aexol Shop</span>
                    </div>
                    <Breadcrumb>
                      <BreadcrumbList>
                        {crumbs.length ? (
                          crumbs.map((c, i) => {
                            linkPath.push(c);
                            return (
                              <React.Fragment key={c}>
                                <BreadcrumbItem>
                                  <NavLink to={'/' + linkPath.join('/')}>
                                    <p className="capitalize">{c}</p>
                                  </NavLink>
                                </BreadcrumbItem>
                                {i !== crumbs.length - 1 && (
                                  <BreadcrumbSeparator>
                                    <Slash />
                                  </BreadcrumbSeparator>
                                )}
                              </React.Fragment>
                            );
                          })
                        ) : (
                          <BreadcrumbItem>
                            <NavLink to="/">
                              <p>Dashboard</p>
                            </NavLink>
                          </BreadcrumbItem>
                        )}
                      </BreadcrumbList>
                    </Breadcrumb>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10">
                          Active administrators (1)
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="mr-4">
                        <div className="flex flex-col gap-4 rounded-md">
                          <Label className="select-none">Active administrators</Label>
                          <span className="text-sm text-muted-foreground">No active administrators</span>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                          <Bell className="h-4 w-4" />
                          <span className="sr-only">Toggle notifications</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="mr-4">
                        <div className="flex flex-col gap-4 rounded-md">
                          <Label className="select-none">Notifications</Label>
                          <div className="flex items-center gap-4 border border-dashed p-4">
                            <Bell className="h-4 w-4 text-accent" />
                            <span className="text-sm text-muted-foreground">No new notifications</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          {theme === 'light' ? (
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          ) : (
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                          )}
                          <span className="sr-only">Toggle theme</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MenuIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="mr-4 w-56">
                        <DropdownMenuItem
                          className="flex cursor-pointer items-center gap-2"
                          onSelect={() => {
                            setIsLoggedIn('no');
                            logOut();
                          }}
                        >
                          <LogOutIcon className="h-4 w-4" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <ScrollArea className="relative h-[calc(100vh-70px)] overflow-y-hidden lg:h-[calc(100vh-80px)]">
                  {children}
                </ScrollArea>
              </ResizablePanel>
            </ResizablePanelGroup>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
