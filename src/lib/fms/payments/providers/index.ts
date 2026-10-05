import "server-only";

/**
 * Registers every payment provider with the registry in `../provider.ts`.
 * Imported (for its side effects) by the modules that look providers up —
 * without it `getPaymentProvider()` finds nothing, not even the mock.
 */
import "./mock-bank";
import "./razorpay";
