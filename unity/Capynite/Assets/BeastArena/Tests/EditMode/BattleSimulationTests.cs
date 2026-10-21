using System;
using NUnit.Framework;
using Capynite.BeastArena.Battle;
namespace Capynite.BeastArena.Tests
{
    public class BattleSimulationTests
    {
        [Test] public void FirstTurnBelongsToDrako()
        {
            var battle = new BattleSimulation();
            Assert.Throws<InvalidOperationException>(() => battle.Play("panther", BattleAction.Attack));
            Assert.AreEqual(0, battle.Turn);
        }
        [Test] public void AttackDealsDeterministicDamage()
        {
            var battle = new BattleSimulation();
            battle.Play("drako", BattleAction.Attack);
            Assert.AreEqual(46, battle.Panther.Health);
            Assert.AreEqual(1, battle.Turn);
        }
        [Test] public void DefenseMitigatesNextAttack()
        {
            var battle = new BattleSimulation();
            battle.Play("drako", BattleAction.Defend);
            battle.Play("panther", BattleAction.Attack);
            Assert.AreEqual(67, battle.Drako.Health);
        }
        [Test] public void GameEndsAndRejectsAdditionalActions()
        {
            var battle = new BattleSimulation();
            while (!battle.Finished)
            {
                battle.Play(battle.Turn % 2 == 0 ? "drako" : "panther", BattleAction.Attack);
            }
            Assert.AreEqual("drako", battle.Winner);
            Assert.Throws<InvalidOperationException>(() => battle.Play("panther", BattleAction.Attack));
        }
    }
}
