export type SlackCommandPayload = {
  token?: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: "/kudos" | "/kudos-balance" | "/kudos-leaderboard" | "/kudos-stats";
  text: string;
  response_url: string;
  trigger_id: string;
};
