(ns reframe.handler
  "HTTP request handlers for the Reframe backend.
   Currently placeholders — business logic will be added in Phase 2."
  (:require [cheshire.core :as json]
            [ring.util.response :as response]))

(defn home-handler
  "GET / — health check, returns 200 OK with status message."
  [_request]
  {:status  200
   :headers {"Content-Type" "application/json"}
   :body    (json/generate-string {:status "ok" :service "reframe-backend"})})

(defn reframe-handler
  "POST /api/reframe — placeholder for LLM proxy handler.
   Will accept transcribed text, apply CBT/Burns prompt, stream SSE response."
  [_request]
  {:status  200
   :headers {"Content-Type" "application/json"}
   :body    (json/generate-string {:status "ok" :message "POST /api/reframe placeholder"})})

(def app
  "Ring handler function — routes requests to appropriate handlers."
  home-handler)
