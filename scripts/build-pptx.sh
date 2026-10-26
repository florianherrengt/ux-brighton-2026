#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
source_dir=${1:-$project_dir}
output_dir=${2:-$project_dir/dist}
output_name=ux-brighton-2026.pptx

mkdir -p "$output_dir"
rm -f "$output_dir/$output_name"

if ! command -v dagger >/dev/null 2>&1; then
  echo 'Dagger CLI is required to build the PowerPoint export.' >&2
  exit 1
fi

context_dir=$(mktemp -d)
trap 'rm -rf "$context_dir"' EXIT HUP INT TERM
cp "$source_dir/slides.md" "$source_dir/style.css" "$source_dir/package.json" "$source_dir/package-lock.json" "$context_dir/"
cp -R "$source_dir/assets" "$context_dir/assets"
mkdir "$context_dir/scripts"
cp "$source_dir/scripts/embed-pptx-video.mjs" "$context_dir/scripts/"

cd "$context_dir"
DAGGER_NO_NAG=1 dagger -M -c '
container |
  from mcr.microsoft.com/playwright:v1.64.0-noble |
  with-directory /app . |
  with-workdir /app |
  with-env-variable PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD 1 |
  with-exec -- npm ci |
  with-exec -- npm run build |
  with-exec -- ./node_modules/.bin/slidev export --format pptx --with-clicks=false --output /app/dist/ux-brighton-2026.pptx |
  with-exec -- node scripts/embed-pptx-video.mjs dist/ux-brighton-2026.pptx |
  directory /app/dist |
  export ./dist
'

cp "$context_dir/dist/$output_name" "$output_dir/$output_name"
echo "PowerPoint export: $output_dir/$output_name"
