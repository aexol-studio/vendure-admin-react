import { logOut } from '@/common/client';
import { SideMenuButton, Stack } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const Menu: React.FC<{ children?: React.ReactNode; onLogout: () => void }> = ({ children, onLogout }) => {
  const { t } = useTranslation(['common']);
  useEffect(() => {
    setTimeout(() => {
      console.log(t('common:menu.logOut'));
    }, 3000);
  }, [t]);
  return (
    <React.Suspense fallback="loading...">
      <Sidebar direction="column">
        {children}
        <Stack direction="column">
          <SideMenuButton label={t('menu.products')} href="/products" LinkComponent={styled.a``} />
          <SideMenuButton
            onClick={() => {
              logOut();
              onLogout();
            }}
            label={t('menu.logOut')}
            href="/"
            LinkComponent={styled.a``}
          />
        </Stack>
      </Sidebar>
    </React.Suspense>
  );
};

const Sidebar = styled(Stack)`
  width: 20rem;
  height: 100%;
  background-color: ${(p) => p.theme.neutrals.L8};
`;
