import { it } from 'vitest'
import { writeFileSync } from 'node:fs'
import { search, Position, squareName, moveFrom, moveTo } from './engine'
it('dbg', () => {
  const fen = 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
  const p = new Position(fen)
  const out = [p.legalMoves().map(m => squareName(moveFrom(m)) + squareName(moveTo(m))).join(' '), 'eval ' + p.evaluate()]
  for (const lvl of ['medium','hard'] as const) out.push(lvl + ' ' + JSON.stringify(search({ fen, level: lvl }, { random: () => 0.5 })))
  writeFileSync('/tmp/claude-0/-home-user-portfolio/39963484-3725-508b-8b83-685ad5227721/scratchpad/dbg.txt', out.join('\n'))
})
