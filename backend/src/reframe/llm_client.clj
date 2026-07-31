(ns reframe.llm-client
  "LLM API client. Supports mock mode (auto-enabled when no API key or REFRAME_MOCK_LLM=true).
   Mock mode rotates through: error → timeout → fixture responses.
   DeepSeek V4: explicit model + thinking.type on every real request."
  (:require [clj-http.client :as http]
            [clojure.string :as str]
            [clojure.core.async :refer [alts!! timeout]]
            [cheshire.core :as json]
            [taoensso.timbre :as timbre]))

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
     :fixture → returns fixture response as JSON string.
                Detects Vertical Arrow prompts and returns the deeper fixture."
  [prompt]
  (case @mock-mode
    :error
    (throw (ex-info "LLM API Error: upstream returned 500"
             {:type :llm-error :causes :api}))
    :timeout
    (throw (ex-info "LLM Timeout: no response within timeout window"
             {:type :llm-timeout :causes :timeout}))
    :fixture
    (let [fixtures (load-mock-fixtures)
          is-followup (and prompt (str/includes? prompt "STUDIO_FOLLOWUP"))
          is-deeper (and prompt (str/includes? prompt "Vertical Arrow"))
          is-stoic (and prompt (str/includes? prompt "стоический философ"))
          is-consensus (and prompt (str/includes? prompt "нейтральный синтезатор"))]
      (cond
        is-followup (json/generate-string
                     {:text "С учётом ответа: опирайся на то, что можно проверить, а не на догадки."})
        is-deeper (json/generate-string (:output (last fixtures)))
        is-stoic (json/generate-string
                  {:text "Молчание других вне твоего контроля. В контроле — факт опоздания и следующий шаг: короткое сообщение команде."})
        is-consensus (json/generate-string
                      {:text "Проблема в интерпретации, а не в самом факте. Стоит отделить домыслы от того, что можно проверить."})
        :else (json/generate-string (:output (first fixtures)))))
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

(defn- normalize-thinking
  "Coerce thinking flag to \"enabled\" or \"disabled\". Default disabled."
  [thinking]
  (let [s (cond
            (keyword? thinking) (name thinking)
            (string? thinking) thinking
            (nil? thinking) "disabled"
            :else (str thinking))]
    (if (#{"enabled" "disabled"} s) s "disabled")))

(defn- real-call-llm
  "Make an actual HTTP request to the LLM API using clj-http.
   Config is the `:llm` sub-map from Aero config (may include merged opts)."
  [llm-config prompt]
  (let [api-url        (:api-url llm-config)
        api-key        (:api-key llm-config)
        model          (:model llm-config)
        thinking       (normalize-thinking (:thinking llm-config))
        socket-timeout (or (:socket-timeout-ms llm-config) 30000)
        conn-timeout   (or (:conn-timeout-ms llm-config) 5000)
        start-ms       (System/currentTimeMillis)
        body           {:model    model
                        :thinking {:type thinking}
                        :messages [{:role "system" :content prompt}
                                   {:role "user"   :content prompt}]}
        response       (http/post api-url
                         {:headers     {"Authorization" (str "Bearer " api-key)
                                        "Content-Type"  "application/json"}
                          :body        (json/generate-string body)
                          :socket-timeout socket-timeout
                          :conn-timeout   conn-timeout
                          :as              :json})
        elapsed (- (System/currentTimeMillis) start-ms)]
    (timbre/debug "LLM call completed in" elapsed "ms" {:model model :thinking thinking})
    (get-in response [:body :choices 0 :message :content])))

(defn call-with-retry
  "Call LLM with retry on transient failures. Configurable via llm-config:
   :max-retries (default 5) and :retry-backoff-ms (default 2000).
   Uses core.async parking timeout between retries.
   llm-call-fn is a function of two args (llm-config prompt) that performs the actual LLM call."
  [llm-config llm-call-fn prompt]
  (let [max-retries  (or (:max-retries llm-config) 5)
        backoff-ms   (or (:retry-backoff-ms llm-config) 2000)]
    (loop [attempt 1]
      (let [result (try
                     {:value (llm-call-fn llm-config prompt)}
                     (catch Exception e
                       {:error e}))]
        (if-let [v (:value result)]
          (do (when (> attempt 1)
                (timbre/info "LLM retry succeeded on attempt" (str attempt "/" max-retries)))
              v)
          (if (< attempt max-retries)
            (let [wait-ms (* backoff-ms attempt)]
              (timbre/warn "LLM attempt" attempt "failed, retrying in" wait-ms "ms"
                          {:error (.getMessage ^Exception (:error result))})
              (alts!! [(timeout wait-ms)])
              (recur (inc attempt)))
            (do (timbre/error "LLM exhausted all" max-retries "retries"
                             {:error (.getMessage ^Exception (:error result))})
                (throw (:error result)))))))))

;; ─── Public API ─────────────────────────────────────────────────────────────

(defn call-llm
  "Call the LLM with the given prompt.
   Returns the response as a JSON string.

   Config is the full Aero config map. LLM settings are read from (:llm config):
     :api-url      — LLM API endpoint
     :api-key      — API authentication token
     :model        — model name (e.g. deepseek-v4-flash)
     :thinking     — enabled | disabled (default disabled)
     :mock-enabled — when \"true\" or when :api-key is nil, mock mode is used

   Optional opts map overrides :model and/or :thinking for this call (per-agent).

   In mock mode, responses rotate through error → timeout → fixture."
  ([config prompt]
   (call-llm config prompt nil))
  ([config prompt opts]
   (let [{:keys [api-key mock-enabled] :as llm-base} (:llm config)
         llm-config (merge llm-base
                           (select-keys (or opts {}) [:model :thinking]))]
     (if (or (= "true" mock-enabled)
             (nil? api-key))
       (do (timbre/debug "LLM call — using mock mode")
           (mock-call-llm prompt))
       (do (timbre/debug "LLM call — using real API"
                         {:model (:model llm-config)
                          :thinking (normalize-thinking (:thinking llm-config))})
           (call-with-retry llm-config real-call-llm prompt))))))
