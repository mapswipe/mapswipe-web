import buildTasks from '@/utils/buildTasks'
import buildTasksData from '@/__tests__/fixtures/build-tasks-data'

test('correctly builds tasks from project and group', () => {
  expect(buildTasks(buildTasksData.project, buildTasksData.group)).toEqual(buildTasksData.tasks)
})
