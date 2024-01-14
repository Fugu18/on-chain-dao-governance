import {APIErrorCode, JsAPI} from '@wingriders/cab/dappConnector'
import {ApiError} from '@wingriders/cab/wallet/connector'

export const getWalletOwner = async (jsApi: JsAPI) => {
  // Eternl doesn't return any used addresses for empty accounts
  const ownerAddress = (await jsApi.getUsedAddresses())?.[0] ?? (await jsApi.getUnusedAddresses())[0]

  if (!ownerAddress) {
    throw new ApiError(APIErrorCode.InternalError, 'No address found for wallet')
  }

  return ownerAddress
}

export const getAllWalletAddresses = async (jsApi: JsAPI) => {
  const addresses = (await jsApi.getUsedAddresses()) ?? []
  // Eternl doesn't return any used addresses for empty accounts
  if (addresses.length === 0) addresses.push(...((await jsApi.getUnusedAddresses()) ?? []))
  return addresses
}
