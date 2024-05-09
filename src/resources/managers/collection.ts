import { KeyKind } from '@module/fields'
import type { Key, ResourceDescriptor } from '@module/resources'
import { DescriptorInterpreter, getInterpreterFor } from './interpreters'

export class CollectionManager<T extends object> {
  private readonly _interpreter: DescriptorInterpreter
  private readonly _key: keyof T
  private readonly _keyKind: KeyKind

  public constructor(descriptor: ResourceDescriptor) {
    this._interpreter = getInterpreterFor(descriptor)
    const keyFound = this._interpreter.findKey()
    this._key = keyFound.property as keyof T
    this._keyKind = keyFound.kind
  }

  /**
   * The name of the primary key used to index this resource.
   */
  public get key(): keyof T {
    return this._key
  }

  /**
   * The type to expect for the primary key.
   */
  public get keyKind(): KeyKind {
    return this._keyKind
  }

  /**
   * Checks if an item was just created.
   * @param item The item to check.
   * @returns `true` if the item has never been sent nor saved, `false` otherwise.
   */
  public isNew(item: T): boolean {
    return item[this.key] === null
  }

  /**
   * Gets the value of the {@link key} property.
   * @param item The item to get the key of.
   */
  public getKeyOf(item: T): Key {
    return item[this.key] as Key
  }

  /**
   * Sets the value of the {@link key} property.
   * @param item The item to set the key of.
   * @param key The value to set for the property.
   */
  public setKeyOf(item: T, key: Key): void {
    item[this.key] = key as any
  }

  /**
   * Creates a new instance of an item filled with blank values.
   */
  public createInstance(): T {
    return this._interpreter.createInstance(this._key)
  }

  /**
   * Updates an item or adds it to the collection if it doesn't exist.
   * @param key The key of the item.
   * @param item The item object.
   * @return A unique reference to that item.
   */
  public createOrUpdateOne(key: Key, item: T): T {
    return item // no management
  }

  /**
   * Updates the whole collection. Items that do not appear in the given list will be deleted.
   * @param items All the items in the collection.
   * @return A unique reference to a list of the items.
   */
  public updateAll(items: T[]): T[] {
    return items // no management
  }
}
