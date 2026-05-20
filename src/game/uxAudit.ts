/**
 * UX IMPROVEMENTS — Heurísticas de Norman/Nielsen aplicadas ao Beast Arena
 *
 * 1. Visibilidade do estado do sistema  → sempre claro O QUE está acontecendo
 * 2. Correspondência com o mundo real   → linguagem familiar, metáforas claras
 * 3. Controle e liberdade do usuário    → sempre há uma saída / desfazer
 * 4. Consistência e padrões            → mesma ação, mesmo visual em todo lugar
 * 5. Prevenção de erros                → bloquear antes de errar, não punir depois
 * 6. Reconhecimento em vez de recall   → o que é possível FICA VISÍVEL
 * 7. Flexibilidade e eficiência        → atalhos para usuários experientes
 * 8. Design minimalista                → só o necessário, sem ruído visual
 * 9. Recuperação de erros              → mensagens claras, caminho de volta
 * 10. Ajuda e documentação             → dicas contextuais, não manual separado
 */

// Este arquivo é referência de auditoria — as mudanças foram aplicadas nos componentes
export const NORMAN_AUDIT = {

  TelaHome: [
    "✅ TapGate explica o que fazer ('TOQUE PARA INICIAR') — reconhecimento",
    "✅ Intro animada dá feedback visual imediato — visibilidade do estado",
    "⚠️ FIX: Botões sem rótulo de consequência. Ex: 'JOGAR' → 'BATALHAR AGORA'",
    "⚠️ FIX: Sem indicador de nível/progresso do usuário na tela inicial",
    "⚠️ FIX: Não há diferença visual entre 'usuário logado' e 'visitante'",
  ],

  TelaBatalha: [
    "✅ Timer visível conta regressivamente — visibilidade do estado",
    "✅ Indicadores de buff (escudo, imunidade) — reconhecimento",
    "⚠️ FIX: Carta selecionada mas custo > energia: botão desabilitado sem explicar por quê",
    "⚠️ FIX: 'PASSAR' é ambíguo — o que exatamente acontece ao passar?",
    "⚠️ FIX: Combo: usuário não sabe que 2 cartas do mesmo tipo formam combo",
    "⚠️ FIX: Energia sem tooltip do que cada número significa",
    "⚠️ FIX: Sem feedback ao tentar jogar fora do turno",
    "⚠️ FIX: Log de jogo escondido — eventos importantes somem rápido",
  ],

  TelaMonstro: [
    "✅ Swipe gesture com setas visíveis — affordance clara",
    "✅ Stats visíveis (ATK/DEF/HP) — reconhecimento",
    "⚠️ FIX: Monstros bloqueados mostram ícone de cadeado mas sem preço/como desbloquear",
    "⚠️ FIX: Sem comparação entre monstros (não dá pra ver 2 ao mesmo tempo)",
    "⚠️ FIX: Dots indicadores de posição pequenos demais para toque",
  ],

  ModalPoder: [
    "✅ Carrossel com swipe — metáfora familiar",
    "⚠️ FIX: Stats '+20 ATK' sem contexto do total do monstro atual",
    "⚠️ FIX: Não há indicação de que esta escolha é permanente (para a batalha)",
    "⚠️ FIX: Sem dica de qual poder combina com qual monstro",
  ],

  TelaLobbyPrincipal: [
    "⚠️ FIX: Botões laterais muito pequenos para toque (36px é limite mínimo)",
    "⚠️ FIX: Sem feedback de loading quando carrega dados do perfil",
    "⚠️ FIX: 'DUELO IA', 'MULTI', 'RANKED' sem explicação do que cada modo é",
  ],

  Cartas: [
    "✅ Custo de energia visível (badge ⚡)",
    "✅ Tipo de carta identificado por cor",
    "⚠️ FIX: Texto de descrição pequeno demais em mobile (10px)",
    "⚠️ FIX: Long-press para preview existe mas usuário não sabe",
    "⚠️ FIX: Cartas desabilitadas por energia ficam idênticas — sem sinal visual",
  ],
};
