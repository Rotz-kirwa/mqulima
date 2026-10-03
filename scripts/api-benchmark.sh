#!/usr/bin/env bash
set -e

endpoints=(
  "http://localhost:8080/api/health"
  "http://localhost:8080/api/health?db=1"
  "http://localhost:8080/api/products"
  "http://localhost:8080/api/products?limit=24"
  "http://localhost:8080/api/news"
  "http://localhost:8080/api/news?limit=9"
  "http://localhost:8080/api/posts"
  "http://localhost:8080/api/posts?limit=10"
)

echo "=== BENCHMARK SUITE: 5 RUNS PER ENDPOINT ==="
printf "%-35s | %-10s | %-10s | %-12s\n" "Endpoint" "Cold TTFB" "Warm Med" "Payload (B)"
printf "%-35s-+-%-10s-+-%-10s-+-%-12s\n" "-----------------------------------" "----------" "----------" "------------"

for url in "${endpoints[@]}"; do
  times=()
  size=0
  for i in {1..5}; do
    out=$(curl -o /dev/null -s -w "%{time_starttransfer} %{size_download}" "$url")
    ttfb=$(echo "$out" | awk '{print $1}')
    sz=$(echo "$out" | awk '{print $2}')
    size=$sz
    times+=("$ttfb")
  done

  cold="${times[0]}"
  # Sort times for runs 2-5 to get warm median
  sorted=($(printf '%s\n' "${times[@]:1}" | sort -n))
  # 4 elements in sorted: take index 1 or 2 as median
  warm_med="${sorted[1]}"

  # Convert seconds to ms
  cold_ms=$(awk "BEGIN {printf \"%.2f ms\", $cold * 1000}")
  warm_ms=$(awk "BEGIN {printf \"%.2f ms\", $warm_med * 1000}")

  path="${url#http://localhost:8080}"
  printf "%-35s | %-10s | %-10s | %-12s\n" "$path" "$cold_ms" "$warm_ms" "$size"
done
