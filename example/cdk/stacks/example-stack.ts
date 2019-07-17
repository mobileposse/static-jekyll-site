import { App, Stack, StackProps } from '@aws-cdk/core'
import { StaticJekyllSite } from '../../../src/resource/static-site'
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets'

const slug = 'static-example'

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    const image = new DockerImageAsset(this, `${slug}-image`, {
      directory: './example/docs',
      repositoryName: slug
    })

    new StaticJekyllSite(this, 'example-site', {
      slug: slug,
      tld: 'devsandbox.mobi',
      subdomain: 'example.devsandbox.mobi',
      zoneid: 'ZGWO347RHQLF0',
      ssl:
        'arn:aws:acm:us-east-1:185354281374:certificate/bdec749f-766f-4884-b034-c4bfd5436a5f',
      repo: 'static-jekyll-site',
      branch: 'master',
      image: image,
      secretArn:
        'arn:aws:secretsmanager:us-east-1:185354281374:secret:github-token-schof-e8sy1N',
      secretKey: 'github-token-schof'
    })
  }
}
