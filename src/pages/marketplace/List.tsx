import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PluginsAtom } from '@/state/atoms';
import { useAtomValue } from 'jotai';
import { Check, X } from 'lucide-react';

import { useTranslation } from 'react-i18next';

export const MarketPlaceListPage = () => {
  const plugins = useAtomValue(PluginsAtom);
  const { t } = useTranslation('products');

  return (
    <div className="grid grid-cols-4 gap-4">
      {plugins?.map((plugin) => {
        return (
          <Card key={plugin.name}>
            <CardHeader>
              <CardTitle className="flex justify-between flex-col gap-4">
                <span>{plugin.name}</span>
                <Badge variant="destructive" noHover className="w-fit gap-2">
                  <span className="tracking-wide">version:</span>
                  {plugin.version}
                </Badge>
                <Badge variant="outline" noHover className="w-fit gap-2">
                  <span>Active:</span>
                  {plugin.active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </Badge>
              </CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">More information</Button>
                </DialogTrigger>
                <DialogContent className="flex h-[50vh] max-w-[60vw] flex-col gap-4">
                  <DialogHeader>
                    <DialogTitle>{plugin.name}</DialogTitle>
                  </DialogHeader>
                  <div>
                    {plugin.path ? (
                      <div>
                        <div>
                          <p>This plugin is located at</p>
                          <p className="text-xs">{plugin.path}</p>
                        </div>
                        <div>
                          <p>Status: </p>
                          <p className="text-xs">{plugin.status}</p>
                        </div>
                        <div>
                          <p>Active: </p>
                          <p className="text-xs">{plugin.active ? 'Yes' : 'No'}</p>
                        </div>
                        {!plugin.active ? <Button variant="outline">Activate</Button> : null}
                      </div>
                    ) : null}
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
