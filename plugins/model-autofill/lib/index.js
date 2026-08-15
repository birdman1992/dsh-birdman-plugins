/**
 * model-autofill — host composition plugin.
 *
 * Auto-completes model entries in the `llm-pi-ai` settings namespace
 * (`$DSH_HOME/settings.yaml`, written by the web Models page): whenever a
 * model is added with only an `id`, the missing display name (`name`),
 * context window (`contextWindow`), and max output tokens (`maxTokens`) are
 * filled from the pi-ai built-in model catalog.
 *
 * v0.2 additionally autofills `reasoningEfforts` from a declarative rules
 * policy. Reasoning capability is NOT discoverable the way catalog fields
 * are — `ctx.llm.discoverModels()` returns only id/name/contextWindow/
 * maxTokens. The plugin therefore matches each model id against an ordered
 * rule table whose per-family effort sets mirror the pi-ai installed provider
 * catalog (see the table block below for the exact `thinkingLevelMap`
 * evidence); a matched rule supplies the `reasoningEfforts` declaration.
 * Models no rule matches are left untouched, preserving pi-ai's "no metadata
 * = provider default only" posture — the model switcher simply offers no
 * effort row for them, exactly as if the user had written nothing.
 *
 * Trigger: fires exactly once per model-configuration change that actually
 * leaves a model entry missing any fillable field. Unrelated edits
 * (displayName, apiKeyEnv, baseURL, deletions) and the plugin's own
 * write-back echo do not re-trigger, because the check runs against the new
 * resolved value before doing anything.
 *
 * Matching: a model id may carry a `provider/` prefix (`openai/gpt-5.6-luna`)
 * or an OpenRouter-style `:suffix` (`xiaomi/mimo-v2.5-pro:free`); both are
 * stripped when looking the id up in the catalog. Rules match against the raw
 * id (substring), so a `:free` variant is matched by its family rule — the
 * free tier is the same model, not a non-reasoning one.
 *
 * Optional plugin config (the composition row's `config`), replacing the
 * built-in rules entirely:
 *
 *   reasoning:
 *     rules:                # ordered; first match wins
 *       - match: ["claude-", "claude/"]
 *         efforts: { off: null, minimal: low, low: low, medium: medium, high: high, xhigh: xhigh, max: max }
 *       - match: ["deepseek-", "deepseek/"]
 *         efforts: { off: null, high: high, max: max }
 *
 * User-provided reasoningEfforts are never overwritten; only absent ones are
 * filled. Once written they live in the user settings layer, so they remain
 * editable/removable in settings.yaml like any other field.
 */

export const name = "model-autofill";
export const inject = ["settings", "llm", "timer"];

const NS = "llm-pi-ai";

/**
 * Per-family reasoning-effort tables. Keys are pi-ai's canonical levels
 * (off/minimal/low/medium/high/xhigh/max), values are the wire spellings sent
 * to the gateway; a valueless `off` = send nothing (`thinking: {type:
 * "disabled"}` in the anthropic dialect). These tables mirror the pi-ai
 * installed provider catalog (dist/providers/data/*.json) — the authoritative
 * per-model `thinkingLevelMap` for this build — which pins every undeclared
 * level to unsupported, so a table IS the full offer.
 *
 * Catalog evidence (local, checked today):
 * - deepseek.json  deepseek-v4-flash/-pro: {minimal:null, low:null,
 *   medium:null, high:"high", max:"max"}            → off/high/max
 * - anthropic.json claude-fable-5: {off:null, xhigh:"xhigh", max:"max"};
 *   base levels default-supported; anthropic wire collapses minimal→"low"
 *   (mapThinkingLevelToEffort)                      → off/minimal/low/medium/high/xhigh/max
 * - openai-codex.json gpt-5.6-*: {xhigh:"xhigh", max:"max", minimal:"low"}
 *                                                    → off/minimal/low/medium/high/xhigh/max
 * - zai.json      glm-5.2: {minimal:null, low:"high", medium:"high",
 *   high:"high", max:"max"}  (GLM-5.2 native effort is high/max only;
 *   low/medium are offered but collapse to wire "high") → off/low/medium/high/max
 * - moonshotai.json kimi-k2.7-code: {off:null} (base default)
 *                                                    → off/minimal/low/medium/high
 * - moonshotai.json kimi-k3: {off:null, minimal:null, low:"low",
 *   medium:null, high:"high", xhigh:null, max:"max"} → off/low/high/max
 * - opencode-go.json qwen3.7-max: reasoning with no map (base default)
 *                                                    → off/minimal/low/medium/high
 * - xiaomi.json   mimo-v2.5-pro: reasoning:true, no map, deepseek-style
 *   thinkingFormat; the OpenRouter `:free` variant is the SAME model on a
 *   free tier — it does not disable reasoning, so `false` was wrong
 *                                                    → off/minimal/low/medium/high
 *
 * Cross-checks (public docs, 2026): Claude adaptive thinking
 * https://github.com/anthropics/skills/blob/HEAD/skills/claude-api/SKILL.md ;
 * OpenAI reasoning https://developers.openai.com/api/docs/guides/reasoning ;
 * GLM-5.2 effort = High & Max https://github.com/earendil-works/pi/issues/5770 ;
 * Kimi K3 effort = Max/High/Low
 * https://kimi-ai.chat/docs/kimi-k3-reasoning-effort/ ;
 * DeepSeek = off/high/max
 * https://promptgenius.net/prompts/deepseek/thinking-mode/reasoning-effort-control
 *
 * The knnns gateway speaks the anthropic dialect, so the declared wire values
 * are anthropic-side effort names the gateway must translate into each
 * model's native vocabulary; whether a specific level survives that
 * translation is gateway-dependent — per-model correction = override the
 * rule or delete the entry's reasoningEfforts in settings.yaml.
 */
/** Anthropic-native adaptive thinking: full 7-level set (xhigh on newest Claude only). */
const CLAUDE_EFFORTS = {
  off: null, minimal: "low", low: "low", medium: "medium",
  high: "high", xhigh: "xhigh", max: "max"
};
/** GPT-5.6-family (per pi-ai openai-codex catalog): xhigh + max, minimal→"low". */
const OPENAI_EFFORTS = {
  off: null, minimal: "low", low: "low", medium: "medium",
  high: "high", xhigh: "xhigh", max: "max"
};
/** DeepSeek V4: official API exposes only off / high / max. */
const DEEPSEEK_EFFORTS = { off: null, high: "high", max: "max" };
/** GLM-5.2: native effort is high/max only; low/medium offered, collapse to wire "high". */
const GLM_EFFORTS = { off: null, low: "high", medium: "high", high: "high", max: "max" };
/** Kimi K3: Max/High/Low only (minimal/medium/xhigh unsupported per catalog). */
const KIMI_K3_EFFORTS = { off: null, low: "low", high: "high", max: "max" };
/** Kimi K2.x / Qwen3.x / MiMo-V2.5: pi-ai base default (minimal folds to wire "low"). */
const BASE_THINKING_EFFORTS = {
  off: null, minimal: "low", low: "low", medium: "medium", high: "high"
};

/**
 * Built-in ordered rules. First match wins. `efforts: false` marks a model as
 * explicitly non-reasoning; a dict declares the offered levels (keys are
 * pi-ai levels, values the wire spellings).
 */
const DEFAULT_RULES = [
  { match: ["kimi-k3"], efforts: KIMI_K3_EFFORTS }, // must precede the kimi- general rule
  { match: ["claude-", "claude/"], efforts: CLAUDE_EFFORTS },
  { match: ["gpt-5", "gpt/", "o1", "o3", "o4"], efforts: OPENAI_EFFORTS },
  { match: ["deepseek-", "deepseek/"], efforts: DEEPSEEK_EFFORTS },
  { match: ["glm-"], efforts: GLM_EFFORTS },
  { match: ["kimi-", "kimi/", "moonshot"], efforts: BASE_THINKING_EFFORTS },
  { match: ["qwen"], efforts: BASE_THINKING_EFFORTS },
  { match: ["mimo-"], efforts: BASE_THINKING_EFFORTS }
];

/** Exported for tests/tooling; `apply()` reads the same table. */
export const defaultRules = DEFAULT_RULES;

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

export function apply(ctx, config) {
  let busy = false;
  let queued = false;
  let catalog = null;
  const rules = config?.reasoning?.rules ?? DEFAULT_RULES;

  /** The first rule matching an id, or undefined when the policy has no opinion. */
  function ruleFor(id) {
    if (typeof id !== "string" || id.length === 0) return undefined;
    for (const rule of rules) {
      if (!rule || !Array.isArray(rule.match)) continue;
      if (rule.match.some((pattern) => id.includes(pattern))) return rule.efforts;
    }
    return undefined;
  }

  /**
   * Trigger predicate: only a config that actually contains a model entry
   * missing name / contextWindow / maxTokens — or missing reasoningEfforts
   * for an id the rules policy has an opinion on — needs a completion pass.
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
        if (entry.reasoningEfforts === undefined && ruleFor(entry.id) !== undefined) return true;
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
      let catalogFilled = 0;
      let reasoningFilled = 0;
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
          const decision = next.reasoningEfforts === undefined ? ruleFor(entry.id) : undefined;
          const needsReasoning = decision !== undefined;
          if (!needsName && !needsContext && !needsMax && !needsReasoning) return next;
          if (needsName || needsContext || needsMax) {
            const hit = lookup(entry.id, map);
            if (!hit && !needsReasoning) return next;
            if (hit) {
              if (needsName && hit.name) next.name = hit.name;
              if (needsContext && hit.contextWindow != null) next.contextWindow = hit.contextWindow;
              if (needsMax && hit.maxTokens != null) next.maxTokens = hit.maxTokens;
            }
          }
          if (needsReasoning) {
            next.reasoningEfforts = decision;
            reasoningFilled += 1;
          }
          if (next.name !== entry.name || next.contextWindow !== entry.contextWindow ||
              next.maxTokens !== entry.maxTokens || next.reasoningEfforts !== entry.reasoningEfforts) {
            changed = true;
            catalogFilled += needsReasoning ? 0 : 1;
          }
          return next;
        });
        if (changed) ops.push({ op: "set", path: ["providers", route, "models"], value: models });
      }
      if (ops.length === 0) return;
      await ctx.settings.mutate(NS, ops);
      const parts = [];
      if (catalogFilled > 0) parts.push(`${catalogFilled} catalog field(s)`);
      if (reasoningFilled > 0) parts.push(`reasoningEfforts on ${reasoningFilled} model(s)`);
      ctx.logger.info("[model-autofill] filled %s across %s provider route(s)", parts.join(" + ") || "nothing", ops.length);
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
