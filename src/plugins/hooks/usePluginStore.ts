import { useContext } from 'react';
import PluginStoreContext from '../context';

export function usePluginStore() {
  if (!PluginStoreContext) {
    throw new Error('PluginStoreContext is not defined');
  }
  return useContext(PluginStoreContext);
}
