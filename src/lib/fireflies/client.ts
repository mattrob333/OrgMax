import { GraphQLClient } from 'graphql-request'

/**
 * Create a Fireflies GraphQL client with the provided API key
 * @param apiKey - Fireflies API key for the user
 * @returns GraphQL client configured for Fireflies API
 */
export function createFirefliesClient(apiKey: string): GraphQLClient {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Fireflies API key is required')
  }

  return new GraphQLClient('https://api.fireflies.ai/graphql', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
}
