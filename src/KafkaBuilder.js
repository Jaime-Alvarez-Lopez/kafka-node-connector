const KafkaConnector = require('./Kafka')


const KafkaBuilder = async function (connectionConfig,topics,producerConfig,consumerConfig,consumerCallback,producerCallback) {
	try {
		const Kafka = new KafkaConnector(connectionConfig)

		const connected = await Kafka.Connect().catch(r => r)

		if (connected) {
			await Kafka.ListTopics().catch(r => r)

			const created = await Kafka.CreateTopics(topics).catch(r => r)
			console.log('created',created)

			// const exist = await Kafka.TopicsExist(['test2','test3']).catch(r => r)
			// console.log('topics exist???',exist)
			await Kafka.ListTopics().catch(r => r)
			await Kafka.ListTopics().catch(r => r)
		}
	} catch(e) {
		console.log(e);
	}

}

module.exports = KafkaBuilder