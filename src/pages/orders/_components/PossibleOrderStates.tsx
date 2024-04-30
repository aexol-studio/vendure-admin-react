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
import { useServer } from '@/state/server';
import { useTranslation } from 'react-i18next';

export const PossibleOrderStates: React.FC<{
  orderState: string;
}> = ({ orderState }) => {
  const { t } = useTranslation('orders');
  const orderProcess = useServer((p) => p.serverConfig?.orderProcess || []);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          {t('orderStates.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[40vw]">
        <DialogHeader>
          <DialogTitle>{t('orderStates.title')}</DialogTitle>
          <DialogDescription>{t('orderStates.description')}</DialogDescription>
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
