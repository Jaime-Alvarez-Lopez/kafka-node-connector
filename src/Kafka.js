'use strict';

const Kafka = require('kafka-node')
const KafkaEmitter = require('./kafkaEmitter')


/**
	* Creates a KafkaNode instance
	* @constructor
	* @param {Object} config Additional configs: {name:'KafkaNode',host:'localhost:29092'...}
	*/
const KafkaNode = function (config) {

	const {name,host,connectionTimeout,requestTimeout,maxAsyncRequests} = config

	this.name = name || 'KafkaNode'
	this.host = host || 'localhost:9092'

	this.connectionTimeout = connectionTimeout || 10000
	this.requestTimeout = requestTimeout || 30000
	this.maxAsyncRequests = maxAsyncRequests || 10

	this.topics = []

	this.client = null
	this.producer = null
	this.consumer = null

	this.emitter = new KafkaEmitter()

	this.__sync_metadata = () => {
		return new Promise((resolve,reject) => {
			if (this.client) {
				this.client.loadMetadata(() => {
					this.emitter.emit('METADATA_OK')
					resolve(true)
				})
			} else {
				this.emitter.emit('ERROR','Load metadata')
				reject(false)
			}

		})
	}
	this.__connection_resolve = () => (
		new Promise((resolve,reject) => {
			const client = new Kafka.KafkaClient({kafkaHost: this.host})
			this.emitter.emit('WAIT_RESOLVE')
			client.on('ready', () => {
				resolve(client)
			})
			client.on('error',(err) => {
				if (err) {
					this.emitter.emit('ERROR',err)
					reject(null)
				}
			})
		})
	)
}

/**
	* Connect to a Kafka broker (default localhost:9092)
	* @async
	* @return {Promise.<Boolean>}
	*/
KafkaNode.prototype.connect = async function () {
	return new Promise(async (resolve,reject) => {
		this.client = await this.__connection_resolve().catch(e => e)
		if (this.client !== null) {
			this.emitter.emit('CONNECT_OK',`(${this.name}->${this.host})`)
			await this.__sync_metadata().catch(r => r)
		} else {
			this.emitter.emit('CONNECT_NOT_OK',`(${this.name}->${this.host})`)
		}
		resolve(this.client instanceof Kafka.KafkaClient)
	})
}

/**
	* Check if an array of topics exists
	* @async
	* @param {(string|string[])} topicsName String or string array: ['topic1','topic2']
	* @return {Promise.<Boolean>}
	*/
KafkaNode.prototype.topicsExist = function (topicsName) {
	return new Promise((resolve,reject) => {
		if (this.client) {
			this.client?.topicExists(topicsName,(data) => {
				if (!(data instanceof Error)) {
					resolve(true)
				} else {
					this.emitter.emit('TOPICS_NOT_EXIST',topicsName)
					reject(false)
				}
			})
		} else {
			this.emitter.emit('NO_CLIENT')
		}
	})
}

/**
	* List existing topics
	* @async
	* @return {Promise.<Boolean>}
	*/
KafkaNode.prototype.listTopics = function () {
	return new Promise((resolve,reject) => {
		if (this.client) {
			this.admin = this.admin || new Kafka.Admin(this.client)
			this.admin.listTopics((err,res) => {
				if (res) {
					this.emitter.emit('TOPICS_LIST',Object.keys(res[1].metadata).length > 0?res[1].metadata:'Empty')
					resolve(res[1].metadata)
				}
				if (err) {
					this.emitter.emit('ERROR',err)
					reject(false)
				}
			})
		} else {
			this.emitter.emit('NO_CLIENT')
			reject(false)
		}
	})
}

/**
	* Create an array of topics if they not exist
	* @async
	* @param {Array} topics An array of objects with topic and config
	* @return {Promise.<Boolean>}
	*/
KafkaNode.prototype.createTopics = function (topics) {
	return new Promise(async (resolve,reject) => {
		const e = await this.topicsExist(topics.map(t => t?.topic)).catch(r => r)
		this.emitter.emit('TOPICS_CREATE')
		if (!e) {
			this.topics = topics
			this.client.createTopics(topics, (err,data) => {
				if (data && !(data instanceof Error)) {
					resolve(true)
				} else {
					console.log(data)
					reject(false)
				}
				if (err) {
					this.emitter.emit('ERROR',err)
					reject(false)
				}
			})
		} else {
			this.emitter.emit('TOPICS_EXIST')
			reject(false)
		}
	})
}

/**
	* Listen to messages on especific existing topic
	* @param {Object} config Object defining topicName, groupId and partition
	* @param {function} cb Message callback
	*/
KafkaNode.prototype.consumeOnTopic = async function ({topic,groupId,partition},cb) {
	if (this.client) {
		const e = await this.topicsExist(topic).catch(r => r)
		if (e) {
			this.emitter.emit('CONSUMER_START',topic)
			this.consumer = this.consumer ||  new Kafka.Consumer(this.client,[{topic:topic || 'test',partition: partition || 0}],{groupId: groupId || 'default'})

			this.consumer?.on('message',(m) => {
				this.emitter.emit('CONSUMER_MESSAGE',topic)
				cb(null,m)
			})

			this.consumer?.on('error',(err) => {
				if (err) {
					cb(err,null)
				}
			})
		} else {
			this.emitter.emit('CONSUMER_NOT_A_TOPIC',topic)
		}
	} else {
		this.emitter.emit('NO_CLIENT')
	}
}

/**
	*	Send a message to a topic
	* @param {Object} config {topic:'test',partition:0,message:'message'||{message:...}}
	* @param {function} cb Message callback
	*/
KafkaNode.prototype.produceOnTopic = async function ({topic,partition,message = 'test'},cb) {
	if (this.client) {
		const e = await this.topicsExist(topic).catch(r => r)
		if (e) {
			this.producer = this.producer || new Kafka.Producer(this.client)

			const payload = [{
				topic: topic || 'test',
				messages: [(typeof message === 'object')?JSON.stringify({payload: message}):message],
				partition: partition || 0,
				attributes: 2,
				timeStamp: Date.now()
			}]

			this.producer?.send(payload,(err,data) => {
				this.emitter.emit('PRODUCER_START',topic)
				cb(null,data)
			})

			this.producer?.on('error',(err) => {
				if (err) {
					this.emitter.emit('ERROR',err)
					cb(err,null)
				}
			})
		} else {
			this.emitter.emit('PRODUCER_NOT_A_TOPIC',topic)
		}
	} else {
		this.emitter.emit('NO_CLIENT')
	}
}

/**
	*	Send various messages to a topic
	* @param {Object} config {topic:'test',partition:0,messages:[{message:...},{message:...}]}
	* @param {function} cb Message callback
	*/
KafkaNode.prototype.sendManyToTopic = function ({topic,partition,messages},cb) {
	this.producer = this.producer || new Kafka.Producer(this.client)

	const payload = [{
		topic: topic,
		messages: [JSON.stringify(messages)],
		partition: partition,
		attributes: 2,
		timeStamp: Date.now()
	}]

	this.producer?.send(payload,(err,data) => {
		cb(null,data)
	})

	this.producer?.on('error',(err) => {
		if (err) {
			this.emitter.emit('ERROR',err)
			cb(err,null)
		}
	})
}

module.exports = KafkaNode