import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components';
import { US, PL } from 'country-flag-icons/react/3x2';
import { ChannelType } from '@/graphql/draft_order';
interface ChannelSwitcherProps {
  isCollapsed: boolean;
  activeChannel?: ChannelType;
  channels?: ChannelType[];
  onChannelChange: (id: string) => void;
}

function CurrencyIcon({ currencyCode }: { currencyCode?: string }) {
  switch (currencyCode) {
    case 'USD':
      return <US />;
    case 'PLN':
      return <PL />;
    default:
      return null;
  }
}

export function ChannelSwitcher({ isCollapsed, activeChannel, channels, onChannelChange }: ChannelSwitcherProps) {
  return (
    <Select defaultValue={activeChannel?.id} onValueChange={onChannelChange} value={activeChannel?.id}>
      <SelectTrigger
        className={cn(
          'flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
          isCollapsed && 'flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden',
        )}
        aria-label="Select an channel"
      >
        <SelectValue>
          <CurrencyIcon currencyCode={channels?.find((account) => account.id === activeChannel?.id)?.currencyCode} />
          <span className={cn('ml-2', isCollapsed && 'hidden')}>
            {channels?.find((account) => account.id === activeChannel?.id)?.code}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {channels?.map((account) => (
          <SelectItem key={account.code} value={account.id}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              <CurrencyIcon currencyCode={account.currencyCode} />
              {account.code}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
