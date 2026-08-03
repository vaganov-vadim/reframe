(ns reframe.prompt-test
  (:require [clojure.test :refer [deftest testing is]]
            [clojure.string :as str]
            [reframe.prompt :as prompt]))

(deftest build-prompt-includes-action-contract
  (testing "v1 prompt asks for concrete action step in JSON"
    (let [p (prompt/build-prompt "Я опоздал на встречу")]
      (is (str/includes? p "\"action\""))
      (is (str/includes? p "Что сделать сегодня"))
      (is (str/includes? p "Текст пользователя: Я опоздал на встречу")))))
