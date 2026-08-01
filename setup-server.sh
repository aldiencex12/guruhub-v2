#!/usr/bin/env bash

# ==============================================================================
# 🏫 GuruHub v2 — Automated Server Setup & Deployment Script
# Target OS: Ubuntu 22.04 LTS / Debian 12 (Optimized for Dell R360 Enterprise Server)
# ==============================================================================

set -e

# Warna Output Terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================================================${NC}"
echo -e "${GREEN}   🏫 GURUHUB v2 — AUTOMATED SERVER SETUP & DEPLOYMENT SCRIPT       ${NC}"
echo -e "${BLUE}====================================================================${NC}"

# 1. Periksa Akses Root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Harap jalankan script ini sebagai root (sudo ./setup-server.sh)${NC}"
  exit 1
fi

# 2. Update Sistem Operasi & Package Utama
echo -e "\n${YELLOW}📦 [1/7] Mengurangi & Memperbarui Package OS...${NC}"
apt install -y curl git unzip build-essential nginx mariadb-server ufw \
  ca-certificates fonts-liberation libcairo2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 \
  libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 libdrm2 libxkbcommon0 xdg-utils \
  libasound2t64 libatk1.0-0t64 libatk-bridge2.0-0t64 libcups2t64 2>/dev/null || \
apt install -y curl git unzip build-essential nginx mariadb-server ufw \
  ca-certificates fonts-liberation libcairo2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libx11-6 libx11-xcb1 \
  libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
  libxss1 libxtst6 libdrm2 libxkbcommon0 xdg-utils \
  libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2

# 3. Install Node.js (v20 LTS), Bun Runtime & PM2
echo -e "\n${YELLOW}⚡ [2/7] Menginstall Node.js v20, Bun Runtime & PM2...${NC}"

# Node.js 20 LTS
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Bun Runtime
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
    ln -sf "$HOME/.bun/bin/bun" /usr/local/bin/bun 2>/dev/null || true
    ln -sf "$HOME/.bun/bin/bun" /usr/bin/bun 2>/dev/null || true
fi

# PM2 Process Manager
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Make sure Bun is accessible in PATH
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/root/.bun/bin:$PATH"

# 4. Setup Database MySQL/MariaDB
echo -e "\n${YELLOW}🗄️ [3/7] Mengonfigurasi Database MariaDB/MySQL...${NC}"
systemctl start mariadb || systemctl start mysql
systemctl enable mariadb || systemctl enable mysql

DB_NAME="guruhub_db"
DB_USER="guruhub_user"
DB_PASS="GuruHubSecurePass2026!"

mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo -e "${GREEN}✅ Database ${DB_NAME} dan Pengguna ${DB_USER} Berhasil Dikonfigurasi!${NC}"

# 5. Setup Environment File (.env)
echo -e "\n${YELLOW}🔑 [4/7] Mengonfigurasi Kredensial (.env)...${NC}"
PROJECT_DIR=$(pwd)

cat <<EOF > "$PROJECT_DIR/guruhub-api/.env"
DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
JWT_SECRET="guruhub-super-secret-jwt-key-2026-dell-r360-production"
DEFAULT_SCHOOL_ID=719
PORT=3000
NODE_ENV=production
EOF
echo -e "${GREEN}✅ File guruhub-api/.env berhasil dibuat!${NC}"

# 6. Install Dependencies & Build Apps
echo -e "\n${YELLOW}🔨 [5/7] Menginstall Dependensi & Rebuild Aplikasi...${NC}"

# Backend API
echo -e "${BLUE}▶ Processing Backend API (guruhub-api)...${NC}"
cd "$PROJECT_DIR/guruhub-api"
/root/.bun/bin/bun install || bun install

# Import database schema & seed data if table 'schools' doesn't exist
if mysql "${DB_NAME}" -e "DESCRIBE schools;" &>/dev/null; then
    echo -e "${GREEN}✅ Database ${DB_NAME} sudah memiliki tabel!${NC}"
else
    echo -e "${YELLOW}📥 Mengimpor skema & data awal guruhub_data.sql ke MariaDB...${NC}"
    mysql "${DB_NAME}" < "$PROJECT_DIR/guruhub-api/guruhub_data.sql"
    echo -e "${GREEN}✅ Database ${DB_NAME} berhasil diisi dari guruhub_data.sql!${NC}"
fi

# Schema Patch for missing columns / enums & missing tables in MariaDB
echo -e "${YELLOW}🛠️ Memverifikasi & memperbarui struktur tabel MariaDB (Disiplin & Rapor Sisipan)...${NC}"
mysql "${DB_NAME}" << 'SQL_END'
ALTER TABLE schools ADD COLUMN IF NOT EXISTS foundation_name varchar(255) DEFAULT NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS regional_name varchar(255) DEFAULT NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS accreditation varchar(100) DEFAULT NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS email varchar(255) DEFAULT NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS website varchar(255) DEFAULT NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url longtext DEFAULT NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS kop_surat_url longtext DEFAULT NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS principal_name varchar(255) DEFAULT NULL;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS principal_nip varchar(50) DEFAULT NULL;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS religion_group enum('Islam','Kristen','Katolik','Hindu','Buddha','Khonghucu','UMUM') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UMUM';
ALTER TABLE users MODIFY COLUMN role enum('SuperAdmin','SchoolAdmin','Principal','Teacher','HomeroomTeacher','BKTeacher','Counselor','Student','Polsis') NOT NULL;
SQL_END

if [ -f "$PROJECT_DIR/guruhub-api/migrations_patch.sql" ]; then
    echo -e "${YELLOW}📥 Memuat tabel disiplin & rapor sisipan (migrations_patch.sql)...${NC}"
    mysql "${DB_NAME}" < "$PROJECT_DIR/guruhub-api/migrations_patch.sql"
fi

echo -e "${GREEN}✅ Skema tabel database MariaDB terverifikasi lengkap!${NC}"

# Frontend Main App
echo -e "${BLUE}▶ Processing Frontend (front-guruhub)...${NC}"
cd "$PROJECT_DIR/front-guruhub"
npm install
npm run build

# Frontend Mobile App
if [ -d "$PROJECT_DIR/front-guruhub-mobile" ]; then
    echo -e "${BLUE}▶ Processing Mobile Frontend (front-guruhub-mobile)...${NC}"
    cd "$PROJECT_DIR/front-guruhub-mobile"
    npm install
    npm run build
fi

cd "$PROJECT_DIR"

# 7. Konfigurasi PM2 Process Manager
echo -e "\n${YELLOW}🚀 [6/7] Menjalankan Aplikasi via PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root || true

# 8. Konfigurasi Nginx Web Server & Firewall
echo -e "\n${YELLOW}🌐 [7/7] Mengonfigurasi Nginx Web Server & Firewall...${NC}"

NGINX_CONF="/etc/nginx/sites-available/guruhub"

cat <<'EOF' > $NGINX_CONF
# Server Block: Backend API (api.cbt-smpht5.my.id)
server {
    listen 80;
    server_name api.cbt-smpht5.my.id apiv1.cbt-smpht5.my.id;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Server Block: Mobile Web App (mobile.cbt-smpht5.my.id)
server {
    listen 80;
    server_name mobile.cbt-smpht5.my.id;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Server Block: Default / Main Web App (guruhub.cbt-smpht5.my.id)
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    server_name _ guruhub.cbt-smpht5.my.id;

    client_max_body_size 50M;

    gzip on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_cache_valid 200 365d;
        access_log off;
    }
}
EOF

# Link Nginx Site & Restart Nginx
ln -sf /etc/nginx/sites-available/guruhub /etc/nginx/sites-enabled/guruhub
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Buka Port Firewall (Nginx HTTP/HTTPS, API 3000, Mobile 3002 & SSH)
ufw allow 'Nginx Full'
ufw allow 3000/tcp
ufw allow 3002/tcp
ufw allow OpenSSH
echo "y" | ufw enable || true

SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo -e "\n${GREEN}====================================================================${NC}"
echo -e "${GREEN}🎉 SETUP SERVER DELL R360 & DEPLOYMENT GURUHUB v2 SUKSES!           ${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "Aplikasi GuruHub dapat diakses via browser di:"
echo -e "${BLUE}👉 Desktop Web  : http://${SERVER_IP}${NC}"
echo -e "${BLUE}👉 Mobile Web   : http://${SERVER_IP}:3002${NC}"
echo -e ""
echo -e "Status Layanan PM2:"
pm2 status
echo -e "${GREEN}====================================================================${NC}"
