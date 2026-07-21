(ns reframe.handler-test
  (:require [clojure.test :refer :all]
            [reframe.handler :as handler]))

(deftest home-route-test
  (testing "GET / returns 200 OK with JSON body"
    (let [response (handler/app {:request-method :get :uri "/"})]
      (is (= 200 (:status response)))
      (is (= "application/json" (get-in response [:headers "Content-Type"]))))))
