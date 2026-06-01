/**
 * Data type definitions for the laptop listing analysis
 * These types mirror the Python dataclasses from the notebook
 */

export const PriceType = {
  DISCRETE: 'discrete',
  RANGE: 'range',
} as const;

export type PriceType = (typeof PriceType)[keyof typeof PriceType];

export interface Listing {
  name: string;
  url: string;
  image: string;
  price_type: PriceType;
  price: number | null;
  price_range: [number, number] | null;
  vendor: string;
  subvendor: string | null;
  rating: number | null;
  review_count: number | null;
}

export interface Vendor {
  name: string;
  count: number;
  listings: Listing[];
}

export interface DataSummary {
  totalListings: number;
  vendorBreakdown: Record<string, number>;
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
  ratingStats: {
    average: number;
    min: number;
    max: number;
  };
}

export interface CopurchasedProduct {
  product_id: string;
  product_name: string;
  copurchased_with: string[];
}

export interface DashboardData {
  listings: Listing[];
  copurchasedProducts: CopurchasedProduct[];
  summary: DataSummary;
}
