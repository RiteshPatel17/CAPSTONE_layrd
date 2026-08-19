// ─────────────────────────────────────────────
// LÄYRD – notify.js
// Fire-and-forget POST to notifications-service (or any other internal
// microservice) that ALSO surfaces failures — including HTTP-level
// failures like 401/404/500, which a plain `fetch(...).catch(...)`
// silently swallows: fetch() only rejects on network-level errors
// (DNS failure, connection refused, timeout), never on a non-2xx
// response. A 401 (e.g. from a stale INTERNAL_SERVICE_KEY in a
// long-running dev server that never picked up a rotated key) would
// resolve normally and the .catch() would just never fire.
//
// This is a real incident this fixes, not a hypothetical: on
// 2026-08-19 three real order-confirmation emails were silently lost
// this exact way — the webhook's fetch() succeeded (got a 401 back),
// nothing was ever logged, and the only way to find out was manually
// checking Resend's own send log after the fact.
//
// Never awaited by callers — this starts the request and returns
// immediately, matching the existing "a dead notifications-service
// must never be able to fail an order" design (see CLAUDE.md).
// ─────────────────────────────────────────────
export function notifyAsync(url, body, { label = "Notify" } = {}) {
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
    },
    body: JSON.stringify(body),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[${label}] Notification service returned ${res.status}:`, text);
      }
    })
    .catch((err) => {
      console.error(`[${label}] Notification request failed:`, err);
    });
}
