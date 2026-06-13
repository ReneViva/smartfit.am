type PageIntroProps = {
  description: string;
  eyebrow?: string;
  title: string;
};

export function PageIntro({ description, eyebrow, title }: PageIntroProps) {
  return (
    <header className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 text-base leading-7 text-secondary sm:text-lg">
        {description}
      </p>
    </header>
  );
}
