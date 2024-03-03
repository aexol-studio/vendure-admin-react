import { logOut } from '@/common/client';
import { BagShopping, SideMenuButton, Stack } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const Menu: React.FC<{ children?: React.ReactNode; onLogout: () => void }> = ({ onLogout }) => {
  const { t } = useTranslation(['common']);
  return (
    <React.Suspense fallback="loading...">
      <Sidebar direction="column">
        <SideMenuButton
          icon={<BagShopping />}
          label={t('menu.products')}
          href="/products"
          LinkComponent={styled.a`
            display: block;
          `}
        />
        <SideMenuButton
          icon={<BagShopping />}
          label={t('menu.collections')}
          href="/collections"
          LinkComponent={styled.a`
            display: block;
          `}
        />
        <SideMenuButton
          onClick={() => {
            logOut();
            onLogout();
          }}
          label={t('menu.logOut')}
          href="/"
          LinkComponent={styled.a``}
        />
      </Sidebar>
    </React.Suspense>
  );
};

const Sidebar = styled(Stack)`
  width: 24rem;
  height: 100%;
  padding: 1rem;
  background-color: ${(p) => p.theme.neutrals.L8};
`;
