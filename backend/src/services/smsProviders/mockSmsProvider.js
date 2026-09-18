export function createMockSmsProvider() {
  return {
    name: "mock",

    async send({ to }) {
      const suffix = Date.now().toString(36).toUpperCase();

      return {
        provider: "mock",
        providerMessageId: `SMS-${suffix}`,
        status: "simulated",
        recipient: to,
        simulated: true,
      };
    },
  };
}
