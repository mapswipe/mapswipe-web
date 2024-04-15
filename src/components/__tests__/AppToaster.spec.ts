import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { vuetify } from '@/main'
import AppToaster from '../AppToaster.vue'

describe('AppToaster', () => {
  it('renders properly content slot', () => {
    const wrapper = mount(AppToaster, {
      global: { plugins: [vuetify] },
      slots: { content: 'test' },
    })
    expect(wrapper.text()).toContain('test')
  })
})
