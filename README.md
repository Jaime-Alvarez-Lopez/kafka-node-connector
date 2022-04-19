Kakfa-node-connector
====================

Kafka-node-connector is a npm package that easies the use of [kafka-node npm package](https://www.npmjs.com/package/kafka-node)

## Install Kakfa-node-connector
```bash
npm install kafka-node-connector
```

## User reference

Instantiate kafka-node-connector :

```javascript
const {KafkaNodeConnector} = require('kafka-node-connector')

const MyKafka = new KafkaNodeConnector(config)
```

Optionally you can set it's configuration :
```javascript
// config: JSON object. Default values are:
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
await MyKafka.connect().catch(r => r)
// True or false
```

List existing topics :
```javascript
await MyKafka.listTopics().catch(r => r)
// Object containing topics or false
```

Check if an Array of strings as topics names exists :
```javascript
await MyKafka.topicsExist(['topic1','topic2']).catch(r => r)
// True or false
```

Create topics from an Array of objects containing topic and extra configuration.
Note that topics will be checked wether exist or not before creation, so no need to use topicsExist() before :
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
]).catch(r => r)
```

Consume on a topic.
```javascript
MyKafka.consumeOnTopic(config, (error,message) => {
    ...
})
```
Default config for consumer :
```
{
    topic: 'test',
    groupId: 'default',
    partition: 0
}
```
Produce on a topic. Defaults:
```javascript
MyKafka.produceOnTopic(config, (error,message) => {
    ...
})
```
Default config for producer :
```
{
    topic: 'test',
    partition: 0,
    message: 'test'
}
```