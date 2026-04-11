#!/bin/bash
# Interactive Deploy Menu
# Usage: ./deploy-menu.sh

set -e

SERVER="root@85.10.196.119"
PROJECT_ROOT="/var/www/KhanhHAUI/CICD"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# App configs
declare -A APP_DOMAINS=(
  ["1"]="4kvideopro|4kvideo.pro|./apps/4kvideopro"
  ["2"]="ytmp3.my|ytmp3.my|./apps/ytmp3.my"
  ["3"]="y2matepro|y2matepro.com|./apps/y2matepro"
  ["4"]="y2matevc|y2mate.vc|./apps/y2matevc"
  ["5"]="ytmp3-clone-3|ytmp3-clone-3.com|./apps/ytmp3-clone-3"
  ["6"]="mp3fast|mp3fast.net|./apps/mp3fast"
  ["7"]="ytmp3-clone-5|ytmp3-clone-5.com|./apps/ytmp3-clone-5"
)

# Function to print colored text
print_color() {
  local color=$1
  shift
  echo -e "${color}$@${NC}"
}

# Function to print header
print_header() {
  echo ""
  print_color "$CYAN" "=========================================="
  print_color "$BOLD$GREEN" "[DEPLOY] $1"
  print_color "$CYAN" "=========================================="
  echo ""
}

# Function to deploy single app
deploy_app() {
  local app_name=$1
  local domain=$2
  local app_path=$3
  local tar_file="${app_name}-dist.tar.gz"

  print_color "$MAGENTA" "\n>>> Deploying: ${BOLD}${app_name}${NC}"
  print_color "$CYAN" "    Domain: $domain"
  print_color "$CYAN" "    Path: $app_path"
  echo ""

  # Step 1: Build
  print_color "$YELLOW" "  [1/4] Building..."
  if pnpm --filter "$app_path" run build; then
    print_color "$GREEN" "  ✓ Build success"
  else
    print_color "$RED" "  ✗ Build failed"
    return 1
  fi

  # Step 2: Create archive
  print_color "$YELLOW" "  [2/4] Creating archive..."
  tar -czf "$tar_file" -C "${app_path}/dist" .
  local size=$(du -h "$tar_file" | cut -f1)
  print_color "$GREEN" "  ✓ Archive created: $size"

  # Step 3: Upload
  print_color "$YELLOW" "  [3/4] Uploading to server..."
  if scp "$tar_file" "$SERVER:/tmp/"; then
    print_color "$GREEN" "  ✓ Upload complete"
  else
    print_color "$RED" "  ✗ Upload failed"
    rm -f "$tar_file"
    return 1
  fi

  # Step 4: Deploy on server
  print_color "$YELLOW" "  [4/4] Deploying on server..."
  if ssh "$SERVER" "
    set -ex
    PROJECT_NAME='$domain'
    RUN_DIR='$PROJECT_ROOT/run/\$PROJECT_NAME'
    echo \"Deploying to: \$RUN_DIR\"
    mkdir -p \"\$RUN_DIR\"
    find \"\$RUN_DIR\" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
    tar -xzf /tmp/$tar_file -C \"\$RUN_DIR\"
    find \"\$RUN_DIR\" -type d -exec chmod 755 {} +
    find \"\$RUN_DIR\" -type f -exec chmod 644 {} +
    chgrp -R nginx \"\$RUN_DIR\" 2>/dev/null || true
    rm -f /tmp/$tar_file
    echo \"✓ Deployed to \$RUN_DIR\"
    ls -lh \"\$RUN_DIR\" | head -5
  "; then
    print_color "$GREEN" "  ✓ Deploy success"
  else
    print_color "$RED" "  ✗ Deploy failed (check output above)"
    rm -f "$tar_file"
    return 1
  fi

  # Cleanup local
  rm -f "$tar_file"

  print_color "$BOLD$GREEN" "✓ Completed: $app_name -> https://$domain"
  return 0
}

# Function to show menu
show_menu() {
  clear
  print_header "Deploy Menu"

  echo -e "${BOLD}Available Apps:${NC}"
  echo ""

  for key in $(echo "${!APP_DOMAINS[@]}" | tr ' ' '\n' | sort -n); do
    IFS='|' read -r app_name domain app_path <<< "${APP_DOMAINS[$key]}"
    printf "  ${CYAN}[%s]${NC} %-20s -> ${BLUE}%s${NC}\n" "$key" "$app_name" "$domain"
  done

  echo ""
  echo -e "  ${YELLOW}[A]${NC} Deploy ${BOLD}ALL${NC} apps"
  echo -e "  ${YELLOW}[M]${NC} Deploy ${BOLD}MULTIPLE${NC} apps (e.g., 1,2,5)"
  echo -e "  ${RED}[Q]${NC} Quit"
  echo ""
}

# Function to deploy multiple apps
deploy_multiple() {
  local selection=$1
  local -a selected_apps=()

  # Parse selection
  IFS=',' read -ra NUMS <<< "$selection"
  for num in "${NUMS[@]}"; do
    num=$(echo "$num" | xargs) # trim whitespace
    if [[ -n "${APP_DOMAINS[$num]}" ]]; then
      selected_apps+=("$num")
    else
      print_color "$RED" "!  Invalid selection: $num"
    fi
  done

  if [[ ${#selected_apps[@]} -eq 0 ]]; then
    print_color "$RED" "✗ No valid apps selected"
    return 1
  fi

  print_header "Deploy ${#selected_apps[@]} Apps"

  local success_count=0
  local fail_count=0
  local -a failed_apps=()

  for num in "${selected_apps[@]}"; do
    IFS='|' read -r app_name domain app_path <<< "${APP_DOMAINS[$num]}"

    if deploy_app "$app_name" "$domain" "$app_path"; then
      ((success_count++))
    else
      ((fail_count++))
      failed_apps+=("$app_name")
    fi

    echo ""
  done

  # Summary
  print_header "Deploy Summary"
  print_color "$GREEN" "✓ Success: $success_count"
  print_color "$RED" "✗ Failed: $fail_count"

  if [[ $fail_count -gt 0 ]]; then
    echo ""
    print_color "$RED" "Failed apps:"
    for app in "${failed_apps[@]}"; do
      print_color "$RED" "  - $app"
    done
  fi

  echo ""
  print_color "$CYAN" "Press Enter to continue..."
  read
}

# Function to deploy all apps
deploy_all() {
  print_header "Deploy ALL Apps"

  local success_count=0
  local fail_count=0
  local -a failed_apps=()

  for key in $(echo "${!APP_DOMAINS[@]}" | tr ' ' '\n' | sort -n); do
    IFS='|' read -r app_name domain app_path <<< "${APP_DOMAINS[$key]}"

    if deploy_app "$app_name" "$domain" "$app_path"; then
      ((success_count++))
    else
      ((fail_count++))
      failed_apps+=("$app_name")
    fi

    echo ""
  done

  # Summary
  print_header "Deploy Summary"
  print_color "$GREEN" "✓ Success: $success_count"
  print_color "$RED" "✗ Failed: $fail_count"

  if [[ $fail_count -gt 0 ]]; then
    echo ""
    print_color "$RED" "Failed apps:"
    for app in "${failed_apps[@]}"; do
      print_color "$RED" "  - $app"
    done
  fi

  echo ""
  print_color "$CYAN" "Press Enter to continue..."
  read
}

# Main loop
main() {
  while true; do
    show_menu

    echo -n -e "${BOLD}Select option: ${NC}"
    read -r choice

    case "$choice" in
      [1-7])
        IFS='|' read -r app_name domain app_path <<< "${APP_DOMAINS[$choice]}"
        print_header "Deploy Single App"
        deploy_app "$app_name" "$domain" "$app_path"
        echo ""
        print_color "$CYAN" "Press Enter to continue..."
        read
        ;;
      [Aa])
        echo ""
        echo -n -e "${YELLOW}Deploy ALL apps? (y/N): ${NC}"
        read -r confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
          deploy_all
        fi
        ;;
      [Mm])
        echo ""
        echo -n -e "${YELLOW}Enter app numbers (e.g., 1,2,5): ${NC}"
        read -r selection
        deploy_multiple "$selection"
        ;;
      [Qq])
        print_color "$GREEN" "\n Goodbye!\n"
        exit 0
        ;;
      *)
        print_color "$RED" "\n✗ Invalid option: $choice"
        sleep 1
        ;;
    esac
  done
}

# Check if running in Git Bash on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  print_color "$YELLOW" "!  Detected Windows Git Bash"
  print_color "$YELLOW" "    Make sure you have 'tar' and 'ssh' available"
  echo ""
fi

# Run main
main
