#!/bin/bash
set -euo pipefail

base_url="${BASE_URL:-http://127.0.0.1:4000/api}"
email="tester-$(date +%s)@example.com"
password="StrongPass123"

work_dir="${TMPDIR:-/tmp}/cybershield-smoke"
mkdir -p "$work_dir"

register_file="$work_dir/register.json"
login_file="$work_dir/login.json"
scan_file="$work_dir/scan.json"
scan_list_file="$work_dir/scan-list.json"
breach_file="$work_dir/breach.json"
file_file="$work_dir/file.json"
dashboard_file="$work_dir/dashboard.json"
upload_file="$work_dir/suspicious.js"

curl -s -X POST "$base_url/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$email\",\"password\":\"$password\"}" \
  > "$register_file"

token="$(jq -r '.data.token' "$register_file")"
if [[ -z "$token" || "$token" == "null" ]]; then
  echo "Registration failed"
  cat "$register_file"
  exit 1
fi

curl -s -X POST "$base_url/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\",\"password\":\"$password\"}" \
  > "$login_file"

login_token="$(jq -r '.data.token' "$login_file")"
if [[ -z "$login_token" || "$login_token" == "null" ]]; then
  echo "Login failed"
  cat "$login_file"
  exit 1
fi

auth_header="Authorization: Bearer $login_token"

curl -s -X POST "$base_url/scan" \
  -H "$auth_header" \
  -H "Content-Type: application/json" \
  -d '{"target":"127.0.0.1","ports":"22,80,443"}' \
  > "$scan_file"

curl -s -X GET "$base_url/scan" \
  -H "$auth_header" \
  > "$scan_list_file"

curl -s -X POST "$base_url/breach" \
  -H "$auth_header" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$email\"}" \
  > "$breach_file"

cat > "$upload_file" <<'EOF'
password=secret
wallet token
eval(base64)
EOF

curl -s -X POST "$base_url/file" \
  -H "$auth_header" \
  -F "file=@$upload_file;type=application/javascript" \
  > "$file_file"

curl -s -X GET "$base_url/dashboard" \
  -H "$auth_header" \
  > "$dashboard_file"

jq -n \
  --slurpfile register "$register_file" \
  --slurpfile login "$login_file" \
  --slurpfile scan "$scan_file" \
  --slurpfile scanList "$scan_list_file" \
  --slurpfile breach "$breach_file" \
  --slurpfile file "$file_file" \
  --slurpfile dashboard "$dashboard_file" \
  '{
    register: {
      success: $register[0].success,
      user: $register[0].data.user.email
    },
    login: {
      success: $login[0].success,
      user: $login[0].data.user.email
    },
    scan: {
      success: $scan[0].success,
      summary: $scan[0].data.summary,
      ports: $scan[0].data.ports
    },
    scanList: {
      success: $scanList[0].success,
      count: $scanList[0].meta.count
    },
    breach: {
      success: $breach[0].success,
      found: $breach[0].data.found,
      breachCount: $breach[0].data.breachCount
    },
    file: {
      success: $file[0].success,
      riskLevel: $file[0].data.riskLevel,
      score: $file[0].data.score
    },
    dashboard: {
      success: $dashboard[0].success,
      totals: $dashboard[0].data.totals,
      pulseState: $dashboard[0].data.ui.pulseState
    }
  }'
