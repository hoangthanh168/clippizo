import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { CheckoutContent } from "./checkout-content";

export default function CheckoutPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Suspense
        fallback={
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
