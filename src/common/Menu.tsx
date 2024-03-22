import { logOut, loginAtom } from '@/common/client';
import styled from '@emotion/styled';
import { useAtom } from 'jotai';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { BookmarkIcon, FileIcon, BackpackIcon, BarChartIcon } from '@radix-ui/react-icons';
export const Menu: React.FC<{ children?: React.ReactNode }> = () => {
  const { t } = useTranslation(['common']);
  const [, setIsLoggedIn] = useAtom(loginAtom);
  return (
    <React.Suspense fallback="loading...">
      <Sidebar>
        <SideMenuButton icon={<BookmarkIcon />} label={t('menu.products')} href="/products" />
        <SideMenuButton icon={<FileIcon />} label={t('menu.collections')} href="/collections" />
        <SideMenuButton icon={<BarChartIcon />} label={t('menu.orders')} href="/orders" />
        <MenuButton
          onClick={() => {
            logOut();
            setIsLoggedIn('no');
          }}
        >
          <BackpackIcon />
          <p>{t('menu.logOut')}</p>
        </MenuButton>
      </Sidebar>
    </React.Suspense>
  );
};
const SideMenuButton: React.FC<{
  label: string;
  href: string;
  icon: React.ReactNode;
}> = ({ href, icon, label }) => {
  return (
    <NavLink to={href}>
      <MenuButton>
        {icon}
        <p>{label}</p>
      </MenuButton>
    </NavLink>
  );
};
const MenuButton = styled.div`
  padding: 0.5rem 1.25rem;
  svg {
    width: 1rem;
  }
`;
const Sidebar = styled.div`
  width: 24rem;
  height: 100%;
  padding: 1rem;
`;
