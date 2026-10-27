import { createFileRoute } from "@tanstack/react-router";
import { listServices } from "@/lib/content.functions";
import {
  ButtonLink,
  PageHero,
  RouteError,
  RouteNotFound,
  Section,
  SectionHeading,
} from "@/components/site/Bits";

export const Route = createFileRoute("/services")({
  loader: () => listServices(),
  head: () => ({
    meta: [
      { title: "Services & Pricing — KRITI'S KIRTI" },
      {
        name: "description",
        content:
          "Interior design consultation, full interior styling, custom handcrafted jute commissions, our ready-to-buy product range, and hands-on craft workshops in Nepal.",
      },
      { property: "og:title", content: "Services & Pricing — KRITI'S KIRTI" },
      {
        property: "og:description",
        content:
          "From a focused design consultation to made-to-measure jute commissions and artisan workshops — what we offer and what it includes.",
      },
    ],
  }),
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: Services,
});

function Services() {
  const services = Route.useLoaderData();

  return (
    <>
      <PageHero
        eyebrow="Services & pricing"
        title="Design help, handcrafted commissions and a standing collection"
        description="Pick the level of involvement that suits you. Prices marked on request depend on size, materials and site, and we always confirm a written quotation before any work begins."
      />

      <Section>
        <ul className="divide-y divide-border border-y border-border">
          {services.map((service, index) => (
            <li
              key={service.id}
              className="grid gap-6 py-10 md:grid-cols-[auto_1fr_auto] md:gap-10"
            >
              <span className="font-display text-2xl text-accent md:pt-1">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 className="text-2xl leading-snug text-foreground">{service.title}</h2>
                <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted-foreground">
                  {service.summary}
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {service.details}
                </p>
              </div>
              <div className="md:text-right">
                <p className="eyebrow">Investment</p>
                <p className="mt-2 font-display text-lg text-foreground">{service.price_label}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="pt-0">
        <div className="rounded-sm border border-border bg-secondary/50 px-6 py-14 sm:px-14">
          <SectionHeading
            eyebrow="How it works"
            title="A simple, three-step way of working"
            description="No long proposals or hidden extras — just a clear path from first message to finished piece."
          />
          <ol className="mt-12 grid gap-10 sm:grid-cols-3">
            {[
              {
                step: "Talk",
                body: "Send an enquiry with your space, dimensions or the piece you want. We reply with questions and an idea of scope.",
              },
              {
                step: "Plan",
                body: "You receive a direction, material samples where relevant, a timeline and a written quotation to approve.",
              },
              {
                step: "Make",
                body: "We handcraft or install, keeping you updated, and hand over with care instructions for the materials used.",
              },
            ].map((item, i) => (
              <li key={item.step}>
                <p className="eyebrow">Step {i + 1}</p>
                <h3 className="mt-2 text-xl text-foreground">{item.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <ButtonLink to="/contact">Start an enquiry</ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
