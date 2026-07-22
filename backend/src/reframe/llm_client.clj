(ns reframe.llm-client
  "LLM API client. Supports mock mode (auto-enabled when no API key or REFRAME_MOCK_LLM=true).
   Mock mode rotates through: error → timeout → fixture responses."
  (:require [clj-http.client :as http]
            [cheshire.core :as json]))

;; ─── Mock infrastructure ────────────────────────────────────────────────────

(defonce ^:private mock-call-count (atom 0))
(defonce ^:private mock-mode (atom :fixture))  ;; :rotate | :error | :timeout | :fixture

(defn- load-mock-fixtures
  "Load mock LLM responses from fixtures file."
  []
  (json/parse-string (slurp "fixtures/mock-responses.json") true))

(defn- mock-call-llm
  "Simulate LLM call based on current mock-mode.
     :rotate  → rotating behavior (call 1=error, call 2=timeout, call 3+=fixture)
     :error   → throws API error
     :timeout → throws timeout
     :fixture → returns fixture response as JSON string"
  [_prompt]
  (case @mock-mode
    :error
    (throw (ex-info "LLM API Error: upstream returned 500"
             {:type :llm-error :causes :api}))
    :timeout
    (throw (ex-info "LLM Timeout: no response within timeout window"
             {:type :llm-timeout :causes :timeout}))
    :fixture
    (let [fixtures (load-mock-fixtures)
          fixture  (first fixtures)]
      (json/generate-string (:output fixture)))
    :rotate
    (let [n (swap! mock-call-count inc)]
      (case n
        1 (throw (ex-info "LLM API Error: upstream returned 500"
                   {:type :llm-error :causes :api}))
        2 (throw (ex-info "LLM Timeout: no response within timeout window"
                   {:type :llm-timeout :causes :timeout}))
        (let [fixtures (load-mock-fixtures)
              fixture  (first fixtures)]
          (json/generate-string (:output fixture)))))))

;; ─── Mock control (for tests) ──────────────────────────────────────────────

(defn reset-mock!
  "Reset mock counter to 0 and mock mode to :rotate."
  []
  (reset! mock-call-count 0)
  (reset! mock-mode :rotate))

(defn set-mock-mode!
  "Set the mock behavior mode. Valid modes: :rotate, :error, :timeout, :fixture."
  [mode]
  (reset! mock-mode mode))

;; ─── Real LLM call ──────────────────────────────────────────────────────────

(defn- real-call-llm
  "Make an actual HTTP request to the LLM API using clj-http.
   Config is the `:llm` sub-map from Aero config."
  [llm-config prompt]
  (let [api-url  (:api-url llm-config)
        api-key  (:api-key llm-config)
        model    (:model llm-config)
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
   
   Config is the full Aero config map.  LLM settings are read from (:llm config):
     :api-url      — LLM API endpoint
     :api-key      — API authentication token
     :model        — model name (e.g. deepseek-chat)
     :mock-enabled — when \"true\" or when :api-key is nil, mock mode is used
   
   In mock mode, responses rotate through error → timeout → fixture."
  [config prompt]
  (let [{:keys [api-key mock-enabled] :as llm-config} (:llm config)]
    (if (or (= "true" mock-enabled)
            (nil? api-key))
      (mock-call-llm prompt)
      (real-call-llm llm-config prompt))))
