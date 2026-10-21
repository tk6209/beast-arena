using System;
using System.Collections;
using UnityEngine;

/// <summary>
/// COSMETIC ONLY: displays cues from the authoritative game state.
/// No HP, energy, damage, turn or rewards are computed here.
/// Attach in an isolated Unity demo scene, assign the two actor transforms,
/// and BindSession with a trusted session ID before ReceiveCue calls.
/// </summary>
public sealed class CapynitePresentationPlayback : MonoBehaviour
{
    [Serializable]
    private sealed class Cue
    {
        public int version;
        public string sessionId;
        public int sequence;
        public string action;
        public string actorId;
        public string targetId;
        public int amount;
    }

    public Transform playerActor;
    public Transform opponentActor;
    public Animator playerAnimator;
    public Animator opponentAnimator;
    public ParticleSystem attackEffect;
    public ParticleSystem defenseEffect;
    public bool reducedMotion;

    private string activeSession;
    private int lastSequence;
    private Coroutine runningAnimation;

    public void BindSession(string sessionId)
    {
        if (string.IsNullOrEmpty(sessionId) || sessionId.Length > 128)
            throw new ArgumentException("Invalid session");
        foreach (char c in sessionId)
            if (!(char.IsLetterOrDigit(c) && c <= 127) && c != '-' && c != '_')
                throw new ArgumentException("Invalid session");
        activeSession = sessionId;
        lastSequence = 0;
    }

    public void ReceiveCue(string json)
    {
        if (string.IsNullOrEmpty(activeSession) || string.IsNullOrEmpty(json) || json.Length > 2048) return;
        Cue cue;
        try { cue = JsonUtility.FromJson<Cue>(json); }
        catch { return; }
        if (cue == null || cue.version != 1 || cue.sessionId != activeSession ||
            cue.sequence <= lastSequence || !KnownAction(cue.action) ||
            !ValidId(cue.actorId) || (!string.IsNullOrEmpty(cue.targetId) && !ValidId(cue.targetId))) return;
        lastSequence = cue.sequence;
        if (runningAnimation != null) StopCoroutine(runningAnimation);
        runningAnimation = StartCoroutine(PlayVisualOnly(cue));
    }

    private static bool ValidId(string value)
    {
        if (string.IsNullOrEmpty(value) || value.Length > 128) return false;
        foreach (char c in value)
            if (!(c >= 'a' && c <= 'z') && !(c >= 'A' && c <= 'Z') &&
                !(c >= '0' && c <= '9') && c != '-' && c != '_') return false;
        return true;
    }

    private static bool KnownAction(string action)
    {
        return action == "attack" || action == "defend" || action == "heal" ||
               action == "evolve" || action == "hit" || action == "victory" ||
               action == "defeat";
    }

    private IEnumerator PlayVisualOnly(Cue cue)
    {
        // Placeholder actor binding. Canonical character registry integration still required.
        bool player = cue.actorId == "drako";
        Transform actor = player ? playerActor : opponentActor;
        Animator animator = player ? playerAnimator : opponentAnimator;
        if (actor == null) yield break;
        string trigger = cue.action;
        if (animator != null) animator.SetTrigger(trigger);

        if (cue.action == "attack" && attackEffect != null) attackEffect.Play();
        if (cue.action == "defend" && defenseEffect != null) defenseEffect.Play();

        Vector3 origin = actor.localPosition;
        if (reducedMotion) yield break;
        float elapsed = 0f, duration = cue.action == "attack" ? .40f : .24f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float phase = Mathf.Clamp01(elapsed / duration);
            actor.localPosition = origin + Vector3.up * (.20f * Mathf.Sin(phase * Mathf.PI));
            yield return null;
        }
        actor.localPosition = origin;
        runningAnimation = null;
    }

    private void OnDisable()
    {
        if (runningAnimation != null) StopCoroutine(runningAnimation);
        runningAnimation = null;
        if (playerActor != null) playerActor.localPosition = Vector3.zero;
    }
}
