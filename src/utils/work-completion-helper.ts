import { PaymentService } from "@/services/payment-service";
import { getErrorMessage } from "./error-helper";

export async function notifyWorkCompleted(workId: string): Promise<void> {
  try {
    await PaymentService.notifyWorkCompleted(workId);
    console.log(`[WorkCompletion] Payout scheduled for work ${workId}`);
  } catch (err) {
    console.error(
      `[WorkCompletion] Failed to schedule payout for work ${workId}:`,
      getErrorMessage(err)
    );
  }
}