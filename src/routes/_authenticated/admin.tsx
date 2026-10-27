import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Studio — KRITI'S KIRTI" },
      { name: "description", content: "Manage the KRITI'S KIRTI website." },
      { property: "og:title", content: "Studio — KRITI'S KIRTI" },
      { property: "og:description", content: "Private owner area." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type TableName = "products" | "projects" | "services";
type FieldType = "text" | "textarea" | "number" | "bool" | "image" | "gallery";
type Field = { key: string; label: string; type: FieldType };

const CONFIG: Record<TableName, { label: string; titleKey: string; fields: Field[] }> = {
  products: {
    label: "Products",
    titleKey: "name",
    fields: [
      { key: "name", label: "Name", type: "text" },
      { key: "slug", label: "Web address (slug)", type: "text" },
      { key: "category", label: "Category", type: "text" },
      { key: "short_description", label: "Short description", type: "textarea" },
      { key: "description", label: "Full description", type: "textarea" },
      { key: "price", label: "Price (leave empty for 'on request')", type: "number" },
      { key: "currency", label: "Currency", type: "text" },
      { key: "image_url", label: "Photo", type: "image" },
      { key: "sort_order", label: "Order", type: "number" },
      { key: "featured", label: "Show on home page", type: "bool" },
      { key: "published", label: "Visible on site", type: "bool" },
    ],
  },
  projects: {
    label: "Projects",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "slug", label: "Web address (slug)", type: "text" },
      { key: "location", label: "Location", type: "text" },
      { key: "year", label: "Year", type: "text" },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "description", label: "Story (blank line between paragraphs)", type: "textarea" },
      { key: "cover_image_url", label: "Cover photo", type: "image" },
      { key: "gallery_urls", label: "Gallery photos", type: "gallery" },
      { key: "sort_order", label: "Order", type: "number" },
      { key: "published", label: "Visible on site", type: "bool" },
    ],
  },
  services: {
    label: "Services",
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", type: "text" },
      { key: "slug", label: "Web address (slug)", type: "text" },
      { key: "summary", label: "Summary", type: "textarea" },
      { key: "details", label: "Details", type: "textarea" },
      { key: "price_label", label: "Price label", type: "text" },
      { key: "sort_order", label: "Order", type: "number" },
      { key: "published", label: "Visible on site", type: "bool" },
    ],
  },
};

type Row = Record<string, unknown> & { id?: string };

function slugify(v: string) {
  return v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"enquiries" | TableName>("enquiries");

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: auth.user.id,
        _role: "admin",
      });
      if (error) throw error;
      return Boolean(data);
    },
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="eyebrow">Studio</p>
          <h1 className="mt-2 text-3xl text-foreground">Manage your website</h1>
        </div>
        <button
          onClick={signOut}
          className="rounded-sm border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground hover:bg-secondary"
        >
          Sign out
        </button>
      </div>

      {role.isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      ) : !role.data ? (
        <p className="mt-10 max-w-lg text-sm text-muted-foreground">
          This account doesn't have owner access. Only the site owner can manage content.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {(["enquiries", "products", "projects", "services"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-sm px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                  tab === t
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "enquiries" ? "Enquiries" : CONFIG[t].label}
              </button>
            ))}
          </div>
          <div className="mt-8">
            {tab === "enquiries" ? <Enquiries /> : <ContentManager key={tab} table={tab} />}
          </div>
        </>
      )}
    </div>
  );
}

function Enquiries() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function toggle(id: string, handled: boolean) {
    const { error } = await supabase.from("enquiries").update({ handled }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
  }

  if (q.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!q.data?.length)
    return <p className="text-sm text-muted-foreground">No enquiries yet. They'll appear here.</p>;

  return (
    <ul className="space-y-4">
      {q.data.map((e) => (
        <li
          key={e.id}
          className={cn("rounded-sm border border-border bg-card p-5", e.handled && "opacity-60")}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base text-foreground">{e.name}</p>
              <p className="text-sm text-muted-foreground">
                <a href={`mailto:${e.email}`} className="hover:text-foreground">
                  {e.email}
                </a>
                {e.phone ? ` · ${e.phone}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="eyebrow">{e.interest}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {e.message}
          </p>
          <label className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={e.handled} onCheckedChange={(v) => toggle(e.id, v)} />
            Replied / handled
          </label>
        </li>
      ))}
    </ul>
  );
}

function ContentManager({ table }: { table: TableName }) {
  const cfg = CONFIG[table];
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);

  const q = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Row[];
    },
  });

  async function remove(row: Row) {
    if (!confirm(`Delete "${String(row[cfg.titleKey])}"? This can't be undone.`)) return;
    const { error } = await supabase.from(table).delete().eq("id", row.id!);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin", table] });
  }

  if (editing) {
    return (
      <Editor
        table={table}
        initial={editing}
        onDone={() => {
          setEditing(null);
          qc.invalidateQueries({ queryKey: ["admin", table] });
        }}
      />
    );
  }

  return (
    <div>
      <button
        onClick={() => setEditing({ published: true, sort_order: (q.data?.length ?? 0) + 1 })}
        className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="size-4" /> Add new
      </button>
      {q.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {q.data?.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="text-base text-foreground">{String(row[cfg.titleKey])}</p>
                <p className="text-xs text-muted-foreground">
                  {row["published"] ? "Visible" : "Hidden"}
                  {row["featured"] ? " · On home page" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(row)}
                  className="rounded-sm border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:bg-secondary"
                >
                  Edit
                </button>
                <button
                  onClick={() => remove(row)}
                  aria-label="Delete"
                  className="rounded-sm border border-border p-1.5 text-destructive hover:bg-secondary"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useImagePreview(value: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!value) return setUrl(null);
    if (/^https?:\/\//.test(value) || value.startsWith("/")) return setUrl(value);
    supabase.storage
      .from("site-images")
      .createSignedUrl(value, 3600)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [value]);
  return url;
}

function Thumb({ value }: { value: string }) {
  const url = useImagePreview(value);
  return url ? (
    <img src={url} alt="" className="size-20 rounded-sm object-cover" />
  ) : (
    <div className="size-20 rounded-sm bg-secondary" />
  );
}

async function uploadImage(table: TableName, file: File) {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${table}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("site-images").upload(path, file, {
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

function Editor({
  table,
  initial,
  onDone,
}: {
  table: TableName;
  initial: Row;
  onDone: () => void;
}) {
  const cfg = CONFIG[table];
  const [row, setRow] = useState<Row>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key: string, value: unknown) => setRow((r) => ({ ...r, [key]: value }));

  async function onUpload(field: Field, files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const paths = await Promise.all(Array.from(files).map((f) => uploadImage(table, f)));
      if (field.type === "gallery") {
        set(field.key, [...((row[field.key] as string[]) ?? []), ...paths]);
      } else {
        set(field.key, paths[0]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    const payload: Row = { ...row };
    delete payload["created_at"];
    delete payload["updated_at"];
    const title = String(payload[cfg.titleKey] ?? "").trim();
    if (!title) {
      toast.error("Please add a title or name.");
      return;
    }
    payload["slug"] = slugify(String(payload["slug"] || title));
    setSaving(true);
    const query = row.id
      ? supabase
          .from(table)
          .update(payload as never)
          .eq("id", row.id)
      : supabase.from(table).insert(payload as never);
    const { error } = await query;
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved — it's live on the site.");
    onDone();
  }

  return (
    <form onSubmit={save} className="space-y-6 rounded-sm border border-border bg-card p-6 sm:p-8">
      <h2 className="text-xl text-foreground">
        {row.id
          ? `Edit ${String(initial[cfg.titleKey])}`
          : `New ${cfg.label.slice(0, -1).toLowerCase()}`}
      </h2>
      {cfg.fields.map((field) => {
        const value = row[field.key];
        const id = `f-${field.key}`;
        switch (field.type) {
          case "bool":
            return (
              <label key={field.key} className="flex items-center gap-3 text-sm text-foreground">
                <Switch checked={Boolean(value)} onCheckedChange={(v) => set(field.key, v)} />
                {field.label}
              </label>
            );
          case "textarea":
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Textarea
                  id={id}
                  rows={field.key === "description" ? 6 : 3}
                  value={String(value ?? "")}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              </div>
            );
          case "number":
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Input
                  id={id}
                  type="number"
                  value={value === null || value === undefined ? "" : String(value)}
                  onChange={(e) =>
                    set(
                      field.key,
                      e.target.value === ""
                        ? field.key === "price"
                          ? null
                          : 0
                        : Number(e.target.value),
                    )
                  }
                />
              </div>
            );
          case "image":
          case "gallery": {
            const list =
              field.type === "gallery"
                ? ((value as string[]) ?? [])
                : value
                  ? [value as string]
                  : [];
            return (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {list.map((v, i) => (
                    <div key={v + i} className="relative">
                      <Thumb value={v} />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() =>
                          set(
                            field.key,
                            field.type === "gallery" ? list.filter((_, j) => j !== i) : null,
                          )
                        }
                        className="absolute -right-2 -top-2 rounded-full border border-border bg-background p-1 text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-sm border border-dashed border-border text-[0.65rem] text-muted-foreground hover:bg-secondary">
                    <Upload className="size-4" />
                    {uploading ? "Uploading…" : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple={field.type === "gallery"}
                      className="hidden"
                      onChange={(e) => onUpload(field, e.target.files)}
                    />
                  </label>
                </div>
              </div>
            );
          }
          default:
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Input
                  id={id}
                  value={String(value ?? "")}
                  onChange={(e) => set(field.key, e.target.value)}
                />
              </div>
            );
        }
      })}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-sm bg-primary px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-sm border border-border px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
