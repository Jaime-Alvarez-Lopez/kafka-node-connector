const EventEmitter = require('events')
const {EVENTS} = require('./config')

const KafkaEmitter = function () {
	this.events = EVENTS

	this.emit = function (event,value = '') {
		const ev = this.events.filter(e => e.event === event)
		console.info(ev[0].message,value)
		return
	}
}



module.exports = KafkaEmitter