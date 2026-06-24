import { INTRO_STORY } from "../engine/story";

/**
 * Briefing de história mostrado depois de escolher o herói e antes de começar
 * a fase. A simulação fica pausada enquanto este overlay está na tela.
 */
export default function StoryIntro({ heroName, onStart }: { heroName: string; onStart: () => void }) {
  return (
    <div className="capy-story" role="dialog" aria-modal="true" aria-label="História">
      <div className="capy-story__title">{INTRO_STORY.title}</div>
      <div className="capy-story__subtitle">{INTRO_STORY.subtitle}</div>
      <div className="capy-story__lines">
        {INTRO_STORY.lines.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <div className="capy-story__hero">Herói: {heroName}</div>
      <button
        type="button"
        className="capy-overlay__btn"
        onClick={onStart}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {INTRO_STORY.cta}
      </button>
    </div>
  );
}
