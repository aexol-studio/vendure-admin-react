import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Layout } from '@/common/Layout';
import { Menu } from '@/common/Menu';
import { useEffect, useState } from 'react';
import { adminApiMutation, token } from '@/common/client';
import { Button, Stack, TextField } from '@aexol-studio/styling-system';
import styled from '@emotion/styled';
import { ProductListPage } from '@/pages/products/List';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/products',
    element: <ProductListPage />,
  },
]);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<'yes' | 'no' | 'loading'>('loading');
  const [formState, setFormState] = useState({
    username: '',
    password: '',
  });
  useEffect(() => {
    if (token) {
      setIsLoggedIn('yes');
    } else {
      setIsLoggedIn('no');
    }
  }, []);

  return (
    <Layout>
      <Menu
        onLogout={() => {
          setIsLoggedIn('no');
        }}
      />

      {isLoggedIn === 'yes' && (
        <Content>
          <RouterProvider router={router} />
        </Content>
      )}
      {isLoggedIn === 'no' && (
        <Stack direction="column" gap="1rem">
          <TextField
            value={formState.username}
            onChange={(e) =>
              setFormState({
                ...formState,
                username: e.target.value,
              })
            }
            placeholder="username"
          />
          <TextField
            onChange={(e) =>
              setFormState({
                ...formState,
                password: e.target.value,
              })
            }
            value={formState.password}
            placeholder="password"
            type="password"
          />
          <Stack justify="end">
            <Button
              onClick={() => {
                adminApiMutation()({
                  login: [
                    {
                      username: formState.username,
                      password: formState.password,
                    },
                    {
                      __typename: true,
                      '...on CurrentUser': {
                        id: true,
                      },
                      '...on InvalidCredentialsError': {
                        message: true,
                      },
                      '...on NativeAuthStrategyError': {
                        message: true,
                      },
                    },
                  ],
                }).then((r) => {
                  if (r.login.__typename === 'CurrentUser') {
                    setIsLoggedIn('yes');
                  }
                });
              }}
            >
              Login
            </Button>
          </Stack>
        </Stack>
      )}
    </Layout>
  );
}

const Content = styled.div`
  height: 100%;
  width: 100%;
`;

export default App;
