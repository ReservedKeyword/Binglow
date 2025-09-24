"use client";

import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface TooltipProps {
  text: string;
}

export const Tooltip = ({ text }: TooltipProps) => (
  <div className="tooltip-container ml-2">
    <FontAwesomeIcon icon={faQuestionCircle} className="w-4 h-4 text-gray-400" />
    <span className="tooltip-text">{text}</span>
  </div>
);
