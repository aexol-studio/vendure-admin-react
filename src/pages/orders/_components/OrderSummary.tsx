import { Button, Label } from '@/components';
import { DraftOrderType } from '@/graphql/draft_order';
import { format } from 'date-fns';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const OrderSummary: React.FC<{
  order?: DraftOrderType;
  markAsDelivered: (fulfillmentId: string) => void;
}> = ({ order, markAsDelivered }) => {
  const { t } = useTranslation('orders');
  return (
    <div className="flex flex-row flex-wrap gap-x-4 gap-y-2">
      <Label className="text-muted-foreground">{t('create.baseInfoCode', { value: order?.code })}</Label>
      <Label className="text-muted-foreground">|</Label>
      <Label className="text-muted-foreground">
        {t('create.baseInfoCreated', { value: format(new Date(order?.createdAt || ''), 'dd.MM.yyyy hh:mm') })}
      </Label>
      <Label className="text-muted-foreground">|</Label>
      <Label className="text-muted-foreground">
        {t('create.baseInfoUpdated', { value: format(new Date(order?.updatedAt || ''), 'dd.MM.yyyy hh:mm') })}
      </Label>
    </div>
  );
};
