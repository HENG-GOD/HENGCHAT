import { format } from 'date-fns';
import { Check, CheckCheck, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Message } from '@/types';

export function MessageBubble({ m }: { m: Message }) {
  const isOutbound = m.direction === 'outbound';
  const isText = m.messageType === 'text';

  return (
    <div className={cn('flex gap-1.5', isOutbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[68%] px-3 py-1.5 text-sm leading-relaxed',
          'rounded-2xl',
          isOutbound
            ? 'bg-brand-500 text-brand-fg rounded-br-md'
            : 'bg-bg-muted text-fg rounded-bl-md',
        )}
      >
        {isText && (
          <div className="whitespace-pre-wrap break-words">{m.textContent}</div>
        )}

        {m.messageType === 'image' && m.attachments?.[0] && (
          <a href={m.attachments[0].fileUrl} target="_blank" rel="noreferrer">
            <img
              src={m.attachments[0].fileUrl}
              alt=""
              className="max-h-72 rounded-md"
            />
          </a>
        )}

        {(m.messageType === 'file' || m.messageType === 'video' || m.messageType === 'audio') && m.attachments?.[0] && (
          <a
            href={m.attachments[0].fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 underline underline-offset-2"
          >
            📎 {m.attachments[0].fileName ?? m.messageType}
          </a>
        )}

        {m.messageType === 'sticker' && <span className="text-2xl">😀</span>}

        <div
          className={cn(
            'mt-0.5 flex items-center gap-1 text-2xs',
            isOutbound ? 'justify-end text-brand-fg/70' : 'text-fg-subtle',
          )}
        >
          <span>{format(new Date(m.createdAt), 'HH:mm')}</span>
          {isOutbound && (
            <>
              {m.sendStatus === 'pending' && <Loader2 className="h-3 w-3 animate-spin" />}
              {m.sendStatus === 'sent' && <CheckCheck className="h-3 w-3" />}
              {m.sendStatus === 'failed' && <AlertCircle className="h-3 w-3 text-danger" />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
