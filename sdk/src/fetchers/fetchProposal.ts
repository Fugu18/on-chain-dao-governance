import {request} from '@wingriders/cab/helpers'
import {HexString} from '@wingriders/cab/types'

import {ProposalResponse} from '../types'

type RequiredContext = {
  governanceUrl: string
}

export const fetchProposal =
  (context: RequiredContext) =>
  (txHash: HexString): Promise<ProposalResponse> =>
    request(`${context.governanceUrl}/proposal`, 'POST', JSON.stringify({txHash}), {
      'Content-Type': 'application/json',
    })
