const EventEmitter = require('events')
const {emitterEvents} = require('./config/emitterEvents')

const KafkaEmitter = function () {
	this.emitter = new EventEmitter()

	this.events = emitterEvents

	this.events.forEach(ev => {
		this.emitter.on(ev.event, (value) => {
			console.info(ev.message,value)
		})
	})
}


KafkaEmitter.prototype.emit = function (event,value = '') {
	this.emitter.emit(event,value)
}

module.exports = KafkaEmitter