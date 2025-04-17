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
  },
  '5': {
    name: 'Media',
    component: 'mediaProject',
  },
  '6': {
    name: 'Digitize',
    component: 'digitizeProject',
  },
  '7': {
    name: 'Street',
    component: 'streetProject',
  },
  '8': {
    name: 'Conflation',
    component: 'conflationProject',
    prioritizeNearlyCompletedGroups: true,
  },
}

export default projectTypes
