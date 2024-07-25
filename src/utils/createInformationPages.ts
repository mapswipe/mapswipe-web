const createInformationPages = (tutorial, project, fallbackFn) => {
  let informationPages = []
  if (tutorial) {
    // We want to show the information pages for a project
    informationPages = tutorial.informationPages || fallbackFn(tutorial)
  } else {
    // We want to show the information pages for a tutorial.
    informationPages = project.informationPages || fallbackFn(project)
  }
  informationPages?.sort((a, b) => a.pageNumber - b.pageNumber)
  return informationPages
}

export default createInformationPages
