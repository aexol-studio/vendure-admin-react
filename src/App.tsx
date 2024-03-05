import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Root } from '@/pages/Root';
import { Layout } from '@/common/Layout';
import { useEffect, useState } from 'react';
import { adminApiMutation, loginAtom, token } from '@/common/client';
import { Button, Stack, TextField } from '@aexol-studio/styling-system';
import { ProductListPage } from '@/pages/products/List';
import { CollectionsListPage } from '@/pages/collections/List';
import { useAtom } from 'jotai';
import { ProductDetailPage } from '@/pages/products/Detail';
import { OrderListPage } from '@/pages/orders/List';
const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: 'products',
        element: <ProductListPage />,
      },
      {
        path: 'products/:slug',
        element: <ProductDetailPage />,
      },
      {
        path: 'collections',
        element: <CollectionsListPage />,
      },
      {
        path: 'orders',
        element: <OrderListPage />,
      },
      {
        // this is not slug but for easier usage with useDetail hook I marked this as slug even its id
        path: 'orders/:slug',
        element: <OrderListPage />,
      },
    ],
  },
]);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useAtom(loginAtom);
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
    <>
      {isLoggedIn === 'yes' && <RouterProvider router={router} />}
      {isLoggedIn === 'no' && (
        <Layout>
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
        </Layout>
      )}
    </>
  );
}

export default App;
