export interface ReviewSuggestion {
  title: string
  detail: string
  why: string
}

export interface JourneyReview {
  id: string
  trackerId: string
  kind: 'weekly' | 'manual'
  periodStart: string
  periodEnd: string
  headline: string
  summary: string
  wins: string[]
  concerns: string[]
  suggestions: ReviewSuggestion[]
  model: string
  createdAt: string
}

export interface JourneyReviewList {
  /** The server has an Anthropic API key. */
  configured: boolean
  reviews: JourneyReview[]
}

export interface ConsentInfo {
  clientName: string
  redirectHost: string
  scopes: { scope: string; description: string }[]
}

export interface ConnectedApp {
  id: string
  clientName: string
  scope: string
  connectedAt: string
  lastUsedAt: string | null
}
