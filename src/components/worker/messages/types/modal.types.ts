


export interface AskBetterPriceModalProps {
  open: boolean;
  setAskBetterPriceModalOpen: (open: boolean) => void;
  chatId: string;
  workId: string;
  workTitle: string;
  userId: string;
  workerId: string;
  workerName: string;
  currentAmount:number
  onSent?: () => void;
}