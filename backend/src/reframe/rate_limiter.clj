(ns reframe.rate-limiter
  "Token bucket rate limiter.
   Default: 3 requests per minute.
   Supports injection via :rate-limit-exceeded key in request map for testing.
   Atom state persists across requests within the same JVM lifetime.")

(defonce ^:private token-bucket
  (atom {:tokens 3 :last-refill (System/currentTimeMillis)}))

(def ^:private max-tokens 3)
(def ^:private refill-interval-ms 20000)  ;; 1 token per 20s = 3/minute

(defn allow-request?
  "Check if request should be allowed.
   If request map contains :rate-limit-exceeded true, denies immediately (test injection).
   Otherwise checks token bucket: refills tokens based on elapsed time,
   then consumes one token if available."
  [request]
  (if (true? (:rate-limit-exceeded request))
    false
    (let [{:keys [tokens last-refill]} @token-bucket
          now (System/currentTimeMillis)
          elapsed (- now last-refill)
          refilled (min max-tokens (+ tokens (quot elapsed refill-interval-ms)))]
      (if (pos? refilled)
        (do (swap! token-bucket assoc
                   :tokens (dec refilled)
                   :last-refill (if (> refilled tokens) now last-refill))
            true)
        false))))

(defn reset-limiter!
  "Reset token bucket to full capacity (3 tokens)."
  []
  (swap! token-bucket assoc :tokens max-tokens :last-refill (System/currentTimeMillis)))
