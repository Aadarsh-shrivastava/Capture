import {Text, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {SelectChip} from '@/ui/components/Primitives';
import {designTokens} from '@/ui/designTokens';

type Option<T extends string> = {label: string; value: T};

type Props<S extends string, F extends string> = {
  visible: boolean;
  onClose: () => void;
  sortOptions: Option<S>[];
  sort: S;
  onSort: (value: S) => void;
  filterOptions: Option<F>[];
  filter: F;
  onFilter: (value: F) => void;
};

function Row<T extends string>({label, options, value, onChange}: {label: string; options: Option<T>[]; value: T; onChange: (v: T) => void}) {
  return (
    <View style={{gap: 10}}>
      <Text style={{color: designTokens.textSecondary, fontSize: 13, fontWeight: '600'}}>{label}</Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {options.map(o => (
          <SelectChip key={o.value} label={o.label} active={o.value === value} onPress={() => onChange(o.value)} />
        ))}
      </View>
    </View>
  );
}

/** Sort + filter in one sheet; changes apply immediately. */
export function ListOptionsSheet<S extends string, F extends string>(props: Props<S, F>) {
  return (
    <Sheet visible={props.visible} onClose={props.onClose} title="Sort & filter">
      <View style={{paddingHorizontal: 20, paddingBottom: 20, gap: 22}}>
        <Row label="Sort by" options={props.sortOptions} value={props.sort} onChange={props.onSort} />
        <Row label="Show" options={props.filterOptions} value={props.filter} onChange={props.onFilter} />
      </View>
    </Sheet>
  );
}
