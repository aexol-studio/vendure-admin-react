import { VisibilityState } from '@tanstack/react-table';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ColumnsVisibilityStoreType {
  orders: VisibilityState;
  setOrders: (newOrders: VisibilityState) => void;
}

const _columnsVisibilityKey = 'columns-visibility-state';

export const columnsVisibilityStore = create<ColumnsVisibilityStoreType>()(
  persist(
    (set) => ({
      orders: {
        id: true,
        state: true,
        select: true,
        firstName: true,
        lastName: true,
        emailAddress: false,
        phoneNumber: false,
        code: false,
        createdAt: true,
        orderPlacedAt: true,
        shipping: true,
        type: false,
        updatedAt: false,
        actions: true,
      },
      setOrders: (newOrders: VisibilityState) =>
        set(() => ({
          orders: newOrders,
        })),
    }),
    {
      name: _columnsVisibilityKey,
    },
  ),
);
