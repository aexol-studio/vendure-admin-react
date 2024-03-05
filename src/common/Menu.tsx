import { logOut, loginAtom } from '@/common/client';
import { BagShopping, Book, CartShoppingFast, Folder, Stack, Typography } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import { useAtom } from 'jotai';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

export const Menu: React.FC<{ children?: React.ReactNode }> = () => {
  const { t } = useTranslation(['common']);
  const [, setIsLoggedIn] = useAtom(loginAtom);
  return (
    <React.Suspense fallback="loading...">
      <Sidebar direction="column">
        <SideMenuButton icon={<Book />} label={t('menu.products')} href="/products" />
        <SideMenuButton icon={<Folder />} label={t('menu.collections')} href="/collections" />
        <SideMenuButton icon={<CartShoppingFast />} label={t('menu.orders')} href="/orders" />
        <MenuButton
          align="center"
          gap="0.5rem"
          onClick={() => {
            logOut();
            setIsLoggedIn('no');
          }}
        >
          <BagShopping />
          <Typography variant="Body 2 R">{t('menu.logOut')}</Typography>
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
      <MenuButton align="center" gap="0.5rem">
        {icon}
        <Typography color="inherit" variant="Body 2 SB">
          {label}
        </Typography>
      </MenuButton>
    </NavLink>
  );
};
const MenuButton = styled(Stack)`
  padding: 0.5rem 1.25rem;
  border-bottom: ${(p) => p.theme.neutrals.L6} 1px solid;
  svg {
    color: ${(p) => p.theme.text.active};
    width: 1rem;
  }
`;
const Sidebar = styled(Stack)`
  width: 24rem;
  height: 100%;
  padding: 1rem;
  background-color: ${(p) => p.theme.neutrals.L8};
  a {
    color: ${(p) => p.theme.text.default};
    &.active {
      color: ${(p) => p.theme.text.active};
    }
  }
`;
