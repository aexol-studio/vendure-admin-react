import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Root } from '@/pages/Root';
import { Layout } from '@/common/Layout';
import { useEffect, useState } from 'react';
import { adminApiMutation, loginAtom, token } from '@/common/client';
import { ProductListPage } from '@/pages/products/List';
import { CollectionsListPage } from '@/pages/collections/List';
import { useAtom } from 'jotai';
import { ProductDetailPage } from '@/pages/products/Detail/Detail';
import { OrderListPage } from '@/pages/orders/List';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OrderCreatePage } from './pages/orders/Create';
import { Label } from './components';
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
      {
        path: 'orders/create',
        element: <OrderCreatePage />,
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
          <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
              <div className="mx-auto grid w-[350px] gap-6">
                <div className="grid gap-2 text-center">
                  <h1 className="text-3xl font-bold">Login</h1>
                  <p className="text-balance text-muted-foreground">Enter your email below to login to your account</p>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const data = await adminApiMutation()({
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
                    if (data.login.__typename === 'CurrentUser') {
                      setIsLoggedIn('yes');
                    }
                  }}
                  className="grid gap-4"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      value={formState.username}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          username: e.target.value,
                        })
                      }
                      placeholder="username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
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
                  </div>
                  <Button type="submit">Login</Button>
                </form>
              </div>
            </div>
            <div className="hidden bg-muted lg:block">
              <img
                src="/placeholder.svg"
                alt="Image"
                width="1920"
                height="1080"
                className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </div>
        </Layout>
      )}
    </>
  );
}

export default App;
