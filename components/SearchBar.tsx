import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View, TextInputProps } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import Focusable from '@/components/Focusable';

interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

const SearchBar = forwardRef<TextInput, SearchBarProps>(
  ({ value, onChangeText, onSubmit, placeholder = 'Поиск аниме...', ...props }, ref) => {
    const handleClear = () => {
      onChangeText('');
    };
    const { colors } = useThemeStore();

    return (
      <View style={styles.container}>
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant }]}>
          <FontAwesome name="search" size={20} color={colors.outline} style={styles.searchIcon} />
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.subtext}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            {...props}
          />
          {value.length > 0 && (
            <Focusable onPress={handleClear} style={styles.clearButton} focusScale={1.2}>
              <FontAwesome name="times" size={18} color={colors.subtext} />
            </Focusable>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 28,
    paddingHorizontal: 16,
    height: 56,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar;