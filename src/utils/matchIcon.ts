type IconLookup = {
  [key: string]: string
}

const iconLookup: IconLookup = {
  'add-outline': 'mdi-plus',
  'alert-outline': 'mdi-exclamation',
  'ban-outline': 'mdi-cancel',
  'checkmark-outline': 'mdi-check',
  'close-outline': 'mdi-close',
  'egg-outline': 'mdi-egg-outline',
  'ellipse-outline': 'mdi-ellipse-outline',
  'flag-outline': 'mdi-flag-outline',
  'hand-left-outline': 'mdi-hand-back-left-outline',
  'hand-right-outline': 'mdi-hand-back-right-outline',
  'happy-outline': 'mdi-emoticon-happy-outline',
  'heart-outline': 'mdi-heart-outline',
  'help-outline': 'mdi-help',
  'information-outline': 'mdi-information-outline',
  'prism-outline': 'mdi-pyramid',
  'refresh-outline': 'mdi-refresh',
  'remove-outline': 'mdi-minus',
  'sad-outline': 'mdi-emoticon-sad-outline',
  'search-outline': 'mdi-magnify',
  'shapes-outline': 'mdi-shape',
  'square-outline': 'mdi-square-outline',
  'star-outline': 'mdi-star-outline',
  'thumbs-down-outline': 'mdi-thumb-down-outline',
  'thumbs-up-outline': 'mdi-thumb-up-outline',
  'triangle-outline': 'mdi-triangle-outline',
  'warning-outline': 'mdi-alert-outline',
}

const matchIcon = (icon: string): string | undefined => {
  return iconLookup[icon]
}

export default matchIcon
