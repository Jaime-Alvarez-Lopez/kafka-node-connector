'ts-check'

const Kafka = require('kafka-node')

/**
	* Creates a KafkaNode object
	* @constructor
	* @param {Object} config Additional configs: {name:'KafkaNode',host:'localhost:29092'...}
	*/
const KafkaNode = function ({name,host,connectionTimeout,requestTimeout,maxAsyncRequests,client,producer,consumer}) {

	this.name = name ||'KafkaNode'
	this.host = host || 'localhost:9092'

	this.connectionTimeout = connectionTimeout || 10000
	this.requestTimeout = requestTimeout || 30000
	this.maxAsyncRequests = maxAsyncRequests || 10

	this.client = client || null
	this.producer = producer || null
	this.consumer = consumer || null

	this.__sync_metadata = () => {
		return new Promise((resolve,reject) => {
			if (this.client) {
				this.client.loadMetadata(() => {
					console.log('metadata loaded')
					resolve(true)
				})
			} else {
				reject(false)
			}

		})
	}

	this.__connection_resolver = () => (
		new Promise((resolve,reject) => {
			const client = new Kafka.KafkaClient({kafkaHost: this.host})
			client.on('ready', () => {
				resolve(client)
			})
			client.on('error',(err) => {
				if (err) {
					reject(null)
				}
			})
		})
	)
}

/**
	* Connect to a Kafka broker defined in setConfig (default localhost:29092)
	* @return {boolean} The result
	*/
KafkaNode.prototype.Connect = async function () {
	return new Promise(async (resolve,reject) => {
		this.client = await this.__connection_resolver().catch(e => e)
		this.client !== null?
		console.info(`===> CONNECTED TO KAFKA (${this.name}->${this.host})`)
		:
		console.warn(`===> ERROR CONNECTING (${this.name}->${this.host}).`)
		await this.__sync_metadata().catch(r => r)
		resolve(this.client instanceof Kafka.KafkaClient)
	})
}

/**
	* Check if an array of topics exists
	* @param {Object} topicsName An array of topics: ['topic1','topic2']
	* @return {boolean} Wether exist or not
	*/
KafkaNode.prototype.TopicsExist = function (topicsName) {
	return new Promise((resolve,reject) => {
		this.client?.topicExists(topicsName,(data) => {
			if (data instanceof Error) {
				console.log(data[1])
				reject(false)
			} else {
				resolve(true)
			}
			console.log('topics exist',{d:data})
		})
	})
}

/**
	* List existing topics
	* @param {function} cb Callback function
	*/
KafkaNode.prototype.ListTopics = function () {
	return new Promise((resolve,reject) => {
		if (this.client) {
			console.info('===> Listing topics...')
			this.admin = this.admin || new Kafka.Admin(this.client)
			this.admin.listTopics((err,res) => {
				if (res) {
					console.log(res[1].metadata)
					resolve(res[1].metadata)
				}
				if (err) {
					console.log(err)
					reject(err)
				}
			})
		} else {
			console.info('===> No connection aviable')
			reject(false)
		}
	})
}

/**
	* Create an array of topics if they not exist
	* @param {Object} topics An array of objects with topic
	* @return {boolean} True if created
	*/
KafkaNode.prototype.CreateTopics = function (topics) {
	return new Promise((resolve,reject) => {
		const e = this.TopicsExist(topics)
		console.log('exist',e)
		if (!e) {
			this.admin = this.admin || new Kafka.Admin(this.client)
			this.admin?.createTopics(topics, (err,data) => {
				console.info('===> Creating topics...')
				if (data) {
					console.log({topicsCreated: data})
					resolve(true)
				}
				if (err) {
					console.log(err.error)
					reject(false)
				}
			})
		} else {
			console.log('===> Topics already exist')
			reject(false)
		}
	})
}

/**
	* Listen to messages on especific existing topic
	* @param {Object} topicName Object defining topicName and groupId
	* @param {function} cb Message callback
	*/
KafkaNode.prototype.StartListeningOnTopic = function ({topic,groupId},cb) {
	if (this.TopicsExist([topic])) {
		this.consumer = this.consumer ||  new Kafka.Consumer(this.client,[{topic:topic || 'test'}],{groupId: groupId || 'default'})

		this.consumer?.on('message',(m) => {
			cb(null,m)
		})

		this.consumer?.on('error',(err) => {
			if (err) {
				cb(err,null)
			}
		})
	}
}

/**
	*	Send a message to a topic
	* @param {Object} config {topic:'test',partition:0,message:'message'||{message:...}}
	* @param {function} cb Message callback
	*/
KafkaNode.prototype.SendMessageToTopic = function ({topic,partition,message},cb) {
	this.producer = this.producer || new Kafka.Producer(this.client)

	const payload = [{
		topic: topic || 'test',
		messages: [(typeof message === 'object')?JSON.stringify({payload: message}):message],
		partition: partition || 0,
		attributes: 2,
		timeStamp: Date.now()
	}]
	console.log(payload)
	this.producer?.send(payload,(err,data) => {
		cb(null,data)
	})

	this.producer?.on('error',(err) => {
		if (err) {
			cb(err,null)
		}
	})
}

/**
	*	Send various messages to a topic
	* @param {Object} message {topic:'test',partition:0,messages:[{message:...},{message:...}]}
	* @param {function} cb Message callback
	*/
KafkaNode.prototype.SendSeveralMessagesToTopic = function ({topic,partition,messages},cb) {
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
			cb(err,null)
		}
	})
}

module.exports = KafkaNode