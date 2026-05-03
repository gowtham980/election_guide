export default function TimelineRoadmap({ stages, currentStep }) {
  return (
    <div className="roadmap-section">
      <p className="roadmap-label">🗺️ Your Voter Journey</p>
      <div className="roadmap-steps">
        {stages.map((stage, i) => {
          const state =
            i < currentStep ? 'completed' : i === currentStep ? 'active' : 'pending';

          return (
            <div key={stage.id} className={`roadmap-step ${state}`}>
              <div className="step-left">
                <div className="step-icon-wrap">
                  {state === 'completed' ? (
                    <>
                      {stage.icon}
                      <span className="check-icon">✓</span>
                    </>
                  ) : (
                    stage.icon
                  )}
                </div>
                {i < stages.length - 1 && <div className="step-connector" />}
              </div>
              <div className="step-right">
                <p className="step-title">{stage.label}</p>
                <p className="step-desc">{stage.detail}</p>
                {state !== 'pending' && (
                  <span className={`step-tag ${state}`}>
                    {state === 'completed' ? '✓ Done' : '● In Progress'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
