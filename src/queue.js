(function () {

	var utils = {
		extend: function () {
			var base = arguments[0];
			for (var i = 1; i < arguments.length; i++) {
				for (var name in arguments[i]) {
					base[name] = arguments[i][name];
				}
			}
			return base;
		}
	}

	var defaultConfig = {
		maxParallels: 1
	}

	var states = {
		WAITING: 10,
		EXECUTING: 11
	}

	var Queue = function (name, parent, specConfig, score) {
		var config = utils.extend({}, defaultConfig, specConfig);
		var subQueues = {};
		var subQueueNames = [];
		var lastSubQueue = null;
		var queueables = [];
		var counter = 0;
		var this_ = this;

		this.enqueue = function (queueable) {
			var id = counter++;
			queueables[id] = {
				queueable: queueable,
				state: states.WAITING
			};
			this.checkForExecution();
		}

		this.canExecute = function () {
			return (config.maxParallels > this.getNumberExecuting())
				&& ((parent === null) || parent.canExecute());
		}

		this.getById = function(id) {
			if(id.charAt(id.length - 1) === '.') {
				return null;
			}
			var idSplit = id.split('.');
			if(typeof subQueues[idSplit[0]] === 'undefined') {
				return null;
			}
			var nextIdPart = idSplit.slice(1, idSplit.length).join('.');
			if((nextIdPart.length === 0)) {
				return subQueues[idSplit[0]].obj;
			}
			return subQueues[idSplit[0]].obj.getById(nextIdPart);
		}

		this.getNumberExecuting = function () {
			return this.getNumberHavingState(states.EXECUTING);
		}

		this.getNumberWaiting = function (notDeep) {
			return this.getNumberHavingState(states.WAITING, notDeep);
		}

		this.getNumberHavingState = function (state, notDeep) {
			var number = 0;
			for (var i in queueables) {
				if (queueables[i].state == state) {
					number++;
				}
			}
			if (!notDeep) {
				for (var j in subQueues) {
					number += subQueues[j].obj.getNumberHavingState(state);
				}
			}
			return number;
		}

		/**
		 * Registers a new sub queue of this queue once
		 * Can receive a dedicated configuration
		 *
		 * @param {String} name Name for the sub queue
		 * @param {Object} queueConfig
		 * @return {Object} Wrapper object for new queue
		 * @throws {Exception} If queue name already exists or is invalid
		 */
		this.registerSubQueue = function (name, queueConfig) {
			if (typeof subQueues[name] !== 'undefined') {
				throw 'Queue \'' + subQueues[name].obj.getIdentifier() + '\' cannot be registered again';
			}
			var nameMatch = name.match(/[^\.]+/);
			if((nameMatch === null) || (nameMatch[0] !== name)) {
				throw 'Queue cannot be named \'' + name + '\'';
			}
			var subQueueScore = getAverageScore();
			subQueues[name] = new Queue(name, this, queueConfig, subQueueScore);
			subQueueNames.push(name);
			return subQueues[name].obj;
		}

		this.getIdentifier = function () {
			var id = name;
			if (parent !== null) {
				id = parent.getIdentifier() + '.' + name;
			}
			return id;
		}

		this.getParentQueue = function () {
			return parent;
		}

		this.setConfig = function (addConfig) {
			utils.extend(config, addConfig);
		}

		this.checkForExecution = function () {
			if (parent === null) {
				var privilegedQueue = getPrivilegedSubQueue();
				if((privilegedQueue !== null)
					&& this.canExecute()) {
					privilegedQueue.execute();
				}
			}
			else {
				parent.checkForExecution();
			}
		}

		var getWrapped = function() {
			return {
				obj: this_,
				score: score,
				execute: execute
			}
		}

		var getAverageScore = function () {
			var sum = 0;
			for (var i = 0; i < subQueueNames.length; i++) {
				if (subQueueNames[i] === lastSubQueue) {
					sum += subQueues[subQueueNames[i]].score;
				}
			}
			return Math.round(sum / i);
		}

		/**
		 * Returns a sub queue that has waiting queueables
		 * and that currently has the lowest score
		 *
		 * @return {Object} the wrapper object containing the sub queue
		 * @private
		 */
		var getPrivilegedSubQueue = function () {
			var privileged = null;
			var curSubQueue;
			for (var i = 0; i < subQueueNames.length; i++) {
				curSubQueue = subQueues[subQueueNames[i]];
				if (curSubQueue.obj.getNumberWaiting() > 0) {
					if ((privileged === null)
						|| (subQueues[subQueueNames[i]].score < privileged.score)) {
						privileged = subQueues[subQueueNames[i]];
					}
				}
			}
			if (this_.getNumberWaiting(true) > 0) {
				if ((privileged === null)
					|| (score < privileged.score)) {
					privileged = getWrapped();
				}
			}
			return privileged;
		}

		var createDequeue = function (id) {
			return function () {
				delete queueables[id];
				this_.checkForExecution();
			}
		}

		var execute = function () {
			var privileged = getPrivilegedSubQueue();
			if(privileged.obj === this_) {
				for (var id in queueables) {
					if (queueables[id].state === states.WAITING) {
						queueables[id].state = states.EXECUTING;
						queueables[id].queueable.executeQueueTask(
							createDequeue(id));
						break;
					}
				}
			}
			else {
				privileged.execute();
			}

		}

		return getWrapped();
	}

	var queuejs = new Queue('queuejs', null, {}).obj;

	queuejs.setDefaultConfig = function (addConfig) {
		utils.extend(defaultConfig, addConfig);
	}

	queuejs.Queueable = {
		executeQueueTask: function (resolve) {
			resolve();
		}
	}

	window.queuejs = queuejs;
})
	();