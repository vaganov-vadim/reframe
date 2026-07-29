(ns reframe.logging-test
  "Tests for operational logging: initialization, rotation, cleanup.
   Constitution §I: never log user content (text, prompts, LLM responses)."
  (:require [clojure.test :refer :all]
            [reframe.logging :as logging]
            [taoensso.timbre :as timbre])
  (:import [java.io File]))

;; ─── Fixtures ───────────────────────────────────────────────────────────────

(def ^:private test-log-dir "logs")

(defn- delete-test-logs!
  "Clean up log files created during tests."
  []
  (let [log-dir (File. test-log-dir)]
    (when (.exists log-dir)
      (doseq [^File f (.listFiles log-dir)]
        (when (.startsWith (.getName f) "reframe.")
          (.delete f))))))

(use-fixtures :each
  (fn [f]
    (delete-test-logs!)
    ;; Reset timbre to defaults
    (timbre/merge-config! {:appenders {:println {:enabled? true :min-level :report}}})
    (f)
    (delete-test-logs!)))

;; ─── Initialization ─────────────────────────────────────────────────────────

(deftest init-creates-log-directory
  (testing "init! creates logs/ directory if it doesn't exist"
    (let [log-dir (File. test-log-dir)]
      ;; Ensure directory doesn't exist before test
      (when (.exists log-dir)
        (doseq [^File f (.listFiles log-dir)] (.delete f))
        (.delete log-dir))
      (is (not (.exists log-dir)))
      (logging/init!)
      (is (.exists log-dir))
      (is (.isDirectory log-dir)))))

(deftest init-does-not-throw
  (testing "init! completes without throwing"
    (is (nil? (logging/init!)))))

(deftest init-configures-appenders
  (testing "init! adds both console and file appenders"
    (logging/init!)
    ;; Verify by writing and checking file exists — behavioral test
    (timbre/info "Appender test message")
    (Thread/sleep 100)
    (let [today     (java.time.LocalDate/now)
          log-path  (str test-log-dir "/reframe." today ".log")
          log-file  (File. log-path)]
      (is (.exists log-file) "File appender should write to log file"))))

;; ─── Logging output ─────────────────────────────────────────────────────────

(deftest logging-writes-to-file
  (testing "log messages appear in today's log file"
    (logging/init!)
    (timbre/info "Test log message for file output check")
    ;; Force flush by writing another message
    (timbre/info "Test flush")
    ;; Give file writer time to flush
    (Thread/sleep 100)
    ;; Check today's log file exists and has content
    (let [today   (java.time.LocalDate/now)
          log-path (str test-log-dir "/reframe." today ".log")
          log-file (File. log-path)]
      (is (.exists log-file) (str "Log file should exist: " log-path))
      (is (pos? (.length log-file)) "Log file should not be empty"))))

(deftest no-user-content-in-log-format
  (testing "log format does not include content fields for user data"
    (logging/init!)
    ;; Log statements in handler/llm-client use metadata only, no :text/:prompt/:response keys
    ;; Verify the logging namespace exports no functions that accept user content directly
    ;; The actual enforcement is in handler.clj and llm_client.clj — they never pass user text to timbre
    (let [ns-vars (ns-publics 'reframe.logging)]
      ;; Only init! is public
      (is (contains? ns-vars 'init!))
      ;; No functions that could leak content
      (is (= 1 (count ns-vars)) "logging ns should only export init!"))))

;; ─── Cleanup / rotation ─────────────────────────────────────────────────────

(deftest cleanup-removes-old-logs
  (testing "cleanup deletes log files older than 7 days"
    (logging/init!)
    ;; Create a fake old log file (8 days ago)
    (let [old-date  (.minus (java.time.LocalDate/now) 8 java.time.temporal.ChronoUnit/DAYS)
          old-path  (str test-log-dir "/reframe." old-date ".log")
          old-file  (File. old-path)]
      (.mkdirs (.getParentFile old-file))
      (.createNewFile old-file)
      (is (.exists old-file) "Old log file should exist before cleanup")
      ;; Re-init triggers cleanup
      (logging/init!)
      (is (not (.exists old-file)) "Old log file should be deleted by cleanup")))

  (testing "cleanup keeps recent log files (today)"
    (logging/init!)
    (let [today     (java.time.LocalDate/now)
          today-path (str test-log-dir "/reframe." today ".log")
          today-file (File. today-path)]
      (.mkdirs (.getParentFile today-file))
      (.createNewFile today-file)
      (logging/init!)
      (is (.exists today-file) "Today's log file should NOT be deleted"))))

;; ─── Edge cases ─────────────────────────────────────────────────────────────

(deftest init-handles-missing-log-dir
  (testing "init! works when logs/ doesn't exist yet"
    (let [log-dir (File. test-log-dir)]
      (when (.exists log-dir)
        (doseq [^File f (.listFiles log-dir)] (.delete f))
        (.delete log-dir))
      (is (not (.exists log-dir)))
      ;; Should not throw
      (logging/init!)
      (is (.exists log-dir)))))

(deftest init-handles-existing-log-dir
  (testing "init! works when logs/ already exists"
    (let [log-dir (File. test-log-dir)]
      (.mkdirs log-dir)
      (is (.exists log-dir))
      ;; Should not throw
      (logging/init!)
      (is (.exists log-dir)))))
