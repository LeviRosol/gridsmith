exports.handler = async () => {
  // Placeholder response until Stripe product + price mapping is wired.
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      items: [],
      source: "placeholder",
      stage: process.env.STAGE || "unknown",
      message: "Catalog endpoint deployed. Stripe wiring is next.",
    }),
  };
};
