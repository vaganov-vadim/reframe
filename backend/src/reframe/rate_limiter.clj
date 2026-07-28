(ns reframe.rate-limiter
  "Per-client rate limiting with token bucket algorithm.
   Each client IP gets its own bucket, default 3 requests per minute.
   Supports injection via :rate-limit-exceeded key in request map for testing."

  ;; ═════════════════════════════════════════════════════════════════════════
  ;; Per-Client Token Buckets
  ;; ═════════════════════════════════════════════════════════════════════════
  ;;  $clients is an atom  containing  a map  of {ip-address  → bucket-atom}.
  ;;  Each bucket-atom holds {:tokens N :last-refill <timestamp-ms>}.
  ;;  Default bucket starts with 3 tokens and refills 1 token every 60s.
  ;; ═════════════════════════════════════════════════════════════════════════
  )

;; ─── State ──────────────────────────────────────────────────────────────────

(def ^:private clients (atom {}))

(def ^:private max-tokens 3)
(def ^:private refill-rate-ms 60000)  ;; 1 token per 60s → 3 tokens per 3 min

;; ─── Helpers ────────────────────────────────────────────────────────────────

(defn- get-client-ip
  "Extract client IP from Ring request.
   Checks x-forwarded-for header first (proxies), then x-real-ip, then
   :remote-addr from the server.  Falls back to \"unknown\"."
  [request]
  (or (get-in request [:headers "x-forwarded-for"])
      (get-in request [:headers "x-real-ip"])
      (:remote-addr request)
      "unknown"))

(defn- refilled-tokens
  "Find or create the per-IP bucket, compute refilled token count.
   Does NOT modify any atom — pure computation.
   Returns {:keys [bucket ip now new-tokens]}."
  [request]
  (let [ip     (get-client-ip request)
        now    (System/currentTimeMillis)
        bucket (or (get @clients ip)
                   (let [new-bucket (atom {:tokens max-tokens
                                           :last-refill now})]
                     (swap! clients assoc ip new-bucket)
                     new-bucket))
        {:keys [tokens last-refill]} @bucket
        elapsed    (- now last-refill)
        new-tokens (min max-tokens (+ tokens (quot elapsed refill-rate-ms)))]
    {:bucket bucket :ip ip :now now :new-tokens new-tokens}))

;; ─── Public API ─────────────────────────────────────────────────────────────

(defn check-request?
  "Check if request should be allowed WITHOUT consuming a token.
   Only purposed for rate-limit gating — call consume-request! separately
   after a successful operation to actually deduct a token.
   Returns true if the client has at least 1 token available, false if rate-limited."
  [request]
  (if (true? (:rate-limit-exceeded request))
    false
    (pos? (:new-tokens (refilled-tokens request)))))

(defn consume-request!
  "Consume one token for the request's client IP.
   Call after a successful operation that already passed check-request?.
   Refills tokens, then decrements by 1. Returns the new token count."
  [request]
  (let [{:keys [bucket now new-tokens]} (refilled-tokens request)]
    (if (pos? new-tokens)
      (let [after-consume (dec new-tokens)]
        (reset! bucket {:tokens after-consume :last-refill now})
        after-consume)
      0)))

(defn allow-request?
  "Check AND consume a token — atomic check+consume for the caller's convenience.
   If request map contains :rate-limit-exceeded true, denies immediately
   (test injection).
   Returns true if allowed and token was consumed, false if rate-limited."
  [request]
  (if (true? (:rate-limit-exceeded request))
    false
    (let [{:keys [bucket now new-tokens]} (refilled-tokens request)]
      (if (pos? new-tokens)
        (do (reset! bucket {:tokens (dec new-tokens) :last-refill now})
            true)
        false))))

(defn reset-limiter!
  "Reset all client rate limiters.  Empties the clients map entirely."
  []
  (reset! clients {}))
