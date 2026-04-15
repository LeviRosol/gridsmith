exports.handler = async () => {
  return {
    statusCode: 501,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      error: "not_implemented",
      message: "Checkout session endpoint scaffold deployed but not wired to Stripe yet.",
      stage: process.env.STAGE || "unknown",
    }),
  };
};
