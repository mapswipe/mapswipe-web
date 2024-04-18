import { expect, test } from 'vitest'
import makeXyzUrl from '@/utils/makeXyzUrl'

const tileServer = {
  apiKey: 'foo',
  url: 'www.tileserver.org/url/{layer}/{z}/{x}/{y}.png?param=1&token={key}',
  wmtsLayerName: 'bar',
}

test('correctly fills in tileserver url placeholders', () => {
  expect(makeXyzUrl(tileServer)).toBe(
    'www.tileserver.org/url/bar/{z}/{x}/{y}.png?param=1&token=foo',
  )
})
