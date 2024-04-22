import { adminApiQuery } from '@/common/client';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useList } from '@/lists/useList';
import { useTranslation } from 'react-i18next';

const getPlugins = async () => {
  const response = await adminApiQuery()({
    globalSettings: { serverConfig: { plugins: { name: true, version: true, path: true } } },
  });
  return response.globalSettings.serverConfig.plugins;
};

export const MarketPlaceListPage = () => {
  const { objects: plugins, Paginate } = useList({
    route: async () => {
      const data = await getPlugins();
      return { items: data, totalItems: data?.length || 0 };
    },
    listType: 'marketplace',
  });
  const { t } = useTranslation('products');

  return (
    <div className="grid grid-cols-4 gap-4">
      {plugins?.map((plugin) => {
        return (
          <Card key={plugin.name}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                {plugin.name}
                <Badge>version: {plugin.version}</Badge>
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
                        <p>This plugin is located at</p>
                        <p className="text-xs">{plugin.path}</p>
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
