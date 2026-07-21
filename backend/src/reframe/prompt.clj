(ns reframe.prompt
  "CBT (Cognitive Behavioral Therapy) prompt formatting using David Burns methodology.
   System prompt templates and distortion definitions live here.")

(def system-prompt
  "System prompt for the LLM — instructs it to act as a CBT coach.
   Based on David Burns' 10 cognitive distortions."
  (str "Ты — Reframe, КПТ-коуч для профессионалов, испытывающих стресс. "
       "Твоя задача — помочь увидеть мысли объективно через призму КПТ Дэвида Бёрнса. "
       "РОЛЬ: эмпатичный, но строгий наблюдатель. Не оцениваешь, не осуждаешь, не жалеешь. "
       "Помогаешь дистанцироваться от эмоций и увидеть факты."))

(defn build-prompt
  "Formats the user's transcribed text into a prompt for the LLM.
   Currently a placeholder — will include Burns methodology instructions.
   Args:
     text - transcribed user speech (string)
   Returns:
     formatted prompt string"
  [text]
  ;; Placeholder — full CBT/Burns prompt will be added in Phase 2
  (str system-prompt "\n\n" "Текст пользователя: " text))
