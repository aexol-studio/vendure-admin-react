import {
  AlertDialogHeader,
  Textarea,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogTrigger,
  Checkbox,
  Label,
  Button,
} from '@/components';
import { OrderHistoryEntryType } from '@/graphql/draft_order';
import { cn } from '@/lib/utils';
import { ModelTypes } from '@/zeus';

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  note: OrderHistoryEntryType;
  updateConfirmed: (newNote: ModelTypes['UpdateOrderNoteInput']) => void;
}
export const EditNoteButton: React.FC<Props> = ({ note, updateConfirmed }) => {
  const { t } = useTranslation('orders');
  const [isPrivate, setIsPrivate] = useState(!note.isPublic);
  const [text, setText] = useState((note.data?.note as string) || '');
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-start gap-2">
          <Pencil className="h-4 w-4" /> {t('history.edit')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="min-w-min">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('history.editNoteHeader')}</AlertDialogTitle>
        </AlertDialogHeader>
        <Textarea
          onChange={(e) => setText(e.currentTarget.value)}
          value={text}
          className="h-[60vh] w-auto min-w-[50vh] resize-none overflow-auto rounded-md p-2"
        />
        <div className="flex items-center gap-2 pb-4">
          <Checkbox id="isPublic" name="isPublic" checked={isPrivate} onClick={() => setIsPrivate((p) => !p)} />
          <Label htmlFor="isPublic" className="cursor-pointer">
            {t('history.isPrivate')}
            <span className="ml-2 text-gray-500">{t('history.isPrivateDescription')}</span>
          </Label>
          <Label className={cn('ml-auto', isPrivate ? 'text-green-600' : 'text-yellow-600')}>
            {t(isPrivate ? 'history.toAdmins' : 'history.toAdminsAndCustomer')}
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={text === ''}
            onClick={() => updateConfirmed({ noteId: note.id, isPublic: !isPrivate, note: text })}
          >
            {t('history.edit')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
