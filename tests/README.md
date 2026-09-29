# Playwright tests

## Prereqs
- Node.js 18+

## Install
```bash
npm ci
npx playwright install --with-deps
```

## Run
```bash
# default runs against https://example.com
npm test

# run against an environment
BASE_URL=https://your-app.example.com npm test
```

## Output
- HTML report: `playwright-report/`
- JSON results: `test-results/results.json`
- Artifacts: `test-results/artifacts/`
