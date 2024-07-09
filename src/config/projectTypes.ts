const projectTypes = {
  '1': {
    name: 'Find',
    component: 'findProject',
    description: `Projects of this type consist of several task groups. Each task group is a certain number of spatially adjacent images. In our terminology, each image is one task. As a user, you can contribute to this project in the following way: Your assignment is to look for the specific feature of interest of the project in each of the image tiles. If you do not see a building, you do not need to do anything. If you see a building, click on the image once. The image will get a transparent green overlay, representing the answer "yes". If you are not quite sure if there is a building in the image, click the image twice. The image will get a transparent yellow overlay, representing the answer "maybe". If the image is of bad quality not allowing you to assess whether there are buildings in it or not (e.g. because of cloud cover), click the image three times. The image will get a transparent red overlay, representing the answer "bad imagery". If you click yet another time, the answer will revert to "no" (no overlay), and so on. Each task will be seen and classified by a certain number of users. If you get it wrong, there are other users to correct the assessment, and vice versa. You can select multiple tiles at the same time and provide answers to the selected images simultaneously. In order to do that, either right click the images to select them or click the circle icon on the image.Any click on a selected image will now apply to all selected tiles. In order to have a closer look, click the magnifying glass icon in the upper right corner of an image tile. This will open a larger version of the image. To close it, just click anywhere outside the enlarged image. To know where on earth you are currently mapping, click the globe icon. This will open an interactive map indicating your current mapping area. Use arrow buttons or cursor keys to forward or backward within this task group. Once you have seen and classified all images in the task group, you can submit your results (your contribution) by clicking the Save button. Consequently, you can decide to continue mapping a new task group of this project (unless you have completed all available task groups) or to go back to the project selection page.  If you want to leave the current project, click on "Home" or "Projects" in the navigation bar and confirm that you want to leave. All your current answers will be lost, however.`
  },
  '2': {
    name: 'Validate',
    component: 'validateProject',
    description: 'The project',
  },
  '3': {
    name: 'Compare',
    component: 'compareProject',
    description: 'The project',
  },
  '4': {
    name: 'Completeness',
    component: 'findProject',
    description: 'The project',
  },
  '5': {
    name: 'Media',
    component: 'mediaProject',
    description: 'The project',
  },
  '6': {
    name: 'Digitize',
    component: 'digitizeProject',
    description: 'The project',
  },
}

export default projectTypes
