import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 font-bold text-4xl">Clippizo</h1>
      <p className="mb-8 max-w-lg text-fd-muted-foreground">
        AI Video Platform Documentation
      </p>
      <Link
        className="inline-flex items-center justify-center rounded-md bg-fd-primary px-6 py-3 font-medium text-fd-primary-foreground text-sm shadow transition-colors hover:bg-fd-primary/90"
        href="/docs"
      >
        Get Started
      </Link>
    </main>
  );
}
