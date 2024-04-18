import { mount } from '@vue/test-utils'
import { vuetify } from '@/plugins/vuetify'
import AppToaster from '@/components/AppToaster.vue'

describe('AppToaster', () => {
  it('properly renders content slot', () => {
    const wrapper = mount(AppToaster, {
      global: { plugins: [vuetify] },
      slots: { content: 'test' },
    })
    expect(wrapper.text()).toContain('test')
  })
})
