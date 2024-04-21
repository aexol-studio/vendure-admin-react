import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Root } from '@/pages/Root';
import { useEffect } from 'react';
import { loginAtom, token } from '@/common/client';
import { ProductListPage } from '@/pages/products/List';
import { CollectionsListPage } from '@/pages/collections/List';
import { useAtom } from 'jotai';
import { ProductDetailPage } from '@/pages/products/Detail/Detail';
import { OrderListPage } from '@/pages/orders/List';
import { OrderCreatePage } from './pages/orders/Create';
import { LoginScreen } from './pages/LoginScreen';
import { Dashboard } from './pages/Dashboard';
import { MarketPlaceListPage } from './pages/marketplace/List';
import { OrderDetailPage } from './pages/orders/Modify';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      {
        path: '',
        element: <Dashboard />,
      },
      {
        path: 'marketplace',
        element: <MarketPlaceListPage />,
      },
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
        path: 'orders',
        element: <OrderListPage />,
      },
      {
        path: 'orders/:id',
        element: <OrderCreatePage />,
      },
    ],
  },
]);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useAtom(loginAtom);

  useEffect(() => {
    if (token) setIsLoggedIn('yes');
    else setIsLoggedIn('no');
  }, []);

  return isLoggedIn === 'yes' ? <RouterProvider router={router} /> : <LoginScreen />;
}

export default App;
