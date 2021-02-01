const express = require( 'express' );
const app     = express();
const router  = express.Router();
const fs      = require( 'fs' ) ;

// Read each file in the routes directory
fs.readdirSync( __dirname + '/routes' ).forEach( function( route ) {
  // Strip the .js suffix
  route = route.split( '.' )[ 0 ] ;
  // Ignore index (i.e. this file)
  console.log( 'Loading route ' + route + '...' ) ;
  // Mount router
  app.use( require( __dirname + '/routes/' + route + '.js' ) ) ;
} ) ;

module.exports = router ;