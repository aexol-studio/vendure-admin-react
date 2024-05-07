import { adminApiMutation, adminApiQuery } from '@/common/client';
import {
  Card,
  CardHeader,
  CardTitle,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
  Table,
} from '@/components';
import { DraftOrderType, draftOrderSelector } from '@/graphql/draft_order';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export const RealizationCard: React.FC<{
  order: DraftOrderType;
  setOrder: React.Dispatch<React.SetStateAction<DraftOrderType | undefined>>;
  refetchHistory: () => void;
}> = ({ order, setOrder, refetchHistory }) => {
  const { t } = useTranslation('orders');

  const markAsDelivered = async (fulfillmentId: string) => {
    const { transitionFulfillmentToState } = await adminApiMutation({
      transitionFulfillmentToState: [
        { id: fulfillmentId, state: 'Delivered' },
        {
          __typename: true,
          '...on Fulfillment': {
            id: true,
          },
          '...on FulfillmentStateTransitionError': {
            errorCode: true,
            fromState: true,
            message: true,
            toState: true,
            transitionError: true,
          },
        },
      ],
    });
    if (transitionFulfillmentToState.__typename === 'Fulfillment') {
      const resp = await adminApiQuery({ order: [{ id: order.id }, draftOrderSelector] });
      setOrder(resp.order);
      refetchHistory();
      toast.success('Fulfillment marked as delivered', { position: 'top-center' });
    } else {
      const errorMessage = `
        ${transitionFulfillmentToState?.message || 'Something went wrong'}
      `;
      toast.error(errorMessage, { position: 'top-center' });
    }
  };

  return (
    <AnimatePresence>
      {order.fulfillments?.length ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-base">{t('fulfillments.title')}</CardTitle>
              <Table>
                <TableHeader>
                  <TableRow noHover>
                    <TableHead>{t('fulfillments.method')}</TableHead>
                    <TableHead>{t('fulfillments.state')}</TableHead>
                    <TableHead>{t('fulfillments.trackingCode')}</TableHead>
                    <TableHead className="text-right">{t('fulfillments.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.fulfillments.map((fulfillment) => (
                    <React.Fragment key={fulfillment.id}>
                      <TableRow>
                        <TableCell>{fulfillment.method}</TableCell>
                        <TableCell>{fulfillment.state}</TableCell>
                        <TableCell>{fulfillment.trackingCode}</TableCell>
                        <TableCell className="text-right">
                          {fulfillment.state === 'Shipped' ? (
                            <Button size="sm" variant="outline" onClick={() => markAsDelivered(fulfillment.id)}>
                              {t('fulfillments.markAsDelivered')}
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardHeader>
          </Card>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
