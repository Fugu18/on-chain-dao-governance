import {FastifyInstance} from 'fastify'

import {HexString} from '@wingriders/cab/types'
import {
  UserVotesFilter,
  UserVotesResponse,
  UserVotingDistributionFilter,
  UserVotingDistributionResponse,
  VoteAggregationByProposalResponse,
  VotesFilter,
} from '@wingriders/governance-sdk'

import {votesDistribution} from '../config'
import {getActiveProposalsCount, getUserVotableProposalsCount} from './routes/activeProposalsCount'
import {evaluateTxFromCbor} from './routes/evaluateTxFromCbor'
import {getProposal} from './routes/getProposal'
import {getProposals} from './routes/getProposals'
import {getVotingParams} from './routes/getVotingParams'
import {getHealthStatus} from './routes/healthcheck'
import {getUserVotes, getVotes} from './routes/votes'

export function registerRoutes(server: FastifyInstance) {
  server.get('/healthcheck', async (request, reply) => {
    const instanceHealth = await getHealthStatus()
    if (instanceHealth?.healthy) {
      return reply.send(instanceHealth)
    } else {
      return reply.code(503).send(instanceHealth)
    }
  })

  server.get('/healthStatus', getHealthStatus)

  server.get('/params', getVotingParams)

  server.get('/proposals', getProposals)

  server.post<{Body: {txHash: HexString}}>(
    '/proposal',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            txHash: {type: 'string'},
          },
        },
      },
    },
    (request, _reply) => getProposal(request.body)
  )

  server.get('/activeProposalsCount', getActiveProposalsCount)

  // number of active proposals that don't have a vote from the given stake key
  server.post<{Body: {ownerStakeKeyHash: HexString}}>(
    '/userVotableProposalsCount',

    (request, _reply) => getUserVotableProposalsCount(request.body)
  )

  server.post<{Body: VotesFilter; Reply: VoteAggregationByProposalResponse}>(
    '/votes',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            proposalTxHashes: {type: 'array', items: {type: 'string'}},
          },
        },
      },
    },
    (request, _reply) => getVotes(request.body)
  )

  server.post<{Body: UserVotesFilter; Reply: UserVotesResponse}>(
    '/userVotes',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            proposalTxHashes: {type: 'array', items: {type: 'string'}},
            ownerStakeKeyHash: {type: 'string'},
          },
          required: ['ownerStakeKeyHash'],
        },
      },
    },
    (request, _) => getUserVotes(request.body)
  )

  server.post<{Body: UserVotingDistributionFilter; Reply: UserVotingDistributionResponse}>(
    '/userVotingDistribution',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            slot: {type: 'number'},
            ownerStakeKeyHash: {type: 'string'},
          },
          required: ['ownerStakeKeyHash'],
        },
      },
    },
    (request, _reply) => votesDistribution.getUserVotingDistribution(request.body)
  )

  server.get('/theoreticalMaxVotingPower', votesDistribution.getTheoreticalMaxVotingPower)

  server.post<{Body: string}>(
    '/evaluateTx',
    {
      schema: {
        body: {
          type: 'string',
        },
      },
    },
    (request, _) => evaluateTxFromCbor(request.body)
  )
}
