import type { Metadata } from "next";
import Link from "next/link";

import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy Policy | Blissfy.co",
  description:
    "Learn how Blissfy.co collects, uses, protects, and retains personal information.",
};

const informationUses = [
  "Processing and fulfilling your orders",
  "Arranging shipping and delivery",
  "Providing order updates and tracking",
  "Customer support and inquiries",
  "Ensuring site security and fraud prevention",
  "Improving your shopping experience",
];

export default function PrivacyPage() {
  return (
    <>
      <StoreHeader activePath="/privacy" variant="editorial" />

      <main className="bg-bone text-black" id="main-content">
        <Container className="pb-12 pt-[72px] sm:pt-24 lg:pb-16">
          <div className="mx-auto max-w-[900px]">
            <header className="text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
              Legal
            </p>
            <h1 className="mt-4 font-goudy-old-style text-[44px] font-normal leading-[1.02] tracking-[-0.02em] sm:text-[56px]">
              Privacy Policy
            </h1>
            <p className="mt-4 text-[13px] leading-normal text-stone">
              Last updated: 23 August 2026
            </p>
            </header>

            <article className="mt-[72px] flex flex-col gap-[56px] sm:mt-24 sm:gap-16">
            <PrivacySection title="Information We Collect">
              <p>
                We collect information when you browse our site, place orders,
                track your delivery, or contact our care team. This includes
                your name, email, WhatsApp number, shipping address, order
                details, product selections, shipping information, and payment
                status.
              </p>
            </PrivacySection>

            <PrivacySection title="How We Use Your Information">
              <ul className="grid list-disc gap-3 pl-5 marker:text-black">
                {informationUses.map((item) => (
                  <li className="pl-1" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </PrivacySection>

            <PrivacySection title="Payment Information">
              <p>
                Payments are processed securely via third-party providers.
                Blissfy receives only the transaction status, reference number,
                amount, and timestamps. Blissfy does not store your PINs,
                credentials, or passwords.
              </p>
            </PrivacySection>

            <PrivacySection title="Shipping & Delivery Information">
              <p>
                Your information is used for calculating shipping costs, order
                preparation, arranging delivery with our logistics partners,
                and providing tracking updates.
              </p>
            </PrivacySection>

            <PrivacySection title="How We Share Information">
              <p>
                We share your data with trusted service providers for payment,
                shipping, infrastructure, and hosting only as necessary to
                provide our services.
              </p>
            </PrivacySection>

            <aside className="flex items-start gap-4 rounded-[5px] border border-black/10 bg-paper-white p-5 sm:p-6">
              <svg
                aria-hidden
                className="mt-0.5 size-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.4" />
                <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
              <p className="text-sm leading-[1.6] text-black">
                Blissfy.co does not sell your personal information.
              </p>
            </aside>

            <PrivacySection title="Data Security">
              <p>
                We use reasonable technical and organizational measures to
                protect your personal information. While we strive for the
                highest standards, no method of transmission or storage is
                completely secure.
              </p>
            </PrivacySection>

            <PrivacySection title="Data Retention">
              <p>
                We retain your information for as long as necessary to fulfill
                orders, maintain business records, and provide ongoing support.
              </p>
            </PrivacySection>

            <PrivacySection title="Your Rights">
              <p>
                You have the right to access, correct, or request the deletion
                of your personal data at any time.
              </p>
            </PrivacySection>

            <PrivacySection title="Cookies & Website Data">
              <p>
                We use essential technologies to manage your shopping bag,
                facilitate checkout, ensure security, and monitor site
                performance.
              </p>
            </PrivacySection>

            <PrivacySection title="Changes to This Privacy Policy">
              <p>
                The latest version of our privacy policy is always available on
                this page.
              </p>
            </PrivacySection>

            <PrivacySection title="Questions About Privacy">
              <p>
                If you have any questions, please contact us through our{" "}
                <Link
                  className="border-b border-current text-black transition-colors hover:text-stone focus-visible:outline-black"
                  href="/contact"
                >
                  Contact Us →
                </Link>
              </p>
            </PrivacySection>
            </article>
          </div>
        </Container>
      </main>

      <div className="flow-root bg-bone">
        <StoreFooter variant="editorial" />
      </div>
    </>
  );
}

function PrivacySection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section>
      <h2 className="font-goudy-old-style text-[26px] font-normal leading-[1.08] tracking-[-0.012em]">
        {title}
      </h2>
      <div className="mt-4 text-sm leading-[1.65] text-stone">
        {children}
      </div>
    </section>
  );
}
