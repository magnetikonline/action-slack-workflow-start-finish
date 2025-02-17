# GitHub Action Slack workflow start finish

[![Test](https://github.com/magnetikonline/action-slack-workflow-start-finish/actions/workflows/test.yaml/badge.svg)](https://github.com/magnetikonline/action-slack-workflow-start-finish/actions/workflows/test.yaml)

Action designed for posting Slack messages via an [incoming webhook](https://api.slack.com/messaging/webhooks) to denote the start and/or end of a Workflow run and the overall status.

Offers a minimal and opinionated output, but with the ability to append custom fields (such as build output URLs or generated file sizes) onto messages.

- [Usage](#usage)
	- [Custom message fields](#custom-message-fields)
- [Overall workflow status decision tree](#overall-workflow-status-decision-tree)
- [Example message](#example-message)

## Usage

Single job workflow:

```yaml
jobs:
  main:
    name: Single job
    runs-on: ubuntu-latest
    steps:
      - name: Slack message start
        uses: magnetikonline/action-slack-workflow-start-finish@v2
        with:
          channel: '#target-channel'
          webhook-url: https://hooks.slack.com/services/...
      - name: Checkout source
        uses: actions/checkout@v4

      # -- insert job steps here --

      - name: Slack message finish
        if: always()
        uses: magnetikonline/action-slack-workflow-start-finish@v2
        with:
          channel: '#target-channel'
          result: ${{ job.status }} # final result of job
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
        uses: magnetikonline/action-slack-workflow-start-finish@v2
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
        uses: magnetikonline/action-slack-workflow-start-finish@v2
        with:
          channel: '#target-channel'
          result: ${{ join(needs.*.result,'|') }} # final results of all jobs
          webhook-url: https://hooks.slack.com/services/...
```

Message only for workflow cancelled or failure with specific branch:

```yaml
jobs:
  main:
    name: Message on job failure
    runs-on: ubuntu-latest
    steps:
      - name: Checkout source
        uses: actions/checkout@v4

      # -- insert job steps here --

      - name: Slack message failure
        if: (cancelled() || failure()) && (github.ref == 'refs/heads/main')
        uses: magnetikonline/action-slack-workflow-start-finish@v2
        with:
          channel: '#target-channel'
          result: ${{ job.status }} # final result of job
          webhook-url: https://hooks.slack.com/services/...
```

### Custom message fields

Custom fields can be appended to the resulting Slack message via the `field-list:` input property:

```yaml
jobs:
  main:
    name: Single job
    runs-on: ubuntu-latest
    steps:
      # -- insert job steps here --

      - name: Slack message finish
        if: always()
        uses: magnetikonline/action-slack-workflow-start-finish@v2
        with:
          channel: '#target-channel'
          field-list: |
            Total file size|${{ property.size.value }}KB
            Preview deployed website|<https://hostname.com/preview/...|Click here>
          result: ${{ job.status }}
          webhook-url: https://hooks.slack.com/services/...
```

## Overall workflow status decision tree

The following rules are used to determine the eventual status of a workflow run:

- If all jobs succeed: `success`.
	- **Note:** Skipped jobs are _still_ considered: `success`.
- If one or more jobs cancelled: `cancelled` - _unless..._
- If _any_ job fails, overall workflow: `failure`.

## Example message

![preview](https://user-images.githubusercontent.com/1818757/133388692-fc2383a0-aa03-45d1-aca0-cea0a191d730.png)
