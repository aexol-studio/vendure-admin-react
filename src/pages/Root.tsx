import { Layout } from '@/common/Layout';
import { Menu } from '@/common/Menu';
import { Stack } from '@/components/ui/Stack';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import styled from '@emotion/styled';
import { Slash } from 'lucide-react';
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
      <Content className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Stack className="gap-y-4" column>
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.map((c, i) => {
                linkPath.push(c);
                return (
                  <React.Fragment key={c}>
                    <BreadcrumbItem>
                      <Link to={'/' + linkPath.join('/')}>
                        <p>{c}</p>
                      </Link>
                    </BreadcrumbItem>
                    {i !== crumbs.length - 1 && (
                      <BreadcrumbSeparator>
                        <Slash />
                      </BreadcrumbSeparator>
                    )}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
          <Outlet />
        </Stack>
      </Content>
    </Layout>
  );
};

const Content = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: auto;
`;
