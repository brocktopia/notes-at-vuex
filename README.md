# notes-at-vuex Sample App

> A note taking app that retrieves and stores location data for each note. This is a fork of 
[github.com/brocktopia/notes-at](https://github.com/brocktopia/notes-at) using Vuex for state management of data.

## Dependencies

**Server-side**
* [Node.js](https://nodejs.org)
* [Express](https://github.com/expressjs/express)
* [MongoDB](https://www.mongodb.com/)
* [Mongoose](https://github.com/Automattic/mongoose)

**Client-side**
* [VueJS 2.x](https://github.com/vuejs/vue)
* [Vue-router](https://github.com/vuejs/vue-router)
* [Vuex](https://vuex.vuejs.org/)
* [axios](https://github.com/mzabriskie/axios)
* [vue-googlemaps](https://github.com/Akryum/vue-googlemaps)
* [Moment.js](https://momentjs.com/)
* [Google API Key](https://developers.google.com/maps/documentation/javascript/get-api-key) (for Maps JavaScript API &amp; Places API for Web)

## Configuration

You will need to set your Google API Key in [./src/google-maps-config.js](src/google-maps-config.js).
```js
let config = {
  key: 'your-google-api-key',
  libraries: 'places'
};
```
You may also need to configure [./server.js](server.js) if your instance of MongoDB is running on a port
other than the default port `27017` or your local server is something other than `http://localhost`.
```js
// mongoose instance connection url connection
mongoose.Promise = global.Promise;
//mongoose.set('debug', true);
mongoose.connect('mongodb://localhost:27017/' + dbName, {'useNewUrlParser': true});//
```

## Build Setup

``` bash
# install dependencies
npm install

# start express RESTful service layer at localhost:3030
npm run start

# build project (drop -dev for production build)
npm run build-dev

# serve with hot reload at localhost:8080
npm run dev
```

## Resources

* [RESTfulAPITutorial](https://github.com/generalgmt/RESTfulAPITutorial) Provided the underpinnings of my API services
* [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) Documentation on navigator.geolocation from Mozilla.
* [Google Maps API Reference](https://developers.google.com/maps/documentation/javascript/reference/map)
* [Google Places Service API Reference](https://developers.google.com/maps/documentation/javascript/reference/places-service)

## Notes on Vuex

There was a bit of a learning curve figuring Vuex out. Partly because it's conceptually so simple but also so highly 
abstracted. I decided to move all of the services into Vuex and call them in actions which I'm happy with. Having moved
all of that logic out of the components makes them cleaner, simpler and easier to read. One of the things I thought I'd 
get with Vuex I ended up being wrong about. The immutability of the store data is more of a principle than a feature. You 
can use strict mode in development to throw errors if data is mutated outside of a commit, but you can't roll back data changed. 
I was hoping it would allow me to roll back changes from edits that were cancelled, but that's not a feature. Instead I simply made 
clones of the data and commit them after the service call saves the data. One thing I did get was data that's easily accessible 
across all of my components and elimination of the need to reload data from services. 

With a single store, accessible across all components, I feel like I could now decompose my application into simpler component
parts. I'd set up all of my note views inside of my notebook view in order to use the data that was rooted in the notebook 
view. Now that the store is in place I feel like I should move the note views out on the same level as the notebook view and 
encapsulate all of their logic within them. Since data being passed into the note views are using Vue props, 
I had those child view components calling modifications logic back up to the notebook component, as a centralized controller, because 
the props values are only reactive if changed in the object that set them as props. With a central store, not only can notes
easily exist outside of the notebook context, but even within that context they could be completely self-contained.

Even in this relatively simple application Vuex ended up making a lot of sense. 

## Done

See the branch [decompose](https://github.com/brocktopia/notes-at-vuex/tree/decompose).  
See the branch [testing](https://github.com/brocktopia/notes-at-vuex/tree/testing).

## To-Do Roadmap

* Put it up on [Firebase](https://firebase.google.com/) behind authentications and with user accounts
* Implement as Progressive Web App

## Author
Brock Henderson [@brocktopia](https://github.com/brocktopia/) ||
[brocktopia.com](https://brocktopia.com)
