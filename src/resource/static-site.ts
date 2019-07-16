import { Construct, StackProps } from '@aws-cdk/core'
import { HostedZone } from '@aws-cdk/aws-route53'
import { Certificate } from '@aws-cdk/aws-certificatemanager'
import { AutoDeleteBucket } from 'auto-delete-bucket'
import { Artifact, Pipeline } from '@aws-cdk/aws-codepipeline'
import {
  GitHubSourceAction,
  CodeBuildAction,
  EcsDeployAction,
  GitHubTrigger
} from '@aws-cdk/aws-codepipeline-actions'
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject
} from '@aws-cdk/aws-codebuild'
import { Secret } from '@aws-cdk/aws-secretsmanager'
import { Vpc } from '@aws-cdk/aws-ec2'
import { Cluster, ContainerImage } from '@aws-cdk/aws-ecs'
import { LoadBalancedFargateService } from '@aws-cdk/aws-ecs-patterns'
import { PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam'
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets'

export interface StaticJekyllSiteProps extends StackProps {
  slug: string
  tld: string
  subdomain: string
  zoneid: string
  ssl: string
  repo: string
  branch: string
  image: DockerImageAsset
  secretArn: string
  secretKey: string
}

export class StaticJekyllSite extends Construct {
  constructor(scope: Construct, id: string, props: StaticJekyllSiteProps) {
    super(scope, id)

    const slug = props.slug
    // const subdomain = props.subdomain
    const image = props.image

    const vpc = new Vpc(this, `${slug}-vpc`, {
      maxAZs: 2 // Default is all AZs in region
    })

    const cluster = new Cluster(this, `${slug}-cluster`, {
      vpc: vpc
    })

    const certificate = Certificate.fromCertificateArn(
      this,
      `${slug}-certificate`,
      props.ssl
    )

    const zone = HostedZone.fromHostedZoneAttributes(this, 'Zone', {
      zoneName: props.tld,
      hostedZoneId: props.zoneid
    })

    const fargate = new LoadBalancedFargateService(this, `${slug}-service`, {
      certificate: certificate,
      cluster: cluster,
      cpu: 256,
      desiredCount: 1,
      image: ContainerImage.fromEcrRepository(image.repository),
      memoryLimitMiB: 512,
      publicLoadBalancer: true,
      domainName: props.subdomain,
      domainZone: zone
    })

    const sourceOutput = new Artifact('SourceOutput')
    const oauthSecret = Secret.fromSecretAttributes(this, 'github-token', {
      secretArn: props.secretArn
    }).secretValueFromJson(props.secretKey)

    const sourceAction = new GitHubSourceAction({
      actionName: 'GitHub_Source',
      owner: 'mobileposse',
      repo: props.repo,
      branch: props.branch,
      trigger: GitHubTrigger.WEBHOOK,
      oauthToken: oauthSecret,
      output: sourceOutput
    })

    const project = new PipelineProject(this, `${slug}-project`, {
      environment: {
        buildImage: LinuxBuildImage.UBUNTU_14_04_NODEJS_10_14_1,
        privileged: true,
        environmentVariables: {
          REPOSITORY_URI: {
            value: image.repository.repositoryUri
          }
        }
      },
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging into AWS ECR ...',
              '$(aws ecr get-login --no-include-email --region $AWS_DEFAULT_REGION)',
              'SHA=${CODEBUILD_RESOLVED_SOURCE_VERSION}'
            ]
          },
          build: {
            commands: [
              'echo Building docker image ...',
              'docker build docs/. -t $REPOSITORY_URI:latest',
              'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$SHA'
            ]
          },
          post_build: {
            commands: [
              'echo Pushing docker image to ECR ...',
              'docker push $REPOSITORY_URI:$SHA',
              'docker push $REPOSITORY_URI:latest',
              'printf \'[{"name":"web","imageUri":"%s"}]\' $REPOSITORY_URI:latest > imagedefinitions.json'
            ]
          }
        },
        artifacts: {
          files: 'imagedefinitions.json'
        }
      })
    })

    // needed for docker push
    image.repository.grantPullPush(project)

    const buildOutput = new Artifact('BuildOutput')
    const buildAction = new CodeBuildAction({
      actionName: 'CodeBuild',
      project,
      input: sourceOutput,
      outputs: [buildOutput]
    })

    const deployAction = new EcsDeployAction({
      actionName: 'ECSAction',
      service: fargate.service,
      input: buildOutput
    })

    const role = new Role(this, `${slug}-role`, {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com')
    })

    const statement = new PolicyStatement({
      actions: ['cloudformation:GetTemplate']
    })
    statement.addAllResources()
    role.addToPolicy(statement)

    const pipelineBucket = new AutoDeleteBucket(this, `${slug}-pipeline-bucket`)

    new Pipeline(this, `${slug}-pipeline`, {
      artifactBucket: pipelineBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction]
        },
        {
          stageName: 'Build',
          actions: [buildAction]
        },
        {
          stageName: 'Deploy',
          actions: [deployAction]
        }
      ]
    })
  }
}
