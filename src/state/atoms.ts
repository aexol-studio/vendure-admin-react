import { ChannelType, CountryType } from '@/graphql/draft_order';
import { atom } from 'jotai';

export const LoginAtom = atom<'no' | 'yes' | 'unknown'>('unknown');
export const ActiveChannelAtom = atom<ChannelType | undefined>(undefined);
export const CountriesAtom = atom<CountryType[]>([]);
export const ActiveAdminsAtom = atom<
  {
    id: string;
    emailAddress: string;
    firstName: string;
    lastName: string;
    location: string;
    lastActive: Date;
    me: boolean;
  }[]
>([]);
export const PluginsAtom = atom<
  {
    name: string;
    version?: string;
    path?: string;
    active?: boolean;
    status?: string;
  }[]
>([]);
