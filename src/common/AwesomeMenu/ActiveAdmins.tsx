import { Button, Label } from '@/components';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ActiveAdminsAtom } from '@/state/atoms';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { NavLink } from 'react-router-dom';

const ActiveDot = () => {
  return (
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="w-2 h-2 bg-green-500 rounded-full"
    />
  );
};

const formatTimeAgo = (_date?: Date) => {
  if (!_date) return '---';
  const date = new Date(_date);
  const now = new Date();
  const diffInMinutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (diffInMinutes === 0) return 'przed chwilą';
  else if (diffInMinutes === 1) return '1 minutę temu';
  else if (diffInMinutes > 1 && diffInMinutes < 5) return `${diffInMinutes} minuty temu`;
  else return `ponad 5 minut temu`;
};

export const ActiveAdmins = () => {
  const [clients] = useAtom(ActiveAdminsAtom);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          Active administrators ({clients?.length || 0})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mr-4">
        <div className="flex flex-col gap-4 rounded-md">
          <Label className="select-none">Active administrators</Label>
          {clients.length ? (
            clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between">
                <div className="flex flex-col w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">
                      {client.firstName} {client.lastName} {client.me && '(me)'}
                    </span>
                    <ActiveDot />
                  </div>
                  <span className="text-sm text-muted-foreground">{formatTimeAgo(client.lastActive)}</span>
                  {!client.me && (
                    <NavLink to={client.location} className="text-sm text-muted-foreground">
                      {client.location.replace(window.location.origin, '')}
                    </NavLink>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div>
              <span className="text-sm text-muted-foreground">No active administrators</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
