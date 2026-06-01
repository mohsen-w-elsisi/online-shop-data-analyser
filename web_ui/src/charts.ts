/**
 * Chart rendering module
 * Creates and manages all dashboard visualizations
 */

import { Chart } from "chart.js/auto";
import type { ChartConfiguration } from "chart.js/auto";

let priceRatingChart: Chart | null = null;
let quartileChart: Chart | null = null;

// ============================================================================
// Price vs Rating Scatter Chart
// ============================================================================

export function renderPriceRatingChart(
  data: Array<{ price: number; rating: number }>,
): void {
  const container = document.getElementById("price-rating-chart");
  if (!container) return;

  // Destroy existing chart if it exists
  if (priceRatingChart) {
    priceRatingChart.destroy();
  }

  // Create canvas element
  const canvas = document.createElement("canvas");
  container.innerHTML = "";
  container.appendChild(canvas);

  const config: ChartConfiguration = {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Listings",
          data: data.map((d) => ({ x: d.price, y: d.rating })),
          borderColor: "rgb(179, 95, 53)",
          backgroundColor: "rgba(179, 95, 53, 0.5)",
          borderWidth: 1,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "#20160f",
            font: {
              size: 12,
              weight: "bold",
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(32, 22, 15, 0.8)",
          titleColor: "#fffaf3",
          bodyColor: "#fffaf3",
          borderColor: "rgba(179, 95, 53, 0.5)",
          borderWidth: 1,
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || "";
              const point = context.raw as { x: number; y: number };
              return `${label}: Price EGP ${point.x.toLocaleString()}, Rating ${point.y.toFixed(2)}/5`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          position: "bottom",
          title: {
            display: true,
            text: "Price (EGP)",
            color: "#20160f",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          ticks: {
            color: "#6e5d4d",
            callback: (value: any) =>
              "EGP " + (value as number).toLocaleString(),
          },
          grid: {
            color: "rgba(51, 37, 24, 0.1)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Rating",
            color: "#20160f",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          min: 0,
          max: 5.5,
          ticks: {
            color: "#6e5d4d",
            callback: (value: any) => (value as number).toFixed(1),
          },
          grid: {
            color: "rgba(51, 37, 24, 0.1)",
          },
        },
      },
    },
  } as any;

  priceRatingChart = new Chart(canvas, config);
}

// ============================================================================
// Listings by Price Quartile Bar Chart
// ============================================================================

export function renderQuartileChart(data: {
  quartiles: string[];
  ratedCounts: number[];
  unratedCounts: number[];
}): void {
  const container = document.getElementById("quartile-chart");
  if (!container) return;

  // Destroy existing chart if it exists
  if (quartileChart) {
    quartileChart.destroy();
  }

  // Create canvas element
  const canvas = document.createElement("canvas");
  container.innerHTML = "";
  container.appendChild(canvas);

  const config: ChartConfiguration = {
    type: "bar",
    data: {
      labels: data.quartiles,
      datasets: [
        {
          label: "unrated",
          data: data.ratedCounts,
          backgroundColor: "rgba(179, 95, 53, 0.8)",
          borderColor: "rgb(179, 95, 53)",
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: "rated",
          data: data.unratedCounts,
          backgroundColor: "rgba(179, 95, 53, 0.3)",
          borderColor: "rgb(179, 95, 53)",
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: "x",
      plugins: {
        legend: {
          display: true,
          reverse: true,
          labels: {
            color: "#20160f",
            font: {
              size: 12,
              weight: "bold",
            },
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: "rgba(32, 22, 15, 0.8)",
          titleColor: "#fffaf3",
          bodyColor: "#fffaf3",
          borderColor: "rgba(179, 95, 53, 0.5)",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Price Quartile",
            color: "#20160f",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          ticks: {
            color: "#6e5d4d",
            font: {
              size: 12,
            },
          },
          grid: {
            color: "transparent",
          },
        },
        y: {
          title: {
            display: true,
            text: "Count",
            color: "#20160f",
            font: {
              size: 14,
              weight: "bold",
            },
          },
          beginAtZero: true,
          ticks: {
            color: "#6e5d4d",
            stepSize: 1,
          },
          grid: {
            color: "rgba(51, 37, 24, 0.1)",
          },
        },
      },
    },
  } as any;

  quartileChart = new Chart(canvas, config);
}

// ============================================================================
// Cleanup
// ============================================================================

export function destroyAllCharts(): void {
  if (priceRatingChart) {
    priceRatingChart.destroy();
    priceRatingChart = null;
  }
  if (quartileChart) {
    quartileChart.destroy();
    quartileChart = null;
  }
}
