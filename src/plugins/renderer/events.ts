import { Event } from "../event";

export default class ComponentUpdatedEvent extends Event {
  position: string;
  constructor(name: string, position: string) {
    super(name);
    this.position = position;
  }
}
