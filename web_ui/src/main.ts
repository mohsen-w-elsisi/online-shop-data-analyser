import './style.css';
import {
  loadListingsFromCSV,
  loadCopurchasedProducts,
  calculateDataSummary,
  getPriceRatingData,
} from './dataLoader';
import { renderPriceRatingChart } from './charts';
import type { Listing, DataSummary } from './types';

// ============================================================================
// UI Rendering Functions
// ============================================================================

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function updateMetric(metricKey: string, value: string | number): void {
  const elements = document.querySelectorAll(`[data-metric="${metricKey}"] .metric-value`);
  elements.forEach(el => {
    el.textContent = typeof value === 'number' ? formatNumber(value) : value;
    el.setAttribute('data-value', String(value));
  });
}

let listingsTableExpanded = false;
let currentListings: Listing[] = [];

// ============================================================================
// Data Loading & Initialization
// ============================================================================

async function loadAllData(): Promise<{
  allListings: Listing[];
  ebayListings: Listing[];
  jumiaListings: Listing[];
  noonListings: Listing[];
  summary: DataSummary;
}> {
  console.log('🔄 Starting data load...');

  // Load all listing sources in parallel
  const [allListings, ebayListings, jumiaListings, noonListings] = await Promise.all([
    loadListingsFromCSV('listings.csv'),
    loadListingsFromCSV('ebay_listings.csv'),
    loadListingsFromCSV('jumia_listings.csv'),
    loadListingsFromCSV('noon_listings.csv'),
  ]);

  console.log(`✅ Loaded ${allListings.length} total listings`);
  console.log(`  - eBay: ${ebayListings.length}`);
  console.log(`  - Jumia: ${jumiaListings.length}`);
  console.log(`  - Noon: ${noonListings.length}`);

  const summary = calculateDataSummary(allListings);
  console.log(`📊 Calculated summary stats`);

  return {
    allListings,
    ebayListings,
    jumiaListings,
    noonListings,
    summary,
  };
}

async function populateMetrics(data: {
  allListings: Listing[];
  ebayListings: Listing[];
  jumiaListings: Listing[];
  noonListings: Listing[];
  summary: DataSummary;
}): Promise<void> {
  console.log('📈 Populating metrics...');

  updateMetric('total', data.allListings.length);
  updateMetric('ebay', data.ebayListings.length);
  updateMetric('jumia', data.jumiaListings.length);
  updateMetric('noon', data.noonListings.length);
  updateMetric('price-avg', data.summary.priceRange.average.toFixed(2));
  updateMetric('rating-avg', data.summary.ratingStats.average.toFixed(2));
}

async function renderCharts(data: { allListings: Listing[] }): Promise<void> {
  console.log('📊 Rendering charts...');

  // Price vs Rating scatter chart
  const priceRatingData = getPriceRatingData(data.allListings);
  renderPriceRatingChart(priceRatingData);
  console.log(`  - Price vs Rating: ${priceRatingData.length} data points`);

  // Quartile chart is loaded as a static notebook-exported image in index.html.
  console.log('  - Price Quartile Distribution loaded from exported notebook image');
}

function populateListingsTable(listings: Listing[]): void {
  console.log('📋 Populating listings table...');

  const tbody = document.getElementById('listings-tbody');
  const tableInfo = document.getElementById('table-info');
  const tableToggle = document.getElementById('listings-table-toggle');

  if (!tbody) return;

  currentListings = listings;

  // Clear existing rows
  tbody.innerHTML = '';

  // Add rows for each listing
  listings.forEach((listing, index) => {
    const row = document.createElement('tr');
    if (!listingsTableExpanded && index >= 5) {
      row.classList.add('is-hidden-row');
    }

    // Truncate product name to reasonable length
    const displayName = listing.name.length > 60 ? `${listing.name.substring(0, 60)}...` : listing.name;

    // Format price
    const priceDisplay =
      listing.price_type === 'range'
        ? `EGP ${(listing.price_range?.[0] || 0).toLocaleString()} - EGP ${(listing.price_range?.[1] || 0).toLocaleString()}`
        : listing.price
        ? `EGP ${listing.price.toLocaleString()}`
        : 'N/A';

    // Format rating
    const ratingDisplay = listing.rating ? `${listing.rating.toFixed(1)}/5` : 'N/A';

    // Format review count
    const reviewDisplay = listing.review_count ?? '0';

    row.innerHTML = `
      <td>${displayName}</td>
      <td class="col-vendor">${listing.vendor}</td>
      <td class="col-price">${priceDisplay}</td>
      <td class="col-rating">${ratingDisplay}</td>
      <td>${reviewDisplay}</td>
      <td><a href="${listing.url}" class="listing-link" target="_blank">View</a></td>
    `;

    tbody.appendChild(row);
  });

  // Update table info
  if (tableInfo) {
    tableInfo.textContent = listingsTableExpanded
      ? `Showing all ${listings.length} listings`
      : `Showing first 5 of ${listings.length} listings`;
  }

  if (tableToggle) {
    tableToggle.textContent = listingsTableExpanded ? 'Show first 5' : 'Show all listings';
  }
}

function toggleListingsTable(): void {
  listingsTableExpanded = !listingsTableExpanded;
  populateListingsTable(currentListings);
}

async function initializeDashboard(): Promise<void> {
  try {
    console.log('🚀 Initializing dashboard...');

    // Load all data
    const data = await loadAllData();

    // Populate UI
    await populateMetrics(data);
    await renderCharts(data);
    populateListingsTable(data.allListings);

    // Load copurchased products (for future chart implementation)
    const copurchased = await loadCopurchasedProducts();
    console.log(`📦 Loaded ${copurchased.length} copurchased product relationships`);

    // Make data available globally for debugging
    (window as any).dashboardData = data;
    (window as any).copurchased = copurchased;

    console.log('✨ Dashboard initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing dashboard:', error);
    // Show error message to user
    const overview = document.getElementById('dashboard-overview');
    if (overview) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message';
      errorMsg.textContent =
        'Failed to load data. Please ensure data files are in /public/data/';
      overview.appendChild(errorMsg);
    }
  }
}

// ============================================================================
// Application Entry Point
// ============================================================================

document.addEventListener('DOMContentLoaded', initializeDashboard);

document.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.id === 'listings-table-toggle') {
    toggleListingsTable();
  }
});

// Make data loader functions available globally for debugging
if (process.env.NODE_ENV === 'development') {
  (window as any).dashboardDebug = {
    loadAllData,
    loadListingsFromCSV,
    loadCopurchasedProducts,
  };
}
