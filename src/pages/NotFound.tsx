import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "404 — Page not found | NoonGil";
    if (import.meta.env.DEV) {
      console.error("404: User attempted to access non-existent route:", location.pathname);
    }
    return () => { document.title = "NoonGil — Assistive Vision App"; };
  }, [location.pathname]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Page not found</p>
        <Link
          to="/"
          className="text-primary underline hover:text-primary/80 text-lg font-medium"
        >
          Return to Home
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
