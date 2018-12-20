
## Restaurant Reviews App Stage 3 

Stage 3 makes improvements from Stage 1 and Stage 2 of the App. It includes a form to allow users to create their own reviews. If the app is offline, the form will defer updating to the remote database until a connection is established. It also includes performance improvements.


### Overview

* Restaurant data is pulled from a development server, the JSON response is parsed, and the information is used to render the appropriate sections of the application UI.
* JSON responses are cached using the IndexedDB API.
* Gulp build serves the optimized site.
* A form to allow users to create their own reviews.
* The client application still works.
* Performance improvements. 


## Running using local machine

You will need this Node development server https://github.com/udacity/mws-restaurant-stage-3, follow the instructions on the README for getting the server up and running locally on your computer

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



