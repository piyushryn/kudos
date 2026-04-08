declare namespace Express {
  export interface Request {
    rawBody?: string;
    auth?: {
      slackUserId: string;
      displayName: string;
    };
  }
}
