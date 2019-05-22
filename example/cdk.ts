#!/usr/bin/env node
import { App, Tag } from '@aws-cdk/cdk'
import { ExampleStack } from './stacks/example-stack'

const cdk = new App()
const example = new ExampleStack(cdk, 'static-site-example', {})
example.node.apply(new Tag('example', 'true'))

cdk.run()
