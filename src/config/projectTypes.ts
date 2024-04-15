const projectTypes = {
  '1': {
    name: 'Find',
    component: 'findProject',
  },
  '2': {
    name: 'Validate',
    component: 'validateProject',
  },
  '3': {
    name: 'Compare',
    component: 'compareProject',
  },
  '4': {
    name: 'Completeness',
    component: 'findProject',
    defaultOptions: [
      { color: '', label: 'incomplete', value: 0 },
      { color: 'green', label: 'complete', value: 1 },
      { color: 'orange', label: 'maybe', value: 2 },
      { color: 'red', label: 'bad imagery', value: 3 },
    ],
  },
  '5': {
    name: 'Media',
    component: 'mediaProject',
  },
  '6': {
    name: 'Digitize',
    component: 'digitizeProject',
  },
}

export default projectTypes
