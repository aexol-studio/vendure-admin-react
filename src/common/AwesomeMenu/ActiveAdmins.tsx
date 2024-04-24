import { Button, Label } from '@/components';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useServer } from '@/state/server';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

export const ActiveAdmins = () => {
  const { t } = useTranslation('common');
  const activeClients = useServer((p) => p.activeClients);

  const formatTimeAgo = (_date?: Date) => {
    if (!_date) return t('awesomeMenu.unknown');
    const date = new Date(_date);
    const now = new Date();
    const diffInMinutes = Math.round((now.getTime() - date.getTime()) / 60000);
    if (diffInMinutes === 0) return t('awesomeMenu.justNow');
    else if (diffInMinutes === 1) return t('awesomeMenu.oneMinAgo');
    else if (diffInMinutes > 1 && diffInMinutes < 5) return t('awesomeMenu.valueMinAgo', { diffInMinutes });
    else return t('awesomeMenu.above5MinAgo');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-10">
          {t('awesomeMenu.activeAdministratorsValue', { value: activeClients.length })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mr-4">
        <div className="flex flex-col gap-4 rounded-md">
          <Label className="select-none">{t('awesomeMenu.activeAdministrators')}</Label>
          {activeClients.length ? (
            activeClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between">
                <div className="flex w-full flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">
                      {client.firstName} {client.lastName} {client.me && '(me)'}
                    </span>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="h-2 w-2 rounded-full bg-green-500"
                    />
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
              <span className="text-sm text-muted-foreground">{t('awesomeMenu.noActiveAdministrators')}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
