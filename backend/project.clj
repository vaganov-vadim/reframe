(defproject reframe "0.1.0-SNAPSHOT"
  :description "Reframe — voice CBT diary backend (thin LLM proxy)"
  :url "https://github.com/vadimvaganov/reframe"
  :license {:name "MIT"
            :url "https://opensource.org/licenses/MIT"}
  :dependencies [[org.clojure/clojure "1.12.0"]
                 ;; Kit framework (Ring + Reitit + malli + integrant + aero)
                 [io.github.kit-clj/kit-core "1.0.10"]
                 [io.github.kit-clj/kit-http-kit "1.0.6"]
                 ;; HTTP client for LLM API calls
                 [clj-http "3.13.0"]
                 ;; Async streaming via SSE
                 [org.clojure/core.async "1.6.681"]
                 ;; JSON encoding
                 [cheshire "5.13.0"]]
  :main reframe.core
  :aot [reframe.core]
  :profiles {:dev {:dependencies [[ring/ring-mock "0.4.0"]]}})
