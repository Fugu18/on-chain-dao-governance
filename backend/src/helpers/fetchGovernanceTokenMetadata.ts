import {createTokenRegistrySubject, TokenRegistry} from '@wingriders/cab/blockchainExplorer'
import {NetworkName, RegisteredTokenMetadata} from '@wingriders/cab/types'
import {config, governanceToken} from '../config'
import axios from 'axios'

const tokenRegistryUrl = {
  [NetworkName.MAINNET]: 'https://tokens.cardano.org/metadata/query',
  [NetworkName.PREPROD]: 'https://metadata.world.dev.cardano.org/metadata/query',
}[config.NETWORK_NAME]

const httpClient = axios.create({timeout: 180 * 1000})

export const fetchGovernanceTokenMetadata = async (): Promise<RegisteredTokenMetadata> => {
  const subject = createTokenRegistrySubject(governanceToken.policyId, governanceToken.assetName)
  const response = await httpClient.post(`${tokenRegistryUrl}`, JSON.stringify({subjects: [subject]}), {
    headers: {'Content-Type': 'application/json'},
  })
  const parsedMetadata = TokenRegistry.parseTokensMetadata({Right: response.data.subjects})
  return parsedMetadata.get(subject)
}