(ns reframe.agents
  "Multi-agent registry and orchestration for Reframe v2.
   Emits agent-complete SSE events (materialized body — reliable through nginx/http-kit)."
  (:require [cheshire.core :as json]
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

(defn agent-llm-opts
  "Resolve :model / :thinking for agent-id from config :agents.
   Supports map {:model :thinking} or legacy string model id."
  [config agent-id]
  (let [entry (get-in config [:agents (keyword agent-id)])]
    (cond
      (map? entry)
      (cond-> {}
        (some? (:model entry)) (assoc :model (:model entry))
        (some? (:thinking entry)) (assoc :thinking
                                         (if (keyword? (:thinking entry))
                                           (name (:thinking entry))
                                           (str (:thinking entry)))))

      (string? entry)
      {:model entry}

      :else
      {})))

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
              raw (llm-client/call-llm config prompt (agent-llm-opts config id))
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
            raw (llm-client/call-llm config
                                     (prompt/consensus-prompt thought summaries)
                                     (agent-llm-opts config :consensus))
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
  "Run agents in parallel (bounded futures), then return a single SSE body string
   with one event per agent (completion order preserved via doall+deref of started
   futures) plus consensus when ≥2 succeeded.

   Returns a plain string (not a channel) so http-kit/nginx reliably deliver the body."
  [config thought agent-ids]
  (let [ids (mapv keyword agent-ids)
        ;; Start all first, then deref — parallel wall-clock time.
        futs (mapv (fn [id]
                     (future (analyze-agent config id thought)))
                   ids)
        events (mapv deref futs)
        ok (filterv #(= "ok" (:status %)) events)
        consensus (run-consensus config thought ok)
        all (cond-> events consensus (conj consensus))]
    (apply str (map format-sse-event all))))
