# html-deploy-demo

Minimal static site demo deployed with GitHub Pages.

## Local preview

Open `index.html` in a browser, or run a simple static server such as:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow in `.github/workflows/deploy.yml` and publishes the site with GitHub Pages.