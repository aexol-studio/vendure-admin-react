import { Layout } from '@/common/Layout';
import { Menu } from '@/common/Menu';
import { Stack } from '@/components/Stack';
import styled from '@emotion/styled';
import { Outlet } from 'react-router-dom';

export const Root = () => {
  return (
    <Layout>
      <Menu>
        <Content className="h-full flex-1 space-y-4 p-4 pt-6 md:p-8">
          <Stack className="gap-y-4" column>
            <Outlet />
          </Stack>
        </Content>
      </Menu>
    </Layout>
  );
};

const Content = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: auto;
`;
