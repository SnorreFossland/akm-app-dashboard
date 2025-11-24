"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface FloatingActionBase {
  /** Label displayed next to the icon */
  label: string;
  /** Icon element rendered to the left of the label */
  icon: React.ReactNode;
  /** Optional class overrides for button background/text styling */
  className?: string;
  /** Assistive text describing the intent of the action */
  ariaLabel?: string;
}

type FloatingLinkAction = FloatingActionBase & {
  href: string;
  onClick?: never;
};

type FloatingButtonAction = FloatingActionBase & {
  href?: never;
  onClick: () => void;
};

export type FloatingAction = FloatingLinkAction | FloatingButtonAction;

export interface FloatingActionButtonsProps {
  actions: FloatingAction[];
  /** Allows consumers to tweak spacing or positioning */
  className?: string;
}

const baseButtonClasses =
  "inline-flex items-center justify-center gap-3 rounded-full px-4 py-2 shadow-lg ring-1 transition-all duration-200 hover:scale-105";

export function FloatingActionButtons({ actions, className }: FloatingActionButtonsProps) {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3", className)}>
      {actions.map((action, idx) => {
        const buttonClasses = cn(
          baseButtonClasses,
          "bg-gray-800/90 text-gray-100 ring-gray-900/50 hover:bg-gray-700",
          action.className
        );

        const content = (
          <>
            {action.icon}
            <span className="text-sm font-semibold">{action.label}</span>
          </>
        );

        if ("href" in action && action.href) {
          return (
            <Link
              key={`floating-action-link-${idx}`}
              href={action.href}
              className={buttonClasses}
              aria-label={action.ariaLabel ?? action.label}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={`floating-action-button-${idx}`}
            type="button"
            onClick={action.onClick}
            className={buttonClasses}
            aria-label={action.ariaLabel ?? action.label}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export default FloatingActionButtons;

