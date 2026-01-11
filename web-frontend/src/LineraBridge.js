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
    // ---------------------------------------------------------
    // 🔴 DEMO MODE: Simulates Blockchain for the Live URL
    // ---------------------------------------------------------
    
    console.log(`[DEMO] Preparing to send ${points} points...`);

    // 1. Fake a small network delay (500ms) to make it feel real
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 2. Log success (Simulating what the blockchain would do)
    console.log(`✅ [SUCCESS] Blockchain received ${points} points!`);
  },
};