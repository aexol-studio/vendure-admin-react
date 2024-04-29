// import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// import { useServer } from '@/state/server';
// import { Check, X } from 'lucide-react';

export const MarketPlaceListPage = () => {
  // const serverConfig = useServer((p) => p.serverConfig);
  return null;
  // return (
  //   <div className="grid grid-cols-4 gap-4">
  //     {serverConfig?.plugins?.map((plugin) => {
  //       return (
  //         <Card key={plugin.name}>
  //           <CardHeader>
  //             <CardTitle className="flex flex-col justify-between gap-4">
  //               <span>{plugin.name}</span>
  //               <Badge variant="destructive" noHover className="w-fit gap-2">
  //                 <span className="tracking-wide">version:</span>
  //                 {plugin.version}
  //               </Badge>
  //               <Badge variant="outline" noHover className="w-fit gap-2">
  //                 <span>Active:</span>
  //                 {plugin.active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
  //               </Badge>
  //             </CardTitle>
  //             <CardDescription></CardDescription>
  //           </CardHeader>
  //           <CardContent>
  //             <Dialog>
  //               <DialogTrigger asChild>
  //                 <Button variant="outline">More information</Button>
  //               </DialogTrigger>
  //               <DialogContent className="flex h-[50vh] max-w-[60vw] flex-col gap-4">
  //                 <DialogHeader>
  //                   <DialogTitle>{plugin.name}</DialogTitle>
  //                 </DialogHeader>
  //                 <div>
  //                   {plugin.path ? (
  //                     <div>
  //                       <div>
  //                         <p>This plugin is located at</p>
  //                         <p className="text-xs">{plugin.path}</p>
  //                       </div>
  //                       <div>
  //                         <p>Status: </p>
  //                         <p className="text-xs">{plugin.status}</p>
  //                       </div>
  //                       <div>
  //                         <p>Active: </p>
  //                         <p className="text-xs">{plugin.active ? 'Yes' : 'No'}</p>
  //                       </div>
  //                       {!plugin.active ? <Button variant="outline">Activate</Button> : null}
  //                     </div>
  //                   ) : null}
  //                 </div>
  //               </DialogContent>
  //             </Dialog>
  //           </CardContent>
  //         </Card>
  //       );
  //     })}
  //   </div>
  // );
};
