import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { Layout } from '@/common/Layout';
import { Menu } from '@/common/Menu';
import { useEffect, useState } from 'react';
import { storefrontApiMutation, token } from '@/common/client';
import { Button, Stack, TextField } from '@aexol-studio/styling-system';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
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
      <Menu />
      {isLoggedIn === 'yes' && <RouterProvider router={router} />}
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
                storefrontApiMutation()({
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

export default App;
