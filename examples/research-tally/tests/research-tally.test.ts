import { expect, test } from 'claude-code/testing'

test('registers the command and lets session startup continue once', async ($, on) => {
  const names: string[] = []
  let starts = 0
  on('command.register', ($, e) => {
    names.push(e.name)
    return { value: undefined }
  })
  on('session.start', ($, e) => {
    starts += 1
    return { cwd: e.cwd }
  })

  const result = await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(names).toEqual(['research-tally'])
  expect(starts).toBe(1)
  expect(result).toEqual({ cwd: '/work' })
})

test('a fresh module reports zero, and reading the count does not increment it', async ($, on) => {
  on('command.run', () => ({ text: 'unhandled command' }))

  const first = await $.command.run({ command: 'research-tally', args: '' })
  const second = await $.command.run({ command: 'research-tally', args: '' })
  expect(first.text).toBe('Observed tool-call attempts: 0')
  expect(second.text).toBe('Observed tool-call attempts: 0')
})

test('counts unequal per-tool totals while preserving arguments and downstream results', async ($, on) => {
  const inputs: string[] = []
  on('tool.call', ($, e) => {
    inputs.push(e.tool === 'Bash' ? e.command : e.file_path)
    return { result: 'downstream-result' }
  })
  on('command.run', () => ({ text: 'unhandled command' }))

  expect(await $.tool.call({ tool: 'Read', file_path: '/work/alpha.txt' })).toEqual({ result: 'downstream-result' })
  expect(await $.tool.call({ tool: 'Bash', command: 'printf demo' })).toEqual({ result: 'downstream-result' })
  expect(await $.tool.call({ tool: 'Read', file_path: '/work/beta.txt' })).toEqual({ result: 'downstream-result' })

  const answer = await $.command.run({ command: 'research-tally', args: '' })
  expect(answer.text).toBe('Observed tool-call attempts: 3\nBash: 1\nRead: 2')
  expect(inputs).toEqual(['/work/alpha.txt', 'printf demo', '/work/beta.txt'])
  expect(answer.text).not.toContain('/work/')
  expect(answer.text).not.toContain('printf demo')
})

test('counts an observed denied attempt without overriding the denial', async ($, on) => {
  on('tool.call', () => ({ deny: 'fixture policy' }))
  on('command.run', () => ({ text: 'unhandled command' }))

  expect(await $.tool.call({ tool: 'Bash', command: 'printf demo' })).toEqual({ deny: 'fixture policy' })
  const answer = await $.command.run({ command: 'research-tally', args: '' })
  expect(answer.text).toBe('Observed tool-call attempts: 1\nBash: 1')
})

test('explicit reset removes previous tools and begins counting from zero', async ($, on) => {
  on('tool.call', () => ({ result: 'ok' }))
  on('command.run', () => ({ text: 'unhandled command' }))

  await $.tool.call({ tool: 'Bash', command: 'printf demo' })
  const reset = await $.command.run({ command: 'research-tally', args: ' reset ' })
  expect(reset.text).toBe('Counter reset. Observed tool-call attempts: 0')
  await $.tool.call({ tool: 'Read', file_path: '/work/after.txt' })
  const answer = await $.command.run({ command: 'research-tally', args: '' })
  expect(answer.text).toBe('Observed tool-call attempts: 1\nRead: 1')
})

test('unknown arguments do not clear data, and unrelated commands pass through', async ($, on) => {
  on('tool.call', () => ({ result: 'ok' }))
  on('command.run', ($, e) => ({ text: 'downstream: ' + e.command }))

  await $.tool.call({ tool: 'Read', file_path: '/work/kept.txt' })
  const invalid = await $.command.run({ command: 'research-tally', args: 'reset-all' })
  expect(invalid.text).toBe('Usage: /research-tally [reset]')
  const unrelated = await $.command.run({ command: 'other-command', args: '' })
  expect(unrelated.text).toBe('downstream: other-command')
  const answer = await $.command.run({ command: 'research-tally', args: '' })
  expect(answer.text).toBe('Observed tool-call attempts: 1\nRead: 1')
})
