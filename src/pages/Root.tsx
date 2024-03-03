import { Layout } from '@/common/Layout';
import { Menu } from '@/common/Menu';
import { Stack, Typography } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import React from 'react';
import { Link, Outlet, useMatches } from 'react-router-dom';

export const Root = () => {
  const matches = useMatches();
  const crumbs = matches
    .filter((match) => !!match.pathname)
    .map((match) => match.pathname)
    .flatMap((p) => p.split('/'))
    .filter(Boolean);
  console.log({ crumbs });
  const linkPath: string[] = [];
  return (
    <Layout>
      <Menu />
      <Content>
        <Stack direction="column">
          <CrumbsStack>
            {crumbs.map((c, i) => {
              linkPath.push(c);
              return (
                <React.Fragment key={c}>
                  <Link to={'/' + linkPath.join('/')}>
                    <Typography variant="Body 3 M">{c}</Typography>
                  </Link>
                  {i !== crumbs.length - 1 && <Typography variant="Body 3 M">/</Typography>}
                </React.Fragment>
              );
            })}
          </CrumbsStack>
          <Outlet />
        </Stack>
      </Content>
    </Layout>
  );
};
const CrumbsStack = styled(Stack)`
  padding: 1rem;
  background-color: ${(p) => p.theme.neutrals.L5};
`;

const Content = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: auto;
`;
