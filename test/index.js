const KafkaBuilder = require('../src/KafkaBuilder')

console.log('running test')

;(async  () => {
	await KafkaBuilder({name:'test',host:'broker:29092'},[
		{
			topic:'test2',
			partitions: 1,
			replicationFactor: 1,
			configEntries: [
				{
					name: 'compression.type',
					value: 'gzip'
				}
			]
		},
		{
			topic:'test3',
			partitions: 1,
			replicationFactor: 1,
			configEntries: [
				{
					name: 'compression.type',
					value: 'gzip'
				}
			]
		}
	],{
		topic: 'test2',
		message: {
			message: 'tu mama'
		}
	},
	{
		topic:'test2',
	},(err,data) => {
		console.log('listened')
		console.log(err,data)
	},(err,data) => {
		console.log('sended')
		console.log(err,data)
	})
})()