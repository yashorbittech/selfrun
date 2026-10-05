import "server-only";

/**
 * Whether the simulated ("mock" / "offline") payment providers may settle a payment from a PUBLIC request. They mark
 * a payment as paid without any money moving, so outside development they are refused unless the operator explicitly
 * opts in (`ALLOW_MOCK_PAYMENTS=true`, e.g. for a staging demo). Signed-in finance staff can always record an
 * offline payment — that path is authenticated.
 */
export function simulatedPaymentsAllowed(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENTS === "true";
}

export const SIMULATED_PAYMENTS_MESSAGE = "Online payment isn't enabled for this link yet. Please contact the sender to pay another way.";
