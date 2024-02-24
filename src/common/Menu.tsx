import { SideMenuButton, Stack } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import React from 'react';

export const Menu: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <Sidebar direction="column">
      {children}
      <Stack direction="column">
        <SideMenuButton label="products" href="/products" LinkComponent={styled.a``} />
      </Stack>
    </Sidebar>
  );
};

const Sidebar = styled(Stack)`
  width: 20rem;
  height: 100%;
  background-color: ${(p) => p.theme.neutrals.L7};
`;
