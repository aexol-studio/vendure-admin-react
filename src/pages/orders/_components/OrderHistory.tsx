import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from '@/components/ui/timeline';
import { EllipsisVerticalIcon, Pencil, Trash } from 'lucide-react';
import React, { Ref, forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label,
  Spinner,
  Textarea,
} from '@/components';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { OrderStateBadge } from './OrderStateBadge';
import { OrderHistoryEntryType, draftOrderSelector, orderHistoryEntrySelector } from '@/graphql/draft_order';
import { adminApiMutation, adminApiQuery } from '@/common/client';
import { DeletionResult, HistoryEntryType, ModelTypes, ResolverInputTypes, SortOrder } from '@/zeus';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { PossibleOrderStates } from '@/pages/orders/_components/PossibleOrderStates';

const TAKE = 100;

const getAllOrderHistory = async (id: string) => {
  let history: OrderHistoryEntryType[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const { order } = await adminApiQuery({
      order: [
        { id },
        {
          history: [
            { options: { skip, take: TAKE, sort: { createdAt: SortOrder.DESC } } },
            { items: orderHistoryEntrySelector, totalItems: true },
          ],
        },
      ],
    });
    history = [...history, ...(order?.history.items || [])];
    totalItems = order?.history.totalItems || 0;
    skip += TAKE;
  } while (history.length < totalItems);
  return { history };
};

interface Props {
  orderId: string;
}
export interface OrderHistoryRefType {
  refetchHistory: () => Promise<void>;
}

export const OrderHistory = forwardRef<OrderHistoryRefType, Props>(({ orderId }, ref) => {
  const { t } = useTranslation('orders');

  const [orderHistory, setOrderHistory] = useState<OrderHistoryEntryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const refetchHistory = async () => {
    setLoading(true);
    const { history } = await getAllOrderHistory(orderId);
    if (!history) {
      setError(true);
      setOrderHistory([]);
      toast.error(t('toasts.orderHistoryLoadingError', { value: orderId }));
    } else {
      setError(false);
      setOrderHistory(history);
    }
    setLoading(false);
  };

  useImperativeHandle(ref, () => ({ refetchHistory }));

  useEffect(() => {
    refetchHistory();
  }, [orderId]);

  const addMessageToOrder = async () => {
    const { addNoteToOrder } = await adminApiMutation({
      addNoteToOrder: [{ input: { id: orderId, isPublic: !isPrivate, note: newNote } }, { id: true }],
    });
    if (addNoteToOrder.id) {
      const { history } = await getAllOrderHistory(addNoteToOrder.id);
      setOrderHistory(history);
      setNewNote('');
    } else {
      toast.error(t('history.addError'), { position: 'top-center' });
    }
  };

  const deleteMessageFromOrder = async (id: string) => {
    const { deleteOrderNote } = await adminApiMutation({ deleteOrderNote: [{ id }, { message: true, result: true }] });
    if (deleteOrderNote.result === DeletionResult.DELETED) {
      const { history } = await getAllOrderHistory(orderId);
      setOrderHistory(history);
    } else {
      toast.error(t('history.deleteError', { value: deleteOrderNote.message }), { position: 'top-center' });
    }
  };
  const editMessageInOrder = (input: ModelTypes['UpdateOrderNoteInput']) => {
    adminApiMutation({ updateOrderNote: [{ input }, {}] })
      .then(() => getAllOrderHistory(orderId).then((e) => setOrderHistory(e.history)))
      .catch(() => toast.error(t('history.deleteError'), { position: 'top-center' }));
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        {t('toasts.orderHistoryLoadingError', { value: orderId })}
      </div>
    );
  }
  console.log(orderHistory);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('history.title')}</CardTitle>
        <CardDescription>{t('history.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Label htmlFor="comment">{t('history.addCommentButton')}</Label>
          <div className="mb-2 flex flex-row gap-4">
            <Textarea
              id="comment"
              onKeyUp={(e) => {
                e.currentTarget.style.height = '1px';
                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
              }}
              value={newNote}
              onChange={(e) => setNewNote(e.currentTarget.value)}
              className="h-[36px] min-h-[36px] w-full resize-none overflow-hidden rounded-md p-2"
            />
            <Button disabled={newNote === ''} size="sm" onClick={addMessageToOrder}>
              {t('history.addComment')}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="isPublic" name="isPublic" checked={isPrivate} onClick={() => setIsPrivate((p) => !p)} />
            <Label htmlFor="isPublic" className="cursor-pointer">
              {t('history.isPrivate')}
              <span className="ml-2 text-gray-500">{t('history.isPrivateDescription')}</span>
            </Label>
            <Label className={cn('ml-auto', isPrivate ? 'text-green-600' : 'text-yellow-600')}>
              {t(isPrivate ? 'history.toAdmins' : 'history.toAdminsAndCustomer')}
            </Label>
          </div>
        </div>

        <Timeline positions="left" className="mt-4 w-full">
          {orderHistory.map((history) => (
            <TimelineItem key={history.id} status="done" className="w-full">
              <TimelineHeading side="right" className="w-full">
                <div className="flex w-full items-center justify-between">
                  <div>
                    {history.administrator?.firstName} {history.administrator?.lastName}
                  </div>
                  <div className="flex items-center gap-2">
                    {'from' in history.data && (
                      <>
                        <div>{t('history.from')}</div>
                        <OrderStateBadge state={history.data.from as string} />
                      </>
                    )}
                    {'to' in history.data && (
                      <>
                        <div>{t('history.to')}</div>
                        <OrderStateBadge state={history.data.to as string} />
                      </>
                    )}
                  </div>
                </div>
              </TimelineHeading>
              <TimelineDot status="done" />
              <TimelineLine done />
              <TimelineContent className="relative">
                <div className="flex flex-col">
                  <div className="text-sm">
                    {t(`history.createdAt`, { value: format(new Date(history.createdAt), 'dd.MM.yyyy hh:mm') })}{' '}
                    {history.createdAt !== history.updatedAt &&
                      t(`history.updatedAt`, { value: format(new Date(history.updatedAt), 'dd.MM.yyyy hh:mm') })}
                  </div>
                  <div>{t(`history.entryType.${history.type}`)}</div>
                  {history.type === HistoryEntryType.ORDER_NOTE && (
                    <div className="flex items-center justify-between">
                      <span className="text-primary">
                        <span className={cn(history.isPublic ? 'text-yellow-600' : 'text-green-600')}>
                          {t(history.isPublic ? 'history.public' : 'history.private')}
                        </span>{' '}
                        {history.data?.note as string}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Button variant="ghost" className="flex w-full justify-start gap-2">
                              <Pencil className="h-4 w-4" /> {t('history.edit')}
                            </Button>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Button variant="ghost" className="flex w-full justify-start gap-2">
                              <Trash className="h-4 w-4" /> {t('history.delete')}
                            </Button>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  {/* Zrobić dialogi edycji i usuwania */}
                  {/* {!history.isPublic ? (
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-42">
                          <div className="flex flex-col gap-2">
                            <p>{t('history.sure')}</p>
                            <Button size="sm" variant="outline" onClick={() => deleteMessageFromOrder(history.id)}>
                              {t('history.delete')}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ) : null} */}
                  {'paymentId' in history.data ? (
                    <div className="flex flex-col gap-2">
                      <Label>{t('history.paymentId', { value: history.data.paymentId as string })}</Label>
                    </div>
                  ) : null}
                  {'fulfillmentId' in history.data ? (
                    <div className="flex flex-col gap-2">
                      <Label>{t('history.fulfillmentId', { value: history.data.fulfillmentId as string })}</Label>
                    </div>
                  ) : null}
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
});
