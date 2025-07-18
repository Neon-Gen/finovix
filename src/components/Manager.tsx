interface ScrollbarManagerOptions {
  hideDelay?: number;
  showOnInteraction?: boolean;
  scrollbarClass?: string;
  scrollbarWidth?: string;
  scrollbarTrackColor?: string;
  scrollbarThumbColor?: string;
  scrollbarRadius?: string;
  edgeThreshold?: number;
}

class ScrollbarManager {
  private options: Required<ScrollbarManagerOptions>;
  private scrollTimeout: number | null;
  private isScrolling: boolean;
  private readonly boundHandlers: {
    scroll: (e: Event) => void;
    mouseMove: (e: MouseEvent) => void;
    keyDown: (e: KeyboardEvent) => void;
    touchStart: (e: TouchEvent) => void;
  };

  constructor(options: ScrollbarManagerOptions = {}) {
    this.options = {
      hideDelay: 1500, // Increased delay for better UX
      showOnInteraction: true,
      scrollbarClass: 'custom-scrollbar',
      scrollbarWidth: '6px',
      scrollbarTrackColor: 'transparent',
      scrollbarThumbColor: 'rgba(0, 0, 0, 1)', // More transparent by default
      scrollbarRadius: '4px',
      edgeThreshold: 20,
      ...options
    };
    
    this.scrollTimeout = null;
    this.isScrolling = false;
    
    this.boundHandlers = {
      scroll: this.handleScroll.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      keyDown: this.handleKeyDown.bind(this),
      touchStart: this.handleTouchStart.bind(this)
    };

    this.init();
  }

  private init(): void {
    const style = document.createElement('style');
    style.textContent = `
      .${this.options.scrollbarClass} {
        scrollbar-width: thin;
        scrollbar-color: ${this.options.scrollbarThumbColor} ${this.options.scrollbarTrackColor};
      }
      .${this.options.scrollbarClass}::-webkit-scrollbar {
        width: ${this.options.scrollbarWidth};
      }
      .${this.options.scrollbarClass}::-webkit-scrollbar-track {
        background: ${this.options.scrollbarTrackColor};
        border-radius: ${this.options.scrollbarRadius};
        transition: background-color 0.3s ease;
      }
      .${this.options.scrollbarClass}::-webkit-scrollbar-thumb {
        background: ${this.options.scrollbarThumbColor};
        border-radius: ${this.options.scrollbarRadius};
        opacity: var(--scrollbar-thumb-opacity, 0);
        transition: all 0.3s ease;
      }
      .${this.options.scrollbarClass}::-webkit-scrollbar-thumb:hover {
        background: rgba(0, 0, 0, 0.9);
        cursor: pointer;
      }
      .${this.options.scrollbarClass}.scrolling::-webkit-scrollbar-thumb {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
    
    document.documentElement.classList.add(this.options.scrollbarClass);
    this.hideScrollbars(); // Initially hide scrollbars
    
    window.addEventListener('scroll', this.boundHandlers.scroll, { passive: true });
    document.addEventListener('mousemove', this.boundHandlers.mouseMove, { passive: true });
    document.addEventListener('keydown', this.boundHandlers.keyDown, { passive: true });
    document.addEventListener('touchstart', this.boundHandlers.touchStart, { passive: true });
  }

  private showScrollbars = (): void => {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    document.documentElement.style.setProperty('--scrollbar-thumb-opacity', '1');
    document.documentElement.classList.add('scrolling');
  };

  private hideScrollbars = (): void => {
    this.scrollTimeout = window.setTimeout(() => {
      document.documentElement.style.setProperty('--scrollbar-thumb-opacity', '0');
      document.documentElement.classList.remove('scrolling');
    }, this.options.hideDelay);
  };

  private handleScroll = (): void => {
    if (!this.options.showOnInteraction) return;
    
    if (!this.isScrolling) {
      this.isScrolling = true;
      requestAnimationFrame(() => {
        this.showScrollbars();
        this.hideScrollbars();
        this.isScrolling = false;
      });
    }
  };

  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.options.showOnInteraction) return;
    
    const isNearEdge = 
      e.clientX > window.innerWidth - this.options.edgeThreshold ||
      e.clientY > window.innerHeight - this.options.edgeThreshold;
    
    if (isNearEdge) {
      requestAnimationFrame(() => {
        this.showScrollbars();
        this.hideScrollbars();
      });
    }
  };

  private readonly scrollKeys = new Set([
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'PageUp', 'PageDown', 'Home', 'End', 'Space'
  ]);

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.options.showOnInteraction) return;
    
    if (this.scrollKeys.has(e.code)) {
      requestAnimationFrame(() => {
        this.showScrollbars();
        this.hideScrollbars();
      });
    }
  };

  private handleTouchStart = (): void => {
    if (!this.options.showOnInteraction) return;
    
    requestAnimationFrame(() => {
      this.showScrollbars();
      this.hideScrollbars();
    });
  };

  public destroy(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    window.removeEventListener('scroll', this.boundHandlers.scroll);
    document.removeEventListener('mousemove', this.boundHandlers.mouseMove);
    document.removeEventListener('keydown', this.boundHandlers.keyDown);
    document.removeEventListener('touchstart', this.boundHandlers.touchStart);
    
    document.documentElement.classList.remove(this.options.scrollbarClass);
    document.documentElement.style.removeProperty('--scrollbar-thumb-opacity');
  }
}



export default ScrollbarManager;