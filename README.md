Kakfa-node-connector
====================

Kafka-node-connector is a npm package that easies the use of [kafka-node npm package](https://www.npmjs.com/package/kafka-node)

## Install Kakfa-node-connector
Run:
```bash
npm install kafka-node-connector
```
It will be then accesible in node_modules

## User reference

Instantiate kafka-node-connector:

```javascript
const KafkaConnector = require('kafka-node-connector')

const MyKafka = new KafkaConnector()
```
When instantiting whe can define its configuration. Default values are:
```javascript
const MyKafka = new KafkaConnector({
   name: 'KafkaNode',
   host: 'localhost:9092',
   connectionTimeout: 10000,
   requestTimeout: 30000,
   maxAsyncRequests: 10,
   client: null,
   producer:null,
   consumer:null
})
```
Start the connection:
```javascript
    await MyKafka.KafkaConnect()
    const connection = await MyKafka.KafkaConnect() // True or false
```

List topics:
```javascript
   MyKafka.ListTopics((err,data) => {
       ...
   })
```
TopcisExist:
```javascript
   const exist = MyKafka.TopicsExist(['topic-1','topic-2'])
   // True or false
```

Create topics:
```javascript
   await MyKafka.CreateTopics([
       {
            topic: 'topic-1',
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
            topic: 'topic-2',
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
   const created = await MyKafka.CreateTopics(...) // True or false
```

Consume on a topic. Defaults:
```javascript
    MyKafka.StartListeningOnTopic({
        topic: 'test',
        groupId: 'default'
    }, (error,message) => {
        ...
    })
```

Produce on a topic. Defaults:
```javascript
    MyKafka.SendMessageToTopic({
        topic: 'test',
        groupId: 'default'
    }, (error,message) => {
        ...
    })
```