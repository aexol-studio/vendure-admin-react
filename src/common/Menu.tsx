import { logOut, loginAtom } from '@/common/client';
import { useAtom } from 'jotai';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, LogOut, Folder, Barcode } from 'lucide-react';
import { cn } from '@/lib/utils';
export const Menu: React.FC<{ children?: React.ReactNode }> = () => {
  const { t } = useTranslation(['common']);
  const [, setIsLoggedIn] = useAtom(loginAtom);
  return (
    <React.Suspense fallback="loading...">
      <div className={cn(`relative hidden h-screen border-r lg:block w-72 space-y-8 p-4`)}>
        <SideMenuButton icon={<Barcode />} label={t('menu.products')} href="/products" />
        <SideMenuButton icon={<Folder />} label={t('menu.collections')} href="/collections" />
        <SideMenuButton icon={<ShoppingCart />} label={t('menu.orders')} href="/orders" />
        <div
          onClick={() => {
            logOut();
            setIsLoggedIn('no');
          }}
          className={MenuButton()}
        >
          <LogOut />
          <p>{t('menu.logOut')}</p>
        </div>
      </div>
    </React.Suspense>
  );
};
const SideMenuButton: React.FC<{
  label: string;
  href: string;
  icon: React.ReactNode;
}> = ({ href, icon, label }) => {
  const location = useLocation();
  return (
    <NavLink to={href}>
      <div className={MenuButton(location.pathname === href)}>
        {icon}
        <p>{label}</p>
      </div>
    </NavLink>
  );
};
const MenuButton = (current?: boolean) =>
  cn(
    'group flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
    current ? 'bg-accent' : 'transparent',
  );
