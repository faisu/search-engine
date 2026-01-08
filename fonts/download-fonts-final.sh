#!/bin/bash

# Final script to download fonts - using direct TTF links
# Run this from project root: bash fonts/download-fonts-final.sh

FONT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Downloading fonts to: $FONT_DIR"
echo ""

# Remove old files
rm -f "$FONT_DIR"/*.ttf "$FONT_DIR"/*.woff2 2>/dev/null

# Roboto fonts - direct TTF from Google Fonts CDN
echo "1. Downloading Roboto-Regular.ttf..."
curl -L "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf" \
  -o "$FONT_DIR/Roboto-Regular.ttf" \
  --fail --silent --show-error --max-time 30

if [ ! -f "$FONT_DIR/Roboto-Regular.ttf" ] || [ ! -s "$FONT_DIR/Roboto-Regular.ttf" ]; then
  echo "❌ Failed to download Roboto-Regular.ttf"
  exit 1
fi

echo "2. Downloading Roboto-Bold.ttf..."
curl -L "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4.ttf" \
  -o "$FONT_DIR/Roboto-Bold.ttf" \
  --fail --silent --show-error --max-time 30

if [ ! -f "$FONT_DIR/Roboto-Bold.ttf" ] || [ ! -s "$FONT_DIR/Roboto-Bold.ttf" ]; then
  echo "❌ Failed to download Roboto-Bold.ttf"
  exit 1
fi

# Noto Sans Devanagari - try multiple sources
echo "3. Downloading NotoSansDevanagari-Regular.ttf..."
# Try from fonts.google.com download page or use a CDN
# Using a reliable font repository
curl -L "https://github.com/google/fonts/raw/main/ofl/notosansdevanagari/NotoSansDevanagari-Regular.ttf" \
  -H "Accept: application/octet-stream" \
  -o "$FONT_DIR/NotoSansDevanagari-Regular.ttf" \
  --fail --silent --show-error --max-time 60 || {
  echo "   Trying alternative source..."
  # Alternative: use a font CDN
  curl -L "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansdevanagari/NotoSansDevanagari-Regular.ttf" \
    -o "$FONT_DIR/NotoSansDevanagari-Regular.ttf" \
    --fail --silent --show-error --max-time 60
}

if [ ! -f "$FONT_DIR/NotoSansDevanagari-Regular.ttf" ] || [ ! -s "$FONT_DIR/NotoSansDevanagari-Regular.ttf" ]; then
  echo "❌ Failed to download NotoSansDevanagari-Regular.ttf"
  exit 1
fi

echo "4. Downloading NotoSansDevanagari-Bold.ttf..."
curl -L "https://github.com/google/fonts/raw/main/ofl/notosansdevanagari/NotoSansDevanagari-Bold.ttf" \
  -H "Accept: application/octet-stream" \
  -o "$FONT_DIR/NotoSansDevanagari-Bold.ttf" \
  --fail --silent --show-error --max-time 60 || {
  echo "   Trying alternative source..."
  curl -L "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansdevanagari/NotoSansDevanagari-Bold.ttf" \
    -o "$FONT_DIR/NotoSansDevanagari-Bold.ttf" \
    --fail --silent --show-error --max-time 60
}

if [ ! -f "$FONT_DIR/NotoSansDevanagari-Bold.ttf" ] || [ ! -s "$FONT_DIR/NotoSansDevanagari-Bold.ttf" ]; then
  echo "❌ Failed to download NotoSansDevanagari-Bold.ttf"
  exit 1
fi

echo ""
echo "✅ All fonts downloaded!"
echo ""
echo "Verifying font files..."
for font in "$FONT_DIR"/*.ttf; do
  if [ -f "$font" ]; then
    size=$(stat -f%z "$font" 2>/dev/null || stat -c%s "$font" 2>/dev/null)
    file_type=$(file "$font" 2>/dev/null | grep -i "font\|ttf\|truetype" || echo "Unknown")
    if echo "$file_type" | grep -qi "font\|ttf\|truetype"; then
      echo "  ✓ $(basename "$font"): Valid font file ($size bytes)"
    else
      echo "  ❌ $(basename "$font"): Invalid - appears to be: $file_type"
      echo "     First 50 chars: $(head -c 50 "$font" | cat -A)"
    fi
  fi
done


