#!/usr/bin/env node
import { App, Tag } from '@aws-cdk/core'
import { ExampleStack } from './stacks/example-stack'

const cdk = new App()
const example = new ExampleStack(cdk, 'static-site-example', {})
example.node.applyAspect(new Tag('example', 'true'))

cdk.synth()
