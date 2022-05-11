Kakfa-node-connector
====================

Kafka-node-connector is a npm package that easies the use of [kafka-node](https://www.npmjs.com/package/kafka-node).

## Install Kakfa-node-connector
```bash
npm install kafka-node-connector
```

## User reference

Instantiate kafka-node-connector :

```javascript
const {KafkaNodeConnector} = require('kafka-node-connector')

const MyKafka = new KafkaNodeConnector(config)

// config : Object with configuration. Defaults:
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
// Returns True or false
```

List existing topics :
```javascript
await MyKafka.listTopics()
// Returns Object containing topics or false
```

Check if an Array of strings as topics names exists :
```javascript
await MyKafka.topicsExist(['topic1','topic2'])
// Returns True or false
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
        partitions: 2,
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

Consume on a topic. Especify a String as consumerId in the config object, to be able to pause, resume or close the consumer referencing that ID. If not defined, consumerId will be asigned a random ID :
```javascript
MyKafka.consumeOnTopic(config, (error,message) => {
    ...
})

// config : Object with configuration. Defaults:
{
    topic: 'test',
    groupId: 'default',
    partition: 0,
    consumerId: uuidv4
}
// If there's an error, message is null and vice versa

// Raises Error if consumerId is not of type String
// Raises Error if no client
// Raises Error if topic not exist
```

Pause consumer :
```javascript
MyKafka.pauseConsumer(id)

// id: String, the consumerId
```

Resume consumer :
```javascript
MyKafka.resumeConsumer(id)

// id: String, the consumerId
```

Close a consumer :
```javascript
MyKafka.closeConsumer(id)

// id: String, the consumerId
```

List consumers IDs :
```javascript
MyKafka.listConsumers()
// Returns Array containing Strings of Consumers IDs
```

Produce a message on a topic :
```javascript
await MyKafka.produceOnTopic(config)

// config : Object with configuration. Defaults:
{
    topic: 'test',
    partition: 0,
    message: {message:'test'},
    compression: 0
    // 0: no compression
    // 1: gzip
}
// Raises Error if message is of type Array
// Raises Error if no client aviable
// Raises Error if topic not exist
```

Produce many messages on a topic :
```javascript
await MyKafka.produceManyOnTopic(config)

// config : Object with configuration. Defaults:
{
    topic: 'test',
    partition: 0,
    messages: [{message:'message 1'},{number: 2}],
    compression: 0
    // 0: no compression
    // 1: gzip
}

// Raises Error if messages is not of type Array
// Raises Error if no client aviable
// Raises Error if topic not exist
```