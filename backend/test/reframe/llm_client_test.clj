(ns reframe.llm-client-test
  "TDD: DeepSeek V4 request body — model + explicit thinking."
  (:require [clojure.test :refer :all]
            [cheshire.core :as json]
            [clj-http.client :as http]
            [reframe.llm-client :as llm-client]))

(def ^:private base-config
  {:llm {:api-key "test-key"
         :api-url "https://api.deepseek.com/v1/chat/completions"
         :model "deepseek-v4-flash"
         :thinking "disabled"
         :max-retries 1
         :retry-backoff-ms 1
         :socket-timeout-ms 5000
         :conn-timeout-ms 1000
         :mock-enabled "false"}})

(defn- capture-post!
  "with-redefs helper: capture POST body, return fake OpenAI-shaped response."
  [captured content]
  (fn [_url opts]
    (reset! captured (json/parse-string (:body opts) true))
    {:status 200
     :body {:choices [{:message {:content content}}]}}))

(deftest call-llm-sends-default-model-and-thinking-disabled
  (testing "v1 path sends LLM_MODEL and explicit thinking.disabled"
    (let [captured (atom nil)]
      (with-redefs [http/post (capture-post! captured "{\"ok\":true}")]
        (is (= "{\"ok\":true}" (llm-client/call-llm base-config "hello")))
        (is (= "deepseek-v4-flash" (:model @captured)))
        (is (= "disabled" (get-in @captured [:thinking :type])))))))

(deftest call-llm-opts-override-model-and-thinking
  (testing "opts override model and enable thinking (consensus / reasoner-mode)"
    (let [captured (atom nil)]
      (with-redefs [http/post (capture-post! captured "{\"text\":\"ok\"}")]
        (llm-client/call-llm base-config "hello"
                             {:model "deepseek-v4-pro" :thinking "enabled"})
        (is (= "deepseek-v4-pro" (:model @captured)))
        (is (= "enabled" (get-in @captured [:thinking :type])))))))

(deftest call-llm-thinking-keyword-normalized
  (testing "keyword :disabled is sent as string type"
    (let [captured (atom nil)]
      (with-redefs [http/post (capture-post! captured "x")]
        (llm-client/call-llm base-config "p" {:thinking :disabled})
        (is (= "disabled" (get-in @captured [:thinking :type])))))))
