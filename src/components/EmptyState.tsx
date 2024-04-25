import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, TableCell, TableRow } from '.';
import { CircleOff, SearchX } from 'lucide-react';
import type common from '../locales/en/common.json';

interface Props {
  columnsLength: number;
  elementsType?: keyof typeof common.emptyState;
  filtered?: boolean;
  customTitle?: string;
  customText?: string;
}

export const EmptyState: React.FC<Props> = ({ columnsLength, elementsType, filtered, customTitle, customText }) => {
  const { t } = useTranslation('common');
  const type = elementsType ? elementsType : 'default';
  const filteredKey = filtered ? 'filtered' : 'empty';

  return (
    <TableRow noHover>
      <TableCell colSpan={columnsLength} className="h-24 text-center">
        <Card className="p-2">
          <CardHeader className="flex flex-col items-center">
            {filtered ? <SearchX size={30} className="mb-4" /> : <CircleOff size={30} className="mb-4" />}
            <CardTitle>{customTitle || t(`emptyState.${type}.${filteredKey}.title`)}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{customText || t(`emptyState.${type}.${filteredKey}.title`)}</CardDescription>
          </CardContent>
        </Card>
      </TableCell>
    </TableRow>
  );
};
