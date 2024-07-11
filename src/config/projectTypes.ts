const projectTypes = {
  '1': {
    name: 'Find',
    component: 'findProject',
    description:
      'Projects of this type consist of several task groups. Each task group is a certain number of spatially adjacent aerial images. The height of each image corresponds to a distance of ${40075016.686 /  2**project.zoomLevel} meter, the exact width depends on the latitude. In our terminology, each image is one task. As a user, you can contribute to this project in the following way: Your assignment is to look for ${project.lookFor} in each of the image tiles. If you do not see a ${project.lookFor}, you do not need to do anything. If you see a ${project.lookFor}, click on the image once. The image will get a transparent green overlay, representing the answer "yes". If you are not quite sure if there is a ${project.lookFor} in the image, click the image twice. The image will get a transparent yellow overlay, representing the answer "maybe". If the image is of bad quality not allowing you to assess whether there are ${project.lookFor} in it or not (e.g. because of cloud cover), click the image three times. The image will get a transparent red overlay, representing the answer "bad imagery". If you click yet another time, the cycle starts from the beginning. The answer will revert to "no" (no overlay). Each task will be seen and classified independendly by a ${project.verificationNumber} users. The end result for one task is based on the assessment of all the users, so it does not matter that much if one user does not get it right. You can select multiple tiles at the same time and provide answers to the selected images simultaneously. In order to do that, either right click the images to select them or click the circle icon on the image. Any click on a selected image will now apply to all selected tiles. In order to have a closer look, click the magnifying glass icon in the upper right corner of an image tile. This will open a larger version of the image. To close it, just click anywhere outside the enlarged image. To know where on earth you are currently mapping, click the globe icon. This will open an interactive map indicating your current mapping area. Click the arrow buttons or use the cursor keys to move forward or backward within this task group. Once you have seen and classified all images in the task group -- and only then --, you can submit your results (your contribution) by clicking the Save button. After clicking the Save button, you can decide to continue mapping a new task group of this project (unless you have completed all available task groups) or to go back to the project page and select a different project to contribute to. If you want to leave the current project, click on "Home" or "Projects" in the navigation bar and confirm that you want to leave. But be careful -- you will lose all your current answers if you leave before saving',
  },
  '2': {
    name: 'Validate',
    component: 'validateProject',
    description:
      'Projects of this type consist of several task groups. Each task group has a certain number of features to validate. In our terminology, each feature to validate is one task. In this specific project, the features we validate are ${project.lookFor}. As a user, you can contribute to this project in the following way: Your assignment is to compare the ${project.lookFor} against the background imagery. Does the shape actually correctly outline a ${project.lookFor} in the imagery? If yes, click the "Yes" button or hit number key 1 on your keyboard. If the shape does not match a ${project.lookFor} at all in the image, click "No" or use the number 2 key. If you are not sure or there is cloud cover or any other problem with the image, click "Not sure" or use number 3 key. If the ${project.lookFor} outline is correct, but not properly aligned with the imagery, click "Offset" or use number 4 key. To know where on earth you are currently mapping, click the globe icon. This will open an interactive map indicating your current mapping area. Each ${project.lookFor} will be seen and validated independendly by a ${project.verificationNumber} users. The end result for one task is based on the assessment of all the users, so it does not matter that much if one user does not get it right. After you have provided your answer, click the arrow buttons or use the cursor keys to move forward or backward within this task group. Once you have seen and validated all ${project.lookFor} in the task group -- and only then --, you can submit your results (your contribution) by clicking the Save button. After clicking the Save button, you can decide to continue mapping a new task group of this project (unless you have completed all available task groups) or to go back to the project page and select a different project to contribute to. If you want to leave the current project, click on "Home" or "Projects" in the navigation bar and confirm that you want to leave. But be careful -- you will lose all your current answers if you leave before saving.',
  },
  '3': {
    name: 'Compare',
    component: 'compareProject',
    description:
      'Projects of this type consist of several task groups. Each task group has a certain task. Each task consists in two different images of the same area -- a "before" and an "after" image. The height of each image corresponds to a distance of ${40075016.686 /  2**project.zoomLevel} meter, the exact width depends on the latitude. As a user, you can contribute to this project in the following way: Your assignment is to compare ${project.lookFor} in the two images. Is there no visbile change between the images? Click "No change" or hit the number key 1. If there is visible change, click "Change" (or number key 2). If you are not sure, click "Not sure" (or number key 3). If you cannot properly assess whether there is change because of image quality issues (e.g. cloud cover), click "Bad imagery" (or number key 4) Each task will be seen and assessed independendly by a ${project.verificationNumber} users. The end result for one task is based on the assessment of all the users, so it does not matter that much if one user does not get it right. After you have provided your answer, click the arrow buttons or use the cursor keys to move forward or backward within this task group. Once you have seen and assessed all tasks in the task group -- and only then --, you can submit your results (your contribution) by clicking the Save button. After clicking the Save button, you can decide to continue mapping a new task group of this project (unless you have completed all available task groups) or to go back to the project page and select a different project to contribute to. If you want to leave the current project, click on "Home" or "Projects" in the navigation bar and confirm that you want to leave. But be careful -- you will lose all your current answers if you leave before saving.',
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
