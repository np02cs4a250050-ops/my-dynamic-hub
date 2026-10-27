import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getProjectBySlug } from "@/lib/content.functions";
import { ButtonLink, RouteError, RouteNotFound, Section } from "@/components/site/Bits";
import { imageFor } from "@/lib/site";

export const Route = createFileRoute("/work/$slug")({
  loader: async ({ params }) => {
    const result = await getProjectBySlug({ data: { slug: params.slug } });
    if (!result) throw notFound();
    return result;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Project not found — KRITI'S KIRTI" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { project } = loaderData;
    const title = `${project.title} — KRITI'S KIRTI`;
    const meta = [
      { title },
      { name: "description", content: project.summary },
      { property: "og:title", content: title },
      { property: "og:description", content: project.summary },
    ];
    const cover = project.cover_image_url;
    if (cover && /^https:\/\//.test(cover)) {
      meta.push(
        { property: "og:image", content: cover },
        { name: "twitter:image", content: cover },
      );
    }
    return { meta };
  },
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: ProjectDetail,
});

function ProjectDetail() {
  const { project, related } = Route.useLoaderData();
  const cover = imageFor(project.slug, project.cover_image_url);

  return (
    <>
      <div className="surface-warm border-b border-border">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-10 sm:px-8">
          <Link
            to="/work"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> All work
          </Link>
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <h1 className="reveal text-4xl leading-[1.08] text-foreground sm:text-5xl">
              {project.title}
            </h1>
            <dl className="grid grid-cols-2 gap-6 border-t border-border pt-6">
              <div>
                <dt className="eyebrow">Location</dt>
                <dd className="mt-2 text-sm text-foreground">{project.location || "Nepal"}</dd>
              </div>
              <div>
                <dt className="eyebrow">Year</dt>
                <dd className="mt-2 text-sm text-foreground">{project.year || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {cover ? (
        <div className="mx-auto max-w-7xl px-5 pt-12 sm:px-8">
          <img
            src={cover}
            alt={project.title}
            className="aspect-[16/9] w-full rounded-sm object-cover shadow-soft"
          />
        </div>
      ) : null}

      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <p className="font-display text-2xl leading-snug text-foreground">{project.summary}</p>
          <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
            {project.description.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <div className="pt-4">
              <ButtonLink to="/contact">Plan a similar space</ButtonLink>
            </div>
          </div>
        </div>

        {project.gallery_urls.length > 0 ? (
          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {project.gallery_urls.map((url, i) => (
              <img
                key={url}
                src={url}
                alt={`${project.title} — photo ${i + 1}`}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-sm object-cover"
              />
            ))}
          </div>
        ) : null}
      </Section>

      {related.length > 0 ? (
        <section className="border-t border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
            <p className="eyebrow">More projects</p>
            <div className="mt-8 grid gap-10 md:grid-cols-3">
              {related.map((item) => {
                const img = imageFor(item.slug, item.cover_image_url);
                return (
                  <Link
                    key={item.id}
                    to="/work/$slug"
                    params={{ slug: item.slug }}
                    className="group block"
                  >
                    <div className="overflow-hidden rounded-sm bg-secondary">
                      {img ? (
                        <img
                          src={img}
                          alt={item.title}
                          loading="lazy"
                          className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="aspect-[4/3] w-full" />
                      )}
                    </div>
                    <h3 className="mt-4 text-lg text-foreground transition-colors group-hover:text-accent">
                      {item.title}
                    </h3>
                    <p className="eyebrow mt-1">{item.location}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
