import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';

// ⚠️ PLACEHOLDERS (Your app will eventually get these from the network)
const NODE_URL = "http://localhost:8080"; 
const CHAIN_ID = "e476187f6dd..."; 
const APP_ID = "e476187f6dd..."; 

// 1. Create the HTTP Link explicitly
const httpLink = createHttpLink({
  uri: `${NODE_URL}/chains/${CHAIN_ID}/applications/${APP_ID}`,
});

// 2. Initialize Client with the Link
const client = new ApolloClient({
  link: httpLink, // <--- This fixes the "must specify a link" error
  cache: new InMemoryCache(),
});

const INCREMENT_SCORE = gql`
  mutation Increment($amount: Int!) {
    executeOperation(operation: { Increment: { amount: $amount } })
  }
`;

const GET_SCORE = gql`
  query GetScore {
    value
  }
`;

export const lineraService = {
  submitScore: async (points) => {
    try {
      await client.mutate({
        mutation: INCREMENT_SCORE,
        variables: { amount: points },
      });
      console.log(`✅ Sent ${points} points to Blockchain`);
    } catch (error) {
      console.warn("⚠️ Blockchain offline (Simulation Mode):", error.message);
    }
  },

  fetchScore: async () => {
    try {
      const result = await client.query({ query: GET_SCORE });
      return result.data.value;
    } catch (error) {
      console.warn("⚠️ Blockchain offline (Simulation Mode):", error.message);
      return 0;
    }
  }
};