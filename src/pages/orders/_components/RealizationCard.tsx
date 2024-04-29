import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
  Table,
} from '@/components';
import { DraftOrderType } from '@/graphql/draft_order';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export const RealizationCard: React.FC<{
  order?: DraftOrderType;
  markAsDelivered: (fulfillmentId: string) => void;
}> = ({ order, markAsDelivered }) => {
  return (
    <AnimatePresence>
      {order?.fulfillments && order.fulfillments.length ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>Realization</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow noHover>
                    <TableHead>Method</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Tracking code</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.fulfillments.map((fulfillment) => (
                    <React.Fragment key={fulfillment.id}>
                      <TableRow>
                        <TableCell>{fulfillment.method}</TableCell>
                        <TableCell>{fulfillment.state}</TableCell>
                        <TableCell>{fulfillment.trackingCode}</TableCell>
                        {fulfillment.state === 'Shipped' ? (
                          <Button size="sm" variant="outline" onClick={() => markAsDelivered(fulfillment.id)}>
                            Mark as delivered
                          </Button>
                        ) : null}
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
