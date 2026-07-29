(ns reframe.logging
  "Logging configuration for Reframe backend.
   Uses timbre with console (stdout) and daily-rotated file appenders.
   Logs go to logs/reframe.{yyyy-MM-dd}.log, kept for 7 days.
   Constitution §I: NEVER log user content (text, prompts, LLM responses)."
  (:require [taoensso.timbre :as timbre])
  (:import [java.io File FileWriter BufferedWriter]))

;; ─── Rotation / cleanup ──────────────────────────────────────────────────────

(def ^:private max-log-age-days 7)

(defn- log-file-path
  "Returns today's log file path."
  []
  (str "logs/reframe." (java.time.LocalDate/now) ".log"))

(defn- cleanup-old-logs!
  "Delete log files older than max-log-age-days."
  []
  (try
    (let [log-dir (File. "logs")
          cutoff  (.minus (java.time.LocalDate/now)
                          max-log-age-days
                          java.time.temporal.ChronoUnit/DAYS)]
      (when (.exists log-dir)
        (doseq [^File f (.listFiles log-dir)]
          (when (and (.isFile f) (.startsWith (.getName f) "reframe."))
            (try
              (let [filename  (.getName f)
                    date-str  (second (re-find #"reframe\.(\d{4}-\d{2}-\d{2})\.log" filename))
                    file-date (java.time.LocalDate/parse date-str)]
                (when (.isBefore file-date cutoff)
                  (.delete f)))
              (catch Exception _))))))
    (catch Exception _)))

;; ─── Output formatting ───────────────────────────────────────────────────────

(defn- format-output
  "Format a log entry as [level] ns — message {:kvs}"
  [{:keys [level ?ns-str ?err msg_ vargs_ output_]}]
  (let [base (str "[" (name level) "] " (or ?ns-str "?") " — " (force msg_))]
    (if ?err
      (str base "\n" (timbre/stacktrace ?err))
      base)))

;; ─── File writer ─────────────────────────────────────────────────────────────

(def ^:private file-writer (atom nil))

(defn- ensure-file-writer
  "Returns a BufferedWriter for today's log file, creating/reopening if needed."
  [path]
  (let [current @file-writer]
    (if (and current (= path (:path current)))
      (try
        ;; Verify writer is still usable
        (.flush ^java.io.Writer (:writer current))
        (:writer current)
        (catch Exception _
          ;; Writer is stale — reopen
          (reset! file-writer nil)
          (ensure-file-writer path)))
      (let [f (File. path)
            _ (.mkdirs (.getParentFile f))
            w (BufferedWriter. (FileWriter. f true))]
        (when-let [old (:writer current)]
          (try (.close old) (catch Exception _)))
        (reset! file-writer {:path path :writer w})
        w))))

;; ─── Appenders ───────────────────────────────────────────────────────────────

(defn- file-appender-fn
  "Appender fn: format output and write to rotating file."
  [{:keys [output_ level] :as data}]
  (when output_
    (try
      (let [path   (log-file-path)
            writer (ensure-file-writer path)
            ;; Ensure formatter is called
            line   (format-output data)]
        (.write writer line)
        (.write writer "\n")
        (.flush writer))
      (catch Exception e
        (println "LOG WRITE ERROR:" (.getMessage e))))))

;; ─── Init ────────────────────────────────────────────────────────────────────

(defn init!
  "Configure timbre with console + daily-rotated file appenders.
   Call once at application startup."
  []
  (.mkdirs (File. "logs"))
  (reset! file-writer nil)
  (cleanup-old-logs!)
  (timbre/merge-config!
    {:output-fn  format-output
     :appenders {:println {:enabled?  true
                           :async?    false
                           :min-level :info
                           :output-fn :inherit}
                 :file    {:enabled?  true
                           :async?    false
                           :min-level :debug
                           :output-fn :inherit
                           :fn        file-appender-fn}}})
  (timbre/info "Logging initialized — console (INFO+) + daily-rotated file (DEBUG+, max" max-log-age-days "days)"))
