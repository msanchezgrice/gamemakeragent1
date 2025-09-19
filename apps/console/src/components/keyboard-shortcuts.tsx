'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check for 'g' key sequences
      if (event.key === 'g') {
        const handleSecondKey = (secondEvent: KeyboardEvent) => {
          switch (secondEvent.key) {
            case 'r': {
              router.push('/runs/new');
              break;
            }
            case 't': {
              // Focus on tasks - could scroll to blocker drawer
              const blockerDrawer = document.querySelector('[data-blocker-drawer]');
              blockerDrawer?.scrollIntoView({ behavior: 'smooth' });
              break;
            }
            case 'h': {
              router.push('/');
              break;
            }
            case 'q': {
              router.push('/qa');
              break;
            }
            case 'd': {
              router.push('/deploy');
              break;
            }
          }
          document.removeEventListener('keydown', handleSecondKey);
        };

        document.addEventListener('keydown', handleSecondKey);
        
        // Remove listener after 2 seconds if no second key
        setTimeout(() => {
          document.removeEventListener('keydown', handleSecondKey);
        }, 2000);
      }

      // ESC to close modals/drawers
      if (event.key === 'Escape') {
        // Dispatch custom event that components can listen to
        window.dispatchEvent(new CustomEvent('closeModals'));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return null; // This component doesn't render anything
}
