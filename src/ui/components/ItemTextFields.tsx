import { isTextPrimaryType, type ItemTypeName } from '@/ui/itemTypeConfig';

/** Whether the draft/form has enough text to save for this type. */
export function hasRequiredItemText(
  typeName: ItemTypeName,
  title: string,
  content: string,
): boolean {
  if (isTextPrimaryType(typeName)) {
    return Boolean(content.trim() || title.trim());
  }
  return Boolean(title.trim());
}
