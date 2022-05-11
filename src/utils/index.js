const {v4} = require('uuid')

exports.randomId = function () {
	return v4().replace(/-+/g,'_')
}
exports.getId = function (consumer) {
	return Object.keys(consumer[0])[0]
}