import { GraphQLClient } from 'graphql-request'

if (!process.env.FIREFLIES_API_KEY) {
  throw new Error('FIREFLIES_API_KEY is not set in environment variables')
}

export const firefliesClient = new GraphQLClient(
  'https://api.fireflies.ai/graphql',
  {
    headers: {
      Authorization: `Bearer ${process.env.FIREFLIES_API_KEY}`,
      'Content-Type': 'application/json',
    },
  }
)
