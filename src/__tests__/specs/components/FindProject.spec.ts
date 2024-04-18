import { shallowMount } from '@vue/test-utils'
import { vuetify } from '@/plugins/vuetify'
import FindProject from '@/components/FindProject.vue'
import findProjectData from '@/__tests__/fixtures/find-project-data'

describe('FindProject', () => {
  let wrapper = null
  beforeEach(() => {
    wrapper = shallowMount(FindProject, {
      global: { 
        plugins: [vuetify],
        mocks: { $t: key => key },
        provide: {
          saveResults: () => true,
          showSnackbar: () => true,
        },
        directives: {
          shortkey: () => true
        },
      },
      propsData: {
        group: findProjectData.group,
        project: findProjectData.project,
        tasks: findProjectData.tasks,
      },
    })
  })
  afterEach(() => {
    wrapper.unmount()
  })
  it('correctly initialises results', () => {
    expect(Object.values(wrapper.vm.results).every(value => value == wrapper.vm.options[0].value)).toBeTruthy()
    expect(Object.keys(wrapper.vm.results)).toStrictEqual(wrapper.vm.tasks.map(t => t.taskId))
  })
  it('correctly initialises page', () => {
    expect(wrapper.vm.page).toStrictEqual(findProjectData.initialPage)
  })
})

describe('FindProject with custom options', () => {
  let wrapper = null
  beforeEach(() => {
    wrapper = shallowMount(FindProject, {
      global: { 
        plugins: [vuetify],
        mocks: { $t: key => key },
        provide: {
          saveResults: () => true,
          showSnackbar: () => true,
        },
        directives: {
          shortkey: () => true
        },
      },
      propsData: {
        group: findProjectData.group,
        project: findProjectData.project,
        tasks: findProjectData.tasks,
        options: findProjectData.customOptions,
      },
    })
  })
  afterEach(() => {
    wrapper.unmount()
  })
  it('correctly intialises results with custom options', () => {
    expect(Object.values(wrapper.vm.results).every(value => value == findProjectData.customOptions[0].value)).toBeTruthy()
    expect(Object.keys(wrapper.vm.results)).toStrictEqual(wrapper.vm.tasks.map(t => t.taskId))
  })
})
