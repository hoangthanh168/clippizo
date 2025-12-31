import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Clippizo</h1>
      <p className="text-fd-muted-foreground mb-8 max-w-lg">
        AI Video Platform Documentation
      </p>
      <Link
        href="/docs"
        className="inline-flex items-center justify-center rounded-md bg-fd-primary px-6 py-3 text-sm font-medium text-fd-primary-foreground shadow transition-colors hover:bg-fd-primary/90"
      >
        Get Started
      </Link>
    </main>
  );
}
