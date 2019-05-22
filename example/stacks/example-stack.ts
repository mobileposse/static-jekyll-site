import { App, Stack, StackProps } from '@aws-cdk/cdk'
import { StaticSite } from '../../src/resource/static-site'

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props)

    /**
     * NOTE: S3 requires bucket names to be globally unique across accounts so
     * you will need to change the bucketName to something that nobody else is
     * using.
     */
    new StaticSite(this, 'example-site', {
      foo: 'bar'
    })
  }
}
