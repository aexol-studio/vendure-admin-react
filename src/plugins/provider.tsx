import React, { PropsWithChildren } from 'react';
import { PluginStore } from './store';
import PluginStoreContext from './context';

export const PluginProvider: React.FC<PropsWithChildren<{ pluginStore: PluginStore }>> = ({
  pluginStore,
  children,
}) => {
  return <PluginStoreContext.Provider value={pluginStore}>{children}</PluginStoreContext.Provider>;
};
