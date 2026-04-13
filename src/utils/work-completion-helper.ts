import { PaymentService } from "@/services/payment-service";

export async function notifyWorkCompleted(workId: string): Promise<void> {
  try {
    await PaymentService.notifyWorkCompleted(workId);
    console.log(`[WorkCompletion] Payout scheduled for work ${workId}`);
  } catch (err: any) {
    console.error(
      `[WorkCompletion] Failed to schedule payout for work ${workId}:`,
      err?.response?.data?.message || err.message
    );
  }
}