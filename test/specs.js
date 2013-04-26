describe('Basics', function () {
	it('namespace is correctly set up', function () {
		expect(queuejs).toEqual(jasmine.any(Object));
	});
});

describe('Single Queue', function () {
	it('executes all Queueables', function () {
		var enqueue = function (left) {
			var queueable = {
				executeQueueTask: function (resolve) {
					expect(queuejs.getNumberExecuting()).toEqual(1);
					resolve();
				}
			}

			spyOn(queueable, 'executeQueueTask').andCallThrough();

			queuejs.enqueue(queueable);

			expect(queueable.executeQueueTask)
				.toHaveBeenCalledWith(jasmine.any(Function));

			(left > 0) && enqueue(left - 1);
		}
		enqueue(5);
	});

	it('restricts parallel execution', function () {
		var number = 5;
		var maxParallels = 2;
		var called = 0;
		queuejs.setConfig({maxParallels: maxParallels});

		runs(function () {
			var createDelayedExecutor = function (delay) {
				return function (resolve) {
					called++;
					window.setTimeout(resolve, delay);
				}
			}

			var enqueue = function (left) {
				var queueable = {
					executeQueueTask: createDelayedExecutor(left * 50)
				}

				spyOn(queueable, 'executeQueueTask').andCallThrough();

				queuejs.enqueue(queueable);

				if (left > (number - maxParallels)) {
					expect(queueable.executeQueueTask)
						.toHaveBeenCalledWith(jasmine.any(Function));
				}

				(left > 1) && enqueue(left - 1);
			}
			enqueue(number);

			expect(queuejs.getNumberExecuting()).toBe(maxParallels);
		});

		waitsFor(function () {
			return called === number;
		}, 'Queueables did not resolve fast enough', 1000);

		runs(function () {

		});
	});
});

describe('Nested Queues', function () {
	it('executes tasks in sub queues', function() {
		queuejs.setConfig({maxParallels: 1});
		var numberSQs = 5;
		var numberTasks = 5;
		var called = 0;

		runs(function() {
			var testSubQueue = function(sqLeft) {
				var sq = queuejs.registerSubQueue('test' + (numberSQs - sqLeft), {});

				var enqueue = function (left) {
					var queueable = {
						executeQueueTask: function (resolve) {
							expect(sq.getNumberExecuting()).toEqual(1);
							called++;
							resolve();
						}
					}

					spyOn(queueable, 'executeQueueTask').andCallThrough();

					sq.enqueue(queueable);

					(left > 0) && enqueue(left - 1);
				}
				enqueue(numberTasks - 1);
				(sqLeft > 0) && testSubQueue(sqLeft - 1);
			}
			testSubQueue(numberSQs - 1);
		});

		waitsFor(function () {
			return called === (numberSQs * numberTasks);
		}, 'Queueables in nested queues did not resolve fast enough', 1000);

		runs(function() {

		});
	});
});