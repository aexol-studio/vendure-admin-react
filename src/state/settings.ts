import { ChannelType } from '@/graphql/draft_order';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SETTINGS_LOCAL_STORAGE_KEY = 'vendure-admin-panel-storage';

interface Settings {
  language: string;
  token: string | undefined;
  isLoggedIn: boolean;
  selectedChannel: ChannelType | undefined;
}

interface Actions {
  setLanguage(language: string): void;
  logIn(token: string): void;
  logOut(): void;
  setSelectedChannel(selectedChannel: ChannelType): void;
}

export const useSettings = create<Settings & Actions>()(
  persist(
    (set) => ({
      language: 'en',
      token: undefined,
      isLoggedIn: false,
      selectedChannel: undefined,
      setLanguage: (language) => set({ language }),
      logIn: (token) => set({ token, isLoggedIn: true }),
      logOut: () => set({ token: undefined, selectedChannel: undefined, isLoggedIn: false }),
      setSelectedChannel: (selectedChannel) => set({ selectedChannel }),
    }),
    { name: SETTINGS_LOCAL_STORAGE_KEY },
  ),
);
