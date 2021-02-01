const express   = require( 'express' );
const app       = express();
const router    = express.Router();

console.log("Loaded index.");

// middleware that is specific to this router
router.use(function timeLog (req, res, next) {
    console.log('Time: ', Date.now())
    next()
  })
  // define the home page route
  router.get('/', function (req, res) {
    res.send('Birds home page')
  })
  // define the about route
  router.get('/about', function (req, res) {
    res.send('About birds')
  })
  
  module.exports = router