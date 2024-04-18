import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { vuetify } from '@/main'
import AppToaster from '@/components/AppToaster.vue'

describe('AppToaster', () => {
  it('renders properly content slot', () => {
    console.log('test')
    const wrapper = shallowMount(AppToaster, {
      global: { plugins: [vuetify] },
      slots: { content: 'test' },
    })
    expect(wrapper.text()).toContain('test')
  })
})
