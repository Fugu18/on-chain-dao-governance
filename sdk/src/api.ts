import {Address, Asset, HexString, RegisteredTokenMetadata} from '@wingriders/cab/types'
import {UtxoId} from '@wingriders/governance-sdk'

export type GovernanceVotingParamsResponse = {
  governanceToken: Asset & RegisteredTokenMetadata
  totalMintedGovernanceTokens: number
  proposalCollateralQuantity: number
  proposalsAddress: Address
}

export enum ProposalStatus {
  AVAILABLE = 'AVAILABLE',
  CANCELLED = 'CANCELLED',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
}

export enum VoteVerificationState {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  INVALID = 'INVALID',
}

export type VotesByState = {[k in VoteVerificationState]: string}

export type ChoiceVoteAggregation = {
  index: number
  votingPower: VotesByState
  votingCount: VotesByState
}

export type VoteAggregationByProposalResponse = {
  [proposalTxHash: HexString]: {
    votingPower: VotesByState
    votingCount: VotesByState
    byChoice: ChoiceVoteAggregation[]
  }
}

export type UserVotesResponse = {
  [proposalTxHash: HexString]: {
    index: number
    votingPower: string
    verificationState: VoteVerificationState
  }
}

export type VotesFilter = {
  proposalTxHashes?: HexString[]
}

export type UserVotesFilter = {
  proposalTxHashes?: HexString[]
  ownerStakeKeyHash: HexString
}

export type UserVotingDistributionFilter = {
  ownerStakeKeyHash: HexString
  slot?: number
}

export type UserVotingDistributionResponse = {
  utxoIds: UtxoId[]
  walletTokens: string
  slot: number
}

export type ProposalDetails = {
  txHash: HexString
  owner: Address
  name: string
  description: string
  uri: string
  communityUri: string
  poll: {
    txHash: HexString
    start: number
    end: number
    snapshot: number
    description: string
  }
  slot: number
  status: ProposalStatus
  acceptChoices: string[]
  rejectChoices: string[]
}

export type ProposalResponse = ProposalDetails & {
  choices: {[value: string]: number}
  abstained: number
  total: number
}

export type ProposalsResponse = ProposalDetails[]
