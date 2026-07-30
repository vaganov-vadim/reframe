(ns reframe.handler-test
  "Comprehensive test suite for HTTP handler (Phase 2).
   RED phase: tests define expected API contract before handler implementation."
  (:require [cheshire.core :as json]
            [clojure.core.async :as async]
            [clojure.string :as str]
            [clojure.test :refer :all]
            [reframe.handler :as handler]
            [reframe.rate-limiter :as rate-limiter]
            [reframe.llm-client :as llm-client])
  (:import [java.io ByteArrayInputStream]))

(defn- drain-sse-body
  "Drain string or core.async channel SSE body into a single string."
  [body]
  (cond
    (string? body) body
    (satisfies? clojure.core.async.impl.protocols/ReadPort body)
    (loop [acc ""]
      (if-let [chunk (async/<!! body)]
        (recur (str acc chunk))
        acc))
    :else (str body)))

;; ─── Fixtures ───────────────────────────────────────────────────────────────

(def ^:private test-config
  "Test configuration with mock LLM enabled."
  {:llm {:api-key nil
         :api-url "http://mock.example.com"
         :model   "mock-model"
         :mock-enabled "true"}})

(defn- json-body
  "Returns an InputStream with JSON-encoded body-params."
  [body-params]
  (ByteArrayInputStream. (.getBytes (json/generate-string body-params))))

(use-fixtures :each
  (fn [f]
    (rate-limiter/reset-limiter!)
    (llm-client/reset-mock!)
    (f)))

;; ─── GET / ──────────────────────────────────────────────────────────────────

(deftest get-home-ok
  (testing "GET / returns 200 OK with JSON content type"
    (let [response ((handler/app test-config) {:request-method :get :uri "/"})]
      (is (= 200 (:status response)))
      (is (= "application/json" (get-in response [:headers "Content-Type"]))))))

;; ─── POST /api/reframe — success path ───────────────────────────────────────

(deftest post-reframe-ok
  (testing "POST /api/reframe with valid text returns 200 and SSE stream"
    (llm-client/set-mock-mode! :fixture)
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {:text "Я опоздал на встречу"})})]
      (is (= 200 (:status response)))
      (is (= "text/event-stream" (get-in response [:headers "Content-Type"]))))))

;; ─── POST /api/reframe — input validation ──────────────────────────────────

(deftest post-reframe-empty-text
  (testing "POST /api/reframe with empty text returns 400 Bad Request"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {:text ""})})]
      (is (= 400 (:status response))))))

(deftest post-reframe-missing-text
  (testing "POST /api/reframe with missing text key returns 400 Bad Request"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {})})]
      (is (= 400 (:status response))))))

(deftest post-reframe-text-too-long
  (testing "POST /api/reframe with text > 3000 chars returns 400 Bad Request"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {:text (apply str (repeat 3001 "x"))})})]
      (is (= 400 (:status response))))))

;; ─── POST /api/reframe — rate limiting ─────────────────────────────────────

(deftest post-reframe-rate-limited
  (testing "POST /api/reframe when rate limited returns 429 with Retry-After header"
    ;; Exhaust rate limiter (3 tokens) so handler returns 429
    (dotimes [_ 3] (rate-limiter/allow-request? {}))
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {:text "test"})})]
      (is (= 429 (:status response)))
      (is (contains? (set (keys (:headers response))) "Retry-After")))))

(deftest post-reframe-failed-llm-does-not-consume-token
  (testing "Failed LLM call does NOT consume rate limit token"
    ;; Consume 2 tokens via handler (successful calls)
    (llm-client/set-mock-mode! :fixture)
    (dotimes [_ 2]
      ((handler/app test-config) {:request-method :post
                                   :uri "/api/reframe"
                                   :body (json-body {:text "test"})}))
    ;; 1 token remaining. Now trigger an error — should NOT consume.
    (llm-client/set-mock-mode! :error)
    (let [error-response ((handler/app test-config) {:request-method :post
                                                       :uri "/api/reframe"
                                                       :body (json-body {:text "test"})})]
      (is (= 502 (:status error-response))))
    ;; Token should still be available for a successful call.
    (llm-client/set-mock-mode! :fixture)
    (let [success-response ((handler/app test-config) {:request-method :post
                                                         :uri "/api/reframe"
                                                         :body (json-body {:text "test"})})]
      (is (= 200 (:status success-response))))))

(deftest post-reframe-successful-llm-consumes-token
  (testing "Successful LLM call does consume a rate limit token"
    (llm-client/set-mock-mode! :fixture)
    ;; Use all 3 tokens
    (dotimes [_ 3]
      (let [resp ((handler/app test-config) {:request-method :post
                                               :uri "/api/reframe"
                                               :body (json-body {:text "test"})})]
        (is (= 200 (:status resp)))))
    ;; 4th call should be rate-limited
    (let [response ((handler/app test-config) {:request-method :post
                                                 :uri "/api/reframe"
                                                 :body (json-body {:text "test"})})]
      (is (= 429 (:status response))))))

;; ─── POST /api/reframe — LLM errors ────────────────────────────────────────

(deftest post-reframe-llm-timeout
  (testing "POST /api/reframe on LLM timeout returns 504 Gateway Timeout"
    (llm-client/set-mock-mode! :timeout)
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {:text "test"})})]
      (is (= 504 (:status response))))))

(deftest post-reframe-llm-error
  (testing "POST /api/reframe on LLM API error returns 502 Bad Gateway"
    (llm-client/set-mock-mode! :error)
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {:text "test"})})]
      (is (= 502 (:status response))))))

;; ─── POST /api/reframe — method & content negotiation ──────────────────────

(deftest method-not-allowed
  (testing "GET /api/reframe returns 405 Method Not Allowed"
    (let [response ((handler/app test-config) {:request-method :get :uri "/api/reframe"})]
      (is (= 405 (:status response))))))

(deftest unsupported-method
  (testing "PUT /api/reframe returns 405 Method Not Allowed"
    (let [response ((handler/app test-config) {:request-method :put
                                 :uri "/api/reframe"
                                 :body (json-body {:text "test"})})]
      (is (= 405 (:status response))))))

(deftest unsupported-content-type
  (testing "POST /api/reframe with non-JSON content-type returns 415"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :content-type "text/plain"
                                 :body (json-body {:text "test"})})]
      (is (= 415 (:status response))))))

;; ─── POST /api/reframe — deeper mode (Vertical Arrow) ──────────────────────

(deftest post-reframe-deeper-ok
  (testing "POST /api/reframe with mode=deeper returns 200 with levels data"
    (llm-client/set-mock-mode! :fixture)
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {:text "Я безответственный человек"
                                                   :mode "deeper"
                                                   :surface "Я опоздал на встречу"})})
          body     (drain-sse-body (:body response))]
      (is (= 200 (:status response)))
      (is (= "text/event-stream" (get-in response [:headers "Content-Type"])))
      (is (str/includes? body "levels"))
      (is (str/includes? body "reframing")))))

(deftest post-reframe-deeper-missing-surface
  (testing "POST /api/reframe with mode=deeper but no surface returns 400"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body (json-body {:text "test" :mode "deeper"})})]
      (is (= 400 (:status response))))))

;; ─── POST /api/reframe — v2 multi-agent ─────────────────────────────────────

(deftest post-reframe-multi-agent-ok
  (testing "POST with :agents returns multi-event SSE with burns, stoic, consensus"
    (llm-client/set-mock-mode! :fixture)
    (let [response ((handler/app test-config) {:request-method :post
                                               :uri "/api/reframe"
                                               :body (json-body {:text "Я опоздал"
                                                                 :agents ["burns" "stoic"]})})
          body (drain-sse-body (:body response))]
      (is (= 200 (:status response)))
      (is (= "text/event-stream" (get-in response [:headers "Content-Type"])))
      (is (str/includes? body "\"agent\":\"burns\""))
      (is (str/includes? body "\"agent\":\"stoic\""))
      (is (str/includes? body "\"agent\":\"consensus\""))
      (is (str/includes? body "reframing")))))

;; ─── 404 — unknown routes ──────────────────────────────────────────────────

(deftest unknown-route
  (testing "GET /nonexistent returns 404"
    (let [response ((handler/app test-config) {:request-method :get :uri "/nonexistent"})]
      (is (= 404 (:status response))))))

;; ─── LLM retry logic ──────────────────────────────────────────────────────

(deftest llm-retry-succeeds
  (testing "Retry recovers from transient failure — succeeds on second attempt"
    (let [attempts (atom 0)
          mock-llm (fn [_ _]
                     (swap! attempts inc)
                     (if (= @attempts 1)
                       (throw (Exception. "Transient error"))
                       "success"))]
      (is (= "success" (llm-client/call-with-retry {:max-retries 3 :retry-backoff-ms 1} mock-llm "test")))
      (is (= 2 @attempts)))))

(deftest llm-retry-exhausted
  (testing "Retry gives up after max retries — throws the last exception"
    (let [attempts (atom 0)
          mock-llm (fn [_ _]
                     (swap! attempts inc)
                     (throw (Exception. "Persistent error")))]
      (is (thrown? Exception (llm-client/call-with-retry {:max-retries 5 :retry-backoff-ms 1} mock-llm "test")))
      (is (= 5 @attempts)))))

(deftest llm-retry-reads-config
  (testing "Config values for max-retries are read from llm-config"
    (let [attempts (atom 0)
          mock-llm (fn [_ _]
                     (swap! attempts inc)
                     (throw (Exception. "fail")))]
      ;; With max-retries 1, should only attempt once
      (is (thrown? Exception (llm-client/call-with-retry {:max-retries 1 :retry-backoff-ms 1} mock-llm "test")))
      (is (= 1 @attempts)))))
