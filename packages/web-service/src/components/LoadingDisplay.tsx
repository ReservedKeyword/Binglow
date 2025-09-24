"use client";

import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface LoadingDisplayProps {
  message: string;
}

export const LoadingDisplay = ({ message }: LoadingDisplayProps) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-2xl">
    <FontAwesomeIcon className="h-10 w-10 text-sky-400 mb-4" icon={faSpinner} spin />
    {message}
  </div>
);
