export interface WorkspaceSettingsData {
  workspaceName: string;
  timezone: string;
  defaultCurrency: string;
}

export interface NotificationSettingsData {
  emailNewRecommendation: boolean;
  emailAgentError: boolean;
  weeklySummaryDigest: boolean;
  slackAlerts: boolean;
}

export const defaultWorkspaceSettings: WorkspaceSettingsData = {
  workspaceName: 'Acme Inc.',
  timezone: 'et',
  defaultCurrency: 'USD',
};

export const defaultNotificationSettings: NotificationSettingsData = {
  emailNewRecommendation: true,
  emailAgentError: true,
  weeklySummaryDigest: false,
  slackAlerts: true,
};
