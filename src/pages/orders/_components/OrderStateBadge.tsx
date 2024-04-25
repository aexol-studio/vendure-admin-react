import { Badge } from '@/components';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export const OrderStateBadge: React.FC<{ fullWidth?: boolean; state?: string; className?: string }> = ({
  fullWidth,
  state = 'default',
  className,
}) => {
  const { t } = useTranslation('common');
  const labelAndStyles = useMemo<{ className: string; label: string }>(() => {
    switch (state) {
      case 'Draft':
        return { className: 'border-red-500 bg-red-100 text-red-500', label: t('draft') };
      case 'AddingItems':
        return { className: 'border-blue-600 bg-blue-100 text-blue-600', label: t('addingItems') };
      case 'ArrangingPayment':
        return { className: 'border-blue-600 bg-blue-600 text-blue-100', label: t('arrangingPayment') };
      case 'PaymentAuthorized':
        return { className: 'border-amber-600 bg-amber-50 text-amber-600', label: t('paymentAuthorized') };
      case 'PaymentSettled':
        return { className: 'border-amber-700 bg-amber-700 text-amber-50', label: t('paymentSettled') };
      case 'PartiallyShipped':
        return { className: 'border-violet-700 bg-violet-100 text-violet-700', label: t('partiallyShipped') };
      case 'Shipped':
        return { className: 'border-violet-700 bg-violet-700 text-violet-100', label: t('shipped') };
      case 'PartiallyDelivered':
        return { className: 'border-green-800 bg-green-100 text-green-800', label: t('partiallyDelivered') };
      case 'Delivered':
        return { className: 'border-green-800 bg-green-800 text-green-100', label: t('delivered') };
      case 'Cancelled':
        return { className: 'border-red-700 bg-red-700 text-red-100', label: t('cancelled') };
      default:
        return { className: 'border-primary bg-primary-foreground text-primary', label: state };
    }
  }, [t, state]);

  return (
    <Badge
      noHover
      className={cn(fullWidth && 'flex w-full items-center justify-center', labelAndStyles.className, className)}
    >
      {labelAndStyles.label}
    </Badge>
  );
};
