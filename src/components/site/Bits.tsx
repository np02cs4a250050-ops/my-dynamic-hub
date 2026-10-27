import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Section({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl leading-tight text-foreground sm:text-4xl">{title}</h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function ButtonLink({
  to,
  children,
  variant = "solid",
}: {
  to: string;
  children: ReactNode;
  variant?: "solid" | "outline";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
        variant === "solid"
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "border border-foreground/25 text-foreground hover:bg-secondary",
      )}
    >
      {children}
    </Link>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="surface-warm border-b border-border">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="reveal mt-4 max-w-3xl text-4xl leading-[1.08] text-foreground sm:text-5xl md:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      </div>
    </div>
  );
}

export function RouteError({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "";
  return (
    <div className="mx-auto max-w-2xl px-5 py-28 text-center">
      <h1 className="text-2xl text-foreground">This page didn't load</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {message || "Something went wrong while loading this page. Please try again."}
      </p>
      <div className="mt-8">
        <ButtonLink to="/">Back home</ButtonLink>
      </div>
    </div>
  );
}

export function RouteNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-28 text-center">
      <h1 className="text-2xl text-foreground">Not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        We couldn't find what you were looking for.
      </p>
      <div className="mt-8">
        <ButtonLink to="/">Back home</ButtonLink>
      </div>
    </div>
  );
}
