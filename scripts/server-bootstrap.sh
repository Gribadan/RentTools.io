#!/usr/bin/env bash
set -euo pipefail

echo "=== rent-tool droplet bootstrap ==="

# 1. Swap (2 GB) — needed for Next.js builds on 512 MB droplets
if ! swapon --show | grep -q '/swapfile'; then
  echo ">> Creating 2 GB swap..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  # Slightly aggressive swappiness so RAM is freed before we hit OOM
  echo 'vm.swappiness=20' > /etc/sysctl.d/99-swap.conf
  sysctl -p /etc/sysctl.d/99-swap.conf
else
  echo ">> Swap already configured"
fi

# 2. Update + base packages
echo ">> Updating apt + installing base packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
  curl ca-certificates gnupg git build-essential \
  ufw fail2ban \
  nginx \
  sqlite3 \
  htop iotop vnstat \
  unattended-upgrades

# 3. Node 22 LTS via NodeSource
if ! command -v node >/dev/null || ! node --version | grep -q '^v22'; then
  echo ">> Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node --version
npm --version

# 4. certbot via snap (apt version is outdated)
if ! command -v certbot >/dev/null; then
  echo ">> Installing certbot..."
  apt-get install -y -qq snapd
  snap install core; snap refresh core
  snap install --classic certbot
  ln -sf /snap/bin/certbot /usr/bin/certbot
fi

# 5. ufw firewall — allow only SSH, HTTP, HTTPS
echo ">> Configuring ufw..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status verbose

# 6. fail2ban — ban after 5 failed SSH attempts in 10 min
echo ">> Configuring fail2ban..."
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
EOF
systemctl restart fail2ban
systemctl enable fail2ban

# 7. Unattended security upgrades — apt apply security patches automatically
echo ">> Enabling automatic security updates..."
dpkg-reconfigure -plow unattended-upgrades || true

# 8. Create `app` user with sudo (no password) — runs the Node service
if ! id -u app >/dev/null 2>&1; then
  echo ">> Creating 'app' user..."
  useradd -m -s /bin/bash app
  usermod -aG sudo app
  echo 'app ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/app
  chmod 440 /etc/sudoers.d/app
fi

# Copy authorized_keys from root → app
mkdir -p /home/app/.ssh
cp /root/.ssh/authorized_keys /home/app/.ssh/authorized_keys
chown -R app:app /home/app/.ssh
chmod 700 /home/app/.ssh
chmod 600 /home/app/.ssh/authorized_keys

# 9. SSH hardening — keep password auth ENABLED for root for now (recovery),
# but require keys for `app`. Once you confirm key auth, run:
#   sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
#   systemctl restart ssh
echo ">> SSH config: password auth still enabled for root (recovery). Disable manually after key access is verified."

# 10. App-specific dirs
echo ">> Creating app directories..."
sudo -u app mkdir -p /home/app/rent-tool /home/app/backups /home/app/logs
chown -R app:app /home/app/

# 11. nginx default config — disable, replaced later by rent-tool.conf
rm -f /etc/nginx/sites-enabled/default
nginx -t

# 12. Summary
echo ""
echo "=== Bootstrap complete ==="
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo "git:  $(git --version)"
echo "nginx: $(nginx -v 2>&1)"
echo "certbot: $(certbot --version 2>&1 | head -1)"
echo ""
free -m
df -h /
swapon --show
