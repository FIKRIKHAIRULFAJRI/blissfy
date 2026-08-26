import type {
  AllowedCourierCode,
  RegionLevel,
  ShippingRateQuote,
  ShippingRegion,
} from './shipping.types';

export const SHIPPING_PROVIDER = Symbol('SHIPPING_PROVIDER');

export interface ShippingProvider {
  getRegions(input: {
    level: RegionLevel;
    parentId?: string;
  }): Promise<ShippingRegion[]>;

  getRates(input: {
    originDistrictId: string;
    destinationDistrictId: string;
    weightGrams: number;
    couriers: AllowedCourierCode[];
  }): Promise<ShippingRateQuote[]>;
}
