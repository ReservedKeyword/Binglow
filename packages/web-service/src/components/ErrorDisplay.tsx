"use client";

import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export interface ErrorDisplayProps {
  header: string;
  message: string;
}

export const ErrorDisplay = ({ header, message }: ErrorDisplayProps) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
    <div className="flex flex-col items-center justify-center text-center">
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <FontAwesomeIcon className="h-12 w-12 text-red-400" icon={faTriangleExclamation} size="2x" />
      </div>

      <h2 className="text-2xl font-bold text-red-400 mb-2">{header}</h2>
      <p className="text-gray-400 mb-6 max-w-md">{message}</p>

      <Link href="/" passHref>
        <div className="px-6 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors cursor-pointer">
          Back to Home
        </div>
      </Link>
    </div>
  </div>
);
