const EventEmitter = require('events')
const {EVENTS} = require('./config')

const KafkaEmitter = function () {
	this.emitter = new EventEmitter()

	this.events = EVENTS

	this.events.forEach(ev => {
		this.emitter.on(ev.event, (value) => {
			console.info(ev.message,value)
		})
	})

	this.emit = function (event,value = '') {
		this.emitter.emit(event,value)
	}
}

module.exports = KafkaEmitter