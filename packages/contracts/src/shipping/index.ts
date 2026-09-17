/**
 * Shipping module contracts
 */

export interface ShippingQuote {
  id: string;
  quoteId: string;
  originDistrictId: string;
  destinationProvinceId: string;
  destinationProvinceName: string;
  destinationCityId: string;
  destinationCityName: string;
  destinationDistrictId: string;
  destinationDistrictName: string;
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  estimatedDelivery: string;
  shippingCost: number;
  totalProductWeightGram: number;
  packagingWeightGram: number;
  totalWeightGram: number;
  expiresAt: string;
  createdAt: string;
}

export interface ShippingRate {
  courierCode: string;
  courierName: string;
  serviceCode: string;
  serviceName: string;
  estimatedDelivery: string;
  shippingCost: number;
}

// API Request/Response types

export interface GetShippingRatesRequest {
  destination: {
    provinceId: string;
    cityId: string;
    districtId: string;
    postalCode: string;
  };
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
}

export interface GetShippingRatesResponse {
  quoteId: string;
  rates: ShippingRate[];
  totalWeightGram: number;
  expiresAt: string;
}
