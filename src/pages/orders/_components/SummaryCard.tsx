import { Card, CardHeader, CardTitle, CardContent, Label } from '@/components';
import { DraftOrderType } from '@/graphql/draft_order';
import { priceFormatter } from '@/utils';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export const SummaryCard: React.FC<{
  order?: DraftOrderType;
}> = ({ order }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <div>
            <Label>ID: {order?.id}</Label>
          </div>
          <div>
            <Label>Create date: {order?.createdAt}</Label>
          </div>
          <div>
            <Label>Update date: {order?.updatedAt}</Label>
          </div>
          <div>
            <Label>Order code: {order?.code}</Label>
          </div>
          <div>
            <Label>State: {order?.state}</Label>
          </div>
          <AnimatePresence>
            {order?.total ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <Label>Total: </Label>
                <Label>{priceFormatter(order?.totalWithTax || 0)}</Label>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
