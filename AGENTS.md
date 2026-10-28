
- Beast Arena entry: all login/signup starts from the public landing (TelaHome); protected screens without a session redirect to the landing, and auth events only move to the lobby from entry screens. Why: avoids inline login walls and token-refresh kicking players out of battles.
- Stage unactivated P0 backend artifacts under docs/security/p0-release, never supabase/functions or migration discovery paths while production deployment is forbidden; the connected backend is shared and changes deploy immediately.
- The current client economy boundary fails closed until a verified isolated release; AI demo sessions are memory-only and never persist rewards, preserving play without trusting local outcomes.
- Keep the copied legacy demo rules database-free; authenticated reward eligibility must come from a future server-owned transactional session, not the demo snapshot.
