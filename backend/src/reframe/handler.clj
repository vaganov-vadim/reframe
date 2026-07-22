(ns reframe.handler
  "HTTP request handlers for the Reframe backend.
   Routes requests, validates input, checks rate limits, calls LLM, returns SSE stream."
  (:require [cheshire.core :as json]
            [clojure.string :as str]
            [reframe.prompt :as prompt]
            [reframe.rate-limiter :as rate-limiter]
            [reframe.llm-client :as llm-client]))

;; ─── Constants ──────────────────────────────────────────────────────────────

(def ^:private json-content-type "application/json")
(def ^:private sse-content-type  "text/event-stream")
(def ^:private max-text-length   3000)

;; ─── Helpers ────────────────────────────────────────────────────────────────

(defn- json-body
  "Ring response map with JSON body."
  [status data & extra-headers]
  {:status  status
   :headers (into {"Content-Type" json-content-type} (apply hash-map extra-headers))
   :body    (json/generate-string data)})

(defn- sse-body
  "Ring response map with SSE body."
  [data]
  {:status  200
   :headers {"Content-Type" sse-content-type
             "Cache-Control" "no-cache"
             "Connection"    "keep-alive"}
   :body    (str "data: " (json/generate-string data) "\n\n")})

(defn- json-content-type?
  "Returns true if the request has no explicit Content-Type or it's application/json."
  [request]
  (let [ct (or (:content-type request)
               (get-in request [:headers "content-type"]))]
    (or (nil? ct)
        (.contains (str/lower-case ct) "application/json"))))

;; ─── Route handlers ─────────────────────────────────────────────────────────

(defn home-handler
  "GET / — health check, returns 200 OK with status message."
  [_request]
  (json-body 200 {:status "ok" :service "reframe-backend"}))

(defn- reframe-handler
  "POST /api/reframe — validate, rate limit, call LLM, return SSE stream.
   Config is the full Aero config map, threaded to llm-client/call-llm."
  [config request]
  (let [body-params (json/parse-string (slurp (:body request)) true)
        text        (:text body-params)]
    (cond
      ;; ── Input validation ──────────────────────────────────────────────
      (nil? text)
      (json-body 400 {:error "Missing 'text' field in request body"})

      (str/blank? text)
      (json-body 400 {:error "Text must not be empty"})

      (> (count text) max-text-length)
      (json-body 400 {:error (str "Text exceeds " max-text-length " characters")})

      ;; ── Rate limiting ─────────────────────────────────────────────────
      (not (rate-limiter/allow-request? request))
      (json-body 429 {:error "Rate limit exceeded"} "Retry-After" "60")

      ;; ── LLM call ─────────────────────────────────────────────────────
      :else
      (try
        (let [llm-prompt (prompt/build-prompt text)
               llm-result (llm-client/call-llm config llm-prompt)
              parsed     (try (json/parse-string llm-result)
                              (catch Exception _ llm-result))]
          (sse-body (if (map? parsed) parsed {:result llm-result})))
        (catch Exception e
          (let [ex-type (-> e ex-data :type)]
            (if (= :llm-timeout ex-type)
              (json-body 504 {:error "LLM timeout"})
              (json-body 502 {:error "LLM API error"}))))))))

;; ─── Main dispatcher ────────────────────────────────────────────────────────

(defn app
  "Returns a Ring handler function with config baked in.
   Routes requests to appropriate handlers.
   Supports: GET /, POST /api/reframe (with validation, rate limiting, LLM).
   Returns 405 for wrong methods on /api/reframe, 404 for unknown routes."
  [config]
  (fn [request]
  (let [method (:request-method request)
        uri    (:uri request)]
    (cond
      ;; GET / — health check
      (and (= :get method) (= "/" uri))
      (home-handler request)

      ;; /api/reframe — POST only
      (= "/api/reframe" uri)
      (if (not= :post method)
        (json-body 405 {:error "Method Not Allowed"})
        (if (json-content-type? request)
          (reframe-handler config request)
          (json-body 415 {:error "Unsupported Media Type"})))

      ;; Everything else
      :else
      (json-body 404 {:error "Not Found"})))))
