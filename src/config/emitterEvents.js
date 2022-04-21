exports.emitterEvents = [
	{event:'WAIT_RESOLVE',message:'===> Waiting to resolve...'},
	{event:'CONNECT_OK',message:'===> Connected to Kafka'},
	{event:'CONNECT_NOT_OK',message:'===> Error connecting to Kafka'},
	{event:'METADATA_OK',message:'===> Metadata loaded'},
	{event:'NO_CLIENT',message:'===> Error: No client aviable'},
	{event:'TOPICS_LIST',message:'===> Listing topics...'},
	{event:'TOPICS_CREATE',message:'===> Creating topics...'},
	{event:'TOPICS_EXIST',message:'===> Topics already exist'},
	{event:'TOPICS_NOT_EXIST',message:'===> Topics not exist'},
	{event:'CONSUMER_START',message:'===> Listening on topic'},
	{event:'CONSUMER_MESSAGE',message:'===> Message received on topic'},
	{event:'CONSUMER_NOT_A_TOPIC',message:`===> Cant't listen on topic, doesn't exist:`},
	{event:'PRODUCER_START',message:'===> Sending message to topic'},
	{event:'PRODUCER_MANY_START',message:'===> Sending messages to topic'},
	{event:'PRODUCER_NOT_A_TOPIC',message:`===> Cant't send to topic, doesn't exist:`},
	{event:'ERROR',message:'===> Unexpected error:'}
]
