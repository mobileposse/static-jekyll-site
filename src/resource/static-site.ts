import { Construct, StackProps } from '@aws-cdk/cdk'
//import path = require('path')

interface StaticProps extends StackProps {
  foo: string
  // bucketName: string
  // removalPolicy?: RemovalPolicy
}

export class StaticSite extends Construct {
  constructor(scope: Construct, id: string, props: StaticProps) {
    super(scope, id)
    props.foo
  }
}
