"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import {
  useForm,
  useWatch,
  type UseFormRegisterReturn,
} from "react-hook-form";
import {
  checkoutFormSchema,
  type CheckoutFormValues,
} from "@/lib/cart/schemas";
import type { CartValidationResponse } from "@/lib/cart/types";
import { buildCartValidationPayload } from "@/lib/cart/contract";
import { ensureCartHydration, useCartStore } from "@/lib/cart/store";
import { formatRupiah } from "@/lib/pricing";
import { getPublicApiUrl } from "@/lib/public-api";
import type { ShippingRateQuote, ShippingRegion } from "@/lib/shipping/types";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const fieldClass =
  "mt-2 min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm text-ink outline-none focus:border-olive disabled:bg-surface-muted disabled:text-ink-muted";

type RegionState = {
  data: ShippingRegion[];
  error: string | null;
  loading: boolean;
};

type ShippingRatesState = {
  error: string | null;
  loading: boolean;
  quotes: ShippingRateQuote[];
  selectedQuoteId: string;
  totalProductWeightGrams: number;
  packagingWeightGrams: number;
  totalWeightGrams: number;
};

const initialRegionState: RegionState = {
  data: [],
  error: null,
  loading: false,
};

const initialRatesState: ShippingRatesState = {
  error: null,
  loading: false,
  quotes: [],
  selectedQuoteId: "",
  totalProductWeightGrams: 0,
  packagingWeightGrams: 0,
  totalWeightGrams: 0,
};

const checkoutIdempotencyStorageKey = "blissfy-checkout-idempotency-key";

export function CheckoutView() {
  const router = useRouter();
  const hydrated = useCartStore((state) => state.hydrated);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const syncValidatedItems = useCartStore((state) => state.syncValidatedItems);

  const [validation, setValidation] =
    useState<CartValidationResponse | null>(null);

  const [cartError, setCartError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [provinces, setProvinces] =
    useState<RegionState>(initialRegionState);

  const [cities, setCities] =
    useState<RegionState>(initialRegionState);

  const [districts, setDistricts] =
    useState<RegionState>(initialRegionState);

  const [shippingRates, setShippingRates] =
    useState<ShippingRatesState>(initialRatesState);

  const [orderError, setOrderError] =
    useState<string | null>(null);

  const [isCreatingOrder, setIsCreatingOrder] =
    useState(false);

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
      orderNote: "",
      termsAccepted: false,
    },
    mode: "onChange",
  });

  const selectedProvinceId = useWatch({
    control: form.control,
    name: "province",
  });

  const selectedCityId = useWatch({
    control: form.control,
    name: "city",
  });

  const selectedDistrictId = useWatch({
    control: form.control,
    name: "district",
  });

  const postalCode = useWatch({
    control: form.control,
    name: "postalCode",
  });

  const termsAccepted = useWatch({
    control: form.control,
    name: "termsAccepted",
  });

  const selectedQuote = shippingRates.quotes.find(
    (quote) => quote.quoteId === shippingRates.selectedQuoteId,
  );

  const selectedProvince = provinces.data.find(
    (province) => province.id === selectedProvinceId,
  );

  const selectedCity = cities.data.find(
    (city) => city.id === selectedCityId,
  );

  const selectedDistrict = districts.data.find(
    (district) => district.id === selectedDistrictId,
  );

  const totalTemporary =
    (validation?.summary.netSubtotal ?? 0) +
    (selectedQuote?.cost ?? 0);

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
          resetShippingRates();
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

  useEffect(() => {
    void loadRegions({
      level: "province",
      setState: setProvinces,
    });
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) {
      return;
    }

    void loadRegions({
      level: "city",
      parentId: selectedProvinceId,
      setState: setCities,
    });
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedCityId) {
      return;
    }

    void loadRegions({
      level: "district",
      parentId: selectedCityId,
      setState: setDistricts,
    });
  }, [selectedCityId]);

  useEffect(() => {
    resetShippingRates();
  }, [items, selectedDistrictId, postalCode]);

  useEffect(() => {
    const selectedDistrict = districts.data.find(
      (district) => district.id === selectedDistrictId,
    );

    if (
      selectedDistrict?.postalCode &&
      selectedDistrict.postalCode !== "0" &&
      /^[0-9]{5}$/.test(selectedDistrict.postalCode)
    ) {
      form.setValue("postalCode", selectedDistrict.postalCode, {
        shouldValidate: true,
      });
    }
  }, [districts.data, form, selectedDistrictId]);

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

  const canCheckShipping =
    canShowForm &&
    Boolean(selectedProvinceId) &&
    Boolean(selectedCityId) &&
    Boolean(selectedDistrictId);

  const canCreateOrder =
    canCheckShipping &&
    Boolean(selectedQuote) &&
    Boolean(termsAccepted) &&
    form.formState.isValid;

  async function handleSubmit(values: CheckoutFormValues) {
    if (
      !canCreateOrder ||
      !selectedQuote ||
      !selectedProvince ||
      !selectedCity ||
      !selectedDistrict
    ) {
      setOrderError(
        "Lengkapi data checkout dan pilih layanan pengiriman dahulu.",
      );
      return;
    }

    setOrderError(null);
    setIsCreatingOrder(true);

    try {
      const idempotencyKey =
        getOrCreateCheckoutIdempotencyKey();

      const response = await fetch("/api/orders", {
        body: JSON.stringify({
          idempotencyKey,
          items: buildCartValidationPayload(items).items.map(
            (item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            }),
          ),
          recipient: {
            recipientName: values.recipientName,
            whatsapp: values.whatsapp,
            email: values.email,
            province: values.province,
            city: values.city,
            district: values.district,
            postalCode: values.postalCode,
            address: values.address,
          },
          orderNote: values.orderNote,
          shippingQuoteId: selectedQuote.quoteId,
          destination: {
            provinceId: selectedProvince.id,
            provinceName: selectedProvince.name,
            cityId: selectedCity.id,
            cityName: selectedCity.name,
            districtId: selectedDistrict.id,
            districtName: selectedDistrict.name,
          },
          termsAccepted: values.termsAccepted,
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      const body = (await response.json().catch(() => null)) as
        | {
            message?: string;
            order?: {
              accessToken: string;
            };
          }
        | null;

      if (!response.ok || !body?.order?.accessToken) {
        throw new Error(
          body?.message ?? "Pesanan belum dapat dibuat.",
        );
      }

      clearCart();
      clearCheckoutIdempotencyKey();

      router.push(
        `/payment/${body.order.accessToken}`,
      );
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : "Pesanan belum dapat dibuat. Coba lagi.",
      );
    } finally {
      setIsCreatingOrder(false);
    }
  }

  async function handleCheckShipping() {
    if (!canCheckShipping || !selectedDistrictId) {
      setShippingRates((current) => ({
        ...current,
        error:
          "Lengkapi provinsi, kota/kabupaten, dan kecamatan dahulu.",
      }));
      return;
    }

    setShippingRates({
      ...initialRatesState,
      loading: true,
    });

    try {
      const response = await fetch(
        getPublicApiUrl("/v1/shipping/rates"),
        {
          body: JSON.stringify({
            destinationDistrictId:
              selectedDistrictId,

            destination:
              selectedProvince &&
              selectedCity &&
              selectedDistrict
                ? {
                    provinceId:
                      selectedProvince.id,
                    provinceName:
                      selectedProvince.name,
                    cityId:
                      selectedCity.id,
                    cityName:
                      selectedCity.name,
                    districtId:
                      selectedDistrict.id,
                    districtName:
                      selectedDistrict.name,
                  }
                : undefined,

            items:
              buildCartValidationPayload(items)
                .items,
          }),

          headers: {
            "content-type":
              "application/json",
          },

          method: "POST",
        },
      );

      const body = (await response
        .json()
        .catch(() => null)) as
        | {
            message?: string;
            quotes?: ShippingRateQuote[];
            totalProductWeightGrams?: number;
            packagingWeightGrams?: number;
            totalWeightGrams?: number;
          }
        | null;

      if (!response.ok || !body?.quotes) {
        throw new Error(
          body?.message ??
            "Ongkir belum dapat dihitung.",
        );
      }

      setShippingRates({
        error: null,
        loading: false,
        quotes: body.quotes,
        selectedQuoteId: "",
        totalProductWeightGrams:
          body.totalProductWeightGrams ?? 0,
        packagingWeightGrams:
          body.packagingWeightGrams ?? 0,
        totalWeightGrams:
          body.totalWeightGrams ?? 0,
      });
    } catch (error) {
      setShippingRates({
        ...initialRatesState,
        error:
          error instanceof Error
            ? error.message
            : "Ongkir belum dapat dihitung. Coba lagi.",
        loading: false,
      });
    }
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

        <Link
          className={buttonClasses({
            className: "mt-6",
          })}
          href="/products"
        >
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

        {validation &&
        !validation.summary.allValid ? (
          <div className="mt-6 rounded-[var(--radius-lg)] bg-warning-bg p-4 text-sm font-medium text-warning">
            Ada item yang tidak valid atau stoknya berubah. Periksa keranjang
            sebelum checkout.
          </div>
        ) : null}

        <form
          className={cn(
            "mt-8 space-y-8",
            !canShowForm && "opacity-60",
          )}
          onSubmit={form.handleSubmit(
            handleSubmit,
          )}
        >
          <fieldset
            disabled={
              !canShowForm ||
              isCreatingOrder
            }
            className="space-y-5"
          >
            <FormSection title="Informasi penerima">
              <TextField
                error={
                  form.formState.errors
                    .recipientName?.message
                }
                label="Nama penerima"
                registration={form.register(
                  "recipientName",
                )}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <TextField
                  error={
                    form.formState.errors
                      .whatsapp?.message
                  }
                  inputMode="tel"
                  label="Nomor WhatsApp"
                  placeholder="08..."
                  registration={form.register(
                    "whatsapp",
                  )}
                />

                <TextField
                  error={
                    form.formState.errors
                      .email?.message
                  }
                  label="Email"
                  registration={form.register(
                    "email",
                  )}
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
                <SelectField
                  error={
                    form.formState.errors
                      .province?.message
                  }
                  label="Provinsi"
                  loading={
                    provinces.loading
                  }
                  options={provinces.data}
                  placeholder="Pilih provinsi"
                  registration={form.register(
                    "province",
                  )}
                  onValueChange={() => {
                    form.setValue(
                      "city",
                      "",
                    );

                    form.setValue(
                      "district",
                      "",
                    );

                    form.setValue(
                      "postalCode",
                      "",
                    );

                    setCities(
                      initialRegionState,
                    );

                    setDistricts(
                      initialRegionState,
                    );

                    resetShippingRates();
                  }}
                  retry={() => {
                    void loadRegions({
                      level: "province",
                      setState:
                        setProvinces,
                    });
                  }}
                  stateError={
                    provinces.error
                  }
                />

                <SelectField
                  disabled={
                    !selectedProvinceId
                  }
                  error={
                    form.formState.errors
                      .city?.message
                  }
                  label="Kota/kabupaten"
                  loading={cities.loading}
                  options={cities.data}
                  placeholder="Pilih kota/kabupaten"
                  registration={form.register(
                    "city",
                  )}
                  onValueChange={() => {
                    form.setValue(
                      "district",
                      "",
                    );

                    form.setValue(
                      "postalCode",
                      "",
                    );

                    setDistricts(
                      initialRegionState,
                    );

                    resetShippingRates();
                  }}
                  retry={() => {
                    if (
                      selectedProvinceId
                    ) {
                      void loadRegions({
                        level: "city",
                        parentId:
                          selectedProvinceId,
                        setState:
                          setCities,
                      });
                    }
                  }}
                  stateError={cities.error}
                />

                <SelectField
                  disabled={
                    !selectedCityId
                  }
                  error={
                    form.formState.errors
                      .district?.message
                  }
                  label="Kecamatan"
                  loading={
                    districts.loading
                  }
                  options={districts.data}
                  placeholder="Pilih kecamatan"
                  registration={form.register(
                    "district",
                  )}
                  onValueChange={() => {
                    resetShippingRates();
                  }}
                  retry={() => {
                    if (selectedCityId) {
                      void loadRegions({
                        level:
                          "district",
                        parentId:
                          selectedCityId,
                        setState:
                          setDistricts,
                      });
                    }
                  }}
                  stateError={
                    districts.error
                  }
                />

                <TextField
                  error={
                    form.formState.errors
                      .postalCode?.message
                  }
                  inputMode="numeric"
                  label="Kode pos"
                  registration={form.register(
                    "postalCode",
                  )}
                />
              </div>

              <TextAreaField
                error={
                  form.formState.errors
                    .address?.message
                }
                label="Alamat lengkap"
                registration={form.register(
                  "address",
                )}
              />
            </FormSection>

            <FormSection title="Pilihan kurir">
              <div className="rounded-[var(--radius-lg)] border border-info/20 bg-info-bg p-4 text-sm leading-6 text-info">
                Cek ongkir menggunakan berat dan stok yang divalidasi ulang dari
                Supabase. Layanan final dibatasi ke JNE dan J&T.
              </div>

              <button
                className={buttonClasses({
                  className:
                    "w-full sm:w-fit",
                  variant: "secondary",
                })}
                disabled={
                  !canCheckShipping ||
                  shippingRates.loading
                }
                onClick={
                  handleCheckShipping
                }
                type="button"
              >
                {shippingRates.loading
                  ? "Menghitung ongkir..."
                  : "Cek ongkir"}
              </button>

              {shippingRates.error ? (
                <div className="rounded-[var(--radius-lg)] bg-danger-bg p-4 text-sm font-medium text-danger">
                  <p>
                    {shippingRates.error}
                  </p>

                  <button
                    className="mt-3 min-h-10 rounded-full border border-danger px-4 text-sm font-semibold"
                    disabled={
                      !canCheckShipping ||
                      shippingRates.loading
                    }
                    onClick={
                      handleCheckShipping
                    }
                    type="button"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : null}

              {shippingRates.quotes
                .length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-ink-soft">
                    Berat tervalidasi{" "}
                    {
                      shippingRates.totalWeightGrams
                    }{" "}
                    gram termasuk kemasan{" "}
                    {
                      shippingRates.packagingWeightGrams
                    }{" "}
                    gram.
                  </p>

                  {shippingRates.quotes.map(
                    (quote) => (
                      <label
                        className={cn(
                          "block cursor-pointer rounded-[var(--radius-lg)] border p-4 transition-colors",
                          shippingRates.selectedQuoteId ===
                            quote.quoteId
                            ? "border-ink bg-surface-muted"
                            : "border-border bg-surface hover:border-border-strong",
                        )}
                        key={
                          quote.quoteId
                        }
                      >
                        <input
                          className="sr-only"
                          name="shippingQuote"
                          onChange={() =>
                            setShippingRates(
                              (
                                current,
                              ) => ({
                                ...current,
                                selectedQuoteId:
                                  quote.quoteId,
                              }),
                            )
                          }
                          type="radio"
                        />

                        <span className="flex items-start justify-between gap-4">
                          <span>
                            <span className="block text-sm font-semibold text-ink">
                              {
                                quote.courierName
                              }{" "}
                              -{" "}
                              {
                                quote.serviceName
                              }
                            </span>

                            <span className="mt-1 block text-xs font-medium text-ink-muted">
                              Estimasi{" "}
                              {
                                quote.estimatedDelivery
                              }
                            </span>
                          </span>

                          <span className="text-sm font-semibold text-ink">
                            {formatRupiah(
                              quote.cost,
                            )}
                          </span>
                        </span>
                      </label>
                    ),
                  )}
                </div>
              ) : null}
            </FormSection>

            <FormSection title="Catatan dan persetujuan">
              <TextAreaField
                error={
                  form.formState.errors
                    .orderNote?.message
                }
                label="Catatan pesanan"
                optional
                registration={form.register(
                  "orderNote",
                )}
              />

              <label className="flex gap-3 rounded-[var(--radius-lg)] border border-border bg-surface-muted p-4 text-sm leading-6 text-ink-soft">
                <input
                  className="mt-1 size-4 accent-ink"
                  type="checkbox"
                  {...form.register(
                    "termsAccepted",
                  )}
                />

                <span>
                  Saya menyetujui syarat pembelian dan kebijakan privasi
                  Blissfy.co.
                </span>
              </label>

              {form.formState.errors
                .termsAccepted?.message ? (
                <p className="text-sm font-medium text-danger">
                  {
                    form.formState
                      .errors
                      .termsAccepted
                      .message
                  }
                </p>
              ) : null}
            </FormSection>
          </fieldset>

          {orderError ? (
            <div className="rounded-[var(--radius-lg)] bg-danger-bg p-4 text-sm font-medium text-danger">
              {orderError}
            </div>
          ) : null}

          <button
            className={buttonClasses({
              className: "w-full",
              size: "large",
            })}
            disabled={
              !canCreateOrder ||
              isCreatingOrder
            }
            type="submit"
          >
            {isCreatingOrder
              ? "Membuat pesanan..."
              : "Buat pesanan"}
          </button>

          <p className="text-sm leading-6 text-ink-muted">
            Setelah pesanan dibuat, stok ditahan selama 10 menit. QRIS Midtrans
            akan diaktifkan pada tahap berikutnya.
          </p>
        </form>
      </section>

      <aside className="h-fit rounded-[var(--radius-xl)] border border-border bg-surface p-5 lg:sticky lg:top-28">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">
            Ringkasan pesanan
          </h2>

          {validation?.summary
            .allValid ? (
            <Badge tone="success">
              Valid
            </Badge>
          ) : (
            <Badge tone="warning">
              Perlu cek
            </Badge>
          )}
        </div>

        <div className="mt-5 space-y-4">
          {(validation?.items ?? []).map(
            (item) => (
              <div
                className="border-b border-border pb-4 text-sm last:border-b-0"
                key={item.variantId}
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">
                      {item.name}
                    </p>

                    <p className="mt-1 text-ink-muted">
                      {item.colorName} /{" "}
                      {item.size} x{" "}
                      {item.quantity}
                    </p>

                    <p className="mt-1 text-xs font-medium text-ink-muted">
                      {
                        item.lineWeightGram
                      }{" "}
                      gram
                    </p>
                  </div>

                  <p className="font-semibold text-ink">
                    {formatRupiah(
                      item.lineNet,
                    )}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <SummaryRow
            label="Subtotal kotor"
            value={formatRupiah(
              validation?.summary
                .grossSubtotal ?? 0,
            )}
          />

          <SummaryRow
            label="Diskon produk"
            value={`-${formatRupiah(
              validation?.summary
                .discountTotal ?? 0,
            )}`}
          />

          <SummaryRow
            label="Subtotal bersih"
            value={formatRupiah(
              validation?.summary
                .netSubtotal ?? 0,
            )}
          />

          <SummaryRow
            label="Ongkos kirim"
            value={
              selectedQuote
                ? formatRupiah(
                    selectedQuote.cost,
                  )
                : "Belum dipilih"
            }
          />

          <div className="border-t border-border pt-4">
            <SummaryRow
              label="Total sementara"
              strong
              value={formatRupiah(
                totalTemporary,
              )}
            />
          </div>
        </dl>

        {!selectedQuote ? (
          <p className="mt-4 rounded-[var(--radius-md)] bg-warning-bg p-3 text-sm leading-6 text-warning">
            Pilih layanan pengiriman sebelum tahap order final nanti.
          </p>
        ) : (
          <p className="mt-4 rounded-[var(--radius-md)] bg-info-bg p-3 text-sm leading-6 text-info">
            Pesanan akan dibuat dengan snapshot harga, stok, dan ongkir saat ini.
          </p>
        )}
      </aside>
    </div>
  );

  function resetShippingRates() {
    setShippingRates(
      initialRatesState,
    );
  }
}

async function validateCartItems(
  items: ReturnType<
    typeof useCartStore.getState
  >["items"],
  signal?: AbortSignal,
) {
  const response = await fetch(
    getPublicApiUrl(
      "/v1/checkout/validate",
    ),
    {
      body: JSON.stringify(
        buildCartValidationPayload(items),
      ),
      headers: {
        "content-type":
          "application/json",
      },
      method: "POST",
      signal,
    },
  );

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => null)) as
      | { message?: string }
      | null;

    throw new Error(
      errorBody?.message ??
        "Keranjang belum dapat divalidasi.",
    );
  }

  return (await response.json()) as CartValidationResponse;
}

function getOrCreateCheckoutIdempotencyKey() {
  const existing =
    window.localStorage.getItem(
      checkoutIdempotencyStorageKey,
    );

  if (existing) {
    return existing;
  }

  const nextKey =
    globalThis.crypto.randomUUID();

  window.localStorage.setItem(
    checkoutIdempotencyStorageKey,
    nextKey,
  );

  return nextKey;
}

function clearCheckoutIdempotencyKey() {
  window.localStorage.removeItem(
    checkoutIdempotencyStorageKey,
  );
}

async function loadRegions({
  level,
  parentId,
  setState,
}: {
  level:
    | "province"
    | "city"
    | "district";
  parentId?: string;
  setState: (
    state: RegionState,
  ) => void;
}) {
  setState({
    data: [],
    error: null,
    loading: true,
  });

  try {
    const params =
      new URLSearchParams({
        level,
      });

    if (parentId) {
      params.set(
        "parentId",
        parentId,
      );
    }

    const response = await fetch(
      getPublicApiUrl(
        `/v1/shipping/regions?${params.toString()}`,
      ),
    );

    const body = (await response
      .json()
      .catch(() => null)) as
      | {
          message?: string;
          regions?: ShippingRegion[];
        }
      | null;

    if (
      !response.ok ||
      !body?.regions
    ) {
      throw new Error(
        body?.message ??
          "Data wilayah belum dapat dimuat.",
      );
    }

    setState({
      data: body.regions,
      error: null,
      loading: false,
    });
  } catch (error) {
    setState({
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Data wilayah belum dapat dimuat.",
      loading: false,
    });
  }
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
      <h2 className="text-lg font-semibold text-ink">
        {title}
      </h2>
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
      {label}{" "}
      {optional ? (
        <span className="text-ink-muted">
          (opsional)
        </span>
      ) : null}

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

function SelectField({
  disabled = false,
  error,
  label,
  loading,
  options,
  placeholder,
  registration,
  onValueChange,
  retry,
  stateError,
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  loading: boolean;
  options: ShippingRegion[];
  placeholder: string;
  registration: UseFormRegisterReturn;
  onValueChange?: (
    event: ChangeEvent<HTMLSelectElement>,
  ) => void;
  retry: () => void | undefined;
  stateError: string | null;
}) {
  const isEmpty =
    !loading &&
    !stateError &&
    options.length === 0;

  return (
    <label className="block text-sm font-semibold text-ink">
      {label}

      <select
        className={fieldClass}
        disabled={
          disabled || loading
        }
        {...registration}
        onChange={(event) => {
          registration.onChange(event);
          onValueChange?.(event);
        }}
      >
        <option value="">
          {loading
            ? "Memuat..."
            : placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.id}
            value={option.id}
          >
            {option.name}
          </option>
        ))}
      </select>

      {stateError ? (
        <span className="mt-2 block text-sm font-medium text-danger">
          {stateError}{" "}
          <button
            className="underline"
            onClick={retry}
            type="button"
          >
            Coba lagi
          </button>
        </span>
      ) : null}

      {isEmpty && !disabled ? (
        <span className="mt-2 block text-sm font-medium text-ink-muted">
          Data belum tersedia.
        </span>
      ) : null}

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
      {label}{" "}
      {optional ? (
        <span className="text-ink-muted">
          (opsional)
        </span>
      ) : null}

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

      <dd className="text-right font-semibold text-ink">
        {value}
      </dd>
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