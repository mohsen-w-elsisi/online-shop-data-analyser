/**
 * Data loading and processing utilities
 * Handles loading CSV and JSON files from the public/data directory
 */

import Papa from 'papaparse';
import type { Listing, CopurchasedProduct, DataSummary } from './types';
import { PriceType as PriceTypeEnum } from './types';

function csvRowToListing(row: Record<string, string>): Listing {
  const priceType = row['price_type'] as PriceTypeEnum;
  const price = row['price'] ? parseFloat(row['price']) : null;

  let priceRange: [number, number] | null = null;
  if (row['price_range'] && row['price_range'] !== '') {
    try {
      // Parse tuple string like "(100, 200)"
      const match = row['price_range'].match(/\(([^,]+),\s*([^)]+)\)/);
      if (match) {
        priceRange = [parseFloat(match[1]), parseFloat(match[2])];
      }
    } catch (e) {
      priceRange = null;
    }
  }

  return {
    name: row['name'],
    url: row['url'],
    image: row['image'],
    price_type: priceType,
    price,
    price_range: priceRange,
    vendor: row['vendor'],
    subvendor: row['subvendor'] || null,
    rating: row['rating'] ? parseFloat(row['rating']) : null,
    review_count: row['review_count'] ? parseInt(row['review_count']) : null,
  };
}

export async function loadListingsFromCSV(filename: string): Promise<Listing[]> {
  try {
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) throw new Error(`Failed to load ${filename}`);

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<Record<string, string>>) => {
          try {
            const listings = (results.data as Record<string, string>[]).map(row =>
              csvRowToListing(row)
            );
            resolve(listings);
          } catch (error) {
            reject(error);
          }
        },
        error: (error: Error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        },
      });
    });
  } catch (error) {
    console.error(`Error loading listings from ${filename}:`, error);
    return [];
  }
}

export async function loadCopurchasedProducts(): Promise<CopurchasedProduct[]> {
  try {
    const response = await fetch('/data/copurchased_products.json');
    if (!response.ok) throw new Error('Failed to load copurchased products');

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error loading copurchased products:', error);
    return [];
  }
}

export function calculateDataSummary(listings: Listing[]): DataSummary {
  if (listings.length === 0) {
    return {
      totalListings: 0,
      vendorBreakdown: {},
      priceRange: { min: 0, max: 0, average: 0 },
      ratingStats: { average: 0, min: 0, max: 0 },
    };
  }

  // Vendor breakdown
  const vendorBreakdown: Record<string, number> = {};
  listings.forEach(listing => {
    vendorBreakdown[listing.vendor] = (vendorBreakdown[listing.vendor] || 0) + 1;
  });

  // Price statistics
  const prices = listings
    .filter(l => l.price_type === PriceTypeEnum.DISCRETE && l.price !== null)
    .map(l => l.price as number);

  const priceRange = prices.length > 0
    ? {
        min: Math.min(...prices),
        max: Math.max(...prices),
        average: prices.reduce((a, b) => a + b, 0) / prices.length,
      }
    : { min: 0, max: 0, average: 0 };

  // Rating statistics
  const ratings = listings
    .filter(l => l.rating !== null)
    .map(l => l.rating as number);

  const ratingStats = ratings.length > 0
    ? {
        average: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        min: Math.min(...ratings),
        max: Math.max(...ratings),
      }
    : { average: 0, min: 0, max: 0 };

  return {
    totalListings: listings.length,
    vendorBreakdown,
    priceRange,
    ratingStats,
  };
}

export function groupListingsByVendor(listings: Listing[]): Record<string, Listing[]> {
  const grouped: Record<string, Listing[]> = {};

  listings.forEach(listing => {
    if (!grouped[listing.vendor]) {
      grouped[listing.vendor] = [];
    }
    grouped[listing.vendor].push(listing);
  });

  return grouped;
}

export function getPriceRatingData(listings: Listing[]): Array<{ price: number; rating: number }> {
  return listings
    .filter(l => l.price !== null && l.rating !== null && l.price_type === PriceTypeEnum.DISCRETE)
    .map(l => ({
      price: l.price as number,
      rating: l.rating as number,
    }));
}

export function getQuartileData(listings: Listing[]): {
  quartiles: string[];
  ratedCounts: number[];
  unratedCounts: number[];
} {
  // Filter listings with prices and non-eBay vendors
  const listingsWithPrice = listings.filter(
    l => l.price !== null && l.price_type === PriceTypeEnum.DISCRETE && l.vendor !== 'Ebay'
  );

  if (listingsWithPrice.length === 0) {
    return { quartiles: [], ratedCounts: [], unratedCounts: [] };
  }

  // Sort by price to find quartile boundaries
  const sorted = [...listingsWithPrice].sort((a, b) => (a.price || 0) - (b.price || 0));
  const q1Index = Math.floor(sorted.length / 4);
  const q2Index = Math.floor((sorted.length / 4) * 2);
  const q3Index = Math.floor((sorted.length / 4) * 3);

  const q1Max = sorted[q1Index - 1]?.price || 0;
  const q2Max = sorted[q2Index - 1]?.price || 0;
  const q3Max = sorted[q3Index - 1]?.price || 0;

  // Categorize listings into quartiles
  const quartileCounts: Record<string, { rated: number; unrated: number }> = {
    Q1: { rated: 0, unrated: 0 },
    Q2: { rated: 0, unrated: 0 },
    Q3: { rated: 0, unrated: 0 },
    Q4: { rated: 0, unrated: 0 },
  };

  listingsWithPrice.forEach(listing => {
    const price = listing.price || 0;
    const isRated = listing.rating !== null;
    let quartile = 'Q1';

    if (price <= q1Max) quartile = 'Q1';
    else if (price <= q2Max) quartile = 'Q2';
    else if (price <= q3Max) quartile = 'Q3';
    else quartile = 'Q4';

    if (isRated) {
      quartileCounts[quartile].rated++;
    } else {
      quartileCounts[quartile].unrated++;
    }
  });

  return {
    quartiles: ['Q1', 'Q2', 'Q3', 'Q4'],
    ratedCounts: [
      quartileCounts.Q1.rated,
      quartileCounts.Q2.rated,
      quartileCounts.Q3.rated,
      quartileCounts.Q4.rated,
    ],
    unratedCounts: [
      quartileCounts.Q1.unrated,
      quartileCounts.Q2.unrated,
      quartileCounts.Q3.unrated,
      quartileCounts.Q4.unrated,
    ],
  };
}
