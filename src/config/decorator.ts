import type { Config, BadResponseHandler } from '.'
import { defaultConfig } from '@module/config/default'

export type ResetValue = 'default'

export type ConfigOverride = { [P in keyof Config]?: Config[P] | ResetValue }

export class DecoratorConfig implements Config {
  private static readonly resetValue: ResetValue = 'default'

  private readonly _wrapped: Config
  private readonly _overrides: ConfigOverride

  public constructor(wrapped: Config, overrides: ConfigOverride) {
    this._wrapped = wrapped
    this._overrides = overrides
  }

  public get badResponseHandler(): BadResponseHandler {
    return this.overrideConfigProperty('badResponseHandler')
  }

  private overrideConfigProperty<P extends keyof Config>(p: P): Config[P] {
    let finalValue: Config[P] = this._wrapped[p]

    const option: Config[P] | ResetValue | undefined = this._overrides[p]
    if (option === DecoratorConfig.resetValue) {
      finalValue = defaultConfig[p]
    } else if (option !== undefined) {
      finalValue = option
    }

    return finalValue
  }
}
