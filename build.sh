#!/bin/bash
# Build script for hash-based cache busting

set -e

echo "🔨 Building 111 game with content-hashed filenames..."

# Generate hashes (8 chars is enough)
CSS_HASH=$(md5 -q styles.css | cut -c1-8)
JS_HASH=$(md5 -q game.js | cut -c1-8)

echo "  CSS hash: $CSS_HASH"
echo "  JS hash:  $JS_HASH"

# Create hashed copies
cp styles.css "styles.$CSS_HASH.css"
cp game.js "game.$JS_HASH.js"

# Update index.html
sed -i.bak "s/styles\.[a-f0-9]*\.css/styles.$CSS_HASH.css/" index.html
sed -i.bak "s/game\.[a-f0-9]*\.js/game.$JS_HASH.js/" index.html
rm index.html.bak

# Update service worker
CACHE_VERSION="v8-$CSS_HASH$JS_HASH"
sed -i.bak "s/CACHE_NAME = '[^']*'/CACHE_NAME = '111-$CACHE_VERSION'/" sw.js
sed -i.bak "s|/styles\.[a-f0-9]*\.css|/styles.$CSS_HASH.css|" sw.js
sed -i.bak "s|/game\.[a-f0-9]*\.js|/game.$JS_HASH.js|" sw.js
rm sw.js.bak

# Remove old hashed files (keep current hash)
find . -maxdepth 1 -name "styles.*.css" ! -name "styles.$CSS_HASH.css" -delete
find . -maxdepth 1 -name "game.*.js" ! -name "game.$JS_HASH.js" -delete

echo "✅ Build complete!"
echo "   styles.$CSS_HASH.css"
echo "   game.$JS_HASH.js"
echo ""
echo "Next steps:"
echo "  git add ."
echo "  git commit -m 'Build with hash $CSS_HASH$JS_HASH'"
echo "  git push"
echo "  npx wrangler pages deploy . --project-name=111"
