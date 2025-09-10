import { getInstruction } from "./common"
import type { Tutorial } from "./types"

export function createFallbackInformationPages(tutorial: Tutorial) {
  if (tutorial.exampleImage1 && tutorial.exampleImage2 && (tutorial.projectInstruction || tutorial.lookFor)) {
    return [
      {
        blocks: [
          {
            blockNumber: 1,
            blockType: 'text',
            textDescription: getInstruction(
              tutorial.lookFor,
              tutorial.projectInstruction,
              tutorial.projectType,
            ),
          },
          {
            blockNumber: 2,
            blockType: 'text',
            textDescription: 'From the ground, it looks like this:',
          },
          {
            blockNumber: 3,
            blockType: 'image',
            image: tutorial.exampleImage1,
          },
          {
            blockNumber: 4,
            blockType: 'text',
            textDescription:
            'But the images you will see will show it from above, and it looks like this:',
          },
          {
            blockNumber: 5,
            blockType: 'image',
            image: tutorial.exampleImage2,
          },
        ],
        pageNumber: 1,
        title: 'What to look for',
      },
    ]
  } else {
    return undefined
  }
}
