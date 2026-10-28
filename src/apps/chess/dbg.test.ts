import { it } from 'vitest'
import { search, Position, squareName, moveFrom, moveTo } from '/home/user/portfolio/src/apps/chess/engine'
it('dbg', () => {
  const fen = 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3'
  const p = new Position(fen)
  console.log(p.legalMoves().map(m => squareName(moveFrom(m)) + squareName(moveTo(m))).join(' '))
  console.log('eval', p.evaluate())
  for (const lvl of ['medium','hard'] as const) console.log(lvl, JSON.stringify(search({ fen, level: lvl }, { random: () => 0.5 })))
})
