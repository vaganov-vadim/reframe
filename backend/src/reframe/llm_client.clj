(ns reframe.llm-client
  "LLM API client. Supports mock mode (auto-enabled when no API key or REFRAME_MOCK_LLM=true).
   Mock mode rotates through: error → timeout → fixture responses."
  (:require [clj-http.client :as http]
            [cheshire.core :as json]))

;; ─── Mock infrastructure ────────────────────────────────────────────────────

(defonce ^:private mock-call-count (atom 0))

(defn- load-mock-fixtures
  "Load mock LLM responses from fixtures file."
  []
  (json/parse-string (slurp "fixtures/mock-responses.json") true))

(defn- mock-call-llm
  "Simulate LLM call with rotating behavior for test coverage:
     call 1 → throws API error
     call 2 → throws timeout
     call 3+ → returns fixture response as JSON string"
  [_prompt]
  (let [n (swap! mock-call-count inc)]
    (case n
      1 (throw (ex-info "LLM API Error: upstream returned 500"
                 {:type :llm-error :causes :api}))
      2 (throw (ex-info "LLM Timeout: no response within timeout window"
                 {:type :llm-timeout :causes :timeout}))
      ;; Return first fixture output as JSON string
      (let [fixtures (load-mock-fixtures)
            fixture  (first fixtures)]
        (json/generate-string (:output fixture))))))

;; ─── Real LLM call ──────────────────────────────────────────────────────────

(defn- real-call-llm
  "Make an actual HTTP request to the LLM API using clj-http."
  [prompt]
  (let [api-url  (or (System/getenv "LLM_API_URL")  "https://api.deepseek.com/v1/chat/completions")
        api-key  (System/getenv "LLM_API_KEY")
        model    (or (System/getenv "LLM_MODEL")    "deepseek-chat")
        response (http/post api-url
                   {:headers     {"Authorization" (str "Bearer " api-key)
                                  "Content-Type"  "application/json"}
                    :body        (json/generate-string
                                   {:model    model
                                    :messages [{:role "system" :content prompt}
                                               {:role "user"   :content prompt}]})
                    :socket-timeout 10000
                    :conn-timeout    5000
                    :as              :json})]
    (get-in response [:body :choices 0 :message :content])))

;; ─── Public API ─────────────────────────────────────────────────────────────

(defn call-llm
  "Call the LLM with the given prompt.
   Returns the response as a JSON string.
   
   Mock mode is enabled when:
   - REFRAME_MOCK_LLM env var is 'true', OR
   - LLM_API_KEY env var is not set (no credentials)
   
   In mock mode, responses rotate through error → timeout → fixture."
  [prompt]
  (if (or (= "true" (System/getenv "REFRAME_MOCK_LLM"))
          (nil? (System/getenv "LLM_API_KEY")))
    (mock-call-llm prompt)
    (real-call-llm prompt)))
