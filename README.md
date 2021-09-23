# GitHub Action Slack workflow start finish

Action designed for posting Slack messages via an [incoming webhook](https://api.slack.com/messaging/webhooks) to denote the start and/or end of a Workflow run and the resulting job(s) status.

Offers a simple and opinionated output, with the ability to append custom fields/values (such as build output preview URLs, generated file sizes, etc.) onto generated messages.

## Usage

Single job workflow implementation:

```yaml
jobs:
  main:
    name: Single job
    runs-on: ubuntu-latest
    steps:
      - name: Slack message start
        uses: magnetikonline/action-slack-workflow-start-finish@v1
        with:
          channel: '#target-channel'
          webhook-url: https://hooks.slack.com/services/...
      - name: Checkout source
        uses: actions/checkout@v2

      # -- insert job steps here --

      - name: Slack message finish
        if: always()
        uses: magnetikonline/action-slack-workflow-start-finish@v1
        with:
          channel: '#target-channel'
          result: ${{ job.status }}
          webhook-url: https://hooks.slack.com/services/...
```

Multiple job workflow:

```yaml
jobs:
  slack-message-start:
    name: Slack message start
    runs-on: ubuntu-latest
    steps:
      - name: Slack message
        uses: magnetikonline/action-slack-workflow-start-finish@v1
        with:
          channel: '#target-channel'
          webhook-url: https://hooks.slack.com/services/...

  first:
    name: First job
    runs-on: ubuntu-latest
    steps:
      # -- insert job steps here --

  second:
    name: Second job
    runs-on: ubuntu-latest
    steps:
      # -- insert job steps here --

  nth-job:
    name: nth job
    runs-on: ubuntu-latest
    steps:
      # -- insert job steps here --

  slack-message-finish:
    name: Slack message finish
    if: always()
    needs:
      # note: list *all* jobs defined above
      - slack-message-start
      - first
      - second
      - nth-job
    runs-on: ubuntu-latest
    steps:
      - name: Slack message
        uses: magnetikonline/action-slack-workflow-start-finish@v1
        with:
          channel: '#target-channel'
          result: ${{ join(needs.*.result,'|') }} # final results of all jobs
          webhook-url: https://hooks.slack.com/services/...
```

The action will determine overall status of the workflow as follows:

- If all jobs succeeded - `success`.
	- **Note:** A skipped job is still considered succeeded.
- If one or more jobs cancelled - `cancelled` - _unless..._
- If _any_ job has failed, overall workflow `failure`.

Custom fields can be appended to the message via the `field-list:` input property:

```yaml
jobs:
  main:
    name: Single job
    runs-on: ubuntu-latest
    steps:

      # -- insert job steps here --

      - name: Slack message finish
        if: always()
        uses: magnetikonline/action-slack-workflow-start-finish@v1
        with:
          channel: '#target-channel'
          field-list: |
            Total file size|${{ property.size.value }}KB
            Preview deployed website|<https://hostname.com/preview/...|Click here>
          result: ${{ job.status }}
          webhook-url: https://hooks.slack.com/services/...
```

## Example message

![preview](https://user-images.githubusercontent.com/1818757/133388692-fc2383a0-aa03-45d1-aca0-cea0a191d730.png)
