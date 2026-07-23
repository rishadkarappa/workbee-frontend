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

// types
import type { AskBetterPriceModalProps } from '../types/modal.types';


export default function AskBetterPriceModal({
  open,
  setAskBetterPriceModalOpen,
  chatId,
  workId,
  workTitle,
  userId,
  workerId,
  workerName,
  currentAmount,
  onSent,
}: AskBetterPriceModalProps) {
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

    console.log("curramounttttttttt", currentAmount);


  const handleSendBetterPrice = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await BidService.sendWorkerOffer({
        chatId,
        workId,
        workTitle,
        userId,
        workerId,
        workerName,
        amount: value,
      });
      setAmount('');
      setAskBetterPriceModalOpen(false);
      onSent?.();
    } catch (err) {
      setError('Failed to send offer. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setAskBetterPriceModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ask for a Better Price</DialogTitle>
          <DialogDescription>Enter the price you'd like to offer to the client.</DialogDescription>
          <DialogDescription>Current Amount : ₹ {currentAmount}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Input
            type="number"
            placeholder="Enter your price"
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
            <Button onClick={handleSendBetterPrice} disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}