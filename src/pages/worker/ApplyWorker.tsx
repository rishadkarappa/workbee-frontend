import { ApplyWorkerForm } from "@/components/worker/apply-worker/worker-apply";

export default function ApplyWorker() {
  return (
    <div className="min-h-svh w-full flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-xl">
        <ApplyWorkerForm />
      </div>
    </div>
  );
}