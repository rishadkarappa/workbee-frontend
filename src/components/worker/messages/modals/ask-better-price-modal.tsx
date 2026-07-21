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

export default function AskBetterPriceModal({
    open,
    setAskBetterPriceModalOpen,
}: AskBetterPriceModalProps) {
    return (
        <Dialog
            open={open}
            onOpenChange={setAskBetterPriceModalOpen}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ask for a Better Price</DialogTitle>
                    <DialogDescription>
                        Enter the price you'd like to offer to the client.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <Input
                        type="number"
                        placeholder="Enter your price"
                        min={1}
                    />

                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button>
                            Sent
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}