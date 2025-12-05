// Clerk JWT issuer domain - tells Convex how to verify Clerk tokens
// Set CLERK_JWT_ISSUER_DOMAIN in Convex dashboard environment variables
// Dev: https://usable-meerkat-14.clerk.accounts.dev
// Prod: Check your production Clerk publishable key for the domain
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
