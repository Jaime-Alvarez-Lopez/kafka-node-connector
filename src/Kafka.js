'use strict';
const Kafka = require('kafka-node')
const KafkaEmitter = require('./kafkaEmitter')
const {ERRORS} = require('./config')
const {randomId,getId} = require('./utils')
/**
	* Creates a KafkaNode instance
	* @constructor
	* @param {Object} config Additional configs: {name:'KafkaNode',host:'localhost:29092'...}
	*/
const KafkaNode = function (config = {}) {

	const {name,host,connectionTimeout,requestTimeout,maxAsyncRequests} = config

	this.name = name || 'KafkaNode'
	this.host = host || 'localhost:9092'

	this.connectionTimeout = connectionTimeout || 10000
	this.requestTimeout = requestTimeout || 30000
	this.maxAsyncRequests = maxAsyncRequests || 10

	this.client = null

	KafkaEmitter.call(this)

	this.consumers = []

	this.__sync_metadata = () => {
		return new Promise((resolve,reject) => {
			if (this.client) {
				this.client.loadMetadata(() => {
					this.emit('METADATA_OK')
					resolve(true)
				})
			} else {
				this.emit('ERROR','Load metadata')
				reject(false)
			}
		})
	}
	this.__connection_resolve = () => (
		new Promise((resolve,reject) => {
			const client = new Kafka.KafkaClient({kafkaHost: this.host})
			this.emit('WAIT_RESOLVE')
			client.on('ready', () => {
				resolve(client)
			})
			client.on('error',(err) => {
				if (err) {
					this.emit('ERROR',err)
					reject(null)
				}
			})
		})
	)
	this.__filterConsumers = function (id) {
		return this.consumers.filter(c => {
			const key = Object.keys(c)[0]
			return key === id || key.includes(id)
		})
	}
	this.NO_CLIENT_ERROR = ERRORS.NO_CLIENT_ERROR
	this.NO_TOPIC_ERROR = ERRORS.NO_TOPIC_ERROR
	this.MESSAGE_NOT_OBJECT = ERRORS.MESSAGE_NOT_OBJECT
	this.MESSAGES_NOT_ARRAY = ERRORS.MESSAGES_NOT_ARRAY
	this.CONSUMER_ID_NOT_STRING = ERRORS.CONSUMER_ID_NOT_STRING
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
			this.emit('CONNECT_OK',`(${this.name}->${this.host})`)
			await this.__sync_metadata().catch(r => r)
		} else {
			this.emit('CONNECT_NOT_OK',`(${this.name}->${this.host})`)
		}
		resolve(this.client instanceof Kafka.KafkaClient)
	})
}

/**
	* Check if an Array of topics exists
	* @async
	* @param {(string|string[])} topicsName String or string array: ['topic1','topic2']
	* @return {Promise.<Boolean>}
	*/
KafkaNode.prototype.topicsExist = function (topicsName) {
	return new Promise((resolve,reject) => {
		if (this.client) {
			this.client?.topicExists(topicsName,(data) => {
				this.emit('CHECKING_TOPICS')
				if (!(data instanceof Error)) {
					resolve(true)
				} else {
					this.emit('TOPICS_NOT_EXIST',topicsName)
					resolve(false)
				}
			})
		} else {
			this.emit('NO_CLIENT')
			reject(this.NO_CLIENT_ERROR)
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
					this.emit('TOPICS_LIST',Object.keys(res[1].metadata).length > 0?res[1].metadata:'Empty')
					resolve(res[1].metadata)
				}
				if (err) {
					this.emit('ERROR',err)
					reject(false)
				}
			})
		} else {
			this.emit('NO_CLIENT')
			reject(this.NO_CLIENT_ERROR)
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
		const e = await this.topicsExist(topics.map(t => t?.topic))
		if (!e) {
			this.emit('TOPICS_CREATE')
			this.client.createTopics(topics, (err,data) => {
				if (data && !(data instanceof Error)) {
					resolve(true)
				} else {
					console.warn(data)
					resolve(false)
				}
				if (err) {
					this.emit('ERROR',err)
					reject(err)
				}
			})
		} else {
			this.emit('TOPICS_EXIST')
			resolve(false)
		}
	})
}

/**
	* Listen to messages on especific existing topic
	* @param {Object} config Object defining topicName, groupId and partition
	* @param {function} cb Message callback
	*/
KafkaNode.prototype.consumeOnTopic = async function ({topic = 'test',groupId = 'default',partition = 0, consumerId = randomId()},cb) {
	if (this.client) {
		const e = await this.topicsExist([topic])
		if (e) {

			const transformMessage = (m) => ({
				consumerId: consumerId,
				topic: m.topic,
				message: m.value,
				partition: m.partition,
				key: m.key
			})

			const consumer = new Kafka.Consumer(this.client,[{topic:topic,partition: partition}],{groupId: groupId})

			const consumerWithId = {}

			if (typeof consumerId !== 'string') throw new Error(this.CONSUMER_ID_NOT_STRING)

			if (this.__filterConsumers(consumerId).length === 0) {

				consumerWithId[consumerId] = consumer

				this.consumers.push(consumerWithId)
			} else {
				this.emit('CONSUMER_ID',consumerId)
				consumerWithId[randomId()] = consumer

				this.consumers.push(consumerWithId)
			}


			this.emit('CONSUMER_START',`${topic}:${partition}`)

			consumer.on('message',(m) => {
				this.emit('CONSUMER_MESSAGE',topic)

				cb(null,transformMessage(m))
			})

			consumer.on('error',(err) => {
				if (err) {
					cb(err,null)
				}
			})
		} else {
			this.emit('CONSUMER_NOT_A_TOPIC',topic)
			throw new Error(this.NO_TOPIC_ERROR)
		}
	} else {
		this.emit('NO_CLIENT')
		throw new Error(this.NO_CLIENT_ERROR)
	}
}

/**
	* Lists all consumers ids
	* @return {Object} consumersId Consumer's id Array
	*/
KafkaNode.prototype.listConsumers = function () {
	const consumersId = []
	this.consumers.forEach(c => consumersId.push(Object.keys(c)[0]))
	this.emit('CONSUMER_LIST_ID',consumersId)
	return consumersId
}

/**
	* Pauses a running consumer
	* @param {String} id Consumer's id
	*/
KafkaNode.prototype.pauseConsumer = function (id) {
	const consumer = this.__filterConsumers(id)
	if (consumer.length === 0) {
		this.emit('CONSUMER_NOT_PAUSE',id)
		return
	}
	const ID = getId(consumer)
	consumer[0][ID].pause()
	this.emit('CONSUMER_PAUSE',ID)
	return true
}

/**
	* Resumes a paused consumer
	* @param {String} id Consumer's id
	*/
KafkaNode.prototype.resumeConsumer = function (id) {
	const consumer = this.__filterConsumers(id)
	if (consumer.length === 0) {
		this.emit('CONSUMER_NOT_RESUME',id)
		return
	}
	const ID = getId(consumer)
	consumer[0][ID].resume()
	this.emit('CONSUMER_RESUME',ID)
}

/**
	* Removes a consumer
	* @param {String} id Consumer's id
	*/
KafkaNode.prototype.closeConsumer = function (id) {
	const consumer = this.__filterConsumers(id)
	if (consumer.length === 0) {
		this.emit('CONSUMER_NOT_CLOSE',id)
		return
	}
	const ID = getId(consumer)
	consumer[0][ID].pause()
	this.emit('CONSUMER_CLOSE',ID)
	this.consumers = this.consumers.filter(c => Object.keys(c)[0] !== ID)
	return true
}

/**
	*	Send a message to a topic
	* @async
	* @param {Object} config {topic:'test',partition:0,message:'message'||{message:,...}}
	* @return {Promise.<Boolean>}
	*/
KafkaNode.prototype.produceOnTopic = function ({topic = 'test',partition = 0,message = {message:'test'},compression = 0}) {
	return new Promise(async (resolve,reject) => {
		if (this.client) {
			if (Array.isArray(message)) {
				reject(this.MESSAGE_NOT_OBJECT)
				return
			}
			const e = await this.topicsExist([topic])
			if (e) {
				const producer = new Kafka.Producer(this.client)

				const payload = [{
					topic: topic,
					messages: [(typeof message === 'object')?JSON.stringify(message):message],
					partition: partition,
					attributes: compression,
					timeStamp: Date.now()
				}]

				producer.send(payload,(err,data) => {
					if (data && !(data instanceof Error)) {
						this.emit('PRODUCER_START',topic)
						resolve(data)
					}
				})

				producer.on('error',(err) => {
					if (err) {
						this.emit('ERROR',err)
						reject(err)
					}
				})
			} else {
				this.emit('PRODUCER_NOT_A_TOPIC',topic)
				reject(this.NO_TOPIC_ERROR)
			}
		} else {
			this.emit('NO_CLIENT')
			reject(this.NO_CLIENT_ERROR)
		}
	})
}

/**
	*	Send various messages to a topic
	* @async
	* @param {Object} config {topic:'test',partition:0,messages:[{message:,...},{message:,...}]}
	* @return {Promise.<Boolean>}
	*/
KafkaNode.prototype.produceManyOnTopic = function ({topic = 'test',partition = 0,messages = [{message:'test'},{number: 2}],compression = 0}) {
	return new Promise(async (resolve,reject) => {
		if (this.client) {
			if (!Array.isArray(messages)) {
				reject(this.PRODUCER_MANY_NOT_ARRAY)
				return
			}
			const e = await this.topicsExist([topic])
			if (e) {
				const producer = new Kafka.Producer(this.client)

				const payload = [{
					topic: topic,
					messages: [JSON.stringify(messages.flat())],
					partition: partition,
					attributes: compression,
					timeStamp: Date.now()
				}]

				producer.send(payload,(err,data) => {
					if (data && !(data instanceof Error)) {
						this.emit('PRODUCER_MANY_START',topic)
						resolve(data)
					}
				})

				producer.on('error',(err) => {
					if (err) {
						this.emit('ERROR',err)
						reject(err)
					}
				})

			} else {
				this.emit('PRODUCER_NOT_A_TOPIC',topic)
				reject(this.NO_TOPIC_ERROR)
			}
		} else {
			this.emit('NO_CLIENT')
			reject(this.NO_CLIENT_ERROR)
		}
	})

}

module.exports = KafkaNode