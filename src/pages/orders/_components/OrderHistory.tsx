import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from '@/components/ui/timeline';
import { EllipsisVerticalIcon, Pencil, Trash } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
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
import { OrderStateBadge } from './OrderStateBadge';
import { OrderHistoryEntryType, orderHistoryEntrySelector } from '@/graphql/draft_order';
import {  apiCall } from '@/graphql/client';
import { DeletionResult, HistoryEntryType, ModelTypes, SortOrder } from '@/zeus';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const TAKE = 100;

const getAllOrderHistory = async (id: string) => {
  let history: OrderHistoryEntryType[] = [];
  let totalItems = 0;
  let skip = 0;
  do {
    const { order } = await apiCall('query')({
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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<OrderHistoryEntryType | undefined>();

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
    const { addNoteToOrder } = await apiCall('mutation')({
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
    const { deleteOrderNote } = await apiCall('mutation')({ deleteOrderNote: [{ id }, { message: true, result: true }] });
    if (deleteOrderNote.result === DeletionResult.DELETED) {
      const { history } = await getAllOrderHistory(orderId);
      setOrderHistory(history);
    } else {
      toast.error(t('history.deleteError', { value: deleteOrderNote.message }), { position: 'top-center' });
    }
  };
  const editMessageInOrder = (input: ModelTypes['UpdateOrderNoteInput']) => {
    apiCall('mutation')({ updateOrderNote: [{ input }, { id: true }] })
      .then(() => getAllOrderHistory(orderId).then((e) => setOrderHistory(e.history)))
      .catch(() => toast.error(t('history.editError'), { position: 'top-center' }));
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
                e.currentTarget.style.height = 12 + e.currentTarget.scrollHeight + 'px';
              }}
              value={newNote}
              onChange={(e) => setNewNote(e.currentTarget.value)}
              className="h-min max-h-[300px] min-h-[36px] w-full resize-none overflow-auto rounded-md p-2"
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
                    {history.administrator?.firstName} {history.administrator?.lastName}{' '}
                    <span className="text-sm text-muted-foreground">
                      {t(`history.createdAt`, { value: format(new Date(history.createdAt), 'dd.MM.yyyy hh:mm') })}{' '}
                      {history.createdAt !== history.updatedAt &&
                        t(`history.updatedAt`, { value: format(new Date(history.updatedAt), 'dd.MM.yyyy hh:mm') })}
                    </span>
                  </div>
                  {history.type === HistoryEntryType.ORDER_NOTE ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <EllipsisVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsEditOpen(true);
                              setSelectedNote(history);
                            }}
                            className="flex w-full justify-start gap-2"
                          >
                            <Pencil className="h-4 w-4" /> {t('history.edit')}
                          </Button>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setIsDeleteOpen(true);
                              setSelectedNote(history);
                            }}
                            className="flex w-full justify-start gap-2"
                          >
                            <Trash className="h-4 w-4" /> {t('history.delete')}
                          </Button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="flex items-center gap-2">
                      {'from' in history.data && 'to' in history.data && (
                        <>
                          <div>{t('history.from')}</div>
                          <OrderStateBadge state={history.data.from as string} />
                          <div>{t('history.to')}</div>
                          <OrderStateBadge state={history.data.to as string} />
                        </>
                      )}
                    </div>
                  )}
                </div>
              </TimelineHeading>
              <TimelineDot status="done" />
              <TimelineLine done />
              <TimelineContent className="relative">
                <div className="flex flex-col">
                  <div>
                    {t(`history.entryType.${history.type}`)}{' '}
                    {history.type === HistoryEntryType.ORDER_NOTE ? (
                      <>
                        -{' '}
                        <span className={cn(history.isPublic ? 'text-yellow-600' : 'text-green-600')}>
                          {t(history.isPublic ? 'history.public' : 'history.private')}
                        </span>
                      </>
                    ) : null}
                  </div>
                  {history.type === HistoryEntryType.ORDER_NOTE && (
                    <span className="max-h-[250px] overflow-y-auto whitespace-pre text-muted-foreground">
                      {history.data?.note as string}
                    </span>
                  )}
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
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('history.deleteNoteHeader')}</AlertDialogTitle>
            <AlertDialogDescription className="max-h-[60vh] overflow-y-auto whitespace-pre">
              {selectedNote?.data?.note as string}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedNote && deleteMessageFromOrder(selectedNote.id)}>
              {t('history.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <AlertDialogContent className="min-w-min">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('history.editNoteHeader')}</AlertDialogTitle>
          </AlertDialogHeader>
          <Textarea
            onChange={(e) =>
              setSelectedNote((p) => (p ? { ...p, data: { ...p?.data, note: e.currentTarget.value } } : undefined))
            }
            value={(selectedNote?.data.note as string) || ''}
            className="h-[60vh] w-auto min-w-[50vh] resize-none overflow-auto rounded-md p-2"
          />
          <div className="flex items-center gap-2 pb-4">
            <Checkbox
              id="isPublicEdit"
              name="isPublicEdit"
              checked={!selectedNote?.isPublic}
              onClick={() => setSelectedNote((p) => (p ? { ...p, isPublic: !p.isPublic } : undefined))}
            />
            <Label htmlFor="isPublicEdit" className="cursor-pointer">
              {t('history.isPrivate')}
              <span className="ml-2 text-gray-500">{t('history.isPrivateDescription')}</span>
            </Label>
            <Label className={cn('ml-auto', !selectedNote?.isPublic ? 'text-green-600' : 'text-yellow-600')}>
              {t(!selectedNote?.isPublic ? 'history.toAdmins' : 'history.toAdminsAndCustomer')}
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              disabled={(selectedNote?.data.note as string) === ''}
              onClick={() =>
                selectedNote &&
                editMessageInOrder({
                  noteId: selectedNote.id,
                  isPublic: selectedNote.isPublic,
                  note: selectedNote.data.note as string,
                })
              }
            >
              {t('history.edit')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
});
