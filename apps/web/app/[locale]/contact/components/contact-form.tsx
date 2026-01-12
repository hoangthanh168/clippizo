"use client";

import { Button } from "@repo/design-system/components/ui/button";
import { Input } from "@repo/design-system/components/ui/input";
import { Label } from "@repo/design-system/components/ui/label";
import { Textarea } from "@repo/design-system/components/ui/textarea";
import type { Dictionary } from "@repo/internationalization";
import { Check, Loader2, MoveRight } from "lucide-react";
import { useState } from "react";
import { contact } from "../actions/contact";

type ContactFormProps = {
  dictionary: Dictionary;
};

export const ContactForm = ({ dictionary }: ContactFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstname") as string;
    const lastName = formData.get("lastname") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    const name = `${firstName} ${lastName}`.trim();

    const result = await contact(name, email, message);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <h4 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
                  {dictionary.web.contact.meta.title}
                </h4>
                <p className="max-w-sm text-left text-lg text-muted-foreground leading-relaxed tracking-tight">
                  {dictionary.web.contact.meta.description}
                </p>
              </div>
            </div>
            {dictionary.web.contact.hero.benefits.map((benefit, index) => (
              <div className="flex items-start gap-6 text-left" key={index}>
                <Check className="mt-2 h-4 w-4 text-primary" />
                <div className="flex flex-col gap-1">
                  <p>{benefit.title}</p>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center">
            {isSuccess ? (
              <div className="flex max-w-sm flex-col items-center gap-4 rounded-md border p-8 text-center">
                <Check className="h-12 w-12 text-green-500" />
                <h3 className="text-xl font-semibold">Message Sent!</h3>
                <p className="text-muted-foreground">
                  Thank you for reaching out. We'll get back to you soon.
                </p>
                <Button onClick={() => setIsSuccess(false)} variant="outline">
                  Send another message
                </Button>
              </div>
            ) : (
              <form
                className="flex max-w-sm flex-col gap-4 rounded-md border p-8"
                onSubmit={handleSubmit}
              >
                <p>{dictionary.web.contact.hero.form.title}</p>
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
                    {error}
                  </div>
                )}
                <div className="grid w-full max-w-sm items-center gap-1">
                  <Label htmlFor="firstname">
                    {dictionary.web.contact.hero.form.firstName}
                  </Label>
                  <Input
                    id="firstname"
                    name="firstname"
                    required
                    type="text"
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1">
                  <Label htmlFor="lastname">
                    {dictionary.web.contact.hero.form.lastName}
                  </Label>
                  <Input id="lastname" name="lastname" required type="text" />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" required type="email" />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    className="min-h-[100px]"
                    id="message"
                    name="message"
                    required
                  />
                </div>

                <Button className="w-full gap-4" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      Sending... <Loader2 className="h-4 w-4 animate-spin" />
                    </>
                  ) : (
                    <>
                      {dictionary.web.contact.hero.form.cta}{" "}
                      <MoveRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
