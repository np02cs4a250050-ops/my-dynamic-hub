import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Leaf, Recycle, Users } from "lucide-react";
import heroInterior from "@/assets/hero-interior.jpg";
import aboutStudio from "@/assets/about-studio.jpg";
import { listFeaturedProducts, listServices } from "@/lib/content.functions";
import { ProductCard } from "@/components/site/ProductCard";
import {
  ButtonLink,
  RouteError,
  RouteNotFound,
  Section,
  SectionHeading,
} from "@/components/site/Bits";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/")({
  loader: async () => ({
    products: await listFeaturedProducts(),
    services: await listServices(),
  }),
  head: () => ({
    meta: [
      { title: "KRITI'S KIRTI — Handcrafted Jute Décor & Sustainable Interiors in Nepal" },
      {
        name: "description",
        content:
          "Handcrafted jute mats, coasters, bags, jewellery and mirror frames, plus interior design rooted in local craftsmanship and sustainable living. Made in Nepal.",
      },
      {
        property: "og:title",
        content: "KRITI'S KIRTI — Handcrafted Jute Décor & Sustainable Interiors",
      },
      {
        property: "og:description",
        content:
          "Interior Designing to Sustainable Creativity. Handcrafted jute décor and interiors by Kriti Shrestha Upadhyaya, made in Nepal.",
      },
    ],
  }),
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: Home,
});

function Home() {
  const { products, services } = Route.useLoaderData();

  return (
    <>
      {/* Hero */}
      <section className="surface-warm border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24">
          <div className="reveal">
            <p className="eyebrow">
              {SITE.origin} &middot; Est. by {SITE.founder}
            </p>
            <h1 className="mt-5 text-4xl leading-[1.04] text-foreground sm:text-5xl lg:text-[3.9rem]">
              Interior Designing to{" "}
              <em className="not-italic text-accent">Sustainable Creativity</em>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {SITE.name} is a signature handcrafted initiative combining interior design with a
              passion for local craftsmanship and sustainable living — transforming jute and other
              eco-friendly materials into pieces made to be lived with.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink to="/contact">Book a consultation</ButtonLink>
              <ButtonLink to="/work" variant="outline">
                See our work
              </ButtonLink>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                { k: "Jute first", v: "Local, natural material" },
                { k: "Handmade", v: "Small-batch studio work" },
                { k: "Reuse", v: "Recreation over waste" },
              ].map((item) => (
                <div key={item.k}>
                  <dt className="font-display text-base text-foreground">{item.k}</dt>
                  <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <img
              src={heroInterior}
              alt="A sunlit living room with a hand-braided jute rug and a braided jute mirror frame"
              width={1600}
              height={1104}
              className="w-full rounded-sm object-cover shadow-lift"
            />
            <div className="absolute -bottom-6 left-6 hidden max-w-[15rem] rounded-sm border border-border bg-background/95 p-5 shadow-soft sm:block">
              <p className="eyebrow">Our philosophy</p>
              <p className="mt-2 font-display text-base leading-snug text-foreground">
                {SITE.philosophy}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <Section>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow="The collection"
            title="Handcrafted pieces for everyday life"
            description="Jute mats, coasters, bags, earrings, jewellery, mirror frames and other décor — each made by hand, so no two are quite alike."
          />
          <Link
            to="/work"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent transition-colors hover:text-foreground"
          >
            View all work <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Section>

      {/* Philosophy band */}
      <section className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-primary-foreground/70">
            {SITE.principle}
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl leading-tight sm:text-4xl">
            More than a product line — a journey of turning ideas into meaningful creations.
          </h2>
          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {[
              {
                icon: Recycle,
                title: "Meaningful reuse",
                body: "Offcuts, reclaimed timber and leftover fabric are designed back into useful, beautiful objects instead of being thrown away.",
              },
              {
                icon: Leaf,
                title: "Local materials",
                body: "Jute and other locally available, eco-friendly materials keep our making low-impact and unmistakably Nepali.",
              },
              {
                icon: Users,
                title: "Shared opportunity",
                body: "Every commission creates work for local artisans, women entrepreneurs and home-based makers.",
              },
            ].map((item) => (
              <div key={item.title}>
                <item.icon className="size-6 text-primary-foreground/80" />
                <h3 className="mt-4 text-lg text-primary-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services teaser */}
      <Section>
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <img
            src={aboutStudio}
            alt="Hands coiling jute rope into a mat on a studio workbench"
            loading="lazy"
            width={1408}
            height={1008}
            className="w-full rounded-sm object-cover shadow-soft"
          />
          <div>
            <SectionHeading
              eyebrow="What we do"
              title="Design, craft and consultation under one roof"
              description="From a single commissioned mirror frame to styling a whole café interior, we work at the scale that suits your space and budget."
            />
            <ul className="mt-10 divide-y divide-border border-y border-border">
              {services.slice(0, 4).map((service) => (
                <li key={service.id} className="flex items-baseline justify-between gap-6 py-4">
                  <div>
                    <p className="text-base text-foreground">{service.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {service.summary}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {service.price_label}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-9">
              <ButtonLink to="/services" variant="outline">
                All services &amp; pricing
              </ButtonLink>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="pb-0">
        <div className="rounded-sm border border-border bg-secondary/50 px-6 py-16 text-center sm:px-16">
          <p className="eyebrow">Let's begin</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl leading-tight text-foreground sm:text-4xl">
            Tell us about your space, or the piece you have in mind.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
            Share a few details and we'll come back with ideas, a timeline and a quotation.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink to="/contact">Send an enquiry</ButtonLink>
            <ButtonLink to="/about" variant="outline">
              Meet the founder
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
