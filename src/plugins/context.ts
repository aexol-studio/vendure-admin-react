import React from 'react';
import { PluginStore } from './store';

const PluginStoreContext = React.createContext(new PluginStore());

export default PluginStoreContext;
