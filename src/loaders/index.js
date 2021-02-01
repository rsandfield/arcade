const expressLoader = require('./express');

module.exports = async ({app}) => {
    await expressloader({app});
    console.log("Express loaded")
}