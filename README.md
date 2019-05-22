## What it does

Creates an a static [Jekyll](https://jekyllrb.com/) website running on AWS Fargate. The website is automatically rebuilt and redeployed when changes are pushed to Github courtesy of [AWS Code Pipeline](https://aws.amazon.com/codepipeline/).

## Assumptions

- You are building the site using [Jekyll](https://jekyllrb.com/).
- You are hosting the site on a subdomain
- Website will be public (IP restrictions coming soon!)
- Website can be built using a Docker image that is supplied to the component

## How to use it

This is an [AWS CDK Construct](https://docs.aws.amazon.com/CDK/latest/userguide/constructs.html) which makes it dead simple to use in your CDK code.

Just install with npm:

```
npm add static-jekyll-site
```

And then require the construct and use it in your stack like any standard CDK resource!

```typescript
import { StaticJekyllSite } from 'static-jekyll-site'

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    const image = new DockerImageAsset(this, `${slug}-image`, {
      directory: './example/docs',
      repositoryName: slug
    })

    new StaticJekyllSite(this, 'example-site', {
      slug: slug,
      tld: 'mobileposse.com',
      subdomain: 'example.mobileposse.com',
      zoneid: 'ZXK70TKQ5GQBE',
      ssl: '[certificate-arn]',
      repo: 'static-site',
      branch: 'master',
      image: image
    })
  }
}
```

See the `example` directory for a functional example.

## Requirements

- This is designed to work with AWS CDK but feel free to borrow/moidfy the code to suit your purpose.

## Motivation

We have several internal and external sites that all need to be updated automatically on a continual basis. We also make small changes to the underlying infrastructure and also to keep up with the latest CDK version and it's tedious making these changes in multiple projects/branches. A single CDK component to do everything seemed ideal.

## How it Works

This is actually a relatively simple use of CDK Constructs. There are no custom resources involved, just a single, reusable Construct that can be shared across proejcts.

## Publish to NPM (Official maintainers only)

Add npm user to your local machine (one time setup)

```
npm adduser
```

Push the release (you will be asked the new version)

```
yarn publish
```

Push the tagged source back up to Github

```
git push --tags
```
