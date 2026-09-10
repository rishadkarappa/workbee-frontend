import Navbar from "@/components/user/navbar";
import { PostWorkForm } from "./post-work/post-work-form";

export default function PostQuotationForm() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-7xl px-6">
          <PostWorkForm />
        </div>
      </main>
    </div>
  );
}