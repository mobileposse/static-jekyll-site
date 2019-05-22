import { App, Stack, StackProps } from '@aws-cdk/cdk'
import { StaticSite } from '../../../src/resource/static-site'
import { DockerImageAsset } from '@aws-cdk/assets-docker'

const slug = 'static-example'

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    const image = new DockerImageAsset(this, `${slug}-image`, {
      directory: './example/docs',
      repositoryName: slug
    })

    new StaticSite(this, 'example-site', {
      slug: slug,
      tld: 'mobileposse.com',
      subdomain: 'example.mobileposse.com',
      zoneid: 'ZXK70TKQ5GQBE',
      ssl:
        'arn:aws:acm:us-east-1:112309987251:certificate/cd84e259-e8e5-4aca-a6e9-a5b7bb8e8ba0',
      repo: 'static-site',
      branch: 'master',
      image: image
    })
  }
}
