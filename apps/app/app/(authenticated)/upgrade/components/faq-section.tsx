"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@repo/design-system/components/ui/accordion";
import { Button } from "@repo/design-system/components/ui/button";
import { MessageCircle } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What happens when my credits run out?",
    answer:
      "When your credits run out, you can purchase additional credit packs or upgrade to a higher plan. Credit packs are valid for 30 days from purchase date. Your existing features remain accessible, but credit-consuming operations will be paused until you add more credits.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Our subscriptions are one-time payments valid for 30 days. There's no recurring billing to cancel. Simply choose not to renew when your subscription expires. Your access continues until the expiration date.",
  },
  {
    question: "How do I upgrade my plan?",
    answer:
      "You can upgrade anytime by selecting a higher tier plan on this page. When you upgrade, you'll get immediate access to the new features. Your new subscription period starts from the upgrade date.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept PayPal for international payments (USD) and SePay for Vietnamese payments (VND). Both methods provide secure, verified transactions.",
  },
  {
    question: "Do unused credits roll over?",
    answer:
      "Yes! Unused credits roll over to the next billing period, up to a maximum cap based on your plan. Pro plans can accumulate up to 2x their monthly allocation, ensuring you never lose unused credits.",
  },
  {
    question: "What's the difference between monthly credits and credit packs?",
    answer:
      "Monthly credits are included with your subscription and renew each billing period. Credit packs are one-time purchases that give you additional credits on top of your subscription. Both types of credits are used in the same way.",
  },
  {
    question: "How long is each subscription period?",
    answer:
      "All subscriptions are valid for 30 days from the purchase date. You can renew manually before expiry to maintain uninterrupted access to all features.",
  },
];

export function FAQSection() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="font-semibold text-xl">Frequently Asked Questions</h2>
        <Button asChild className="w-fit" size="sm" variant="outline">
          <a href="mailto:support@clippizo.com">
            <MessageCircle className="mr-2 h-4 w-4" />
            Contact Support
          </a>
        </Button>
      </div>

      <Accordion className="w-full" collapsible type="single">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={item.question} value={`item-${index}`}>
            <AccordionTrigger className="text-left text-sm">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
