// Only tool names and counts are retained, never arguments or results.
const counts = new Map()

export function register(on) {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'research-tally',
      description: 'Show observed tool-call attempts; use reset to clear the counter',
    })
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    counts.set(e.tool, (counts.get(e.tool) ?? 0) + 1)
    return next(e)
  })

  on('command.run', { command: 'research-tally' }, async ($, e) => {
    const action = e.args.trim()
    if (action === 'reset') {
      counts.clear()
      return { text: 'Counter reset. Observed tool-call attempts: 0' }
    }
    if (action !== '') {
      return { text: 'Usage: /research-tally [reset]' }
    }

    const total = [...counts.values()].reduce((sum, count) => sum + count, 0)
    const lines = [...counts.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([tool, count]) => tool + ': ' + count)
    return { text: ['Observed tool-call attempts: ' + total, ...lines].join('\n') }
  })
}
