'use client';

import { forwardRef } from 'react';
import Link from 'next/link';

interface IconButtonBaseProps {
  'aria-label': string;
  title?: string;
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'accent';
}

interface IconButtonAsButton extends IconButtonBaseProps {
  as?: 'button';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

interface IconButtonAsLink extends IconButtonBaseProps {
  as: 'link';
  href: string;
  external?: boolean;
}

type IconButtonProps = IconButtonAsButton | IconButtonAsLink;

/**
 * Accessible icon button with minimum touch target size (44x44px).
 * Use for icon-only buttons where the icon conveys the action.
 * Always provide an aria-label for screen readers.
 */
export const IconButton = forwardRef<HTMLButtonElement | HTMLAnchorElement, IconButtonProps>(
  function IconButton(props, ref) {
    const {
      'aria-label': ariaLabel,
      title,
      className = '',
      children,
      variant = 'default',
    } = props;

    const baseClasses = 'icon-button';
    const variantClasses = variant === 'accent'
      ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
      : '';
    const combinedClasses = `${baseClasses} ${variantClasses} ${className}`.trim();

    if (props.as === 'link') {
      const { href, external } = props;

      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={combinedClasses}
            aria-label={ariaLabel}
            title={title}
          >
            {children}
          </a>
        );
      }

      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={combinedClasses}
          aria-label={ariaLabel}
          title={title}
        >
          {children}
        </Link>
      );
    }

    const { onClick, type = 'button', disabled } = props as IconButtonAsButton;

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={combinedClasses}
        aria-label={ariaLabel}
        title={title}
      >
        {children}
      </button>
    );
  }
);
