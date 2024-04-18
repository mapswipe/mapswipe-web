import { expect, test } from 'vitest'
import buildTasks from '@/utils/buildTasks'
import buildTasksData from '@/tests/fixtures/build-tasks-data'

test('correctly builds tasks from project and group', () => {
  expect(buildTasks(buildTasksData.project, buildTasksData.group)).toEqual(buildTasksData.tasks)
})
