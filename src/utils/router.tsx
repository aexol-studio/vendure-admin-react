import { Dashboard } from '@/pages/Dashboard';
import { CollectionsListPage } from '@/pages/collections/List';
import { MarketPlaceListPage } from '@/pages/marketplace/List';
import { OrderListPage } from '@/pages/orders/List';
import { OrderPage } from '@/pages/orders/OrderPage';
import { ProductDetailPage } from '@/pages/products/Detail/Detail';
import { ProductListPage } from '@/pages/products/List';
import { createBrowserRouter } from 'react-router-dom';
import { Root } from '@/pages/Root';
import { ChannelsPage } from '@/pages/channels/ChannelsPage';

export const Routes = {
  dashboard: '/admin-ui/',
  marketplace: '/admin-ui/marketplace',
  products: '/admin-ui/products',
  product: { route: '/admin-ui/products/:id', to: (productId: string) => `/admin-ui/products/${productId}` },
  collections: '/admin-ui/collections',
  orders: '/admin-ui/orders',
  order: { route: '/admin-ui/orders/:id', to: (orderId: string) => `/admin-ui/orders/${orderId}` },
  channels: '/admin-ui/channels',
} as const;

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: Routes.dashboard,
        element: <Dashboard />,
      },
      {
        path: Routes.marketplace,
        element: <MarketPlaceListPage />,
      },
      {
        path: Routes.products,
        element: <ProductListPage />,
      },
      {
        path: Routes.product.route,
        element: <ProductDetailPage />,
      },
      {
        path: Routes.collections,
        element: <CollectionsListPage />,
      },
      {
        path: Routes.orders,
        element: <OrderListPage />,
      },
      {
        path: Routes.order.route,
        element: <OrderPage />,
      },
      {
        path: Routes.channels,
        element: <ChannelsPage />,
      },
    ],
  },
]);
