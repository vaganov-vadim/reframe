(ns reframe.agents-test
  "TDD tests for multi-agent registry and orchestration (v2)."
  (:require [clojure.test :refer :all]
            [cheshire.core :as json]
            [clojure.core.async :as async]
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

(deftest orchestrate-emits-agent-then-consensus
  (testing "Orchestration emits agent-complete events then consensus when ≥2 ok"
    (let [ch (agents/orchestrate! test-config "Я опоздал" [:burns :stoic])
          events (loop [acc []]
                   (if-let [v (async/<!! ch)]
                     (let [json-str (if (str/starts-with? v "data: ")
                                      (str/trim (subs v 6))
                                      v)]
                       (recur (conj acc (json/parse-string json-str true))))
                     acc))
          agents-ok (filter #(and (#{"burns" "stoic"} (:agent %)) (= "ok" (:status %))) events)
          consensus (filter #(= "consensus" (:agent %)) events)]
      (is (>= (count agents-ok) 2))
      (is (= 1 (count consensus)))
      (is (= "ok" (:status (first consensus))))
      (is (string? (get-in (first consensus) [:payload :text]))))))

(deftest format-sse-line
  (testing "SSE formatter prefixes data: and ends with blank line"
    (let [line (agents/format-sse-event {:agent "burns" :status "ok"})]
      (is (clojure.string/starts-with? line "data: "))
      (is (clojure.string/ends-with? line "\n\n")))))
