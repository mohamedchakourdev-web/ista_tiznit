#!/bin/sh
set -e

php artisan migrate --force
php artisan storage:link --force 2>/dev/null || true

mkdir -p storage/app/private/imports storage/app/temp storage/app/public/avatars
chmod -R ug+rwx storage bootstrap/cache 2>/dev/null || true

php artisan config:cache
php artisan route:cache

php artisan queue:work --sleep=3 --tries=1 --timeout=1200 &
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
