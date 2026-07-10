import type { MarkedExtension } from 'marked'

export type AlertIcon =
  | string
  | false
  | ((context: { type: string, title: string }) => string)

export interface AlertConfig {
  title?: string
  icon?: AlertIcon
}

export interface MarkedGithubAlertsOptions {
  alerts?: Record<string, AlertConfig>
  titles?: Record<string, string>
  icons?: Record<string, AlertIcon>
  iconOptions?: Record<string, string | number>
}

export declare function markedGithubAlerts(options?: MarkedGithubAlertsOptions): MarkedExtension
