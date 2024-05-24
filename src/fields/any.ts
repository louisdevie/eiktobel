import { Field, FieldRoleHints, KeyKind } from '.'
import { isImplicitId, Likelihood } from '@module/inference'
import { ValidationResult, invalid } from '@module/validation'
import { Checks, NoChecks } from './checks'
import { MappedField } from '@module/resources/mappers/base'
import { MappingFactory } from '@module/resources/mappers/factory'

/**
 * Options shared by all fields.
 */
export interface FieldOpts<T> {
  blankValue?: BlankValue<T>
  isReadable?: boolean
  isWritable?: boolean
  useAsKey?: boolean
  isNullable?: boolean
  isOptional?: boolean
  checks?: Checks<T>
}

// we use a union because undefined or null can be valid values.
/** @internal */
type BlankValue<T> = { variant: 'unspecified' } | { variant: 'explicit'; value: T }

export function explicitBlankValue<T>(value: T): BlankValue<T> {
  return { variant: 'explicit', value }
}

/**
 * A base class containing the options shared by all field types.
 * @template T The type of field.
 * @template Self The concrete type of the class extending this.
 */
export abstract class AnyField<T, Self> implements Field<T> {
  private readonly _blankValue: BlankValue<T>
  private readonly _isReadable: boolean
  private readonly _isWritable: boolean
  private readonly _isNullable: boolean
  private readonly _isOptional: boolean
  private readonly _useAsKey: boolean
  private readonly _checks: Checks<T>

  /**
   * Creates a base field descriptor.
   * @param copyFrom Another descriptor to copy options from.
   * @param options Options that will override the descriptor copied.
   * @protected
   */
  protected constructor(copyFrom?: AnyField<T, unknown>, options?: FieldOpts<T>) {
    this._blankValue = options?.blankValue ?? copyFrom?._blankValue ?? { variant: 'unspecified' }
    this._isReadable = options?.isReadable ?? copyFrom?._isReadable ?? true
    this._isWritable = options?.isWritable ?? copyFrom?._isWritable ?? true
    this._isNullable = options?.isNullable ?? copyFrom?._isNullable ?? false
    this._isOptional = options?.isOptional ?? copyFrom?._isOptional ?? false
    this._useAsKey = options?.useAsKey ?? copyFrom?._useAsKey ?? false
    this._checks = options?.checks ?? copyFrom?._checks ?? new NoChecks()
  }

  /**
   * The default "blank" value.
   * @protected
   */
  protected abstract get defaultBlankValue(): T

  /**
   * The checks currently applied.
   * @protected
   */
  protected get currentChecks(): Checks<T> {
    return this._checks
  }

  /**
   * Clones this object and return it as the Self type.
   * @param options Options to pass to the parent constructor.
   * @protected
   */
  protected abstract cloneAsSelf(options: FieldOpts<T>): Self

  //region Field<T> implementation

  public get blankValue(): T {
    return this._blankValue.variant === 'explicit' ? this._blankValue.value : this.defaultBlankValue
  }

  public get isReadable(): boolean {
    return this._isReadable
  }

  public get isWritable(): boolean {
    return this._isWritable
  }

  public get isNullable(): boolean {
    return this._isNullable
  }

  public get isOptional(): boolean {
    return this._isOptional
  }

  public get keyKind(): KeyKind | null {
    return null
  }

  public isKey(hints: FieldRoleHints): Likelihood {
    let likelihood
    if (this._useAsKey) {
      likelihood = Likelihood.explicit()
    } else if (this.keyKind == null) {
      likelihood = Likelihood.implicit(0)
    } else {
      likelihood = isImplicitId(hints)
    }
    return likelihood
  }

  public validate(value: T): ValidationResult {
    let result
    if (this.isOptional || value !== undefined) {
      result = this._checks.validate(value)
    } else {
      result = invalid('Required value missing.')
    }
    return result
  }

  public makeMapping(factory: MappingFactory): MappedField {
    return factory.makeGenericMapping(this)
  }

  //endregion

  //region Builder methods

  /**
   * Change the "blank" value used when creating new objects.
   * @param value The new value to use.
   */
  public withBlankValue(value: T): Self {
    if (this._blankValue.variant !== 'unspecified') console.warn('withBlankValue modifier used twice on the same field')
    return this.cloneAsSelf({ blankValue: explicitBlankValue(value) })
  }

  /**
   * Makes this field read-only (i.e. it will never be sent, only received). This and {@link writeOnly} are mutually
   * exclusive.
   */
  public get readOnly(): Self {
    if (!this._isReadable) console.warn('readOnly modifier used on non-readable field')
    return this.cloneAsSelf({ isWritable: false, isReadable: true })
  }

  /**
   * Makes this field write-only (i.e. it will never be received, only sent). This and {@link readOnly} are mutually
   * exclusive.
   */
  public get writeOnly(): Self {
    if (!this._isWritable) console.warn('writeOnly modifier used on non-writable field')
    return this.cloneAsSelf({ isWritable: true, isReadable: false })
  }

  /**
   * Makes this field the ID of the resource.
   */
  public get asKey(): Self {
    if (this._useAsKey) console.warn('asKey modifier used twice on the same field')
    return this.cloneAsSelf({ useAsKey: true })
  }

  /**
   * Makes this field optional, i.e. it will not be included in the data received/sent when it is undefined. This can be
   * used alongside {@link nullable}.
   */
  public abstract get optional(): AnyField<T | undefined, unknown>

  /**
   * Makes this field nullable and sets the blank value to null. This can be used alongside {@link optional}.
   */
  public abstract get nullable(): AnyField<T | null, unknown>

  //endregion
}
