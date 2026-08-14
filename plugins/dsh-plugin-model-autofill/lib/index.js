/**
 * dsh-plugin-model-autofill — host composition plugin.
 *
 * Auto-completes model entries in the `llm-pi-ai` settings namespace
 * (`$DSH_HOME/settings.yaml`, written by the web Models page): whenever a
 * model is added with only an `id`, the missing display name (`name`),
 * context window (`contextWindow`), and max output tokens (`maxTokens`) are
 * filled from the pi-ai built-in model catalog.
 *
 * Trigger: fires exactly once per model-configuration change that actually
 * leaves a model entry missing any of the three fields. Unrelated edits
 * (displayName, apiKeyEnv, baseURL, deletions) and the plugin's own
 * write-back echo do not re-trigger, because the check runs against the new
 * resolved value before doing anything.
 *
 * Matching: a model id may carry a `provider/` prefix (`openai/gpt-5.6-luna`)
 * or an OpenRouter-style `:suffix` (`xiaomi/mimo-v2.5-pro:free`); both are
 * stripped when looking the id up in the catalog. User-provided values are
 * never overwritten — only missing fields are filled.
 */

export const name = "model-autofill";
export const inject = ["settings", "llm", "timer"];

const NS = "llm-pi-ai";

/**
 * pi-ai catalog provider routes this build ships. The live
 * configurable-provider directory is preferred at runtime; this list is a
 * fallback for routes the directory withholds (OAuth-only routes etc.).
 */
const CATALOG_ROUTES = [
  "deepseek", "openai", "anthropic", "zai", "moonshotai", "qwen-token-plan",
  "xiaomi", "minimax", "mistral", "groq", "together", "openrouter",
  "google", "xai", "nvidia", "cerebras", "fireworks", "zai-coding-cn",
  "moonshotai-cn", "qwen-token-plan-cn", "xiaomi-token-plan-cn",
  "xiaomi-token-plan-ams", "xiaomi-token-plan-sgp", "kimi-coding",
  "minimax-cn", "github-copilot", "vercel-ai-gateway", "cloudflare-ai-gateway",
  "cloudflare-workers-ai", "huggingface", "amazon-bedrock",
  "azure-openai-responses", "ant-ling", "opencode", "opencode-go",
  "google-vertex", "openai-codex"
];

export function apply(ctx) {
  let busy = false;
  let queued = false;
  let catalog = null;

  /**
   * Trigger predicate: only a config that actually contains a model entry
   * missing name / contextWindow / maxTokens needs a completion pass.
   */
  function needsCompletion(value) {
    const providers = value && value.providers;
    if (!providers) return false;
    for (const route of Object.keys(providers)) {
      const profile = providers[route];
      if (!profile || !Array.isArray(profile.models)) continue;
      for (const entry of profile.models) {
        if (!entry || typeof entry !== "object") continue;
        const needsName = typeof entry.name !== "string" || entry.name.length === 0;
        const needsContext = entry.contextWindow == null;
        const needsMax = entry.maxTokens == null;
        if (needsName || needsContext || needsMax) return true;
      }
    }
    return false;
  }

  /** Build modelId -> { name, contextWindow, maxTokens } from the pi-ai catalog. */
  async function loadCatalog() {
    if (catalog) return catalog;
    const map = new Map();
    const routes = new Set();
    try {
      const directory = ctx.llm.listConfigurableProviders();
      for (const entry of directory) {
        if (entry && entry.settingsNs === NS && entry.declared === false &&
            typeof entry.provider === "string" && entry.provider.length > 0) {
          routes.add(entry.provider);
        }
      }
    } catch (error) {
      ctx.logger.warn("[model-autofill] configurable-provider directory read failed: %s", String(error?.message ?? error));
    }
    for (const route of CATALOG_ROUTES) routes.add(route);
    for (const route of routes) {
      try {
        const models = await ctx.llm.discoverModels(NS, { provider: route });
        for (const model of models) {
          if (map.has(model.id)) continue;
          map.set(model.id, {
            name: typeof model.name === "string" && model.name.length > 0 ? model.name : undefined,
            contextWindow: model.contextWindow,
            maxTokens: model.maxTokens
          });
        }
      } catch {
        // pi-ai ships no catalog for this route; nothing to borrow from
      }
    }
    catalog = map;
    return catalog;
  }

  /**
   * Candidate variants of a model id: exact, stripped of a `:suffix`, stripped
   * of a `provider/` prefix, and both. First catalog hit wins.
   */
  function lookup(id, map) {
    if (typeof id !== "string" || id.length === 0) return undefined;
    const candidates = new Set();
    candidates.add(id);
    const colon = id.lastIndexOf(":");
    if (colon > 0) candidates.add(id.slice(0, colon));
    const slash = id.indexOf("/");
    if (slash > 0) candidates.add(id.slice(slash + 1));
    const bare = slash > 0 ? id.slice(slash + 1) : id;
    const bareColon = bare.lastIndexOf(":");
    if (bareColon > 0) candidates.add(bare.slice(0, bareColon));
    for (const candidate of candidates) {
      const hit = map.get(candidate);
      if (hit) return hit;
    }
    return undefined;
  }

  /** One completion pass: fill every missing field it can, write once. */
  async function complete() {
    if (busy) {
      queued = true;
      return;
    }
    busy = true;
    try {
      const value = ctx.settings.get(NS);
      if (!needsCompletion(value)) return;
      const map = await loadCatalog();
      const ops = [];
      let filledCount = 0;
      for (const [route, profile] of Object.entries(value.providers)) {
        if (!profile || !Array.isArray(profile.models)) continue;
        let changed = false;
        const models = profile.models.map((entry) => {
          if (!entry || typeof entry !== "object") return entry;
          const next = { ...entry };
          // drop schema-materialized empty input/compat so stored entries stay minimal
          if (Array.isArray(next.input) && next.input.length === 0) delete next.input;
          if (next.compat && typeof next.compat === "object" && Object.keys(next.compat).length === 0) delete next.compat;
          const needsName = typeof next.name !== "string" || next.name.length === 0;
          const needsContext = next.contextWindow == null;
          const needsMax = next.maxTokens == null;
          if (!needsName && !needsContext && !needsMax) return next;
          const hit = lookup(entry.id, map);
          if (!hit) return next;
          if (needsName && hit.name) next.name = hit.name;
          if (needsContext && hit.contextWindow != null) next.contextWindow = hit.contextWindow;
          if (needsMax && hit.maxTokens != null) next.maxTokens = hit.maxTokens;
          if (next.name !== entry.name || next.contextWindow !== entry.contextWindow || next.maxTokens !== entry.maxTokens) {
            changed = true;
            filledCount += 1;
          }
          return next;
        });
        if (changed) ops.push({ op: "set", path: ["providers", route, "models"], value: models });
      }
      if (ops.length === 0) return;
      await ctx.settings.mutate(NS, ops);
      ctx.logger.info("[model-autofill] filled %s model(s) across %s provider route(s) from the pi-ai catalog", filledCount, ops.length);
    } catch (error) {
      ctx.logger.warn("[model-autofill] completion failed: %s", String(error?.stack ?? error?.message ?? error));
    } finally {
      busy = false;
      if (queued) {
        queued = false;
        complete();
      }
    }
  }

  // Trigger: model config changed AND the new resolved value has missing fields.
  // Our own write-back echo already has everything filled, so it does not retrigger.
  ctx.on("settings/updated", (ns, next) => {
    if (ns === NS && needsCompletion(next)) complete();
  });

  // Idempotent completion at startup; the llm-pi-ai namespace may register
  // after this row applies, so poll briefly for readiness.
  let attempts = 0;
  const boot = () => {
    if (ctx.settings.get(NS) !== undefined) {
      complete();
      return;
    }
    if (attempts < 30) {
      attempts += 1;
      ctx.timeout(boot, 300);
    }
  };
  boot();
}
