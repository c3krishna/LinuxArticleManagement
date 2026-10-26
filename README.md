# Linux Docs / server-issue.online

Articles, cheat sheets, forum, network tools and service bookings, served at https://server-issue.online.

| Folder | What it is |
|---|---|
| `linux-frontend/` | React site (Create React App + Tailwind). Built into `linux-frontend/build`, which nginx serves. |
| `linux-api/` | Express API on port 5000 (pm2 process `linux`, see `ecosystem.config.js`). Secrets in `linux-api/.env`. |
| `db/migrations/` | SQL to apply to the `linux_portal` database, in file-name order. |
| `nginx/` | Copies of the live nginx site configs. |

## On the server

Everything runs from this checkout at `/var/www/LinuxArticleManagement`:

- nginx root: `/var/www/LinuxArticleManagement/linux-frontend/build`
- API: `/var/www/LinuxArticleManagement/linux-api` (uploads in `linux-api/uploads`, not in git)
- nginx config: `/etc/nginx/sites-available/server-issue` (copy in `nginx/server-issue.online`)

## Deploy

Merge to `main`, push, then on the server:

```sh
/var/www/LinuxArticleManagement/deploy.sh
```

It pulls `main`, installs dependencies, builds the site next to the live one and swaps it in, then reloads the API.
Database migrations and nginx changes are applied by hand.

## Local development

```sh
cd linux-api && cp .env.example .env   # fill in DB and JWT_SECRET
npm install && npm start
cd ../linux-frontend && npm install && npm start   # proxies /api to localhost:5000
```
