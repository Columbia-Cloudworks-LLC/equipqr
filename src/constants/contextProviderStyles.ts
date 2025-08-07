// Context provider component constants
export const PROVIDER_STYLES = {
  loading: "flex items-center justify-center min-h-screen",
  error: "flex items-center justify-center min-h-screen text-destructive",
  container: "min-h-screen bg-background"
} as const;

export const PROVIDER_MESSAGES = {
  loading: "Initializing...",
  error: "Failed to load context",
  noProvider: "Provider not found"
} as const;