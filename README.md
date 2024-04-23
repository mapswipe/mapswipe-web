# MapSwipe Web App

Welcome to [MapSwipe4Web](https://web.mapswipe.org). This web application complements the existing [mobile app](https://github.com/mapswipe/mapswipe) and allows users to contribute to [MapSwipe](https://mapswipe.org) from their browser. It was initially developed by [HeiGIT](https://www.heigit.org) with the support of the [Humanitarian OpenStreetMap Team](https://www.hotosm.org/).

## Developing, Building, and Contributing to MapSwipe

If you'd like to modify and improve the MapSwipe web app, read through the following to get familiar with the project. Please also read [CONTRIBUTING](CONTRIBUTING.md).

## Technology Used

The app is written in [Vue](https://vuejs.org). It uses the same backend as the mobile app:
1. Firebase provides the backend database. It is protected with security rules so that users and contributors to this open source project can not cause damage.
1. The [workers](https://github.com/mapswipe/python-mapswipe-workers) on the backend are running on Google Cloud and handle pre-processing and post-processing the data.

## Project Setup

```sh
yarn
```

### Compile and Hot-Reload for Development

```sh
yarn dev
```

### Lint with [ESLint](https://eslint.org/)

```sh
yarn lint
```

### Format with [prettier](https://prettier.io)

```sh
yarn format
```

### Deployment

On any push to the main branch of this repository, the most recent **tagged** version **and** the latest version are built and deployed to [web.mapswipe.org](https://web.mapswipe.org) and [web.mapswipe.org/dev](https://web.mapswipe.org/dev) respectively (see [deployment workflow](.github/workflows/deploy.yml)).
