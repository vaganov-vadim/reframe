(ns reframe.handler-test
  "Comprehensive test suite for HTTP handler (Phase 2).
   RED phase: tests define expected API contract before handler implementation."
  (:require [clojure.test :refer :all]
            [reframe.handler :as handler]
            [reframe.rate-limiter :as rate-limiter]
            [reframe.llm-client :as llm-client]))

;; ─── Fixtures ───────────────────────────────────────────────────────────────

(def ^:private test-config
  "Test configuration with mock LLM enabled."
  {:llm {:api-key nil
         :api-url "http://mock.example.com"
         :model   "mock-model"
         :mock-enabled "true"}})

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
                                 :body-params {:text "Я опоздал на встречу"}})]
      (is (= 200 (:status response)))
      (is (= "text/event-stream" (get-in response [:headers "Content-Type"]))))))

;; ─── POST /api/reframe — input validation ──────────────────────────────────

(deftest post-reframe-empty-text
  (testing "POST /api/reframe with empty text returns 400 Bad Request"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body-params {:text ""}})]
      (is (= 400 (:status response))))))

(deftest post-reframe-missing-text
  (testing "POST /api/reframe with missing text key returns 400 Bad Request"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body-params {}})]
      (is (= 400 (:status response))))))

(deftest post-reframe-text-too-long
  (testing "POST /api/reframe with text > 3000 chars returns 400 Bad Request"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body-params {:text (apply str (repeat 3001 "x"))}})]
      (is (= 400 (:status response))))))

;; ─── POST /api/reframe — rate limiting ─────────────────────────────────────

(deftest post-reframe-rate-limited
  (testing "POST /api/reframe when rate limited returns 429 with Retry-After header"
    ;; Exhaust rate limiter (3 tokens) so handler returns 429
    (dotimes [_ 3] (rate-limiter/allow-request? {}))
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body-params {:text "test"}})]
      (is (= 429 (:status response)))
      (is (contains? (set (keys (:headers response))) "Retry-After")))))

;; ─── POST /api/reframe — LLM errors ────────────────────────────────────────

(deftest post-reframe-llm-timeout
  (testing "POST /api/reframe on LLM timeout returns 504 Gateway Timeout"
    (llm-client/set-mock-mode! :timeout)
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body-params {:text "test"}})]
      (is (= 504 (:status response))))))

(deftest post-reframe-llm-error
  (testing "POST /api/reframe on LLM API error returns 502 Bad Gateway"
    (llm-client/set-mock-mode! :error)
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :body-params {:text "test"}})]
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
                                 :body-params {:text "test"}})]
      (is (= 405 (:status response))))))

(deftest unsupported-content-type
  (testing "POST /api/reframe with non-JSON content-type returns 415"
    (let [response ((handler/app test-config) {:request-method :post
                                 :uri "/api/reframe"
                                 :content-type "text/plain"
                                 :body-params {:text "test"}})]
      (is (= 415 (:status response))))))

;; ─── 404 — unknown routes ──────────────────────────────────────────────────

(deftest unknown-route
  (testing "GET /nonexistent returns 404"
    (let [response ((handler/app test-config) {:request-method :get :uri "/nonexistent"})]
      (is (= 404 (:status response))))))
