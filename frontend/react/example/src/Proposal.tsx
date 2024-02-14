import {
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Grid,
  PaletteColor,
  Stack,
  Theme,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material'

import {
  useTheoreticalMaxVotingPowerQuery,
  useUserVotesQuery,
  useUserVotingDistributionQuery,
  useVotesQuery,
} from '@wingriders/governance-frontend-react-sdk'
import {ProposalDetails, UserVotesResponse, VotesByState} from '@wingriders/governance-sdk'
import {useContext} from 'react'
import {WalletContext} from './ConnectWalletContext'
import {formatBigNumber} from './helpers/formatNumber'
import {VoteVerificationStateIcon} from './components/VoteVerificationStateIcon'
import {ipfsToHttps} from './helpers/ipfs'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import {BigNumber} from '@wingriders/cab/types'
import {getExplorerAddressUrl} from './helpers/explorer'

type ProposalProps = {
  proposal: ProposalDetails
}

export const Proposal = ({proposal}: ProposalProps) => {
  const {ownerStakeKeyHash} = useContext(WalletContext)

  const {data: votesData} = useVotesQuery([{proposalTxHashes: [proposal.txHash]}])
  const proposalVotes = votesData?.[proposal.txHash]
  const choices = [...proposal.acceptChoices, ...proposal.rejectChoices]

  const {data: userVotesData} = useUserVotesQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash, proposalTxHashes: [proposal.txHash]}] : undefined
  )
  const proposalUserVotes = userVotesData?.[proposal.txHash]

  const {data: userVotingDistributionData} = useUserVotingDistributionQuery(
    ownerStakeKeyHash ? [{ownerStakeKeyHash, slot: proposal.poll.snapshot}] : undefined
  )
  const userVotingPower = userVotingDistributionData?.walletTokens.votingPower

  const {data: theoreticalMaxVotingPower} = useTheoreticalMaxVotingPowerQuery([])

  const votingParticipation =
    proposalVotes && theoreticalMaxVotingPower
      ? new BigNumber(proposalVotes.votingPower.VERIFIED).div(theoreticalMaxVotingPower).decimalPlaces(5)
      : undefined

  return (
    <Card sx={({palette}) => ({bgcolor: palette.grey[100]})}>
      <CardContent>
        <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
          {new Date(proposal.poll.start).toLocaleString()} -{' '}
          {new Date(proposal.poll.end).toLocaleString()}
        </Typography>
        <Typography variant="h5" component="div">
          {proposal.name}
        </Typography>
        <Typography variant="body2">{proposal.description}</Typography>

        <ButtonGroup sx={{mt: 2}} size="small">
          <Button
            href={ipfsToHttps(proposal.uri)}
            target="_blank"
            rel="noreferrer"
            endIcon={<OpenInNewIcon />}
          >
            Proposal documentation
          </Button>
          <Button
            href={proposal.communityUri}
            target="_blank"
            rel="noreferrer"
            endIcon={<OpenInNewIcon />}
          >
            Community discussion
          </Button>
        </ButtonGroup>

        <Grid
          container
          mt={2}
          width="100%"
          bgcolor={({palette}) => palette.background.paper}
          p={1.5}
          rowGap={1}
        >
          <Grid item xs={8}>
            <Typography variant="subtitle1" fontWeight="bold">
              Proposal creator:
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Stack alignItems="flex-end">
              <Button
                href={getExplorerAddressUrl(proposal.owner)}
                target="_blank"
                rel="noreferrer"
                variant="text"
                sx={({palette}) => ({
                  p: 0,
                  textTransform: 'none',
                  textDecoration: 'underline',
                  textUnderlineOffset: '0.3em',
                  color: palette.text.primary,
                })}
              >
                <Typography variant="subtitle1" textAlign="end">
                  {proposal.owner.slice(0, 10)}…{proposal.owner.slice(-10)}
                </Typography>
              </Button>
            </Stack>
          </Grid>

          <Grid item xs={8}>
            <Typography variant="subtitle1" fontWeight="bold">
              Your voting power for this proposal:
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" textAlign="end">
              {userVotingPower ? formatBigNumber(userVotingPower) : '-'}
            </Typography>
          </Grid>

          <Grid item xs={8}>
            <Typography variant="subtitle1" fontWeight="bold">
              Voting participation:
            </Typography>
          </Grid>
          <Grid item xs={4}>
            <Typography variant="subtitle1" textAlign="end">
              {votingParticipation ? `${votingParticipation.toString()}%` : '-'}
            </Typography>
          </Grid>
        </Grid>

        <Stack direction="row" alignItems="baseline" mt={2} spacing={4}>
          <Typography variant="body2" flex={3} fontWeight="bold">
            Choice
          </Typography>
          <Typography variant="body2" flex={1} fontWeight="bold" textAlign="end">
            Total verified voting power
          </Typography>
          <Typography variant="body2" flex={1} fontWeight="bold" textAlign="end">
            My voting power
          </Typography>
        </Stack>
        <Stack spacing={1} mt={0.5}>
          {choices.map((choice, index) => (
            <ProposalChoice
              key={index}
              label={choice}
              type={index < proposal.acceptChoices.length ? 'accept' : 'reject'}
              totalVotingPower={proposalVotes?.byChoice.find((a) => a.index === index)?.votingPower}
              userVote={proposalUserVotes?.index === index ? proposalUserVotes : undefined}
            />
          ))}
          <ProposalChoice
            label="Abstain"
            type="abstain"
            totalVotingPower={proposalVotes?.byChoice.find((a) => a.index === -1)?.votingPower}
            userVote={proposalUserVotes?.index === -1 ? proposalUserVotes : undefined}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

type ProposalChoiceProps = {
  label: string
  type: 'accept' | 'reject' | 'abstain'
  totalVotingPower?: VotesByState
  userVote?: Omit<UserVotesResponse[string], 'index'>
}

const ProposalChoice = ({label, type, totalVotingPower, userVote}: ProposalChoiceProps) => {
  const getColor = (fn: (color: PaletteColor) => string) => (theme: Theme) => {
    return fn(
      {
        accept: theme.palette.success,
        reject: theme.palette.error,
        abstain: theme.palette.info,
      }[type]
    )
  }

  const isUserChoice = userVote != null

  return (
    <Stack
      bgcolor={getColor((c) => alpha(c.light, 0.8))}
      p={isUserChoice ? 0.5 : 1}
      px={isUserChoice ? 1.5 : 2}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      border={({palette, spacing}) =>
        isUserChoice ? `${spacing(0.5)} solid ${palette.primary.dark}` : undefined
      }
    >
      <Typography variant="body1" flex={3}>
        {label}
      </Typography>

      <Stack flex={1} alignItems="flex-end">
        <Tooltip
          title={
            totalVotingPower ? (
              <Stack>
                <VoteByStateDisplay state="Verified" value={totalVotingPower.VERIFIED} />
                <VoteByStateDisplay state="Unverified" value={totalVotingPower.UNVERIFIED} />
                <VoteByStateDisplay state="Invalid" value={totalVotingPower.INVALID} />
              </Stack>
            ) : undefined
          }
          sx={{width: 'fit-content'}}
        >
          <Typography variant="body1" px={1} py={0.5}>
            {totalVotingPower ? formatBigNumber(totalVotingPower.VERIFIED) : '-'}
          </Typography>
        </Tooltip>
      </Stack>

      <Typography variant="body1" flex={1} textAlign="end">
        {userVote ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            component="span"
            width="100%"
            justifyContent="flex-end"
          >
            <span>{formatBigNumber(userVote.votingPower)}</span>
            <VoteVerificationStateIcon state={userVote.verificationState} />
          </Stack>
        ) : (
          '-'
        )}
      </Typography>
    </Stack>
  )
}

type VoteByStateDisplayProps = {
  state: string
  value: string
}

const VoteByStateDisplay = ({state, value}: VoteByStateDisplayProps) => {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Typography>{state}</Typography>
      <Typography>{formatBigNumber(value)}</Typography>
    </Stack>
  )
}
