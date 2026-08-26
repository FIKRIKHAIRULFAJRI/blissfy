export const allowedCourierCodes = ['jne', 'jnt'] as const;

export type AllowedCourierCode = (typeof allowedCourierCodes)[number];

export type RegionLevel = 'province' | 'city' | 'district';

export type ShippingRegion = {
  id: string;
  name: string;
  postalCode: string | null;
};

export type ShippingRateQuote = {
  quoteId: string;
  courierCode: AllowedCourierCode;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  cost: number;
  estimatedDelivery: string;
  destinationId: string;
  totalWeightGrams: number;
};

export type ShippingRateRequestItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type ShippingDestination = {
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
};

export type ShippingProviderErrorCode =
  | 'SHIPPING_NOT_CONFIGURED'
  | 'SHIPPING_BAD_REQUEST'
  | 'SHIPPING_TIMEOUT'
  | 'SHIPPING_PROVIDER_UNAVAILABLE'
  | 'SHIPPING_PROVIDER_INVALID_RESPONSE'
  | 'SHIPPING_UNSUPPORTED_LOCATION';

export class ShippingProviderError extends Error {
  constructor(
    public readonly code: ShippingProviderErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ShippingProviderError';
  }
}
