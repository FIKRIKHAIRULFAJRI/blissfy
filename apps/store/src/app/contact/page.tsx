import type { Metadata } from "next";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Contact | Blissfy.co",
  description:
    "Contact Blissfy.co customer care with questions about products, orders, shipping, or delivery.",
};

const fieldClassName =
  "min-h-[52px] w-full rounded-[5px] border border-black/30 bg-paper-white px-4 py-3 text-base text-black outline-none transition-colors placeholder:text-stone hover:border-black/60 focus:border-black focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-black";

const labelClassName =
  "text-[11px] font-medium uppercase leading-none tracking-[0.1em] text-stone";

export default function ContactPage() {
  return (
    <>
      <StoreHeader activePath="/contact" variant="editorial" />

      <main className="bg-bone text-black" id="main-content">
        <Container className="pb-12 pt-[72px] sm:pt-24 lg:pb-16">
          <div className="mx-auto max-w-[1200px]">
            <header className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
                Customer care
              </p>
              <h1 className="mt-4 font-goudy-old-style text-[44px] font-normal leading-[1.02] tracking-[-0.02em] sm:text-[56px]">
                Let&apos;s Connect
              </h1>
              <p className="mx-auto mt-5 max-w-[680px] text-base leading-[1.6] text-stone sm:text-lg">
                Whether you have a question about your order, our products, or
                anything else, we&apos;re here to help.
              </p>
            </header>

            <section
              aria-labelledby="contact-form-heading"
              className="mx-auto mt-[72px] max-w-[760px] rounded-[5px] border border-black/10 bg-paper-white px-5 py-10 sm:mt-24 sm:px-12 sm:py-14 lg:px-[72px] lg:py-[72px]"
            >
              <h2 className="sr-only" id="contact-form-heading">
                Contact form
              </h2>

              <form className="grid gap-6">
                <ContactField
                  autoComplete="name"
                  id="contact-name"
                  label="Name"
                  placeholder="Your full name"
                  required
                  type="text"
                />
                <ContactField
                  autoComplete="email"
                  id="contact-email"
                  label="Email"
                  placeholder="name@email.com"
                  required
                  type="email"
                />
                <ContactField
                  id="contact-subject"
                  label="Subject"
                  placeholder="What is this regarding?"
                  required
                  type="text"
                />
                <ContactField
                  autoComplete="off"
                  id="contact-order"
                  label="Order number"
                  optional
                  placeholder="BLF-2026-0829"
                  type="text"
                />

                <label className="grid gap-3" htmlFor="contact-message">
                  <span className={labelClassName}>
                    Message <span aria-hidden>*</span>
                  </span>
                  <textarea
                    className={`${fieldClassName} min-h-[160px] resize-y`}
                    id="contact-message"
                    name="message"
                    placeholder="How can we help you?"
                    required
                  />
                </label>

                <button
                  aria-describedby="contact-form-status"
                  className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-[5px] border border-[#2C2C2A] bg-[#2C2C2A] px-5 py-3 text-sm font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-black focus-visible:outline-black"
                  type="button"
                >
                  Send Message
                </button>
                <p className="sr-only" id="contact-form-status">
                  Message delivery is not connected yet.
                </p>
              </form>
            </section>

            <section
              aria-label="Customer care information"
              className="mx-auto mt-20 grid max-w-[760px] grid-cols-1 gap-10 border-t border-black/10 pt-12 text-center sm:mt-24 sm:grid-cols-2 sm:gap-12 sm:pt-16 lg:mt-[120px]"
            >
              <div>
                <h2 className="text-[12px] font-medium uppercase tracking-[0.12em] text-black">
                  Customer Care
                </h2>
                <p className="mx-auto mt-4 max-w-[300px] text-base leading-[1.6] text-stone">
                  Questions about products, orders, or shipping? We&apos;re here
                  to help.
                </p>
              </div>
              <div>
                <h2 className="text-[12px] font-medium uppercase tracking-[0.12em] text-black">
                  Business Hours
                </h2>
                <p className="mt-4 text-base leading-[1.6] text-stone">
                  Monday – Saturday
                  <br />
                  08.00 – 17.00 WIB
                </p>
              </div>
            </section>
          </div>
        </Container>
      </main>

      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}

function ContactField({
  autoComplete,
  id,
  label,
  optional = false,
  placeholder,
  required = false,
  type,
}: {
  autoComplete?: string;
  id: string;
  label: string;
  optional?: boolean;
  placeholder: string;
  required?: boolean;
  type: "email" | "text";
}) {
  return (
    <label className="grid gap-3" htmlFor={id}>
      <span className={labelClassName}>
        {label}{" "}
        {optional ? (
          <span className="font-normal">(optional)</span>
        ) : (
          <span aria-hidden>*</span>
        )}
      </span>
      <input
        autoComplete={autoComplete}
        className={fieldClassName}
        id={id}
        name={id.replace("contact-", "")}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}
