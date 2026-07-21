import './RecordingIndicator.css';

export function RecordingIndicator() {
  return (
    <div className="recording-indicator" role="status" aria-label="Recording in progress">
      <div className="recording-dot" />
      <span className="recording-time">● Запись...</span>
    </div>
  );
}
