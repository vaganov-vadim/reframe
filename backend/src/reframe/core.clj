(ns reframe.core
  "Application entry point. Reads configuration and starts the HTTP server."
  (:gen-class)
  (:require [org.httpkit.server :as server]
            [reframe.handler :as handler]
            [aero.core :as aero]))

(defn- read-config
  "Reads configuration from resources/config.edn using Aero.
   Environment variables are resolved via #env and #or tags.
   Returns the parsed config map."
  []
  (aero/read-config "resources/config.edn"))

(defn -main
  "Starts the Reframe backend server.
   Reads port from config (default: 3000, override via REFRAME_PORT env var)."
  [& _]
  (let [config (read-config)
        port   (get-in config [:server :port] 3000)]
    (println "Starting Reframe backend...")
    (println (str "Server listening on http://localhost:" port))
    (server/run-server handler/app {:port port})
    (println "Server started. Press Ctrl+C to stop.")))
