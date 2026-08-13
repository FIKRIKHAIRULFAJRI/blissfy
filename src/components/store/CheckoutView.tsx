"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/lib/cart/schemas";
import type { CartValidationResponse } from "@/lib/cart/types";
import { buildCartValidationPayload } from "@/lib/cart/contract";
import {
  ensureCartHydration,
  useCartStore,
} from "@/lib/cart/store";
import { formatRupiah } from "@/lib/pricing";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive";

export function CheckoutView() {
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const syncValidatedItems = useCartStore((state) => state.syncValidatedItems);
  const [validation, setValidation] = useState<CartValidationResponse | null>(
    null,
  );
  const [cartError, setCartError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      recipientName: "",
      whatsapp: "",
      email: "",
      province: "",
      city: "",
      district: "",
      postalCode: "",
      address: "",
      village: "",
      addressNote: "",
      orderNote: "",
      termsAccepted: false,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    ensureCartHydration();
  }, []);

  useEffect(() => {
    if (!hydrated || items.length === 0) {
      return;
    }

    const controller = new AbortController();

    startTransition(() => {
      validateCartItems(items, controller.signal)
        .then((result) => {
          setValidation(result);
          setCartError(null);
          syncValidatedItems(result.items);
        })
        .catch((validationError: unknown) => {
          if (!controller.signal.aborted) {
            setCartError(
              validationError instanceof Error
                ? validationError.message
                : "Keranjang belum dapat divalidasi. Coba lagi.",
            );
          }
        });
    });

    return () => controller.abort();
  }, [hydrated, items, syncValidatedItems]);

  const validationMatchesItems =
    validation?.items.length === items.length &&
    items.every((item) =>
      validation.items.some(
        (validatedItem) =>
          validatedItem.variantId === item.variantId &&
          validatedItem.quantity === item.quantity,
      ),
    );

  const canShowForm =
    hydrated &&
    items.length > 0 &&
    validationMatchesItems &&
    validation?.summary.allValid &&
    !cartError &&
    !isPending;

  function handleSubmit() {
    return;
  }

  if (!hydrated) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0) {
    return (
      <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center md:p-12">
        <h1 className="text-3xl font-semibold text-ink">
          Checkout membutuhkan keranjang
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-ink-soft">
          Tambahkan produk dengan varian valid sebelum mengisi data pengiriman.
        </p>
        <Link className={buttonClasses({ className: "mt-6" })} href="/products">
          Lihat katalog
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 md:p-8">
        <div className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-olive">
              Checkout aman
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
              Data penerima
            </h1>
          </div>
          <Link
            className="text-sm font-semibold text-olive hover:text-ink"
            href="/cart"
          >
            Kembali ke keranjang
          </Link>
        </div>

        {cartError ? (
          <div className="mt-6 rounded-[var(--radius-lg)] bg-danger-bg p-4 text-sm font-medium text-danger">
            {cartError}
          </div>
        ) : null}
        {isPending ? (
          <div className="mt-6 rounded-[var(--radius-lg)] bg-info-bg p-4 text-sm font-medium text-info">
            Memvalidasi ulang harga dan stok dari database.
          </div>
        ) : null}
        {validation && !validation.summary.allValid ? (
          <div className="mt-6 rounded-[var(--radius-lg)] bg-warning-bg p-4 text-sm font-medium text-warning">
            Ada item yang tidak valid atau stoknya berubah. Periksa keranjang
            sebelum checkout.
          </div>
        ) : null}

        <form
          className={cn("mt-8 space-y-8", !canShowForm && "opacity-60")}
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <fieldset disabled={!canShowForm} className="space-y-5">
            <FormSection title="Informasi penerima">
              <TextField
                error={form.formState.errors.recipientName?.message}
                label="Nama penerima"
                registration={form.register("recipientName")}
              />
              <div className="grid gap-5 md:grid-cols-2">
                <TextField
                  error={form.formState.errors.whatsapp?.message}
                  inputMode="tel"
                  label="Nomor WhatsApp"
                  placeholder="08..."
                  registration={form.register("whatsapp")}
                />
                <TextField
                  error={form.formState.errors.email?.message}
                  label="Email"
                  registration={form.register("email")}
                  type="email"
                />
              </div>
              <p className="text-xs leading-5 text-ink-muted">
                Bukti transaksi dan akses informasi pesanan akan dikirim melalui
                email pada tahap order.
              </p>
            </FormSection>

            <FormSection title="Alamat pengiriman">
              <div className="grid gap-5 md:grid-cols-2">
                <TextField
                  error={form.formState.errors.province?.message}
                  label="Provinsi"
                  registration={form.register("province")}
                />
                <TextField
                  error={form.formState.errors.city?.message}
                  label="Kota/kabupaten"
                  registration={form.register("city")}
                />
                <TextField
                  error={form.formState.errors.district?.message}
                  label="Kecamatan"
                  registration={form.register("district")}
                />
                <TextField
                  error={form.formState.errors.postalCode?.message}
                  inputMode="numeric"
                  label="Kode pos"
                  registration={form.register("postalCode")}
                />
              </div>
              <TextField
                error={form.formState.errors.village?.message}
                label="Kelurahan/desa"
                optional
                registration={form.register("village")}
              />
              <TextAreaField
                error={form.formState.errors.address?.message}
                label="Alamat lengkap"
                registration={form.register("address")}
              />
              <TextAreaField
                error={form.formState.errors.addressNote?.message}
                label="Patokan/catatan alamat"
                optional
                registration={form.register("addressNote")}
              />
            </FormSection>

            <FormSection title="Pilihan kurir">
              <div className="rounded-[var(--radius-lg)] border border-info/20 bg-info-bg p-4 text-sm leading-6 text-info">
                Integrasi J&T dan JNE akan dipasang pada tahap berikutnya.
                Layanan pengiriman belum dipilih, sehingga pesanan final belum
                dapat dibuat dari halaman ini.
              </div>
            </FormSection>

            <FormSection title="Catatan dan persetujuan">
              <TextAreaField
                error={form.formState.errors.orderNote?.message}
                label="Catatan pesanan"
                optional
                registration={form.register("orderNote")}
              />
              <label className="flex gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-muted p-4 text-sm leading-6 text-ink-soft">
                <input
                  className="mt-1 size-4 accent-ink"
                  type="checkbox"
                  {...form.register("termsAccepted")}
                />
                <span>
                  Saya menyetujui syarat pembelian dan kebijakan privasi
                  Blissfy.co.
                </span>
              </label>
              {form.formState.errors.termsAccepted?.message ? (
                <p className="text-sm font-medium text-danger">
                  {form.formState.errors.termsAccepted.message}
                </p>
              ) : null}
            </FormSection>
          </fieldset>

          <button
            className={buttonClasses({
              className: "w-full bg-surface-muted text-ink-muted",
              size: "large",
            })}
            disabled
            type="submit"
          >
            Lanjut ke pembayaran QRIS
          </button>
          <p className="text-sm leading-6 text-ink-muted">
            Tombol pembayaran sengaja dinonaktifkan sampai integrasi ongkir dan
            pembuatan pesanan final tersedia.
          </p>
        </form>
      </section>

      <aside className="h-fit rounded-[var(--radius-xl)] border border-border bg-surface p-5 lg:sticky lg:top-28">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">Ringkasan pesanan</h2>
          {validation?.summary.allValid ? (
            <Badge tone="success">Valid</Badge>
          ) : (
            <Badge tone="warning">Perlu cek</Badge>
          )}
        </div>
        <div className="mt-5 space-y-4">
          {(validation?.items ?? []).map((item) => (
            <div
              className="border-b border-border pb-4 text-sm last:border-b-0"
              key={item.variantId}
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-ink-muted">
                    {item.colorName} / {item.size} x {item.quantity}
                  </p>
                  <p className="mt-1 text-xs font-medium text-ink-muted">
                    {item.lineWeightGram} gram
                  </p>
                </div>
                <p className="font-semibold text-ink">
                  {formatRupiah(item.lineNet)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <dl className="mt-5 space-y-3 text-sm">
          <SummaryRow
            label="Subtotal"
            value={formatRupiah(validation?.summary.grossSubtotal ?? 0)}
          />
          <SummaryRow
            label="Diskon produk"
            value={`-${formatRupiah(validation?.summary.discountTotal ?? 0)}`}
          />
          <SummaryRow label="Ongkos kirim" value="Belum dipilih" />
          <div className="border-t border-border pt-4">
            <SummaryRow
              label="Total sementara"
              strong
              value={formatRupiah(validation?.summary.netSubtotal ?? 0)}
            />
          </div>
        </dl>
      </aside>
    </div>
  );
}

async function validateCartItems(
  items: ReturnType<typeof useCartStore.getState>["items"],
  signal?: AbortSignal,
) {
  const response = await fetch("/api/cart/validate", {
    body: JSON.stringify(buildCartValidationPayload(items)),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(errorBody?.message ?? "Keranjang belum dapat divalidasi.");
  }

  return (await response.json()) as CartValidationResponse;
}

function FormSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  error,
  inputMode,
  label,
  optional = false,
  placeholder,
  registration,
  type = "text",
}: {
  error?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  optional?: boolean;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  type?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label} {optional ? <span className="text-ink-muted">(opsional)</span> : null}
      <input
        className={fieldClass}
        inputMode={inputMode}
        placeholder={placeholder}
        type={type}
        {...registration}
      />
      {error ? (
        <span className="mt-2 block text-sm font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function TextAreaField({
  error,
  label,
  optional = false,
  registration,
}: {
  error?: string;
  label: string;
  optional?: boolean;
  registration: UseFormRegisterReturn;
}) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label} {optional ? <span className="text-ink-muted">(opsional)</span> : null}
      <textarea
        className={`${fieldClass} min-h-28 py-3`}
        rows={4}
        {...registration}
      />
      {error ? (
        <span className="mt-2 block text-sm font-medium text-danger">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SummaryRow({
  label,
  strong = false,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div
      className={
        strong
          ? "flex items-center justify-between gap-4 text-base font-semibold text-ink"
          : "flex items-center justify-between gap-4 text-ink-soft"
      }
    >
      <dt>{label}</dt>
      <dd className="text-right font-semibold text-ink">{value}</dd>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="h-[760px] animate-pulse rounded-[var(--radius-xl)] bg-surface-muted" />
      <div className="h-96 animate-pulse rounded-[var(--radius-xl)] bg-surface-muted" />
    </div>
  );
}
