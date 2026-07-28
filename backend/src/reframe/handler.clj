(ns reframe.handler
  "HTTP request handlers for the Reframe backend.
   Routes requests, validates input, checks rate limits, calls LLM, returns SSE stream."
  (:require [cheshire.core :as json]
            [clojure.string :as str]
            [reframe.prompt :as prompt]
            [reframe.rate-limiter :as rate-limiter]
            [reframe.llm-client :as llm-client])
  (:import [java.lang.management ManagementFactory]))

;; ─── Constants ──────────────────────────────────────────────────────────────

(def ^:private json-content-type "application/json")
(def ^:private sse-content-type  "text/event-stream")
(def ^:private max-text-length   3000)

;; ─── Health tracking ────────────────────────────────────────────────────────

(def ^:private start-time
  "Server start time in milliseconds (epoch)."
  (.getStartTime (ManagementFactory/getRuntimeMXBean)))

;; Atom tracking reframe requests since server start.
(defonce ^:private request-counter (atom 0))

;; Atom tracking error responses (5xx + rate limits) since server start.
(defonce ^:private error-counter (atom 0))

(defn- format-uptime
  "Formats uptime as human-readable string (e.g., '24h', '5h 30m', '2m')."
  [ms]
  (let [total-minutes (quot ms 60000)
        days          (quot total-minutes 1440)
        hours         (rem (quot total-minutes 60) 24)
        minutes       (rem total-minutes 60)]
    (cond
      (pos? days)  (str days "d " hours "h")
      (pos? hours) (str hours "h " minutes "m")
      :else        (str minutes "m"))))

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

(defn health-handler
  "GET /api/health — returns server health status including LLM connectivity,
   uptime, requests, errors, and JVM memory."
  [config _request]
  (let [uptime-ms       (- (System/currentTimeMillis) start-time)
        llm-configured  (boolean (get-in config [:llm :api-key]))
        mock-enabled    (= "true" (get-in config [:llm :mock-enabled]))
        runtime         (Runtime/getRuntime)
        mem-used-mb     (str (quot (- (.totalMemory runtime) (.freeMemory runtime)) 1048576) "MB")]
    (json-body 200 {:status   "ok"
                    :llm      (if (or llm-configured mock-enabled) "connected" "no_key")
                    :uptime   (format-uptime uptime-ms)
                    :requests @request-counter
                    :errors   @error-counter
                    :memory   mem-used-mb})))

(defn- reframe-handler
  "POST /api/reframe — validate, rate limit, call LLM, return SSE stream.
   Supports :mode param in body-params — when \"deeper\", uses build-deeper-prompt
   with :surface (original thought) and :text (user response).
   Config is the full Aero config map, threaded to llm-client/call-llm."
  [config request]
  (let [body-params (json/parse-string (slurp (:body request)) true)
        text        (:text body-params)
        mode        (:mode body-params)
        surface     (:surface body-params)]
    (cond
      ;; ── Input validation ──────────────────────────────────────────────
      (nil? text)
      (json-body 400 {:error "Missing 'text' field in request body"})

      (str/blank? text)
      (json-body 400 {:error "Text must not be empty"})

      (> (count text) max-text-length)
      (json-body 400 {:error (str "Text exceeds " max-text-length " characters")})

      ;; ── Deeper mode requires surface ──────────────────────────────────
      (and (= "deeper" mode) (str/blank? surface))
      (json-body 400 {:error "Deeper mode requires 'surface' field"})

      ;; ── Rate limiting ─────────────────────────────────────────────────
      (not (rate-limiter/allow-request? request))
      (do (swap! error-counter inc)
          (json-body 429 {:error "Rate limit exceeded"} "Retry-After" "60"))

       ;; ── LLM call ─────────────────────────────────────────────────────
       :else
       (try
         (let [llm-prompt (if (= "deeper" mode)
                           (prompt/build-deeper-prompt surface text)
                           (prompt/build-prompt text))
                llm-result (llm-client/call-llm config llm-prompt)
               parsed     (try (json/parse-string llm-result)
                               (catch Exception _ llm-result))]
           (swap! request-counter inc)
           (sse-body (if (map? parsed) parsed {:result llm-result})))
         (catch Exception e
           (let [ex-type (-> e ex-data :type)]
             (swap! error-counter inc)
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

      ;; GET /api/health — monitoring health endpoint
      (and (= :get method) (= "/api/health" uri))
      (health-handler config request)

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
