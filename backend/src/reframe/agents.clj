(ns reframe.agents
  "Multi-agent registry and orchestration for Reframe v2.
   Emits agent-complete SSE events via a core.async channel."
  (:require [cheshire.core :as json]
            [clojure.core.async :as async]
            [clojure.string :as str]
            [reframe.llm-client :as llm-client]
            [reframe.prompt :as prompt]
            [taoensso.timbre :as timbre]))

(def ^:private agent-registry
  {:burns {:id :burns
           :name "Д-р Бёрнс"
           :prompt-fn prompt/burns-prompt
           :kind :structured}
   :stoic {:id :stoic
           :name "Стоик"
           :prompt-fn prompt/stoic-prompt
           :kind :text}})

(defn get-agent
  "Lookup agent by keyword id. Returns registry map or nil."
  [agent-id]
  (get agent-registry (keyword agent-id)))

(defn format-sse-event
  "Format a Clojure map as an SSE data line."
  [event]
  (str "data: " (json/generate-string event) "\n\n"))

(defn- parse-llm-json
  "Parse LLM string into a map. Falls back to {:text raw}."
  [raw]
  (try
    (let [parsed (json/parse-string raw true)]
      (if (map? parsed) parsed {:text (str raw)}))
    (catch Exception _
      {:text (str raw)})))

(defn- summarize-for-consensus
  "Flatten agent event into a short string for the consensus prompt."
  [event]
  (let [payload (:payload event)]
    (str (:name event) ": "
         (or (:reframing payload)
             (:text payload)
             (pr-str payload)))))

(defn analyze-agent
  "Run a single agent against thought. Returns an agent-complete event map.
   Never throws — failures become {:status \"error\"}."
  [config agent-id thought]
  (let [id (keyword agent-id)
        meta (get-agent id)]
    (if-not meta
      {:agent (name id) :name (name id) :status "error" :error "Unknown agent"}
      (try
        (let [prompt ((:prompt-fn meta) thought)
              raw (llm-client/call-llm config prompt)
              payload (parse-llm-json raw)]
          {:agent (name id)
           :name (:name meta)
           :status "ok"
           :payload payload})
        (catch Exception e
          (timbre/error e "Agent failed" {:agent id})
          {:agent (name id)
           :name (:name meta)
           :status "error"
           :error (or (.getMessage e) "LLM API error")})))))

(defn- run-consensus
  "Call consensus LLM when at least two agents succeeded."
  [config thought ok-events]
  (if (< (count ok-events) 2)
    nil
    (try
      (let [summaries (->> ok-events
                           (map summarize-for-consensus)
                           (str/join "\n"))
            raw (llm-client/call-llm config (prompt/consensus-prompt thought summaries))
            payload (parse-llm-json raw)]
        {:agent "consensus"
         :name "Что общего"
         :status "ok"
         :payload (if (:text payload) payload {:text (pr-str payload)})})
      (catch Exception e
        (timbre/error e "Consensus agent failed")
        {:agent "consensus"
         :name "Что общего"
         :status "error"
         :error (or (.getMessage e) "Consensus failed")}))))

(defn orchestrate!
  "Launch agents in parallel. Returns a core.async channel of SSE-formatted strings.
   Events are emitted in completion order; consensus (if any) is last. Channel is closed when done."
  [config thought agent-ids]
  (let [ids (mapv keyword agent-ids)
        out (async/chan 16)
        completed (java.util.concurrent.LinkedBlockingQueue.)
        n (count ids)]
    (doseq [id ids]
      (.start
       (Thread.
        (fn []
          (.put completed (analyze-agent config id thought)))
        (str "agent-" (name id)))))
    (async/thread
      (try
        (let [ok (atom [])]
          (dotimes [_ n]
            (let [event (.take completed)]
              (when (= "ok" (:status event))
                (swap! ok conj event))
              (async/>!! out (format-sse-event event))))
          (when-let [consensus (run-consensus config thought @ok)]
            (async/>!! out (format-sse-event consensus))))
        (catch Exception e
          (timbre/error e "Orchestration failed")
          (async/>!! out (format-sse-event {:agent "system"
                                            :status "error"
                                            :error "Orchestration failed"})))
        (finally
          (async/close! out))))
    out))
