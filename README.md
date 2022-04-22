Kakfa-node-connector
====================

[Kafka-node-connector](https://www.npmjs.com/package/kafka-node-connector) is a npm package that easies the use of [kafka-node](https://www.npmjs.com/package/kafka-node)

## Install Kakfa-node-connector
```bash
npm install kafka-node-connector
```

## User reference

Instantiate kafka-node-connector :

```javascript
const {KafkaNodeConnector} = require('kafka-node-connector')

const MyKafka = new KafkaNodeConnector(config)

// Default config values are:
{
    name: 'KafkaNode',
    host: 'localhost:9092',
    connectionTimeout: 10000,
    requestTimeout: 30000,
    maxAsyncRequests: 10
}
```

Start the connection :
```javascript
await MyKafka.connect()
// True or false
```

List existing topics :
```javascript
await MyKafka.listTopics()
// Object containing topics or false
```

Check if an Array of strings as topics names exists :
```javascript
await MyKafka.topicsExist(['topic1','topic2'])
// True or false
```

Create topics from an Array of objects containing topic and extra configuration.
Note that topics will be checked wether exist or not before creation, so no need to use topicsExist() :
```javascript
await MyKafka.createTopics([
   {
        topic: 'topic1',
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
        topic: 'topic2',
        partitions: 1,
        replicationFactor: 1,
        configEntries: [
            {
                name: 'compression.type',
                value: 'gzip'
            }
        ]
    }
])
```

Consume on a topic :
```javascript
MyKafka.consumeOnTopic(config, (error,message) => {
    ...
})

// config : options for consumer
{
    topic: 'test',
    groupId: 'default',
    partition: 0
}

// Raises Error if no client or topic not exist
```

Produce a message on a topic :
```javascript
await MyKafka.produceOnTopic(config)

// config : options for producer
{
    topic: 'test',
    partition: 0,
    message: {message:'test'}
}

// Raises Error if message is of type Array and if no client or topic aviable
```

Produce many messages on a topic :
```javascript
await MyKafka.produceManyOnTopic(config)

// config : options for producer
{
    topic: 'test',
    partition: 0,
    messages: [{message:'message 1'},{number: 2}]
}

// Raises Error if messages is not of type Array and if no client or topic aviable
```