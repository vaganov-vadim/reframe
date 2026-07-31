(ns reframe.agents-test
  "TDD tests for multi-agent registry and orchestration (v2)."
  (:require [clojure.test :refer :all]
            [cheshire.core :as json]
            [clojure.string :as str]
            [reframe.agents :as agents]
            [reframe.llm-client :as llm-client]
            [reframe.rate-limiter :as rate-limiter]))

(def ^:private test-config
  {:llm {:api-key nil
         :api-url "http://mock.example.com"
         :model "mock-model"
         :mock-enabled "true"}
   :agents {:burns "deepseek-chat"
            :stoic "deepseek-chat"
            :consensus "deepseek-chat"}})

(use-fixtures :each
  (fn [f]
    (rate-limiter/reset-limiter!)
    (llm-client/reset-mock!)
    (llm-client/set-mock-mode! :fixture)
    (f)))

(deftest registry-has-burns-and-stoic
  (testing "Agent registry contains burns and stoic with display names"
    (is (some? (agents/get-agent :burns)))
    (is (some? (agents/get-agent :stoic)))
    (is (= "Д-р Бёрнс" (:name (agents/get-agent :burns))))
    (is (= "Стоик" (:name (agents/get-agent :stoic))))))

(deftest unknown-agent-returns-nil
  (testing "Unknown agent id returns nil"
    (is (nil? (agents/get-agent :friend)))))

(deftest analyze-burns-returns-structured-payload
  (testing "Burns agent returns structured CBT JSON payload"
    (let [event (agents/analyze-agent test-config :burns "Я опоздал на встречу")]
      (is (= "burns" (:agent event)))
      (is (= "ok" (:status event)))
      (is (map? (:payload event)))
      (is (contains? (:payload event) :reframing))
      (is (contains? (:payload event) :distortions)))))

(deftest analyze-stoic-returns-text-payload
  (testing "Stoic agent returns text payload"
    (let [event (agents/analyze-agent test-config :stoic "Я опоздал на встречу")]
      (is (= "stoic" (:agent event)))
      (is (= "ok" (:status event)))
      (is (string? (get-in event [:payload :text])))
      (is (seq (get-in event [:payload :text]))))))

(deftest analyze-unknown-agent-error
  (testing "Unknown agent returns error event"
    (let [event (agents/analyze-agent test-config :nope "text")]
      (is (= "error" (:status event)))
      (is (string? (:error event))))))

(defn- parse-sse-body
  "Split SSE body into parsed event maps."
  [body]
  (->> (str/split-lines body)
       (filter #(str/starts-with? % "data: "))
       (map #(json/parse-string (subs % 6) true))
       vec))

(deftest orchestrate-emits-agent-then-consensus
  (testing "Orchestration emits agent-complete events then consensus when ≥2 ok"
    (let [body (agents/orchestrate! test-config "Я опоздал" [:burns :stoic])
          events (parse-sse-body body)
          agents-ok (filter #(and (#{"burns" "stoic"} (:agent %)) (= "ok" (:status %))) events)
          consensus (filter #(= "consensus" (:agent %)) events)]
      (is (string? body))
      (is (>= (count agents-ok) 2))
      (is (= 1 (count consensus)))
      (is (= "ok" (:status (first consensus))))
      (is (string? (get-in (first consensus) [:payload :text]))))))

(deftest format-sse-line
  (testing "SSE formatter prefixes data: and ends with blank line"
    (let [line (agents/format-sse-event {:agent "burns" :status "ok"})]
      (is (str/starts-with? line "data: "))
      (is (str/ends-with? line "\n\n")))))
