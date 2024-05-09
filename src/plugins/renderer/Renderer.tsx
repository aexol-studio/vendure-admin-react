import React, { useEffect } from 'react';
import ComponentUpdatedEvent from './events';
import { usePluginStore } from '../hooks/usePluginStore';
import useForceUpdate from '../hooks/useForceUpdate';

export const Renderer: React.FC<{
  position: string;
}> = ({ position }) => {
  const pluginStore = usePluginStore();
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    const eventListener = (event: ComponentUpdatedEvent) => {
      if (event.position === position) forceUpdate();
    };
    pluginStore.addEventListener('Renderer.componentUpdated', eventListener);
    return () => {
      pluginStore.removeEventListener('Renderer.componentUpdated', eventListener);
    };
  }, [pluginStore, position, forceUpdate]);

  let components = pluginStore.executeFunction('Renderer.getComponentsInPosition', position) as {
    component: JSX.Element;
    key: string;
  }[];

  return <>{components && components.map(({ component, key }) => React.cloneElement(component, { key }))}</>;
};
