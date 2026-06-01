#!/bin/bash

# Export Data Script - Copies and converts data from notebook analysis into web_ui
# This script makes data accessible to the web UI dashboard

set -e

# Define paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_SOURCE_DIR="${PROJECT_ROOT}/data"
DATA_DEST_DIR="${PROJECT_ROOT}/web_ui/public/data"
VIS_DEST_DIR="${PROJECT_ROOT}/web_ui/public/visualisations"

echo "🔄 Exporting data from notebook analysis to web UI..."
echo "Source: ${DATA_SOURCE_DIR}"
echo "Destination: ${DATA_DEST_DIR}"

# Create destination directory if it doesn't exist
mkdir -p "${DATA_DEST_DIR}"
mkdir -p "${VIS_DEST_DIR}"

# Copy CSV files
echo "📋 Copying CSV files..."
cp "${DATA_SOURCE_DIR}/listings.csv" "${DATA_DEST_DIR}/"
cp "${DATA_SOURCE_DIR}/ebay_listings.csv" "${DATA_DEST_DIR}/"
cp "${DATA_SOURCE_DIR}/jumia_listings.csv" "${DATA_DEST_DIR}/"
cp "${DATA_SOURCE_DIR}/noon_listings.csv" "${DATA_DEST_DIR}/"

# Copy JSON files
echo "📦 Copying JSON files..."
cp "${DATA_SOURCE_DIR}/copurchased_products.json" "${DATA_DEST_DIR}/"

# Copy GraphML files
echo "📊 Copying network graph files..."
cp "${DATA_SOURCE_DIR}/noon_products.graphml" "${DATA_DEST_DIR}/"

# Copy notebook-exported visualisations (PNG)
echo "🖼️ Copying visualisation images..."
if [ -d "${PROJECT_ROOT}/visualisations" ]; then
	cp "${PROJECT_ROOT}/visualisations"/*.png "${VIS_DEST_DIR}/" 2>/dev/null || true
else
	echo "No visualisations directory found at ${PROJECT_ROOT}/visualisations"
fi

echo "✅ Data export complete!"
echo "Data is now available in: ${DATA_DEST_DIR}"
echo ""
echo "Files exported:"
ls -lh "${DATA_DEST_DIR}"
echo "Visualisations exported:"
ls -lh "${VIS_DEST_DIR}" || true
