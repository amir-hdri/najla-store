import { useRef } from 'react';

/** Controlled dialogs opened from ordinary buttons still need a return target. */
export function useDialogFocus(
  onOpen?: (event: Event) => void,
  onClose?: (event: Event) => void,
) {
  const opener = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus(event: Event) {
      opener.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      onOpen?.(event);
    },
    onCloseAutoFocus(event: Event) {
      onClose?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      // A cart-to-checkout transition should keep focus inside the new dialog.
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      const target = opener.current?.isConnected
        ? opener.current
        : document.querySelector<HTMLElement>('header a[href="#top"]');
      target?.focus({ preventScroll: true });
    },
  };
}
