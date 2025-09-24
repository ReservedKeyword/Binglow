import Link from "next/link";

export const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center px-4">
      <h1 className="text-6xl font-bold text-sky-400">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-white">Page Not Found</h2>
      <p className="mt-2 text-gray-400">Sorry, we couldn't find the page you're looking for.</p>

      <div className="mt-6">
        <Link
          className="rounded-md bg-sky-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-600"
          href="/"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
