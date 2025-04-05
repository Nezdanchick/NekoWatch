import React, { forwardRef } from 'react';
import { StyleSheet, TextInput, View, Pressable, TextInputProps } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Colors from '@/constants/colors';

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

    return (
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={20} color={Colors.dark.subtext} style={styles.searchIcon} />
          <TextInput
            ref={ref} // Привязываем ref к TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={Colors.dark.subtext}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            {...props} // Передаем остальные свойства TextInput
          />
          {value.length > 0 && (
            <Pressable onPress={handleClear} style={styles.clearButton}>
              <FontAwesome name="times" size={18} color={Colors.dark.subtext} />
            </Pressable>
          )}
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar;