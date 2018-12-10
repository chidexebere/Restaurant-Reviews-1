
## Restaurant Reviews App Stage 2 

Stage 2 makes improvements from Stage 1 of the App. It includes a build system that will automatically serve the optimized site from a different data source. It also includes PWA and performance improvements.


### Overview

* Restaurant data is pulled from a development server, the JSON response is parsed, and the information is used to render the appropriate sections of the application UI.
* JSON responses are cached using the IndexedDB API.
* Gulp build serves the optimized site.
* The application maintains a responsive design on mobile, tablet and desktop viewports.
* The client application still works offline with improved PWA capabilities.
* Accessibility improvements.
* Performance improvement. 


## Running using local machine

You will need this Node development server https://github.com/udacity/mws-restaurant-stage-2, follow the instructions on the README for getting the server up and running locally on your computer

###### Install project dependancies
```Install project dependancies
# npm install
```

### Serve optimized site

Run the following command to build & serve the optimized site.

```bash
gulp serve:dist
```

This will start the server at `http://localhost:8000`.

### Build System
If you want to develop you can use the following commands.

#### Start the dev server

```bash
gulp serve
```

This will start the server at `http://localhost:8001`.

Changes can be made to the files in the `app/` directory. The browser will reload the changes on each file save.

#### Build & Optimize

```bash
gulp
```

This will build and optimize the project ready for deployment. It will output to the `dist/` folder



