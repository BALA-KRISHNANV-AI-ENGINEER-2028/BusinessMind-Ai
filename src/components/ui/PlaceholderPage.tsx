interface PlaceholderPageProps {
  title: string;
  description: string;
}

/**
 * Temporary placeholder used by routes whose real UI hasn't been built yet.
 * Each feature page will replace its usage of this component in a later
 * sub-phase — this only exists to make the routing skeleton navigable now.
 */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      <p className="max-w-sm text-sm text-text-secondary">{description}</p>
    </div>
  );
}
