# BluSkyFinCorp

A fully functional investment website with an Express backend for contact submission.

## Setup

1. Install dependencies and start the project:

```powershell
npm run setup
```

2. Open the site:

```text
http://localhost:3000
```

3. Visit:

```text
http://localhost:3000
```

## Features

- responsive investment landing page
- investment plan tiers from $200 to $500,000
- listing search and details modal
- portfolio projection calculator
- secure inquiry form posting to `/api/contact`
- backend stores inquiries in `contact-inquiries.json`
- email notifications for inbound inquiries via SMTP

## Environment setup

1. Copy `.env.example` to `.env`
2. Update the email settings or leave SMTP values blank for Ethereal test email fallback:
   - `CONTACT_RECIPIENT`
   - `FROM_EMAIL`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
3. Configure admin access:
   - `ADMIN_USER`
   - `ADMIN_PASS`
4. Optional SSL settings for HTTPS:
   - `SSL_KEY`
   - `SSL_CERT`

> If SMTP is not configured, the app will use Ethereal test email automatically and log a preview URL to the console.

## Admin dashboard

- Visit `http://localhost:3000/admin` to access the admin dashboard.
- The dashboard requires the credentials configured in `.env`.
- The admin panel displays saved inquiries and lets your team review contact submissions securely.

## Deployment

Use any Node.js host that supports Express, or containerize the app.

## Docker

A `Dockerfile` is included for quick container deployment.

Build the image:

```bash
docker build -t bluskyfincorp .
```

Run the container:

```bash
docker run --rm -p 3000:3000 -v "$PWD/.env:/usr/src/app/.env" bluskyfincorp
```

To run with HTTPS in Docker, mount your SSL certificate files and set `SSL_KEY` and `SSL_CERT` paths inside the container:

```bash
docker run --rm -p 3000:3000 -v "$PWD/.env:/usr/src/app/.env" -v "$PWD/ssl:/usr/src/app/ssl" bluskyfincorp
```

Then use local paths in `.env` such as:

```text
SSL_KEY=/usr/src/app/ssl/server.key
SSL_CERT=/usr/src/app/ssl/server.crt
```

## Best deployment option

Render is the recommended deployment path because it works without requiring Docker locally and supports Node.js deployment directly from GitHub.

## Cloud deployment

### Render

Render is a good option when Docker is unavailable locally. Use the included `render.yaml` manifest and connect your GitHub repository to Render.

1. Push your project to GitHub.
2. Create a new Render service.
3. Choose `Web Service` and connect your repository.
4. Use `npm install` as the build command and `npm start` as the start command.
5. Add environment variables in the Render dashboard using your `.env` settings.

If you want, use the helper script `deploy-render.ps1` after Git is installed and the `GITHUB_REPO` environment variable is configured. It will commit your project and push to GitHub.

### Azure App Service

A GitHub Actions workflow is included at `.github/workflows/azure-webapp-deploy.yml`.

1. Create an Azure App Service for Node.js.
2. Add `AZURE_WEBAPP_NAME` and `AZURE_CREDENTIALS` secrets to your GitHub repository.
3. Push your code to GitHub to trigger deployment.

### Procfile

A `Procfile` is included for platforms that use the Heroku-style process model:

```text
web: npm start
```
