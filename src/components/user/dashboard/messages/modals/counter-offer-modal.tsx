import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { AskBetterPriceModalProps } from "../types/modal.types";
import { BidService } from "@/services/bid-service";

export default function CounterOfferModal({
    open,
    setAskBetterPriceModalOpen,
}: AskBetterPriceModalProps) {


    const handleSendCounterOffer = () => {
        BidService.sendWorkerBetterrPrice(data){
            
        }
    }


    return (
        <Dialog
            open={open}
            onOpenChange={setAskBetterPriceModalOpen}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Sent Counter Better Price</DialogTitle>
                    <DialogDescription>
                        Enter the price you'd like to offer to the Worker.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <Input
                        type="number"
                        placeholder="HIS PRICE"
                        min={1}
                    />

                    <Input
                        type="number"
                        placeholder="Enter your counter offer"
                        min={1}
                    />

                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button onClick={handleSendCounterOffer}>
                            Sent
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}