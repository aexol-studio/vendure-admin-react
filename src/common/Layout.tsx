import styled from '@emotion/styled';
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Main className="bg-background text-foreground">{children}</Main>;
};

const Main = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  a {
    display: contents;
    text-decoration: none;
  }
`;
