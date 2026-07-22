import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BidService } from '@/services/bid-service';

interface CounterOfferModalProps {
  open: boolean;
  setModalOpen: (open: boolean) => void;
  chatId: string;
  workId: string;
  workTitle: string;
  userId: string;
  workerId: string;
  workerName: string;
  workerAskedPrice: number;
  onSent?: () => void;
}

export default function CounterOfferModal({
  open,
  setModalOpen,
  chatId,
  workId,
  workTitle,
  userId,
  workerId,
  workerName,
  workerAskedPrice,
  onSent,
}: CounterOfferModalProps) {
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCounterOffer = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await BidService.sendClientCounterOffer({
        chatId,
        workId,
        workTitle,
        userId,
        workerId,
        workerName,
        amount: value,
      });
      setAmount('');
      setModalOpen(false);
      onSent?.();
    } catch {
      setError('Failed to send counter offer. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Counter Offer</DialogTitle>
          <DialogDescription>Enter the price you'd like to offer to the worker.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input type="number" value={workerAskedPrice} disabled readOnly />
          <Input
            type="number"
            placeholder="Enter your counter offer"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={sending}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSendCounterOffer} disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}