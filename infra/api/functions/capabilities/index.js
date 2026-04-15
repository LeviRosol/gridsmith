exports.handler = async () => {
  return {
    statusCode: 501,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      error: "not_implemented",
      message: "Capabilities endpoint scaffold deployed but purchase checks are not wired yet.",
      stage: process.env.STAGE || "unknown",
    }),
  };
};
