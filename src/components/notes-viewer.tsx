'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/useTranslation';

interface NotesViewerProps {
  notes?: string | null;
  title: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function NotesViewer({ notes, title, isOpen, onOpenChange }: NotesViewerProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {t('common.notes_viewer.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className='whitespace-pre-wrap'>{notes}</p>
        </div>
        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
