import * as api from '@wingriders/cab/dappConnector'
import {stakingHashFromAddress} from '@wingriders/cab/ledger/address'
import {BigNumber, HexString, Network, ProtocolParameters, TxPlanArgs} from '@wingriders/cab/types'
import {reverseAddress, reverseUtxo} from '@wingriders/cab/wallet/connector'

import {getWalletOwner} from '../helpers/walletAddress'
import {LibError, LibErrorCode} from '../errors'
import {buildTx} from '../helpers/actions'
import {encodeVote} from '../helpers/encodeMetadatum'
import {GovMetadatumLabel, Vote} from '../types'
import {BuildAction, BuildActionParams, BuildActionResult} from '../actions'

type BuildCastVoteParams = {
  pollTxHash: HexString
  votingPower: BigNumber
  votingUTxOs: api.TxInput[]
  choices: Record<HexString, number>
} & BuildActionParams

export type CastVoteMetadata = {
  transactionFee: api.Coin
  txHash?: api.TxHash
  vote: Vote
  // change UTxO returned back to the user
  utxoRef: api.TxInput
}

type RequiredContext = {
  protocolParameters: ProtocolParameters
  network: Network
}

export const buildCastVote =
  ({protocolParameters, network}: RequiredContext) =>
  (jsApi: api.JsAPI): BuildAction<BuildCastVoteParams, CastVoteMetadata> =>
  async ({
    pollTxHash,
    choices,
    votingPower,
    votingUTxOs,
  }: BuildCastVoteParams): Promise<BuildActionResult<CastVoteMetadata>> => {
    const ownerAddress = reverseAddress(await getWalletOwner(jsApi))
    const stakingHash = stakingHashFromAddress(ownerAddress)

    const apiUtxos = await jsApi.getUtxos()

    // spend the first utxo we get from the wallet
    const firstUtxo = apiUtxos[0]
    if (!firstUtxo) {
      throw new LibError(LibErrorCode.InsufficientAdaForTx, 'No UTxOs found on the wallet')
    }
    const spendUtxo = reverseUtxo(firstUtxo)

    const vote: Vote = {
      pollTxHash,
      choices,
      voterAddress: ownerAddress,
      votingPower: votingPower.toNumber(),
      votingUTxOs,
    }

    const planArgs: TxPlanArgs = {
      planId: 'cast-vote',
      inputs: [{isScript: false, utxo: spendUtxo}],
      outputs: [],
      metadata: {
        // NOTE for now custom metadatum until it gets standardised and moved to cab
        custom: new Map([[GovMetadatumLabel.COMMUNITY_VOTING_VOTE, encodeVote(vote)]]),
      },
      requiredSigners: [stakingHash],
      protocolParameters,
    }

    const {tx, txAux, txWitnessSet} = await buildTx({jsApi, planArgs, network})

    const transactionFee = new BigNumber(txAux.fee) as api.Coin

    const metadata: CastVoteMetadata = {
      transactionFee,
      txHash: undefined,
      vote,
      utxoRef: {
        index: new BigNumber(0) as api.UInt,
        txHash: txAux.getId() as api.TxHash,
      },
    }

    return {
      tx,
      txAux,
      txWitnessSet,
      metadata,
    }
  }