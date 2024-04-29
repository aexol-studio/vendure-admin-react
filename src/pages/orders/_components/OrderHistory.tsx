import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from '@/components/ui/timeline';
import { Trash } from 'lucide-react';
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Label,
  Textarea,
} from '@/components';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { OrderStateBadge } from './OrderStateBadge';
import { OrderHistoryEntryType } from '@/graphql/draft_order';

export const OrderHistory: React.FC<{
  orderHistory: OrderHistoryEntryType[];
  addMessageToOrder: (data: { isPublic: boolean; note: string }) => Promise<void>;
  deleteMessageFromOrder: (id: string) => void;
}> = ({ addMessageToOrder, orderHistory, deleteMessageFromOrder }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardDescription>Order history</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            const comment = formData.get('comment') as string;
            const isPublic = formData.get('isPublic') === 'on';
            await addMessageToOrder({ isPublic, note: comment });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="comment">Add comment</Label>
            <Textarea id="comment" name="comment" className="h-24 w-full resize-none rounded-md p-2" />
            <div className="flex items-center gap-2">
              <Checkbox id="isPublic" name="isPublic" />
              <Label htmlFor="isPublic">
                Visible to customer
                <span className="ml-2 text-gray-500">(optional)</span>
              </Label>
            </div>
          </div>
          <div className="flex flex-row justify-end gap-4">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm">Add comment</Button>
          </div>
        </form>
        <div>
          <Timeline positions="left" className="mt-4 w-full">
            {orderHistory.map((history) => {
              return (
                <TimelineItem key={history.id} status="done" className="w-full">
                  <TimelineHeading side="right" className="w-full">
                    <div className="flex">
                      <div className="flex w-full items-center justify-between">
                        <p>
                          {history.administrator?.firstName} {history.administrator?.lastName}&nbsp;
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {Object.entries(history.data).map(([key, value]) => {
                              if (key === 'from' || key === 'to') {
                                return (
                                  <div key={key} className="flex items-center gap-1">
                                    <div>{key}:</div>
                                    <OrderStateBadge state={value as string} />
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TimelineHeading>
                  <TimelineDot status="done" />
                  <TimelineLine done />
                  <TimelineContent side="right" className="relative">
                    <div className="flex flex-col">
                      <div>{history.type}</div>
                      <div>{history.isPublic ? 'Visible to customer' : 'Not visible to customer'}</div>
                      {!history.isPublic ? (
                        <div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-42">
                              <div className="flex flex-col gap-2">
                                <p>Are you sure?</p>
                                <Button size="sm" variant="outline" onClick={() => deleteMessageFromOrder(history.id)}>
                                  Delete
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      ) : null}
                      {'paymentId' in history.data ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Show payment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <div className="flex flex-col gap-2">
                              <Label>Payment ID: {history.data.paymentId as string}</Label>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : null}
                      {'fulfillmentId' in history.data ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Show fulfillment
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <div className="flex flex-col gap-2">
                              <Label>Fulfillment ID: {history.data.fulfillmentId as string}</Label>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : null}
                    </div>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        </div>
      </CardContent>
    </Card>
  );
};
