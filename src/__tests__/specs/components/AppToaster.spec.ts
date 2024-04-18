import { shallowMount } from '@vue/test-utils'
import { vuetify } from '@/plugins/vuetify'
import AppToaster from '@/components/AppToaster.vue'

describe('AppToaster', () => {
  let wrapper = null
  beforeEach(() => {
      wrapper = shallowMount(AppToaster, {
        global: { plugins: [vuetify] },
        slots: { content: 'test' },
      })
  })
  afterEach(() => {
    wrapper.unmount()
  })
  it('properly renders content slot', () => {
    expect(wrapper.text()).toContain('test')
  })
})
