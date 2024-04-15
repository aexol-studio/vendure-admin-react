import { logOut, loginAtom } from '@/common/client';
import { useAtom } from 'jotai';
import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
} from '@/components';

import { Bell, GripVertical, MenuIcon, Package2 } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';
import { Nav } from './AwesomeMenu/Nav';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ShoppingCart, Folder, Barcode } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { ChannelSwitcher } from './AwesomeMenu/ChannelSwitcher';

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
  const { t } = useTranslation(['common']);
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);
  const [, setIsLoggedIn] = useAtom(loginAtom);

  return (
    <div className="w-full border-r bg-muted/40">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[50px] items-center border-b px-4 lg:h-[60px] lg:px-6">
          <div className="flex gap-4 items-center">
            <NavLink to="/" className="font-semibold">
              <div className="flex items-center gap-2">
                <Package2 className="h-6 w-6" />
                <span className="">Aexol Shop</span>
              </div>
            </NavLink>
          </div>
          <div className="flex-1" />
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Toggle notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mr-4">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setIsLoggedIn('no');
                    logOut();
                  }}
                >
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>{' '}
          </div>
        </div>
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
                <div className={cn('flex h-[52px] items-center justify-center', isCollapsed ? 'h-[52px]' : 'px-2')}>
                  <ChannelSwitcher isCollapsed={isCollapsed} channels={[{ code: 'test', icon: <></>, label: '' }]} />
                </div>
                <Separator />
                <Nav
                  isCollapsed={isCollapsed}
                  links={[
                    { title: t('menu.products'), href: '/products', icon: Barcode },
                    { title: t('menu.collections'), href: '/collections', icon: Folder },
                    { title: t('menu.orders'), href: '/orders', icon: ShoppingCart },
                  ]}
                />
                <Separator />
                {!isCollapsed && (
                  <div className="mt-auto p-4">
                    <Card>
                      <CardHeader className="p-2 pt-0 md:p-4">
                        <CardTitle>Upgrade to Pro</CardTitle>
                        <CardDescription>
                          Unlock all features and get unlimited access to our support team.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                        <Button size="sm" className="w-full">
                          Upgrade
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel>
                <ScrollArea className="relative h-[calc(100vh-50px)] lg:h-[calc(100vh-60px)] overflow-y-auto">
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
