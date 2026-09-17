"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from "react";
import { useEffect, useMemo, useState, useTransition } from "react";
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
import {
  StoreButton,
  storeButtonClasses,
} from "@/components/store/ui/StoreButton";
import { StoreCheckbox } from "@/components/store/ui/StoreCheckbox";
import { StoreFieldMessage } from "@/components/store/ui/StoreFieldMessage";
import { StoreInput } from "@/components/store/ui/StoreInput";
import { StoreSelect } from "@/components/store/ui/StoreSelect";
import { StoreTextarea } from "@/components/store/ui/StoreTextarea";
import { cn } from "@/lib/utils";

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
  const selectedVariantIds = useCartStore(
    (state) => state.selectedVariantIds,
  );
  const removeItems = useCartStore((state) => state.removeItems);
  const syncValidatedItems = useCartStore((state) => state.syncValidatedItems);

  const checkoutItems = useMemo(
    () =>
      items.filter((item) => selectedVariantIds.includes(item.variantId)),
    [items, selectedVariantIds],
  );

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
  const summaryItemCount =
    validation?.summary.totalItems ??
    checkoutItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    ensureCartHydration();
  }, []);

  useEffect(() => {
    if (!hydrated || checkoutItems.length === 0) {
      return;
    }

    const controller = new AbortController();

    startTransition(() => {
      validateCartItems(checkoutItems, controller.signal)
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
  }, [checkoutItems, hydrated, syncValidatedItems]);

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
  }, [checkoutItems, selectedDistrictId, postalCode]);

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
    validation?.items.length === checkoutItems.length &&
    checkoutItems.every((item) =>
      validation.items.some(
        (validatedItem) =>
          validatedItem.variantId === item.variantId &&
          validatedItem.quantity === item.quantity,
      ),
    );

  const canShowForm =
    hydrated &&
    checkoutItems.length > 0 &&
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

      const response = await fetch(
        getPublicApiUrl("/v1/orders"),
        {
          body: JSON.stringify({
            idempotencyKey,
            items: buildCartValidationPayload(checkoutItems).items.map(
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
        },
      );

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

      removeItems(checkoutItems.map((item) => item.variantId));
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
              buildCartValidationPayload(checkoutItems)
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

  if (checkoutItems.length === 0) {
    const hasCartItems = items.length > 0;

    return (
      <section className="mx-auto max-w-[760px] rounded-[10px] border border-black/10 bg-paper-white p-8 text-center md:p-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-stone">
          Checkout
        </p>
        <h1 className="mt-4 text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-black md:text-[38px]">
          {hasCartItems
            ? "Select an item to checkout"
            : "Your bag is empty"}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-sm leading-[1.6] text-stone">
          {hasCartItems
            ? "Return to your bag and select at least one item you would like to purchase."
            : "Add a product with a valid color and size before continuing to checkout."}
        </p>

        <Link
          className={storeButtonClasses({
            className: "mt-6",
          })}
          href={hasCartItems ? "/cart" : "/products"}
        >
          {hasCartItems ? "Return to Your Bag" : "Shop Products"}
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px]">
      <header>
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-black sm:text-[40px]">
          Checkout
        </h1>
        <p className="mt-3 text-sm leading-[1.6] text-stone">
          Complete your order securely. No account required.
        </p>
      </header>

      <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div>
          {cartError ? (
            <div className="mb-6 rounded-[8px] border border-black/10 bg-paper-white p-5 text-sm text-[var(--color-error)]">
              {cartError}
            </div>
          ) : null}

          {isPending ? (
            <div className="mb-6 rounded-[8px] border border-black/10 bg-paper-white p-5 text-sm text-stone">
              Revalidating current prices and stock.
            </div>
          ) : null}

          {validation && !validation.summary.allValid ? (
            <div className="mb-6 rounded-[8px] border border-black/10 bg-paper-white p-5 text-sm text-[var(--color-error)]">
              Some selected items are no longer valid. Return to your bag and
              review them before continuing.
            </div>
          ) : null}

          <form
            className={cn("space-y-8", !canShowForm && "opacity-60")}
            id="checkout-form"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <fieldset
              className="space-y-8"
              disabled={!canShowForm || isCreatingOrder}
            >
              <FormSection step="1" title="Contact Information">
                <TextField
                  error={form.formState.errors.recipientName?.message}
                  label="Full Name"
                  placeholder="e.g., Jane Doe"
                  registration={form.register("recipientName")}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    error={form.formState.errors.email?.message}
                    label="Email"
                    placeholder="jane@example.com"
                    registration={form.register("email")}
                    type="email"
                  />

                  <TextField
                    error={form.formState.errors.whatsapp?.message}
                    inputMode="tel"
                    label="WhatsApp Number"
                    placeholder="08123456789"
                    registration={form.register("whatsapp")}
                  />
                </div>

                <p className="text-xs leading-5 text-stone">
                  Used for order confirmation, shipping updates, and access to
                  your order status.
                </p>
              </FormSection>

              <FormSection step="2" title="Shipping Address">
                <SelectField
                  error={form.formState.errors.province?.message}
                  label="Province"
                  loading={provinces.loading}
                  options={provinces.data}
                  placeholder="Select Province"
                  registration={form.register("province")}
                  onValueChange={() => {
                    form.setValue("city", "");
                    form.setValue("district", "");
                    form.setValue("postalCode", "");
                    setCities(initialRegionState);
                    setDistricts(initialRegionState);
                    resetShippingRates();
                  }}
                  retry={() => {
                    void loadRegions({
                      level: "province",
                      setState: setProvinces,
                    });
                  }}
                  stateError={provinces.error}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <SelectField
                    disabled={!selectedProvinceId}
                    error={form.formState.errors.city?.message}
                    label="City / Regency"
                    loading={cities.loading}
                    options={cities.data}
                    placeholder="Select City / Regency"
                    registration={form.register("city")}
                    onValueChange={() => {
                      form.setValue("district", "");
                      form.setValue("postalCode", "");
                      setDistricts(initialRegionState);
                      resetShippingRates();
                    }}
                    retry={() => {
                      if (selectedProvinceId) {
                        void loadRegions({
                          level: "city",
                          parentId: selectedProvinceId,
                          setState: setCities,
                        });
                      }
                    }}
                    stateError={cities.error}
                  />

                  <SelectField
                    disabled={!selectedCityId}
                    error={form.formState.errors.district?.message}
                    label="District"
                    loading={districts.loading}
                    options={districts.data}
                    placeholder="Select District"
                    registration={form.register("district")}
                    onValueChange={resetShippingRates}
                    retry={() => {
                      if (selectedCityId) {
                        void loadRegions({
                          level: "district",
                          parentId: selectedCityId,
                          setState: setDistricts,
                        });
                      }
                    }}
                    stateError={districts.error}
                  />
                </div>

                <TextField
                  error={form.formState.errors.postalCode?.message}
                  inputMode="numeric"
                  label="Postal Code"
                  placeholder="12345"
                  registration={form.register("postalCode")}
                />

                <TextAreaField
                  error={form.formState.errors.address?.message}
                  label="Full Address"
                  placeholder="Street name, house number, building, or other address details"
                  registration={form.register("address")}
                />
              </FormSection>

              <FormSection step="3" title="Shipping Method">
                <p className="text-sm leading-[1.6] text-stone">
                  Rates are calculated from the selected address and validated
                  package weight. Available services are limited to JNE and
                  J&amp;T.
                </p>

                <button
                  className={storeButtonClasses({
                    className: cn(
                      "w-full rounded-[5px] border uppercase tracking-[0.08em] focus-visible:outline-black sm:w-fit",
                      shippingRates.loading
                        ? "!border-[#2C2C2A] !bg-paper-white !text-[#2C2C2A] disabled:!cursor-wait"
                        : "border-[#2C2C2A] bg-[#2C2C2A] text-white hover:bg-black",
                    ),
                  })}
                  disabled={!canShowForm || shippingRates.loading}
                  onClick={handleCheckShipping}
                  type="button"
                >
                  {shippingRates.loading
                    ? "Calculating shipping..."
                    : "Check"}
                </button>

                {shippingRates.error ? (
                  <div className="rounded-[5px] border border-black/10 bg-bone p-4 text-sm text-[var(--color-error)]">
                    <p>{shippingRates.error}</p>
                    <StoreButton
                      className="mt-3"
                      disabled={!canShowForm || shippingRates.loading}
                      onClick={handleCheckShipping}
                      size="compact"
                      type="button"
                      variant="destructive"
                    >
                      Try again
                    </StoreButton>
                  </div>
                ) : null}

                {shippingRates.quotes.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs leading-5 text-stone">
                      Validated package weight: {shippingRates.totalWeightGrams} g,
                      including {shippingRates.packagingWeightGrams} g packaging.
                    </p>

                    {shippingRates.quotes.map((quote) => (
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-4 rounded-[5px] border p-4 transition-colors",
                          shippingRates.selectedQuoteId === quote.quoteId
                            ? "border-[#2C2C2A] bg-paper-white"
                            : "border-black/10 bg-paper-white hover:border-black/40",
                        )}
                        key={quote.quoteId}
                      >
                        <input
                          checked={
                            shippingRates.selectedQuoteId === quote.quoteId
                          }
                          className="mt-1 size-4 accent-[#2C2C2A]"
                          name="shippingQuote"
                          onChange={() =>
                            setShippingRates((current) => ({
                              ...current,
                              selectedQuoteId: quote.quoteId,
                            }))
                          }
                          type="radio"
                        />

                        <span className="flex min-w-0 flex-1 items-start justify-between gap-4">
                          <span>
                            <span className="block text-sm font-medium text-black">
                              {quote.courierName} {quote.serviceName}
                            </span>
                            <span className="mt-1 block text-xs text-stone">
                              Estimated {quote.estimatedDelivery}
                            </span>
                          </span>
                          <span className="shrink-0 text-sm font-medium text-black">
                            {formatRupiah(quote.cost)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}
              </FormSection>

              <FormSection step="4" title="Order Notes">
                <TextAreaField
                  error={form.formState.errors.orderNote?.message}
                  label="Order Notes"
                  optional
                  placeholder="Leave a message for the seller..."
                  registration={form.register("orderNote")}
                />

                <label
                  className="flex min-h-11 items-start gap-3 text-sm leading-[1.6] text-stone"
                  htmlFor="checkout-termsAccepted"
                >
                  <StoreCheckbox
                    aria-describedby={
                      form.formState.errors.termsAccepted?.message
                        ? "checkout-termsAccepted-error"
                        : undefined
                    }
                    aria-invalid={Boolean(
                      form.formState.errors.termsAccepted?.message,
                    )}
                    className="mt-0.5"
                    id="checkout-termsAccepted"
                    {...form.register("termsAccepted")}
                  />
                  <span>
                    Saya menyetujui Syarat &amp; Ketentuan serta Kebijakan
                    Privasi blissfy.co.
                  </span>
                </label>

                {form.formState.errors.termsAccepted?.message ? (
                  <StoreFieldMessage
                    className="block font-medium"
                    id="checkout-termsAccepted-error"
                    variant="error"
                  >
                    {form.formState.errors.termsAccepted.message}
                  </StoreFieldMessage>
                ) : null}
              </FormSection>
            </fieldset>

            {orderError ? (
              <div className="rounded-[5px] border border-black/10 bg-paper-white p-4 text-sm text-[var(--color-error)]">
                {orderError}
              </div>
            ) : null}
          </form>
        </div>

        <aside className="h-fit rounded-[10px] border border-black/[0.06] bg-paper-white p-6 lg:sticky lg:top-28">
          <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
            <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-black">
              Order Summary
            </h2>
            <span className="rounded-[3px] bg-bone px-2 py-1 text-[10px] font-medium text-stone">
              {summaryItemCount} {summaryItemCount === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="mt-5 space-y-4 border-b border-black/10 pb-5">
            {(validation?.items ?? []).map((item) => (
              <div
                className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3 text-sm"
                key={item.variantId}
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-[5px] bg-bone">
                  <Image
                    alt={item.imageAlt}
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={item.imageUrl}
                  />
                  <span className="absolute right-0 top-0 grid min-h-4 min-w-4 place-items-center bg-[#2C2C2A] px-1 text-[9px] text-white">
                    {item.quantity}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="truncate font-medium text-black">{item.name}</p>
                  <p className="mt-1 text-[11px] leading-tight text-stone">
                    Color: {item.colorName} · Size: {item.size}
                  </p>
                </div>

                <p className="text-right text-sm font-medium text-black">
                  {formatRupiah(item.lineNet)}
                </p>
              </div>
            ))}
          </div>

          <dl className="mt-5 space-y-4 text-sm">
            <SummaryRow
              label="Subtotal"
              value={formatRupiah(validation?.summary.netSubtotal ?? 0)}
            />
            <SummaryRow
              label="Shipping"
              value={selectedQuote ? formatRupiah(selectedQuote.cost) : "—"}
            />

            <div className="border-t border-black/10 pt-5">
              <SummaryRow
                label="Total"
                strong
                value={formatRupiah(totalTemporary)}
              />
            </div>
          </dl>

          <button
            className={storeButtonClasses({
              className:
                "mt-6 w-full rounded-[5px] border border-[#2C2C2A] bg-[#2C2C2A] uppercase tracking-[0.08em] text-white hover:bg-black focus-visible:outline-black",
              size: "large",
            })}
            disabled={!canShowForm || isCreatingOrder}
            form="checkout-form"
            type="submit"
          >
            {isCreatingOrder ? "Creating Order..." : "Continue to Payment"}
          </button>

          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-stone">
            <LockIcon /> Secure QRIS payment
          </p>
        </aside>
      </div>
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
  step,
  title,
}: {
  children: ReactNode;
  step: string;
  title: string;
}) {
  return (
    <section className="rounded-[10px] border border-black/[0.06] bg-paper-white p-5 sm:p-8">
      <div className="flex items-center gap-3 border-b border-black/10 pb-5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-black/20 text-xs font-medium text-black">
          {step}
        </span>
        <h2 className="text-xl font-semibold text-black">{title}</h2>
      </div>
      <div className="mt-6 space-y-5">{children}</div>
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
  const fieldId = `checkout-${registration.name.replace(/\./g, "-")}`;
  const errorId = `${fieldId}-error`;

  return (
    <label
      className="block text-xs font-medium text-black"
      htmlFor={fieldId}
    >
      {label}{" "}
      {optional ? (
        <span className="font-normal text-stone">
          (Optional)
        </span>
      ) : null}

      <StoreInput
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="mt-2 min-h-[52px] !rounded-[5px] !border-black/20 !bg-paper-white px-4 !text-sm !text-black shadow-none placeholder:!text-stone focus:!border-black focus-visible:!outline-black"
        id={fieldId}
        inputMode={inputMode}
        placeholder={placeholder}
        type={type}
        {...registration}
      />

      {error ? (
        <StoreFieldMessage
          className="mt-2 block font-medium"
          id={errorId}
          variant="error"
        >
          {error}
        </StoreFieldMessage>
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

  const fieldId = `checkout-${registration.name.replace(/\./g, "-")}`;
  const stateErrorId = `${fieldId}-state-error`;
  const emptyHintId = `${fieldId}-empty-hint`;
  const errorId = `${fieldId}-error`;

  const describedBy =
    [
      stateError ? stateErrorId : null,
      isEmpty && !disabled ? emptyHintId : null,
      error ? errorId : null,
    ]
      .filter(
        (value): value is string =>
          Boolean(value),
      )
      .join(" ") || undefined;

  return (
    <label
      className="block text-xs font-medium text-black"
      htmlFor={fieldId}
    >
      {label}

      <StoreSelect
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className="mt-2 min-h-[52px] !rounded-[5px] !border-black/20 !bg-paper-white px-4 !text-sm !text-black shadow-none focus:!border-black focus-visible:!outline-black disabled:!bg-paper-white disabled:!text-stone"
        disabled={
          disabled || loading
        }
        id={fieldId}
        {...registration}
        onChange={(event) => {
          registration.onChange(event);
          onValueChange?.(event);
        }}
      >
        <option value="">
          {loading
            ? "Loading..."
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
      </StoreSelect>

      {stateError ? (
        <StoreFieldMessage
          className="mt-2 block font-medium"
          id={stateErrorId}
          variant="error"
        >
          {stateError}{" "}
          <button
            className="underline"
            onClick={retry}
            type="button"
          >
            Try again
          </button>
        </StoreFieldMessage>
      ) : null}

      {isEmpty && !disabled ? (
        <StoreFieldMessage
          className="mt-2 block font-medium"
          id={emptyHintId}
        >
          Data is not available yet.
        </StoreFieldMessage>
      ) : null}

      {error ? (
        <StoreFieldMessage
          className="mt-2 block font-medium"
          id={errorId}
          variant="error"
        >
          {error}
        </StoreFieldMessage>
      ) : null}
    </label>
  );
}

function TextAreaField({
  error,
  label,
  optional = false,
  placeholder,
  registration,
}: {
  error?: string;
  label: string;
  optional?: boolean;
  placeholder?: string;
  registration: UseFormRegisterReturn;
}) {
  const fieldId = `checkout-${registration.name.replace(/\./g, "-")}`;
  const errorId = `${fieldId}-error`;

  return (
    <label
      className="block text-xs font-medium text-black"
      htmlFor={fieldId}
    >
      {label}{" "}
      {optional ? (
        <span className="font-normal text-stone">
          (Optional)
        </span>
      ) : null}

      <StoreTextarea
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className="mt-2 min-h-[112px] resize-y !rounded-[5px] !border-black/20 !bg-paper-white px-4 py-3 !text-sm !text-black shadow-none placeholder:!text-stone focus:!border-black focus-visible:!outline-black"
        id={fieldId}
        placeholder={placeholder}
        rows={4}
        {...registration}
      />

      {error ? (
        <StoreFieldMessage
          className="mt-2 block font-medium"
          id={errorId}
          variant="error"
        >
          {error}
        </StoreFieldMessage>
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

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] animate-pulse">
      <div className="h-12 w-48 rounded-[5px] bg-black/[0.06]" />
      <div className="mt-3 h-4 w-72 max-w-full rounded-[5px] bg-black/[0.05]" />
      <div className="mt-10 grid gap-8 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="space-y-8">
          <div className="h-72 rounded-[10px] border border-black/[0.06] bg-paper-white" />
          <div className="h-[520px] rounded-[10px] border border-black/[0.06] bg-paper-white" />
          <div className="h-64 rounded-[10px] border border-black/[0.06] bg-paper-white" />
        </div>
        <div className="h-[520px] rounded-[10px] border border-black/[0.06] bg-paper-white" />
      </div>
    </div>
  );
}
