import { useGame, skillLevelOf } from '../game/store'
import {
  SKILL_TREES,
  GATHER_BRANCHES,
  CRAFT_BRANCHES,
  pointsFromLevel,
  spentPoints,
  isNodeUnlocked,
} from '../game/content/skillTrees'
import type { SkillNode } from '../game/content/skillTrees'

export function SkillTree({ skillId, kind }: { skillId: string; kind: 'gather' | 'craft' }) {
  const state = useGame((s) => s.state)
  const invest = useGame((s) => s.investSkillNode)
  const respec = useGame((s) => s.respecSkill)

  const nodes = SKILL_TREES[skillId] ?? []
  const ranks = state.skillNodes ?? {}
  const total = pointsFromLevel(skillLevelOf(state, skillId))
  const spent = spentPoints(skillId, ranks)
  const available = total - spent
  const branches = kind === 'gather' ? GATHER_BRANCHES : CRAFT_BRANCHES

  return (
    <div className="skill-tree-body">
      <div className="tree-head">
        <span className={'tree-points' + (available > 0 ? ' has' : '')}>
          可用點數 <strong>{available}</strong> / {total}
        </span>
        {spent > 0 && (
          <button className="tree-respec" onClick={() => respec(skillId)}>
            重置
          </button>
        )}
      </div>
      <p className="hint tree-hint">每 2 級獲得 1 點。同分支需前一列點滿才能繼續。</p>

      <div className="tree-grid">
        {branches.map((b) => (
          <div key={b.id} className="tree-branch">
            <div className="tree-branch-head">
              {b.emoji} {b.name}
            </div>
            {nodes
              .filter((n) => n.branch === b.id)
              .sort((a, c) => a.row - c.row)
              .map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  rank={ranks[node.id] ?? 0}
                  unlocked={isNodeUnlocked(node, ranks)}
                  affordable={available >= node.costPerRank}
                  onInvest={() => invest(node.id)}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function NodeCard({
  node,
  rank,
  unlocked,
  affordable,
  onInvest,
}: {
  node: SkillNode
  rank: number
  unlocked: boolean
  affordable: boolean
  onInvest: () => void
}) {
  const maxed = rank >= node.maxRank
  const canInvest = unlocked && !maxed && affordable
  const cls =
    'tree-node2' +
    (maxed ? ' maxed' : '') +
    (!unlocked ? ' locked' : '') +
    (rank > 0 && !maxed ? ' partial' : '')

  return (
    <button className={cls} disabled={!canInvest} onClick={onInvest} title={node.desc}>
      <div className="tn-head">
        <span className="tn-name">{node.name}</span>
        <span className="tn-rank">
          {rank}/{node.maxRank}
        </span>
      </div>
      <div className="tn-desc">{node.desc}</div>
      <div className="tn-foot">
        {maxed ? (
          <span className="tn-max">已滿</span>
        ) : !unlocked ? (
          <span className="tn-locked">🔒 需前置點滿</span>
        ) : (
          <span className={'tn-cost' + (affordable ? '' : ' poor')}>耗 {node.costPerRank} 點</span>
        )}
      </div>
    </button>
  )
}
