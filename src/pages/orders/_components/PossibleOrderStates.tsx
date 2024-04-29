import React from 'react';
import { Button, ScrollArea } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Timeline,
  TimelineItem,
  TimelineLine,
  TimelineDot,
  TimelineContent,
  TimelineHeading,
} from '@/components/ui/timeline';

export const PossibleOrderStates: React.FC<{
  orderState: string;
  orderProcess: { name: string; to: string[] }[];
}> = ({ orderState, orderProcess }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Order states</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[40vw]">
        <DialogHeader>
          <DialogTitle>Order states</DialogTitle>
          <DialogDescription>
            Here you can see all possible states for the order, and the current state of the order.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[80vh]">
          <Timeline>
            {orderProcess?.map((state) => {
              const currentIndex = orderProcess?.findIndex((s) => s.name === orderState);
              const done = orderProcess?.findIndex((s) => s.name === state.name) < currentIndex;
              return (
                <TimelineItem key={state.name} status={done ? 'done' : 'default'}>
                  <TimelineLine done={done} />
                  <TimelineDot status={done ? 'done' : 'default'} />
                  <TimelineContent>
                    <TimelineHeading>{state.name}</TimelineHeading>
                    <p>{state.to.join(', ')}</p>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
