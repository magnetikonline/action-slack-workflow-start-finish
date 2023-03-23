'use strict';

const assert = require('assert/strict'),
	lib = require('./../src/lib.js');


(function testCase_parseArgs() {
	// setup mock functions/data
	const mockInputData = {},
		mockCore = {
			getInput: function(key) {
				return mockInputData[key] || '';
			},
			getMultilineInput: function(key) {
				return (mockInputData[key] || '').split('\n');
			},
		};

	function mockInputDataReset() {
		Object.assign(mockInputData,{
			'channel': '#slack-channel',
			'field-list': '',
			'repository': 'owner-name/repository-name',
			'result': '',
			'webhook-url': 'https://hooks.slack.com/services/ABCD/EFGH/12345',
		});
	}
	mockInputDataReset();

	const mockContext = {
		actor: 'magnetikonline',
		eventName: 'push',
		ref: 'refs/heads/main',
		runId: 1226478890,
		runNumber: 1,
		serverUrl: 'https://github.com',
		workflow: '.github/workflows/test.yaml',
	};

	// test: push event
	assert.deepEqual(
		lib.parseArgs(mockCore,mockContext),
		{
			actor: 'magnetikonline',
			customFieldList: [],
			eventName: 'push',
			githubServerUrl: 'https://github.com',
			refData: {
				isTag: false,
				name: 'main',
			},
			repositoryName: 'owner-name/repository-name',
			result: '',
			runId: 1226478890,
			runNumber: 1,
			slackChannel: '#slack-channel',
			slackWebhookUrl: 'https://hooks.slack.com/services/ABCD/EFGH/12345',
			workflowName: 'test.yaml',
		}
	);

	// test: push event - workflow friendly name set
	mockContext.workflow = 'Test workflow';
	assert.deepEqual(
		lib.parseArgs(mockCore,mockContext),
		{
			actor: 'magnetikonline',
			customFieldList: [],
			eventName: 'push',
			githubServerUrl: 'https://github.com',
			refData: {
				isTag: false,
				name: 'main',
			},
			repositoryName: 'owner-name/repository-name',
			result: '',
			runId: 1226478890,
			runNumber: 1,
			slackChannel: '#slack-channel',
			slackWebhookUrl: 'https://hooks.slack.com/services/ABCD/EFGH/12345',
			workflowName: 'Test workflow',
		}
	);

	// test: push event - result mode set
	mockInputDataReset();
	mockInputData.result = 'success|failure|cancelled|skipped'; // overall result is 'failure'
	assert.deepEqual(
		lib.parseArgs(mockCore,mockContext),
		{
			actor: 'magnetikonline',
			customFieldList: [],
			eventName: 'push',
			githubServerUrl: 'https://github.com',
			refData: {
				isTag: false,
				name: 'main',
			},
			repositoryName: 'owner-name/repository-name',
			result: 'failure',
			runId: 1226478890,
			runNumber: 1,
			slackChannel: '#slack-channel',
			slackWebhookUrl: 'https://hooks.slack.com/services/ABCD/EFGH/12345',
			workflowName: 'Test workflow',
		}
	);

	// test: push event - git tag
	mockContext.ref = 'refs/tags/my-first-tag-name';
	mockInputData.result = '';
	assert.deepEqual(
		lib.parseArgs(mockCore,mockContext),
		{
			actor: 'magnetikonline',
			customFieldList: [],
			eventName: 'push',
			githubServerUrl: 'https://github.com',
			refData: {
				isTag: true,
				name: 'my-first-tag-name',
			},
			repositoryName: 'owner-name/repository-name',
			result: '',
			runId: 1226478890,
			runNumber: 1,
			slackChannel: '#slack-channel',
			slackWebhookUrl: 'https://hooks.slack.com/services/ABCD/EFGH/12345',
			workflowName: 'Test workflow',
		}
	);

	// test: pull request event
	mockInputDataReset();
	mockContext.eventName = 'pull_request';
	mockContext.ref = 'refs/pull/1/merge';
	mockContext.payload = {
		pull_request: {
			head: {
				ref: 'feature-branch',
			},
			number: 65,
			title: 'Pull request title',
		},
	};

	assert.deepEqual(
		lib.parseArgs(mockCore,mockContext),
		{
			actor: 'magnetikonline',
			customFieldList: [],
			eventName: 'pull_request',
			githubServerUrl: 'https://github.com',
			refData: {
				isTag: false,
				name: 'feature-branch',
			},
			pullRequestNumber: 65,
			pullRequestTitle: 'Pull request title',
			repositoryName: 'owner-name/repository-name',
			result: '',
			runId: 1226478890,
			runNumber: 1,
			slackChannel: '#slack-channel',
			slackWebhookUrl: 'https://hooks.slack.com/services/ABCD/EFGH/12345',
			workflowName: 'Test workflow',
		}
	);

	// test: error states for inputs
	mockInputDataReset();
	mockInputData.channel = '';
	assert.throws(
		function() { lib.parseArgs(mockCore,mockContext); },
		{ message: 'input Slack channel not set' }
	);

	mockInputDataReset();
	mockInputData.repository = 'invalid';
	assert.throws(
		function() { lib.parseArgs(mockCore,mockContext); },
		{ message: 'input GitHub repository has unexpected format' }
	);

	mockInputDataReset();
	mockInputData.result = 'unknown';
	assert.throws(
		function() { lib.parseArgs(mockCore,mockContext); },
		{ message: 'input result value of [unknown] unexpected' }
	);

	mockInputDataReset();
	mockInputData['webhook-url'] = '';
	assert.throws(
		function() { lib.parseArgs(mockCore,mockContext); },
		{ message: 'input Slack Incoming Webhook URL has unexpected format' }
	);
})();


(function testCase_parseArgsCustomFieldList() {
	// test: no custom fields defined
	assert.deepEqual(
		lib.parseArgsCustomFieldList(['']),
		[]
	);

	// test: custom fields defined - with blank lines and invalid entries
	assert.deepEqual(
		lib.parseArgsCustomFieldList([
			'title|value',
			'title2|value2',
			'',
			'invalid',
			' title3 | value3 ',
			'',
			'invalid',
		]),
		[
			['title','value'],
			['title2','value2'],
			['title3','value3'],
		]
	);
})();


(function testCase_parseArgsResult() {
	// test: unknown result values throws error
	assert.throws(
		function() { lib.parseArgsResult('foo'); },
		{ message: 'input result value of [foo] unexpected' }
	);

	assert.throws(
		function() { lib.parseArgsResult('success|blurg'); },
		{ message: 'input result value of [blurg] unexpected' }
	);

	// test: various job result collections and overall result for workflow determined
	assert.equal(lib.parseArgsResult('success'),'success');
	assert.equal(lib.parseArgsResult('success|success'),'success');
	assert.equal(lib.parseArgsResult('failure'),'failure');
	assert.equal(lib.parseArgsResult('cancelled'),'cancelled');
	assert.equal(lib.parseArgsResult('success|failure'),'failure');
	assert.equal(lib.parseArgsResult('failure|success'),'failure');
	assert.equal(lib.parseArgsResult('success|cancelled'),'cancelled');
	assert.equal(lib.parseArgsResult('cancelled|success'),'cancelled');
	assert.equal(lib.parseArgsResult('success|skipped'),'success');
	assert.equal(lib.parseArgsResult('success|cancelled|failure'),'failure');
})();


(function testCase_buildSlackPayload() {
	const args = {
		actor: 'magnetikonline',
		customFieldList: [],
		eventName: 'push',
		githubServerUrl: 'https://github.com',
		refData: {
			isTag: false,
			name: 'main',
		},
		repositoryName: 'magnetikonline/action-slack-workflow-start-finish',
		result: '',
		runId: 1232306257,
		runNumber: 35,
		workflowName: 'Example',
	};

	// test: workflow started
	assert.deepEqual(
		lib.buildSlackPayload('#test-channel',args),
		{
			channel: '#test-channel',
			color: '#ffa500',
			fallback: 'Workflow "Example" has started',
			fields: [
				{
					short: false,
					title: 'Repository',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish|magnetikonline/action-slack-workflow-start-finish>',
				},
				{
					short: false,
					title: 'Branch',
					value: '`main`',
				},
				{
					short: true,
					title: 'Workflow',
					value: 'Example',
				},
				{
					short: true,
					title: 'Run number',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish/actions/runs/1232306257|35>',
				},
				{
					short: true,
					title: 'Triggered by',
					value: '<https://github.com/magnetikonline|magnetikonline>',
				},
				{
					short: true,
					title: 'Trigger event',
					value: '`push`',
				},
			],
			pretext: 'Workflow has *started*',
		}
	);

	// test: workflow success
	args.result = 'success';
	assert.deepEqual(
		lib.buildSlackPayload('#test-channel',args),
		{
			channel: '#test-channel',
			color: '#2eb886',
			fallback: 'Workflow "Example" has finished successfully',
			fields: [
				{
					short: false,
					title: 'Repository',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish|magnetikonline/action-slack-workflow-start-finish>',
				},
				{
					short: false,
					title: 'Branch',
					value: '`main`',
				},
				{
					short: true,
					title: 'Workflow',
					value: 'Example',
				},
				{
					short: true,
					title: 'Run number',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish/actions/runs/1232306257|35>',
				},
				{
					short: true,
					title: 'Triggered by',
					value: '<https://github.com/magnetikonline|magnetikonline>',
				},
				{
					short: true,
					title: 'Trigger event',
					value: '`push`',
				},
			],
			pretext: 'Workflow has *finished successfully*',
		}
	);

	// test: workflow success - git tag
	args.refData.isTag = true;
	assert.deepEqual(
		lib.buildSlackPayload('#test-channel',args),
		{
			channel: '#test-channel',
			color: '#2eb886',
			fallback: 'Workflow "Example" has finished successfully',
			fields: [
				{
					short: false,
					title: 'Repository',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish|magnetikonline/action-slack-workflow-start-finish>',
				},
				{
					short: false,
					title: 'Tag',
					value: '`main`',
				},
				{
					short: true,
					title: 'Workflow',
					value: 'Example',
				},
				{
					short: true,
					title: 'Run number',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish/actions/runs/1232306257|35>',
				},
				{
					short: true,
					title: 'Triggered by',
					value: '<https://github.com/magnetikonline|magnetikonline>',
				},
				{
					short: true,
					title: 'Trigger event',
					value: '`push`',
				},
			],
			pretext: 'Workflow has *finished successfully*',
		}
	);

	// test: associated to pull request
	args.pullRequestNumber = 123;
	args.pullRequestTitle = 'My pull request <>&'; // testing escape characters
	args.refData.isTag = false;
	assert.deepEqual(
		lib.buildSlackPayload('#test-channel',args),
		{
			channel: '#test-channel',
			color: '#2eb886',
			fallback: 'Workflow "Example" has finished successfully',
			fields: [
				{
					short: false,
					title: 'Repository',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish|magnetikonline/action-slack-workflow-start-finish>',
				},
				{
					short: false,
					title: 'Branch',
					value: '`main`',
				},
				{
					title: 'Pull request',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish/pull/123|My pull request &lt;&gt;&amp;>',
					short: false,
				},
				{
					short: true,
					title: 'Workflow',
					value: 'Example',
				},
				{
					short: true,
					title: 'Run number',
					value: '<https://github.com/magnetikonline/action-slack-workflow-start-finish/actions/runs/1232306257|35>',
				},
				{
					short: true,
					title: 'Triggered by',
					value: '<https://github.com/magnetikonline|magnetikonline>',
				},
				{
					short: true,
					title: 'Trigger event',
					value: '`push`',
				},
			],
			pretext: 'Workflow has *finished successfully*',
		}
	);
})();
