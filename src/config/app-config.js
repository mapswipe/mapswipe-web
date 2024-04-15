const appConfig = {
  logoImgSrc: require("@/assets/img/UEA-Logo_rgb-dark S.png"), // The logo used on the top-right corner of the sidebar and on the header menu
  showInstructionsTooltipsOnFirstLoad: true,
  appLocales: [
    { text: "English US", value: "en-us" },
    { text: "Deutsch DE", value: "de-de" },
  ],
  defaultLocale: "en-us",
  footerAppName: "UndercoverEisAgenten",
  footerDevelopedByLink: "https://heigit.org",
  disableProjectAlreadyCompleted: true,

  firebaseConfig: {
    apiKey: "AIzaSyAUAz-T4WPbIYWW_GRH1uTQDTYCm20xQy0",
    authDomain: "dev-mapswipe.firebaseapp.com",
    databaseURL: "https://dev-mapswipe.firebaseio.com",
    projectId: "dev-mapswipe",
    storageBucket: "dev-mapswipe.appspot.com",
    messagingSenderId: "168934406162",
    appId: "1:168934406162:web:f881c624bcd814d8ddc0cb",
  },

  projectTypes: {
    "1": {
      component: "tiles",
      defaultAnswerLabels: [
        { color: "", label: "no", value: 0 },
        { color: "green", label: "yes", value: 1 },
        { color: "orange", label: "maybe", value: 2 },
        { color: "red", label: "bad imagery", value: 3 },
      ],
    },
    "2": {
      component: "validate",
      defaultAnswerLabels: [
        { color: "green", label: "yes", value: 1 },
        { color: "red", label: "no", value: 2 },
        { color: "orange", label: "offset", value: 3 },
        { color: "gray", label: "not sure", value: 4 },
      ],
    },
    "3": {
      component: "change",
      defaultAnswerLabels: [
        { color: "", label: "no change", value: 0 },
        { color: "green", label: "change", value: 1 },
        { color: "orange", label: "not sure", value: 2 },
        { color: "red", label: "bad imagery", value: 3 },
      ],
    },
    "4": {
      component: "tiles",
      defaultAnswerLabels: [
        { color: "", label: "not complete", value: 0 },
        { color: "green", label: "complete", value: 1 },
        { color: "orange", label: "maybe complete", value: 2 },
        { color: "red", label: "bad imagery", value: 3 },
      ],
    },
  },
  projectFilters: [
    {
      attribute: "projectTopic",
      label: "Topic",
      defaultItems: [],
      multiple: true,
      show: true,
    },
    {
      attribute: "projectRegion",
      label: "Region",
      defaultItems: [],
      multiple: true,
      show: true,
    },
    {
      attribute: "requestingOrganisation",
      label: "Organisation",
      defaultItems: [],
      multiple: true,
      show: true,
    },
    {
      attribute: "status",
      label: "Status",
      defaultItems: [],
      multiple: true,
      show: true,
    },
    {
      attribute: "createdBy",
      label: "Created by",
      defaultItems: [],
      multiple: true,
      show: true,
    },
    {
      attribute: "projectId",
      label: "Project ID",
      defaultItems: [],
      multiple: true,
      show: true,
    },
  ],
  confidenceQuestion: {
    title: "How certain are you?",
    slot: "confidence",
    answers: [
      { label: "Very certain", value: "very_certain" },
      { label: "Certain", value: "certain" },
      { label: "Uncertain", value: "uncertain" },
    ],
  },
  showInactiveProjects: false,
  filterProjectsByLocale: false,
  theme: "UndercoverEisAgenten",
  anonymousSignin: true,
};

export default appConfig;

