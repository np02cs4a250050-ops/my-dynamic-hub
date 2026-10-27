import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(180),
  phone: z.string().trim().max(40).optional().default(""),
  interest: z.string().trim().max(120).optional().default("General"),
  message: z.string().trim().min(5).max(2000),
  website: z.string().max(200).optional().default(""),
  turnstileToken: z.string().max(4096).optional().default(""),
});

type EnquiryInput = z.infer<typeof enquirySchema>;

function htmlEscape(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char] ?? char,
  );
}

async function hashIp(ip: string): Promise<string> {
  const salt = process.env["ENQUIRY_RATE_LIMIT_SALT"] ?? "kritis-kirti-enquiries";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as { success?: boolean };
    return payload.success === true;
  } catch {
    return false;
  }
}

async function sendEnquiryNotification(enquiry: EnquiryInput): Promise<void> {
  const apiKey = process.env["RESEND_API_KEY"];
  const to = process.env["ENQUIRY_NOTIFICATION_TO"];
  const from = process.env["ENQUIRY_NOTIFICATION_FROM"];
  if (!apiKey || !to || !from) return;

  const rows = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone || "Not provided"],
    ["Interested in", enquiry.interest],
    ["Message", enquiry.message],
  ]
    .map(
      ([label, value]) =>
        `<tr><th align="left" style="padding:6px 12px 6px 0;vertical-align:top">${htmlEscape(label!)}</th><td style="padding:6px 0;white-space:pre-wrap">${htmlEscape(value!)}</td></tr>`,
    )
    .join("");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: to
          .split(",")
          .map((address) => address.trim())
          .filter(Boolean),
        reply_to: enquiry.email,
        subject: `New website enquiry from ${enquiry.name}`,
        html: `<h1 style="font-size:18px">New website enquiry</h1><table>${rows}</table>`,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`[enquiry] notification failed with status ${response.status}`);
    }
  } catch (error) {
    console.error(
      "[enquiry] notification request failed",
      error instanceof Error ? error.message : "unknown error",
    );
  }
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      // Opaque sb_ keys aren't JWTs: send only the apikey header.
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/**
 * Images stored in the private "site-images" bucket are saved as bucket paths.
 * Turn those into time-limited viewable links; leave absolute URLs untouched.
 */
async function resolveImage(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage
    .from("site-images")
    .createSignedUrl(value, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

async function resolveMany(values: string[]): Promise<string[]> {
  const resolved = await Promise.all(values.map((v) => resolveImage(v)));
  return resolved.filter((v): v is string => Boolean(v));
}

async function withProductImages(rows: Product[]): Promise<Product[]> {
  return Promise.all(
    rows.map(async (row) => ({ ...row, image_url: await resolveImage(row.image_url) })),
  );
}

async function withProjectImages(rows: Project[]): Promise<Project[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      cover_image_url: await resolveImage(row.cover_image_url),
      gallery_urls: await resolveMany(row.gallery_urls ?? []),
    })),
  );
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return withProductImages(data ?? []);
});

export const listFeaturedProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .eq("published", true)
    .eq("featured", true)
    .order("sort_order", { ascending: true })
    .limit(6);
  if (error) throw new Error(error.message);
  return withProductImages(data ?? []);
});

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return withProjectImages(data ?? []);
});

export const listServices = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("services")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getProjectBySlug = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: row, error } = await client
      .from("projects")
      .select("*")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    const project = (await withProjectImages([row]))[0]!;
    const { data: related } = await client
      .from("projects")
      .select("*")
      .eq("published", true)
      .neq("slug", data.slug)
      .order("sort_order", { ascending: true })
      .limit(3);
    return { project, related: await withProjectImages(related ?? []) };
  });

function isMissingEnquiryRpc(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Could not find the function") ||
    message.includes("PGRST202") ||
    message.includes("does not exist") ||
    message.includes("Missing Supabase environment variable")
  );
}

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => enquirySchema.parse(data))
  .handler(async ({ data }) => {
    // Honeypot: real visitors never fill this hidden field.
    if (data.website.trim()) return { ok: true as const };

    const { getRequest } = await import("@tanstack/react-start/server");
    const headers = getRequest().headers;
    const ip =
      headers.get("cf-connecting-ip") ??
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "";

    if (!(await verifyTurnstile(data.turnstileToken, ip))) {
      throw new Error("captcha_failed");
    }

    let created = false;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.rpc("create_enquiry", {
        _name: data.name,
        _email: data.email,
        _phone: data.phone,
        _interest: data.interest,
        _message: data.message,
        _ip_hash: ip ? await hashIp(ip) : null,
      });

      if (!error) created = true;
      else if (!isMissingEnquiryRpc(error)) {
        if (error.message.toLowerCase().includes("rate_limited")) {
          throw new Error("rate_limited");
        }
        throw new Error(error.message);
      }
    } catch (error) {
      if (!isMissingEnquiryRpc(error)) {
        if (error instanceof Error && error.message.toLowerCase().includes("rate_limited")) {
          throw new Error("rate_limited");
        }
        throw error;
      }
    }

    // Transitional fallback for databases that have not applied the Phase 0 migration.
    if (!created) {
      console.warn("[enquiry] create_enquiry unavailable; using transitional insert");
      const { error } = await publicClient().from("enquiries").insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        interest: data.interest,
        message: data.message,
      });
      if (error) throw new Error(error.message);
    }

    await sendEnquiryNotification(data);
    return { ok: true as const };
  });
