import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ButtonProps } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const Pagination = ({ className, ...props }: React.ComponentProps<'nav'>) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    {...props}
  />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  ),
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('w-8 text-center', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, 'size'> &
  React.ComponentProps<'a'>;

const PaginationLink = ({ className, isActive, ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? 'page' : undefined}
    className={cn(isActive ? 'text-primary' : 'cursor-pointer text-muted-foreground', className)}
    {...props}
  />
);
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({
  className,
  isActive,
  onClick,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation('common');
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn('flex items-center gap-1 pl-2.5', !isActive && 'cursor-not-allowed', className)}
      onClick={(e) => isActive && onClick && onClick(e)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="capitalize">{t('previous')}</span>
    </PaginationLink>
  );
};
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({ className, isActive, onClick, ...props }: React.ComponentProps<typeof PaginationLink>) => {
  const { t } = useTranslation('common');
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn('flex items-center gap-1 pr-2.5', !isActive && 'cursor-not-allowed', className)}
      onClick={(e) => isActive && onClick && onClick(e)}
      {...props}
    >
      <span className="capitalize">{t('next')}</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
};
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span aria-hidden className={cn('flex h-9 w-9 items-center justify-center', className)} {...props}>
    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
