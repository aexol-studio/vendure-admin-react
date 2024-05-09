import { Event } from './event';

export class EventCallableRegistry {
  registry: Map<string, Array<(event: Event) => {}>>;

  constructor() {
    this.registry = new Map();
  }

  addEventListener(name: string, callback: any) {
    let callbacks = this.registry.get(name);
    if (callbacks) callbacks.push(callback);
    else this.registry.set(name, [callback]);
  }

  removeEventListener(name: string, callback: any) {
    let callbacks = this.registry.get(name);
    if (callbacks) {
      const indexOf = callbacks.indexOf(callback);
      if (indexOf > -1) callbacks.splice(indexOf, 1);
    }
  }

  dispatchEvent(event: Event) {
    if (!('type' in event)) return;
    let callbacks = this.registry.get(event.type as string);
    for (let i in callbacks) {
      callbacks[i as any](event);
      if (!event.propagate) break;
    }
  }
}
