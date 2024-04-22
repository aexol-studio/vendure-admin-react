import { Badge } from '@/components';
import { DraftOrderType } from '@/graphql/draft_order';
import { cn } from '@/lib/utils';

export const OrderStateBadge: React.FC<{ fullWidth?: boolean; state?: DraftOrderType['state'] }> = ({
  fullWidth,
  state,
}) => {
  let className = '';
  switch (state) {
    case 'AddingItems':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'ArrangingPayment':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'PaymentAuthorized':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'PaymentSettled':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'Cancelled':
      className = 'bg-destructive-foreground text-destructive-background';
      break;
    case 'Fulfilled':
      className = 'bg-success-foreground text-success-background';
      break;
    case 'PartiallyFulfilled':
      className = 'bg-primary-foreground text-primary-background';
      break;
    case 'Draft':
      className = 'bg-warning-foreground text-warning';
      break;
    case 'Delivered':
      className = 'bg-green-500 text-primary-background';
      break;
    default:
      className = 'bg-primary-foreground text-primary-background';
      break;
  }

  return (
    <Badge noHover className={cn(fullWidth && 'flex w-full items-center justify-center', className)}>
      {state}
    </Badge>
  );
};
