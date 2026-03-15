# Copy-Forward Guide — Cloning Cheggie to a New Niche

Use this guide when spinning up a new vertical (e.g. real estate, e-commerce, healthcare) from this monorepo.

---

## Step 1: Fork / Copy the Repository

```bash
gh repo create <new-org>/<new-app> --template cheggie-org/cheggie-dashboard- --private
cd <new-app>
```

---

## Step 2: Global Find & Replace

Run these substitutions across the entire codebase:

| Find | Replace |
|---|---|
| `cheggie` | `<new-niche-slug>` |
| `Cheggie` | `<New Niche Name>` |
| `@cheggie/` | `@<new-slug>/` |
| `cheggie-control-plane` | `<new-slug>-control-plane` |

```bash
# Example for "Vestify" (real estate niche)
find . -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.json' -o -name '*.md' -o -name '*.yml' \) \
  -exec sed -i 's/cheggie/vestify/g; s/Cheggie/Vestify/g' {} +
```

---

## Step 3: Update Brand Colors

Edit `docs/DESIGN_SYSTEM.md` and your Tailwind config:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      accent: '<new-brand-color>', // e.g. '#10b981' for emerald
    }
  }
}
```

---

## Step 4: Swap Domain-Specific Agent Types

In `packages/agents/src/`, add agents relevant to your niche and remove unused ones.

**Template agents to keep:**
- Social scheduler agent (universal)
- Blog writer agent (universal)
- Report generation (adapt metrics)

**Replace trading-specific agents:**
- `tradingAgent.ts` → your domain agent (e.g. `propertyAnalysisAgent.ts`)
- `youtubeTranscriptAgent.ts` → keep or swap for domain data ingestion

---

## Step 5: Update Database Schema

Migrations in `supabase/migrations/` are mostly universal. Domain-specific changes:

1. Rename or repurpose the `connectors` table for your integration type
2. Add niche-specific tables in a new `004_<niche>_tables.sql`
3. Add corresponding RLS policies in a `005_<niche>_rls.sql`

---

## Step 6: Update Composition Registry

Edit `apps/render/src/compositions.ts` to replace trading-specific video templates with your niche's templates.

---

## Step 7: Configure Environment

Copy `docs/ENV_TEMPLATE.md` to `.env.example` in the new repo and update:
- Remove `LITELLM_*` if not using LiteLLM
- Replace `POSTIZ_*` if using a different social scheduler
- Add niche-specific API keys

---

## Step 8: Update CI

`.github/workflows/ci.yml` is generic and works as-is. Add deployment steps if needed:

```yaml
  deploy:
    needs: [build, test]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Coolify
        run: curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}"
```

---

## Step 9: Verify Build

```bash
pnpm install
pnpm run build
pnpm run test
```

---

## Checklist

- [ ] Global find & replace done
- [ ] Brand colors updated
- [ ] Agent types swapped for niche
- [ ] DB migrations updated
- [ ] Composition registry updated
- [ ] `.env.example` updated
- [ ] `README.md` updated with niche description
- [ ] Build passes
- [ ] Tests pass
- [ ] First deployment to Coolify successful
