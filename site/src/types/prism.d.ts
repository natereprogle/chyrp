interface PrismStatic {
  manual: boolean
  highlightAll(): void
  highlightAllUnder(element: Element): void
  highlightElement(element: Element): void
}

declare global {
  interface Window {
    Prism?: PrismStatic
  }
}

export {}
