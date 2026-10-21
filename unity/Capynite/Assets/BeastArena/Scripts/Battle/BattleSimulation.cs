using System;
namespace Capynite.BeastArena.Battle
{
    // Pure deterministic prototype, intentionally independent of UnityEngine.
    // Not server-authoritative and not a substitute for existing card rules.
    public enum BattleAction { Attack, Defend }
    public sealed class BattleFighter
    {
        public readonly string Id;
        public readonly int MaxHealth;
        public int Health { get; private set; }
        public int Shield { get; private set; }
        public BattleFighter(string id, int hp)
        {
            if (string.IsNullOrWhiteSpace(id) || hp <= 0) throw new ArgumentException("Invalid fighter");
            Id = id; MaxHealth = hp; Health = hp;
        }
        internal void Guard(int amount) { Shield = Math.Min(40, Shield + amount); }
        internal void Hit(int amount)
        {
            int blocked = Math.Min(Shield, amount);
            Shield -= blocked;
            Health = Math.Max(0, Health - (amount - blocked));
        }
    }
    public sealed class BattleSimulation
    {
        public readonly BattleFighter Drako = new BattleFighter("drako", 75);
        public readonly BattleFighter Panther = new BattleFighter("panther", 70);
        public int Turn { get; private set; }
        public bool Finished { get { return Drako.Health == 0 || Panther.Health == 0; } }
        public string Winner { get { return !Finished ? null : Drako.Health == 0 ? Panther.Id : Drako.Id; } }
        public void Play(string actorId, BattleAction action)
        {
            if (Finished) throw new InvalidOperationException("Battle is finished");
            bool drakoTurn = Turn % 2 == 0;
            BattleFighter attacker = drakoTurn ? Drako : Panther;
            BattleFighter defender = drakoTurn ? Panther : Drako;
            if (actorId != attacker.Id) throw new InvalidOperationException("Out-of-turn action");
            if (action == BattleAction.Defend) attacker.Guard(12);
            else if (action == BattleAction.Attack) defender.Hit(drakoTurn ? 24 : 20);
            else throw new ArgumentOutOfRangeException(nameof(action));
            Turn++;
        }
    }
}
