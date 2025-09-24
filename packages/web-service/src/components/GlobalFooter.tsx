"use client";

interface GlobalFooterProps {
  backgroundColor: string;
}

export const GlobalFooter = ({ backgroundColor }: GlobalFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${backgroundColor} border-t border-gray-700 mt-auto`}>
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
        <p>&copy; {currentYear} ReservedKeyword. All Rights Reserved.</p>

        {/* <p className="mt-1">
          This project is open source. Contribute on
          <a
            className="font-medium text-sky-400 hover:text-sky-300 transition-colors ml-1"
            href="https://github.com/"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          .
        </p> */}
      </div>
    </footer>
  );
};
