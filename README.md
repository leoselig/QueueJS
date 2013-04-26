#QueueJS

A powerful yet easy to use queueing library for JavaScript

##Basic Usage

After including the library you will find `queuejs` attached to your global namespace.
Note that this object already is a `Queue` itself.

To enqueue tasks to a queue, the object to be queued must implement a method called `executeQueueTask(resolve)` where `resolve` is a callback function to be evoked when the task is finished.

A simple queueing of a task could look as below:

```
var queueable = {
	executeQueueTask: function(resolve) {
		// Do stuff
		resolve();
	}
}
queuejs.enqueue(queueable);
```

### Sub Queues

You can add subordinated `Queue` objects to each `Queue` object whose instance you can access.

To do so you have to register the sub queue as follows:

```
var ajaxQueue = queuejs.registerSubQueue('ajax', {});
var uploadQueue = ajaxQueue.registerSubQueue('upload', {});
```

To access sub queues even in deeper structures simply do the following:

```
queuejs.getById('ajax.upload');

// OR
ajaxQueue.getById('upload');
```

Note that due to this queue access the queue name may contain any character except a `.`.

###Configuration

Each queue can be configured when it is registered by passing a literal as the second argument to `registerSubQueue()`.
Also, you may want to change a queue's configuration later which you can easily accomplish by calling:

```
queue.setConfig({
	// Config key-value-pairs
});
```

In the following you will find all currently supported config keys ellaborated.

####maxParallels
This defines how many parallel queueables are executed at once in the according queue and all their sub queues.
Logically, setting a higher value for this than for a parent queue limits the maximum number
of parallel execution to the limit specified in the parent's config.

##Testing

All tests can be run by simply opening the HTML test page in the test directory. All tests are written based on jasmine (JS testing framework).

## Contributions

I am looking forward to constructive feedback, issue postings and PULLrequests. 
